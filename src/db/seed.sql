-- Optional demo seed data. Password for the demo user is "password123".
-- The hash below is a bcrypt hash of "password123" (10 rounds).

INSERT INTO users (name, email, phone, password_hash, is_verified)
VALUES (
  'Khalid Al Mazrouei',
  'khalid@example.com',
  '0501234567',
  '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q9dq5cHFXn9NkV9r0Cc4qzy9r9x0m',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO reviews (user_id, rating, title, message)
SELECT id, 5, 'Excellent Service',
  'Very reliable sand and gravel delivery. Materials arrived on time and matched exactly what we ordered.'
FROM users WHERE email = 'khalid@example.com'
ON CONFLICT (user_id) DO NOTHING;
