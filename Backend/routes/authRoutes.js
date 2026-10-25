import express from "express";
import { authController } from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateResendVerification,
} from "../validations/authValidator.js";

const router = express.Router();

router.post("/login", validateLogin, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getCurrentUser);
router.patch("/profile", authenticate, authController.updateProfile);
router.post("/change-password", authenticate, validateChangePassword, authController.changePassword);
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", validateResetPassword, authController.resetPassword);
router.post("/verify-email", validateVerifyEmail, authController.verifyEmail);
router.post("/resend-verification", validateResendVerification, authController.resendVerificationEmail);

export default router;
