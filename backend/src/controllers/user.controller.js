const fs = require('fs');
const { pool } = require('../config/db');

// Activity-based badge evaluator & synchronizer
async function syncUserBadges(user) {
  if (!user || !user.id) return;
  try {
    const candidates = [];

    // 1. Early Adopter: joined early
    candidates.push({
      key: 'early_adopter',
      name: 'Early Adopter',
      description: 'Joined Audira during platform launch.',
      icon: 'Sparkles',
      category: 'milestone',
      earned: true
    });

    // 2. Old Listener: registered community member
    const createdAt = new Date(user.created_at).getTime();
    const daysSinceJoined = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceJoined >= 0.1) {
      candidates.push({
        key: 'old_listener',
        name: 'Old Listener',
        description: 'Active community member with listening history.',
        icon: 'Headphones',
        category: 'loyalty',
        earned: true
      });
    }

    // 3. Playlist Maker: created at least 1 playlist
    const plRes = await pool.query('SELECT COUNT(*)::int as count FROM playlists WHERE user_id = $1', [user.id]);
    if (plRes.rows[0].count >= 1) {
      candidates.push({
        key: 'playlist_maker',
        name: 'Playlist Maker',
        description: 'Curated and shared personalized music playlists.',
        icon: 'Music2',
        category: 'creator',
        earned: true
      });
    }

    // 4. Night Owl: streams or active during late-night hours (10 PM - 5 AM)
    const currentHour = new Date().getHours();
    if (currentHour >= 22 || currentHour <= 5) {
      candidates.push({
        key: 'night_owl',
        name: 'Night Owl',
        description: 'Streams deep into the late-night and midnight hours.',
        icon: 'Moon',
        category: 'habit',
        earned: true
      });
    }

    // 5. Sound Collector: liked tracks count
    const likedRes = await pool.query('SELECT COUNT(*)::int as count FROM liked_songs WHERE user_id = $1', [user.id]);
    if (likedRes.rows[0].count >= 3) {
      candidates.push({
        key: 'sound_collector',
        name: 'Sound Collector',
        description: 'Saved 3 or more favorite tracks to personal library.',
        icon: 'Heart',
        category: 'collector',
        earned: true
      });
    }

    // 6. Verified Pioneer: email verified
    if (user.is_verified) {
      candidates.push({
        key: 'verified_pioneer',
        name: 'Verified Pioneer',
        description: 'Successfully verified authentic Audira account.',
        icon: 'ShieldCheck',
        category: 'trust',
        earned: true
      });
    }

    // Insert earned badges if not yet recorded
    for (const badge of candidates) {
      if (badge.earned) {
        await pool.query(
          `INSERT INTO user_badges (user_id, badge_key, badge_name, description, icon, category)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, badge_key) DO NOTHING`,
          [user.id, badge.key, badge.name, badge.description, badge.icon, badge.category]
        );
      }
    }
  } catch (err) {
    console.warn('Badge sync note:', err.message);
  }
}

