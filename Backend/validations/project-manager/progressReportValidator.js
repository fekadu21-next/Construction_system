export const validateProgressReportReview = (req, res, next) => {
  const { reportId } = req.params;
  if (!reportId || typeof reportId !== "string" || !reportId.trim()) {
    return res.status(400).json({
      success: false,
      message: "Valid reportId parameter is required",
    });
  }

  const { reviewerNotes } = req.body || {};
  if (reviewerNotes !== undefined && typeof reviewerNotes !== "string") {
    return res.status(400).json({
      success: false,
      message: "reviewerNotes must be a string",
    });
  }

  next();
};
