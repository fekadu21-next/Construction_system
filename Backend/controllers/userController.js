import { userService } from "../services/userService.js";

export const userController = {
  async getUsers(req, res, next) {
    try {
      const { page, limit, search, role, isActive, sortBy, sortOrder } = req.query;

      const result = await userService.getUsers({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search: search || "",
        role: role || "",
        isActive: isActive !== undefined ? isActive : "",
        sortBy: sortBy || "createdAt",
        sortOrder: sortOrder || "desc",
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch users. Please try again.",
      });
    }
  },

  async getUserSummary(req, res, next) {
    try {
      const summary = await userService.getUserSummary();
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Get user summary error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch user summary statistics",
      });
    }
  },

  async getRoles(req, res, next) {
    try {
      const roles = await userService.getRoles();
      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      console.error("Get roles error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch system roles",
      });
    }
  },

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Get user by ID error:", error);
      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      res.status(500).json({
        success: false,
        message: "Unable to fetch user details. Please try again.",
      });
    }
  },

  async createUser(req, res, next) {
    try {
      const actorId = req.userId;
      const data = req.body;

      const user = await userService.createUser(data, actorId);

      res.status(201).json({
        success: true,
        data: user,
        message: "User account created successfully",
      });
    } catch (error) {
      console.error("Create user error:", error);
      if (error.message === "Email already exists") {
        return res.status(400).json({
          success: false,
          message: "Email address is already in use by another account",
        });
      }
      if (error.message === "Invalid system role selected") {
        return res.status(400).json({
          success: false,
          message: "The selected system role is invalid",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Unable to create user. Please try again.",
      });
    }
  },

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.userId;
      const data = req.body;

      const user = await userService.updateUser(id, data, actorId);

      res.json({
        success: true,
        data: user,
        message: "User account updated successfully",
      });
    } catch (error) {
      console.error("Update user error:", error);
      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      if (error.message === "Email already exists") {
        return res.status(400).json({
          success: false,
          message: "Email address is already in use by another account",
        });
      }
      if (error.message === "Cannot change role of the last active General Manager") {
        return res.status(403).json({
          success: false,
          message: "Cannot change role of the last active General Manager",
        });
      }
      if (error.message === "Cannot deactivate the last active General Manager") {
        return res.status(403).json({
          success: false,
          message: "Cannot deactivate the last active General Manager",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Unable to update user. Please try again.",
      });
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const actorId = req.userId;

      const result = await userService.updateUserStatus(id, isActive, actorId);

      res.json({
        success: true,
        data: result.user,
        warning: result.warning,
        activeProjectsAffected: result.activeProjectsAffected,
        message: isActive ? "User activated successfully" : "User deactivated successfully",
      });
    } catch (error) {
      console.error("Update user status error:", error);
      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      if (error.message === "Cannot deactivate the last active General Manager") {
        return res.status(403).json({
          success: false,
          message: "Cannot deactivate the last active General Manager",
        });
      }
      res.status(500).json({
        success: false,
        message: "Unable to update user status. Please try again.",
      });
    }
  },

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.userId;

      // Prevent self-deletion
      if (id === actorId) {
        return res.status(403).json({
          success: false,
          message: "You cannot delete your own account",
        });
      }

      const result = await userService.deleteUser(id, actorId);

      res.json({
        success: true,
        data: result,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      if (error.message === "Cannot delete the last active General Manager") {
        return res.status(403).json({
          success: false,
          message: "Cannot delete the last active General Manager",
        });
      }
      if (error.message.includes("Cannot delete user with associated projects")) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete user with associated projects. Deactivate the account instead.",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Unable to delete user. Please try again.",
      });
    }
  },

  async getProjectManagers(req, res, next) {
    try {
      const projectManagers = await userService.getProjectManagers();

      res.json({
        success: true,
        data: projectManagers,
      });
    } catch (error) {
      console.error("Get project managers error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch project managers. Please try again.",
      });
    }
  },
};
