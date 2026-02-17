/**
 * Authentication middleware stub
 * Replace with JWT verification when user auth is implemented.
 *
 * Future implementation:
 *   const jwt = require('jsonwebtoken');
 *   const token = req.headers.authorization?.split(' ')[1];
 *   const decoded = jwt.verify(token, process.env.JWT_SECRET);
 *   req.user = decoded;
 */

const authMiddleware = (req, res, next) => {
  // STUB: No-op until auth is implemented
  // req.user = { id: 'anonymous', plan: 'free' };
  next();
};

const requirePlan = (plan) => (req, res, next) => {
  // STUB: Future plan-based feature gating
  // if (req.user.plan !== plan) return res.status(403).json({ error: 'Upgrade required' });
  next();
};

module.exports = { authMiddleware, requirePlan };