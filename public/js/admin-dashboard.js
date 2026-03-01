// Admin Dashboard JavaScript
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || '{}');
let editingId = {};

// Check authentication
if (!authToken || currentUser.role !== 'admin') {
  window.location.href = 'login.html';
}

// Initialize dashboard and navigation
function initDashboard() {
  // Set user name
  const adminNameEl = document.getElementById('admin-name');
  if (adminNameEl) {
    adminNameEl.textContent = currentUser.name || 'Administrator';
  }

  // Setup navigation listeners
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const view = btn.dataset.view;
      if (view) {
        switchView(view);
      }
    });
  });

  // Load initial dashboard view
  loadDashboardStats();
}

// Run initialization right away
initDashboard();

function switchView(view) {
  // Hide all views
  document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
  // Remove active from nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  // Show selected view
  const viewEl = document.getElementById(`view-${view}`);
  const btnEl = document.querySelector(`[data-view="${view}"]`);
  
  if (!viewEl || !btnEl) {
    console.error(`View or button not found for: ${view}`);
    return;
  }
  
  // Update active states
  viewEl.classList.add('active');
  btnEl.classList.add('active');
  
  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    hero: 'Hero Section Images',
    featured: 'Featured Foods',
    blog: 'Blog Posts',
    team: 'Team Members',
    products: 'Menu Products',
    orders: 'Orders',
    newsletter: 'Newsletter Subscribers',
    messages: 'Messages',
    settings: 'Settings'
  };
  
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    pageTitle.textContent = titles[view] || view.charAt(0).toUpperCase() + view.slice(1);
  }
  
  // Load data based on view
  switch(view) {
    case 'dashboard':
      loadDashboardStats();
      break;
    case 'hero':
      loadHeroImages();
      break;
    case 'featured':
      loadFeaturedImages();
      break;
    case 'blog':
      loadBlogPosts();
      break;
    case 'team':
      loadTeamMembers();
      break;
    case 'products':
      loadProducts();
      break;
    case 'orders':
      loadOrders();
      break;
    case 'newsletter':
      loadNewsletterSubscribers();
      break;
    case 'messages':
      loadMessages();
      break;
    case 'settings':
      loadSettings();
      break;
    default:
      console.warn(`Unknown view: ${view}`);
  }
}

// Alert functions
function showAlert(message, type = 'success') {
  const container = document.getElementById('alerts-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `<i class="fas fa-${type === 'error' ? 'times-circle' : 'check-circle'}"></i> ${message}`;
  container.appendChild(alert);
  setTimeout(() => alert.remove(), 4000);
}

// Modal functions
function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

// Preview image
function previewImage(input, previewId) {
  if (!input.files || !input.files[0]) return;
  
  const file = input.files[0];
  
  // Validate file type
  if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
    showAlert('Only PNG, JPG, and SVG files are allowed', 'error');
    input.value = '';
    return;
  }
  
  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showAlert('File size must be less than 5MB', 'error');
    input.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById(previewId);
    const html = `
      <div class="file-preview">
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="file-preview-remove" onclick="this.parentElement.remove()">×</button>
      </div>
    `;
    preview.innerHTML = html;
  };
  reader.readAsDataURL(file);
}

// Upload file
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.filename;
    } else {
      showAlert('File upload failed', 'error');
      return null;
    }
  } catch (error) {
    showAlert('Upload error: ' + error.message, 'error');
    return null;
  }
}

// ===== HERO SECTION =====
function openHeroModal() {
  document.getElementById('hero-form').reset();
  document.getElementById('hero-preview').innerHTML = '';
  openModal('hero-modal');
}

async function saveHero(event) {
  event.preventDefault();
  
  const fileInput = document.getElementById('hero-image');
  if (!fileInput.files || !fileInput.files.length) {
    showAlert('Please select an image', 'error');
    return;
  }
  
  const filename = await uploadFile(fileInput.files[0]);
  if (!filename) return;
  
  const data = {
    filename: filename,
    url: `/uploads/${filename}`
  };
  
  try {
    const response = await fetch('/api/content/hero-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      showAlert('Hero image added successfully');
      closeModal('hero-modal');
      loadHeroImages();
    } else {
      showAlert('Error adding hero image', 'error');
    }
  } catch (error) {
    showAlert('Error: ' + error.message, 'error');
  }
}

