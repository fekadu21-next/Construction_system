export const validateProjectIdParam = (req, res, next) => {
  const { projectId } = req.params;
  if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
    return res.status(400).json({
      success: false,
      message: "Valid projectId parameter is required",
    });
  }
  next();
};
