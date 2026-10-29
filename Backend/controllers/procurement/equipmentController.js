import { equipmentService } from "../../services/procurement/equipmentService.js";

export const equipmentController = {
  async getAllEquipment(req, res) {
    try {
      const { status, ownership, category, search, projectId } = req.query;
      const equipment = await equipmentService.getAllEquipment({
        status,
        ownership,
        category,
        search,
        projectId,
      });
      res.json({ success: true, data: equipment });
    } catch (error) {
      console.error("Get equipment error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch equipment",
      });
    }
  },

  async getEquipmentById(req, res) {
    try {
      const equipment = await equipmentService.getEquipmentById(req.params.id);
      res.json({ success: true, data: equipment });
    } catch (error) {
      if (error.message === "Equipment not found")
        return res.status(404).json({ success: false, message: "Equipment not found" });
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createEquipment(req, res) {
    try {
      const equipment = await equipmentService.createEquipment(
        req.body,
        req.userId
      );
      res.status(201).json({
        success: true,
        data: equipment,
        message: "Equipment registered successfully",
      });
    } catch (error) {
      console.error("Create equipment error:", error);
      if (
        error.message === "Equipment with this code already exists" ||
        error.message === "Equipment code is required" ||
        error.message === "Equipment name is required"
      ) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message || "Failed to create equipment" });
    }
  },

  async updateEquipment(req, res) {
    try {
      const equipment = await equipmentService.updateEquipment(
        req.params.id,
        req.body
      );
      res.json({
        success: true,
        data: equipment,
        message: "Equipment updated successfully",
      });
    } catch (error) {
      if (error.message === "Equipment not found")
        return res.status(404).json({ success: false, message: "Equipment not found" });
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async returnEquipment(req, res) {
    try {
      const result = await equipmentService.returnEquipment(
        req.params.id,
        req.body,
        req.userId
      );
      res.json({
        success: true,
        data: result,
        message: "Equipment returned to supplier. Off-hire certificate generated.",
      });
    } catch (error) {
      if (error.message === "Equipment not found")
        return res.status(404).json({ success: false, message: "Equipment not found" });
      if (error.message === "Only rented equipment can be returned")
        return res.status(400).json({ success: false, message: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteEquipment(req, res) {
    try {
      await equipmentService.deleteEquipment(req.params.id);
      res.json({ success: true, message: "Equipment record deleted" });
    } catch (error) {
      if (error.message === "Equipment not found")
        return res.status(404).json({ success: false, message: "Equipment not found" });
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getEquipmentStats(req, res) {
    try {
      const stats = await equipmentService.getEquipmentStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
