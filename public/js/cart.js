/* Unified cart script used by menu and cart pages */
(function(){
  const STORAGE_KEY = 'cart';
  function getCart(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch(e){return[]} }
  function saveCart(c){ localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }
  function updateCartCount(){ const cart=getCart(); const count=cart.reduce((s,i)=>s+i.qty,0); const el=document.getElementById('cartCount'); if(el) el.textContent=count; }
  function addToCart(item){ const cart=getCart(); const idx=cart.findIndex(i=>i.name===item.name); if(idx>-1){cart[idx].qty+=1}else{item.qty=1;cart.push(item)} saveCart(cart); updateCartCount(); }
  function openModal(src){ const modal=document.getElementById('imageModal'); const img=document.getElementById('modalImg'); if(img) img.src=src; if(modal) modal.style.display='flex'; }
  function closeModal(){ const modal=document.getElementById('imageModal'); if(modal) modal.style.display='none'; }
  function openCart(){ location.href='cart.html' }

  // expose for inline handlers if needed
  window.addToCart = addToCart; window.openModal = openModal; window.closeModal = closeModal; window.openCart = openCart;

  document.addEventListener('DOMContentLoaded', ()=>{
    updateCartCount();

    // wire add buttons (menu page)
    document.querySelectorAll('.add-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const name = btn.getAttribute('data-name')||'Item';
        const price = parseFloat(btn.getAttribute('data-price')||0);
        const img = btn.getAttribute('data-img')||'';
        addToCart({name,price,image:img});
        const prev = btn.textContent; btn.textContent='Added'; setTimeout(()=>btn.textContent=prev,800);
      });
    });

    // cart button on menu
    const cartBtn = document.getElementById('cartBtn'); if(cartBtn) cartBtn.addEventListener('click', openCart);

    // modal close
    const modal = document.getElementById('imageModal'); const close = document.getElementById('modalClose');
    if(close) close.addEventListener('click', closeModal);
    if(modal) modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });

    // --- cart page rendering (if cart.html)
    const cartList = document.getElementById('cart-list'); if(cartList){
      let cart = getCart();
      const empty = document.getElementById('cart-empty'); const totalEl = document.getElementById('cart-total');
      function render(){ cart = getCart(); cartList.innerHTML=''; if(cart.length===0){ if(empty) empty.style.display='block'; if(totalEl) totalEl.textContent='0.00'; document.getElementById('cart-checkout').disabled = true; return } else { if(empty) empty.style.display='none'; document.getElementById('cart-checkout').disabled = false }
        let total=0; cart.forEach((it, i)=>{
          const row = document.createElement('div'); row.className='card'; row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.marginBottom='0.6rem';
          row.innerHTML = `
            <div style="display:flex;gap:0.75rem;align-items:center">
              <img src="${it.image||'https://via.placeholder.com/80'}" style="width:80px;height:60px;object-fit:cover;border-radius:8px"/>
              <div><div style="font-weight:700">${it.name}</div><div class="muted">$${it.price.toFixed(2)}</div></div>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem">
              <button class="btn ghost small qty-dec" data-i="${i}">-</button>
              <div>${it.qty}</div>
              <button class="btn ghost small qty-inc" data-i="${i}">+</button>
              <div style="width:90px;text-align:right">$${(it.price*it.qty).toFixed(2)}</div>
              <button class="btn ghost small remove" data-i="${i}">Remove</button>
            </div>
          `;
          cartList.appendChild(row); total += it.price*it.qty;
        });
        if(totalEl) totalEl.textContent = total.toFixed(2);
        // wire
        cartList.querySelectorAll('.qty-inc').forEach(b=>b.addEventListener('click', e=>{ const i=parseInt(e.target.dataset.i,10); cart[i].qty++; saveCart(cart); render(); updateCartCount(); }));
        cartList.querySelectorAll('.qty-dec').forEach(b=>b.addEventListener('click', e=>{ const i=parseInt(e.target.dataset.i,10); if(cart[i].qty>1){cart[i].qty--}else{cart.splice(i,1)} saveCart(cart); render(); updateCartCount(); }));
        cartList.querySelectorAll('.remove').forEach(b=>b.addEventListener('click', e=>{ const i=parseInt(e.target.dataset.i,10); cart.splice(i,1); saveCart(cart); render(); updateCartCount(); }));
      }
      document.getElementById('continue-shopping')?.addEventListener('click', ()=>{ location.href='index.html'; });
      document.getElementById('cart-checkout')?.addEventListener('click', ()=>{
        // Check authentication
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token || !user.id) {
          alert('Please login to place an order');
          location.href = 'login.html';
          return;
        }
        
        if (!user.isApproved && user.role === 'customer') {
          alert('Your account is pending admin approval. Please wait for approval before placing an order.');
          return;
        }
        
        if(cart.length===0) return alert('Cart is empty');
        
        const phone = prompt('Your phone number');
        const address = prompt('Delivery address') || 'Not provided';
        
        const order = { 
          userId: user.id,
          customerName: user.name, 
          email: user.email,
          phone: phone || '',
          address: address,
          items: cart.map(c=>({name:c.name, price: c.price, quantity:c.qty, subtotal: c.price * c.qty})), 
          total: cart.reduce((s,i)=>s+i.price*i.qty,0),
          status: 'pending',
          paymentStatus: 'unpaid'
        };
        
        fetch('/api/orders',{
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'Authorization': `Bearer ${token}`
          },
          body:JSON.stringify(order)
        })
          .then(response => {
            if (response.ok) {
              alert('Order placed successfully!');
              localStorage.removeItem(STORAGE_KEY); 
              render(); 
              updateCartCount(); 
              location.href='index.html';
            } else {
              alert('Failed to place order');
            }
          })
          .catch(err =>{
            console.error(err);
            alert('Order failed: ' + err.message);
          });
      });
      render();
    }
  });
})();
