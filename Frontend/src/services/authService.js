import api from "./api.js";

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const { user, accessToken } = response.data?.data || {};

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
      }
      return { success: true, user, accessToken };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.status === 401 ? "Invalid credentials" : null) ||
        err.message ||
        "Unable to sign in. Please check your credentials.";
      return { success: false, error: message };
    }
  },

  async logout() {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.warn("Logout error:", err.message);
    } finally {
      localStorage.removeItem("accessToken");
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get("/api/auth/me");
      return response.data?.data;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to get user data";
      throw new Error(message);
    }
  },

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return {
        success: true,
        data: response.data,
        message: response.data?.message || "Password changed successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Password change failed";
      return { success: false, error: message };
    }
  },

  async updateProfile(data) {
    try {
      const response = await api.patch("/api/auth/profile", data);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || "Profile updated successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update profile";
      return { success: false, error: message };
    }
  },

  async forgotPassword(email) {
    try {
      const response = await api.post("/api/auth/forgot-password", { email });
      return {
        success: true,
        data: response.data,
        message: response.data?.message || "Password reset instructions have been sent",
      };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.status === 404 ? "Email is not registered" : null) ||
        "Password reset request failed";
      return { success: false, error: message };
    }
  },

  async resetPassword(token, newPassword) {
    try {
      const response = await api.post("/api/auth/reset-password", {
        token,
        newPassword,
      });
      return {
        success: true,
        data: response.data,
        message: response.data?.message || "Password reset successfully",
      };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Password reset failed. Please request a new link.";
      return { success: false, error: message };
    }
  },

  async verifyEmail(token) {
    try {
      const response = await api.post("/api/auth/verify-email", { token });
      return {
        success: true,
        data: response.data,
        message: response.data?.message || "Email verified successfully",
      };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Email verification failed. Please check the link.";
      return { success: false, error: message };
    }
  },

  async resendVerificationEmail(email) {
    try {
      const response = await api.post("/api/auth/resend-verification", { email });
      return {
        success: true,
        data: response.data,
        message: response.data?.message || "Verification email sent",
      };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.status === 404 ? "Email is not registered" : null) ||
        "Resend verification failed";
      return { success: false, error: message };
    }
  },
};
