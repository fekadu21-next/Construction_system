import prisma from "../config/prisma.js";

export const preferencesController = {
  async getPreferences(req, res, next) {
    try {
      const userId = req.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          preferences: true,
          role: { select: { name: true } },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isProcurement = user.role?.name === "PROCUREMENT_OFFICER";

      // Role-aware default preferences
      const defaultPreferences = {
        theme: "dark",
        language: "en",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "12-hour",
        timeZone: "Africa/Addis_Ababa",
        defaultPage: isProcurement ? "/procurement/dashboard" : "/general-manager/dashboard",
        notifications: isProcurement
          ? {
              email: true,
              inAppAlerts: true,
              lowStockMaterials: true,
              outOfStockMaterials: true,
              newApprovedMaterialRequests: true,
              purchaseOrderApprovalsRejections: true,
              upcomingOrOverdueDeliveries: true,
              damagedOrMissingDeliveryItems: true,
              deliveryReceivedOrPartiallyReceived: true,
            }
          : {
              email: true,
              projectUpdates: true,
              procurementUpdates: true,
              financeAlerts: true,
            },
      };

      const stored = (user.preferences && typeof user.preferences === "object") ? user.preferences : {};
      const preferences = {
        ...defaultPreferences,
        ...stored,
        notifications: {
          ...defaultPreferences.notifications,
          ...(stored.notifications || {}),
        },
      };

      res.json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      console.error("Get preferences error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch preferences. Please try again.",
      });
    }
  },

  async updatePreferences(req, res, next) {
    try {
      const userId = req.userId;
      const preferences = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { preferences },
        select: { preferences: true },
      });

      res.json({
        success: true,
        data: user.preferences,
        message: "Preferences updated successfully",
      });
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to update preferences. Please try again.",
      });
    }
  },
};
