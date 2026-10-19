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
  const from = process.env.EMAIL_FROM || 'Audira Music <noreply@audiramusic.com>';

  if (!transporter) {
    console.log('\n📧 ================= [LOCAL EMAIL PREVIEW] =================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html}`);
    console.log('==========================================================\n');
    return { preview: true };
  }

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
}

module.exports = { sendEmail };
