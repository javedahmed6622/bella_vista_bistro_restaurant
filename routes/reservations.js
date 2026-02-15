const express = require('express');
const Reservation = require('../models/Reservation');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all reservations
router.get('/', async (req, res) => {
  try {
    const reservations = await Reservation.find();
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new reservation
router.post('/', async (req, res) => {
  try {
    const newReservation = new Reservation(req.body);
    await newReservation.save();
    res.json(newReservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update reservation
// Protected: Update reservation (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a reservation
// Protected: Delete a reservation (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reservation deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
