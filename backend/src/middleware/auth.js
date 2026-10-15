const jwt = require('jsonwebtoken');
const config = require('../config');

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token && !required) return next();
    if (!token) return res.status(401).json({ message: '请先登录' });
    try { req.user = jwt.verify(token, config.jwtSecret); next(); }
    catch { return res.status(401).json({ message: '登录状态已失效' }); }
  };
}

function adminOnly(req, res, next) { if (req.user?.role !== 'admin') return res.status(403).json({ message: '需要管理员权限' }); next(); }
module.exports = { auth, adminOnly };
