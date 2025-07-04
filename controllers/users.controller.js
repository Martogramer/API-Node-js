import { pool } from "../config/db.js";
/* get all users */
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, created_at, role_id
       FROM users`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error interno al obtener usuarios" });
  }
};
export const getAllRoles = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name FROM roles");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener roles:", error);
    res.status(500).json({ error: "Error interno" });
  }
};
/* asign roles */
export const assignRoleToUser = async (req, res) => {
  const { userId, roleName } = req.body;

  if (!userId || !roleName) {
    return res.status(400).json({ error: "userId and roleName are required" });
  }

  try {
    const requesterId = req.user.userId;

    // Obtener el rol del usuario que hace la solicitud
    const requesterRoleResult = await pool.query(
      `
  SELECT r.name FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE u.id = $1
`,
      [requesterId]
    );

    console.log("Requester role query result:", requesterRoleResult.rows);

    if (requesterRoleResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Unauthorized: invalid requester role" });
    }

    const requesterRole = requesterRoleResult.rows[0].name;

    // Verificar si tiene permiso
    if (requesterRole !== "manager") {
      return res
        .status(403)
        .json({ error: 'Only users with role manager can assign roles' });
    }

    // Verificar que el rol a asignar exista
    const roleResult = await pool.query(
      `SELECT id FROM roles WHERE name = $1`,
      [roleName]
    );
    if (roleResult.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }
    const roleId = roleResult.rows[0].id;

    // Verificar que el usuario a modificar exista
    const userResult = await pool.query(`SELECT id FROM users WHERE id = $1`, [
      userId,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Insertar en tabla intermedia si no existe
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );

    // Actualizar rol principal del usuario
    await pool.query(`UPDATE users SET role_id = $1 WHERE id = $2`, [
      roleId,
      userId,
    ]);

    res.status(200).json({ message: "Role assigned successfully by manager" });
  } catch (error) {
    console.error("Error assigning role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
