import express from 'express';
import { generateReport, listReports, getReportFile } from '../controllers/reportController.js';

const router = express.Router();

/**
 * GET /api/seo/report?site=https://midominio.com&email=xxx@yyy
 * Lanza la generación del reporte (sin bloqueo: devuelve cuando termina)
 */
router.get('/report', generateReport);

/**
 * GET /api/seo/history
 * Lista reportes guardados
 */
router.get('/history', listReports);

/**
 * GET /api/seo/report-file/:filename
 * Descarga un archivo de reportes
 */
router.get('/report-file/:filename', getReportFile);

export default router;
