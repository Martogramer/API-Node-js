import { pool } from "../config/db.js";
export const createItem = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "No body provided" });
  }

  const {
    name,
    description,
    version_id, // puede ser una versión de budget o forecast
    type, // "budget" o "forecast"
    editor_id,
    reviewer_id,
    zona,
    producto,
    regional,
    bp,
    tributariedad,
    modalidad,
  } = req.body;

  // Validación de campos
  if (
    !name ||
    !description ||
    !version_id ||
    !type ||
    !editor_id ||
    !reviewer_id ||
    !zona ||
    !producto ||
    !regional ||
    !bp ||
    !tributariedad ||
    !modalidad
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!["budget", "forecast"].includes(type)) {
    return res
      .status(400)
      .json({ error: "Invalid type (must be 'budget' or 'forecast')" });
  }

  const requesterId = req.user.userId;
  const client = await pool.connect();

  try {
    // Verificar rol analyst
    const roleResult = await pool.query(
      `
      SELECT r.name FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `,
      [requesterId]
    );

    const requesterRole = roleResult.rows[0]?.name;
    if (requesterRole !== "analyst") {
      return res.status(403).json({ error: "Only analysts can create items" });
    }

    await client.query("BEGIN");

    // Determinar columnas
    const versionColumn =
      type === "budget" ? "budget_version_id" : "forecast_version_id";

    const insertQuery = `
      INSERT INTO items (
        name, description, ${versionColumn}, editor_id, reviewer_id,
        zona, producto, regional, bp, tributariedad, modalidad, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
      RETURNING id
    `;

    const itemResult = await client.query(insertQuery, [
      name,
      description,
      version_id,
      editor_id,
      reviewer_id,
      zona,
      producto,
      regional,
      bp,
      tributariedad,
      modalidad,
    ]);

    const itemId = itemResult.rows[0].id;

    // Obtener período desde versión
    const periodQuery =
      type === "budget"
        ? `SELECT b.period_start, b.period_end
         FROM versions v
         JOIN budgets b ON v.budget_id = b.id
         WHERE v.id = $1`
        : `SELECT f.period_start, f.period_end
         FROM forecast_versions fv
         JOIN forecasts f ON fv.forecast_id = f.id
         WHERE fv.id = $1`;

    const periodResult = await client.query(periodQuery, [version_id]);
    const { period_start, period_end } = periodResult.rows[0];

    let currentMonth = new Date(period_start);
    while (currentMonth <= period_end) {
      await client.query(
        `INSERT INTO item_values (item_id, month, value)
         VALUES ($1, $2, $3)`,
        [itemId, currentMonth.toISOString().slice(0, 10), 0.0]
      );
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    await client.query("COMMIT");
    res.status(201).json({ item_id: itemId });
  } catch (err) {
    console.error("Error creating item:", err);
    if (client) await client.query("ROLLBACK");
    res.status(500).json({ error: "Error creating item" });
  } finally {
    client.release();
  }
};

