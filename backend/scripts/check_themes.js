const pool = require('../src/config/db');

async function check() {
    try {
        const res = await pool.query('SELECT * FROM themes');
        console.log('Themes count:', res.rowCount);
        console.log('Themes:', res.rows);
    } catch (err) {
        console.error('Error checking themes:', err);
    } finally {
        pool.end();
    }
}

check();
