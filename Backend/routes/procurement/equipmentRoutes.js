import express from "express";
import { equipmentController } from "../../controllers/procurement/equipmentController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/stats", equipmentController.getEquipmentStats);
router.get("/", equipmentController.getAllEquipment);
router.get("/:id", equipmentController.getEquipmentById);
router.post("/", equipmentController.createEquipment);
router.put("/:id", equipmentController.updateEquipment);
router.post("/:id/return", equipmentController.returnEquipment);
router.delete("/:id", equipmentController.deleteEquipment);

export default router;
