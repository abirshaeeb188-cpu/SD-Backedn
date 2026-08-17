# Desert Sands Builders — Backend API

Node.js + Express + PostgreSQL backend for the Sand and Gravel Concrete Supply website
(signup/login/email verification/forgot-password with OTP, profile, and customer reviews).

## Stack
- Node.js (ES modules) + Express
- PostgreSQL (`pg`)
- JWT auth (`jsonwebtoken`)
- Password hashing (`bcryptjs`)

## 1. Install dependencies
```bash
cd backend
npm install
```

## 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
- **Database (Neon):** set `DATABASE_URL` to your Neon connection string
  (Neon dashboard → your project → **Connect** → copy the pooled connection
  string, e.g. `postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`).
  SSL is handled automatically for you.
- **JWT_SECRET:** set a long random string.
- **SMTP_*:** set these so OTP codes are actually emailed to users (see
  "Sending OTP emails" below). Optional while testing.

## 3. Create the database schema
No need to `createdb` manually on Neon — the database already exists
(usually named `neondb`). Just run the migration against it:
```bash
npm run db:migrate
```

## 4. (Optional) Seed demo data
```bash
npm run db:seed
# demo login: khalid@example.com / password123
```

## 5. Start the API
```bash
npm run dev     # auto-restarts on change (Node's built-in --watch)
# or
npm start
```
The API listens on `http://localhost:5000` by default (`PORT` in `.env`).

## API Overview

| Method | Endpoint                  | Auth | Description                          |
|--------|----------------------------|------|--------------------------------------|
| POST   | /api/auth/signup           | No   | Create an unverified account, sends a "verify" OTP |
| POST   | /api/auth/request-otp      | No   | `{ email, purpose: "verify" \| "reset" }` — (re)send an OTP |
| POST   | /api/auth/verify-email     | No   | `{ email, code }` — verifies account, returns JWT + user |
| POST   | /api/auth/login             | No   | `{ email, password }` — returns JWT + user |
| POST   | /api/auth/reset-password   | No   | `{ email, code, newPassword }` |
| GET    | /api/users/me               | Yes  | Current user profile |
| PUT    | /api/users/me               | Yes  | `{ name }` — update profile |
| GET    | /api/reviews                | No   | List all reviews + average rating |
| POST   | /api/reviews                | Yes  | `{ rating, title, message }` — one review per user |

Authenticated requests must include `Authorization: Bearer <token>`.

## How OTP delivery works (signup + forgot password)

Both flows work the same way under the hood:

1. **Signup** (`POST /api/auth/signup`) or **Forgot Password**
   (`POST /api/auth/request-otp` with `purpose: "reset"`) is called.
2. The backend generates a random 6-digit code, saves it in the `otp_codes`
   table with a 5-minute expiry (`OTP_TTL_MINUTES`), and calls
   `src/utils/mailer.js` to email it to the user via SMTP.
3. **If `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` are set** in `.env`, a real email
   is sent to the user's inbox with the code — this is the production path.
4. **If SMTP isn't configured yet**, nothing is emailed. The code only shows
   up in the server console (`[OTP] verify code for user@example.com: 123456`),
   and — only while `OTP_DEBUG_ECHO=true` — is also included in the API
   JSON response as `devOtp`, which the frontend shows in a toast so you can
   test the whole flow without a mailbox.
5. The user submits the code to `POST /api/auth/verify-email` (signup) or
   `POST /api/auth/reset-password` (forgot password). The backend checks it
   against `otp_codes`, marks it consumed, and either verifies the account
   (issuing a JWT) or updates the password.

**To make emails actually arrive in users' inboxes:** fill in the `SMTP_*`
variables in `.env` (see the Gmail/Resend examples in `.env.example`), then
set `OTP_DEBUG_ECHO=false` so codes stop being exposed in API responses.
`src/utils/mailer.js` uses `nodemailer` under the hood — swap in any SMTP
provider (Gmail, Resend, SendGrid, Mailgun, AWS SES, etc.) without touching
any other file.
