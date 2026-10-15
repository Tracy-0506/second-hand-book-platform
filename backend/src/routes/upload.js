const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { auth } = require('../middleware/auth');
const { checkImage } = require('../services/contentSafety');
const router = express.Router();
fs.mkdirSync(config.uploadDir, { recursive: true });
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({ dest: config.uploadDir, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, allowed.has(file.mimetype)) });
router.post('/', auth(), upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: '请上传 JPG、PNG 或 WEBP 图片，大小不超过5MB' });
  try {
    await checkImage(req.file.path, req.user.openid);
    const ext = path.extname(req.file.originalname).toLowerCase() || '.bin';
    const finalName = `${req.file.filename}${ext}`;
    fs.renameSync(req.file.path, path.join(config.uploadDir, finalName));
    res.status(201).json({ url: `${config.publicBaseUrl}/uploads/${finalName}` });
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
});
module.exports = router;
