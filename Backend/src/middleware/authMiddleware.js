const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const auth = req.headers['authorization'];
    if (!auth) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const [type, token] = auth.split(' ');
    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Invalid authorization format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // ✅ Ensure next() is always called if verification succeeds
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};  