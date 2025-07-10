import express from "express";
import { check, validationResult } from 'express-validator';
import heroService from '../services/heroService.js';
import villainService from '../services/villainService.js';
import fightRepository from '../repositories/fightRepository.js';

const router = express.Router();

/**
 * @swagger
 * /api/fights:
 *   post:
 *     summary: Simular una pelea entre un héroe y un villano
 *     tags: [Peleas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               heroId:
 *                 type: integer
 *                 example: 1
 *               villainId:
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
 *                 hero:
 *                   $ref: '#/components/schemas/Hero'
 *                 villain:
 *                   $ref: '#/components/schemas/Villain'
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
    check('heroId').isInt({ min: 1 }).withMessage('heroId debe ser un entero positivo'),
    check('villainId').isInt({ min: 1 }).withMessage('villainId debe ser un entero positivo')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { heroId, villainId } = req.body;
    // Buscar héroe y villano
    const hero = (await heroService.getAllHeroes()).find(h => h.id === parseInt(heroId));
    const villain = (await villainService.getAllVillains()).find(v => v.id === parseInt(villainId));
    if (!hero || !villain) {
      return res.status(400).json({ error: 'Debe existir un héroe y un villano válidos' });
    }
    // Validar que no sea heroe vs heroe ni villano vs villano
    if (heroId === villainId) {
      return res.status(400).json({ error: 'No se puede enfrentar el mismo personaje' });
    }
    // Simular pelea (aleatorio)
    const winner = Math.random() < 0.5 ? hero.name : villain.name;
    // Guardar pelea
    const fights = await fightRepository.getFights();
    const fightId = fights.length > 0 ? Math.max(...fights.map(f => f.fightId)) + 1 : 1;
    const fight = {
      fightId,
      hero: { id: hero.id, name: hero.name, alias: hero.alias },
      villain: { id: villain.id, name: villain.name, alias: villain.alias },
      winner
    };
    fights.push(fight);
    await fightRepository.saveFights(fights);
    res.json({ hero, villain, winner, fightId, history: fights });
  }
);

export default router; 