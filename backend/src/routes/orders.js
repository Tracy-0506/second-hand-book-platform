const express = require('express');
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();
const config = require('../config');

router.post('/', auth(), async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [books] = await conn.execute('SELECT id, seller_id, price, status FROM books WHERE id = ? FOR UPDATE', [req.body.book_id]);
    const book = books[0];
    if (!book || book.status !== '在售') { await conn.rollback(); return res.status(409).json({ message: '商品不存在或已经被下单' }); }
    if (book.seller_id === req.user.id) { await conn.rollback(); return res.status(400).json({ message: '不能购买自己的商品' }); }
    const amount = Number(book.price); const platformFee = Number((amount * config.feeRate).toFixed(2)); const sellerAmount = Number((amount - platformFee).toFixed(2));
    const [order] = await conn.execute('INSERT INTO orders (book_id, buyer_id, seller_id, amount, platform_fee, seller_amount) VALUES (?, ?, ?, ?, ?, ?)', [book.id, req.user.id, book.seller_id, amount, platformFee, sellerAmount]);
    await conn.execute('UPDATE books SET status = \'已下单\' WHERE id = ?', [book.id]);
    await conn.commit(); res.status(201).json({ id: order.insertId, amount, platform_fee: platformFee, seller_amount: sellerAmount, payment: 'mock' });
  } catch (err) { await conn.rollback(); next(err); } finally { conn.release(); }
});

router.get('/mine', auth(), async (req, res, next) => { try { const [rows] = await pool.execute('SELECT * FROM orders WHERE buyer_id = ? OR seller_id = ? ORDER BY created_at DESC', [req.user.id, req.user.id]); res.json({ items: rows }); } catch (err) { next(err); } });

router.post('/:id/complete', auth(), async (req, res, next) => {
  try { const [result] = await pool.execute('UPDATE orders SET status = \'已完成\' WHERE id = ? AND buyer_id = ? AND status = \'待面交\'', [req.params.id, req.user.id]); if (!result.affectedRows) return res.status(404).json({ message: '订单不存在、状态不正确或无权限' }); await pool.execute('UPDATE books b JOIN orders o ON o.book_id = b.id SET b.status = \'已完成\' WHERE o.id = ?', [req.params.id]); res.json({ message: '已确认收货' }); } catch (err) { next(err); }
});

router.post('/:id/refund', auth(), async (req, res, next) => {
  try { const [result] = await pool.execute('UPDATE orders SET status = \'已退款\' WHERE id = ? AND buyer_id = ? AND status = \'待面交\'', [req.params.id, req.user.id]); if (!result.affectedRows) return res.status(404).json({ message: '订单不存在、已完成或无权限' }); await pool.execute('UPDATE books b JOIN orders o ON o.book_id = b.id SET b.status = \'在售\' WHERE o.id = ?', [req.params.id]); res.json({ message: '退款成功' }); } catch (err) { next(err); }
});

router.post('/:id/admin-refund', auth(), adminOnly, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute('UPDATE orders SET status = \'已退款\' WHERE id = ? AND status = \'待面交\'', [req.params.id]);
    if (!result.affectedRows) { await conn.rollback(); return res.status(404).json({ message: '订单不存在或已经处理' }); }
    await conn.execute('UPDATE books b JOIN orders o ON o.book_id = b.id SET b.status = \'在售\' WHERE o.id = ?', [req.params.id]);
    await conn.commit(); res.json({ message: '管理员已同意退款' });
  } catch (err) { await conn.rollback(); next(err); } finally { conn.release(); }
});
module.exports = router;
