const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

app.get('/health', (req, res) => res.json({ ok: true, service: 'campus-book-market-api' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: '图片不能超过5MB' });
  if (err.code === 'CONTENT_REJECTED') return res.status(400).json({ code: err.code, message: err.message });
  if (err.message?.includes('内容安全审核已开启')) return res.status(503).json({ code: 'CONTENT_SAFETY_NOT_CONFIGURED', message: err.message });
  if (err.response?.data?.errcode) return res.status(502).json({ code: 'WECHAT_CONTENT_SAFETY_ERROR', message: err.message });
  res.status(500).json({ message: config.port === 3000 && process.env.NODE_ENV !== 'production' ? err.message : '服务器内部错误' });
});

app.listen(config.port, () => console.log(`API running at http://localhost:${config.port}`));
