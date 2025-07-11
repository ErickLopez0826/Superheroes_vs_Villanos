import fs from 'fs-extra'
import { Personaje } from '../models/Personaje.js'

const filePath = './data/personajes.json'

async function getPersonajes() {
    try {
        const data = await fs.readJson(filePath)
        return data.map(p => new Personaje(p.id, p.nombre, p.ciudad, p.tipo))
    } catch (error) {
        console.error(error)
        return []
    }
}

async function savePersonajes(personajes) {
    try {
        await fs.writeJson(filePath, personajes)
    } catch (error) {
        console.error(error)
    }
}

export default {
    getPersonajes,
    savePersonajes
}