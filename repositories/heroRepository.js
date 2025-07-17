import fs from 'fs-extra'
import { Personaje } from '../models/Personaje.js'

const filePath = './api-superheroes/data/personajes.json'

async function getPersonajes() {
    try {
        const data = await fs.readJson(filePath)
        return data.map(p => new Personaje(
            p.id, p.nombre, p.ciudad, p.tipo, p.equipo,
            p.nivel || 1, p.experiencia || 0, p.escudo || 0, p.dañoUltimate || 0, p.umbralUltimate || 150, p.ultimateDisponible || false
        ))
    } catch (error) {
        console.error(error)
        return []
    }
}

async function savePersonajes(personajes) {
    try {
        // Guardar todos los atributos relevantes con formato bonito
        await fs.writeJson(filePath, personajes.map(p => ({
            id: p.id,
            nombre: p.nombre,
            ciudad: p.ciudad,
            tipo: p.tipo,
            equipo: p.equipo,
            nivel: p.nivel,
            experiencia: p.experiencia,
            escudo: p.escudo,
            vida: p.vida,
            dañoUltimate: p.dañoUltimate,
            umbralUltimate: p.umbralUltimate,
            ultimateDisponible: p.ultimateDisponible
        })), { spaces: 2 })
    } catch (error) {
        console.error(error)
    }
}

export default {
    getPersonajes,
    savePersonajes
}