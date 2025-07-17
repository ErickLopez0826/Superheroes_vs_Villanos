import { connectDB } from '../data/mongoClient.js';

async function getUsers() {
    const db = await connectDB();
    return db.collection('users').find({}).toArray();
}

async function getUserById(id) {
    const db = await connectDB();
    return db.collection('users').findOne({ id: Number(id) });
}

async function addUser(user) {
    const db = await connectDB();
    await db.collection('users').insertOne(user);
}

async function updateUser(id, updatedUser) {
    const db = await connectDB();
    await db.collection('users').updateOne(
        { id: Number(id) },
        { $set: updatedUser }
    );
}

async function deleteUser(id) {
    const db = await connectDB();
    await db.collection('users').deleteOne({ id: Number(id) });
}

export default {
    getUsers,
    getUserById,
    addUser,
    updateUser,
    deleteUser
}; 