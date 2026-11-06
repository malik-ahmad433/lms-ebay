const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Student Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword, status: 'pending', role: 'student' });
    await user.save();

    res.status(201).json({ message: 'Registration successful! Account is pending admin approval.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login (Student & Admin)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.role === 'student' && user.status !== 'approved') {
      return res.status(403).json({ 
        message: `Account status is '${user.status}'. Access denied until Admin approves your account.`,
        status: user.status 
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, status: user.status },
      process.env.JWT_SECRET || 'lms_secret_key',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { name: user.name, email: user.email, role: user.role, status: user.status } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;