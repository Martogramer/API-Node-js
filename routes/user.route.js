import express from "express";
import { createUser, assignRole, getUserWithRoles } from "../models/users.model.js";
import bcrypt from "bcrypt";
import { assignRoleToUser, getAllRoles } from "../controllers/users.controller.js";
import { getAllUsers } from '../controllers/users.controller.js';
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/all',  getAllUsers);
router.get('/roles',  getAllRoles);
router.post('/assign-role', authenticateToken, assignRoleToUser);
router.post("/register", async (req, res) => {
  try {
    const { email, password, roleId } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(email, passwordHash);
    if (roleId) await assignRole(user.id, roleId);
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const { email } = req.query;
    const user = await getUserWithRoles(email);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "User fetch failed" });
  }
});

export default router;
