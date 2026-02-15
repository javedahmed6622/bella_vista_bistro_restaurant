const mongoose = require('mongoose');
const reservationSchema = new mongoose.Schema({
  name: String,
  email: String,
  date: String,
  time: String,
  guests: Number,
  status: { type: String, default: 'Pending' }
});
module.exports = mongoose.model('Reservation', reservationSchema);
