import { verifyToken } from "../utils/token.js";
import { query } from "../config/db.js";
import { ApiError } from "../utils/asyncHandler.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new ApiError(401, "Missing or invalid Authorization header.");
    }

    const payload = verifyToken(token);

    const { rows } = await query(
      `SELECT id, name, email, phone, is_verified FROM users WHERE id = $1`,
      [payload.sub],
    );

    const user = rows[0];
    if (!user) throw new ApiError(401, "User no longer exists.");

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, "Session expired or invalid. Please log in again."));
  }
}
