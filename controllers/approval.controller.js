// controllers/approval.controller.js
import { pool } from "../config/db.js";

export const createApproval = async (req, res) => {
  const { entityType, entityId, approved, comment } = req.body;
  const approvedBy = req.user.userId;

  if (!entityType || !entityId || typeof approved !== "boolean") {
    return res.status(400).json({ error: "Missing or invalid required fields" });
  }

  const validEntities = {
    budget: "budgets",
    forecast: "forecasts",
    version: "versions",
    forecast_version: "forecast_versions",
    item: "items",
  };

  const tableName = validEntities[entityType];

  if (!tableName) {
    return res.status(400).json({ error: "Invalid entity type" });
  }

  try {
    const client = await pool.connect();
    await client.query("BEGIN");

    // 1. Insertar en tabla approvals
    await client.query(
      `INSERT INTO approvals (entity_type, entity_id, approved_by, approved, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [entityType, entityId, approvedBy, approved, comment || null]
    );

    // 2. Actualizar el estado en la tabla correspondiente
    await client.query(
      `UPDATE ${tableName}
       SET state = $1
       WHERE id = $2`,
      [approved, entityId]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Aprobación registrada con éxito" });
  } catch (err) {
    console.error("Error creating approval:", err);
    res.status(500).json({ error: "Error interno al registrar aprobación" });
  }
};
