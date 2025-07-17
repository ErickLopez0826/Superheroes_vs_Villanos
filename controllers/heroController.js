import express from "express";
import { check, validationResult, query } from 'express-validator';
import personajeService from "../services/heroService.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Personajes
 *     description: Endpoints para gestión de personajes (superhéroes y villanos)
 */

/**
 * @swagger
 * /api/personajes:
 *   get:
 *     summary: Obtener todos los personajes (paginado)
 *     description: Retorna una lista paginada de personajes disponibles
 *     tags: [Personajes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 50
 *         description: Cantidad máxima de personajes por página
 *     responses:
 *       200:
 *         description: Lista de personajes obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Personaje'
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
  "/personajes",
  [
    query('page').isInt({ min: 1 }).withMessage('El parámetro page es obligatorio y debe ser entero positivo'),
    query('limit').isInt({ min: 1, max: 50 }).withMessage('El parámetro limit es obligatorio y debe ser entre 1 y 50')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    try {
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);
      const personajes = await personajeService.getAllPersonajes();
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = personajes.slice(start, end);
      res.json({
        total: personajes.length,
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
 * /api/personajes:
 *   post:
 *     summary: Crear un nuevo personaje
 *     description: Crea un nuevo personaje (superhéroe o villano)
 *     tags: [Personajes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del personaje
 *               ciudad:
 *                 type: string
 *                 description: Ciudad de origen
 *               tipo:
 *                 type: string
 *                 enum: [superheroe, villano]
 *                 description: Tipo de personaje
 *             required:
 *               - nombre
 *               - tipo
 *     responses:
 *       201:
 *         description: Personaje creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Personaje'
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
router.post("/personajes",
    [
        check('nombre').not().isEmpty().withMessage('El nombre es requerido'),
        check('tipo').isIn(['superheroe', 'villano']).withMessage('El tipo debe ser superheroe o villano')
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { nombre, ciudad, tipo } = req.body;
            const nuevo = { nombre, ciudad, tipo };
            const agregado = await personajeService.addPersonaje(nuevo);
            res.status(201).json(agregado);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
});

/**
 * @swagger
 * /api/personajes/{id}:
 *   put:
 *     summary: Actualizar un personaje
 *     description: Actualiza la información de un personaje existente
 *     tags: [Personajes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del personaje a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               ciudad:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [superheroe, villano]
 *     responses:
 *       200:
 *         description: Personaje actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Personaje'
 *       404:
 *         description: Personaje no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/personajes/:id',
    [
        check('nombre').optional().not().isEmpty().withMessage('El nombre no puede estar vacío'),
        check('tipo').optional().isIn(['superheroe', 'villano']).withMessage('El tipo debe ser superheroe o villano')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const actualizado = await personajeService.updatePersonaje(req.params.id, req.body);
            res.json(actualizado);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
});

/**
 * @swagger
 * /api/personajes/{id}:
 *   delete:
 *     summary: Eliminar un personaje
 *     description: Elimina un personaje de la base de datos
 *     tags: [Personajes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del personaje a eliminar
 *     responses:
 *       200:
 *         description: Personaje eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Personaje no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/personajes/:id', async (req, res) => {
    try {
        const eliminado = await personajeService.deletePersonaje(req.params.id);
        res.json(eliminado);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;