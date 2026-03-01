const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// helper: require admin role
async function requireAdmin(req, res, next){
  try{
    const user = await User.findById(req.user.id);
    if(!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    next();
  }catch(err){res.status(500).json({ error: err.message });}
}

// list admins
router.get('/', auth, requireAdmin, async (req, res) => {
  const admins = await User.find().select('-password').sort({ name: 1 });
  res.json(admins);
});

// get single admin
router.get('/:id', auth, requireAdmin, async (req, res) => {
  const u = await User.findById(req.params.id).select('-password');
  if(!u) return res.status(404).json({ message: 'Not found' });
  res.json(u);
});

// create admin
router.post('/', auth, requireAdmin, async (req, res) => {
  try{
    const { name, email, password, role, avatar } = req.body;
    if(!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const exists = await User.findOne({ email });
    if(exists) return res.status(400).json({ message: 'Email already exists' });
    const hash = bcrypt.hashSync(password, 10);
    const u = new User({ name, email, password: hash, role: role||'admin', avatar: avatar||'' });
    await u.save();
    res.json({ message: 'Created' });
  }catch(err){res.status(500).json({ error: err.message });}
});

// update admin
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try{
    const { name, email, password, role, avatar } = req.body;
    const u = await User.findById(req.params.id);
    if(!u) return res.status(404).json({ message: 'Not found' });
    if(name) u.name = name;
    if(email) u.email = email;
    if(typeof role !== 'undefined') u.role = role;
    if(avatar) u.avatar = avatar;
    if(password) u.password = bcrypt.hashSync(password,10);
    await u.save();
    res.json({ message: 'Updated' });
  }catch(err){res.status(500).json({ error: err.message });}
});

// delete admin
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try{
    if(req.user.id === req.params.id) return res.status(400).json({ message: 'Cannot delete self' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  }catch(err){res.status(500).json({ error: err.message });}
});

// ===== CUSTOMER APPROVAL MANAGEMENT =====

// Get pending customer registrations (not approved)
router.get('/approvals/pending', auth, requireAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find({ role: 'customer', isApproved: false })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve a customer registration
router.post('/approvals/:userId/approve', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'customer') {
      return res.status(400).json({ message: 'Only customer approvals can be processed' });
    }
    
    user.isApproved = true;
    await user.save();
    
    res.json({ 
      message: 'Customer approved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject/remove a pending customer registration
router.delete('/approvals/:userId/reject', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isApproved && user.role === 'customer') {
      return res.status(400).json({ message: 'Cannot reject an already approved customer' });
    }
    
    await User.findByIdAndDelete(req.params.userId);
    
    res.json({ message: 'Customer registration rejected and deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get approved customers
router.get('/customers/approved', auth, requireAdmin, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer', isApproved: true })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
