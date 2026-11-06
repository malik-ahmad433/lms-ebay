const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Configure Local File Upload Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Upload Video (Admin Only)
router.post('/upload', authMiddleware, adminMiddleware, upload.single('video'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const videoUrl = `/uploads/${req.file.filename}`;

    const video = new Video({ title, description, videoUrl });
    await video.save();

    res.status(201).json({ message: 'Video uploaded successfully', video });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Videos (Only Approved Students & Admins)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'student' && req.user.status !== 'approved') {
      return res.status(403).json({ message: 'Unauthorized. Account pending or blocked.' });
    }
    const videos = await Video.find().sort({ uploadedAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Video (Admin Only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (video && fs.existsSync(`.${video.videoUrl}`)) {
      fs.unlinkSync(`.${video.videoUrl}`);
    }
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;