import { randomInt } from "node:crypto";
import { query } from "../config/db.js";
import env from "../config/env.js";
import { sendOtpEmail } from "./mailer.js";

export function generateOtp() {
  return String(randomInt(100000, 1000000));
}

export async function issueOtp(email, purpose) {
  const code = generateOtp();
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + env.otpTtlMinutes * 60 * 1000);

  await query(
    `INSERT INTO otp_codes (email, code, purpose, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [normalizedEmail, code, purpose, expiresAt],
  );

  let emailed = false;
  try {
    emailed = await sendOtpEmail(normalizedEmail, code, purpose);
  } catch (err) {
    // Never log the OTP itself. Email addresses and OTPs are sensitive auth data.
    console.error("[OTP] Email delivery failed:", err.message);
  }

  if (!emailed && env.nodeEnv === "production") {
    // Do not claim that an OTP was delivered when SMTP is unavailable.
    throw new Error("OTP email delivery is unavailable.");
  }

  if (!emailed && env.nodeEnv !== "production") {
    console.warn("[OTP] Email was not delivered; configure SMTP for local testing.");
  }

  return code;
}

/**
 * Verifies a code against the most recent, unconsumed OTP for that
 * email + purpose, and marks it consumed on success.
 */
export async function consumeOtp(email, purpose, code) {
  const normalizedEmail = email.trim().toLowerCase();

  const { rows } = await query(
    `SELECT id, code, expires_at FROM otp_codes
     WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail, purpose],
  );

  const record = rows[0];
  if (!record) return false;
  if (new Date(record.expires_at).getTime() < Date.now()) return false;
  if (record.code !== String(code).trim()) return false;

  await query("UPDATE otp_codes SET consumed_at = NOW() WHERE id = $1", [
    record.id,
  ]);
  return true;
}
