const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');
const { checkText } = require('../services/contentSafety');
const router = express.Router();
const schools = ['重庆邮电大学', '重庆工商大学', '重庆第二师范学院'];
const conditions = ['全新', '九成新', '八成新', '七成新', '有明显使用痕迹'];

router.get('/', async (req, res, next) => {
  try {
    const { school, keyword = '' } = req.query;
    if (school && !schools.includes(school)) return res.status(400).json({ message: '学校不在允许范围内' });
    const params = []; let sql = 'SELECT b.id, b.seller_id, b.title, b.isbn, b.price, b.`condition`, b.school, b.campus, b.note, b.images, b.status, b.created_at FROM books b WHERE b.status = \'在售\'';
    if (school) { sql += ' AND b.school = ?'; params.push(school); }
    if (keyword) { sql += ' AND b.title LIKE ?'; params.push(`%${keyword}%`); }
    sql += ' ORDER BY b.created_at DESC';
    const [rows] = await pool.execute(sql, params); res.json({ items: rows });
  } catch (err) { next(err); }
});

router.post('/', auth(), async (req, res, next) => {
  try {
    const { title, isbn = null, price, condition, school, campus, note = null, images = [] } = req.body;
    if (!title || !campus || !Number.isFinite(Number(price)) || Number(price) <= 0) return res.status(400).json({ message: '书名、校区和大于0的价格不能为空' });
    if (!conditions.includes(condition) || !schools.includes(school) || !Array.isArray(images) || images.length > 9) return res.status(400).json({ message: '商品字段不合法' });
    await checkText({ content: `${title.trim()}\n${note || ''}`, openid: req.user.openid });
    const [result] = await pool.execute('INSERT INTO books (seller_id, title, isbn, price, `condition`, school, campus, note, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.user.id, title.trim(), isbn, Number(price), condition, school, campus.trim(), note, JSON.stringify(images)]);
    res.status(201).json({ id: result.insertId });
  } catch (err) { next(err); }
});

router.delete('/:id', auth(), async (req, res, next) => {
  try {
    const [result] = await pool.execute('UPDATE books SET status = \'已下架\' WHERE id = ? AND (seller_id = ? OR ? = \'admin\')', [req.params.id, req.user.id, req.user.role]);
    if (!result.affectedRows) return res.status(404).json({ message: '商品不存在或无权限' });
    res.json({ message: '商品已下架' });
  } catch (err) { next(err); }
});
module.exports = router;
