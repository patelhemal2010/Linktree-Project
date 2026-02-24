const { Pool } = require('pg');

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "linkhub",
    password: "admin",
    port: 5432,
});

async function updateSchema() {
    try {
        console.log('Adding platform column to links table...');
        await pool.query('ALTER TABLE links ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT \'website\';');
        console.log('Successfully updated schema.');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await pool.end();
    }
}

updateSchema();
