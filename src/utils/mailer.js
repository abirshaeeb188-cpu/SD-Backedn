import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;
let loggedMissingConfig = false;

function getTransporter() {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    if (!loggedMissingConfig) {
      console.warn(
        "[mailer] SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing). Email delivery is unavailable.",
      );
      loggedMissingConfig = true;
    }
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }

  return transporter;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends the OTP email. Returns true only if an email was actually sent.
 */
export async function sendOtpEmail(toEmail, code, purpose) {
  const t = getTransporter();
  if (!t) return false;

  const isVerify = purpose === "verify";
  const subject = isVerify
    ? "Verify your email — Sand and Gravel Concrete Supply"
    : "Reset your password — Sand and Gravel Concrete Supply";

  const heading = isVerify ? "Verify your email address" : "Reset your password";
  const body = isVerify
    ? "Use the code below to verify your email and finish creating your account."
    : "Use the code below to reset your password.";

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#0f1f3d;">${heading}</h2>
      <p style="color:#333;">${body}</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color:#0f1f3d; background:#f5f1e6; padding: 16px 20px; text-align:center; border-radius: 8px;">${escapeHtml(code)}</p>
      <p style="color:#777; font-size: 13px;">This code expires in ${escapeHtml(env.otpTtlMinutes)} minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  await t.sendMail({
    from: env.smtp.from,
    to: toEmail,
    subject,
    html,
    text: `${heading}\n\n${body}\n\nYour code is: ${code}\nThis code expires in ${env.otpTtlMinutes} minutes.`,
  });

  return true;
}

/**
 * Sends a contact-form inquiry to the business inbox.
 * Returns false when SMTP is not configured; callers must not report success.
 */
export async function sendContactEmail({ to, name, email, phone, material, message }) {
  const t = getTransporter();
  if (!t) return false;

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeMaterial = escapeHtml(material);
  const safeMessage = escapeHtml(message);

  const subject = `New website inquiry from ${String(name).replace(/[\r\n]+/g, " ").slice(0, 120)}`;
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color:#0f1f3d;">New inquiry from the website</h2>
      <table style="width:100%; border-collapse: collapse; font-size: 14px; color:#222;">
        <tr><td style="padding:6px 0; font-weight:bold; width:120px;">Name</td><td>${safeName}</td></tr>
        <tr><td style="padding:6px 0; font-weight:bold;">Email</td><td>${safeEmail}</td></tr>
        <tr><td style="padding:6px 0; font-weight:bold;">Phone</td><td>${safePhone}</td></tr>
        <tr><td style="padding:6px 0; font-weight:bold;">Material</td><td>${safeMaterial}</td></tr>
      </table>
      <p style="font-weight:bold; margin-top:16px; margin-bottom:4px;">Message</p>
      <p style="white-space:pre-wrap; background:#f5f1e6; padding:14px 16px; border-radius:8px; color:#222;">${safeMessage}</p>
    </div>
  `;
  const text = [
    "New inquiry from the website",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Material required: ${material}`,
    "",
    "Message:",
    message,
  ].join("\n");

  await t.sendMail({
    from: env.smtp.from,
    to,
    replyTo: email,
    subject,
    text,
    html,
  });

  return true;
}
