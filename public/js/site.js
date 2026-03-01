// Shared site utilities and dynamic content loading
(function(){
  // utility selectors
  const $ = id => document.getElementById(id);

  // authentication & cart helpers
  window.updateAuthUI = function(){
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const authContainer = $('authLinkContainer');
    if(!authContainer) return;
    if (token && user.id) {
      const userDisplay = user.role === 'admin' ? `${user.name} (Admin)` : user.name;
      let html = `<span class=\"user-menu\"><span style=\"color: white; font-size: 14px;\">Hello, ${userDisplay}</span>`;
      if (user.role === 'admin') {
        html += `<a href=\"admin_new.html\" class=\"btn-admin\">Admin Panel</a>`;
      }
      html += `<button class=\"btn-logout\" onclick=\"logout()\">Logout</button></span>`;
      authContainer.innerHTML = html;
    } else {
      authContainer.innerHTML = '<a href=\"login.html\" class=\"btn-auth\">Login / Register</a>';
    }
  };

  window.logout = function(){
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('expiresAt');
    updateAuthUI();
    updateCartCount();
    location.reload();
  };

  window.updateCartCount = function(){
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = cart.reduce((s,i)=>s+(i.qty||0),0);
      document.querySelectorAll('.cart-count').forEach(el=>el.textContent=count);
    } catch(e){console.log('Cart count error',e);}
  };

  // load settings and update contact/footer info
  async function loadSettings(){
    try{
      const res = await fetch('/api/settings');
      if(res.ok){
        const s = await res.json();
        if(s.name) document.querySelectorAll('.restaurant-name').forEach(el=>el.textContent=s.name);
        if(s.email) document.querySelectorAll('.restaurant-email').forEach(el=>el.textContent=s.email);
        if(s.phone) document.querySelectorAll('.restaurant-phone').forEach(el=>el.textContent=s.phone);
        if(s.address) document.querySelectorAll('.restaurant-address').forEach(el=>el.textContent=s.address);
        if(s.about) document.querySelectorAll('.restaurant-about').forEach(el=>el.textContent=s.about);
      }
    }catch(e){console.log('settings load fail',e);}
  }

  window.loadSettings = loadSettings;

  // load team members for about page
  async function loadTeam(){
    try{
      const res = await fetch('/api/content/team-members');
      const data = await res.json();
      const container = $('team-container');
      if(container){
        container.innerHTML = '';
        data.forEach(t=>{
          const div = document.createElement('div');
          div.className = 'about-img';
          div.innerHTML = `<img src="${t.image||'https://via.placeholder.com/150'}"><h2>${t.name}</h2><p>${t.title||''}</p>`;
          container.appendChild(div);
        });
      }
    }catch(e){console.log('team load error',e);}
  }
  window.loadTeam = loadTeam;

  // load hero images and featured gallery for index
  async function loadHeroAndFeatured(){
    try{
      const [hRes,fRes] = await Promise.all([
        fetch('/api/content/hero-images'),
        fetch('/api/content/featured-images')
      ]);
      const heroes = hRes.ok ? await hRes.json() : [];
      const featured = fRes.ok ? await fRes.json() : [];
      const heroEl = $('hero-carousel');
      if(heroEl && heroes.length){
        heroEl.innerHTML = heroes.map(h=>`<div class=\"hero-slide\" style=\"background-image:url('${h.image}')\">${h.title?`<h2>${h.title}</h2>`:''}</div>`).join('');
        // activate first slide and start rotation
        const slides = heroEl.querySelectorAll('.hero-slide');
        if(slides.length){
          let current = 0;
          slides[current].classList.add('active');
          setInterval(() => {
            slides[current].classList.remove('active');
            current = (current + 1) % slides.length;
            slides[current].classList.add('active');
          }, 5000);
        }
      }
      const featEl = $('featured-gallery');
      if(featEl && featured.length){
        featEl.innerHTML = featured.map(f=>`<div class=\"featured-img\"><img src="${f.image}" alt=""></div>`).join('');
      }
    }catch(e){console.log('hero/featured load',e);}
  }
  window.loadHeroAndFeatured = loadHeroAndFeatured;

  // load menu/products for menu page
  async function loadMenuItems(){
    try{
      const res = await fetch('/api/products');
      const items = await res.json();
      const menuDiv = $('menu-items');
      const filters = $('menu-filters');
      if(!menuDiv) return;
      // build categories
      const cats = Array.from(new Set(items.map(d=>d.category||'Main')));
      filters.innerHTML = `<button data-cat=\"all\" class=\"active\">All</button>` + cats.map(c=>`<button data-cat=\"${c}\">${c}</button>`).join('');
      function render(filter){
        menuDiv.innerHTML = '';
        items.filter(i=>filter==='all' || (i.category||'Main')===filter).forEach(item=>{
          const card = document.createElement('div');
          card.className='card menu-card';
          card.innerHTML = `
            <img src="${item.imageUrl||item.image||'https://via.placeholder.com/400x300'}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p class=\"muted\">${item.description||''}</p>
            <div class=\"meta\"><div class=\"price\">$${(item.price||0).toFixed(2)}</div><div class=\"actions\"><button class=\"btn add\">Add</button></div></div>
          `;
          menuDiv.appendChild(card);
          card.querySelector('.add').addEventListener('click', ()=>{
            let cart = JSON.parse(localStorage.getItem('cart')||'[]');
            const ex = cart.find(c=>c.id===item._id);
            if(ex) ex.qty++;
            else cart.push({id:item._id,name:item.name,price:item.price||0,qty:1,image:item.imageUrl||item.image||''});
            localStorage.setItem('cart', JSON.stringify(cart));
            window.updateCartCount();
            location.href='/cart.html';
          });
        });
      }
      render('all');
      filters.querySelectorAll('button').forEach(b=>{
        b.addEventListener('click', ()=>{
          filters.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
          b.classList.add('active');
          render(b.dataset.cat);
        });
      });
    }catch(e){console.log('menu load err',e);}  
  }
  window.loadMenuItems = loadMenuItems;

  // when DOM ready perform initial actions
  document.addEventListener('DOMContentLoaded', ()=>{
    updateAuthUI();
    updateCartCount();
    loadSettings();
    if($('menu-items')) loadMenuItems();
    if($('team-container')) loadTeam();
    if($('hero-carousel')||$('featured-gallery')) loadHeroAndFeatured();
  });
})();