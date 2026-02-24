const { Client } = require('pg');

const neonUrl = 'postgresql://neondb_owner:npg_PAN04lTmaJzb@ep-withered-brook-a1yn5gjs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function resetDB() {
    const neon = new Client({
        connectionString: neonUrl,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await neon.connect();
        await neon.query("TRUNCATE users CASCADE");
        console.log("✅ All users deleted from Neon. You can now Register fresh!");
    } catch (err) {
        console.error("Reset failed:", err);
    } finally {
        await neon.end();
    }
}
resetDB();
