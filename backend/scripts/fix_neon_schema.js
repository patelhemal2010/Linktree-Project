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

        // 1. Ensure profile_id exists in links
        await neon.query(`
            ALTER TABLE links ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
        `);
        console.log("✅ Ensured profile_id in links");

        // 2. Ensure platform exists in links
        await neon.query(`
            ALTER TABLE links ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'website';
        `);
        console.log("✅ Ensured platform in links");

        // 3. Ensure profiles table has default appearance if missing
        await neon.query(`
            ALTER TABLE profiles ALTER COLUMN appearance_settings SET DEFAULT '{}';
        `);
        console.log("✅ Ensured profiles appearance_settings default");

        console.log("Migration on Neon completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await neon.end();
    }
}
migrate();
