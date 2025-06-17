// routes/itemRoutes.js
import express from 'express';
import { createItem, getAssignedItems, updateItemValues } from '../controllers/item.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/items', createItem);

router.get('/items/assigned', authenticateToken, getAssignedItems);

router.put('/items/:id/values', authenticateToken, updateItemValues);

export default router;
