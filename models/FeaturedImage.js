const mongoose = require('mongoose');

const FeaturedImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: String,
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  position: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FeaturedImage', FeaturedImageSchema);
