export const validateCreateActivity = (req, res, next) => {
  const { projectId, activityDate, activityDescription, workCompleted, laborCount } = req.body || {};

  if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required.",
    });
  }

  if (!activityDate) {
    return res.status(400).json({
      success: false,
      message: "Activity date is required.",
    });
  }

  const parsedDate = new Date(activityDate);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Valid activity date is required.",
    });
  }

  if (!activityDescription || typeof activityDescription !== "string" || !activityDescription.trim()) {
    return res.status(400).json({
      success: false,
      message: "Activity description is required.",
    });
  }

  if (!workCompleted || typeof workCompleted !== "string" || !workCompleted.trim()) {
    return res.status(400).json({
      success: false,
      message: "Work completed summary is required.",
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

  next();
};

export const validateUpdateActivity = (req, res, next) => {
  const { activityDate, laborCount } = req.body || {};

  if (activityDate !== undefined) {
    const parsedDate = new Date(activityDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity date provided.",
      });
    }
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

  next();
};
