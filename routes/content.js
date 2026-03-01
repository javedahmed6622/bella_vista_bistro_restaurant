const express = require('express');
const router = express.Router();
const HeroImage = require('../models/HeroImage');
const FeaturedImage = require('../models/FeaturedImage');
const BlogPost = require('../models/BlogPost');
const TeamMember = require('../models/TeamMember');

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ===== HERO IMAGE ROUTES =====
router.get('/hero-images', async (req, res) => {
  try {
    const images = await HeroImage.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/hero-images', verifyAdmin, async (req, res) => {
  try {
    const { url, filename } = req.body;
    const heroImage = new HeroImage({ url, filename });
    await heroImage.save();
    res.status(201).json(heroImage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/hero-images/:id', verifyAdmin, async (req, res) => {
  try {
    const { url, filename } = req.body;
    const heroImage = await HeroImage.findByIdAndUpdate(
      req.params.id,
      { url, filename, updatedAt: new Date() },
      { new: true }
    );
    res.json(heroImage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/hero-images/:id', verifyAdmin, async (req, res) => {
  try {
    await HeroImage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hero image deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== FEATURED IMAGE ROUTES =====
router.get('/featured-images', async (req, res) => {
  try {
    const images = await FeaturedImage.find().sort({ position: 1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/featured-images', verifyAdmin, async (req, res) => {
  try {
    const { url, filename, position } = req.body;
    const featuredImage = new FeaturedImage({ url, filename, position });
    await featuredImage.save();
    res.status(201).json(featuredImage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/featured-images/:id', verifyAdmin, async (req, res) => {
  try {
    const { url, filename, position } = req.body;
    const featuredImage = await FeaturedImage.findByIdAndUpdate(
      req.params.id,
      { url, filename, position, updatedAt: new Date() },
      { new: true }
    );
    res.json(featuredImage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/featured-images/:id', verifyAdmin, async (req, res) => {
  try {
    await FeaturedImage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Featured image deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== BLOG POST ROUTES =====
router.get('/blog-posts', async (req, res) => {
  try {
    const posts = await BlogPost.find({ status: 'published' })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/blog-posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('createdBy', 'name');
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/blog-posts', verifyAdmin, async (req, res) => {
  try {
    const { title, content, imageUrl, imageFilename, status } = req.body;
    const post = new BlogPost({
      title,
      content,
      imageUrl,
      imageFilename,
      status: status || 'published',
      createdBy: req.user.id
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/blog-posts/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, content, imageUrl, imageFilename, status } = req.body;
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { title, content, imageUrl, imageFilename, status, updatedAt: new Date() },
      { new: true }
    );
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/blog-posts/:id', verifyAdmin, async (req, res) => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== TEAM MEMBER ROUTES =====
router.get('/team-members', async (req, res) => {
  try {
    const members = await TeamMember.find().sort({ createdAt: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/team-members', verifyAdmin, async (req, res) => {
  try {
    const { name, position, imageUrl, imageFilename, bio } = req.body;
    const member = new TeamMember({ name, position, imageUrl, imageFilename, bio });
    await member.save();
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/team-members/:id', verifyAdmin, async (req, res) => {
  try {
    const { name, position, imageUrl, imageFilename, bio } = req.body;
    const member = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { name, position, imageUrl, imageFilename, bio, updatedAt: new Date() },
      { new: true }
    );
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/team-members/:id', verifyAdmin, async (req, res) => {
  try {
    await TeamMember.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team member deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
