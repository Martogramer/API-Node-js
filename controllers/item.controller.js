import { pool } from "../config/db.js";
export const createItem = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "No body provided" });
  }
  const {
    name,
    description,
    budget_version_id,
    editor_id,
    reviewer_id,
    zona,
    producto,
    regional,
    bp,
    tributariedad,
    modalidad,
  } = req.body;
  console.log("BODY RECIBIDO:", req.body);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Crear el item
    const itemResult = await client.query(
      `INSERT INTO items (
        name, description, budget_version_id, editor_id, reviewer_id,
        zona, producto, regional, bp, tributariedad, modalidad, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
      RETURNING id`,
      [
        name,
        description,
        budget_version_id,
        editor_id,
        reviewer_id,
        zona,
        producto,
        regional,
        bp,
        tributariedad,
        modalidad,
      ]
    );

    const itemId = itemResult.rows[0].id;

    // Obtener período del presupuesto
    const periodResult = await client.query(
      `SELECT b.period_start, b.period_end
       FROM versions v
       JOIN budgets b ON v.budget_id = b.id
       WHERE v.id = $1`,
      [budget_version_id]
    );

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
    await client.query("ROLLBACK");
    console.error("Error creating item:", err);
    res.status(500).json({ error: "Error creating item" });
  } finally {
    client.release();
  }
};

// GET /api/items/assigned/:userId
export const getAssignedItems = async (req, res) => {
  const userId = req.user.userId;

  try {
    const query = `
      SELECT * FROM items 
      WHERE editor_id = $1 OR reviewer_id = $1
    `;
    const result = await pool.query(query, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assigned items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// PUT /api/items/:id
export const updateItemValues = async (req, res) => {
  const userId = req.user.userId;
  const itemId = req.params.id;
  const { values, state } = req.body; // values: [{ month, value }], state solo para reviewer

  try {
    // 1) Obtener el item para validar permisos
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [itemId]);
    const item = result.rows[0];

    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    // 2) Validar permisos y qué se puede modificar
    if (item.editor_id === userId) {
      // Editor: puede actualizar valores y también state si quiere
      if (!values || !Array.isArray(values)) {
        return res.status(400).json({ error: 'Debe enviar un array de valores para actualizar' });
      }

      // Actualizamos los valores uno a uno (podrías usar un batch con transactions si querés)
      for (const val of values) {
        await pool.query(
          `UPDATE item_values
           SET value = $1
           WHERE item_id = $2 AND month = $3`,
          [val.value, itemId, val.month]
        );
      }

      // Opcional: actualizar también state si viene
      if (typeof state === 'boolean') {
        await pool.query(
          `UPDATE items SET state = $1 WHERE id = $2`,
          [state, itemId]
        );
      }

      return res.json({ message: 'Valores actualizados correctamente' });

    } else if (item.reviewer_id === userId) {
      // Reviewer: solo puede cambiar state
      if (typeof state !== 'boolean' || values) {
        return res.status(403).json({ error: 'Reviewer solo puede modificar el estado' });
      }

      await pool.query(
        `UPDATE items SET state = $1 WHERE id = $2`,
        [state, itemId]
      );

      return res.json({ message: 'Estado actualizado correctamente' });

    } else {
      return res.status(403).json({ error: 'No autorizado para modificar este ítem' });
    }

  } catch (err) {
    console.error('Error updating item values:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
