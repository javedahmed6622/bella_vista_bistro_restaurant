const express = require('express');
const Menu = require('../models/Menu');
const auth = require('../middleware/auth');
const router = express.Router();

// Public: get menu
router.get('/', async (req, res) => {
  const menu = await Menu.find();
  res.json(menu);
});

// Protected: add menu item
router.post('/', auth, async (req, res) => {
  const newItem = new Menu(req.body);
  await newItem.save();
  res.json(newItem);
});

// Protected: update menu item
router.put('/:id', auth, async (req, res) => {
  const updated = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Protected: delete menu item
router.delete('/:id', auth, async (req, res) => {
  await Menu.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;