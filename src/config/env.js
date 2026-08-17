import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES) || 5,
  otpDebugEcho: (process.env.OTP_DEBUG_ECHO ?? "true") === "true",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_SECURE ?? "false") === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Sand and Gravel Concrete Supply <no-reply@example.com>",
  },
  contactInboxEmail: process.env.CONTACT_INBOX_EMAIL || "meeralbloshi46@gmail.com",
};

export default env;