async function loadHeroImages() {
  try {
    const response = await fetch('/api/content/hero-images', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const images = await response.json();
    
    const grid = document.getElementById('hero-grid');
    grid.innerHTML = '';
    
    if (images.length === 0) {
      grid.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>No hero images yet</p></div>';
      return;
    }
    
    images.forEach(img => {
      const html = `
        <div class="content-item">
          <div class="content-item-image">
            <img src="${img.url}" alt="Hero">
          </div>
          <div class="content-item-body">
            <div class="content-item-title">${img.filename}</div>
            <div class="content-item-actions">
              <button type="button" class="btn-small btn-delete" onclick="deleteContent('hero', '${img._id}')">Delete</button>
            </div>
          </div>
        </div>
      `;
      grid.innerHTML += html;
    });
  } catch (error) {
    showAlert('Error loading hero images', 'error');
  }
}

// ===== FEATURED SECTION =====
function openFeaturedModal() {
  document.getElementById('featured-form').reset();
  document.getElementById('featured-preview').innerHTML = '';
  editingId.featured = null;
  document.getElementById('featured-modal-title').textContent = 'Add Featured Food';
  openModal('featured-modal');
}

async function saveFeatured(event) {
  event.preventDefault();
  
  const fileInput = document.getElementById('featured-image');
  if (!fileInput.files || !fileInput.files.length) {
    showAlert('Please select an image', 'error');
    return;
  }
  
  const filename = await uploadFile(fileInput.files[0]);
  if (!filename) return;
  
  const data = {
    filename: filename,
    url: `/uploads/${filename}`,
    position: Math.floor(Math.random() * 1000)
  };
  
  try {
    const response = await fetch('/api/content/featured-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      showAlert('Featured food added successfully');
      closeModal('featured-modal');
      loadFeaturedImages();
    } else {
      showAlert('Error adding featured food', 'error');
    }
  } catch (error) {
    showAlert('Error: ' + error.message, 'error');
  }
}

async function loadFeaturedImages() {
  try {
    const response = await fetch('/api/content/featured-images', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const images = await response.json();
    
    const grid = document.getElementById('featured-grid');
    grid.innerHTML = '';
    
    if (images.length === 0) {
      grid.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><p>No featured foods yet</p></div>';
      return;
    }
    
    images.forEach(img => {
      const html = `
        <div class="content-item">
          <div class="content-item-image">
            <img src="${img.url}" alt="Featured">
          </div>
          <div class="content-item-body">
            <div class="content-item-title">${img.filename}</div>
            <div class="content-item-actions">
              <button type="button" class="btn-small btn-delete" onclick="deleteContent('featured', '${img._id}')">Delete</button>
            </div>
          </div>
        </div>
      `;
      grid.innerHTML += html;
    });
  } catch (error) {
    showAlert('Error loading featured images', 'error');
  }
}

// ===== BLOG POSTS =====
function openBlogModal() {
  document.getElementById('blog-form').reset();
  document.getElementById('blog-preview').innerHTML = '';
  editingId.blog = null;
  document.getElementById('blog-modal-title').textContent = 'New Blog Post';
  openModal('blog-modal');
}

async function saveBlog(event) {
  event.preventDefault();
  
  const title = document.getElementById('blog-title').value;
  const content = document.getElementById('blog-content').value;
  const fileInput = document.getElementById('blog-image');
  
  let filename = '';
  if (fileInput.files && fileInput.files.length) {
    filename = await uploadFile(fileInput.files[0]);
    if (!filename) return;
  }
  
  const data = {
    title,
    content,
    imageFilename: filename,
    imageUrl: filename ? `/uploads/${filename}` : '',
    status: 'published'
  };
  
  try {
    const response = await fetch('/api/content/blog-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      showAlert('Blog post created successfully');
      closeModal('blog-modal');
      loadBlogPosts();
    } else {
      showAlert('Error creating blog post', 'error');
    }
  } catch (error) {
    showAlert('Error: ' + error.message, 'error');
  }
}

async function loadBlogPosts() {
  try {
    const response = await fetch('/api/content/blog-posts', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const posts = await response.json();
    
    const tbody = document.querySelector('#blog-list');
    tbody.innerHTML = '';
    
    if (posts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-blog"></i> No blog posts yet</td></tr>';
      return;
    }
    
    posts.forEach(post => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${post.title}</strong></td>
          <td><span class="status-badge status-${post.status}">${post.status}</span></td>
          <td>${new Date(post.createdAt).toLocaleDateString()}</td>
          <td>
            <button type="button" class="btn-small btn-delete" onclick="deleteContent('blog', '${post._id}')">Delete</button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    showAlert('Error loading blog posts', 'error');
  }
}

// ===== TEAM MEMBERS =====
function openTeamModal() {
  document.getElementById('team-form').reset();
  document.getElementById('team-preview').innerHTML = '';
  editingId.team = null;
  document.getElementById('team-modal-title').textContent = 'Add Team Member';
  openModal('team-modal');
}

async function saveTeam(event) {
  event.preventDefault();
  
  const name = document.getElementById('team-name').value;
  const position = document.getElementById('team-position').value;
  const bio = document.getElementById('team-bio').value;
  const fileInput = document.getElementById('team-image');
  
  let filename = '';
  if (fileInput.files && fileInput.files.length) {
    filename = await uploadFile(fileInput.files[0]);
    if (!filename) return;
  }
  
  const data = {
    name,
    position,
    bio,
    imageFilename: filename,
    imageUrl: filename ? `/uploads/${filename}` : ''
  };
  
  try {
    const response = await fetch('/api/content/team-members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      showAlert('Team member added successfully');
      closeModal('team-modal');
      loadTeamMembers();
    } else {
      showAlert('Error adding team member', 'error');
    }
  } catch (error) {
    showAlert('Error: ' + error.message, 'error');
  }
}

async function loadTeamMembers() {
  try {
    const response = await fetch('/api/content/team-members', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const members = await response.json();
    
    const grid = document.getElementById('team-grid');
    grid.innerHTML = '';
    
    if (members.length === 0) {
      grid.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No team members yet</p></div>';
      return;
    }
    
    members.forEach(member => {
      const html = `
        <div class="content-item">
          <div class="content-item-image">
            ${member.imageUrl ? `<img src="${member.imageUrl}" alt="${member.name}">` : '<i class="fas fa-user-circle"></i>'}
          </div>
          <div class="content-item-body">
            <div class="content-item-title">${member.name}</div>
            <div class="content-item-meta">${member.position}</div>
            <div class="content-item-actions">
              <button type="button" class="btn-small btn-delete" onclick="deleteContent('team', '${member._id}')">Delete</button>
            </div>
          </div>
        </div>
      `;
      grid.innerHTML += html;
    });
  } catch (error) {
    showAlert('Error loading team members', 'error');
  }
}

// ===== PRODUCTS/MENU =====
function openProductModal() {
  document.getElementById('product-form').reset();
  document.getElementById('product-preview').innerHTML = '';
  editingId.product = null;
  document.getElementById('product-modal-title').textContent = 'Add Product';
  openModal('product-modal');
}

async function saveProduct(event) {
  event.preventDefault();
  
  const name = document.getElementById('product-name').value;
  const category = document.getElementById('product-category').value;
  const description = document.getElementById('product-description').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const fileInput = document.getElementById('product-image');
  
  let filename = '';
  if (fileInput.files && fileInput.files.length) {
    filename = await uploadFile(fileInput.files[0]);
    if (!filename) return;
  }
  
  const data = {
    name,
    category,
    description,
    price,
    image: filename ? `/uploads/${filename}` : ''
  };
  
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      showAlert('Product added successfully');
      closeModal('product-modal');
      loadProducts();
    } else {
      showAlert('Error adding product', 'error');
    }
  } catch (error) {
    showAlert('Error: ' + error.message, 'error');
  }
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const products = await response.json();
    
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    if (products.length === 0) {
      grid.innerHTML = '<div class="empty-state"><i class="fas fa-utensils"></i><p>No products yet</p></div>';
      return;
    }
    
    products.forEach(product => {
      const html = `
        <div class="content-item">
          <div class="content-item-image">
            ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<i class="fas fa-image"></i>'}
          </div>
          <div class="content-item-body">
            <div class="content-item-title">${product.name}</div>
            <div class="content-item-meta">${product.category}</div>
            <div class="content-item-meta"><strong>৳${product.price}</strong></div>
            <div class="content-item-actions">
              <button type="button" class="btn-small btn-delete" onclick="deleteContent('product', '${product._id}')">Delete</button>
            </div>
          </div>
        </div>
      `;
      grid.innerHTML += html;
    });
  } catch (error) {
    showAlert('Error loading products', 'error');
  }
}

// ===== ORDERS =====
async function loadOrders() {
  try {
    const response = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const orders = await response.json();
    
    const tbody = document.querySelector('#orders-list');
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-shopping-cart"></i> No orders yet</td></tr>';
      return;
    }
    
    orders.forEach(order => {
      tbody.innerHTML += `
        <tr>
          <td><strong>#${order._id.substring(0, 8)}</strong></td>
          <td>${order.customerName}</td>
          <td><strong>৳${order.total}</strong></td>
          <td><span class="status-badge status-${order.status}">${order.status}</span></td>
          <td>${new Date(order.createdAt).toLocaleDateString()}</td>
          <td>
            <button type="button" class="btn-small btn-view" onclick="viewOrderDetails('${order._id}')">View</button>
            <button type="button" class="btn-small btn-delete" onclick="deleteContent('order', '${order._id}')">Delete</button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    showAlert('Error loading orders', 'error');
  }
}

async function viewOrderDetails(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const order = await response.json();
    
    const orderDetails = document.getElementById('order-details');
    let itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>৳${item.price}</td>
        <td>৳${item.subtotal}</td>
      </tr>
    `).join('');
    
    orderDetails.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #02A237; margin-bottom: 15px;">Customer Information</h3>
        <p><strong>Name:</strong> ${order.customerName}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Address:</strong> ${order.address}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #02A237; margin-bottom: 15px;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background: #f0f0f0;">
            <tr>
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: left;">Qty</th>
              <th style="padding: 10px; text-align: left;">Price</th>
              <th style="padding: 10px; text-align: left;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      
      <div style="text-align: right; padding-top: 15px; border-top: 2px solid #02A237;">
        <h2 style="color: #02A237; margin: 10px 0;">Total: ৳${order.total}</h2>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Payment:</strong> ${order.paymentStatus}</p>
      </div>
    `;
    
    openModal('order-modal');
  } catch (error) {
    showAlert('Error loading order details', 'error');
  }
}

function printBill() {
  window.print();
}

// ===== NEWSLETTER =====
async function loadNewsletterSubscribers() {
  try {
    const response = await fetch('/api/newsletter', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const subscribers = await response.json();
    
    const tbody = document.querySelector('#newsletter-list');
    tbody.innerHTML = '';
    
    if (subscribers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fas fa-envelope"></i> No subscribers yet</td></tr>';
      return;
    }
    
    subscribers.forEach(sub => {
      tbody.innerHTML += `
        <tr>
          <td>${sub.email}</td>
          <td>${new Date(sub.subscribedAt).toLocaleDateString()}</td>
          <td>
            <button type="button" class="btn-small btn-delete" onclick="deleteNewsletter('${sub.email}')">Remove</button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    showAlert('Error loading newsletter subscribers', 'error');
  }
}

// ===== MESSAGES =====
async function loadMessages() {
  try {
    const response = await fetch('/api/messages', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const messages = await response.json();
    
    const tbody = document.querySelector('#messages-list');
    tbody.innerHTML = '';
    
    if (messages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-comments"></i> No messages yet</td></tr>';
      return;
    }
    
    messages.forEach(msg => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${msg.name}</strong></td>
          <td>${msg.email}</td>
          <td>${msg.subject}</td>
          <td>${new Date(msg.createdAt).toLocaleDateString()}</td>
          <td>
            <button type="button" class="btn-small btn-delete" onclick="deleteContent('message', '${msg._id}')">Delete</button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    showAlert('Error loading messages', 'error');
  }
}

// ===== SETTINGS =====
document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    name: document.getElementById('setting-name').value,
    email: document.getElementById('setting-email').value,
    phone: document.getElementById('setting-phone').value,
    address: document.getElementById('setting-address').value,
    about: document.getElementById('setting-about').value
  };
  
  try {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      showAlert('Settings saved successfully');
    } else {
      showAlert('Error saving settings', 'error');
    }
  } catch (error) {
    showAlert('Error: ' + error.message, 'error');
  }
});

