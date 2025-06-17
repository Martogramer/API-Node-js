import { pool } from '../config/db.js';
/* get all users */
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, created_at
       FROM users`
      );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno al obtener usuarios' });
  }
};
/* asign roles */
export const assignRoleToUser = async (req, res) => {
  const { userId, roleName } = req.body;

  if (!userId || !roleName) {
    return res.status(400).json({ error: 'userId and roleName are required' });
  }

  try {
    // Verificar que el rol exista
    const roleResult = await pool.query(`SELECT id FROM roles WHERE name = $1`, [roleName]);
    if (roleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    const roleId = roleResult.rows[0].id;

    // Verificar que el usuario exista
    const userResult = await pool.query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Insertar en user_roles si no existe
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );

    // Actualizar role_id en users (rol principal)
    await pool.query(
      `UPDATE users SET role_id = $1 WHERE id = $2`,
      [roleId, userId]
    );

    res.status(200).json({ message: 'Role assigned and user updated successfully' });

  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