// 1. GET DISCORD-LIKE PUBLIC PROFILE BY USERNAME
exports.getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const cleanUsername = username.trim().toLowerCase();

    const userRes = await pool.query(
      `SELECT id, username, display_name, display_name_font, bio, avatar_url, banner_url,
              accent_color, is_verified, created_at
       FROM users
       WHERE LOWER(username) = $1`,
      [cleanUsername]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = userRes.rows[0];

    // Automatically evaluate and synchronize earned activity badges in database
    await syncUserBadges(user);

    // Retrieve all earned badges from DB
    const badgesRes = await pool.query(
      `SELECT badge_key, badge_name, description, icon, category, earned_at
       FROM user_badges
       WHERE user_id = $1
       ORDER BY earned_at ASC`,
      [user.id]
    );

    // Public playlists created by this user
    const playlistsRes = await pool.query(
      `SELECT p.id, p.title, p.description, p.cover_url, p.created_at,
              COUNT(pt.track_id)::int as track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
       WHERE p.user_id = $1 AND p.is_public = true
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [user.id]
    );

    // Followed artists
    const followedArtistsRes = await pool.query(
      `SELECT a.id, a.name, a.avatar_url, a.verified
       FROM followed_artists fa
       JOIN artists a ON a.id = fa.artist_id
       WHERE fa.user_id = $1
       ORDER BY fa.created_at DESC
       LIMIT 10`,
      [user.id]
    );

    res.json({
      profile: {
        ...user,
        badges: badgesRes.rows,
        playlists: playlistsRes.rows,
        followed_artists: followedArtistsRes.rows
      }
    });
  } catch (error) {
    console.error('Public profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
};

// 2. UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { display_name, display_name_font, bio, accent_color, avatar_url, banner_url } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET display_name = COALESCE($1, display_name),
           display_name_font = COALESCE($2, display_name_font),
           bio = COALESCE($3, bio),
           accent_color = COALESCE($4, accent_color),
           avatar_url = COALESCE($5, avatar_url),
           banner_url = COALESCE($6, banner_url),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, email, username, display_name, display_name_font, bio, avatar_url, banner_url, accent_color, is_verified, updated_at`,
      [
        display_name?.trim(),
        display_name_font?.trim(),
        bio !== undefined ? bio.trim() : null,
        accent_color,
        avatar_url,
        banner_url,
        userId
      ]
    );

    res.json({
      message: 'Profile updated successfully.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// 3. GET USER SETTINGS & CUSTOMIZATION
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT theme_accent, gradient_top, gradient_bottom, theme_mode, home_widget_order, audio_quality
       FROM user_settings
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return defaults if not yet inserted
      return res.json({
        settings: {
          theme_accent: '#8B5CF6',
          gradient_top: '#1A102E',
          gradient_bottom: '#08090E',
          theme_mode: 'dark',
          home_widget_order: ['recently_played', 'featured_playlists', 'top_mixes', 'recommended_artists', 'new_releases'],
          audio_quality: 'high'
        }
      });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
};

// 4. UPDATE USER SETTINGS (Custom colors, gradient stops, widget reordering, mode)
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme_accent, gradient_top, gradient_bottom, theme_mode, home_widget_order, audio_quality } = req.body;

    const result = await pool.query(
      `INSERT INTO user_settings (user_id, theme_accent, gradient_top, gradient_bottom, theme_mode, home_widget_order, audio_quality)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         theme_accent = COALESCE($2, user_settings.theme_accent),
         gradient_top = COALESCE($3, user_settings.gradient_top),
         gradient_bottom = COALESCE($4, user_settings.gradient_bottom),
         theme_mode = COALESCE($5, user_settings.theme_mode),
         home_widget_order = COALESCE($6, user_settings.home_widget_order),
         audio_quality = COALESCE($7, user_settings.audio_quality),
         updated_at = NOW()
       RETURNING theme_accent, gradient_top, gradient_bottom, theme_mode, home_widget_order, audio_quality`,
      [
        userId,
        theme_accent,
        gradient_top,
        gradient_bottom,
        theme_mode,
        home_widget_order ? JSON.stringify(home_widget_order) : null,
        audio_quality
      ]
    );

    res.json({
      message: 'Settings updated successfully.',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
};

// 5. UPLOAD MEDIA (Avatar, Banner, Playlist Cover) with Permanent Database Persistence
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    // Persist file binary into PostgreSQL media_uploads so Render deploys / container wipes NEVER delete avatars/banners
    const fileBuffer = fs.readFileSync(req.file.path);
    await pool.query(
      `INSERT INTO media_uploads (filename, mime_type, data)
       VALUES ($1, $2, $3)
       ON CONFLICT (filename) DO UPDATE SET data = $3, mime_type = $2`,
      [req.file.filename, req.file.mimetype, fileBuffer]
    );

    const host = req.get('host');
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : req.protocol);
    const fileUrl = `${proto}://${host}/uploads/${req.file.filename}`;

    res.status(201).json({
      message: 'Image uploaded successfully.',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ error: 'Failed to upload image.' });
  }
};
