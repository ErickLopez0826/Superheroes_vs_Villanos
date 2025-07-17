import express from "express";
import { check, validationResult, body } from 'express-validator';
import personajeService from '../services/heroService.js';
import fightRepository from '../repositories/fightRepository.js';

const router = express.Router();

/**
 * @swagger
 * /api/fights:
 *   get:
 *     summary: Obtener todas las peleas (1 vs 1 y equipos) paginadas
 *     tags: [Peleas]
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
 *         description: Cantidad de peleas por página
 *     responses:
 *       200:
 *         description: Lista paginada de todas las peleas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 fights:
 *                   type: array
 *                   items:
 *                     type: object
 */
// GET todas las peleas (paginado)
router.get('/fights', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const fights = await fightRepository.getFights();
  const total = fights.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const fightsPage = fights.slice(start, end);
  res.json({ total, totalPages, page, fights: fightsPage });
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
// POST pelea 1 vs 1
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
    let personajes = await personajeService.getAllPersonajes();
    let personaje1 = personajes.find(p => p.id === parseInt(id1));
    let personaje2 = personajes.find(p => p.id === parseInt(id2));
    if (!personaje1 || !personaje2) {
      return res.status(400).json({ error: 'Ambos personajes deben existir' });
    }
    if (personaje1.tipo === personaje2.tipo) {
      return res.status(400).json({ error: 'Solo se permiten peleas entre un superhéroe y un villano' });
    }
    // Clonar para simulación
    let sim1 = Object.assign(Object.create(Object.getPrototypeOf(personaje1)), personaje1);
    let sim2 = Object.assign(Object.create(Object.getPrototypeOf(personaje2)), personaje2);
    sim1.vida = 100 + (sim1.nivel - 1) * 5;
    sim2.vida = 100 + (sim2.nivel - 1) * 5;
    let historia = [];
    let turno = 0;
    let ganador = null;
    while (sim1.vida > 0 && sim2.vida > 0) {
      let atacante, defensor, desc, esUltimate = false, ataque;
      if (turno % 2 === 0) {
        atacante = sim1;
        defensor = sim2;
      } else {
        atacante = sim2;
        defensor = sim1;
      }
      if (atacante.ultimateDisponible) {
        ataque = atacante.usarUltimate();
        desc = `¡Ultimate! (${ataque} daño, ignora escudo)`;
        esUltimate = true;
      } else {
        const prob = Math.random();
        if (prob < 0.4) {
          let base = (Math.random() < 0.5) ? atacante.getAtaqueBasico() : atacante.getAtaqueEspecial();
          ataque = atacante.getAtaqueCritico(base);
          desc = `Ataque crítico (${ataque} daño)`;
        } else if (prob < 0.7) {
          ataque = atacante.getAtaqueEspecial();
          desc = `Ataque especial (${ataque} daño)`;
        } else {
          ataque = atacante.getAtaqueBasico();
          desc = `Ataque básico (${ataque} daño)`;
        }
      }
      let vidaAntes = defensor.vida;
      defensor.recibirDanio(ataque, esUltimate);
      atacante.cargarUltimate(ataque);
      historia.push(`${atacante.nombre} ataca a ${defensor.nombre}: ${desc} (vida: ${vidaAntes.toFixed(2)} → ${defensor.vida.toFixed(2)})`);
      turno++;
    }
    if (sim1.vida > 0) {
      ganador = sim1;
    } else {
      ganador = sim2;
    }
    // Otorgar experiencia y actualizar personajes originales
    for (let p of [personaje1, personaje2]) {
      let sim = (p.id === sim1.id) ? sim1 : sim2;
      if (ganador.id === p.id) {
        sim.ganarExperiencia(40);
      } else {
        sim.ganarExperiencia(25);
      }
      p.nivel = sim.nivel;
      p.experiencia = sim.experiencia;
      p.escudo = sim.escudo;
      p.vida = sim.vida;
      p.dañoUltimate = sim.dañoUltimate;
      p.umbralUltimate = sim.umbralUltimate;
      p.ultimateDisponible = sim.ultimateDisponible;
    }
    // Guardar pelea en MongoDB
    const fights = await fightRepository.getFights();
    const fightId = fights.length > 0 ? Math.max(...fights.map(f => f.fightId)) + 1 : 1;
    await fightRepository.addFight({
      fightId,
      personaje1: {
        id: sim1.id,
        nombre: sim1.nombre,
        tipo: sim1.tipo
      },
      personaje2: {
        id: sim2.id,
        nombre: sim2.nombre,
        tipo: sim2.tipo
      },
      ganador: ganador.nombre,
      historia
    });
    res.json({
      personaje1: {
        id: sim1.id,
        nombre: sim1.nombre,
        tipo: sim1.tipo,
        nivel: sim1.nivel,
        experiencia: sim1.experiencia,
        escudo: sim1.escudo,
        vida: sim1.vida,
        ultimateDisponible: sim1.ultimateDisponible
      },
      personaje2: {
        id: sim2.id,
        nombre: sim2.nombre,
        tipo: sim2.tipo,
        nivel: sim2.nivel,
        experiencia: sim2.experiencia,
        escudo: sim2.escudo,
        vida: sim2.vida,
        ultimateDisponible: sim2.ultimateDisponible
      },
      ganador: ganador.nombre,
      historia
    });
  }
);

