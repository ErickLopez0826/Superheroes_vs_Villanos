import { connectDB } from './mongoClient.js';

async function normalizarPersonajes() {
  const db = await connectDB();
  const personajes = await db.collection('personajes').find({}).toArray();
  for (const p of personajes) {
    await db.collection('personajes').updateOne(
      { _id: p._id },
      {
        $set: {
          id: Number(p.id),
          nivel: Number(p.nivel),
          experiencia: Number(p.experiencia),
          escudo: Number(p.escudo),
          vidaMaxima: p.vidaMaxima !== undefined ? Number(p.vidaMaxima) : undefined,
          vida: Number(p.vida),
          dañoBasico: p.dañoBasico !== undefined ? Number(p.dañoBasico) : undefined,
          dañoEspecial: p.dañoEspecial !== undefined ? Number(p.dañoEspecial) : undefined,
          dañoUltimate: p.dañoUltimate !== undefined ? Number(p.dañoUltimate) : undefined,
          cargaUltimate: p.cargaUltimate !== undefined ? Number(p.cargaUltimate) : undefined,
          equipo: p.equipo ? p.equipo.trim().toUpperCase() : undefined,
          tipo: p.tipo ? p.tipo.trim().toLowerCase() : undefined
        }
      }
    );
  }
  console.log('Normalización completada.');
  process.exit(0);
}

normalizarPersonajes(); 