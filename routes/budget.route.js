import express from 'express';
import {
  createBudget,
  createBudgetVersion,
  getBudgetsHierarchy
} from '../controllers/budget.controller.js';

const router = express.Router();

router.post('/budgets', createBudget);
router.post('/budgets/version', createBudgetVersion);
router.get('/budgets/hierarchy', getBudgetsHierarchy);

export default router;
