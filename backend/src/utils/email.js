/**
 * Email Service — Nodemailer + Gmail SMTP
 *
 * Sends transactional emails (invites, password resets, notifications).
 * Uses Gmail SMTP with an App Password — no paid email service required.
 *
 * Setup:
 *  1. Enable 2-Step Verification on your Google account
 *  2. Go to myaccount.google.com → Security → App Passwords
 *  3. Generate a 16-character App Password for "Mail"
 *  4. Set GMAIL_USER and GMAIL_APP_PASSWORD in your environment variables
 */

const nodemailer = require('nodemailer');

// Create the transporter once and reuse it
let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

const fromAddress = process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@agency.com';

/**
 * Send an invite email to a new user.
 * @param {string} toEmail - Recipient email address
 * @param {string} toName  - Recipient name
 * @param {string} token   - Invite token (included in the link)
 * @param {string} role    - User role (for display purposes)
 */
async function sendInviteEmail(toEmail, toName, token, role) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const link = `${frontendUrl}/accept-invite?token=${token}`;

  await getTransporter().sendMail({
    from: fromAddress,
    to: toEmail,
    subject: "You've been invited to Agency Management App",
    html: `
      <h2>Welcome to Agency Management App</h2>
      <p>Hi ${toName},</p>
      <p>You've been invited to join the agency as a <strong>${role.replace('_', ' ')}</strong>.</p>
      <p>Click the button below to set your password and activate your account:</p>
      <p><a href="${link}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Accept Invitation</a></p>
      <p>This link expires in 72 hours.</p>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
    `,
  });
}

/**
 * Send a password reset email.
 * @param {string} toEmail - Recipient email address
 * @param {string} toName  - Recipient name
 * @param {string} token   - Reset token (included in the link)
 */
async function sendPasswordResetEmail(toEmail, toName, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const link = `${frontendUrl}/reset-password?token=${token}`;

  await getTransporter().sendMail({
    from: fromAddress,
    to: toEmail,
    subject: 'Reset your Agency Management App password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${toName},</p>
      <p>We received a request to reset your password. Click the button below to choose a new password:</p>
      <p><a href="${link}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `,
  });
}

module.exports = { sendInviteEmail, sendPasswordResetEmail };
