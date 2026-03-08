const express = require('express');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const router = express.Router();

// Protected: get all orders (admin)
router.get('/', auth, async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

// Protected: get my orders (customer)
router.get('/my', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const status = (req.query.status || '').toLowerCase();
    const sort = (req.query.sort || 'desc').toLowerCase(); // 'asc' or 'desc' by createdAt

    const filter = { userId };
    if (status && ['pending','confirmed','preparing','ready','delivered','cancelled'].includes(status)) {
      filter.status = status;
    }

    const total = await Order.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: orders,
      page,
      limit,
      total,
      totalPages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected: get single order by id (admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: create an order
router.post('/', async (req, res) => {
  try {
    console.log('orders POST body:', req.body);
    // simple field validation before hitting mongoose
    const { customerName, email, items, total } = req.body;
    if (!customerName || !email) {
      return res.status(400).json({ error: 'customerName and email are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    if (typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    // log detailed error only in development
    console.error('Order creation error:', err);
    // send back validation message (mongoose already populates it)
    const msg = err.message || 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// Protected: update order (status etc.)
router.put('/:id', auth, async (req, res) => {
  try {
    // ensure updatedAt gets bumped
    const body = { ...req.body, updatedAt: new Date() };
    const updated = await Order.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Order not found' });
    res.json(updated);
  } catch (err) {
    console.error('Order update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Protected: delete order
router.delete('/:id', auth, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
