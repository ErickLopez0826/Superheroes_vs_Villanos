import express from "express";
import { check, validationResult, query } from 'express-validator';
import villainService from "../services/villainService.js";
import Villain from "../models/villainModel.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Villanos
 *     description: Endpoints para gestión de villanos (requiere JWT)
 */

/**
 * @swagger
 * /api/villains:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Obtener todos los villanos (paginado)
 *     description: Retorna una lista paginada de villanos disponibles
 *     tags: [Villanos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página (debe ser entero positivo, sin decimales, no nulo, no 0, no negativo, sin caracteres especiales)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 50
 *         description: Cantidad máxima de villanos por página (máximo 50, mismas restricciones que page)
 *     responses:
 *       200:
 *         description: Lista de villanos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Villain'
 *       400:
 *         description: Parámetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/villains",
  [
    query('page')
      .exists().withMessage('El parámetro page es obligatorio')
      .notEmpty().withMessage('El parámetro page no puede estar vacío')
      .isInt({ min: 1, max: 999999 })
      .withMessage('El parámetro page debe ser un entero positivo mayor a 0, sin decimales, no nulo, no negativo, sin caracteres especiales.'),
    query('limit')
      .exists().withMessage('El parámetro limit es obligatorio')
      .notEmpty().withMessage('El parámetro limit no puede estar vacío')
      .isInt({ min: 1, max: 50 })
      .withMessage('El parámetro limit debe ser un entero positivo entre 1 y 50, sin decimales, no nulo, no negativo, sin caracteres especiales.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    try {
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);
      const villains = await villainService.getAllVillains();
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = villains.slice(start, end);
      res.json({
        total: villains.length,
        page,
        limit,
        data: paginated
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/villains/city/{city}:
 *   get:
 *     summary: Obtener villanos por ciudad
 *     description: Retorna todos los villanos que pertenecen a una ciudad específica
 *     tags: [Villanos]
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la ciudad
 *     responses:
 *       200:
 *         description: Lista de villanos de la ciudad
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Villain'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/villains/city/:city', async (req, res) => {
    try {
        const villains = await villainService.findVillainsByCity(req.params.city);
        res.json(villains);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/villains:
 *   post:
 *     summary: Crear un nuevo villano
 *     description: Crea un nuevo villano con la información proporcionada
 *     tags: [Villanos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre real del villano
 *               alias:
 *                 type: string
 *                 description: Alias o nombre de villano
 *               city:
 *                 type: string
 *                 description: Ciudad de origen
 *               team:
 *                 type: string
 *                 description: Equipo al que pertenece
 *             required:
 *               - name
 *               - alias
 *     responses:
 *       201:
 *         description: Villano creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Villain'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/villains",
    [
        check('name').not().isEmpty().withMessage('El nombre es requerido'),
        check('alias').not().isEmpty().withMessage('El alias es requerido')
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { name, alias, city, team } = req.body;
            const newVillain = new Villain(null, name, alias, city, team);
            const addedVillain = await villainService.addVillain(newVillain);

            res.status(201).json(addedVillain);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
});

/**
 * @swagger
 * /api/villains/{id}:
 *   put:
 *     summary: Actualizar un villano
 *     description: Actualiza la información de un villano existente
 *     tags: [Villanos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del villano a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               alias:
 *                 type: string
 *               city:
 *                 type: string
 *               team:
 *                 type: string
 *     responses:
 *       200:
 *         description: Villano actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Villain'
 *       404:
 *         description: Villano no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/villains/:id", async (req, res) => {
    try {
        const updatedVillain = await villainService.updateVillain(req.params.id, req.body);
        res.json(updatedVillain);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/villains/{id}:
 *   delete:
 *     summary: Eliminar un villano
 *     description: Elimina un villano de la base de datos
 *     tags: [Villanos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del villano a eliminar
 *     responses:
 *       200:
 *         description: Villano eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Villano no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/villains/:id', async (req, res) => {
    try {
        const result = await villainService.deleteVillain(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

export default router; 