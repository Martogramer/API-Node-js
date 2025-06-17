import { pool } from './config/db.js';
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