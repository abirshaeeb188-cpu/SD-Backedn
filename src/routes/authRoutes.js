import { Router } from "express";
import {
  signup,
  requestOtp,
  verifyEmail,
  login,
  resetPassword,
} from "../controllers/authController.js";

const router = Router();

router.post("/signup", signup);
router.post("/request-otp", requestOtp);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/reset-password", resetPassword);

export default router;
