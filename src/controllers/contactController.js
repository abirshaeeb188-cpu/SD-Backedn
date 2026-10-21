import env from "../config/env.js";
import { asyncHandler, ApiError } from "../utils/asyncHandler.js";
import { sendContactEmail } from "../utils/mailer.js";
import {
  isValidEmail,
  isValidName,
  isValidPhone,
  isValidMessage,
} from "../utils/validators.js";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function tooManyRequests(key) {
  const now = Date.now();
  const timestamps = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(key, timestamps);
  return timestamps.length > MAX_PER_WINDOW;
}

// POST /api/contact { name, email, phone, material, message }
export const sendContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, material, message } = req.body ?? {};

  if (!isValidName(name)) throw new ApiError(400, "Please enter your name.");
  if (!isValidEmail(email))
    throw new ApiError(400, "Please enter a valid email address.");
  if (!isValidPhone(phone))
    throw new ApiError(400, "Please enter a valid phone number.");
  if (typeof material !== "string" || material.trim().length === 0) {
    throw new ApiError(400, "Please select the material you need.");
  }
  if (!isValidMessage(message)) {
    throw new ApiError(
      400,
      "Please add a few more details (min. 10 characters).",
    );
  }

  const limiterKey = email.trim().toLowerCase();
  if (tooManyRequests(limiterKey)) {
    throw new ApiError(
      429,
      "Too many messages sent. Please try again in a little while.",
    );
  }

  const sent = await sendContactEmail({
    to: env.contactInboxEmail,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    material: material.trim(),
    message: message.trim(),
  });

  if (!sent) {
    throw new ApiError(
      503,
      "The contact service is temporarily unavailable. Please try again later or contact us by phone.",
    );
  }

  res.status(200).json({
    message: "Your message has been sent. We'll get back to you soon.",
  });
});
