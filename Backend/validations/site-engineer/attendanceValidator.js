const ALLOWED_STATUSES = ["PRESENT", "ABSENT", "HALF_DAY", "LATE", "LEAVE"];

export const validateRecordAttendance = (req, res, next) => {
  const { projectId, date, records, employeeId, status } = req.body || {};

  if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required.",
    });
  }

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "Attendance date is required.",
    });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid attendance date provided.",
    });
  }

  // Accepts either batch records or single record
  if (records) {
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Records must be a non-empty array of employee attendance entries.",
      });
    }

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      if (!rec.employeeId) {
        return res.status(400).json({
          success: false,
          message: `Record at index ${i} is missing employeeId.`,
        });
      }
      if (rec.status && !ALLOWED_STATUSES.includes(rec.status)) {
        return res.status(400).json({
          success: false,
          message: `Record at index ${i} has invalid status '${rec.status}'. Allowed: ${ALLOWED_STATUSES.join(", ")}.`,
        });
      }
    }
  } else {
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required when records array is not provided.",
      });
    }
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid attendance status '${status}'. Allowed: ${ALLOWED_STATUSES.join(", ")}.`,
      });
    }
  }

  next();
};

export const validateUpdateAttendance = (req, res, next) => {
  const { status, correctionReason } = req.body || {};

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid attendance status '${status}'. Allowed: ${ALLOWED_STATUSES.join(", ")}.`,
    });
  }

  if (!correctionReason || typeof correctionReason !== "string" || !correctionReason.trim()) {
    return res.status(400).json({
      success: false,
      message: "A correction reason is required when modifying historical attendance records.",
    });
  }

  next();
};
