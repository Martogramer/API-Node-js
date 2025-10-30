import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
// import { pool } from './config/db.js'; // 🔹 Comentado mientras desactivamos DB

// Importar rutas existentes
/* import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import versionRoutes from './routes/versions.route.js';
import budgetRoutes from './routes/budget.route.js';
import forecastsRoutes from './routes/forecasts.route.js';
import approvalRoutes from './routes/approval.route.js'; */

import auditRoutes from './routes/audit.route.js';
// Cargar variables de entorno
dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();

// -------------------------------
//  SEGURIDAD Y CONFIGURACIÓN
// -------------------------------

// Helmet: protege cabeceras HTTP comunes contra ataques
app.use(helmet());

// CORS: permite conexión solo desde dominios seguros (ajustá el origin cuando tengas el frontend)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*', // por ahora abierto, pero configurable
    credentials: true,
  })
);

// Rate limiter: limita el número de requests por IP (para prevenir abuso)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 100, // máximo 100 requests por IP
  message: {
    status: 429,
    message: 'Demasiadas solicitudes desde esta IP. Intente más tarde.',
  },
});
app.use(limiter);

// -------------------------------
//  MIDDLEWARES BÁSICOS
// -------------------------------
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan('dev')); // Logs HTTP
console.log('🧩 Middlewares cargados correctamente.');

// -------------------------------
//  RUTAS PRINCIPALES
// -------------------------------
app.get('/', (req, res) => {
  res.send('🚀 API Backend Operativa - LoopeAPI + SEMrush (sin DB)');
});
app.use('/api', auditRoutes);

/* app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/forecasts', forecastsRoutes);
app.use('/api/approvals', approvalRoutes);
 */

console.log('Rutas registradas correctamente.');

// -------------------------------
//  CONEXIÓN A LA BASE DE DATOS (DESACTIVADA)
// -------------------------------
async function testConnectionVerbose() {
  try {
    console.log('🟢 Base de datos desactivada temporalmente. Servidor funcionando sin DB.');
  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

// -------------------------------
// ⚙️  MANEJO DE ERRORES GLOBALES
// -------------------------------

// Middleware para rutas no encontradas
app.use((req, res, next) => {
  console.warn(`⚠️  Ruta no encontrada: ${req.originalUrl}`);
  res.status(404).json({ status: 404, message: 'Ruta no encontrada' });
});

// Middleware global de errores
app.use((err, req, res, next) => {
  console.error('💥 Error inesperado:', err.message);
  res.status(500).json({
    status: 500,
    message: 'Error interno del servidor',
    error: err.message,
  });
});

// -------------------------------
// 🚀  INICIO DEL SERVIDOR
// -------------------------------
testConnectionVerbose().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor iniciado en http://localhost:${PORT}`);
    console.log('🌐 Esperando conexiones (sin DB por ahora)...');
  });
});
