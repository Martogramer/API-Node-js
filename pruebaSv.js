// db.js
import pg from 'pg';
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/yourdb',
});

// middleware/authenticate.js
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Forbidden' });
  }
};

// middleware/isAdmin.js
//import { pool } from '../db.js';

export const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await pool.query(
      `SELECT r.name FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    const roles = result.rows.map(row => row.name);
    if (!roles.includes('admin')) {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// controllers/users.js
//import { pool } from '../db.js';

export const assignRoleToUser = async (req, res) => {
  const { userId, roleName } = req.body;

  try {
    const roleResult = await pool.query(`SELECT id FROM roles WHERE name = $1`, [roleName]);
    if (roleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const roleId = roleResult.rows[0].id;

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );

    res.status(200).json({ message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// routes/users.js
import express from 'express';
import { assignRoleToUser } from '../controllers/users.js';
import { authenticate } from '../middleware/authenticate.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

router.post('/assign-role', authenticate, isAdmin, assignRoleToUser);

export default router;

// seed.js
import { pool } from './db.js';
import bcrypt from 'bcryptjs';

const seed = async () => {
  try {
    await pool.query(`
      INSERT INTO roles (name) VALUES
        ('admin'),
        ('comercial'),
        ('analitico')
      ON CONFLICT (name) DO NOTHING;
    `);

    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const hash = await bcrypt.hash(adminPassword, 10);

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [adminEmail, hash]
    );

    const adminUserId = userResult.rows[0]?.id || (await pool.query(`SELECT id FROM users WHERE email = $1`, [adminEmail])).rows[0].id;

    const roleResult = await pool.query(`SELECT id FROM roles WHERE name = 'admin'`);
    const adminRoleId = roleResult.rows[0].id;

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [adminUserId, adminRoleId]
    );

    console.log('✅ Database seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seed();

// index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('User Roles API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
