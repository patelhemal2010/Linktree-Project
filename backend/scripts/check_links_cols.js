const { Client } = require('pg');

const neonUrl = 'postgresql://neondb_owner:npg_PAN04lTmaJzb@ep-withered-brook-a1yn5gjs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkColumns() {
    const neon = new Client({
        connectionString: neonUrl,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await neon.connect();
        const res = await neon.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'links'");
        console.log("Columns in 'links' table:");
        res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
    } catch (err) {
        console.error("Check failed:", err);
    } finally {
        await neon.end();
    }
}
checkColumns();
