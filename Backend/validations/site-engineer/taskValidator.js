export const validateTaskProgressUpdate = (req, res, next) => {
  const { progressPercent, status, completionNotes, issues } = req.body || {};

  if (progressPercent !== undefined) {
    const parsed = Number(progressPercent);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      return res.status(400).json({
        success: false,
        message: "Progress percentage must be an integer between 0 and 100.",
      });
    }
  }

  if (status !== undefined) {
    const allowedStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed statuses are: ${allowedStatuses.join(", ")}.`,
      });
    }
  }

  if (completionNotes !== undefined && typeof completionNotes !== "string") {
    return res.status(400).json({
      success: false,
      message: "Completion notes must be text.",
    });
  }

  if (issues !== undefined && typeof issues !== "string") {
    return res.status(400).json({
      success: false,
      message: "Issues field must be text.",
    });
  }

  next();
};
