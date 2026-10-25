import { ALLOWED_STATUSES, SUPPORTED_CURRENCIES } from "../constants/projectConstants.js";

export const validateCreateProject = (req, res, next) => {
  const {
    projectName,
    projectCode,
    location,
    startDate,
    endDate,
    budget,
    currency,
    status,
  } = req.body || {};

  // Required basic information
  if (!projectName || typeof projectName !== "string" || !projectName.trim()) {
    return res.status(400).json({
      success: false,
      message: "Project name is required",
      field: "projectName",
    });
  }

  if (!projectCode || typeof projectCode !== "string" || !projectCode.trim()) {
    return res.status(400).json({
      success: false,
      message: "Project code is required",
      field: "projectCode",
    });
  }

  if (!location || typeof location !== "string" || !location.trim()) {
    return res.status(400).json({
      success: false,
      message: "Location is required",
      field: "location",
    });
  }

  // Schedule validation
  if (!startDate) {
    return res.status(400).json({
      success: false,
      message: "Planned start date is required",
      field: "startDate",
    });
  }

  const parsedStart = new Date(startDate);
  if (isNaN(parsedStart.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid planned start date",
      field: "startDate",
    });
  }

  if (endDate) {
    const parsedEnd = new Date(endDate);
    if (isNaN(parsedEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid planned end date",
        field: "endDate",
      });
    }

    if (parsedEnd < parsedStart) {
      return res.status(400).json({
        success: false,
        message: "End date must be the same as or later than the start date",
        field: "endDate",
      });
    }
  }

  // Budget validation
  if (budget === undefined || budget === null || budget === "") {
    return res.status(400).json({
      success: false,
      message: "Project budget is required",
      field: "budget",
    });
  }

  const parsedBudget = parseFloat(budget);
  if (isNaN(parsedBudget) || parsedBudget < 0) {
    return res.status(400).json({
      success: false,
      message: "Budget must be a valid non-negative decimal amount",
      field: "budget",
    });
  }

  // Currency validation
  if (currency && !SUPPORTED_CURRENCIES.includes(currency.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid currency. Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}`,
      field: "currency",
    });
  }

  // Status validation
  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid project status. Allowed: ${ALLOWED_STATUSES.join(", ")}`,
      field: "status",
    });
  }

  next();
};

export const validateUpdateProject = (req, res, next) => {
  const {
    projectName,
    projectCode,
    location,
    startDate,
    endDate,
    budget,
    currency,
    status,
  } = req.body || {};

  if (projectName !== undefined && (typeof projectName !== "string" || !projectName.trim())) {
    return res.status(400).json({
      success: false,
      message: "Project name cannot be empty",
      field: "projectName",
    });
  }

  if (projectCode !== undefined && (typeof projectCode !== "string" || !projectCode.trim())) {
    return res.status(400).json({
      success: false,
      message: "Project code cannot be empty",
      field: "projectCode",
    });
  }

  if (location !== undefined && (typeof location !== "string" || !location.trim())) {
    return res.status(400).json({
      success: false,
      message: "Location cannot be empty",
      field: "location",
    });
  }

  if (startDate !== undefined) {
    const parsedStart = new Date(startDate);
    if (isNaN(parsedStart.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
        field: "startDate",
      });
    }
  }

  if (endDate !== undefined && endDate !== null && endDate !== "") {
    const parsedEnd = new Date(endDate);
    if (isNaN(parsedEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date",
        field: "endDate",
      });
    }

    if (startDate) {
      const parsedStart = new Date(startDate);
      if (parsedEnd < parsedStart) {
        return res.status(400).json({
          success: false,
          message: "End date must be later than or equal to start date",
          field: "endDate",
        });
      }
    }
  }

  if (budget !== undefined) {
    const parsedBudget = parseFloat(budget);
    if (isNaN(parsedBudget) || parsedBudget < 0) {
      return res.status(400).json({
        success: false,
        message: "Budget must be a valid non-negative number",
        field: "budget",
      });
    }
  }

  if (currency !== undefined && !SUPPORTED_CURRENCIES.includes(currency.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid currency. Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}`,
      field: "currency",
    });
  }

  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed statuses: ${ALLOWED_STATUSES.join(", ")}`,
      field: "status",
    });
  }

  next();
};

export const validateAssignManager = (req, res, next) => {
  const { projectManagerId } = req.body || {};

  // It's permissible to pass null or empty string to unassign
  if (projectManagerId !== undefined && projectManagerId !== null && typeof projectManagerId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Project manager ID must be a valid string or null",
    });
  }

  next();
};

export const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body || {};

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status is required and must be one of: ${ALLOWED_STATUSES.join(", ")}`,
    });
  }

  next();
};
