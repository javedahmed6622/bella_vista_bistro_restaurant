// Shared site utilities and dynamic content loading
(function(){
  // utility selectors
  const $ = id => document.getElementById(id);

  // authentication & cart helpers
  window.updateAuthUI = function(){
    const token = localStorage.getItem('token');
    let user = {};
    try {
      user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      console.warn('Invalid stored user JSON, clearing it.', e);
      localStorage.removeItem('user');
    }

    const authContainer = $('authLinkContainer');
    if(!authContainer) return;
    if (token && user.id) {
      const displayName = user.name || user.email || 'User';
      const userDisplay = user.role === 'admin' ? `${displayName} (Admin)` : displayName;
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

  // load settings and update contact/footer info + homepage content
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

        // Homepage hero
        const heroTitle = document.getElementById('hero-title');
        if(heroTitle && s.heroTitle) heroTitle.innerHTML = s.heroTitle.replace(/\n/g,'<br>');
        const heroSubtitle = document.getElementById('hero-subtitle');
        if(heroSubtitle && s.heroSubtitle) heroSubtitle.textContent = s.heroSubtitle;
        const heroCta = document.getElementById('hero-cta-btn');
        if(heroCta){
          if(s.heroCtaText) heroCta.textContent = s.heroCtaText;
          if(s.heroCtaUrl) heroCta.href = s.heroCtaUrl;
        }

        // About section
        const aboutTitle = document.getElementById('about-title');
        if(aboutTitle && s.aboutTitle) aboutTitle.textContent = s.aboutTitle;
        const aboutText = document.getElementById('about-text');
        if(aboutText && s.aboutText) aboutText.textContent = s.aboutText;
        const aboutImg = document.getElementById('about-image');
        if(aboutImg && s.aboutImageUrl) aboutImg.src = s.aboutImageUrl;
        const aboutCta = document.getElementById('about-cta-btn');
        if(aboutCta){
          if(s.aboutButtonText) aboutCta.textContent = s.aboutButtonText;
          if(s.aboutButtonUrl) aboutCta.href = s.aboutButtonUrl;
        }

        // Newsletter section
        const newsletterTitle = document.getElementById('newsletter-title');
        if(newsletterTitle && s.newsletterTitle) newsletterTitle.textContent = s.newsletterTitle;
        const newsletterText = document.getElementById('newsletter-text');
        if(newsletterText && s.newsletterText) newsletterText.textContent = s.newsletterText;
        const newsletterBtn = document.getElementById('newsletter-btn');
        if(newsletterBtn && s.newsletterButtonText) newsletterBtn.textContent = s.newsletterButtonText;
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
          // team members store imageUrl, not image
          div.innerHTML = `<img src="${t.imageUrl||'https://via.placeholder.com/150'}"><h2>${t.name}</h2><p>${t.title||''}</p>`;
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
      const heroImgEl = $('hero-image');
      const defaultHero = { url: '/html_them/img/bf.jpg', title: 'Welcome to Bella Vista Bistro' };

      // If a hero image exists in settings, use the first one
      if (heroImgEl && heroes.length) {
        heroImgEl.src = heroes[0].url;
      }

      if(heroEl){
        const slidesData = heroes.length ? heroes : [defaultHero];
        heroEl.innerHTML = slidesData.map(h=>`<div class="hero-slide" style="background-image:url('${h.url}')">${h.title?`<h2>${h.title}</h2>`:''}</div>`).join('');
        // activate first slide and start rotation
        const slides = heroEl.querySelectorAll('.hero-slide');
        if(slides.length){
          let current = 0;
          slides[current].classList.add('active');
          if(slides.length > 1){
            setInterval(() => {
              slides[current].classList.remove('active');
              current = (current + 1) % slides.length;
              slides[current].classList.add('active');
            }, 6000);
          }
        }
      }
      const featEl = document.querySelector('.features-grid');
      if(featEl){
        const items = featured.length ? featured : [
          { url: '/html_them/img/sandwich1.jpg', title: 'Fresh Salad Bowl', description: 'Made with crisp greens and seasonal toppings.' },
          { url: '/html_them/img/cake2.jpg', title: 'Premium Ingredients', description: 'Only the best produce and handmade sauces.' },
          { url: '/html_them/img/pizza.webp', title: 'Chef’s Choice', description: 'Daily specials crafted by our head chef.' },
          { url: '/html_them/img/bf.jpg', title: 'Always Fresh', description: 'Prepared to order and served fresh.' }
        ];

        featEl.innerHTML = items.map(f=>`
          <div class="feature-card">
            <img src="${f.url}" alt="${f.title||'Featured'}">
            <h3>${f.title||''}</h3>
            <p>${f.description||''}</p>
          </div>
        `).join('');
      }

      // Load featured foods in new featured-grid-new
      const featuredNewEl = $('featured-gallery');
      if(featuredNewEl && featured.length){
        featuredNewEl.innerHTML = featured.map(f=>`
          <div class="featured-card-new">
            <div class="featured-img-wrapper">
              <img src="${f.url}" alt="${f.title||'Featured'}">
              <div class="featured-overlay">
                <button class="btn-add-cart">Add to Cart</button>
              </div>
              ${f.price && f.price > 0 ? `<div class="featured-price-hover">$${f.price.toFixed(2)}</div>` : ''}
            </div>
            <div class="featured-info">
              <h3>${f.title||''}</h3>
              <p>${f.description||''}</p>
            </div>
          </div>
        `).join('');
      }
    }catch(e){console.log('hero/featured load',e);}
  }
  window.loadHeroAndFeatured = loadHeroAndFeatured;

  // load blog posts for "Our Speciality" section
  async function loadBlogForSpeciality(){
    try{
      const res = await fetch('/api/content/blog-posts');
      const posts = await res.json();
      const container = $('blog-posts-container');
      const showMoreBtn = $('show-more-blog-btn');
      if(!container) return;

      if(!posts || posts.length === 0){
        container.innerHTML = '<p style="text-align:center; color:#999;">No blog posts available yet</p>';
        return;
      }

      // Store all posts globally for pagination
      window.allBlogPosts = posts;
      window.currentBlogIndex = 0;

      // Show first 3 posts
      showBlogPosts(3);

      // Show "Show More" button if there are more posts
      if(posts.length > 3){
        showMoreBtn.style.display = 'inline-block';
        showMoreBtn.onclick = function(){
          const remaining = posts.length - window.currentBlogIndex;
          showBlogPosts(remaining);
          showMoreBtn.style.display = 'none';
        };
      }

    }catch(e){console.log('blog load error',e);}
  }

  function showBlogPosts(count){
    const container = $('blog-posts-container');
    const posts = window.allBlogPosts;
    const startIndex = window.currentBlogIndex;
    const endIndex = Math.min(startIndex + count, posts.length);

    for(let i = startIndex; i < endIndex; i++){
      const post = posts[i];
      const isReverse = i % 2 === 1; // Alternate layout
      const postHtml = `
        <div class="blog-post-alternating ${isReverse ? 'reverse' : ''}" data-post-id="${post._id}">
          <div class="blog-post-image">
            <img src="${post.imageUrl || '/html_them/img/bf.jpg'}" alt="${post.title}">
          </div>
          <div class="blog-post-content">
            <h3>${post.title}</h3>
            <p>${post.content.substring(0, 200)}...</p>
            <div class="blog-post-actions">
              <a href="blog.html#blog-${post._id}" class="read-more">Read More →</a>
              <button class="comment-toggle-btn" onclick="toggleComments('${post._id}')">💬 Comments</button>
            </div>
            <div class="comments-section" id="comments-${post._id}" style="display: none;">
              <div class="comments-list" id="comments-list-${post._id}"></div>
              <div class="add-comment">
                <input type="text" id="comment-author-${post._id}" placeholder="Your name" maxlength="50">
                <textarea id="comment-content-${post._id}" placeholder="Write a comment..." rows="2" maxlength="500"></textarea>
                <button onclick="addComment('${post._id}')">Post Comment</button>
              </div>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', postHtml);
    }

    window.currentBlogIndex = endIndex;
  }

  window.loadBlogForSpeciality = loadBlogForSpeciality;

  // Comment functionality
  window.toggleComments = async function(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const commentsList = document.getElementById(`comments-list-${postId}`);
    
    if (commentsSection.style.display === 'none') {
      commentsSection.style.display = 'block';
      // Load comments
      try {
        const response = await fetch(`/api/comments/blog/${postId}`);
        const comments = await response.json();
        commentsList.innerHTML = comments.map(comment => `
          <div class="comment">
            <strong>${comment.author}</strong>
            <p>${comment.content}</p>
            <small>${new Date(comment.createdAt).toLocaleDateString()}</small>
          </div>
        `).join('');
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    } else {
      commentsSection.style.display = 'none';
    }
  };

  window.addComment = async function(postId) {
    const authorInput = document.getElementById(`comment-author-${postId}`);
    const contentInput = document.getElementById(`comment-content-${postId}`);
    
    const author = authorInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!author || !content) {
      alert('Please enter both your name and comment');
      return;
    }
    
    try {
      const response = await fetch(`/api/comments/blog/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ author, content })
      });
      
      if (response.ok) {
        authorInput.value = '';
        contentInput.value = '';
        // Reload comments
        toggleComments(postId);
        toggleComments(postId); // Toggle twice to reload
      } else {
        alert('Error posting comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Error posting comment');
    }
  };

  // Write blog post functionality
  document.addEventListener('DOMContentLoaded', function() {
    const writeBlogBtn = document.getElementById('write-blog-btn');
    if (writeBlogBtn) {
      writeBlogBtn.addEventListener('click', function() {
        // Simple modal for writing blog posts
        const modal = document.createElement('div');
        modal.className = 'blog-modal';
        modal.innerHTML = `
          <div class="blog-modal-content">
            <span class="blog-modal-close">&times;</span>
            <h2>Write a Blog Post</h2>
            <form id="blog-form">
              <input type="text" id="blog-title" placeholder="Blog Title" required maxlength="100">
              <textarea id="blog-content" placeholder="Share your food story..." rows="8" required maxlength="2000"></textarea>
              <input type="text" id="blog-author" placeholder="Your Name" required maxlength="50">
              <button type="submit">Submit Blog Post</button>
            </form>
          </div>
        `;
        document.body.appendChild(modal);
        
        modal.style.display = 'block';
        
        // Close modal
        modal.querySelector('.blog-modal-close').onclick = function() {
          modal.remove();
        };
        
        // Submit form
        modal.querySelector('#blog-form').onsubmit = async function(e) {
          e.preventDefault();
          const title = document.getElementById('blog-title').value;
          const content = document.getElementById('blog-content').value;
          const author = document.getElementById('blog-author').value;
          
          try {
            const response = await fetch('/api/content/blog-posts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title,
                content,
                status: 'draft' // Customer posts start as draft
              })
            });
            
            if (response.ok) {
              alert('Thank you! Your blog post has been submitted for review.');
              modal.remove();
            } else {
              alert('Error submitting blog post');
            }
          } catch (error) {
            console.error('Error submitting blog post:', error);
            alert('Error submitting blog post');
          }
        };
      });
    }
  });

  // load menu/products for menu page
  async function loadMenuItems(){
    try{
      console.log('Fetching menu items...');
      const res = await fetch('/api/products');
      const items = await res.json();
      console.log('Loaded menu items:', items.length);
      const menuDiv = $('menu-items');
      const filters = $('menu-filters');
      if(!menuDiv) { console.log('Menu div not found'); return; }
      // build categories
      const cats = Array.from(new Set(items.map(d=>d.category||'Main')));
      filters.className = 'menu-tabs';
      filters.innerHTML = `<button data-cat=\"all\" class=\"tab active\">All</button>` + cats.map(c=>`<button class="tab" data-cat=\"${c}\">${c}</button>`).join('');
      function render(filter){
        menuDiv.innerHTML = '';
        menuDiv.className = 'menu-grid';
        items.filter(i=>filter==='all' || (i.category||'Main')===filter).forEach(item=>{
          const card = document.createElement('div');
          card.className='card menu-card';
          const hasDiscount = item.discountPercent && item.discountPercent > 0;
          const finalPrice = hasDiscount ? (item.price * (1 - item.discountPercent/100)) : item.price;
          card.innerHTML = `
            <div class="menu-card-img"><img src="${item.imageUrl||item.image||'https://via.placeholder.com/400x300'}" alt="${item.name}"></div>
            <div class="menu-card-body">
              <h3>${item.name}</h3>
              <p class=\"muted\">${item.description||''}</p>
              <div class="rating-section" data-product-id="${item._id}">
                <div class="rating-display">
                  <div class="stars" id="stars-${item._id}">${generateStars(item.averageRating || 0)}</div>
                  <span class="rating-text">(${item.totalRatings || 0})</span>
                </div>
                <div class="rate-this">
                  <span>Rate this:</span>
                  <div class="rating-input">
                    ${[5,4,3,2,1].map(num => `<span class="star-input" data-rating="${num}" data-product="${item._id}">★</span>`).join('')}
                  </div>
                </div>
              </div>
              <div class=\"meta\">
                <div class=\"price\">
                  ${hasDiscount ? `<span class="old">$${(item.price||0).toFixed(2)}</span> <span class="new">$${finalPrice.toFixed(2)}</span> <span class="badge-off">-${item.discountPercent}%</span>` : `<span class="new">$${(item.price||0).toFixed(2)}</span>`}
                </div>
                <div class=\"actions\"><button class=\"btn add\">Add</button></div>
              </div>
            </div>
          `;
          menuDiv.appendChild(card);
          
          // Add rating event listeners
          card.querySelectorAll('.star-input').forEach(star => {
            star.addEventListener('click', (e) => submitRating(e.target.dataset.product, e.target.dataset.rating, card));
          });
          
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

  function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if (hasHalfStar) stars += '☆';
    for (let i = 0; i < emptyStars; i++) stars += '☆';
    
    return stars;
  }

  async function submitRating(productId, rating, cardElement) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      alert('Please login to rate products');
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: parseInt(rating),
          userId: user.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update the display
        const starsElement = cardElement.querySelector(`#stars-${productId}`);
        const ratingTextElement = cardElement.querySelector('.rating-text');
        
        if (starsElement) starsElement.innerHTML = generateStars(result.averageRating);
        if (ratingTextElement) ratingTextElement.textContent = `(${result.totalRatings})`;
        
        alert('Thank you for your rating!');
      } else {
        const error = await response.json();
        alert(error.message || 'Error submitting rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Error submitting rating');
    }
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
    if($('blog-posts-container')) loadBlogForSpeciality();
  });
})();
