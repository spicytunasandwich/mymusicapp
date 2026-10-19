const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  console.log('🌱 Seeding database with initial data...');
  try {
    // 1. Run seed.sql for genres, artists, albums, tracks
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    await pool.query(seedSql);

    // 2. Create demo user with hashed password
    const demoPasswordHash = await bcrypt.hash('password123', 10);
    const userRes = await pool.query(
      `INSERT INTO users (
        id, email, password_hash, username, display_name, bio,
        avatar_url, banner_url, accent_color, is_verified
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) ON CONFLICT (email) DO UPDATE SET password_hash = $3
      RETURNING id`,
      [
        '00000000-0000-0000-0000-000000000001',
        'demo@audira.io',
        demoPasswordHash,
        'audiophile',
        'Alex Rivers',
        'Music curator, producer & synth enthusiast 🎧 Exploring sound waves at 432Hz.',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200',
        '#7C3AED',
        true
      ]
    );

    const userId = userRes.rows[0].id;

    // 3. Insert demo user settings
    await pool.query(
      `INSERT INTO user_settings (user_id, theme_accent, theme_mode)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, '#8B5CF6', 'dark']
    );

    // 4. Create sample playlist for demo user
    const playlistRes = await pool.query(
      `INSERT INTO playlists (id, user_id, title, description, cover_url, is_public)
       VALUES (
         '66666666-6666-6666-6666-666666666661',
         $1,
         'Midnight Coding Sessions',
         'Synthwave, Lo-Fi and ambient sounds to boost productivity and flow state.',
         'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
         true
       ) ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [userId]
    );

    // 5. Add tracks to demo playlist
    await pool.query(
      `INSERT INTO playlist_tracks (playlist_id, track_id, position)
       VALUES
       ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', 1),
       ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555553', 2),
       ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555554', 3)
       ON CONFLICT (playlist_id, track_id) DO NOTHING`
    );

    // 6. Like a song for demo user
    await pool.query(
      `INSERT INTO liked_songs (user_id, track_id)
       VALUES ($1, '55555555-5555-5555-5555-555555555551')
       ON CONFLICT (user_id, track_id) DO NOTHING`,
      [userId]
    );

    console.log('✅ Seeding complete!');
    console.log('✨ Demo User Created: demo@audira.io / password123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
