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

async function inicializarAtributosPersonajes() {
    const personajes = await personajeRepository.getPersonajes();
    const actualizados = personajes.map(p => {
        return {
            ...p,
            nivel: p.nivel || 1,
            experiencia: p.experiencia || 0,
            escudo: p.escudo || 0,
            dañoUltimate: p.dañoUltimate || 0,
            umbralUltimate: p.umbralUltimate || 150,
            ultimateDisponible: p.ultimateDisponible || false,
            vida: p.vida || 100 + ((p.nivel || 1) - 1) * 5
        };
    });
    await personajeRepository.savePersonajes(actualizados);
}

async function repararEquipos() {
    const personajes = await personajeRepository.getPersonajes();
    const equipos = {
        LigaDeLaJusticia: [1, 2, 3],
        Vengadores: [9, 10, 11],
        GuardianesGalaxia: [17, 18, 19],
        LegionDelMal: [21, 22, 23],
        InjusticeSquad: [24, 25, 26],
        SinisterTrio: [27, 28, 29]
    };
    const actualizados = personajes.map(p => {
        for (const [nombre, ids] of Object.entries(equipos)) {
            if (ids.includes(p.id)) {
                return { ...p, equipo: nombre };
            }
        }
        // Si no pertenece a ningún equipo principal, se deja como está
        return { ...p, equipo: p.equipo && Object.keys(equipos).includes(p.equipo) ? p.equipo : undefined };
    });
    await personajeRepository.savePersonajes(actualizados);
}

async function normalizarNombresEquipos() {
    const personajes = await personajeRepository.getPersonajes();
    const actualizados = personajes.map(p => {
        if (p.equipo) {
            return { ...p, equipo: p.equipo.trim().toUpperCase() };
        }
        return p;
    });
    await personajeRepository.savePersonajes(actualizados);
}

async function repararTipoEquipos() {
    const personajes = await personajeRepository.getPersonajes();
    const equipos = {
        LigaDeLaJusticia: { ids: [1, 2, 3], tipo: 'superheroe' },
        Vengadores: { ids: [9, 10, 11], tipo: 'superheroe' },
        GuardianesGalaxia: { ids: [17, 18, 19], tipo: 'superheroe' },
        LegionDelMal: { ids: [21, 22, 23], tipo: 'villano' },
        InjusticeSquad: { ids: [24, 25, 26], tipo: 'villano' },
        SinisterTrio: { ids: [27, 28, 29], tipo: 'villano' }
    };
    const actualizados = personajes.map(p => {
        for (const [nombre, data] of Object.entries(equipos)) {
            if (data.ids.includes(p.id)) {
                return { ...p, tipo: data.tipo };
            }
        }
        return p;
    });
    await personajeRepository.savePersonajes(actualizados);
}

export default {
    getAllPersonajes,
    addPersonaje,
    updatePersonaje,
    deletePersonaje,
    findPersonajesByCiudad,
    findPersonajesByTipo,
    updateAllPersonajes,
    inicializarAtributosPersonajes,
    repararEquipos,
    normalizarNombresEquipos,
    repararTipoEquipos
};