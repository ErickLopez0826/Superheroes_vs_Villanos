import express from "express";
import { check, validationResult, body } from 'express-validator';
import personajeService from '../services/heroService.js';
import fightRepository from '../repositories/fightRepository.js';

const router = express.Router();

/**
 * @swagger
 * /api/fights:
 *   get:
 *     summary: Obtener todas las peleas
 *     tags: [Peleas]
 *     responses:
 *       200:
 *         description: Lista de peleas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/fights', async (req, res) => {
    const fights = await fightRepository.getFights();
    res.json(fights);
});

/**
 * @swagger
 * /api/fights:
 *   post:
 *     summary: Simular una pelea entre un superhéroe y un villano
 *     tags: [Peleas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id1:
 *                 type: integer
 *                 example: 1
 *               id2:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Resultado de la pelea
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 personaje1:
 *                   $ref: '#/components/schemas/Personaje'
 *                 personaje2:
 *                   $ref: '#/components/schemas/Personaje'
 *                 winner:
 *                   type: string
 *                 fightId:
 *                   type: integer
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Datos inválidos o enfrentamiento no permitido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/fights',
  [
    body('id1').isInt({ min: 1 }).withMessage('id1 debe ser un entero positivo mayor a 0, sin decimales'),
    body('id2').isInt({ min: 1 }).withMessage('id2 debe ser un entero positivo mayor a 0, sin decimales'),
    body('id1').not().isEmpty().withMessage('id1 es obligatorio'),
    body('id2').not().isEmpty().withMessage('id2 es obligatorio')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { id1, id2 } = req.body;
    // Buscar personajes
    const personajes = await personajeService.getAllPersonajes();
    const personaje1 = personajes.find(p => p.id === parseInt(id1));
    const personaje2 = personajes.find(p => p.id === parseInt(id2));
    if (!personaje1 || !personaje2) {
      return res.status(400).json({ error: 'Ambos personajes deben existir' });
    }
    // Validar que uno sea superheroe y otro villano
    if (personaje1.tipo === personaje2.tipo) {
      return res.status(400).json({ error: 'Solo se permiten peleas entre un superhéroe y un villano' });
    }
    // Simular pelea (aleatorio)
    const winner = Math.random() < 0.5 ? personaje1.nombre : personaje2.nombre;
    // Guardar pelea
    const fights = await fightRepository.getFights();
    const fightId = fights.length > 0 ? Math.max(...fights.map(f => f.fightId)) + 1 : 1;
    const fight = {
      fightId,
      personaje1: { id: personaje1.id, nombre: personaje1.nombre, tipo: personaje1.tipo },
      personaje2: { id: personaje2.id, nombre: personaje2.nombre, tipo: personaje2.tipo },
      winner
    };
    fights.push(fight);
    await fightRepository.saveFights(fights);
    res.json({ personaje1, personaje2, winner, fightId, history: fights });
  }
);

/**
 * @swagger
 * /api/fights/teams:
 *   post:
 *     summary: Simular una pelea entre equipos de 3 superhéroes vs 3 villanos
 *     tags: [Peleas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               heroes:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 3
 *                 maxItems: 3
 *                 description: IDs de los superhéroes
 *               villanos:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 3
 *                 maxItems: 3
 *                 description: IDs de los villanos
 *             required:
 *               - heroes
 *               - villanos
 *     responses:
 *       200:
 *         description: Resultado de la pelea por equipos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultado:
 *                   type: string
 *                 rondas:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Datos inválidos o enfrentamiento no permitido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/fights/teams',
  [
    body('heroes').isArray({ min: 3, max: 3 }).withMessage('heroes debe ser un array de 3 IDs'),
    body('villanos').isArray({ min: 3, max: 3 }).withMessage('villanos debe ser un array de 3 IDs'),
    body('heroes.*').isInt({ min: 1 }).withMessage('Todos los IDs de héroes deben ser enteros positivos mayores a 0'),
    body('villanos.*').isInt({ min: 1 }).withMessage('Todos los IDs de villanos deben ser enteros positivos mayores a 0')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { heroes, villanos } = req.body;
    const personajes = await personajeService.getAllPersonajes();
    const equipoHeroes = heroes.map(id => personajes.find(p => p.id === id && p.tipo === 'superheroe'));
    const equipoVillanos = villanos.map(id => personajes.find(p => p.id === id && p.tipo === 'villano'));
    if (equipoHeroes.includes(undefined) || equipoVillanos.includes(undefined)) {
      return res.status(400).json({ error: 'Todos los IDs deben ser válidos y corresponder a su tipo'});
    }
    // Simulación de pelea por rondas
    let rondas = [];
    let vivosHeroes = equipoHeroes.map(p => ({ ...p }));
    let vivosVillanos = equipoVillanos.map(p => ({ ...p }));
    for (let i = 0; i < 3; i++) {
      if (vivosHeroes.length === 0 || vivosVillanos.length === 0) break;
      let heroe = vivosHeroes[0];
      let villano = vivosVillanos[0];
      // Pelea entre el primer héroe y el primer villano
      let ronda = { ronda: i+1, heroe: heroe.nombre, villano: villano.nombre, historia: [] };
      let turno = 0;
      while (heroe.vida > 0 && villano.vida > 0) {
        if (turno % 2 === 0) {
          villano.vida -= 30; // golpe especial
          ronda.historia.push(`${heroe.nombre} golpea a ${villano.nombre} (-30 vida)`);
        } else {
          heroe.vida -= 30;
          ronda.historia.push(`${villano.nombre} golpea a ${heroe.nombre} (-30 vida)`);
        }
        turno++;
      }
      if (heroe.vida <= 0) {
        ronda.resultado = `${villano.nombre} gana la ronda`;
        vivosHeroes.shift();
      } else {
        ronda.resultado = `${heroe.nombre} gana la ronda`;
        vivosVillanos.shift();
      }
      rondas.push(ronda);
    }
    let resultado = vivosHeroes.length > 0 ? '¡Ganan los superhéroes!' : '¡Ganan los villanos!';
    res.json({ resultado, rondas });
  }
);

/**
 * @swagger
 * /api/equipos:
 *   post:
 *     summary: Crear un equipo de 3 personajes del mismo tipo
 *     tags: [Peleas]
 *     parameters:
 *       - in: query
 *         name: nombreEquipo
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del equipo
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: IDs de los personajes separados por coma (ejemplo: 1,2,3)
 *     responses:
 *       200:
 *         description: Equipo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 equipo:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Personaje'
 *       400:
 *         description: Datos inválidos o personajes de distinto tipo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/equipos', async (req, res) => {
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
  // Asignar nombre de equipo
  const actualizados = personajes.map(p => {
    if (ids.includes(p.id)) {
      return { ...p, equipo: nombreEquipo };
    }
    return p;
  });
  await personajeService.updateAllPersonajes(actualizados);
  res.json({ equipo: actualizados.filter(p => ids.includes(p.id)) });
});

/**
 * @swagger
 * /api/equipos/superheroes:
 *   post:
 *     summary: Crear un equipo de 3 superhéroes
 *     tags: [Peleas]
 *     parameters:
 *       - in: query
 *         name: nombreEquipo
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del equipo
 *       - in: query
 *         name: id1
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del primer superhéroe
 *       - in: query
 *         name: id2
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del segundo superhéroe
 *       - in: query
 *         name: id3
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tercer superhéroe
 *     responses:
 *       200:
 *         description: Equipo de superhéroes creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 equipo:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Personaje'
 *       400:
 *         description: Datos inválidos o personajes no son superhéroes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/equipos/superheroes', async (req, res) => {
  const nombreEquipo = req.query.nombreEquipo;
  const ids = [req.query.id1, req.query.id2, req.query.id3].map(id => parseInt(id, 10));
  if (!nombreEquipo || ids.some(id => isNaN(id) || id <= 0)) {
    return res.status(400).json({ error: 'nombreEquipo e ids válidos son obligatorios' });
  }
  const personajes = await personajeService.getAllPersonajes();
  const seleccionados = ids.map(id => personajes.find(p => p.id === id && p.tipo === 'superheroe'));
  if (seleccionados.includes(undefined)) {
    return res.status(400).json({ error: 'Todos los IDs deben existir y ser superhéroes' });
  }
  // Asignar nombre de equipo
  const actualizados = personajes.map(p => {
    if (ids.includes(p.id)) {
      return { ...p, equipo: nombreEquipo };
    }
    return p;
  });
  await personajeService.updateAllPersonajes(actualizados);
  res.json({ equipo: actualizados.filter(p => ids.includes(p.id)) });
});

/**
 * @swagger
 * /api/equipos/villanos:
 *   post:
 *     summary: Crear un equipo de 3 villanos
 *     tags: [Peleas]
 *     parameters:
 *       - in: query
 *         name: nombreEquipo
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del equipo
 *       - in: query
 *         name: id1
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del primer villano
 *       - in: query
 *         name: id2
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del segundo villano
 *       - in: query
 *         name: id3
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tercer villano
 *     responses:
 *       200:
 *         description: Equipo de villanos creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 equipo:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Personaje'
 *       400:
 *         description: Datos inválidos o personajes no son villanos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/equipos/villanos', async (req, res) => {
  const nombreEquipo = req.query.nombreEquipo;
  const ids = [req.query.id1, req.query.id2, req.query.id3].map(id => parseInt(id, 10));
  if (!nombreEquipo || ids.some(id => isNaN(id) || id <= 0)) {
    return res.status(400).json({ error: 'nombreEquipo e ids válidos son obligatorios' });
  }
  const personajes = await personajeService.getAllPersonajes();
  const seleccionados = ids.map(id => personajes.find(p => p.id === id && p.tipo === 'villano'));
  if (seleccionados.includes(undefined)) {
    return res.status(400).json({ error: 'Todos los IDs deben existir y ser villanos' });
  }
  // Asignar nombre de equipo
  const actualizados = personajes.map(p => {
    if (ids.includes(p.id)) {
      return { ...p, equipo: nombreEquipo };
    }
    return p;
  });
  await personajeService.updateAllPersonajes(actualizados);
  res.json({ equipo: actualizados.filter(p => ids.includes(p.id)) });
});

/**
 * @swagger
 * /api/fights/{fightId}:
 *   put:
 *     summary: Actualizar el ganador de una pelea
 *     tags: [Peleas]
 *     parameters:
 *       - in: path
 *         name: fightId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la pelea a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               winner:
 *                 type: string
 *                 description: Nombre del nuevo ganador
 *     responses:
 *       200:
 *         description: Pelea actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fight:
 *                   type: object
 *       404:
 *         description: Pelea no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/fights/:fightId', async (req, res) => {
  const fightId = parseInt(req.params.fightId, 10);
  const { winner } = req.body;
  if (!winner) {
    return res.status(400).json({ error: 'El nombre del ganador es obligatorio' });
  }
  const fights = await fightRepository.getFights();
  const index = fights.findIndex(f => f.fightId === fightId);
  if (index === -1) {
    return res.status(404).json({ error: 'Pelea no encontrada' });
  }
  fights[index].winner = winner;
  await fightRepository.saveFights(fights);
  res.json({ fight: fights[index] });
});

/**
 * @swagger
 * /api/fights/{fightId}:
 *   delete:
 *     summary: Eliminar una pelea
 *     tags: [Peleas]
 *     parameters:
 *       - in: path
 *         name: fightId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la pelea a eliminar
 *     responses:
 *       200:
 *         description: Pelea eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Pelea no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/fights/:fightId', async (req, res) => {
  const fightId = parseInt(req.params.fightId, 10);
  const fights = await fightRepository.getFights();
  const index = fights.findIndex(f => f.fightId === fightId);
  if (index === -1) {
    return res.status(404).json({ error: 'Pelea no encontrada' });
  }
  fights.splice(index, 1);
  await fightRepository.saveFights(fights);
  res.json({ message: 'Pelea eliminada exitosamente' });
});

export default router; 