// ===== DELETE NEWSLETTER SUBSCRIBER =====
async function deleteNewsletter(email) {
  if (!confirm(`Are you sure you want to remove ${email} from newsletter?`)) return;
  
  try {
    const response = await fetch(`/api/newsletter/${email}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      showAlert('Subscriber removed successfully');
      loadNewsletterSubscribers();
    } else {
      showAlert('Error removing subscriber', 'error');
    }
  } catch (error) {
    showAlert('Error: ' + error.message, 'error');
  }
}

// ===== DELETE CONTENT =====
async function deleteContent(type, id) {
  if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
  
  const endpoints = {
    hero: `/api/content/hero-images/${id}`,
    featured: `/api/content/featured-images/${id}`,
    blog: `/api/content/blog-posts/${id}`,
    team: `/api/content/team-members/${id}`,
    product: `/api/products/${id}`,
    order: `/api/orders/${id}`,
    newsletter: `/api/newsletter/${id}`,
    message: `/api/messages/${id}`
  };
  
  try {
    const response = await fetch(endpoints[type], {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      showAlert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      
      // Reload list
      if (type === 'hero') loadHeroImages();
      else if (type === 'featured') loadFeaturedImages();
      else if (type === 'blog') loadBlogPosts();
      else if (type === 'team') loadTeamMembers();
      else if (type === 'product') loadProducts();
      else if (type === 'order') loadOrders();
      else if (type === 'newsletter') loadNewsletterSubscribers();
      else if (type === 'message') loadMessages();
    } else {
      showAlert('Error deleting item', 'error');
    }
  } catch (error) {
    showAlert('Error: ' + error.message, 'error');
  }
}

// ===== DASHBOARD STATS =====
async function loadDashboardStats() {
  try {
    const ordersRes = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const orders = await ordersRes.json();
    document.getElementById('stat-orders').textContent = orders.length;
    
    const pending = orders.filter(o => o.status === 'pending').length;
    document.getElementById('stat-pending').textContent = pending;
    
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('stat-revenue').textContent = '৳' + revenue.toLocaleString();
    
    const newsRes = await fetch('/api/newsletter', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const subscribers = await newsRes.json();
    document.getElementById('stat-subscribers').textContent = subscribers.length;
    
    // Load recent orders
    const recentList = document.getElementById('recent-orders-list');
    recentList.innerHTML = '';
    
    if (orders.length === 0) {
      recentList.innerHTML = '<p style="text-align: center; color: #999;">No orders yet</p>';
      return;
    }
    
    const recent = orders.slice(-5).reverse();
    recent.forEach(order => {
      recentList.innerHTML += `
        <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0; font-weight: 600;">${order.customerName}</p>
            <small style="color: #999;">Order #${order._id.substring(0, 8)}</small>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: 600;">৳${order.total}</p>
            <span class="status-badge status-${order.status}">${order.status}</span>
          </div>
        </div>
      `;
    });
  } catch (error) {
    showAlert('Error loading dashboard stats', 'error');
  }
}

// ===== SETTINGS =====
async function loadSettings() {
  try {
    const response = await fetch('/api/settings', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const settings = await response.json();
      document.getElementById('setting-name').value = settings.name || '';
      document.getElementById('setting-email').value = settings.email || '';
      document.getElementById('setting-phone').value = settings.phone || '';
      document.getElementById('setting-address').value = settings.address || '';
      document.getElementById('setting-about').value = settings.about || '';
      
      // Attach form submit handler
      const form = document.getElementById('settings-form');
      if (form) {
        form.onsubmit = saveSettings;
      }
    }
  } catch (error) {
    showAlert('Error loading settings', 'error');
  }
}

async function saveSettings(event) {
  event.preventDefault();
  
  const settings = {
    name: document.getElementById('setting-name').value,
    email: document.getElementById('setting-email').value,
    phone: document.getElementById('setting-phone').value,
    address: document.getElementById('setting-address').value,
    about: document.getElementById('setting-about').value
  };
  
  try {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(settings)
    });
    
    if (response.ok) {
      showAlert('Settings saved successfully');
    } else {
      showAlert('Error saving settings', 'error');
    }
  } catch (error) {
    showAlert('Error: ' + error.message, 'error');
  }
}

// Close modal on outside click
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
});

// Logout
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
}
