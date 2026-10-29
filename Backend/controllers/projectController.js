import { projectService } from "../services/projectService.js";

export const projectController = {
  async getProjects(req, res, next) {
    try {
      const {
        page,
        limit,
        search,
        status,
        managerId,
        supervisorId,
        startDateFrom,
        startDateTo,
        sortBy,
        sortOrder,
        includeArchived,
      } = req.query;

      const result = await projectService.getProjects({
        page,
        limit,
        search,
        status,
        managerId,
        supervisorId,
        startDateFrom,
        startDateTo,
        sortBy,
        sortOrder,
        includeArchived: includeArchived === "true",
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch projects. Please try again.",
      });
    }
  },

  async getProjectMetrics(req, res, next) {
    try {
      const metrics = await projectService.getProjectMetrics();
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error("Get project metrics error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch project metrics.",
      });
    }
  },

  async getNextProjectCode(req, res, next) {
    try {
      const nextCode = await projectService.generateNextProjectCode();
      res.json({
        success: true,
        data: { nextCode },
      });
    } catch (error) {
      console.error("Generate project code error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to generate project code.",
      });
    }
  },

  async getProjectById(req, res, next) {
    try {
      const { id } = req.params;
      const project = await projectService.getProjectById(id);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
      console.error("Get project by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch project. Please try again.",
      });
    }
  },

  async createProject(req, res, next) {
    try {
      const actorId = req.userId;
      const data = req.body;

      const project = await projectService.createProject(data, actorId);

      res.status(201).json({
        success: true,
        data: project,
        message: "Project created successfully",
      });
    } catch (error) {
      if (
        error.message === "Project code already exists" ||
        error.message === "Selected project manager is not active" ||
        error.message === "Selected user is not a Project Manager" ||
        error.message === "Selected site supervisor is not active" ||
        error.message === "Selected user is not a Site Supervisor"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === "Project manager not found" || error.message === "Site supervisor not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      console.error("Create project unexpected error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to create project. Please try again.",
      });
    }
  },

  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.userId;
      const data = req.body;

      const project = await projectService.updateProject(id, data, actorId);

      res.json({
        success: true,
        data: project,
        message: "Project updated successfully",
      });
    } catch (error) {
      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
      if (
        error.message === "Project code already exists" ||
        error.message === "Budget must be a non-negative number" ||
        error.message === "Selected project manager is not active" ||
        error.message === "Selected user is not a Project Manager" ||
        error.message === "Selected site supervisor is not active" ||
        error.message === "Selected user is not a Site Supervisor"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === "Project manager not found" || error.message === "Site supervisor not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      console.error("Update project unexpected error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to update project. Please try again.",
      });
    }
  },

  async assignManager(req, res, next) {
    try {
      const { id } = req.params;
      const { projectManagerId } = req.body;
      const actorId = req.userId;

      const project = await projectService.assignManager(id, projectManagerId, actorId);

      res.json({
        success: true,
        data: project,
        message: "Project manager assigned successfully",
      });
    } catch (error) {
      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
      if (
        error.message === "Selected project manager is not active" ||
        error.message === "Selected user is not a Project Manager"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === "Project manager not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      console.error("Assign manager unexpected error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to assign project manager. Please try again.",
      });
    }
  },

  async assignSupervisor(req, res, next) {
    try {
      const { id } = req.params;
      const { supervisorId } = req.body;
      const actorId = req.userId;

      const project = await projectService.assignSupervisor(id, supervisorId, actorId);

      res.json({
        success: true,
        data: project,
        message: "Site supervisor assigned successfully",
      });
    } catch (error) {
      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
      if (
        error.message === "Selected site supervisor is not active" ||
        error.message === "Selected user is not a Site Supervisor"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === "Site supervisor not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      console.error("Assign supervisor unexpected error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to assign site supervisor. Please try again.",
      });
    }
  },

  async updateProjectStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const actorId = req.userId;

      const project = await projectService.updateProjectStatus(id, status, actorId);

      res.json({
        success: true,
        data: project,
        message: "Project status updated successfully",
      });
    } catch (error) {
      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
      console.error("Update project status error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to update project status. Please try again.",
      });
    }
  },

  async archiveProject(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.userId;

      const project = await projectService.archiveProject(id, actorId);

      res.json({
        success: true,
        data: project,
        message: "Project archived successfully",
      });
    } catch (error) {
      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
      console.error("Archive project error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to archive project. Please try again.",
      });
    }
  },

  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.userId;

      const result = await projectService.deleteProject(id, actorId);

      res.json({
        success: true,
        data: result,
        message: "Project deleted successfully",
      });
    } catch (error) {
      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
      console.error("Delete project error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to delete project. Please try again.",
      });
    }
  },
};
