/* (GA4 Data API) SERVICE */
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const propertyId = process.env.GA4_PROPERTY_ID;

/**
 * Requiere habilitar "Google Analytics Data API" y una cuenta de servicio
 * con permiso de lectura en la propiedad GA4.
 */

function getAuthClient() {
  return new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
}

export async function fetchBasicMetrics(startDate = null, endDate = null) {
  const auth = getAuthClient();
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

  const today = new Date();
  const defaultEnd = endDate || today.toISOString().split('T')[0];
  const defaultStart = startDate || (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const request = {
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: defaultStart, endDate: defaultEnd }],
      metrics: [{ name: 'sessions' }, { name: 'users' }, { name: 'engagementRate' }],
      dimensions: [{ name: 'pagePath' }],
      limit: 1000
    }
  };

  const response = await analyticsData.properties.runReport(request);
  return response.data || {};
}
