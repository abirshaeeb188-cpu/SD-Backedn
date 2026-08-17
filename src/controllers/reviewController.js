import { query } from "../config/db.js";
import { asyncHandler, ApiError } from "../utils/asyncHandler.js";

// GET /api/reviews
export const listReviews = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.id, r.rating, r.title, r.message, r.created_at, u.name AS user_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     ORDER BY r.created_at DESC`,
  );

  const reviews = rows.map((r) => ({
    id: r.id,
    name: r.user_name,
    rating: r.rating,
    title: r.title,
    message: r.message,
    date: r.created_at,
  }));

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  res.json({ reviews, average });
});

// POST /api/reviews   { rating, title, message }
export const createReview = asyncHandler(async (req, res) => {
  const { rating, title, message } = req.body ?? {};

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new ApiError(400, "Please select a star rating.");
  }
  if (typeof title !== "string" || title.trim().length < 3) {
    throw new ApiError(400, "Please add a short title.");
  }
  if (typeof message !== "string" || message.trim().length < 10) {
    throw new ApiError(400, "Please write at least 10 characters.");
  }

  const existing = await query(`SELECT id FROM reviews WHERE user_id = $1`, [req.user.id]);
  if (existing.rows[0]) {
    throw new ApiError(409, "You've already submitted a review.");
  }

  const { rows } = await query(
    `INSERT INTO reviews (user_id, rating, title, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, rating, title, message, created_at`,
    [req.user.id, ratingNum, title.trim(), message.trim()],
  );

  const r = rows[0];
  res.status(201).json({
    review: {
      id: r.id,
      name: req.user.name,
      rating: r.rating,
      title: r.title,
      message: r.message,
      date: r.created_at,
    },
  });
});