/**
 * @swagger
 * /api/fights/teams:
 *   post:
 *     summary: Iniciar una nueva pelea entre equipos de 3 superhéroes vs 3 villanos
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
 *                 example: LIGADELJUSTICIA
 *               equipoVillanos:
 *                 type: string
 *                 description: Nombre del equipo de villanos (debe tener 3 miembros)
 *                 example: LEGIONDELMAL
 *             required:
 *               - equipoHeroes
 *               - equipoVillanos
 *     responses:
 *       200:
 *         description: Pelea iniciada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fightId:
 *                   type: integer
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
router.post('/fights/teams', async (req, res) => {
  const { equipoHeroes, equipoVillanos } = req.body;
  if (!equipoHeroes || !equipoVillanos) {
    return res.status(400).json({ error: 'equipoHeroes y equipoVillanos son obligatorios' });
  }
  const personajes = await personajeService.getAllPersonajes();
  const heroes = personajes.filter(p => p.equipo === equipoHeroes && p.tipo === 'superheroe').slice(0, 3);
  const villanos = personajes.filter(p => p.equipo === equipoVillanos && p.tipo === 'villano').slice(0, 3);
  if (heroes.length !== 3 || villanos.length !== 3) {
    return res.status(400).json({ error: 'Ambos equipos deben tener exactamente 3 miembros del tipo correcto' });
  }
  // Simulación de la primera ronda
  let simulados = {};
  for (let p of [...heroes, ...villanos]) {
    simulados[p.id] = Object.assign(Object.create(Object.getPrototypeOf(p)), p);
    simulados[p.id].vida = 100 + (simulados[p.id].nivel - 1) * 5;
  }
  let vivosHeroes = heroes.map(p => simulados[p.id]);
  let vivosVillanos = villanos.map(p => simulados[p.id]);
  let rondas = [];
  if (vivosHeroes.length > 0 && vivosVillanos.length > 0) {
    let heroe = vivosHeroes[0];
    let villano = vivosVillanos[0];
    let ronda = { ronda: 1, heroe: heroe.nombre, villano: villano.nombre, historia: [] };
    let turno = 0;
    while (heroe.vida > 0 && villano.vida > 0) {
      let atacante, defensor, desc, esUltimate = false, ataque;
      if (turno % 2 === 0) {
        atacante = heroe;
        defensor = villano;
      } else {
        atacante = villano;
        defensor = heroe;
      }
      if (atacante.ultimateDisponible) {
        ataque = atacante.usarUltimate();
        desc = `¡Ultimate! (${ataque} daño, ignora escudo)`;
        esUltimate = true;
      } else {
        const prob = Math.random();
        if (prob < 0.4) {
          let base = (Math.random() < 0.5) ? atacante.getAtaqueBasico() : atacante.getAtaqueEspecial();
          ataque = atacante.getAtaqueCritico(base);
          desc = `Ataque crítico (${ataque} daño)`;
        } else if (prob < 0.7) {
          ataque = atacante.getAtaqueEspecial();
          desc = `Ataque especial (${ataque} daño)`;
        } else {
          ataque = atacante.getAtaqueBasico();
          desc = `Ataque básico (${ataque} daño)`;
        }
      }
      let vidaAntes = defensor.vida;
      defensor.recibirDanio(ataque, esUltimate);
      atacante.cargarUltimate(ataque);
      ronda.historia.push(`${atacante.nombre} ataca a ${defensor.nombre}: ${desc} (vida: ${vidaAntes.toFixed(2)} → ${defensor.vida.toFixed(2)})`);
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
  let resultado;
  if (vivosHeroes.length > 0 && vivosVillanos.length === 0) resultado = '¡Ganan los superhéroes!';
  else if (vivosVillanos.length > 0 && vivosHeroes.length === 0) resultado = '¡Ganan los villanos!';
  else resultado = 'Pelea inconclusa';
  // Guardar pelea en MongoDB
  const fights = await fightRepository.getFights();
  const fightId = fights.length > 0 ? Math.max(...fights.map(f => f.fightId)) + 1 : 1;
  await fightRepository.addFight({
    fightId,
    equipoHeroes: heroes.map(h => h.nombre),
    equipoVillanos: villanos.map(v => v.nombre),
    resultado,
    rondas
  });
  res.json({ fightId, resultado, rondas });
});

/**
 * @swagger
 * /api/fights/teams/continue:
 *   post:
 *     summary: Continuar una pelea de equipos existente usando el fightId
 *     tags: [Peleas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fightId:
 *                 type: integer
 *                 description: ID de la pelea a continuar
 *               rondas:
 *                 type: array
 *                 description: Rondas adicionales a simular
 *                 items:
 *                   type: object
 *             required:
 *               - fightId
 *               - rondas
 *     responses:
 *       200:
 *         description: Resultado actualizado de la pelea por equipos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fightId:
 *                   type: integer
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
router.post('/fights/teams/continue', async (req, res) => {
  const { fightId, rondas } = req.body;
  if (!fightId || !Array.isArray(rondas) || rondas.length === 0) {
    return res.status(400).json({ error: 'fightId y rondas son obligatorios' });
  }
  const fight = await fightRepository.getFightById(fightId);
  if (!fight) {
    return res.status(400).json({ error: 'fightId no encontrado' });
  }
  // Recuperar los equipos y estado actual
  let equipoHeroes = fight.equipoHeroes;
  let equipoVillanos = fight.equipoVillanos;
  const personajes = await personajeService.getAllPersonajes();
  let heroes = personajes.filter(p => equipoHeroes.includes(p.nombre) && p.tipo === 'superheroe').slice(0, 3);
  let villanos = personajes.filter(p => equipoVillanos.includes(p.nombre) && p.tipo === 'villano').slice(0, 3);
  // Simular las rondas adicionales
  let simulados = {};
  for (let p of [...heroes, ...villanos]) {
    simulados[p.id] = Object.assign(Object.create(Object.getPrototypeOf(p)), p);
    simulados[p.id].vida = 100 + (simulados[p.id].nivel - 1) * 5;
  }
  let vivosHeroes = heroes.map(p => simulados[p.id]);
  let vivosVillanos = villanos.map(p => simulados[p.id]);
  let historial = fight.rondas || [];
  let rondaNum = historial.length + 1;
  for (const round of rondas) {
    if (vivosHeroes.length === 0 || vivosVillanos.length === 0) break;
    let heroe = vivosHeroes[0];
    let villano = vivosVillanos[0];
    let ronda = { ronda: rondaNum, heroe: heroe.nombre, villano: villano.nombre, historia: [] };
    let turno = 0;
    while (heroe.vida > 0 && villano.vida > 0) {
      let atacante, defensor, desc, esUltimate = false, ataque;
      if (turno % 2 === 0) {
        atacante = heroe;
        defensor = villano;
      } else {
        atacante = villano;
        defensor = heroe;
      }
      if (atacante.ultimateDisponible) {
        ataque = atacante.usarUltimate();
        desc = `¡Ultimate! (${ataque} daño, ignora escudo)`;
        esUltimate = true;
      } else {
        const prob = Math.random();
        if (prob < 0.4) {
          let base = (Math.random() < 0.5) ? atacante.getAtaqueBasico() : atacante.getAtaqueEspecial();
          ataque = atacante.getAtaqueCritico(base);
          desc = `Ataque crítico (${ataque} daño)`;
        } else if (prob < 0.7) {
          ataque = atacante.getAtaqueEspecial();
          desc = `Ataque especial (${ataque} daño)`;
        } else {
          ataque = atacante.getAtaqueBasico();
          desc = `Ataque básico (${ataque} daño)`;
        }
      }
      let vidaAntes = defensor.vida;
      defensor.recibirDanio(ataque, esUltimate);
      atacante.cargarUltimate(ataque);
      ronda.historia.push(`${atacante.nombre} ataca a ${defensor.nombre}: ${desc} (vida: ${vidaAntes.toFixed(2)} → ${defensor.vida.toFixed(2)})`);
      turno++;
    }
    if (heroe.vida <= 0) {
      ronda.resultado = `${villano.nombre} gana la ronda`;
      vivosHeroes.shift();
    } else {
      ronda.resultado = `${heroe.nombre} gana la ronda`;
      vivosVillanos.shift();
    }
    historial.push(ronda);
    rondaNum++;
  }
  let resultado;
  if (vivosHeroes.length > 0 && vivosVillanos.length === 0) resultado = '¡Ganan los superhéroes!';
  else if (vivosVillanos.length > 0 && vivosHeroes.length === 0) resultado = '¡Ganan los villanos!';
  else resultado = 'Pelea inconclusa';
  await fightRepository.updateFight(fightId, { ...fight, resultado, rondas: historial });
  res.json({ fightId, resultado, rondas: historial });
});

/**
 * @swagger
 * /api/fights/teams:
 *   get:
 *     summary: Obtener todas las peleas en equipo (paginado)
 *     tags: [Peleas]
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
 *         description: Cantidad de peleas por página
 *     responses:
 *       200:
 *         description: Lista paginada de peleas en equipo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 fights:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       equipoHeroes:
 *                         type: array
 *                         items:
 *                           type: string
 *                       equipoVillanos:
 *                         type: array
 *                         items:
 *                           type: string
 *                       resultado:
 *                         type: string
 *                       historial:
 *                         type: array
 *                         items:
 *                           type: object
 */
