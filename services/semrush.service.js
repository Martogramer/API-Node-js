import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const SEMRUSH_API_KEY = process.env.SEMRUSH_API_KEY;

if (!SEMRUSH_API_KEY) {
  console.warn('⚠️ SEMRUSH_API_KEY no definida en .env');
}

export async function getSiteAudit(url) {
  try {
    // Endpoint de SEMrush (ejemplo para domain overview)
    const response = await axios.get('https://api.semrush.com/', {
      params: {
        type: 'domain_ranks',
        key: SEMRUSH_API_KEY,
        domain: url,
        export_columns: 'Dn,Rk,Or,Ot,Oc,Ad,At,Ac',
        database: 'us', // cambiar según región
        display_limit: 10
      },
    });

    // SEMrush a veces devuelve CSV, podemos devolverlo como texto plano por ahora
    return {
      status: 'success',
      data: response.data,
    };
  } catch (error) {
    console.error('❌ Error SEMrush API:', error.message);
    return {
      status: 'error',
      message: error.message,
    };
  }
}
