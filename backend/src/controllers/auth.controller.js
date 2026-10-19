const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/db');
const { sendEmail } = require('../utils/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateJwt(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET || 'super_secret_jwt_key_audira_music_2026_change_in_prod',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

const ACCENT_COLORS = ['#7C3AED', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#06B6D4', '#8B5CF6'];

// 1. SIGNUP
exports.signup = async (req, res) => {
  try {
    const { email, password, username, display_name } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, username, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 alphanumeric characters.' });
    }

    // Check existing email or username
    const existing = await pool.query(
      'SELECT id, email, username FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase().trim(), cleanUsername]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      if (match.email.toLowerCase() === email.toLowerCase().trim()) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const randomAccent = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}&backgroundColor=12131f`;

    const userResult = await pool.query(
      `INSERT INTO users (
        email, password_hash, username, display_name, avatar_url,
        accent_color, is_verified, verification_token, verification_token_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8)
      RETURNING id, email, username, display_name, bio, avatar_url, banner_url, accent_color, is_verified, created_at`,
      [
        email.toLowerCase().trim(),
        passwordHash,
        cleanUsername,
        display_name?.trim() || cleanUsername,
        defaultAvatar,
        randomAccent,
        verificationToken,
        verificationExpires
      ]
    );

    const newUser = userResult.rows[0];

    // Initialize default user settings
    await pool.query(
      `INSERT INTO user_settings (user_id, theme_accent, theme_mode)
       VALUES ($1, $2, 'dark') ON CONFLICT (user_id) DO NOTHING`,
      [newUser.id, randomAccent]
    );

    // Send verification email
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    sendEmail({
      to: newUser.email,
      subject: 'Verify your Audira Music account',
      html: `
        <div style="font-family: sans-serif; background: #0D0E15; color: #F8FAFC; padding: 40px; border-radius: 12px; max-width: 520px; margin: auto;">
          <h1 style="color: #8B5CF6; margin-bottom: 8px;">Welcome to Audira 🎵</h1>
          <p style="color: #94A3B8; font-size: 16px;">Hi <b>${newUser.display_name}</b>, your unlimited music journey begins now.</p>
          <p style="margin: 24px 0;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #7C3AED, #06B6D4); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p style="color: #64748B; font-size: 13px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
      text: `Welcome to Audira! Verify your email here: ${verifyUrl}`
    }).catch(err => console.error('Failed to send verification email:', err));

    const token = generateJwt(newUser);

    res.status(201).json({
      message: 'Account created successfully. Verification email sent.',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account.' });
  }
};

// 2. VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const result = await pool.query(
      `UPDATE users
       SET is_verified = true, verification_token = NULL, verification_token_expires_at = NULL, updated_at = NOW()
       WHERE verification_token = $1 AND verification_token_expires_at > NOW()
       RETURNING id, email, username, display_name, is_verified`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    res.json({ message: 'Email verified successfully!', user: result.rows[0] });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email.' });
  }
};

// 3. RESEND VERIFICATION EMAIL
exports.resendVerification = async (req, res) => {
  try {
    const email = req.user ? req.user.email : req.body.email;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const userRes = await pool.query(
      'SELECT id, email, display_name, is_verified FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    const user = userRes.rows[0];
    if (user.is_verified) {
      return res.status(400).json({ error: 'This account email is already verified.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users SET verification_token = $1, verification_token_expires_at = $2 WHERE id = $3`,
      [verificationToken, verificationExpires, user.id]
    );

    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your Audira Music account',
      html: `<p>Click here to verify your Audira account: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
      text: `Verify your email: ${verifyUrl}`
    });

    res.json({ message: 'Verification email resent successfully.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
};

// 4. LOGIN
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // email or username
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required.' });
    }

    const result = await pool.query(
      `SELECT u.*, s.theme_accent, s.theme_mode, s.home_widget_order
       FROM users u
       LEFT JOIN user_settings s ON s.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1) OR LOWER(u.username) = LOWER($1)`,
      [identifier.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(400).json({ error: 'This account was registered via Google. Please log in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateJwt(user);
    delete user.password_hash;
    delete user.verification_token;
    delete user.reset_token;

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in.' });
  }
};

// 5. GOOGLE LOGIN / SIGNUP
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Google idToken is required.' });
    }

    let payload;
    if (process.env.GOOGLE_CLIENT_ID) {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } else {
      // Decode unverified token payload if GOOGLE_CLIENT_ID not yet set (local dev stub)
      const parts = idToken.split('.');
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      } else {
        return res.status(400).json({ error: 'Invalid Google token format.' });
      }
    }

    const { sub: googleId, email, name, picture } = payload;
    if (!email) {
      return res.status(400).json({ error: 'Google token does not contain an email.' });
    }

    // Check if user exists by google_id or email
    let userRes = await pool.query(
      `SELECT u.*, s.theme_accent, s.theme_mode, s.home_widget_order
       FROM users u
       LEFT JOIN user_settings s ON s.user_id = u.id
       WHERE u.google_id = $1 OR LOWER(u.email) = LOWER($2)`,
      [googleId, email]
    );

    let user;
    if (userRes.rows.length > 0) {
      user = userRes.rows[0];
      // If found by email but not linked to google_id, link it now
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = $1, is_verified = true WHERE id = $2', [googleId, user.id]);
        user.google_id = googleId;
        user.is_verified = true;
      }
    } else {
      // Create new user from Google profile
      const baseUsername = email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase();
      const uniqueUsername = `${baseUsername.slice(0, 20)}_${crypto.randomBytes(3).toString('hex')}`;
      const randomAccent = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

      const insertRes = await pool.query(
        `INSERT INTO users (
          email, google_id, username, display_name, avatar_url, accent_color, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id, email, username, display_name, bio, avatar_url, banner_url, accent_color, is_verified, created_at`,
        [email.toLowerCase(), googleId, uniqueUsername, name || uniqueUsername, picture || '', randomAccent]
      );

      user = insertRes.rows[0];
      await pool.query(
        `INSERT INTO user_settings (user_id, theme_accent, theme_mode) VALUES ($1, $2, 'dark')`,
        [user.id, randomAccent]
      );
    }

    const token = generateJwt(user);
    delete user.password_hash;
    delete user.verification_token;
    delete user.reset_token;

    res.json({
      message: 'Google login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google login verification failed.' });
  }
};

// 6. FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const result = await pool.query('SELECT id, email, display_name FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (result.rows.length === 0) {
      // Don't disclose account existence for security
      return res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    sendEmail({
      to: user.email,
      subject: 'Reset your Audira Music password',
      html: `
        <div style="font-family: sans-serif; background: #0D0E15; color: #F8FAFC; padding: 40px; border-radius: 12px; max-width: 520px; margin: auto;">
          <h2 style="color: #8B5CF6;">Password Reset Request</h2>
          <p>Hi ${user.display_name}, you requested a password reset for your Audira account.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #7C3AED, #06B6D4); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color: #64748B; font-size: 13px;">This link is valid for 1 hour. If you didn't request this, ignore this email.</p>
        </div>
      `,
      text: `Reset your Audira password: ${resetUrl}`
    }).catch(err => console.error('Failed to send reset email:', err));

    res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
};

// 7. RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL, updated_at = NOW()
       WHERE reset_token = $2 AND reset_token_expires_at > NOW()
       RETURNING id, email, username`,
      [passwordHash, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};

// 8. GET CURRENT LOGGED IN USER (/api/v1/auth/me)
exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.display_name, u.bio, u.avatar_url,
              u.banner_url, u.accent_color, u.is_verified, u.created_at,
              s.theme_accent, s.theme_mode, s.home_widget_order, s.audio_quality
       FROM users u
       LEFT JOIN user_settings s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
};
