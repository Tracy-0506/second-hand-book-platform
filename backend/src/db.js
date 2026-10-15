const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({ ...config.mysql, waitForConnections: true, connectionLimit: 10, decimalNumbers: true, charset: 'utf8mb4' });
module.exports = pool;
