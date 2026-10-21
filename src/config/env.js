import "dotenv/config";

const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET || "";

if (nodeEnv === "production" && (!jwtSecret || jwtSecret === "dev-secret-change-me")) {
  throw new Error("JWT_SECRET must be set to a strong, unique value in production.");
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  jwtSecret: jwtSecret || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES) || 5,
  // Never permit OTPs to be returned by API responses in production.
  otpDebugEcho: nodeEnv !== "production" && (process.env.OTP_DEBUG_ECHO ?? "false") === "true",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_SECURE ?? "false") === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Sand and Gravel Concrete Supply <no-reply@example.com>",
  },
  contactInboxEmail: process.env.CONTACT_INBOX_EMAIL || "",
};

if (nodeEnv === "production" && !env.contactInboxEmail) {
  throw new Error("CONTACT_INBOX_EMAIL must be configured in production.");
}

export default env;
