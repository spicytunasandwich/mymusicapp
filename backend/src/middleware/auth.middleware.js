const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_audira_music_2026_change_in_prod');

    const result = await pool.query(
      `SELECT id, email, username, display_name, bio, avatar_url, banner_url, accent_color, is_verified, created_at
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_audira_music_2026_change_in_prod');
      const result = await pool.query(
        `SELECT id, email, username, display_name, display_name_font, bio, avatar_url, banner_url, accent_color, is_verified, created_at
         FROM users WHERE id = $1`,
        [decoded.userId]
      );
      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }
  } catch (ignored) {
    // Guest access continues without req.user
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
