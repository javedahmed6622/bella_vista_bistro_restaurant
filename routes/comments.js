const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const BlogPost = require('../models/BlogPost');
const auth = require('../middleware/auth');

// Get comments for a blog post
router.get('/blog/:blogId', async (req, res) => {
  try {
    const comments = await Comment.find({ blogPost: req.params.blogId })
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a comment to a blog post
router.post('/blog/:blogId', async (req, res) => {
  try {
    const { content, author } = req.body;

    if (!content || !author) {
      return res.status(400).json({ message: 'Content and author are required' });
    }

    // Verify blog post exists
    const blogPost = await BlogPost.findById(req.params.blogId);
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const comment = new Comment({
      content,
      author: author || 'Anonymous',
      blogPost: req.params.blogId
    });

    const savedComment = await comment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a comment (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;