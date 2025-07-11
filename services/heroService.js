import personajeRepository from '../repositories/heroRepository.js'

async function getAllPersonajes() {
    return await personajeRepository.getPersonajes()
}

async function addPersonaje(personaje) {
    if (!personaje.nombre || !personaje.tipo) {
        throw new Error("El personaje debe tener un nombre y un tipo.");
    }
    const personajes = await personajeRepository.getPersonajes();
    const newId = personajes.length > 0 ? Math.max(...personajes.map(p => p.id)) + 1 : 1;
    const newPersonaje = { ...personaje, id: newId };
    personajes.push(newPersonaje);
    await personajeRepository.savePersonajes(personajes);
    return newPersonaje;
}

async function updatePersonaje(id, updatedPersonaje) {
    const personajes = await personajeRepository.getPersonajes();
    const index = personajes.findIndex(p => p.id === parseInt(id));
    if (index === -1) {
        throw new Error('Personaje no encontrado');
    }
    delete updatedPersonaje.id;
    personajes[index] = { ...personajes[index], ...updatedPersonaje };
    await personajeRepository.savePersonajes(personajes);
    return personajes[index];
}

async function deletePersonaje(id) {
    const personajes = await personajeRepository.getPersonajes();
    const index = personajes.findIndex(p => p.id === parseInt(id));
    if (index === -1) {
        throw new Error('Personaje no encontrado');
    }
    const filtered = personajes.filter(p => p.id !== parseInt(id));
    await personajeRepository.savePersonajes(filtered);
    return { message: 'Personaje eliminado' };
}

async function findPersonajesByCiudad(ciudad) {
    const personajes = await personajeRepository.getPersonajes();
    return personajes.filter(p => p.ciudad.toLowerCase() === ciudad.toLowerCase());
}

async function findPersonajesByTipo(tipo) {
    const personajes = await personajeRepository.getPersonajes();
    return personajes.filter(p => p.tipo === tipo);
}

async function updateAllPersonajes(personajes) {
    await personajeRepository.savePersonajes(personajes);
}

export default {
    getAllPersonajes,
    addPersonaje,
    updatePersonaje,
    deletePersonaje,
    findPersonajesByCiudad,
    findPersonajesByTipo,
    updateAllPersonajes
};