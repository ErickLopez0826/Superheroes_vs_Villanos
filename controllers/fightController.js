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
    res.json({ personaje1: fight.personaje1, personaje2: fight.personaje2, winner: fight.winner, fightId });
  }
);

/**
 * @swagger
 * /api/fights/teams:
 *   post:
 *     summary: Simular una pelea entre equipos de 3 superhéroes vs 3 villanos usando nombres de equipo y rounds definidos por el usuario
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
 *                 example: LigaDeLaJusticia
 *               equipoVillanos:
 *                 type: string
 *                 description: Nombre del equipo de villanos (debe tener 3 miembros)
 *                 example: LegionDelMal
 *               rondas:
 *                 type: array
 *                 description: Secuencia de golpes (turnos) definidos por el usuario
 *                 items:
 *                   type: object
 *                   properties:
 *                     atacante:
 *                       type: string
 *                       enum: [heroe, villano]
 *                       description: Quién ataca en este turno
 *                     tipoGolpe:
 *                       type: string
 *                       enum: [basico, especial, critico]
 *                       description: Tipo de golpe
 *               fightId:
 *                 type: integer
 *                 description: ID de la pelea a continuar (opcional, para continuar una pelea existente)
 *                 example: 1
 *               numeroRonda:
 *                 type: integer
 *                 description: Número de ronda inicial (opcional, para controlar el número de ronda)
 *                 example: 2
 *             required:
 *               - equipoHeroes
 *               - equipoVillanos
 *               - rondas
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
 *                 historial:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ronda:
 *                         type: integer
 *                       atacante:
 *                         type: string
 *                       defensor:
 *                         type: string
 *                       tipoGolpe:
 *                         type: string
 *                       daño:
 *                         type: integer
 *                       vidasHeroes:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             nombre:
 *                               type: string
 *                             vida:
 *                               type: integer
 *                       vidasVillanos:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             nombre:
 *                               type: string
 *                             vida:
 *                               type: integer
 *                       vidaDefensor:
 *                         type: integer
 *                       mensaje:
 *                         type: string
 *                 fightId:
 *                   type: integer
 *                   description: ID de la pelea (útil para continuar la pelea en siguientes requests)
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
    body('equipoVillanos').isString().notEmpty().withMessage('equipoVillanos es obligatorio'),
    body('rondas').isArray({ min: 1 }).withMessage('Debes enviar al menos un round'),
    body('fightId').optional().isInt({ min: 1 }).withMessage('fightId debe ser un entero positivo si se proporciona'),
    body('numeroRonda').optional().isInt({ min: 1 }).withMessage('numeroRonda debe ser un entero positivo si se proporciona')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { equipoHeroes, equipoVillanos, rondas, fightId, numeroRonda } = req.body;
    const personajes = await personajeService.getAllPersonajes();
    const heroes = personajes.filter(p => p.equipo === equipoHeroes && p.tipo === 'superheroe').slice(0, 3);
    const villanos = personajes.filter(p => p.equipo === equipoVillanos && p.tipo === 'villano').slice(0, 3);
    if (heroes.length !== 3 || villanos.length !== 3) {
      return res.status(400).json({ error: 'Ambos equipos deben tener exactamente 3 miembros del tipo correcto' });
    }
    // Obtener historial y vidas actuales si es continuación de pelea
    let fights = await fightRepository.getFights();
    let fight, historial = [], vivosHeroes, vivosVillanos, rondaNum;
    if (fightId) {
      fight = fights.find(f => f.fightId === fightId);
      if (!fight) return res.status(400).json({ error: 'fightId no encontrado' });
      historial = [...fight.historial];
      // Recuperar vidas actuales de historial
      const last = historial.length > 0 ? historial[historial.length - 1] : null;
      vivosHeroes = heroes.map(h => {
        const vida = last?.vidasHeroes?.find(vh => vh.nombre === h.nombre)?.vida ?? 100;
        return { ...h, vida };
      });
      vivosVillanos = villanos.map(v => {
        const vida = last?.vidasVillanos?.find(vv => vv.nombre === v.nombre)?.vida ?? 100;
        return { ...v, vida };
      });
      rondaNum = numeroRonda || (historial.length + 1);
    } else {
      // Nueva pelea
      vivosHeroes = heroes.map(p => ({ ...p, vida: 100 }));
      vivosVillanos = villanos.map(p => ({ ...p, vida: 100 }));
      rondaNum = numeroRonda || 1;
    }
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
      // Calcular daño
      if (tipoGolpe === 'basico') daño = -5;
      else if (tipoGolpe === 'especial') daño = -30;
      else if (tipoGolpe === 'critico') daño = -45;
      // Aplicar daño acumulativo
      defensor.vida += daño;
      // Guardar historial mostrando la vida de todos los personajes de ambos equipos tras cada golpe
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
      // Si el defensor muere, lo eliminamos (el daño es acumulativo, no se reinicia la vida)
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
    // Guardar pelea en historial (nueva o actualizar existente)
    let newFightId = fightId;
    if (fightId) {
      // Actualizar pelea existente
      fight.historial = historial;
      fight.resultado = resultado;
      await fightRepository.saveFights(fights);
    } else {
      // Nueva pelea
      const fightsAll = await fightRepository.getFights();
      newFightId = fightsAll.length > 0 ? Math.max(...fightsAll.map(f => f.fightId)) + 1 : 1;
      const fight = {
        fightId: newFightId,
        equipoHeroes: heroes.map(h => h.nombre),
        equipoVillanos: villanos.map(v => v.nombre),
        resultado,
        historial
      };
      fightsAll.push(fight);
      await fightRepository.saveFights(fightsAll);
    }
    // Si la pelea terminó, restablecer la vida de los personajes
    if (peleaFinalizada) {
      const personajesRestablecidos = personajes.map(p => {
        if ((heroes.some(h => h.id === p.id) || villanos.some(v => v.id === p.id))) {
          return { ...p, vida: 100 };
        }
        return p;
      });
      await personajeService.updateAllPersonajes(personajesRestablecidos);
    }
    res.json({ resultado, historial, fightId: newFightId });
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
 *                 description: Nombre del equipo de superhéroes (debe tener 3 miembros)
 *                 example: LigaDeLaJusticia
 *               equipoVillanos:
 *                 type: string
 *                 description: Nombre del equipo de villanos (debe tener 3 miembros)
 *                 example: LegionDelMal
 *               rondas:
 *                 type: array
 *                 description: Secuencia de golpes (turnos) definidos por el usuario
 *                 items:
 *                   type: object
 *                   properties:
 *                     atacante:
 *                       type: string
 *                       enum: [heroe, villano]
 *                       description: Quién ataca en este turno
 *                     tipoGolpe:
 *                       type: string
 *                       enum: [basico, especial, critico]
 *                       description: Tipo de golpe
 *             required:
 *               - equipoHeroes
 *               - equipoVillanos
 *               - rondas
 *     responses:
 *       200:
 *         description: Pelea iniciada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultado:
 *                   type: string
 *                 historial:
 *                   type: array
 *                   items:
 *                     type: object
 *                 fightId:
 *                   type: integer
 *                   description: ID de la pelea creada
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
    res.json({ resultado, historial, fightId: newFightId });
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
 *                 example: 1
 *               equipoHeroes:
 *                 type: string
 *                 description: Nombre del equipo de superhéroes
 *                 example: LigaDeLaJusticia
 *               equipoVillanos:
 *                 type: string
 *                 description: Nombre del equipo de villanos
 *                 example: LegionDelMal
 *               rondas:
 *                 type: array
 *                 description: Secuencia de golpes (turnos) definidos por el usuario
 *                 items:
 *                   type: object
 *                   properties:
 *                     atacante:
 *                       type: string
 *                       enum: [heroe, villano]
 *                       description: Quién ataca en este turno
 *                     tipoGolpe:
 *                       type: string
 *                       enum: [basico, especial, critico]
 *                       description: Tipo de golpe
 *               numeroRonda:
 *                 type: integer
 *                 description: Número de ronda inicial (opcional)
 *                 example: 2
 *             required:
 *               - fightId
 *               - equipoHeroes
 *               - equipoVillanos
 *               - rondas
 *     responses:
 *       200:
 *         description: Pelea continuada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultado:
 *                   type: string
 *                 historial:
 *                   type: array
 *                   items:
 *                     type: object
 *                 fightId:
 *                   type: integer
 *                   description: ID de la pelea
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
    res.json({ resultado, historial, fightId });
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