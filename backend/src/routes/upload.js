const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { auth } = require('../middleware/auth');
const { checkImage } = require('../services/contentSafety');
const router = express.Router();
fs.mkdirSync(config.uploadDir, { recursive: true });
const extensionByMime = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const allowed = new Set(Object.keys(extensionByMime));
const upload = multer({ dest: config.uploadDir, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, allowed.has(file.mimetype)) });

async function detectImageMime(filePath) {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const header = Buffer.alloc(32);
    await handle.read(header, 0, header.length, 0);
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return 'image/jpeg';
    if (header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
    if (header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
    return null;
  } finally { await handle.close(); }
}

router.post('/', auth(), upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: '请上传 JPG、PNG 或 WEBP 图片，大小不超过5MB' });
  try {
    const detectedMime = await detectImageMime(req.file.path);
    if (detectedMime !== req.file.mimetype) {
      const error = new Error('图片类型校验失败，请上传真实的 JPG、PNG 或 WEBP 图片');
      error.code = 'INVALID_IMAGE_TYPE';
      throw error;
    }
    await checkImage(req.file.path, req.user.openid);
    const ext = extensionByMime[detectedMime];
    const finalName = `${req.file.filename}${ext}`;
    fs.renameSync(req.file.path, path.join(config.uploadDir, finalName));
    res.status(201).json({ url: `${config.publicBaseUrl}/uploads/${finalName}` });
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
});
module.exports = router;
