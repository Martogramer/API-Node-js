/* (Screaming Frog CLI / fallback) SERVICE */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

const REPORTS_DIR = path.join(process.cwd(), 'reports');

export async function runCrawl(siteUrl) {
  // Si Screaming Frog CLI no está instalado, devolvemos un objeto vacío
  try {
    // ejemplo de comando (ajustar según versión de SF):
    // screamingfrogseospider --crawl https://midominio.com --headless --save-crawl --output-folder ./reports
    const script = path.join(process.cwd(), 'scripts', 'crawl.sh');
    // Llamamos al script con siteUrl
    const result = await runShellScript(script, siteUrl);
    // El script debe guardar CSVs en ./reports
    return { status: 'ok', output: result };
  } catch (err) {
    console.warn('Crawler no disponible o fallo:', err.message || err);
    return { status: 'skipped', reason: err.message };
  }
}

function runShellScript(scriptPath, siteUrl) {
  return new Promise((resolve, reject) => {
    const child = spawn('sh', [scriptPath, siteUrl], { shell: true });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());

    child.on('close', code => {
      if (code === 0) resolve(stdout.trim() || 'done');
      else reject(new Error(`exit ${code}: ${stderr}`));
    });
  });
}
