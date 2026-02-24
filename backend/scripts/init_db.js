const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // ensure .env is loaded

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "linkhub",
  password: "admin",
  port: 5432,
});

const sqlFile = path.join(__dirname, '../database.sql');

async function initDB() {
  try {
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('Running database initialization...');
    await pool.query(sql);
    console.log('✅ Database initialized successfully!');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  } finally {
    await pool.end();
  }
}

initDB();
