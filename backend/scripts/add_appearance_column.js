const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database');
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS appearance_settings JSONB DEFAULT '{}';`);
        console.log('Column "appearance_settings" added successfully.');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await client.end();
    }
}

run();
