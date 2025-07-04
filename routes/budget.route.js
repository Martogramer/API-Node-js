import express from "express";
import {
  createBudget,
  createBudgetVersion,
  getBudgetsHierarchy,
  getBudgetVersions,
} from "../controllers/budget.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authenticateToken, createBudget);
router.post("/version", authenticateToken, createBudgetVersion);
router.get('/:id/versions', getBudgetVersions);
router.get("/hierarchy", getBudgetsHierarchy);


export default router;
