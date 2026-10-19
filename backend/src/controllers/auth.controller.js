const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/db');
const {
  sendEmail,
  getVerificationEmailHtml,
  getPasswordResetEmailHtml
} = require('../utils/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateJwt(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET || 'super_secret_jwt_key_audira_music_2026_change_in_prod',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function generate6DigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const ACCENT_COLORS = ['#7C3AED', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#06B6D4', '#8B5CF6'];

// 1. SIGNUP (Creates unverified account and sends 6-digit code, NO ACCESS until verified)
exports.signup = async (req, res) => {
  try {
    const { email, password, username, display_name } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, username, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 alphanumeric characters.' });
    }

    // Check existing email or username
    const existing = await pool.query(
      'SELECT id, email, username, is_verified, verification_last_sent_at FROM users WHERE email = $1 OR username = $2',
      [cleanEmail, cleanUsername]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      // If user exists and is already verified, block signup
      if (match.is_verified) {
        if (match.email.toLowerCase() === cleanEmail) {
          return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
        }
        return res.status(409).json({ error: 'Username is already taken.' });
      }

      // If user exists but is NOT verified yet, update password and send a fresh code (with cooldown)
      if (match.email.toLowerCase() === cleanEmail) {
        const lastSent = match.verification_last_sent_at ? new Date(match.verification_last_sent_at).getTime() : 0;
        const cooldownRemaining = Math.max(0, Math.ceil((60000 - (Date.now() - lastSent)) / 1000));

        if (cooldownRemaining > 0) {
          return res.status(429).json({
            error: `A verification code was recently sent. Please wait ${cooldownRemaining}s before requesting again.`,
            cooldown: cooldownRemaining,
            requires_verification: true,
            email: cleanEmail
          });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const code = generate6DigitCode();
        await pool.query(
          `UPDATE users
           SET password_hash = $1, username = $2, display_name = $3,
               verification_code = $4, verification_code_expires_at = NOW() + INTERVAL '10 minutes',
               verification_attempts = 0, verification_last_sent_at = NOW()
           WHERE id = $5`,
          [passwordHash, cleanUsername, display_name?.trim() || cleanUsername, code, match.id]
        );

        sendEmail({
          to: cleanEmail,
          subject: `${code} is your Audira verification code`,
          html: getVerificationEmailHtml(display_name || cleanUsername, code),
          text: `Your Audira verification code is: ${code} (expires in 10 minutes, max 5 attempts).`
        }).catch(err => console.error('Verification email error:', err));

        return res.status(200).json({
          message: 'Account pending verification. A 6-digit code has been sent to your email.',
          email: cleanEmail,
          requires_verification: true,
          cooldown: 60
        });
      }

      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = generate6DigitCode();
    const randomAccent = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}&backgroundColor=12131f`;

    const userResult = await pool.query(
      `INSERT INTO users (
        email, password_hash, username, display_name, avatar_url,
        accent_color, is_verified, verification_code, verification_code_expires_at,
        verification_attempts, verification_last_sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, NOW() + INTERVAL '10 minutes', 0, NOW())
      RETURNING id, email, username, display_name, avatar_url, accent_color, is_verified, created_at`,
      [
        cleanEmail,
        passwordHash,
        cleanUsername,
        display_name?.trim() || cleanUsername,
        defaultAvatar,
        randomAccent,
        code
      ]
    );

    const newUser = userResult.rows[0];

    // Initialize default user settings
    await pool.query(
      `INSERT INTO user_settings (user_id, theme_accent, theme_mode)
       VALUES ($1, $2, 'dark') ON CONFLICT (user_id) DO NOTHING`,
      [newUser.id, randomAccent]
    );

    // Send 6-digit verification email
    sendEmail({
      to: newUser.email,
      subject: `${code} is your Audira verification code`,
      html: getVerificationEmailHtml(newUser.display_name, code),
      text: `Your Audira verification code is: ${code} (expires in 10 minutes, max 5 attempts).`
    }).catch(err => console.error('Verification email error:', err));

    // Notice: NO JWT TOKEN issued until verified!
    res.status(201).json({
      message: 'Account created. Please enter the 6-digit verification code sent to your email.',
      email: newUser.email,
      requires_verification: true,
      cooldown: 60
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account.' });
  }
};

// 2. VERIFY 6-DIGIT CODE
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const userRes = await pool.query(
      `SELECT u.*, s.theme_accent, s.theme_mode, s.home_widget_order
       FROM users u
       LEFT JOIN user_settings s ON s.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found with this email.' });
    }

    const user = userRes.rows[0];

    if (user.is_verified) {
      const token = generateJwt(user);
      delete user.password_hash;
      delete user.verification_code;
      delete user.reset_code;
      return res.json({ message: 'Account is already verified.', token, user });
    }

    // Check max attempts (limit to 5)
    if (user.verification_attempts >= 5) {
      return res.status(400).json({
        error: 'Maximum verification attempts exceeded. Please click "Resend Code" to receive a new code.'
      });
    }

    // Check expiration (10 min)
    if (!user.verification_code_expires_at || new Date(user.verification_code_expires_at) < new Date()) {
      return res.status(400).json({
        error: 'Verification code has expired. Please request a new code.'
      });
    }

    // Compare code
    if (user.verification_code !== cleanCode) {
      const newAttempts = (user.verification_attempts || 0) + 1;
      await pool.query(
        'UPDATE users SET verification_attempts = $1 WHERE id = $2',
        [newAttempts, user.id]
      );
      const remaining = Math.max(0, 5 - newAttempts);
      return res.status(400).json({
        error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
      });
    }

    // Valid code: mark verified and clear code
    const updatedRes = await pool.query(
      `UPDATE users
       SET is_verified = true, verification_code = NULL, verification_code_expires_at = NULL,
           verification_attempts = 0, updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, username, display_name, bio, avatar_url, banner_url, accent_color, is_verified, created_at`,
      [user.id]
    );

    const verifiedUser = updatedRes.rows[0];
    const token = generateJwt(verifiedUser);

    res.json({
      message: 'Email verified successfully! Welcome to Audira.',
      token,
      user: verifiedUser
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Failed to verify code.' });
  }
};

// 3. RESEND 6-DIGIT CODE (Verification or Reset with 60s cooldown)
exports.resendCode = async (req, res) => {
  try {
    const { email, type = 'verification' } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userRes = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    const user = userRes.rows[0];

    if (type === 'verification') {
      if (user.is_verified) {
        return res.status(400).json({ error: 'This account email is already verified. Please log in.' });
      }

      // 60-second cooldown check
      const lastSent = user.verification_last_sent_at ? new Date(user.verification_last_sent_at).getTime() : 0;
      const elapsed = Date.now() - lastSent;
      if (elapsed < 60000) {
        const remaining = Math.ceil((60000 - elapsed) / 1000);
        return res.status(429).json({
          error: `Please wait ${remaining}s before requesting another code.`,
          cooldown: remaining
        });
      }

      const code = generate6DigitCode();
      await pool.query(
        `UPDATE users
         SET verification_code = $1, verification_code_expires_at = NOW() + INTERVAL '10 minutes',
             verification_attempts = 0, verification_last_sent_at = NOW()
         WHERE id = $2`,
        [code, user.id]
      );

      sendEmail({
        to: user.email,
        subject: `${code} is your Audira verification code`,
        html: getVerificationEmailHtml(user.display_name, code),
        text: `Your Audira verification code is: ${code} (expires in 10 minutes, max 5 attempts).`
      }).catch(err => console.error('Resend verification email error:', err));

      return res.json({
        message: 'A fresh 6-digit verification code has been sent to your email.',
        cooldown: 60
      });
    }

    if (type === 'reset') {
      // 60-second cooldown check for password reset
      const lastSent = user.reset_last_sent_at ? new Date(user.reset_last_sent_at).getTime() : 0;
      const elapsed = Date.now() - lastSent;
      if (elapsed < 60000) {
        const remaining = Math.ceil((60000 - elapsed) / 1000);
        return res.status(429).json({
          error: `Please wait ${remaining}s before requesting another reset code.`,
          cooldown: remaining
        });
      }

      const code = generate6DigitCode();
      await pool.query(
        `UPDATE users
         SET reset_code = $1, reset_code_expires_at = NOW() + INTERVAL '10 minutes',
             reset_attempts = 0, reset_last_sent_at = NOW()
         WHERE id = $2`,
        [code, user.id]
      );

      sendEmail({
        to: user.email,
        subject: `${code} is your Audira password reset code`,
        html: getPasswordResetEmailHtml(user.display_name, code),
        text: `Your Audira password reset code is: ${code} (expires in 10 minutes, max 5 attempts).`
      }).catch(err => console.error('Resend reset email error:', err));

      return res.json({
        message: 'A fresh 6-digit password reset code has been sent to your email.',
        cooldown: 60
      });
    }

    res.status(400).json({ error: 'Invalid code type specified.' });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ error: 'Failed to resend code.' });
  }
};

