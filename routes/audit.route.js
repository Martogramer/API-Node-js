import express from 'express';
import { auditSite } from '../controllers/semrush.controller.js';

const router = express.Router();

// GET /api/audit?url=
router.get('/audit', auditSite);

export default router;
