const { Client } = require('pg');

const neonUrl = 'postgresql://neondb_owner:npg_PAN04lTmaJzb@ep-withered-brook-a1yn5gjs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrate() {
    const neon = new Client({
        connectionString: neonUrl,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await neon.connect();
        console.log("Connected to Neon.");

        // Make title and url nullable in links table
        await neon.query(`
            ALTER TABLE links ALTER COLUMN title DROP NOT NULL;
            ALTER TABLE links ALTER COLUMN url DROP NOT NULL;
        `);
        console.log("✅ Made title and url nullable in links table");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await neon.end();
    }
}
migrate();
