import { connectDB } from '../data/mongoClient.js';

async function getPersonajes() {
    const db = await connectDB();
    return db.collection('personajes').find({}).toArray();
}

async function getPersonajeById(id) {
    const db = await connectDB();
    return db.collection('personajes').findOne({ id: Number(id) });
}

async function addPersonaje(personaje) {
    const db = await connectDB();
    await db.collection('personajes').insertOne(personaje);
}

async function updatePersonaje(id, updatedPersonaje) {
    const db = await connectDB();
    await db.collection('personajes').updateOne(
        { id: Number(id) },
        { $set: updatedPersonaje }
    );
}

async function deletePersonaje(id) {
    const db = await connectDB();
    await db.collection('personajes').deleteOne({ id: Number(id) });
}

export default {
    getPersonajes,
    getPersonajeById,
    addPersonaje,
    updatePersonaje,
    deletePersonaje
};