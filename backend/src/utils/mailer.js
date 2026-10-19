const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendEmail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || 'Audira Music <onboarding@resend.dev>';

  // 1. Direct Resend API (HTTP-based, works reliably everywhere)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text
        })
      });
      const data = await res.json();
      console.log(`📧 [RESEND] Email sent to ${to}:`, data);
      return data;
    } catch (err) {
      console.error('❌ [RESEND ERROR]', err.message);
    }
  }

  // 2. SMTP Transport (if configured)
  if (transporter) {
    try {
      const info = await transporter.sendMail({ from, to, subject, text, html });
      console.log(`📧 [SMTP] Email sent to ${to}:`, info.messageId);
      return info;
    } catch (err) {
      console.error('❌ [SMTP ERROR]', err.message);
    }
  }

  // 3. Fallback: Log clearly to server console
  console.log('\n📧 ================= [LOCAL / SERVER EMAIL LOG] =================');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${text || html}`);
  console.log('================================================================\n');
  return { preview: true };
}

function getVerificationEmailHtml(displayName, code) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0C14; color: #F8FAFC; padding: 40px; border-radius: 16px; max-width: 480px; margin: auto; border: 1px solid #1E2030;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: linear-gradient(135deg, #7C3AED, #06B6D4); font-size: 24px; font-weight: bold; color: white;">A</div>
        <h1 style="color: #FFFFFF; font-size: 22px; margin-top: 16px; margin-bottom: 4px;">Verify Your Audira Account</h1>
        <p style="color: #94A3B8; font-size: 14px; margin: 0;">Hi <b>${displayName || 'there'}</b>, enter the code below to complete your registration.</p>
      </div>
      
      <div style="background: #141624; border: 1px solid #2D314D; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <div style="color: #94A3B8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Your 6-Digit Verification Code</div>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38BDF8; font-family: monospace;">${code}</div>
        <div style="color: #F43F5E; font-size: 12px; margin-top: 8px; font-weight: 500;">⏱ Expires in 10 minutes (max 5 attempts)</div>
      </div>

      <p style="color: #64748B; font-size: 12px; text-align: center; line-height: 1.5; margin: 0;">
        If you didn't create an Audira account, you can safely ignore this email.<br/>Never share this code with anyone.
      </p>
    </div>
  `;
}

function getPasswordResetEmailHtml(displayName, code) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0C14; color: #F8FAFC; padding: 40px; border-radius: 16px; max-width: 480px; margin: auto; border: 1px solid #1E2030;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: linear-gradient(135deg, #7C3AED, #F43F5E); font-size: 24px; font-weight: bold; color: white;">A</div>
        <h1 style="color: #FFFFFF; font-size: 22px; margin-top: 16px; margin-bottom: 4px;">Reset Your Password</h1>
        <p style="color: #94A3B8; font-size: 14px; margin: 0;">Hi <b>${displayName || 'there'}</b>, use the code below to reset your Audira password.</p>
      </div>
      
      <div style="background: #141624; border: 1px solid #2D314D; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <div style="color: #94A3B8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Your 6-Digit Password Reset Code</div>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #A855F7; font-family: monospace;">${code}</div>
        <div style="color: #F43F5E; font-size: 12px; margin-top: 8px; font-weight: 500;">⏱ Expires in 10 minutes (max 5 attempts)</div>
      </div>

      <p style="color: #64748B; font-size: 12px; text-align: center; line-height: 1.5; margin: 0;">
        If you didn't request a password reset, please secure your account immediately.<br/>Never share this code with anyone.
      </p>
    </div>
  `;
}

module.exports = {
  sendEmail,
  getVerificationEmailHtml,
  getPasswordResetEmailHtml
};

