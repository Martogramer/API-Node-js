// routes/auth.js
import express from 'express';
import { registerUser, login } from '../controllers/auth.controller.js';

const router = express.Router();

// Login endpoint
router.post('/login', login);
router.post('/register', registerUser);



export default router;

