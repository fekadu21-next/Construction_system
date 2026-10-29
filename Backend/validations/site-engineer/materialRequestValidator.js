export const validateCreateMaterialRequest = (req, res, next) => {
  const { projectId, items, requestedMaterials, urgency, justification } = req.body || {};

  if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required.",
    });
  }

  if (urgency !== undefined) {
    const allowedUrgency = ["NORMAL", "HIGH", "CRITICAL"];
    if (!allowedUrgency.includes(urgency)) {
      return res.status(400).json({
        success: false,
        message: `Invalid urgency '${urgency}'. Allowed: ${allowedUrgency.join(", ")}.`,
      });
    }
  }

  // Support structured items array or single requestedMaterials description
  if (items) {
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Material request items must be a non-empty list.",
      });
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.itemName || typeof it.itemName !== "string" || !it.itemName.trim()) {
        return res.status(400).json({
          success: false,
          message: `Item at index ${i} requires an itemName.`,
        });
      }
      const qty = Number(it.quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item '${it.itemName}' must have a positive quantity.`,
        });
      }
      if (!it.unit || typeof it.unit !== "string" || !it.unit.trim()) {
        return res.status(400).json({
          success: false,
          message: `Item '${it.itemName}' requires a unit of measurement.`,
        });
      }
    }
  } else if (!requestedMaterials || typeof requestedMaterials !== "string" || !requestedMaterials.trim()) {
    return res.status(400).json({
      success: false,
      message: "Either structured items array or requestedMaterials summary is required.",
    });
  }

  next();
};
