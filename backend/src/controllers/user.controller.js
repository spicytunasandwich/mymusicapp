const { pool } = require('../config/db');

// 1. GET DISCORD-LIKE PUBLIC PROFILE BY USERNAME
exports.getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const cleanUsername = username.trim().toLowerCase();

    const userRes = await pool.query(
      `SELECT id, username, display_name, bio, avatar_url, banner_url,
              accent_color, is_verified, created_at
       FROM users
       WHERE LOWER(username) = $1`,
      [cleanUsername]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = userRes.rows[0];

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
    const { display_name, bio, accent_color, avatar_url, banner_url } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           accent_color = COALESCE($3, accent_color),
           avatar_url = COALESCE($4, avatar_url),
           banner_url = COALESCE($5, banner_url),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, username, display_name, bio, avatar_url, banner_url, accent_color, is_verified, updated_at`,
      [display_name?.trim(), bio !== undefined ? bio.trim() : null, accent_color, avatar_url, banner_url, userId]
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
      `SELECT theme_accent, theme_mode, home_widget_order, audio_quality
       FROM user_settings
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return defaults if not yet inserted
      return res.json({
        settings: {
          theme_accent: '#8B5CF6',
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

// 4. UPDATE USER SETTINGS (Custom colors, widget reordering, mode)
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme_accent, theme_mode, home_widget_order, audio_quality } = req.body;

    const result = await pool.query(
      `INSERT INTO user_settings (user_id, theme_accent, theme_mode, home_widget_order, audio_quality)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         theme_accent = COALESCE($2, user_settings.theme_accent),
         theme_mode = COALESCE($3, user_settings.theme_mode),
         home_widget_order = COALESCE($4, user_settings.home_widget_order),
         audio_quality = COALESCE($5, user_settings.audio_quality),
         updated_at = NOW()
       RETURNING theme_accent, theme_mode, home_widget_order, audio_quality`,
      [
        userId,
        theme_accent,
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

// 5. UPLOAD MEDIA (Avatar, Banner, Playlist Cover)
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

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
