import express from "express";
import { check, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';

const router = express.Router();
const JWT_SECRET = 'supersecretkey123';

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Registrar un nuevo usuario y obtener un token JWT
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: usuario1
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Usuario registrado y token JWT generado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Datos inválidos o usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST registrar usuario
router.post(
  '/users',
  [
    check('name').not().isEmpty().withMessage('El nombre es requerido'),
    check('password').not().isEmpty().withMessage('La contraseña es requerida')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { name, password } = req.body;
    const users = await userRepository.getUsers();
    if (users.find(u => u.name === name)) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Asignar un id incremental
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
    const newUser = { id: newId, name, password: hashedPassword };
    await userRepository.addUser(newUser);
    const token = jwt.sign({ name }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  }
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// GET todos los usuarios
router.get('/users', async (req, res) => {
  const users = await userRepository.getUsers();
  res.json(users);
});

export default router; 