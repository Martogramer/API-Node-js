import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const register = async (req, res) => {
  try {
    const { name, email, password, role, specialty } = req.body

    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email ya registrado' })

    const hash = await bcrypt.hash(password, 10)
    const user = new User({ name, email, password: hash, role, specialty })
    await user.save()

    res.status(201).json({ message: 'Usuario registrado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Credenciales inválidas' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ message: 'Credenciales inválidas' })

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    })

    res.json({ token, user: { id: user._id, name: user.name, role: user.role } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const logout = async (req, res) => {
  try {
    // El cliente debería borrar el token del lado del frontend
    res.json({ message: "Sesión cerrada exitosamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
