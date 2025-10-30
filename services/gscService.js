/* GOOGLE SEARCH CONSOLE SERVICE */

import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Usa Google Search Console API (searchanalytics.query).
 * Requiere credenciales de cuenta de servicio con acceso al sitio GSC.
 */

const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return auth;
}

export async function fetchSearchAnalytics(siteUrl = process.env.GSC_SITE_URL, startDate = null, endDate = null) {
  const auth = getAuthClient();
  const gsc = google.searchconsole({ version: 'v1', auth });

  const today = new Date();
  const defaultEnd = endDate || today.toISOString().split('T')[0];
  const defaultStart = startDate || (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const body = {
    startDate: defaultStart,
    endDate: defaultEnd,
    dimensions: ['query', 'page'],D
    rowLimit: 2500,
  };

  const res = await gsc.searchanalytics.query({ siteUrl, requestBody: body });
  // Respuesta: rows: [{keys: ['keyword','page'], clicks, impressions, ctr, position}]
  return res.data || {};
}
