import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { asyncHandler, ApiError } from "../utils/asyncHandler.js";
import { issueOtp, consumeOtp } from "../utils/otp.js";
import { signToken } from "../utils/token.js";
import env from "../config/env.js";
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidName,
  isValidOtp,
} from "../utils/validators.js";

function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone };
}

function withDebugOtp(payload, code) {
  if (env.nodeEnv !== "production" && env.otpDebugEcho) {
    return { ...payload, devOtp: code };
  }
  return payload;
}

// POST /api/auth/signup
export const signup = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body ?? {};

  if (!isValidName(name)) throw new ApiError(400, "Please enter your full name.");
  if (!isValidEmail(email)) throw new ApiError(400, "Please enter a valid email address.");
  if (!isValidPhone(phone)) throw new ApiError(400, "Please enter a valid phone number.");
  if (!isValidPassword(password)) throw new ApiError(400, "Password must be at least 6 characters.");

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await query(`SELECT id, is_verified FROM users WHERE email = $1`, [normalizedEmail]);
  if (existing.rows[0]?.is_verified) {
    throw new ApiError(409, "An account with this email already exists. Please log in.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (existing.rows[0]) {
    await query(
      `UPDATE users SET name = $1, phone = $2, password_hash = $3, updated_at = NOW()
       WHERE id = $4`,
      [name.trim(), phone.trim(), passwordHash, existing.rows[0].id],
    );
  } else {
    await query(
      `INSERT INTO users (name, email, phone, password_hash, is_verified)
       VALUES ($1, $2, $3, $4, FALSE)`,
      [name.trim(), normalizedEmail, phone.trim(), passwordHash],
    );
  }

  const code = await issueOtp(normalizedEmail, "verify");

  res.status(201).json(
    withDebugOtp(
      { message: "Account created. We've sent a 6-digit code to verify your email." },
      code,
    ),
  );
});

// POST /api/auth/request-otp { email, purpose: "verify" | "reset" }
export const requestOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body ?? {};

  if (!isValidEmail(email)) throw new ApiError(400, "Please enter a valid email address.");
  if (!["verify", "reset"].includes(purpose)) {
    throw new ApiError(400, "Invalid OTP purpose.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await query(`SELECT id FROM users WHERE email = $1`, [normalizedEmail]);

  if (rows[0]) {
    const code = await issueOtp(normalizedEmail, purpose);
    return res.json(withDebugOtp({ message: "If that account exists, a code has been sent." }, code));
  }

  res.json({ message: "If that account exists, a code has been sent." });
});

// POST /api/auth/verify-email { email, code }
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body ?? {};

  if (!isValidEmail(email)) throw new ApiError(400, "Please enter a valid email address.");
  if (!isValidOtp(code)) throw new ApiError(400, "Please enter the 6-digit code.");

  const normalizedEmail = email.trim().toLowerCase();
  const ok = await consumeOtp(normalizedEmail, "verify", code);
  if (!ok) throw new ApiError(400, "That code is incorrect or has expired.");

  const { rows } = await query(
    `UPDATE users SET is_verified = TRUE, updated_at = NOW()
     WHERE email = $1
     RETURNING id, name, email, phone`,
    [normalizedEmail],
  );

  const user = rows[0];
  if (!user) throw new ApiError(404, "No account found for that email.");

  const token = signToken(user);
  res.json({ token, user: toPublicUser(user) });
});

// POST /api/auth/login { email, password }
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!isValidEmail(email)) throw new ApiError(400, "Please enter a valid email address.");
  if (!isValidPassword(password)) throw new ApiError(400, "Password must be at least 6 characters.");

  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await query(
    `SELECT id, name, email, phone, password_hash, is_verified FROM users WHERE email = $1`,
    [normalizedEmail],
  );
  const user = rows[0];

  if (!user) throw new ApiError(401, "Invalid email or password.");

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) throw new ApiError(401, "Invalid email or password.");

  if (!user.is_verified) {
    throw new ApiError(403, "Please verify your email before logging in.");
  }

  const token = signToken(user);
  res.json({ token, user: toPublicUser(user) });
});

// POST /api/auth/reset-password { email, code, newPassword }
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body ?? {};

  if (!isValidEmail(email)) throw new ApiError(400, "Please enter a valid email address.");
  if (!isValidOtp(code)) throw new ApiError(400, "Please enter the 6-digit code.");
  if (!isValidPassword(newPassword)) throw new ApiError(400, "Password must be at least 6 characters.");

  const normalizedEmail = email.trim().toLowerCase();
  const ok = await consumeOtp(normalizedEmail, "reset", code);
  if (!ok) throw new ApiError(400, "That code is incorrect or has expired.");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { rowCount } = await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2`,
    [passwordHash, normalizedEmail],
  );

  if (!rowCount) throw new ApiError(404, "No account found for that email.");

  res.json({ message: "Password reset successfully. Please log in." });
});
