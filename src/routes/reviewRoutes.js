import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listReviews, createReview } from "../controllers/reviewController.js";

const router = Router();

router.get("/", listReviews);
router.post("/", requireAuth, createReview);

export default router;
