const { requireAuth } = require('./authMiddleware');

function requireRole(...allowedRoles) {
  return function roleMiddleware(req, res, next) {
    requireAuth(req, res, () => {
      const role = req.session && req.session.user ? req.session.user.role : null;
      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions.' });
      }
      next();
    });
  };
}

module.exports = { requireRole };
