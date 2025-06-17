// controllers/budgetController.js
import { pool } from "../config/db.js";

export const createBudget = async (req, res) => {
  const { name, created_by, period_start, period_end } = req.body;

  if (!name || !created_by || !period_start || !period_end) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO budgets (name, created_by, period_start, period_end, status, created_at)
       VALUES ($1, $2, $3, $4, false, NOW())
       RETURNING *`,
      [name, created_by, period_start, period_end]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating budget:", err);
    res.status(500).json({ error: "Error creating budget" });
  }
};

export const createBudgetVersion = async (req, res) => {
  const { budget_id, created_by, version_number } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO versions (budget_id, created_by, version_number, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [budget_id, created_by, version_number]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating version:", err);
    res.status(500).json({ error: "Error creating version" });
  }
};

export const getBudgetsHierarchy = async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT
    b.id AS budget_id,
    b.period_start,
    b.period_end,
    b.status,
    b.created_at AS budget_created_at,
    ub.id AS analyst_id,
    ub.username AS analyst_name,

    v.id AS version_id,
    v.version_number,
    v.created_at AS version_created_at,
    uv.id AS version_user_id,
    uv.username AS version_user_name,

    i.id AS item_id,
    i.name AS item_name,
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
  FROM budgets b
  JOIN users ub ON b.created_by = ub.id

  LEFT JOIN versions v ON v.budget_id = b.id
  LEFT JOIN users uv ON v.created_by = uv.id

  LEFT JOIN items i ON i.budget_version_id = v.id
  LEFT JOIN users ue ON i.editor_id = ue.id
  LEFT JOIN users ur ON i.reviewer_id = ur.id

  LEFT JOIN item_values iv ON iv.item_id = i.id

  ORDER BY b.id, v.id, i.id, iv.month
`);

    // Organizar datos en jerarquía JS
    const budgetsMap = new Map();

    for (const row of result.rows) {
      const bId = row.budget_id;
      const vId = row.version_id;
      const iId = row.item_id;

      if (!budgetsMap.has(bId)) {
        budgetsMap.set(bId, {
          id: bId,
          period_start: row.period_start,
          period_end: row.period_end,
          status: row.status,
          created_at: row.budget_created_at,
          created_by: { id: row.analyst_id, name: row.analyst_name },
          versions: [],
        });
      }

      const budget = budgetsMap.get(bId);

      let version = budget.versions.find((v) => v.id === vId);
      if (!version && vId) {
        version = {
          id: vId,
          version_number: row.version_number,
          created_at: row.version_created_at,
          created_by: { id: row.version_user_id, name: row.version_user_name },
          items: [],
        };
        budget.versions.push(version);
      }

      let item = version?.items.find((i) => i.id === iId);
      if (!item && iId) {
        item = {
          id: iId,
          name: row.item_name,
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

    res.json(Array.from(budgetsMap.values()));
  } catch (err) {
    console.error("Error fetching budgets hierarchy:", err);
    res.status(500).json({ error: "Error fetching budgets" });
  }
};
