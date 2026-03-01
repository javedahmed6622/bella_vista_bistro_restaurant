const mongoose = require('mongoose');

const FeaturedImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: String,
  position: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FeaturedImage', FeaturedImageSchema);
