import path from 'path';
import { fileURLToPath } from 'url';
import * as gscService from '../services/gscService.js';
import * as ga4Service from '../services/ga4Service.js';
import * as crawlerService from '../services/crawlerService.js';
import * as reportService from '../services/reportService.js';
import { listReportFiles, readReport } from '../utils/storage.js';
import { sendEmailWithAttachments } from '../utils/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateReport(req, res) {
  try {
    const site = req.query.site || process.env.GSC_SITE_URL;
    const email = req.query.email || null;

    if (!site) return res.status(400).json({ error: 'site query param is required' });

    // 1) Extraer datos GSC
    const gscData = await gscService.fetchSearchAnalytics(site);

    // 2) Extraer datos GA4
    const gaData = await ga4Service.fetchBasicMetrics();

    // 3) Ejecutar crawler (Screaming Frog CLI) — opcional / fallback
    const crawlResult = await crawlerService.runCrawl(site);

    // 4) Consolidar y generar CSV + PDF
    const reportRecord = await reportService.createReport({ site, gscData, gaData, crawlResult });

    // 5) Enviar email si se pidió
    if (email) {
      await sendEmailWithAttachments(email, `SEO report for ${site}`, 'Adjunto el reporte SEO.', reportRecord.files);
    }

    res.json({ ok: true, report: reportRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}

export async function listReports(req, res) {
  try {
    const files = await listReportFiles();
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function getReportFile(req, res) {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'reports', filename);
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
