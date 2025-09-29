import * as argon2 from "argon2";
import { InternalServerError } from "src/api/errors";

export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await argon2.hash(password);
    return hash;
  } catch (err) {
    throw new InternalServerError(
      `unable to hash password: ${(err as Error).message}`
    );
  }
}

export async function checkPasswordHash(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    if (await argon2.verify(hash, password)) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new InternalServerError(
      `unable to verify password: ${(err as Error).message}`
    );
  }
}