// GET para peleas en equipo con paginación
router.get('/fights/teams', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const fights = await fightRepository.getFights();
  const teamFights = fights.filter(f => f.equipoHeroes && f.equipoVillanos);
  const total = teamFights.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const fightsPage = teamFights.slice(start, end);
  res.json({ total, totalPages, page, fights: fightsPage });
});

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
// PUT para actualizar el ganador de una pelea
router.put('/fights/:fightId', async (req, res) => {
  const fightId = parseInt(req.params.fightId, 10);
  const { winner } = req.body;
  if (!winner) {
    return res.status(400).json({ error: 'El nombre del ganador es obligatorio' });
  }
  const fight = await fightRepository.getFightById(fightId);
  if (!fight) {
    return res.status(404).json({ error: 'Pelea no encontrada' });
  }
  await fightRepository.updateFight(fightId, { ...fight, winner });
  const updated = await fightRepository.getFightById(fightId);
  res.json({ fight: updated });
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
// DELETE para eliminar una pelea
router.delete('/fights/:fightId', async (req, res) => {
  const fightId = parseInt(req.params.fightId, 10);
  const fight = await fightRepository.getFightById(fightId);
  if (!fight) {
    return res.status(404).json({ error: 'Pelea no encontrada' });
  }
  await fightRepository.deleteFight(fightId);
  res.json({ message: 'Pelea eliminada exitosamente' });
});

export default router; 