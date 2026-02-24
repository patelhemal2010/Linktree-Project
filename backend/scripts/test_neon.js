const { Client } = require('pg');

const neonUrl = 'postgresql://neondb_owner:npg_PAN04LTmaJzb@ep-withered-brook-a1yn5gjs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function test() {
    const neon = new Client({ connectionString: neonUrl });
    try {
        await neon.connect();
        const res = await neon.query("SELECT NOW()");
        console.log("Success! Current time on Neon:", res.rows[0].now);
    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await neon.end();
    }
}
test();
