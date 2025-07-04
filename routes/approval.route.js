import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { createApproval } from "../controllers/approval.controller.js";

const router = express.Router();

router.post("/", authenticateToken, createApproval);

export default router;