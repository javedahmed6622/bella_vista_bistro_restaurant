const mongoose = require('mongoose');
const settingSchema = new mongoose.Schema({
  name: { type: String, default: 'Bella Vista Bistro' },
  description: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  hours: { type: String, default: '' },
  about: { type: String, default: '' },

  // homepage content
  heroTitle: { type: String, default: 'All Delicious Asian' },
  heroSubtitle: { type: String, default: 'Eggs, Salad, fruits, pasta and more — freshly prepared with love.' },
  heroCtaText: { type: String, default: 'Find more' },
  heroCtaUrl: { type: String, default: '/menu.html' },

  aboutTitle: { type: String, default: 'Welcome to our Dhabi Restaurant' },
  aboutText: { type: String, default: 'Experience the perfect blend of local flavors and modern presentation. Our chefs craft every dish with care and top-quality ingredients.' },
  aboutImageUrl: { type: String, default: '/html_them/img/biriyani.jpg' },
  aboutButtonText: { type: String, default: 'Find more' },
  aboutButtonUrl: { type: String, default: '/menu.html' },

  newsletterTitle: { type: String, default: 'Subscribe For Newsletter' },
  newsletterText: { type: String, default: 'Get exclusive offers and updates straight to your inbox.' },
  newsletterButtonText: { type: String, default: 'Subscribe' },

  // toggles and SEO
  enableReservations: { type: Boolean, default: true },
  showTestimonials: { type: Boolean, default: true },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Setting', settingSchema);
