import { materialService } from "../../services/procurement/materialService.js";

export const materialController = {
  async getAllMaterials(req, res, next) {
    try {
      const { includeInactive, categoryId, search } = req.query;

      const materials = await materialService.getAllMaterials({
        includeInactive: includeInactive === "true",
        categoryId,
        search,
      });

      res.json({
        success: true,
        data: materials,
      });
    } catch (error) {
      console.error("Get materials error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch materials",
      });
    }
  },

  async getMaterialById(req, res, next) {
    try {
      const { id } = req.params;

      const material = await materialService.getMaterialById(id);

      res.json({
        success: true,
        data: material,
      });
    } catch (error) {
      console.error("Get material error:", error);
      if (error.message === "Material not found") {
        return res.status(404).json({
          success: false,
          message: "Material not found",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch material",
      });
    }
  },

  async createMaterial(req, res, next) {
    try {
      const userId = req.userId;
      const {
        code,
        name,
        categoryId,
        unit,
        reorderLevel,
        currentStock,
        openingQuantity,
        openingStock,
        openingStockReference,
        openingStockNotes,
        reference,
        notes,
        description,
        isActive,
      } = req.body;

      const material = await materialService.createMaterial(
        {
          code,
          name,
          categoryId,
          unit,
          reorderLevel,
          currentStock,
          openingQuantity: openingQuantity ?? openingStock ?? currentStock,
          openingStockReference: openingStockReference ?? reference,
          openingStockNotes: openingStockNotes ?? notes,
          description,
          isActive,
        },
        userId
      );

      res.status(201).json({
        success: true,
        data: material,
        message: "Material created successfully",
      });
    } catch (error) {
      console.error("Create material error:", error);
      if (error.message === "Material with this code already exists") {
        return res.status(400).json({
          success: false,
          message: "Material with this code already exists",
        });
      }
      if (error.message === "Category not found") {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create material",
      });
    }
  },

  async updateMaterial(req, res, next) {
    try {
      const { id } = req.params;
      const { name, categoryId, unit, reorderLevel, description, isActive } = req.body;

      const material = await materialService.updateMaterial(id, {
        name,
        categoryId,
        unit,
        reorderLevel,
        description,
        isActive,
      });

      res.json({
        success: true,
        data: material,
        message: "Material updated successfully",
      });
    } catch (error) {
      console.error("Update material error:", error);
      if (error.message === "Material not found") {
        return res.status(404).json({
          success: false,
          message: "Material not found",
        });
      }
      if (error.message === "Category not found") {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update material",
      });
    }
  },

  async deleteMaterial(req, res, next) {
    try {
      const { id } = req.params;

      await materialService.deleteMaterial(id);

      res.json({
        success: true,
        message: "Material deleted successfully",
      });
    } catch (error) {
      console.error("Delete material error:", error);
      if (error.message === "Material not found") {
        return res.status(404).json({
          success: false,
          message: "Material not found",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete material",
      });
    }
  },

  async getLowStockMaterials(req, res, next) {
    try {
      const materials = await materialService.getLowStockMaterials();

      res.json({
        success: true,
        data: materials,
      });
    } catch (error) {
      console.error("Get low stock materials error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch low stock materials",
      });
    }
  },

  async getStockStats(req, res, next) {
    try {
      const stats = await materialService.getStockStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get stock stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch stock stats",
      });
    }
  },

  async getAllCategories(req, res, next) {
    try {
      const categories = await materialService.getAllCategories();

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch categories",
      });
    }
  },

  async createCategory(req, res, next) {
    try {
      const { name, description } = req.body;

      const category = await materialService.createCategory({
        name,
        description,
      });

      res.status(201).json({
        success: true,
        data: category,
        message: "Category created successfully",
      });
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create category",
      });
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const category = await materialService.updateCategory(id, {
        name,
        description,
      });

      res.json({
        success: true,
        data: category,
        message: "Category updated successfully",
      });
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update category",
      });
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      await materialService.deleteCategory(id);

      res.json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Delete category error:", error);
      if (error.message === "Cannot delete category with associated materials") {
        return res.status(400).json({
          success: false,
          message: "Cannot delete category with associated materials",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete category",
      });
    }
  },

  async getStockHistory(req, res, next) {
    try {
      const { id } = req.params;
      const history = await materialService.getStockHistory(id);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error("Get stock history error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch stock history",
      });
    }
  },
};
