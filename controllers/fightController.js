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
      // Si tiene ultimate disponible, lo usa
      if (atacante.ultimateDisponible) {
        ataque = atacante.usarUltimate();
        desc = `¡Ultimate! (${ataque} daño, ignora escudo)`;
        esUltimate = true;
      } else {
        // Probabilidad de crítico 40%
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
    await personajeService.updateAllPersonajes(personajes);
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
 * /api/fights/teams/start:
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
 *                 description: Nombre del equipo de superhéroes
 *               equipoVillanos:
 *                 type: string
 *                 description: Nombre del equipo de villanos
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
 *                 heroes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                       nivel:
 *                         type: integer
 *                       experiencia:
 *                         type: integer
 *                       escudo:
 *                         type: integer
 *                       vida:
 *                         type: number
 *                       ultimateDisponible:
 *                         type: boolean
 *                 villanos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                       nivel:
 *                         type: integer
 *                       experiencia:
 *                         type: integer
 *                       escudo:
 *                         type: integer
 *                       vida:
 *                         type: number
 *                       ultimateDisponible:
 *                         type: boolean
 *       400:
 *         description: Datos inválidos o enfrentamiento no permitido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/fights/teams/start',
  [
    body('equipoHeroes').isString().notEmpty().withMessage('equipoHeroes es obligatorio'),
    body('equipoVillanos').isString().notEmpty().withMessage('equipoVillanos es obligatorio'),
    body('rondas').isArray({ min: 1 }).withMessage('Debes enviar al menos un round')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { equipoHeroes, equipoVillanos, rondas } = req.body;
    const personajes = await personajeService.getAllPersonajes();
    const heroes = personajes.filter(p => p.equipo === equipoHeroes && p.tipo === 'superheroe').slice(0, 3);
    const villanos = personajes.filter(p => p.equipo === equipoVillanos && p.tipo === 'villano').slice(0, 3);
    if (heroes.length !== 3 || villanos.length !== 3) {
      return res.status(400).json({ error: 'Ambos equipos deben tener exactamente 3 miembros del tipo correcto' });
    }
    let vivosHeroes = heroes.map(p => ({ ...p, vida: 100 }));
    let vivosVillanos = villanos.map(p => ({ ...p, vida: 100 }));
    let historial = [];
    let rondaNum = 1;
    let peleaFinalizada = false;
    for (const round of rondas) {
      if (vivosHeroes.length === 0 || vivosVillanos.length === 0) { peleaFinalizada = true; break; }
      let atacante, defensor, tipoGolpe, daño;
      tipoGolpe = round.tipoGolpe;
      if (!['basico', 'especial', 'critico'].includes(tipoGolpe)) {
        return res.status(400).json({ error: `Tipo de golpe inválido en ronda ${rondaNum}` });
      }
      if (round.atacante === 'heroe') {
        atacante = vivosHeroes[0];
        defensor = vivosVillanos[0];
      } else if (round.atacante === 'villano') {
        atacante = vivosVillanos[0];
        defensor = vivosHeroes[0];
      } else {
        return res.status(400).json({ error: `Atacante inválido en ronda ${rondaNum}` });
      }
      if (!atacante || !defensor) break;
      if (tipoGolpe === 'basico') daño = -5;
      else if (tipoGolpe === 'especial') daño = -30;
      else if (tipoGolpe === 'critico') daño = -45;
      defensor.vida += daño;
      historial.push({
        ronda: rondaNum,
        atacante: atacante.nombre,
        defensor: defensor.nombre,
        tipoGolpe,
        daño,
        vidasHeroes: vivosHeroes.map(h => ({ nombre: h.nombre, vida: h.vida })),
        vidasVillanos: vivosVillanos.map(v => ({ nombre: v.nombre, vida: v.vida })),
        vidaDefensor: defensor.vida,
        mensaje: `${atacante.nombre} ataca a ${defensor.nombre} con golpe ${tipoGolpe} (${daño} vida, vida restante de ${defensor.nombre}: ${defensor.vida})`
      });
      if (defensor.vida <= 0) {
        if (round.atacante === 'heroe') {
          vivosVillanos.shift();
        } else {
          vivosHeroes.shift();
        }
      }
      rondaNum++;
    }
    let resultado;
    if (vivosHeroes.length > 0 && vivosVillanos.length === 0) { resultado = '¡Ganan los superhéroes!'; peleaFinalizada = true; }
    else if (vivosVillanos.length > 0 && vivosHeroes.length === 0) { resultado = '¡Ganan los villanos!'; peleaFinalizada = true; }
    else resultado = 'Pelea inconclusa';
    // Guardar pelea en historial
    const fightsAll = await fightRepository.getFights();
    const newFightId = fightsAll.length > 0 ? Math.max(...fightsAll.map(f => f.fightId)) + 1 : 1;
    const fight = {
      fightId: newFightId,
      equipoHeroes: heroes.map(h => h.nombre),
      equipoVillanos: villanos.map(v => v.nombre),
      resultado,
      historial
    };
    fightsAll.push(fight);
    await fightRepository.saveFights(fightsAll);
    if (peleaFinalizada) {
      const personajesRestablecidos = personajes.map(p => {
        if ((heroes.some(h => h.id === p.id) || villanos.some(v => v.id === p.id))) {
          return { ...p, vida: 100 };
        }
        return p;
      });
      await personajeService.updateAllPersonajes(personajesRestablecidos);
    }
    res.json({
      resultado,
      rondas,
      heroes: vivosHeroes.map(p => ({
        id: p.id,
        nombre: p.nombre,
        tipo: p.tipo,
        nivel: p.nivel,
        experiencia: p.experiencia,
        escudo: p.escudo,
        vida: p.vida,
        ultimateDisponible: p.ultimateDisponible
      })),
      villanos: vivosVillanos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        tipo: p.tipo,
        nivel: p.nivel,
        experiencia: p.experiencia,
        escudo: p.escudo,
        vida: p.vida,
        ultimateDisponible: p.ultimateDisponible
      }))
    });
  }
);

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
 *             required:
 *               - fightId
 *     responses:
 *       200:
 *         description: Resultado actualizado de la pelea por equipos
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
 *                 heroes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                       nivel:
 *                         type: integer
 *                       experiencia:
 *                         type: integer
 *                       escudo:
 *                         type: integer
 *                       vida:
 *                         type: number
 *                       ultimateDisponible:
 *                         type: boolean
 *                 villanos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                       nivel:
 *                         type: integer
 *                       experiencia:
 *                         type: integer
 *                       escudo:
 *                         type: integer
 *                       vida:
 *                         type: number
 *                       ultimateDisponible:
 *                         type: boolean
 *       400:
 *         description: Datos inválidos o enfrentamiento no permitido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/fights/teams/continue',
  [
    body('fightId').isInt({ min: 1 }).withMessage('fightId es obligatorio y debe ser entero positivo'),
    body('equipoHeroes').isString().notEmpty().withMessage('equipoHeroes es obligatorio'),
    body('equipoVillanos').isString().notEmpty().withMessage('equipoVillanos es obligatorio'),
    body('rondas').isArray({ min: 1 }).withMessage('Debes enviar al menos un round'),
    body('numeroRonda').optional().isInt({ min: 1 }).withMessage('numeroRonda debe ser un entero positivo si se proporciona')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { fightId, equipoHeroes, equipoVillanos, rondas, numeroRonda } = req.body;
    const personajes = await personajeService.getAllPersonajes();
    const heroes = personajes.filter(p => p.equipo === equipoHeroes && p.tipo === 'superheroe').slice(0, 3);
    const villanos = personajes.filter(p => p.equipo === equipoVillanos && p.tipo === 'villano').slice(0, 3);
    if (heroes.length !== 3 || villanos.length !== 3) {
      return res.status(400).json({ error: 'Ambos equipos deben tener exactamente 3 miembros del tipo correcto' });
    }
    let fights = await fightRepository.getFights();
    let fight = fights.find(f => f.fightId === fightId);
    if (!fight) return res.status(400).json({ error: 'fightId no encontrado' });
    let historial = [...fight.historial];
    const last = historial.length > 0 ? historial[historial.length - 1] : null;
    let vivosHeroes = heroes.map(h => {
      const vida = last?.vidasHeroes?.find(vh => vh.nombre === h.nombre)?.vida ?? 100;
      return { ...h, vida };
    });
    let vivosVillanos = villanos.map(v => {
      const vida = last?.vidasVillanos?.find(vv => vv.nombre === v.nombre)?.vida ?? 100;
      return { ...v, vida };
    });
    let rondaNum = numeroRonda || (historial.length + 1);
    let peleaFinalizada = false;
    for (const round of rondas) {
      if (vivosHeroes.length === 0 || vivosVillanos.length === 0) { peleaFinalizada = true; break; }
      let atacante, defensor, tipoGolpe, daño;
      tipoGolpe = round.tipoGolpe;
      if (!['basico', 'especial', 'critico'].includes(tipoGolpe)) {
        return res.status(400).json({ error: `Tipo de golpe inválido en ronda ${rondaNum}` });
      }
      if (round.atacante === 'heroe') {
        atacante = vivosHeroes[0];
        defensor = vivosVillanos[0];
      } else if (round.atacante === 'villano') {
        atacante = vivosVillanos[0];
        defensor = vivosHeroes[0];
      } else {
        return res.status(400).json({ error: `Atacante inválido en ronda ${rondaNum}` });
      }
      if (!atacante || !defensor) break;
      if (tipoGolpe === 'basico') daño = -5;
      else if (tipoGolpe === 'especial') daño = -30;
      else if (tipoGolpe === 'critico') daño = -45;
      defensor.vida += daño;
      historial.push({
        ronda: rondaNum,
        atacante: atacante.nombre,
        defensor: defensor.nombre,
        tipoGolpe,
        daño,
        vidasHeroes: vivosHeroes.map(h => ({ nombre: h.nombre, vida: h.vida })),
        vidasVillanos: vivosVillanos.map(v => ({ nombre: v.nombre, vida: v.vida })),
        vidaDefensor: defensor.vida,
        mensaje: `${atacante.nombre} ataca a ${defensor.nombre} con golpe ${tipoGolpe} (${daño} vida, vida restante de ${defensor.nombre}: ${defensor.vida})`
      });
      if (defensor.vida <= 0) {
        if (round.atacante === 'heroe') {
          vivosVillanos.shift();
        } else {
          vivosHeroes.shift();
        }
      }
      rondaNum++;
    }
    let resultado;
    if (vivosHeroes.length > 0 && vivosVillanos.length === 0) { resultado = '¡Ganan los superhéroes!'; peleaFinalizada = true; }
    else if (vivosVillanos.length > 0 && vivosHeroes.length === 0) { resultado = '¡Ganan los villanos!'; peleaFinalizada = true; }
    else resultado = 'Pelea inconclusa';
    fight.historial = historial;
    fight.resultado = resultado;
    await fightRepository.saveFights(fights);
    if (peleaFinalizada) {
      const personajesRestablecidos = personajes.map(p => {
        if ((heroes.some(h => h.id === p.id) || villanos.some(v => v.id === p.id))) {
          return { ...p, vida: 100 };
        }
        return p;
      });
      await personajeService.updateAllPersonajes(personajesRestablecidos);
    }
    res.json({
      resultado,
      rondas,
      heroes: vivosHeroes.map(p => ({
        id: p.id,
        nombre: p.nombre,
        tipo: p.tipo,
        nivel: p.nivel,
        experiencia: p.experiencia,
        escudo: p.escudo,
        vida: p.vida,
        ultimateDisponible: p.ultimateDisponible
      })),
      villanos: vivosVillanos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        tipo: p.tipo,
        nivel: p.nivel,
        experiencia: p.experiencia,
        escudo: p.escudo,
        vida: p.vida,
        ultimateDisponible: p.ultimateDisponible
      }))
    });
  }
);

/**
 * @swagger
 * /api/fights/solo:
 *   get:
 *     summary: Obtener todas las peleas 1 vs 1 (paginado)
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
 *         description: Lista paginada de peleas 1 vs 1
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
 *                       personaje1:
 *                         type: object
 *                       personaje2:
 *                         type: object
 *                       ganador:
 *                         type: string
 *                       historia:
 *                         type: array
 *                         items:
 *                           type: string
 */
// GET para peleas 1 vs 1 con paginación
router.get('/fights/solo', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const fights = await fightRepository.getFights();
  // Filtrar solo peleas 1 vs 1 (que tengan personaje1 y personaje2)
  const soloFights = fights.filter(f => f.personaje1 && f.personaje2);
  const total = soloFights.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const fightsPage = soloFights.slice(start, end);
  res.json({ total, totalPages, page, fights: fightsPage });
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
  // Filtrar solo peleas de equipos (que tengan equipoHeroes y equipoVillanos)
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