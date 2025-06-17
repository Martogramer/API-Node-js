import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { pool } from './config/db.js';
import dotenv from 'dotenv';

import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import versionRoutes from './routes/versions.route.js';
import budgetRoutes from './routes/budget.route.js';
import itemRoutes from './routes/item.route.js';

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('Usuarios - Cargill API');
});
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api', budgetRoutes);
app.use('/api', itemRoutes);

async function testConnectionVerbose() {
  try {
    const info = await pool.query(`
      SELECT
        current_database() AS db,
        current_user AS user,
        version(),
        NOW() AS connected_at
    `);

    const row = info.rows[0];
    console.log('✅ Conexión exitosa:');
    console.log(`🗄️  Base de datos: ${row.db}`);
    console.log(`👤 Usuario: ${row.user}`);
    console.log(`🧠 PostgreSQL: ${row.version.split('\\n')[0]}`);
    console.log(`🕒 Fecha: ${row.connected_at}`);

    const activeConns = await pool.query(`SELECT count(*) FROM pg_stat_activity;`);
    console.log(`📊 Conexiones activas: ${activeConns.rows[0].count}`);

    const tablas = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📂 Tablas en esquema public:');
    for (const t of tablas.rows) {
      console.log(`   • ${t.table_name}`);
    }

    for (const t of tablas.rows) {
      const cols = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [t.table_name]);

      console.log(`📄 Estructura de "${t.table_name}":`);
      cols.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

  } catch (err) {
    console.error('❌ Error al conectar/verificar la base de datos:', err);
    process.exit(1);
  }
}

testConnectionVerbose().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});
