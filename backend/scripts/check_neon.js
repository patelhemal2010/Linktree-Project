const { Client } = require('pg');

const neonUrl = 'postgresql://neondb_owner:npg_PAN04lTmaJzb@ep-withered-brook-a1yn5gjs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function check() {
    const neon = new Client({
        connectionString: neonUrl,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await neon.connect();
        const res = await neon.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log("Tables on Neon:", res.rows.map(r => r.table_name));

        const countRes = await neon.query("SELECT COUNT(*) FROM users");
        console.log("User count on Neon:", countRes.rows[0].count);

        const linkRes = await neon.query("SELECT COUNT(*) FROM links");
        console.log("Link count on Neon:", linkRes.rows[0].count);
    } catch (err) {
        console.error("Check failed:", err);
    } finally {
        await neon.end();
    }
}
check();
