const path = require('path');
require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`缺少环境变量 ${name}`);
  return value;
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: required('JWT_SECRET'),
  mockWechatLogin: process.env.MOCK_WECHAT_LOGIN === 'true',
  contentSafetyEnabled: process.env.WX_CONTENT_SAFETY_ENABLED === 'true',
  feeRate: Number.isFinite(Number(process.env.FEE_RATE)) && Number(process.env.FEE_RATE) >= 0 && Number(process.env.FEE_RATE) < 1 ? Number(process.env.FEE_RATE) : 0.15,
  wxAppId: process.env.WX_APPID || '',
  wxSecret: process.env.WX_SECRET || '',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || 'uploads'),
  adminOpenids: (process.env.ADMIN_OPENIDS || '').split(',').map(value => value.trim()).filter(Boolean),
  adminSchool: process.env.ADMIN_SCHOOL || '重庆邮电大学',
  mysql: { host: required('MYSQL_HOST', '127.0.0.1'), port: Number(process.env.MYSQL_PORT || 3306), user: required('MYSQL_USER'), password: process.env.MYSQL_PASSWORD || '', database: required('MYSQL_DATABASE') }
};
