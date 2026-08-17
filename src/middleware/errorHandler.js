import { ApiError } from "../utils/asyncHandler.js";
import env from "../config/env.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err instanceof ApiError ? err.statusCode : err.statusCode || 500;
  const message = statusCode === 500 && env.nodeEnv === "production"
    ? "Something went wrong. Please try again."
    : err.message || "Something went wrong.";

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ message });
}
