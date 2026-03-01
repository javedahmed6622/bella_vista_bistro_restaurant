const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Setting = require('../models/Setting');

// Get settings (public)
router.get('/', async (req, res) => {
  try {
    let s = await Setting.findOne();
    if (!s) s = await Setting.create({});
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings (admin)
router.put('/', auth, async (req, res) => {
  try {
    let s = await Setting.findOne();
    if (!s) s = new Setting(req.body);
    else Object.assign(s, req.body);
    s.updatedAt = Date.now();
    await s.save();
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