// GET /api/items/assigned/:userId
export const getAssignedItems = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Obtener items asignados
    const itemsResult = await pool.query(
      `
      SELECT * FROM items 
      WHERE editor_id = $1 OR reviewer_id = $1
    `,
      [userId]
    );

    const items = itemsResult.rows;

    // Obtener todos los item_values para esos items
    const itemIds = items.map((i) => i.id);
    let itemValues = [];
    if (itemIds.length > 0) {
      const valuesResult = await pool.query(
        `
        SELECT * FROM item_values WHERE item_id = ANY($1)
      `,
        [itemIds]
      );
      itemValues = valuesResult.rows;
    }

    // Asociar item_values a cada item
    const itemsWithValues = items.map((item) => ({
      ...item,
      values: itemValues.filter((iv) => iv.item_id === item.id),
    }));

    res.json(itemsWithValues);
  } catch (err) {
    console.error("Error fetching assigned items:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/items/:id
export const updateItemValues = async (req, res) => {
  const userId = req.user.userId;
  const itemId = req.params.id;
  const { values, state } = req.body; // values: [{ month, value }], state: 'draft' | 'review' | 'approved'

  try {
    // 1. Obtener el ítem para validar permisos
    const result = await pool.query("SELECT * FROM items WHERE id = $1", [itemId]);
    const item = result.rows[0];

    if (!item) {
      return res.status(404).json({ error: "Item no encontrado" });
    }

    // 2. Si el usuario es el editor asignado
    if (item.editor_id === userId) {
      // Permitimos que 'values' sea opcional si solo quiere actualizar estado
      if (values && !Array.isArray(values)) {
        return res.status(400).json({ error: "Debe enviar un array de valores para actualizar" });
      }

      // 2.1 Actualizar valores mensuales si vienen
      if (values && values.length > 0) {
        for (const val of values) {
          await pool.query(
            `UPDATE item_values
             SET value = $1
             WHERE item_id = $2 AND month = $3`,
            [val.value, itemId, val.month]
          );
        }
      }

      // 2.2 Si viene el estado y es válido, actualizarlo también
      if (typeof state === "string" && ["draft", "review", "approved"].includes(state)) {
        await pool.query(
          `UPDATE items
           SET state = $1
           WHERE id = $2`,
          [state, itemId]
        );
      }

      return res.json({ message: "Valores y estado actualizados correctamente", itemId });
    }

    // 3. Si el usuario es el revisor asignado
    else if (item.reviewer_id === userId) {
      if (typeof state !== "string" || !["draft", "review", "approved"].includes(state)) {
        return res.status(400).json({ error: "Estado inválido" });
      }
      if (values && values.length > 0) {
        return res.status(403).json({ error: "El revisor no puede modificar valores" });
      }

      await pool.query(
        `UPDATE items
         SET state = $1
         WHERE id = $2`,
        [state, itemId]
      );

      return res.json({ message: "Estado actualizado por el revisor", itemId });
    }

    // 4. Si no tiene permisos
    else {
      return res.status(403).json({ error: "No autorizado para modificar este ítem" });
    }
  } catch (err) {
    console.error("❌ Error actualizando valores:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};



/* export const updateItemValues = async (req, res) => {
  const userId = req.user.userId;
  const itemId = req.params.id;
  const { values, state } = req.body; // values: [{ month, value }], state: string 'draft'|'review'|'approved'

  try {
    const result = await pool.query("SELECT * FROM items WHERE id = $1", [itemId]);
    const item = result.rows[0];

    if (!item) {
      return res.status(404).json({ error: "Item no encontrado" });
    }

    // Validar permisos
    if (item.editor_id === userId) {
      // Editor puede actualizar valores y también estado
      if (values && !Array.isArray(values)) {
        return res.status(400).json({ error: "Debe enviar un array de valores para actualizar" });
      }

      if (values && values.length > 0) {
        for (const val of values) {
          await pool.query(
            `UPDATE item_values SET value = $1 WHERE item_id = $2 AND month = $3`,
            [val.value, itemId, val.month]
          );
        }
      }

      if (typeof state === "string") {
        await pool.query(`UPDATE items SET state = $1 WHERE id = $2`, [state, itemId]);
      }

      return res.json({ message: "Valores actualizados correctamente" });
    } else if (item.reviewer_id === userId) {
      // Reviewer solo puede cambiar estado, no valores
      if (values && values.length > 0) {
        return res.status(403).json({ error: "Reviewer solo puede modificar el estado" });
      }

      if (typeof state === "string") {
        await pool.query(`UPDATE items SET state = $1 WHERE id = $2`, [state, itemId]);
        return res.json({ message: "Estado actualizado correctamente" });
      } else {
        return res.status(400).json({ error: "Estado inválido" });
      }
    } else {
      return res.status(403).json({ error: "No autorizado para modificar este ítem" });
    }
  } catch (err) {
    console.error("Error updating item values:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
 */

