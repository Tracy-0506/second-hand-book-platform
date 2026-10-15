const pool = require('../src/db');
const config = require('../src/config');

async function main() {
  if (!config.adminOpenids.length) throw new Error('ADMIN_OPENIDS 为空，拒绝创建管理员');
  for (const openid of config.adminOpenids) {
    const [rows] = await pool.execute('SELECT id FROM users WHERE openid = ?', [openid]);
    if (rows[0]) {
      await pool.execute('UPDATE users SET role = \'admin\' WHERE id = ?', [rows[0].id]);
      console.log(`已提升为管理员：${openid}`);
    } else {
      await pool.execute('INSERT INTO users (openid, school, role) VALUES (?, ?, \'admin\')', [openid, config.adminSchool]);
      console.log(`已创建管理员：${openid}`);
    }
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
