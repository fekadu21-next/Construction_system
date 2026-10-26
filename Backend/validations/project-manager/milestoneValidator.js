export const validateMilestoneUpdate = (req, res, next) => {
  const { status, progressPercent, dueDate } = req.body || {};

  const ALLOWED_MILESTONE_STATUSES = ["UPCOMING", "IN_PROGRESS", "BEHIND_SCHEDULE", "COMPLETED"];

  if (status !== undefined && !ALLOWED_MILESTONE_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid milestone status. Allowed: ${ALLOWED_MILESTONE_STATUSES.join(", ")}`,
    });
  }

  if (progressPercent !== undefined) {
    const p = parseInt(progressPercent, 10);
    if (isNaN(p) || p < 0 || p > 100) {
      return res.status(400).json({
        success: false,
        message: "progressPercent must be an integer between 0 and 100",
      });
    }
  }

  if (dueDate !== undefined) {
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid dueDate format",
      });
    }
  }

  next();
};
