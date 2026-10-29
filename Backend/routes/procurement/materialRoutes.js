import express from "express";
import { materialController } from "../../controllers/procurement/materialController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/stats", materialController.getStockStats);
router.get("/low-stock", materialController.getLowStockMaterials);
router.get("/categories", materialController.getAllCategories);
router.post("/categories", materialController.createCategory);
router.put("/categories/:id", materialController.updateCategory);
router.delete("/categories/:id", materialController.deleteCategory);
router.get("/", materialController.getAllMaterials);
router.get("/:id", materialController.getMaterialById);
router.get("/:id/stock-history", materialController.getStockHistory);
router.post("/", materialController.createMaterial);
router.put("/:id", materialController.updateMaterial);
router.delete("/:id", materialController.deleteMaterial);

export default router;
