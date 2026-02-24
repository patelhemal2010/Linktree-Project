const { Client } = require('pg');

const neonUrl = 'postgresql://neondb_owner:npg_PAN04lTmaJzb@ep-withered-brook-a1yn5gjs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function verifyUsers() {
    const neon = new Client({
        connectionString: neonUrl,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await neon.connect();
        const res = await neon.query("SELECT username, email FROM users");
        console.log("Users in Neon Database:");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await neon.end();
    }
}
verifyUsers();
