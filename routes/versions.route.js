  import express from 'express';
import { pool } from '../config/db.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Crear nueva versión presupuestaria
router.post('/', authenticate, async (req, res) => {
  const { nombre } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO versions (nombre, estado, fecha_creacion, usuario_id)
       VALUES ($1, 'borrador', NOW(), $2)
       RETURNING *`,
      [nombre, req.user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear versión:', err);
    res.status(500).json({ error: 'Error al crear versión' });
  }
});

// Obtener versiones del usuario autenticado
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM versions WHERE usuario_id = $1 ORDER BY fecha_creacion DESC`,
      [req.user.userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener versiones:', err);
    res.status(500).json({ error: 'Error al obtener versiones' });
  }
});

export default router;