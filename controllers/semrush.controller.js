import { getSiteAudit } from '../services/semrush.service.js';

export async function auditSite(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: 400,
      message: 'El parámetro "url" es obligatorio',
    });
  }

  const result = await getSiteAudit(url);

  if (result.status === 'error') {
    return res.status(500).json({
      status: 500,
      message: 'Error al consultar SEMrush',
      error: result.message,
    });
  }

  return res.json({
    status: 200,
    message: 'Auditoría obtenida correctamente',
    data: result.data,
  });
}
