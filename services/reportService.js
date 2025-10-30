/* (genera CSV y PDF)  */
import path from 'path';
import fs from 'fs/promises';
import createCsvWriter from 'csv-writer';
import puppeteer from 'puppeteer';
import { ensureReportsDir } from '../utils/storage.js';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

export async function createReport({ site, gscData, gaData, crawlResult }) {
  await ensureReportsDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = `report-${site.replace(/https?:\/\//, '').replace(/\W+/g,'_')}-${timestamp}`;
  const jsonPath = `${REPORTS_DIR}/${baseName}.json`;
  const csvPath = `${REPORTS_DIR}/${baseName}.csv`;
  const pdfPath = `${REPORTS_DIR}/${baseName}.pdf`;

  const reportObject = {
    site,
    generatedAt: new Date().toISOString(),
    gsc: gscData,
    ga: gaData,
    crawl: crawlResult
  };

  // Save JSON
  await fs.writeFile(jsonPath, JSON.stringify(reportObject, null, 2), 'utf8');

  // Generate CSV (flatten a bit - ejemplo: top queries)
  const rows = (gscData.rows || []).map(r => {
    const keys = r.keys || [];
    return {
      query: keys[0] || '',
      page: keys[1] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0
    };
  });

  const header = [
    { id: 'query', title: 'query' },
    { id: 'page', title: 'page' },
    { id: 'clicks', title: 'clicks' },
    { id: 'impressions', title: 'impressions' },
    { id: 'ctr', title: 'ctr' },
    { id: 'position', title: 'position' }
  ];

  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: csvPath,
    header
  });

  await csvWriter.writeRecords(rows);

  // Generate PDF via Puppeteer rendering a simple HTML
  const html = generateHtmlReport(reportObject, rows);
  await renderPdfFromHtml(html, pdfPath);

  return {
    id: baseName,
    generatedAt: new Date().toISOString(),
    files: [jsonPath, csvPath, pdfPath]
  };
}

function generateHtmlReport(reportObj, rows) {
  const site = reportObj.site;
  const date = reportObj.generatedAt;
  // Simple HTML. Podés perfilar diseño aquí.
  const rowsHtml = rows.slice(0, 50).map(r => `
    <tr>
      <td>${escapeHtml(r.query)}</td>
      <td>${escapeHtml(r.page)}</td>
      <td>${r.clicks}</td>
      <td>${r.impressions}</td>
      <td>${(r.ctr*100).toFixed(2)}%</td>
      <td>${r.position}</td>
    </tr>
  `).join('\n');

  return `
  <html>
    <head><meta charset="utf-8"><title>SEO Report</title></head>
    <body>
      <h1>SEO Report — ${escapeHtml(site)}</h1>
      <p>Generated at ${escapeHtml(date)}</p>
      <h2>Top queries</h2>
      <table border="1" cellpadding="4" cellspacing="0">
        <thead><tr><th>Query</th><th>Page</th><th>Clicks</th><th>Impr.</th><th>CTR</th><th>Pos</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body>
  </html>
  `;
}

function escapeHtml(s='') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function renderPdfFromHtml(html, outPath) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outPath, format: 'A4' });
  await browser.close();
}
