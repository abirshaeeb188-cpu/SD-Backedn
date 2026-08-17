import { query } from "../config/db.js";
import { asyncHandler, ApiError } from "../utils/asyncHandler.js";
import { isValidName } from "../utils/validators.js";

function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone };
}

// GET /api/users/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

// PUT /api/users/me   { name }
export const updateMe = asyncHandler(async (req, res) => {
  const { name } = req.body ?? {};
  if (!isValidName(name)) throw new ApiError(400, "Please enter your full name.");

  const { rows } = await query(
    `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, name, email, phone`,
    [name.trim(), req.user.id],
  );

  res.json({ user: toPublicUser(rows[0]) });
});
