import { equipmentRepository } from "../../repositories/procurement/equipmentRepository.js";

export const equipmentService = {
  async getAllEquipment(options = {}) {
    return await equipmentRepository.findAll(options);
  },

  async getEquipmentById(id) {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) throw new Error("Equipment not found");
    return equipment;
  },

  async createEquipment(data, userId) {
    if (!data.code) throw new Error("Equipment code is required");
    if (!data.name) throw new Error("Equipment name is required");

    const existing = await equipmentRepository.findByCode(data.code);
    if (existing) throw new Error("Equipment with this code already exists");

    return await equipmentRepository.create({ ...data, createdById: userId });
  },

  async updateEquipment(id, data) {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) throw new Error("Equipment not found");
    return await equipmentRepository.update(id, data);
  },

  async returnEquipment(id, returnData, userId) {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) throw new Error("Equipment not found");
    if (equipment.ownership !== "RENTED")
      throw new Error("Only rented equipment can be returned");

    const certRef = `OFF-HIRE-${Date.now().toString().slice(-8)}`;

    return await equipmentRepository.update(id, {
      status: "RETURNED",
      returnedAt: returnData.returnDate || new Date().toISOString(),
      finalHourMeter: returnData.finalHourMeter || equipment.currentHourMeter,
      offHireCertificateRef: certRef,
      returnInspectionNotes:
        returnData.conditionNotes ||
        "Off-hire handover completed. Equipment returned in good condition.",
      projectId: null,
      projectName: null,
    });
  },

  async deleteEquipment(id) {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) throw new Error("Equipment not found");
    return await equipmentRepository.delete(id);
  },

  async getEquipmentStats() {
    return await equipmentRepository.getStats();
  },
};
