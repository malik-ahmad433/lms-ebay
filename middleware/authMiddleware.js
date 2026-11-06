const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'lms_secret_key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid authentication token.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access forbidden. Admin authorization required.' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };