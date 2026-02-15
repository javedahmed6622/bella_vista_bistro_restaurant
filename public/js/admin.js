// Admin dashboard script
let token = localStorage.getItem('token');
const $ = id => document.getElementById(id);

function showView(name){
  document.querySelectorAll('.admin-view').forEach(v=>v.classList.add('hidden'));
  document.querySelectorAll('.admin-nav button').forEach(b=>b.classList.remove('active'));
  document.querySelector(`.admin-nav button[data-view="${name}"]`)?.classList.add('active');
  const view = $(`view-${name}`);
  if(view) view.classList.remove('hidden');
}

function requireAuth(cb){
  token = localStorage.getItem('token');
  if(!token){
    const email = prompt('Admin email');
    const password = prompt('Admin password');
    if(!email || !password) return alert('Login required');
    fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})})
      .then(r=>r.json()).then(data=>{
        if(data.token){localStorage.setItem('token',data.token);token=data.token;cb();}else alert('Login failed');
      }).catch(e=>alert('Login error'));
  } else cb();
}

// Sidebar
document.querySelectorAll('.admin-nav button').forEach(b=>b.addEventListener('click',()=>{
  const v = b.dataset.view;
  showView(v);
  if(v==='overview') loadOverview();
  if(v==='menu') loadMenu();
  if(v==='orders') loadOrders();
  if(v==='reservations') loadReservations();
  if(v==='messages') loadMessages();
  if(v==='users') loadUsers();
}));

// Logout
$('logout-btn')?.addEventListener('click', ()=>{localStorage.removeItem('token');location.reload();});

// Polling notifications
function pollNotifications(){
  requireAuth(()=>{
    fetch('/api/orders',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json()).then(data=>{
      const count = data.filter(o=>o.status==='Pending').length;
      const badge = $('notify-count');
      if(count>0){badge.textContent = count;badge.classList.remove('hidden')} else badge.classList.add('hidden');
    }).catch(()=>{});
  });
}
setInterval(pollNotifications,10000);
pollNotifications();

// Overview
function loadOverview(){
  requireAuth(()=>{
    fetch('/api/orders',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json()).then(orders=>{
      $('total-orders').textContent = orders.length;
      const revenue = orders.reduce((s,o)=>s+(o.total||0),0);
      $('total-revenue').textContent = '$'+revenue.toFixed(2);
    }).catch(()=>{});
    fetch('/api/reservations',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json()).then(res=>{$('total-res').textContent = res.length}).catch(()=>{});
    // Chart
    const ctx = document.getElementById('sales-chart');
    if(ctx && typeof Chart !== 'undefined'){
      fetch('/api/orders',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json()).then(orders=>{
        const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const data = labels.map(()=>Math.floor(Math.random()*100)+50);
        if(window.salesChart) window.salesChart.destroy();
        window.salesChart = new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'Sales',data,backgroundColor:'rgba(197,157,95,0.12)',borderColor:'#c59d5f',tension:0.3}]},options:{responsive:true}});
      }).catch(()=>{});
    }
  });
}

// Menu management
let currentEditId = null;
function loadMenu(){
  requireAuth(()=>{
    fetch('/api/menu',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json()).then(data=>{
      const list = $('menu-list');list.innerHTML='';
      data.forEach(it=>{
        const card = document.createElement('div');card.className='card';
        card.innerHTML = `<h4>${it.name} <span class="muted">$${(it.price||0).toFixed(2)}</span></h4><p>${it.description||''}</p><div><button data-id="${it._id}" class="edit">Edit</button> <button data-id="${it._id}" class="del">Delete</button></div>`;
        list.appendChild(card);
      });
      // Attach events
      list.querySelectorAll('.del').forEach(b=>b.addEventListener('click',e=>{
        const id=e.target.dataset.id; if(!confirm('Delete this item?')) return;
        fetch('/api/menu/'+id,{method:'DELETE',headers:{'Authorization':'Bearer '+token}}).then(()=>loadMenu());
      }));
      list.querySelectorAll('.edit').forEach(b=>b.addEventListener('click',async e=>{
        const id=e.target.dataset.id; currentEditId = id;
        // fetch item details
        const res = await fetch('/api/menu',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json());
        const item = res.find(x=>x._id===id);
        if(!item) return alert('Item not found');
        $('edit-name').value = item.name||'';
        $('edit-desc').value = item.description||'';
        $('edit-price').value = item.price||0;
        $('edit-category').value = item.category||'';
        $('edit-image').value = item.image||'';
        $('edit-modal').classList.remove('hidden');
      }));
    }).catch(err=>console.error(err));
  });
}

