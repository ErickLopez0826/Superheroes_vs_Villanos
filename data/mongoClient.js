import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://Asta:Baqueta2@asta.oemnzjb.mongodb.net/';
const client = new MongoClient(uri);

let db;
export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('test'); // Cambia 'test' si tu base de datos tiene otro nombre
  }
  return db;
} 