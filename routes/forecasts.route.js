import express from "express";
import { createForecast, createForecastVersion, getForecastHierarchy } from "../controllers/forecast.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authenticateToken, createForecast);
router.post("/forecast-versions", authenticateToken, createForecastVersion);
router.get("/hierarchy", getForecastHierarchy);

export default router;
