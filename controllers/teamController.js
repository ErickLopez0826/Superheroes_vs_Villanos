import express from "express";
import personajeService from '../services/heroService.js';
import { connectDB } from '../data/mongoClient.js';

const router = express.Router();

// Crear equipo genérico (POST /equipos)
router.post('/', async (req, res) => {
  const nombreEquipo = req.query.nombreEquipo;
  const idsParam = req.query.ids;
  if (!nombreEquipo || !idsParam) {
    return res.status(400).json({ error: 'nombreEquipo e ids son obligatorios' });
  }
  const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10));
  if (ids.length !== 3 || ids.some(id => isNaN(id) || id <= 0)) {
    return res.status(400).json({ error: 'Debes enviar exactamente 3 IDs válidos, enteros y positivos' });
  }
  const personajes = await personajeService.getAllPersonajes();
  const seleccionados = ids.map(id => personajes.find(p => p.id === id));
  if (seleccionados.includes(undefined)) {
    return res.status(400).json({ error: 'Todos los IDs deben existir' });
  }
  const tipoEquipo = seleccionados[0].tipo;
  if (!seleccionados.every(p => p.tipo === tipoEquipo)) {
    return res.status(400).json({ error: 'No se pueden mezclar villanos y superhéroes en el mismo equipo' });
  }
  // Asignar nombre de equipo en MongoDB
  const db = await connectDB();
  await db.collection('personajes').updateMany(
    { id: { $in: ids } },
    { $set: { equipo: nombreEquipo } }
  );
  // Remover el nombre de equipo de personajes que ya no estén en el equipo
  await db.collection('personajes').updateMany(
    { equipo: nombreEquipo, id: { $nin: ids } },
    { $unset: { equipo: "" } }
  );
  const equipo = await db.collection('personajes').find({ id: { $in: ids } }).toArray();
  res.json({ equipo });
});

/**
 * @swagger
 * /api/equipos/superheroes:
 *   post:
 *     summary: Crear un equipo de 3 superhéroes
 *     tags: [Equipos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombreEquipo:
 *                 type: string
 *                 example: LigaDeLaJusticia
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 3
 *                 maxItems: 3
 *                 example: [1,2,3]
 *             required:
 *               - nombreEquipo
 *               - ids
 *     responses:
 *       200:
 *         description: Equipo de superhéroes creado exitosamente
 *       400:
 *         description: Datos inválidos o personajes no son superhéroes
 */
// Crear equipo de superhéroes (POST /equipos/superheroes)
router.post('/superheroes', async (req, res) => {
  const { nombreEquipo, ids } = req.body;
  if (!nombreEquipo || !Array.isArray(ids) || ids.length !== 3) {
    return res.status(400).json({ error: 'nombreEquipo y 3 ids son obligatorios' });
  }
  const db = await connectDB();
  const personajes = await db.collection('personajes').find({ id: { $in: ids } }).toArray();
  if (personajes.length !== 3 || personajes.some(p => p.tipo !== 'superheroe')) {
    return res.status(400).json({ error: 'Todos los IDs deben existir y ser superhéroes' });
  }
  await db.collection('personajes').updateMany(
    { id: { $in: ids } },
    { $set: { equipo: nombreEquipo } }
  );
  await db.collection('personajes').updateMany(
    { equipo: nombreEquipo, id: { $nin: ids } },
    { $unset: { equipo: "" } }
  );
  const equipo = await db.collection('personajes').find({ id: { $in: ids } }).toArray();
  res.json({ equipo });
});

/**
 * @swagger
 * /api/equipos/villanos:
 *   post:
 *     summary: Crear un equipo de 3 villanos
 *     tags: [Equipos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombreEquipo:
 *                 type: string
 *                 example: LegionDelMal
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 3
 *                 maxItems: 3
 *                 example: [21,22,23]
 *             required:
 *               - nombreEquipo
 *               - ids
 *     responses:
 *       200:
 *         description: Equipo de villanos creado exitosamente
 *       400:
 *         description: Datos inválidos o personajes no son villanos
 */
// Crear equipo de villanos (POST /equipos/villanos)
router.post('/villanos', async (req, res) => {
  const { nombreEquipo, ids } = req.body;
  if (!nombreEquipo || !Array.isArray(ids) || ids.length !== 3) {
    return res.status(400).json({ error: 'nombreEquipo y 3 ids son obligatorios' });
  }
  const db = await connectDB();
  const personajes = await db.collection('personajes').find({ id: { $in: ids } }).toArray();
  if (personajes.length !== 3 || personajes.some(p => p.tipo !== 'villano')) {
    return res.status(400).json({ error: 'Todos los IDs deben existir y ser villanos' });
  }
  await db.collection('personajes').updateMany(
    { id: { $in: ids } },
    { $set: { equipo: nombreEquipo } }
  );
  await db.collection('personajes').updateMany(
    { equipo: nombreEquipo, id: { $nin: ids } },
    { $unset: { equipo: "" } }
  );
  const equipo = await db.collection('personajes').find({ id: { $in: ids } }).toArray();
  res.json({ equipo });
});

