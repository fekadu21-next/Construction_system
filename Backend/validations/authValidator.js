export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  if (!email.trim() || !password.trim()) {
    return res.status(400).json({
      success: false,
      message: "Email and password cannot be empty",
    });
  }

  next();
};

export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required",
    });
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters",
    });
  }

  next();
};

export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body || {};

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail.includes("@") || trimmedEmail.length < 5) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  next();
};

export const validateResetPassword = (req, res, next) => {
  const { token, newPassword } = req.body || {};

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Token and new password are required",
    });
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters",
    });
  }

  next();
};

export const validateVerifyEmail = (req, res, next) => {
  const { token } = req.body || {};

  if (!token || typeof token !== "string" || !token.trim()) {
    return res.status(400).json({
      success: false,
      message: "Verification token is required",
    });
  }

  next();
};

export const validateResendVerification = (req, res, next) => {
  const { email } = req.body || {};

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail.includes("@") || trimmedEmail.length < 5) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  next();
};
