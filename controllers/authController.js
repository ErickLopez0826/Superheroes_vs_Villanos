import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import userRepository from '../repositories/userRepository.js';

const router = express.Router();
const JWT_SECRET = 'supersecretkey123';

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Iniciar sesión y obtener un token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: 1234
 *     responses:
 *       200:
 *         description: Token JWT generado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/login
router.post('/login', async (req, res) => {
  const { name, password } = req.body;
  if (name === 'admin' && password === '1234') {
    const token = jwt.sign({ name }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }
  // Buscar usuario en MongoDB
  const users = await userRepository.getUsers();
  const user = users.find(u => u.name === name);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ name }, JWT_SECRET, { expiresIn: '2h' });
  return res.json({ token });
});

export default router; 