import { supplierService } from "../../services/procurement/supplierService.js";

export const supplierController = {
  async getAllSuppliers(req, res, next) {
    try {
      const { includeInactive, search } = req.query;

      const suppliers = await supplierService.getAllSuppliers({
        includeInactive: includeInactive === "true",
        search,
      });

      res.json({
        success: true,
        data: suppliers,
      });
    } catch (error) {
      console.error("Get suppliers error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch suppliers",
      });
    }
  },

  async getSupplierById(req, res, next) {
    try {
      const { id } = req.params;

      const supplier = await supplierService.getSupplierById(id);

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      console.error("Get supplier error:", error);
      if (error.message === "Supplier not found") {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch supplier",
      });
    }
  },

  async createSupplier(req, res, next) {
    try {
      const userId = req.userId;
      const {
        code,
        name,
        contactPerson,
        email,
        phone,
        address,
        city,
        country,
        website,
        taxId,
        paymentTerms,
        notes,
        isActive,
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Supplier or business name is required",
        });
      }

      const supplier = await supplierService.createSupplier(
        {
          code,
          name: name.trim(),
          contactPerson: contactPerson?.trim() || null,
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          country: country?.trim() || null,
          website: website?.trim() || null,
          taxId: taxId?.trim() || null,
          paymentTerms: paymentTerms?.trim() || null,
          notes: notes?.trim() || null,
          isActive: isActive !== undefined ? isActive : true,
        },
        userId
      );

      res.status(201).json({
        success: true,
        data: supplier,
        message: "Supplier created successfully",
      });
    } catch (error) {
      console.error("Create supplier error:", error);
      if (error.message === "Supplier with this code already exists") {
        return res.status(400).json({
          success: false,
          message: "Supplier with this code already exists",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create supplier",
      });
    }
  },

  async updateSupplier(req, res, next) {
    try {
      const { id } = req.params;
      const {
        code,
        name,
        contactPerson,
        email,
        phone,
        address,
        city,
        country,
        website,
        taxId,
        paymentTerms,
        notes,
        isActive,
      } = req.body;

      const supplier = await supplierService.updateSupplier(id, {
        code,
        name,
        contactPerson,
        email,
        phone,
        address,
        city,
        country,
        website,
        taxId,
        paymentTerms,
        notes,
        isActive,
      });

      res.json({
        success: true,
        data: supplier,
        message: "Supplier updated successfully",
      });
    } catch (error) {
      console.error("Update supplier error:", error);
      if (error.message === "Supplier not found") {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }
      if (error.message === "Supplier with this code already exists") {
        return res.status(400).json({
          success: false,
          message: "Supplier with this code already exists",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update supplier",
      });
    }
  },

  async deleteSupplier(req, res, next) {
    try {
      const { id } = req.params;

      await supplierService.deleteSupplier(id);

      res.json({
        success: true,
        message: "Supplier deactivated successfully",
      });
    } catch (error) {
      console.error("Delete supplier error:", error);
      if (error.message === "Supplier not found") {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete supplier",
      });
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await supplierService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get supplier stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch supplier stats",
      });
    }
  },
};
