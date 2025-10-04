import { db } from "../index.js";
import { eq } from "drizzle-orm";
import { NewUser, users } from "../schema.js";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function getUserByEmail(email: string) {
  const [result] = await db.select().from(users).where(eq(users.email, email));
  return result;
}

export async function getUserById(userId: string) {
  const [result] = await db.select().from(users).where(eq(users.id, userId));
  return result;
}

export async function updateUser(
  userId: string,
  hashedPassword: string,
  email: string
) {
  const [result] = await db
    .update(users)
    .set({
      email: email,
      hashedPassword: hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return result;
}

export async function upgradeUser(userId: string) {
  const [result] = await db
    .update(users)
    .set({ isChirpyRed: true, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return result;
}

export async function reset() {
  await db.delete(users);
}
