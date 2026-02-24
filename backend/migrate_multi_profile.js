const pool = require("./src/config/db");

async function migrate() {
    try {
        console.log("Starting multi-profile migration...");

        // 1. Create profiles table
        await pool.query(`
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
        console.log("✅ Created profiles table");

        // 2. Add profile_id to links table
        await pool.query(`
            ALTER TABLE links ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
        `);
        console.log("✅ Added profile_id to links");

        // 3. Migrate existing users to profiles
        const users = await pool.query("SELECT id, username, bio, profile_image, appearance_settings FROM users");
        for (const user of users.rows) {
            // Check if profile already exists for this user (to avoid duplicates if run twice)
            const existing = await pool.query("SELECT id FROM profiles WHERE user_id = $1 AND slug = $2", [user.id, user.username]);

            if (existing.rows.length === 0) {
                const profileResult = await pool.query(
                    `INSERT INTO profiles (user_id, slug, bio, profile_image, appearance_settings, is_primary) 
                     VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
                    [user.id, user.username, user.bio, user.profile_image, user.appearance_settings]
                );

                const profileId = profileResult.rows[0].id;

                // 4. Update links to point to this profile
                await pool.query("UPDATE links SET profile_id = $1 WHERE user_id = $2 AND profile_id IS NULL", [profileId, user.id]);
                console.log(`✅ Migrated user ${user.username} to primary profile`);
            }
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
