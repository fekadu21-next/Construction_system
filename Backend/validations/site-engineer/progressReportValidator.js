export const validateCreateProgressReport = (req, res, next) => {
  const { projectId, reportTitle, workCompleted, reportedProgress, laborCount, photosAttached } = req.body || {};

  if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required.",
    });
  }

  if (!reportTitle || typeof reportTitle !== "string" || !reportTitle.trim()) {
    return res.status(400).json({
      success: false,
      message: "Report title is required.",
    });
  }

  if (!workCompleted || typeof workCompleted !== "string" || !workCompleted.trim()) {
    return res.status(400).json({
      success: false,
      message: "Summary of work completed is required.",
    });
  }

  if (!reportedProgress || typeof reportedProgress !== "string" || !reportedProgress.trim()) {
    return res.status(400).json({
      success: false,
      message: "Reported progress details are required.",
    });
  }

  if (laborCount !== undefined && laborCount !== null) {
    const parsedLabor = parseInt(laborCount, 10);
    if (isNaN(parsedLabor) || parsedLabor < 0) {
      return res.status(400).json({
        success: false,
        message: "Labor count must be a non-negative number.",
      });
    }
  }

  if (photosAttached !== undefined && photosAttached !== null) {
    const parsedPhotos = parseInt(photosAttached, 10);
    if (isNaN(parsedPhotos) || parsedPhotos < 0) {
      return res.status(400).json({
        success: false,
        message: "Photos count must be non-negative.",
      });
    }
  }

  next();
};
