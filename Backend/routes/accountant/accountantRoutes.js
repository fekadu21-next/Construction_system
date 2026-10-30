import express from "express";
import { accountantController } from "../../controllers/accountant/accountantController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { USER_ROLES } from "../../constants/roles.js";

const router = express.Router();

router.use(authenticate);

const ACCOUNTANT_ROLES = [
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.GENERAL_MANAGER,
];

router.use(authorize(...ACCOUNTANT_ROLES));

// Financial dashboard
router.get("/dashboard", accountantController.getDashboard);

// Budget management
router.get("/budgets", accountantController.getBudgets);
router.post("/budgets", accountantController.createBudget);
router.patch("/budgets/project/:projectId", accountantController.updateProjectBudget);
router.put("/budgets/project/:projectId", accountantController.updateProjectBudget);

// Expenses management
router.get("/expenses", accountantController.getExpenses);
router.post("/expenses", accountantController.createExpense);
router.patch("/expenses/:id/approval", accountantController.reviewExpense);
router.patch("/expenses/:id/payment", accountantController.recordPayment);

// Labor cost review & authorized posting
router.get("/labor-costs", accountantController.getEligibleLaborCosts);
router.post("/labor-costs/post", accountantController.postLaborCost);

// Invoices & payments
router.get("/invoices", accountantController.getInvoices);
router.post("/invoices", accountantController.createInvoice);
router.post("/invoices/:id/pay", accountantController.payInvoice);

// Material costs & requisition tracking
router.get("/material-costs", accountantController.getMaterialCosts);
router.post("/material-costs/record", accountantController.recordMaterialCost);

// Reports & lookups
router.get("/reports", accountantController.getReports);
router.get("/suppliers", accountantController.getSuppliers);

export default router;
