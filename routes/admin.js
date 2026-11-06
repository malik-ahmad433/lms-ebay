const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Get all students & statistics
router.get('/students', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const totalStudents = students.length;
    const pendingStudents = students.filter(s => s.status === 'pending').length;
    const totalVideos = await Video.countDocuments();

    res.json({ students, stats: { totalStudents, pendingStudents, totalVideos } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Student Status (Approve, Reject, Block)
router.put('/students/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ message: `Student status updated to ${status}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Student
router.delete('/students/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;