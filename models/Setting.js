const mongoose = require('mongoose');
const settingSchema = new mongoose.Schema({
  name: { type: String, default: 'Bella Vista Bistro' },
  description: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  hours: { type: String, default: '' },
  about: { type: String, default: '' },
  // toggles and SEO
  enableReservations: { type: Boolean, default: true },
  showTestimonials: { type: Boolean, default: true },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Setting', settingSchema);
