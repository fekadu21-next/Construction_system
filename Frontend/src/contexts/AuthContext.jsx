import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      localStorage.removeItem("accessToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const result = await authService.login(email, password);
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const message = err.message || "Login failed";
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("accessToken");
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      const result = await authService.changePassword(currentPassword, newPassword);
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const message = err.message || "Password change failed";
      setError(message);
      return { success: false, error: message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      const result = await authService.forgotPassword(email);
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const message = err.message || "Password reset request failed";
      setError(message);
      return { success: false, error: message };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setError(null);
      const result = await authService.resetPassword(token, newPassword);
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const message = err.message || "Password reset failed";
      setError(message);
      return { success: false, error: message };
    }
  };

  const verifyEmail = async (token) => {
    try {
      setError(null);
      const result = await authService.verifyEmail(token);
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const message = err.message || "Email verification failed";
      setError(message);
      return { success: false, error: message };
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      setError(null);
      const result = await authService.resendVerificationEmail(email);
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const message = err.message || "Resend verification failed";
      setError(message);
      return { success: false, error: message };
    }
  };

  const updateUserData = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : updatedData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        changePassword,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerificationEmail,
        checkAuth,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
