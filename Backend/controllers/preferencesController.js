import prisma from "../config/prisma.js";

export const preferencesController = {
  async getPreferences(req, res, next) {
    try {
      const userId = req.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Default preferences
      const defaultPreferences = {
        theme: "dark",
        language: "en",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "12-hour",
        timeZone: "Africa/Addis_Ababa",
        defaultPage: "/general-manager/dashboard",
        notifications: {
          email: true,
          projectUpdates: true,
          procurementUpdates: true,
          financeAlerts: true,
        },
      };

      const preferences = user.preferences || defaultPreferences;

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
