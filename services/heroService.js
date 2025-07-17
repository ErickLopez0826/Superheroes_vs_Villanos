import personajeRepository from '../repositories/heroRepository.js';

async function getAllPersonajes() {
    return await personajeRepository.getPersonajes();
}

async function addPersonaje(personaje) {
    if (!personaje.nombre || !personaje.tipo) {
        throw new Error("El personaje debe tener un nombre y un tipo.");
    }
    // Obtener el mayor id actual para asignar uno nuevo
    const personajes = await personajeRepository.getPersonajes();
    const newId = personajes.length > 0 ? Math.max(...personajes.map(p => p.id)) + 1 : 1;
    const newPersonaje = { ...personaje, id: newId };
    await personajeRepository.addPersonaje(newPersonaje);
    return newPersonaje;
}

async function updatePersonaje(id, updatedPersonaje) {
    await personajeRepository.updatePersonaje(id, updatedPersonaje);
    return await personajeRepository.getPersonajeById(id);
}

async function deletePersonaje(id) {
    await personajeRepository.deletePersonaje(id);
    return { message: 'Personaje eliminado' };
}

async function findPersonajesByCiudad(ciudad) {
    const personajes = await personajeRepository.getPersonajes();
    return personajes.filter(p => p.ciudad && p.ciudad.toLowerCase() === ciudad.toLowerCase());
}

async function findPersonajesByTipo(tipo) {
    const personajes = await personajeRepository.getPersonajes();
    return personajes.filter(p => p.tipo === tipo);
}

export default {
    getAllPersonajes,
    addPersonaje,
    updatePersonaje,
    deletePersonaje,
    findPersonajesByCiudad,
    findPersonajesByTipo
};