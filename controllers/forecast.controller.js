import { pool } from "../config/db.js";
export const getForecastHierarchy = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        f.id AS forecast_id,
        f.name AS forecast_name,
        f.period_start,
        f.period_end,
        f.created_at AS forecast_created_at,
        f.state AS forecast_state,
        uf.id AS forecast_user_id,
        uf.username AS forecast_user_name,

        fv.id AS version_id,
        fv.version_number,
        fv.created_at AS version_created_at,
        fv.state AS version_state,
        uv.id AS version_user_id,
        uv.username AS version_user_name,

        i.id AS item_id,
        i.name AS item_name,
        i.state AS item_state,
        i.zona,
        i.producto,
        i.regional,
        i.bp,
        i.tributariedad,
        i.modalidad,

        ue.id AS editor_id,
        ue.username AS editor_name,
        ur.id AS reviewer_id,
        ur.username AS reviewer_name,

        iv.month,
        iv.value

      FROM forecasts f
      JOIN users uf ON f.created_by = uf.id

      LEFT JOIN forecast_versions fv ON fv.forecast_id = f.id
      LEFT JOIN users uv ON fv.created_by = uv.id

      LEFT JOIN items i ON i.forecast_version_id = fv.id
      LEFT JOIN users ue ON i.editor_id = ue.id
      LEFT JOIN users ur ON i.reviewer_id = ur.id

      LEFT JOIN item_values iv ON iv.item_id = i.id

      ORDER BY f.id, fv.id, i.id, iv.month
    `);

    const forecastsMap = new Map();

    for (const row of result.rows) {
      const fId = row.forecast_id;
      const vId = row.version_id;
      const iId = row.item_id;

      if (!forecastsMap.has(fId)) {
        forecastsMap.set(fId, {
          id: fId,
          name: row.forecast_name,
          period_start: row.period_start,
          period_end: row.period_end,
          created_at: row.forecast_created_at,
          state: row.forecast_state,
          created_by: {
            id: row.forecast_user_id,
            name: row.forecast_user_name,
          },
          versions: [],
        });
      }

      const forecast = forecastsMap.get(fId);

      let version = forecast.versions.find((v) => v.id === vId);
      if (!version && vId) {
        version = {
          id: vId,
          version_number: row.version_number,
          created_at: row.version_created_at,
          state: row.version_state,
          created_by: {
            id: row.version_user_id,
            name: row.version_user_name,
          },
          items: [],
        };
        forecast.versions.push(version);
      }

      let item = version?.items.find((i) => i.id === iId);
      if (!item && iId) {
        item = {
          id: iId,
          name: row.item_name,
          state: row.item_state,
          zona: row.zona,
          producto: row.producto,
          regional: row.regional,
          bp: row.bp,
          tributariedad: row.tributariedad,
          modalidad: row.modalidad,
          editor: { id: row.editor_id, name: row.editor_name },
          reviewer: { id: row.reviewer_id, name: row.reviewer_name },
          values: [],
        };
        version?.items.push(item);
      }

      if (row.month) {
        item?.values.push({
          month: row.month,
          value: row.value,
        });
      }
    }

    res.json(Array.from(forecastsMap.values()));
  } catch (err) {
    console.error("Error fetching forecast hierarchy:", err);
    res.status(500).json({ error: "Error fetching forecasts" });
  }
};

export const createForecast = async (req, res) => {
  const { budget_id, name } = req.body;
  const requesterId = req.user.userId;

  if (!budget_id) {
    return res.status(400).json({ error: "budget_id is required" });
  }

  try {
    // Verificar que el usuario sea analyst
    const roleResult = await pool.query(`
      SELECT r.name FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [requesterId]);

    const role = roleResult.rows[0]?.name;
    if (role !== "analyst") {
      return res.status(403).json({ error: "Only analysts can create forecasts" });
    }

    // Obtener período del presupuesto
    const budgetResult = await pool.query(
      `SELECT period_end FROM budgets WHERE id = $1`,
      [budget_id]
    );

    if (budgetResult.rows.length === 0) {
      return res.status(404).json({ error: "Budget not found" });
    }

    const period_end = budgetResult.rows[0].period_end;
    const now = new Date();
    const period_start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Si no se pasa name, usamos fecha por defecto
    const forecastName = name || `Forecast ${period_start.toISOString().slice(0, 10)}`;

    // Insertar forecast
const result = await pool.query(
  `INSERT INTO forecasts (name, budget_id, created_by, period_start, period_end, created_at, state)
   VALUES ($1, $2, $3, $4, $5, NOW(), false)
   RETURNING *`,
  [forecastName, budget_id, requesterId, period_start, period_end]
);

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("Error creating forecast:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createForecastVersion = async (req, res) => {
  const { forecast_id, version_number } = req.body;
  const requesterId = req.user.userId;

  if (!forecast_id || !version_number) {
    return res.status(400).json({ error: "forecast_id and version_number are required" });
  }

  try {
    // Verificar que el usuario sea analyst
    const roleResult = await pool.query(`
      SELECT r.name FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [requesterId]);

    const role = roleResult.rows[0]?.name;
    if (role !== "analyst") {
      return res.status(403).json({ error: "Only analysts can create forecast versions" });
    }

    // Verificar que el forecast exista
    const forecastResult = await pool.query(
      `SELECT id FROM forecasts WHERE id = $1`,
      [forecast_id]
    );

    if (forecastResult.rows.length === 0) {
      return res.status(404).json({ error: "Forecast not found" });
    }

    // Insertar forecast version
    const result = await pool.query(
      `INSERT INTO forecast_versions (forecast_id, created_by, version_number, state, created_at)
       VALUES ($1, $2, $3, false, NOW())
       RETURNING *`,
      [forecast_id, requesterId, version_number]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("Error creating forecast version:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
