import express from "express";
import { check, validationResult, query } from 'express-validator';
import heroService from "../services/heroService.js";
import Hero from "../models/heroModel.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Héroes
 *     description: Endpoints para gestión de superhéroes (requiere JWT)
 */

/**
 * @swagger
 * /api/heroes:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Obtener todos los superhéroes (paginado)
 *     description: Retorna una lista paginada de superhéroes disponibles
 *     tags: [Héroes]
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
 *         description: Cantidad máxima de héroes por página (máximo 50, mismas restricciones que page)
 *     responses:
 *       200:
 *         description: Lista de superhéroes obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Hero'
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
  "/heroes",
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
      const heroes = await heroService.getAllHeroes();
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = heroes.slice(start, end);
      res.json({
        total: heroes.length,
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
 * /api/heroes/city/{city}:
 *   get:
 *     summary: Obtener héroes por ciudad
 *     description: Retorna todos los superhéroes que pertenecen a una ciudad específica
 *     tags: [Héroes]
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la ciudad
 *     responses:
 *       200:
 *         description: Lista de héroes de la ciudad
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hero'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/heroes/city/:city', async (req, res) => {
    try {
        const heroes = await heroService.findHeroesByCity(req.params.city);
        res.json(heroes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/heroes:
 *   post:
 *     summary: Crear un nuevo superhéroe
 *     description: Crea un nuevo superhéroe con la información proporcionada
 *     tags: [Héroes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre real del héroe
 *               alias:
 *                 type: string
 *                 description: Alias o nombre de superhéroe
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
 *         description: Héroe creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hero'
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
router.post("/heroes",
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
            const newHero = new Hero(null, name, alias, city, team);
            const addedHero = await heroService.addHero(newHero);

            res.status(201).json(addedHero);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
});

/**
 * @swagger
 * /api/heroes/{id}:
 *   put:
 *     summary: Actualizar un superhéroe
 *     description: Actualiza la información de un superhéroe existente
 *     tags: [Héroes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del héroe a actualizar
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
 *         description: Héroe actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hero'
 *       404:
 *         description: Héroe no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/heroes/:id", async (req, res) => {
    try {
        const updatedHero = await heroService.updateHero(req.params.id, req.body);
        res.json(updatedHero);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/heroes/{id}:
 *   delete:
 *     summary: Eliminar un superhéroe
 *     description: Elimina un superhéroe de la base de datos
 *     tags: [Héroes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del héroe a eliminar
 *     responses:
 *       200:
 *         description: Héroe eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Héroe no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/heroes/:id', async (req, res) => {
    try {
        const result = await heroService.deleteHero(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

export default router;