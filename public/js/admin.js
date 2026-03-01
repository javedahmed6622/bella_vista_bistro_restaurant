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
    showLoginModal(cb);
  } else cb();
}

// Login modal logic
function showLoginModal(cb) {
  const modal = document.getElementById('login-modal');
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  const form = document.getElementById('login-form');
  form.onsubmit = function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if(!email || !password){ window.ui?.toast('error','<i class="fa fa-exclamation-circle"></i> Login required'); return; }
    fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})})
      .then(r=>r.json()).then(data=>{
        if(data.token){
          localStorage.setItem('token',data.token);
          token = data.token;
          modal.classList.add('hidden');
          modal.style.display = 'none';
          cb();
        }else window.ui?.toast('error','<i class="fa fa-times-circle"></i> Login failed');
      }).catch(e=>window.ui?.toast('error','<i class="fa fa-exclamation-circle"></i> Login error'));
  };
  document.getElementById('login-cancel').onclick = function() {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  };
}

// Sidebar
document.querySelectorAll('.admin-nav button').forEach(b=>b.addEventListener('click',()=>{
  const v = b.dataset.view;
  showView(v);
  switch(v){
    case 'overview': loadOverview(); break;
    case 'menu': loadMenu(); break;
    case 'orders': loadOrders(); break;
    case 'messages': loadMessages(); break;
    case 'settings': loadSettings(); break;
    case 'admins': loadUsers(); break;
    default: break;
  }
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

// Menu management (modernized)
let currentEditId = null;
function loadMenu(){
  requireAuth(()=>{
    fetch('/api/menu',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json()).then(data=>{
      const list = $('menu-list');
      list.innerHTML = '';
      if (!data || !data.length) {
        list.innerHTML = '<div class="muted" style="padding:2rem;text-align:center;font-size:1.2rem;">No menu items found.</div>';
        return;
      }
      data.forEach(it=>{
        const card = document.createElement('div');
        card.className = 'menu-card card';
        card.innerHTML = `
          <div style="height:220px;background:#eee;border-radius:8px 8px 0 0;overflow:hidden;display:flex;align-items:center;justify-content:center">
            <img src="${it.image||'/uploads/placeholder.png'}" alt="${it.name}" style="max-width:100%;max-height:100%;object-fit:cover" />
          </div>
          <div style="padding:0.9rem">
            <h3>${it.name}</h3>
            <div style="color:var(--primary);font-weight:700">₹${(it.price||0).toFixed(2)}</div>
            <div class="muted" style="margin-top:0.4rem">${it.category||'Other'}</div>
            <div style="margin-top:0.6rem">${(it.description||'').replace(/<[^>]*>?/gm,'').slice(0,160)}${(it.description||'').length>160? '...':''}</div>
            <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
              <button data-id="${it._id}" class="btn edit small">Edit</button>
              <button data-id="${it._id}" class="btn ghost small del">Delete</button>
            </div>
          </div>
        `;
        list.appendChild(card);
      });
      // Attach events
      list.querySelectorAll('.del').forEach(b=>b.addEventListener('click',e=>{
        const id = e.target.dataset.id;
        showConfirmModal('Delete this item?', () => {
          fetch('/api/menu/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } })
            .then(() => {
              window.ui?.toast('error', 'Item deleted <span class="undo-link">Undo</span>');
              loadMenu();
            });
        });
      }));
      list.querySelectorAll('.edit').forEach(b=>b.addEventListener('click',async e=>{
        const id=e.target.dataset.id; currentEditId = id;
        const res = await fetch('/api/menu',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json());
        const item = res.find(x=>x._id===id);
        if(!item){ window.ui?.toast('error','Item not found'); return; }
        $('item-modal-title').textContent = 'Edit Food Item';
        $('item-category-select').value = item.category||'Other';
        $('item-name-input').value = item.name||'';
        if(window.itemQuill) window.itemQuill.root.innerHTML = item.description||'';
        $('item-price-input').value = item.price||0;
        $('item-offer-input').value = item.offerPrice||'';
        $('item-image-url').value = item.image||'';
        $('item-modal').classList.remove('hidden');
      }));
    }).catch(err=>{
      const list = $('menu-list');
      list.innerHTML = '<div class="muted" style="padding:2rem;text-align:center;font-size:1.2rem;">Failed to load menu items.</div>';
      console.error(err);
    });
  });
}

// Open add item modal
document.getElementById('open-add-item')?.addEventListener('click', ()=>{
  currentEditId = null;
  $('item-modal-title').textContent = 'Add Food Item';
  $('item-form').reset();
  if(window.itemQuill) window.itemQuill.root.innerHTML = '';
  $('item-modal').classList.remove('hidden');
});
document.getElementById('item-cancel')?.addEventListener('click', ()=>{$('item-modal').classList.add('hidden');});

// initialize Quill editor for item description (if Quill loaded)
function initItemEditor(){
  if(document.getElementById('item-desc-editor') && typeof Quill !== 'undefined'){
    window.itemQuill = window.itemQuill || new Quill('#item-desc-editor', { theme: 'snow' });
  }
}
initItemEditor();

// item form submit
$('item-form')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  requireAuth(async ()=>{
    const name = $('item-name-input').value.trim();
    const category = $('item-category-select').value;
    const price = parseFloat($('item-price-input').value) || 0;
    const offer = $('item-offer-input').value ? parseFloat($('item-offer-input').value) : null;
    const desc = window.itemQuill ? window.itemQuill.root.innerHTML : '';
    let image = $('item-image-url').value.trim();
    const file = $('item-image-file').files[0];
    if(!name || price<=0){ window.ui?.toast('error','Please provide name and valid price'); return; }
    // upload file if provided
    if(!image && file){
      const fd = new FormData(); fd.append('file', file);
      try{const up = await fetch('/api/uploads',{method:'POST',body:fd}); const j = await up.json(); image = j.url;}catch(err){console.error(err);window.ui?.toast('error','Image upload failed');}
    }
    const body = { name, description: desc, price, offerPrice: offer, category, image };
    // create or update
    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId ? '/api/menu/'+currentEditId : '/api/menu';
    fetch(url,{method,headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body)})
      .then(r=>r.json()).then(()=>{window.ui?.toast('success','Item saved');$('item-modal').classList.add('hidden');currentEditId=null;loadMenu();}).catch(err=>{console.error(err);window.ui?.toast('error','Save failed')});
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
  requireAuth(()=>{
    fetch('/api/admins',{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json()).then(data=>{
      window._adminList = data;
      renderAdminList(data);
    }).catch(()=>{$('users-list').innerHTML='<div class="muted">Unable to load admins</div>'});
  });
}

function renderAdminList(list){
  const query = ( $('admin-search-input')?.value || '').toLowerCase();
  const out = list.filter(u=> (u.name||'').toLowerCase().includes(query) || (u.email||'').toLowerCase().includes(query));
  const listEl = $('users-list'); listEl.innerHTML='';
  out.forEach(u=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<div style="display:flex;gap:0.75rem;align-items:center"><img src="${u.avatar||'https://via.placeholder.com/56'}" style="width:56px;height:56px;border-radius:8px;object-fit:cover"/><div><h3 style="margin:0">${u.name}</h3><div class="muted">${u.email}</div></div></div><p style="margin-top:0.6rem">Role: <span class="badge">${u.role}</span></p><div style="display:flex;gap:0.5rem;margin-top:0.5rem"><button data-id="${u._id}" class="btn edit small">Edit</button><button data-id="${u._id}" class="btn ghost small del">Delete</button></div>`;
    listEl.appendChild(card);
  });
  listEl.querySelectorAll('.del').forEach(b=>b.addEventListener('click', e=>{
    const id = e.target.dataset.id;
    showConfirmModal('Delete this admin?', () => {
      fetch('/api/admins/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } })
        .then(() => {
          window.ui?.toast('error', 'Admin deleted <span class="undo-link">Undo</span>');
          loadUsers();
          // Optionally implement undo logic here
        });
    });
  }));
  // Confirmation modal logic
  function showConfirmModal(message, onConfirm) {
    let modal = document.getElementById('confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirm-modal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content card" style="max-width:400px;width:100%">
          <h3>Confirm Action</h3>
          <div class="modal-msg">${message}</div>
          <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem">
            <button id="confirm-cancel" class="btn">Cancel</button>
            <button id="confirm-ok" class="btn primary">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      modal.querySelector('.modal-msg').innerHTML = message;
      modal.classList.remove('hidden');
    }
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.querySelector('#confirm-cancel').onclick = () => {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    };
    modal.querySelector('#confirm-ok').onclick = () => {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      onConfirm();
    };
  }
  listEl.querySelectorAll('.edit').forEach(b=>b.addEventListener('click', async e=>{
    const id=e.target.dataset.id; $('admin-modal').classList.remove('hidden');
    $('admin-modal-title').textContent = 'Edit Admin';
    const u = await fetch('/api/admins/'+id,{headers:{'Authorization':'Bearer '+token}}).then(r=>r.json());
    $('admin-name').value = u.name||''; $('admin-email').value = u.email||''; $('admin-role').value = u.role||'admin'; $('admin-avatar').value = u.avatar||'';
    $('admin-form').dataset.editId = id;
  }));
}

document.getElementById('admin-search-input')?.addEventListener('input', ()=>{ if(window._adminList) renderAdminList(window._adminList); });

// Admin modal handlers
document.getElementById('open-add-admin')?.addEventListener('click', ()=>{
  $('admin-form').reset(); delete $('admin-form').dataset.editId; $('admin-modal-title').textContent='Add Admin'; $('admin-modal').classList.remove('hidden');
});
document.getElementById('admin-cancel')?.addEventListener('click', ()=>{$('admin-modal').classList.add('hidden');});
$('admin-form')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  requireAuth(async ()=>{
    const body = { name:$('admin-name').value, email:$('admin-email').value, password:$('admin-password').value, role:$('admin-role').value, avatar:$('admin-avatar').value };
    // handle avatar file upload if provided
    const avFile = $('admin-avatar-file')?.files?.[0];
    if(avFile && !body.avatar){
      const fd = new FormData(); fd.append('file', avFile);
      try{ const up = await fetch('/api/uploads',{method:'POST',body:fd}); const j = await up.json(); if(j.url) body.avatar = j.url; }catch(err){console.error(err); window.ui?.toast('error','Avatar upload failed'); }
    const editId = $('admin-form').dataset.editId;
    const url = editId ? '/api/admins/'+editId : '/api/admins';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url,{method,headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body)});
    if(res.ok){window.ui?.toast('success',editId? 'Admin updated':'Admin created');$('admin-modal').classList.add('hidden');loadUsers();}else{const j=await res.json();window.ui?.toast('error',j.message||'Error');}
  }});
});

// Settings
function loadSettings(){
  requireAuth(()=>{
    fetch('/api/settings').then(r=>r.json()).then(s=>{
      $('setting-name').value = s.name||'';
      $('setting-desc').value = s.description||'';
      $('setting-address').value = s.address||'';
      $('setting-phone').value = s.phone||'';
      $('setting-email').value = s.email||'';
      $('setting-hours').value = s.hours||'';
      $('setting-about').value = s.about||'';
      $('setting-enable-res').checked = !!s.enableReservations;
      $('setting-show-test').checked = !!s.showTestimonials;
      $('setting-seo-title').value = s.seoTitle||'';
      $('setting-seo-desc').value = s.seoDescription||'';
    }).catch(()=>{});
  });
}

// Settings save
$('settings-form')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  requireAuth(()=>{
    const body={
      name:$('setting-name').value,
      description:$('setting-desc').value,
      address:$('setting-address').value,
      phone:$('setting-phone').value,
      email:$('setting-email').value,
      hours:$('setting-hours').value,
      about:$('setting-about').value,
      enableReservations: !!$('setting-enable-res').checked,
      showTestimonials: !!$('setting-show-test').checked,
      seoTitle: $('setting-seo-title').value,
      seoDescription: $('setting-seo-desc').value
    };
    const btn = $('settings-save'); btn.disabled = true; btn.textContent = 'Saving...';
    fetch('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body)})
      .then(r=>r.json()).then(()=>{btn.disabled=false; btn.textContent='Save Settings'; window.ui?.toast('success','Settings saved');}).catch(err=>{btn.disabled=false; btn.textContent='Save Settings'; window.ui?.toast('error','Save failed')});
  });
});

// Init
showView('overview');loadOverview();
