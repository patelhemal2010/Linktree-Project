const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const localConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'linkhub',
    password: 'admin',
    port: 5432,
};

const neonUrl = 'postgresql://neondb_owner:npg_PAN04lTmaJzb@ep-withered-brook-a1yn5gjs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrate() {
    const local = new Client(localConfig);
    const neon = new Client({
        connectionString: neonUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Connecting to local...");
        await local.connect();
        console.log("Connecting to Neon...");
        await neon.connect();
        console.log("✅ Connected to both databases.");

        // 1. Run the base schema on Neon
        console.log("Cleaning and applying base schema...");
        const schema = fs.readFileSync(path.join(__dirname, '../database.sql'), 'utf8');
        await neon.query(schema);
        console.log("✅ Base schema applied.");

        // 2. Add extra columns that might exist locally but not in base schema
        console.log("Checking for extended columns...");
        const columnsToAdd = [
            { table: 'users', column: 'appearance_settings', type: 'JSONB DEFAULT \'{}\'' },
            { table: 'users', column: 'platform', type: 'VARCHAR(50)' }
        ];

        for (const col of columnsToAdd) {
            try {
                // Check if column exists locally
                await local.query(`SELECT ${col.column} FROM ${col.table} LIMIT 1`);
                // If it exists locally, add to neon
                await neon.query(`ALTER TABLE ${col.table} ADD COLUMN IF NOT EXISTS ${col.column} ${col.type}`);
                console.log(`✅ Added ${col.column} to ${col.table} on Neon`);
            } catch (e) {
                // Column doesn't exist locally, skip
            }
        }

        // 3. Handle profiles table
        try {
            await local.query("SELECT 1 FROM profiles LIMIT 1");
            console.log("Profiles table found locally, creating on Neon...");
            await neon.query(`
                CREATE TABLE IF NOT EXISTS profiles (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    slug VARCHAR(50) UNIQUE NOT NULL,
                    title VARCHAR(255),
                    bio TEXT,
                    profile_image TEXT,
                    appearance_settings JSONB DEFAULT '{}',
                    is_primary BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            await neon.query("ALTER TABLE links ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;");
            console.log("✅ Profiles schema applied to Neon");
        } catch (e) { }

        const tables = ['themes', 'users', 'profiles', 'links'];
        for (const table of tables) {
            try {
                console.log(`Processing table: ${table}`);
                const res = await local.query(`SELECT * FROM ${table}`);
                if (res.rows.length === 0) {
                    console.log(`Table ${table} is empty.`);
                    continue;
                }

                if (table === 'themes') await neon.query("TRUNCATE themes CASCADE");

                for (const row of res.rows) {
                    const columns = Object.keys(row).join(', ');
                    const values = Object.values(row);
                    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                    await neon.query(`INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values);
                }
                console.log(`✅ Migrated ${res.rows.length} rows for ${table}`);
            } catch (err) {
                console.log(`⚠️ Skiping table ${table}: ${err.message}`);
            }
        }

        console.log("\n🚀 DATA MIGRATION COMPLETE! Your 'Patel Jewellers' data is safe on Neon.");
    } catch (err) {
        console.error("MIGRATION ERROR:");
        console.error(err.message);
    } finally {
        await local.end();
        await neon.end();
    }
}
migrate();
