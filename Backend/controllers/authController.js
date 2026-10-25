import { authService } from "../services/authService.js";

export const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip;

      const result = await authService.login(email, password, userAgent, ipAddress);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      if (error.message === "Invalid credentials") {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
      if (error.message === "Account is inactive") {
        return res.status(401).json({
          success: false,
          message: "Your account is inactive. Please contact an administrator.",
        });
      }
      if (error.message === "User has no assigned role") {
        return res.status(403).json({
          success: false,
          message: "Your account has no assigned role. Please contact an administrator.",
        });
      }
      console.error("Login unexpected error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to process login request. Please try again.",
      });
    }
  },

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "No refresh token provided",
        });
      }

      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip;

      const result = await authService.refresh(refreshToken, userAgent, ipAddress);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.clearCookie("refreshToken", { path: "/" });
      if (error.message === "Invalid refresh token" || error.message === "Refresh token has been revoked" || error.message === "Refresh token has expired" || error.message === "Account is inactive") {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired refresh token",
        });
      }
      res.status(500).json({
        success: false,
        message: "Unable to refresh token. Please try again.",
      });
    }
  },

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie("refreshToken", { path: "/" });

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.clearCookie("refreshToken", { path: "/" });
      res.status(500).json({
        success: false,
        message: "Unable to logout. Please try again.",
      });
    }
  },

  async getCurrentUser(req, res, next) {
    try {
      const userId = req.userId;

      const user = await authService.getCurrentUser(userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Get current user error:", error);
      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      if (error.message === "Account is inactive") {
        return res.status(401).json({
          success: false,
          message: "Your account is inactive. Please contact an administrator.",
        });
      }
      res.status(500).json({
        success: false,
        message: "Unable to fetch user data",
      });
    }
  },

  async changePassword(req, res, next) {
    try {
      const userId = req.userId;
      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      if (error.message === "Current password is incorrect") {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
      res.status(500).json({
        success: false,
        message: "Unable to change password. Please try again.",
      });
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);

      if (result.token) {
        console.log(`Password reset token for ${email}: ${result.token}`);
        console.log(`Reset link: ${process.env.FRONTEND_URL}/reset-password?token=${result.token}`);
      }

      res.json({
        success: true,
        message: result.message || "Password reset instructions have been sent to your email",
      });
    } catch (error) {
      if (error.message === "Email is not registered") {
        return res.status(404).json({
          success: false,
          message: "Email is not registered",
        });
      }
      if (error.message === "Account is inactive") {
        return res.status(403).json({
          success: false,
          message: "Your account is inactive. Please contact an administrator.",
        });
      }
      console.error("Forgot password unexpected error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to process password reset request. Please try again.",
      });
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      await authService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      if (
        error.message === "Invalid reset token" ||
        error.message === "Reset token has already been used" ||
        error.message === "Reset token has expired"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to reset password. Please try again.",
      });
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;

      await authService.verifyEmail(token);

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      if (error.message === "Invalid or expired verification token") {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification token",
        });
      }
      console.error("Verify email error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to verify email. Please try again.",
      });
    }
  },

  async resendVerificationEmail(req, res, next) {
    try {
      const { email } = req.body;

      const result = await authService.resendVerificationEmail(email);

      if (result.token) {
        console.log(`Email verification token for ${email}: ${result.token}`);
        console.log(`Verification link: ${process.env.FRONTEND_URL}/verify-email?token=${result.token}`);
      }

      res.json({
        success: true,
        message: result.message || "A verification link has been sent to your email",
      });
    } catch (error) {
      if (error.message === "Email is not registered") {
        return res.status(404).json({
          success: false,
          message: "Email is not registered",
        });
      }
      if (error.message === "Email already verified") {
        return res.status(400).json({
          success: false,
          message: "Email already verified",
        });
      }
      if (error.message === "Account is inactive") {
        return res.status(403).json({
          success: false,
          message: "Your account is inactive. Please contact an administrator.",
        });
      }
      console.error("Resend verification email unexpected error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to send verification email. Please try again.",
      });
    }
  },
};
