import nodemailer from "nodemailer";
import { env } from "../config/env.js";

class EmailService {
  constructor() {
    this.transporter = null;
    this.isEthereal = false;
  }

  /**
   * Initializes or retrieves the nodemailer transporter.
   * Prioritizes configured SMTP credentials (e.g., Gmail, Brevo, custom SMTP).
   * Falls back to Ethereal test account in development when credentials are not configured.
   */
  async getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const smtpUser = env.SMTP_USER;
    const smtpPass = env.SMTP_PASS;
    const smtpHost = env.SMTP_HOST;
    const smtpPort = env.SMTP_PORT || 587;
    const emailService = env.EMAIL_SERVICE;

    // Check if real SMTP credentials are provided
    if (smtpUser && smtpPass) {
      const transportConfig = emailService
        ? {
            service: emailService,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          }
        : {
            host: smtpHost || (smtpUser.includes("@gmail.com") ? "smtp.gmail.com" : "localhost"),
            port: Number(smtpPort),
            secure: env.SMTP_SECURE || Number(smtpPort) === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          };

      this.transporter = nodemailer.createTransport(transportConfig);
      this.isEthereal = false;
      console.log(`[EmailService] Configured SMTP transporter for ${smtpUser} via ${emailService || smtpHost || "SMTP"}`);
      return this.transporter;
    }

    // In development without credentials, create an Ethereal test inbox so sending still succeeds
    if (env.NODE_ENV !== "production") {
      console.warn(
        "[EmailService] WARNING: No SMTP_USER and SMTP_PASS set in Backend/.env.\n" +
        "Creating an Ethereal test email account so password reset emails can be previewed.\n" +
        "To receive emails in a real inbox, please add SMTP credentials to Backend/.env."
      );

      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.isEthereal = true;
        console.log(`[EmailService] Ethereal test email account ready: ${testAccount.user}`);
        return this.transporter;
      } catch (err) {
        console.error("[EmailService] Failed to create Ethereal test account:", err.message);
      }
    }

    // Fallback stub transporter if all else fails
    this.transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
    return this.transporter;
  }

  /**
   * Returns the "from" email header.
   */
  getFromHeader() {
    if (env.EMAIL_FROM) {
      return env.EMAIL_FROM;
    }
    if (env.SMTP_USER) {
      return `"BuildManage System" <${env.SMTP_USER}>`;
    }
    return '"BuildManage System" <noreply@buildmanage.local>';
  }

  /**
   * Sends a styled password reset email.
   */
  async sendPasswordResetEmail({ to, token, resetUrl, userName }) {
    try {
      const transporter = await this.getTransporter();
      const from = this.getFromHeader();
      const displayName = userName || "BuildManage User";

      const subject = "Reset Your BuildManage Password";

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #071d36 0%, #0c3666 100%);
      padding: 32px 36px;
      text-align: center;
    }
    .brand-logo {
      display: inline-block;
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      line-height: 44px;
      text-align: center;
      color: #38bdf8;
      font-weight: 800;
      font-size: 20px;
      margin-bottom: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .brand-title {
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .brand-subtitle {
      color: #94a3b8;
      font-size: 12px;
      margin-top: 4px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .content {
      padding: 36px 36px 32px 36px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 28px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
      letter-spacing: 0.01em;
    }
    .expiry-note {
      background-color: #f8fafc;
      border-left: 4px solid #0284c7;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 13px;
      color: #64748b;
      margin: 24px 0;
      line-height: 1.5;
    }
    .fallback-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      margin-top: 24px;
    }
    .fallback-text {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .fallback-url {
      font-size: 12px;
      color: #0284c7;
      word-break: break-all;
      line-height: 1.5;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 36px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-logo">BM</div>
        <h1 class="brand-title">BuildManage</h1>
        <p class="brand-subtitle">Construction Management System</p>
      </div>

      <div class="content">
        <h2 class="greeting">Hello, ${displayName}</h2>
        <p class="message">
          We received a request to reset the password for your BuildManage account associated with <strong>${to}</strong>.
          Click the button below to choose a new password:
        </p>

        <div class="button-container">
          <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" class="button">Reset Password</a>
        </div>

        <div class="expiry-note">
          <strong>Security Notice:</strong> This reset link will expire in <strong>1 hour</strong>. For your security, it can only be used once.
        </div>

        <p class="message" style="margin-bottom: 0; font-size: 13px;">
          If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
        </p>

        <div class="fallback-section">
          <p class="fallback-text">If the button above does not work, copy and paste this link into your web browser:</p>
          <a href="${resetUrl}" class="fallback-url">${resetUrl}</a>
        </div>
      </div>

      <div class="footer">
        <p style="margin: 0 0 6px 0;">&copy; ${new Date().getFullYear()} BuildManage. All rights reserved.</p>
        <p style="margin: 0;">This is an automated system message. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      const textContent = `
Hello ${displayName},

We received a request to reset the password for your BuildManage account (${to}).

To reset your password, visit the link below:
${resetUrl}

This link is valid for 1 hour. If you did not request this reset, you can safely ignore this message.

— BuildManage System
      `.trim();

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[EmailService] Password reset email sent to ${to}. MessageId: ${info.messageId}`);
      console.log(`[EmailService] Reset link: ${resetUrl}`);

      let previewUrl = null;
      if (this.isEthereal) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`[EmailService] Preview Ethereal Email in Browser: ${previewUrl}`);
        }
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
        resetUrl,
      };
    } catch (error) {
      console.error(`[EmailService] Failed to send password reset email to ${to}:`, error.message);
      throw error;
    }
  }

  /**
   * Sends an email verification link.
   */
  async sendVerificationEmail({ to, token, verificationUrl, userName }) {
    try {
      const transporter = await this.getTransporter();
      const from = this.getFromHeader();
      const displayName = userName || "BuildManage User";

      const subject = "Verify Your BuildManage Email Address";

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Verify Your Email</title>
  <style>
    body { background-color: #f1f5f9; font-family: sans-serif; color: #1e293b; padding: 20px; }
    .card { max-width: 540px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
    .button { display: inline-block; background: #0284c7; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Verify your email address</h2>
    <p>Hello ${displayName},</p>
    <p>Please click the button below to verify your email address for your BuildManage account:</p>
    <p><a href="${verificationUrl}" class="button">Verify Email</a></p>
    <p>Or paste this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
  </div>
</body>
</html>
      `;

      const textContent = `Hello ${displayName},\n\nPlease verify your email by visiting:\n${verificationUrl}\n\n— BuildManage`;

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[EmailService] Verification email sent to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[EmailService] Failed to send verification email to ${to}:`, error.message);
      throw error;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