// 4. LOGIN (Blocks access if unverified, sends code with cooldown)
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
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
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(400).json({ error: 'This account was created with Google. Please log in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // REQUIRE VERIFICATION: No access until verified!
    if (!user.is_verified) {
      const lastSent = user.verification_last_sent_at ? new Date(user.verification_last_sent_at).getTime() : 0;
      const elapsed = Date.now() - lastSent;
      let cooldown = 0;

      // If last sent > 60s ago or expired, send a fresh code
      if (elapsed >= 60000 || !user.verification_code || (user.verification_code_expires_at && new Date(user.verification_code_expires_at) < new Date())) {
        const code = generate6DigitCode();
        await pool.query(
          `UPDATE users
           SET verification_code = $1, verification_code_expires_at = NOW() + INTERVAL '10 minutes',
               verification_attempts = 0, verification_last_sent_at = NOW()
           WHERE id = $2`,
          [code, user.id]
        );

        sendEmail({
          to: user.email,
          subject: `${code} is your Audira verification code`,
          html: getVerificationEmailHtml(user.display_name, code),
          text: `Your Audira verification code is: ${code} (expires in 10 minutes).`
        }).catch(err => console.error('Verification email error:', err));
        cooldown = 60;
      } else {
        cooldown = Math.ceil((60000 - elapsed) / 1000);
      }

      return res.status(403).json({
        error: 'Your email address is not verified yet. Please enter the 6-digit code sent to your email.',
        requires_verification: true,
        email: user.email,
        cooldown
      });
    }

    const token = generateJwt(user);
    delete user.password_hash;
    delete user.verification_code;
    delete user.reset_code;

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

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID.' });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    });
    const payload = ticket.getPayload();

    const { sub: googleId, email, name, picture } = payload;
    if (!email) {
      return res.status(400).json({ error: 'Google account does not have an email address.' });
    }

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
      if (!user.google_id || !user.is_verified) {
        await pool.query('UPDATE users SET google_id = $1, is_verified = true WHERE id = $2', [googleId, user.id]);
        user.google_id = googleId;
        user.is_verified = true;
      }
    } else {
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
    delete user.verification_code;
    delete user.reset_code;

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

// 6. FORGOT PASSWORD (Sends 6-digit reset code with 10 min expiry & 60s cooldown)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const result = await pool.query(
      'SELECT id, email, display_name, reset_last_sent_at FROM users WHERE LOWER(email) = LOWER($1)',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      // Don't leak user existence
      return res.json({
        message: 'If an account exists with this email, a 6-digit reset code has been sent.',
        email: cleanEmail,
        requires_reset_code: true,
        cooldown: 60
      });
    }

    const user = result.rows[0];
    const lastSent = user.reset_last_sent_at ? new Date(user.reset_last_sent_at).getTime() : 0;
    const elapsed = Date.now() - lastSent;

    if (elapsed < 60000) {
      const remaining = Math.ceil((60000 - elapsed) / 1000);
      return res.status(429).json({
        error: `Please wait ${remaining}s before requesting another reset code.`,
        cooldown: remaining,
        email: cleanEmail,
        requires_reset_code: true
      });
    }

    const code = generate6DigitCode();
    await pool.query(
      `UPDATE users
       SET reset_code = $1, reset_code_expires_at = NOW() + INTERVAL '10 minutes',
           reset_attempts = 0, reset_last_sent_at = NOW()
       WHERE id = $2`,
      [code, user.id]
    );

    sendEmail({
      to: user.email,
      subject: `${code} is your Audira password reset code`,
      html: getPasswordResetEmailHtml(user.display_name, code),
      text: `Your Audira password reset code is: ${code} (expires in 10 minutes, max 5 attempts).`
    }).catch(err => console.error('Password reset email error:', err));

    res.json({
      message: 'A 6-digit password reset code has been sent to your email.',
      email: user.email,
      requires_reset_code: true,
      cooldown: 60
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
};

// 7. RESET PASSWORD (Validates 6-digit code, max 5 attempts, updates password)
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) {
      return res.status(400).json({ error: 'Email, 6-digit code, and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const userRes = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid password reset request.' });
    }

    const user = userRes.rows[0];

    // Check attempts limit (5)
    if (user.reset_attempts >= 5) {
      return res.status(400).json({
        error: 'Maximum reset attempts exceeded. Please request a fresh reset code.'
      });
    }

    // Check expiration (10 min)
    if (!user.reset_code_expires_at || new Date(user.reset_code_expires_at) < new Date()) {
      return res.status(400).json({
        error: 'Password reset code has expired (10 minute limit). Please request a new code.'
      });
    }

    // Compare code
    if (user.reset_code !== cleanCode) {
      const newAttempts = (user.reset_attempts || 0) + 1;
      await pool.query('UPDATE users SET reset_attempts = $1 WHERE id = $2', [newAttempts, user.id]);
      const remaining = Math.max(0, 5 - newAttempts);
      return res.status(400).json({
        error: `Invalid reset code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
      });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      `UPDATE users
       SET password_hash = $1, reset_code = NULL, reset_code_expires_at = NULL,
           reset_attempts = 0, is_verified = true, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    res.json({ message: 'Password has been reset successfully! You can now log in.' });
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
