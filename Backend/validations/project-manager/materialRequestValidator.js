export const validateMaterialRequestDecision = (req, res, next) => {
  const { requestId } = req.params;
  if (!requestId || typeof requestId !== "string" || !requestId.trim()) {
    return res.status(400).json({
      success: false,
      message: "Valid requestId parameter is required",
    });
  }

  const { reviewNotes } = req.body || {};
  if (reviewNotes !== undefined && typeof reviewNotes !== "string") {
    return res.status(400).json({
      success: false,
      message: "reviewNotes must be a string",
    });
  }

  next();
};
