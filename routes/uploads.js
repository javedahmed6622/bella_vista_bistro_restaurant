const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, name);
  }
});

// File filter - only allow PNG, JPG, JPEG, SVG
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, and SVG files are allowed'), false);
  }
};

// Configure multer with file size limit (5MB) and file filter
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Single file upload endpoint
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const url = '/uploads/' + req.file.filename;
    res.json({ 
      url,
      filename: req.file.filename,
      size: req.file.size,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload error: ' + error.message });
  }
});

// Error handler for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File size exceeds 5MB limit' });
    }
    return res.status(400).json({ message: 'Upload error: ' + error.message });
  }
  
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  
  next();
});

module.exports = router;
