// seed.js
import pg from "pg";
import dotenv from 'dotenv';
const { Pool } = pg;
dotenv.config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const seedDatabase = async () => {
  try {
    await pool.query("BEGIN");

    // Crear tablas si no existen
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budget_roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR
      );

      CREATE TABLE IF NOT EXISTS budget_user_roles (
        user_id INTEGER,
        role_id INTEGER,
        PRIMARY KEY (user_id, role_id)
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        name TEXT,
        created_by INTEGER,
        status TEXT DEFAULT 'Draft',
        period_start DATE,
        period_end DATE,
        created_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS budget_versions (
        id SERIAL PRIMARY KEY,
        budget_id INTEGER,
        version_number INTEGER,
        created_by INTEGER,
        created_at TIMESTAMP,
        state TEXT DEFAULT 'Draft',
        name TEXT
      );

      CREATE TABLE IF NOT EXISTS forecasts (
        id SERIAL PRIMARY KEY,
        name TEXT,
        created_by INTEGER,
        period_start DATE,
        period_end DATE,
        created_at TIMESTAMP,
        state TEXT DEFAULT 'Draft',
        budget_id INTEGER
      );

      CREATE TABLE IF NOT EXISTS forecast_versions (
        id SERIAL PRIMARY KEY,
        forecast_id INTEGER,
        version_number INTEGER,
        created_by INTEGER,
        created_at TIMESTAMP,
        state TEXT DEFAULT 'Draft'
      );

      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name TEXT,
        description TEXT,
        created_at TIMESTAMP,
        budget_version_id INTEGER,
        forecast_version_id INTEGER,
        editor_id INTEGER,
        reviewer_id INTEGER,
        zona TEXT,
        producto TEXT,
        regional TEXT,
        bp TEXT,
        tributariedad TEXT,
        modalidad TEXT,
        type VARCHAR,
        state TEXT DEFAULT 'Draft'
      );

      CREATE TABLE IF NOT EXISTS item_values (
        id SERIAL PRIMARY KEY,
        item_id INTEGER,
        month DATE,
        value NUMERIC,
        created_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS approvals (
        id SERIAL PRIMARY KEY,
        entity_type TEXT,
        entity_id INTEGER,
        approved_by INTEGER,
        approved_at TIMESTAMP,
        approved BOOLEAN,
        comment TEXT
      );
    `);

    // Roles
    await pool.query(`
      INSERT INTO budget_roles (id, name) VALUES
      (7, 'manager'),
      (8, 'analyst'),
      (9, 'commercial')
      ON CONFLICT DO NOTHING;
    `);

    // Users
   /*  await pool.query(`
      INSERT INTO users (id, email, password, username, role_id, created_at) VALUES
      (1, 'manager@example.com', 'hashedpass1', 'manager1', 7, NOW()),
      (2, 'analyst@example.com', 'hashedpass2', 'analyst1', 8, NOW()),
      (3, 'commercial@example.com', 'hashedpass3', 'commercial1', 9, NOW())
      ON CONFLICT DO NOTHING;
    `); */

    // User roles (secondary)
    await pool.query(`
      INSERT INTO budget_user_roles (user_id, role_id) VALUES
      (1, 7),
      (2, 8),
      (3, 9)
      ON CONFLICT DO NOTHING;
    `);

    // Budgets
    await pool.query(`
      INSERT INTO budgets (id, name, created_by, status, period_start, period_end, created_at) VALUES
      (1, 'Presupuesto 2025', 2, false, '2025-01-01', '2025-12-01', NOW())
      ON CONFLICT DO NOTHING;
    `);

    // Versions
    await pool.query(`
      INSERT INTO budget_versions (id, budget_id, version_number, created_by, created_at, state, name) VALUES
      (1, 1, 1, 2, NOW(), false, 'Version Inicial')
      ON CONFLICT DO NOTHING;
    `);

    // Forecasts
    await pool.query(`
      INSERT INTO forecasts (id, name, created_by, period_start, period_end, created_at, state, budget_id) VALUES
      (1, 'Forecast Q3', 2, '2025-06-01', '2025-12-01', NOW(), false, 1)
      ON CONFLICT DO NOTHING;
    `);

    // Forecast versions
    await pool.query(`
      INSERT INTO forecast_versions (id, forecast_id, version_number, created_by, created_at, state) VALUES
      (1, 1, 1, 2, NOW(), false)
      ON CONFLICT DO NOTHING;
    `);

    // Items
    await pool.query(`
      INSERT INTO items (id, name, description, created_at, budget_version_id, forecast_version_id, editor_id, reviewer_id, zona, producto, regional, bp, tributariedad, modalidad, type, state) VALUES
      (1, 'Item 1', 'Descripción del item', NOW(), 1, NULL, 2, 3, 'Norte', 'Producto A', 'Centro', 'BP001', 'IVA', 'Mensual', 'budget', false)
      ON CONFLICT DO NOTHING;
    `);

    // Item values
    await pool.query(`
      INSERT INTO item_values (id, item_id, month, value, created_at) VALUES
      (1, 1, '2025-01-01', 100.0, NOW()),
      (2, 1, '2025-02-01', 120.0, NOW())
      ON CONFLICT DO NOTHING;
    `);

    // Approvals
    await pool.query(`
      INSERT INTO approvals (id, entity_type, entity_id, approved_by, approved_at, approved, comment) VALUES
      (1, 'budget', 1, 1, NOW(), true, 'Aprobado por manager'),
      (2, 'version', 1, 1, NOW(), true, 'Primera versión OK')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query("COMMIT");
    console.log("✅ Base de datos inicializada exitosamente.");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Error al inicializar la base de datos:", err);
  } finally {
    pool.end();
  }
};

seedDatabase();