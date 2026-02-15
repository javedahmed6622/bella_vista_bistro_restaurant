document.addEventListener('DOMContentLoaded', () => {
  // Simple utility
  const $ = id => document.getElementById(id);

  // App state - cart
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  function saveCart(){
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
  }

  function renderCart(){
    const el = $('cart-items');
    const empty = $('cart-empty');
    const totalEl = $('cart-total');
    if(!el) return;
    el.innerHTML = '';
    if(cart.length === 0){
      empty.style.display = 'block';
      totalEl.textContent = '0.00';
      $('checkout-btn').disabled = true;
      return;
    }
    empty.style.display = 'none';
    let total = 0;
    cart.forEach((it, i) => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `<div>${it.name} x${it.qty}</div><div>$${(it.price*it.qty).toFixed(2)} <button data-i="${i}" class="remove">✕</button></div>`;
      el.appendChild(div);
    });
    cart.forEach(it => total += it.price * it.qty);
    totalEl.textContent = total.toFixed(2);
    $('checkout-btn').disabled = false;
    el.querySelectorAll('.remove').forEach(btn => btn.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.i,10);
      cart.splice(idx,1);
      saveCart();
    }));
  }

  // Load menu and render cards with category filters
  fetch('/api/menu')
    .then(res => res.json())
    .then(data => {
      const menuDiv = $('menu-items');
      const filters = $('menu-filters');
      const cats = Array.from(new Set(data.map(d => d.category || 'Main')));
      filters.innerHTML = `<button data-cat="all" class="active">All</button>` + cats.map(c=>`<button data-cat="${c}">${c}</button>`).join('');
      function render(filter){
        menuDiv.innerHTML = '';
        data.filter(i => filter==='all' || (i.category||'Main')===filter).forEach(item => {
          const card = document.createElement('div');
          card.className = 'card menu-card';
          card.innerHTML = `
            <img src="${item.image || 'https://via.placeholder.com/400x300'}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p class="muted">${item.description || ''}</p>
            <div class="meta"><div class="price">$${item.price?.toFixed(2)||'0.00'}</div><div class="actions"><button class="btn add">Add</button></div></div>
          `;
          menuDiv.appendChild(card);
          card.querySelector('.add').addEventListener('click', ()=>{
            const ex = cart.find(c=>c.id===item._id);
            if(ex) ex.qty++;
            else cart.push({id:item._id,name:item.name,price:item.price||0,qty:1});
            saveCart();
          });
        });
      }
      render('all');
      filters.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
        filters.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        render(b.dataset.cat);
      }));
    })
    .catch(err => console.error('Error loading menu:', err));

  renderCart();

  // Checkout (creates an order with cart items)
  $('checkout-btn')?.addEventListener('click', ()=>{
    if(cart.length===0) return alert('Cart is empty');
    const name = prompt('Enter your name for order');
    const email = prompt('Enter your email');
    const order = { customerName: name||'Guest', email: email||'', items: cart.map(c=>({name:c.name,quantity:c.qty})), total: cart.reduce((s,i)=>s+i.price*i.qty,0) };
    fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)})
      .then(()=>{cart=[];saveCart();alert('Order placed successfully!')})
      .catch(e=>alert('Error placing order: '+e.message));
  });

  // Reservation form submission
  $('reservation-form')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const reservation = {
      name: $('res-name').value,
      email: $('res-email').value,
      date: $('res-date').value,
      time: $('res-time').value,
      guests: parseInt($('res-guests').value,10)
    };
    fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(reservation)})
      .then(()=>{alert('Reservation made successfully!');$('reservation-form').reset();})
      .catch(err=>alert('Error making reservation: '+err.message));
  });

  // Contact form (optional: store or send)
  $('contact-form')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const msg = { name: $('contact-name').value, email: $('contact-email').value, message: $('contact-message').value };
    fetch('/api/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(msg)})
      .then(()=>{alert('Thanks — we received your message!');$('contact-form').reset();})
      .catch(err=>{alert('Error sending message: '+err.message)});
  });

  // Theme toggle
  const themeToggle = $('theme-toggle');
  const current = localStorage.getItem('theme')||'light';
  if(current==='dark') document.documentElement.classList.add('dark');
  themeToggle?.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark')?'dark':'light');
  });
});