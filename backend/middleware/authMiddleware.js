const { db } = require('../database');

const userView = user => ({
  user_id: user.user_id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
  status: user.status
});

function refreshSessionUser(req) {
  if (!req.session || !req.session.user) return null;

  const currentUser = db.prepare('SELECT user_id, full_name, email, role, status FROM users WHERE user_id = ?').get(req.session.user.user_id);
  if (!currentUser || currentUser.status !== 'active') {
    if (req.session.destroy) req.session.destroy(() => {});
    return null;
  }

  req.session.user = userView(currentUser);
  return req.session.user;
}

function requireAuth(req, res, next) {
  const user = refreshSessionUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });
  next();
}

module.exports = {
  refreshSessionUser,
  requireAuth,
  userView
};
