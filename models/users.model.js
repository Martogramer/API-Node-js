import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";

export const createUser = async ({ email, password }) => {
  const password_hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
    [email, password_hash]
  );
  return result.rows[0];
};

export const getUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

export const getUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, email, created_at FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

export const listUsers = async () => {
  const result = await pool.query(
    `SELECT id, email, created_at FROM users ORDER BY created_at DESC`
  );
  return result.rows;
};

export const updateUserEmail = async (id, newEmail) => {
  const result = await pool.query(
    `UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email`,
    [newEmail, id]
  );
  return result.rows[0];
};
export const getUserWithRoles = async (userId) => {
  const result = await pool.query(
    `
    SELECT u.id, u.email, u.created_at, 
           json_agg(r.name) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.id = $1
    GROUP BY u.id
  `,
    [userId]
  );

  return result.rows[0];
};
// Opcional: función para asignar roles, si quieres agregar aquí (o en otro modelo)
export const assignRole = async (userId, roleId) => {
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, roleId]
  );
};
