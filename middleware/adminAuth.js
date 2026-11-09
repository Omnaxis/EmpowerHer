const jwt = require('jsonwebtoken');

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No admin token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired admin token.' });
  }
}

function requireSuperAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied. Super Admin privileges required.' });
  }
  next();
}

module.exports = { authenticateAdmin, requireSuperAdmin };