// Add menu item
$('menu-form')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  requireAuth(()=>{
    const item={name:$('item-name').value,description:$('item-desc').value,price:parseFloat($('item-price').value)||0,category:$('item-category').value||'Main',image:$('item-image').value||''};
    fetch('/api/menu',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(item)}).then(()=>{alert('Item added');$('menu-form').reset();loadMenu();});
  });
});

// Edit modal handlers
$('edit-cancel')?.addEventListener('click',()=>{$('edit-modal').classList.add('hidden');currentEditId=null});
$('edit-form')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  if(!currentEditId) return;
  requireAuth(()=>{
    const body={name:$('edit-name').value,description:$('edit-desc').value,price:parseFloat($('edit-price').value)||0,category:$('edit-category').value||'Main',image:$('edit-image').value||''};
    fetch('/api/menu/'+currentEditId,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body)}).then(()=>{$('edit-modal').classList.add('hidden');currentEditId=null;loadMenu();});
  });
});

// Orders
function loadOrders(){
  requireAuth(()=>{
    fetch('/api/orders',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json()).then(data=>{
      const el = $('orders-list');el.innerHTML='';
      data.forEach(o=>{
        const d = document.createElement('div');d.className='card';d.innerHTML=`<p><strong>${o.customerName}</strong> (${o.email}) - $${(o.total||0).toFixed(2)} - <select data-id="${o._id}" class="status"><option${o.status==='Pending'? ' selected':''}>Pending</option><option${o.status==='Preparing'?' selected':''}>Preparing</option><option${o.status==='Delivered'?' selected':''}>Delivered</option></select></p><ul>${(o.items||[]).map(i=>`<li>${i.name} x${i.quantity}</li>`).join('')}</ul>`;
        el.appendChild(d);
      });
      el.querySelectorAll('.status').forEach(s=>s.addEventListener('change',e=>{
        const id=e.target.dataset.id;const status=e.target.value;fetch('/api/orders/'+id,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({status})}).then(()=>loadOrders());
      }));
    }).catch(()=>{});
  });
}

// Reservations
function loadReservations(){
  requireAuth(()=>{
    fetch('/api/reservations',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json()).then(data=>{
      const el=$('reservations-list');el.innerHTML='';
      data.forEach(r=>{const d=document.createElement('div');d.className='card';d.innerHTML=`<p><strong>${r.name}</strong> ${r.date} ${r.time} - ${r.guests} guests - <select data-id="${r._id}" class="res-status"><option${r.status==='Pending'? ' selected':''}>Pending</option><option${r.status==='Confirmed'?' selected':''}>Confirmed</option><option${r.status==='Cancelled'?' selected':''}>Cancelled</option></select></p>`;el.appendChild(d)});
      el.querySelectorAll('.res-status').forEach(s=>s.addEventListener('change',e=>{const id=e.target.dataset.id;fetch('/api/reservations/'+id,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({status:e.target.value})}).then(()=>loadReservations());}));
    }).catch(()=>{});
  });
}

// Messages
function loadMessages(){
  requireAuth(()=>{
    fetch('/api/messages',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json()).then(data=>{
      const el=$('messages-list');el.innerHTML='';
      data.forEach(m=>{const d=document.createElement('div');d.className='card';d.innerHTML=`<p><strong>${m.name}</strong> (${m.email}) - ${new Date(m.createdAt).toLocaleString()}</p><p>${m.message}</p>`;el.appendChild(d)});
    }).catch(()=>{$('messages-list').innerHTML='<div class="muted">No messages</div>';});
  });
}

function loadUsers(){
  $('users-list').innerHTML='<div class="muted">User management not configured</div>';
}

// Init
showView('overview');loadOverview();
