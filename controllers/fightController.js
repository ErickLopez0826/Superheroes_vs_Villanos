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
 *     summary: Simular una pelea entre equipos de 3 superhéroes vs 3 villanos usando nombres de equipo
 *     tags: [Peleas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               equipoHeroes:
 *                 type: string
 *                 description: Nombre del equipo de superhéroes (debe tener 3 miembros)
 *                 example: Avengers
 *               equipoVillanos:
 *                 type: string
 *                 description: Nombre del equipo de villanos (debe tener 3 miembros)
 *                 example: LegionDelMal
 *             required:
 *               - equipoHeroes
 *               - equipoVillanos
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
 *                     properties:
 *                       ronda:
 *                         type: integer
 *                       heroe:
 *                         type: string
 *                       villano:
 *                         type: string
 *                       historia:
 *                         type: array
 *                         items:
 *                           type: string
 *                       resultado:
 *                         type: string
 *       400:
 *         description: Datos inválidos o enfrentamiento no permitido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/fights/teams',
  [
    body('equipoHeroes').isString().notEmpty().withMessage('equipoHeroes es obligatorio'),
    body('equipoVillanos').isString().notEmpty().withMessage('equipoVillanos es obligatorio')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { equipoHeroes, equipoVillanos } = req.body;
    const personajes = await personajeService.getAllPersonajes();
    // Buscar los 3 héroes y 3 villanos por nombre de equipo
    const heroes = personajes.filter(p => p.equipo === equipoHeroes && p.tipo === 'superheroe').slice(0, 3);
    const villanos = personajes.filter(p => p.equipo === equipoVillanos && p.tipo === 'villano').slice(0, 3);
    if (heroes.length !== 3 || villanos.length !== 3) {
      return res.status(400).json({ error: 'Ambos equipos deben tener exactamente 3 miembros del tipo correcto' });
    }
    // Inicializar vida
    let vivosHeroes = heroes.map(p => ({ ...p, vida: 100 }));
    let vivosVillanos = villanos.map(p => ({ ...p, vida: 100 }));
    let rondas = [];
    for (let i = 0; i < 3; i++) {
      if (vivosHeroes.length === 0 || vivosVillanos.length === 0) break;
      let heroe = vivosHeroes[0];
      let villano = vivosVillanos[0];
      let ronda = { ronda: i+1, heroe: heroe.nombre, villano: villano.nombre, historia: [] };
      let turno = 0;
      while (heroe.vida > 0 && villano.vida > 0) {
        // Turno del héroe
        if (turno % 2 === 0) {
          const ataque = calcularAtaque();
          villano.vida += ataque; // ataque es negativo
          ronda.historia.push(`${heroe.nombre} ataca a ${villano.nombre} (${descripcionAtaque(ataque)})`);
        } else {
          const ataque = calcularAtaque();
          heroe.vida += ataque;
          ronda.historia.push(`${villano.nombre} ataca a ${heroe.nombre} (${descripcionAtaque(ataque)})`);
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

// Función para calcular el tipo de ataque
function calcularAtaque() {
  const prob = Math.random();
  if (prob < 0.15) return -45; // 15% crítico
  if (prob < 0.5) return -30; // 35% especial
  return -5; // 50% normal
}

function descripcionAtaque(valor) {
  if (valor === -45) return 'ataque crítico (-45 vida)';
  if (valor === -30) return 'ataque especial (-30 vida)';
  return 'ataque normal (-5 vida)';
}

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