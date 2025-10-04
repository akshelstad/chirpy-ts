import { db } from "../index.js";
import { eq, isNull, sql, gt, and } from "drizzle-orm";
import { refreshTokens, users } from "../schema.js";
import { cfg } from "../../../config.js";
import { InternalServerError } from "../../../api/errors.js";

const REF_DURATION = cfg.jwt.refreshDuration;

export async function saveRefreshToken(userId: string, token: string) {
  const [result] = await db
    .insert(refreshTokens)
    .values({
      userId,
      token,
      expiresAt: new Date(Date.now() + REF_DURATION),
      revokedAt: null,
    })
    .returning();
  return result;
}

export async function userForRefreshToken(token: string) {
  const [result] = await db
    .select({
      user: users,
    })
    .from(users)
    .innerJoin(refreshTokens, eq(users.id, refreshTokens.userId))
    .where(
      and(
        eq(refreshTokens.token, token),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  return result;
}

export async function revokeRefreshToken(token: string) {
  const rows = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(refreshTokens.token, token))
    .returning();

  if (rows.length === 0) {
    throw new InternalServerError("unable to revoke token");
  }
}
