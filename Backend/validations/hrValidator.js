import {
  EMPLOYMENT_TYPE,
  WORKER_TRADE,
  ATTENDANCE_STATUS,
  LEAVE_TYPES,
  LEAVE_STATUS,
  EMPLOYEE_STATUS,
} from "../constants/hrConstants.js";

export const validateCreateEmployee = (req, res, next) => {
  const { fullName, phone, trade, employmentType, dailyRate, monthlySalary } = req.body || {};

  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    return res.status(400).json({
      success: false,
      message: "Full name is required",
      field: "fullName",
    });
  }

  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required",
      field: "phone",
    });
  }

  if (!trade || !Object.values(WORKER_TRADE).includes(trade)) {
    return res.status(400).json({
      success: false,
      message: `Invalid or missing worker trade. Allowed: ${Object.values(WORKER_TRADE).join(", ")}`,
      field: "trade",
    });
  }

  if (employmentType && !Object.values(EMPLOYMENT_TYPE).includes(employmentType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid employment type. Allowed: ${Object.values(EMPLOYMENT_TYPE).join(", ")}`,
      field: "employmentType",
    });
  }

  if (dailyRate !== undefined && dailyRate !== null && dailyRate !== "") {
    const rate = Number(dailyRate);
    if (isNaN(rate) || rate < 0) {
      return res.status(400).json({
        success: false,
        message: "Daily rate must be a non-negative number",
        field: "dailyRate",
      });
    }
  }

  if (monthlySalary !== undefined && monthlySalary !== null && monthlySalary !== "") {
    const salary = Number(monthlySalary);
    if (isNaN(salary) || salary < 0) {
      return res.status(400).json({
        success: false,
        message: "Monthly salary must be a non-negative number",
        field: "monthlySalary",
      });
    }
  }

  next();
};

export const validateUpdateEmployee = (req, res, next) => {
  const { fullName, phone, trade, employmentType, dailyRate, monthlySalary, status } = req.body || {};

  if (fullName !== undefined && (!fullName || typeof fullName !== "string" || !fullName.trim())) {
    return res.status(400).json({
      success: false,
      message: "Full name cannot be empty",
      field: "fullName",
    });
  }

  if (phone !== undefined && (!phone || typeof phone !== "string" || !phone.trim())) {
    return res.status(400).json({
      success: false,
      message: "Phone number cannot be empty",
      field: "phone",
    });
  }

  if (trade !== undefined && !Object.values(WORKER_TRADE).includes(trade)) {
    return res.status(400).json({
      success: false,
      message: `Invalid worker trade. Allowed: ${Object.values(WORKER_TRADE).join(", ")}`,
      field: "trade",
    });
  }

  if (employmentType !== undefined && !Object.values(EMPLOYMENT_TYPE).includes(employmentType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid employment type. Allowed: ${Object.values(EMPLOYMENT_TYPE).join(", ")}`,
      field: "employmentType",
    });
  }

  if (status !== undefined && !Object.values(EMPLOYEE_STATUS).includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed: ${Object.values(EMPLOYEE_STATUS).join(", ")}`,
      field: "status",
    });
  }

  if (dailyRate !== undefined && dailyRate !== null && dailyRate !== "") {
    const rate = Number(dailyRate);
    if (isNaN(rate) || rate < 0) {
      return res.status(400).json({
        success: false,
        message: "Daily rate must be a non-negative number",
        field: "dailyRate",
      });
    }
  }

  if (monthlySalary !== undefined && monthlySalary !== null && monthlySalary !== "") {
    const salary = Number(monthlySalary);
    if (isNaN(salary) || salary < 0) {
      return res.status(400).json({
        success: false,
        message: "Monthly salary must be a non-negative number",
        field: "monthlySalary",
      });
    }
  }

  next();
};

export const validateRecordAttendance = (req, res, next) => {
  const { date, records } = req.body || {};

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "Attendance date is required",
      field: "date",
    });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid attendance date",
      field: "date",
    });
  }

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Records must be a non-empty array of employee attendance entries",
      field: "records",
    });
  }

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    if (!item.employeeId) {
      return res.status(400).json({
        success: false,
        message: `Employee ID is required at index ${i}`,
        field: `records[${i}].employeeId`,
      });
    }

    if (item.status && !Object.values(ATTENDANCE_STATUS).includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid attendance status '${item.status}' at index ${i}. Allowed: ${Object.values(ATTENDANCE_STATUS).join(", ")}`,
        field: `records[${i}].status`,
      });
    }
  }

  next();
};

export const validateCreateLeave = (req, res, next) => {
  const { employeeId, leaveType, startDate, endDate } = req.body || {};

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID is required",
      field: "employeeId",
    });
  }

  if (!leaveType || !Object.values(LEAVE_TYPES).includes(leaveType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid leave type. Allowed: ${Object.values(LEAVE_TYPES).join(", ")}`,
      field: "leaveType",
    });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "Start date and end date are required",
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid start or end date format",
    });
  }

  if (end < start) {
    return res.status(400).json({
      success: false,
      message: "End date cannot be earlier than start date",
      field: "endDate",
    });
  }

  next();
};

export const validateReviewLeave = (req, res, next) => {
  const { status } = req.body || {};

  if (!status || ![LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Review status must be either APPROVED or REJECTED",
      field: "status",
    });
  }

  next();
};
