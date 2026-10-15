const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');
const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { code, school, nickname, avatar } = req.body;
    const validSchools = ['重庆邮电大学', '重庆工商大学', '重庆第二师范学院'];
    if (!code || !validSchools.includes(school)) return res.status(400).json({ message: 'code 和合法学校不能为空' });
    let openid;
    if (config.mockWechatLogin && code.startsWith('dev-')) openid = `mock-${code.slice(4)}`;
    else {
      if (!config.wxAppId || !config.wxSecret) return res.status(500).json({ message: '未配置微信 AppID 或 AppSecret' });
      const result = await axios.get('https://api.weixin.qq.com/sns/jscode2session', { params: { appid: config.wxAppId, secret: config.wxSecret, js_code: code, grant_type: 'authorization_code' } });
      if (result.data.errcode || !result.data.openid) return res.status(401).json({ message: '微信登录凭证无效' });
      openid = result.data.openid;
    }
    const [rows] = await pool.execute('SELECT id, openid, nickname, avatar, school, role FROM users WHERE openid = ?', [openid]);
    let user = rows[0];
    if (!user) {
      const [created] = await pool.execute('INSERT INTO users (openid, nickname, avatar, school) VALUES (?, ?, ?, ?)', [openid, nickname || null, avatar || null, school]);
      user = { id: created.insertId, openid, nickname: nickname || null, avatar: avatar || null, school, role: 'user' };
    } else if (user.school !== school) {
      await pool.execute('UPDATE users SET school = ?, nickname = COALESCE(?, nickname), avatar = COALESCE(?, avatar) WHERE id = ?', [school, nickname || null, avatar || null, user.id]);
      user.school = school;
    }
    const token = jwt.sign({ id: user.id, openid: user.openid, role: user.role, school: user.school }, config.jwtSecret, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) { next(err); }
});

module.exports = router;
