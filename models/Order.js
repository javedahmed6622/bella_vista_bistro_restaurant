const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  items: [{ name: String, quantity: Number }],
  total: Number,
  customerName: String,
  email: String,
  status: { type: String, default: 'Pending' }
});
module.exports = mongoose.model('Order', orderSchema);