/**
 * @swagger
 * /api/equipos:
 *   put:
 *     summary: Modificar los integrantes de un equipo existente
 *     tags: [Equipos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombreEquipo:
 *                 type: string
 *                 example: LigaDeLaJusticia
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 3
 *                 maxItems: 3
 *                 example: [1,2,3]
 *             required:
 *               - nombreEquipo
 *               - ids
 *     responses:
 *       200:
 *         description: Equipo modificado exitosamente
 *       400:
 *         description: Datos inválidos o equipo no encontrado
 */
// Modificar equipo (PUT /equipos)
router.put('/', async (req, res) => {
  const { nombreEquipo, ids } = req.body;
  if (!nombreEquipo || !Array.isArray(ids) || ids.length !== 3) {
    return res.status(400).json({ error: 'nombreEquipo y 3 ids son obligatorios' });
  }
  const db = await connectDB();
  const integrantesActuales = await db.collection('personajes').find({ equipo: nombreEquipo }).toArray();
  if (integrantesActuales.length === 0) {
    return res.status(400).json({ error: 'El equipo no existe' });
  }
  const tipoEquipo = integrantesActuales[0].tipo;
  const seleccionados = await db.collection('personajes').find({ id: { $in: ids }, tipo: tipoEquipo }).toArray();
  if (seleccionados.length !== 3) {
    return res.status(400).json({ error: `Todos los IDs deben existir y ser del tipo ${tipoEquipo}` });
  }
  await db.collection('personajes').updateMany(
    { id: { $in: ids } },
    { $set: { equipo: nombreEquipo } }
  );
  await db.collection('personajes').updateMany(
    { equipo: nombreEquipo, id: { $nin: ids } },
    { $unset: { equipo: "" } }
  );
  const equipo = await db.collection('personajes').find({ id: { $in: ids } }).toArray();
  res.json({ equipo });
});

/**
 * @swagger
 * /api/equipos:
 *   delete:
 *     summary: Eliminar un equipo por nombre
 *     tags: [Equipos]
 *     parameters:
 *       - in: query
 *         name: nombreEquipo
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del equipo a eliminar
 *     responses:
 *       200:
 *         description: Equipo eliminado exitosamente
 *       400:
 *         description: Equipo no encontrado
 */
// Eliminar equipo (DELETE /equipos)
router.delete('/', async (req, res) => {
  const nombreEquipo = req.query.nombreEquipo;
  if (!nombreEquipo) {
    return res.status(400).json({ error: 'nombreEquipo es obligatorio' });
  }
  const db = await connectDB();
  const existe = await db.collection('personajes').countDocuments({ equipo: nombreEquipo });
  if (!existe) {
    return res.status(400).json({ error: 'El equipo no existe' });
  }
  await db.collection('personajes').updateMany(
    { equipo: nombreEquipo },
    { $unset: { equipo: "" } }
  );
  res.json({ message: 'Equipo eliminado exitosamente' });
});

/**
 * @swagger
 * /api/equipos:
 *   get:
 *     summary: Obtener todos los equipos con exactamente 3 integrantes (paginado)
 *     tags: [Equipos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de equipos por página
 *     responses:
 *       200:
 *         description: Lista paginada de equipos con sus integrantes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEquipos:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 equipos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nombre:
 *                         type: string
 *                       integrantes:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             nombre:
 *                               type: string
 *                             tipo:
 *                               type: string
 */
// Obtener todos los equipos y sus integrantes (GET /equipos) con paginación y restricción de 3 integrantes
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const db = await connectDB();
  const personajes = await db.collection('personajes').find({ equipo: { $exists: true, $ne: null } }).toArray();
  // Agrupar por nombre de equipo
  const equiposObj = {};
  personajes.forEach(p => {
    if (p.equipo) {
      if (!equiposObj[p.equipo]) equiposObj[p.equipo] = [];
      equiposObj[p.equipo].push({ id: p.id, nombre: p.nombre, tipo: p.tipo });
    }
  });
  // Solo equipos con exactamente 3 integrantes
  const equiposFiltrados = Object.entries(equiposObj)
    .filter(([_, integrantes]) => integrantes.length === 3)
    .map(([nombre, integrantes]) => ({ nombre, integrantes }));
  const totalEquipos = equiposFiltrados.length;
  const totalPages = Math.ceil(totalEquipos / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const equiposPagina = equiposFiltrados.slice(start, end);
  res.json({
    totalEquipos,
    totalPages,
    page,
    equipos: equiposPagina
  });
});

export default router; 