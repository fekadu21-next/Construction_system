import { USER_ROLES } from "../utils/constants.js";

const VALID_ROLE_NAMES = Object.values(USER_ROLES);

export const validateCreateUser = (req, res, next) => {
  const { fullName, email, role, roleId, password, phone } = req.body || {};

  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    return res.status(400).json({
      success: false,
      message: "Full name is required",
    });
  }

  if (fullName.trim().length < 2 || fullName.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: "Full name must be between 2 and 100 characters",
    });
  }

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: "Email address is required",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    });
  }

  const selectedRole = role || roleId;
  if (!selectedRole || typeof selectedRole !== "string" || !selectedRole.trim()) {
    return res.status(400).json({
      success: false,
      message: "System role is required",
    });
  }

  if (password && typeof password === "string") {
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }
  }

  if (phone && typeof phone === "string" && phone.trim()) {
    if (phone.trim().length > 25) {
      return res.status(400).json({
        success: false,
        message: "Phone number cannot exceed 25 characters",
      });
    }
  }

  next();
};

export const validateUpdateUser = (req, res, next) => {
  const { fullName, email, phone } = req.body || {};

  if (fullName !== undefined) {
    if (typeof fullName !== "string" || fullName.trim().length < 2 || fullName.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Full name must be between 2 and 100 characters",
      });
    }
  }

  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== "string" || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }
  }

  if (phone !== undefined && phone !== null && phone !== "") {
    if (typeof phone === "string" && phone.trim().length > 25) {
      return res.status(400).json({
        success: false,
        message: "Phone number cannot exceed 25 characters",
      });
    }
  }

  next();
};
