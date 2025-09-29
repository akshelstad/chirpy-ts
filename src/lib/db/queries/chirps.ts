import { db } from "../index.js";
import { eq } from "drizzle-orm";
import { NewChirp, chirps } from "../schema.js";

export async function createChirp(chirp: NewChirp) {
  const [rows] = await db.insert(chirps).values(chirp).returning();
  return rows;
}

export async function getChirps() {
  return db.select().from(chirps);
}

export async function getChirpById(chirpId: string) {
  const rows = await db.select().from(chirps).where(eq(chirps.id, chirpId));
  if (rows.length === 0) {
    return;
  }
  return rows[0];
}
