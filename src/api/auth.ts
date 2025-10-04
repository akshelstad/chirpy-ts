import { getUserByEmail } from "../lib/db/queries/users.js";
import { respondWithJSON } from "./json.js";
import { UnauthorizedError } from "./errors.js";
import {
  checkPasswordHash,
  getBearerToken,
  makeJWT,
  makeRefreshToken,
} from "../auth.js";

import { Request, Response } from "express";
import { cfg } from "../config.js";
import type { UserResponse } from "./users.js";
import {
  revokeRefreshToken,
  saveRefreshToken,
  userForRefreshToken,
} from "../lib/db/queries/refresh.js";

const DEF_DURATION = cfg.jwt.defaultDuration;
const SECRET = cfg.jwt.secret;

type LoginResponse = UserResponse & {
  token: string;
  refreshToken: string;
};

export async function handlerLogin(req: Request, res: Response) {
  type parameters = {
    password: string;
    email: string;
  };

  const params: parameters = req.body;

  const user = await getUserByEmail(params.email);
  if (!user) {
    throw new UnauthorizedError("invalid username or password");
  }

  const validPw = await checkPasswordHash(params.password, user.hashedPassword);
  if (!validPw) {
    throw new UnauthorizedError("invalid password");
  }

  const accessToken = await makeJWT(user.id, DEF_DURATION, SECRET);
  const refreshToken = await makeRefreshToken();

  const saved = saveRefreshToken(user.id, refreshToken);
  if (!saved) {
    throw new UnauthorizedError("unable to save refresh token");
  }

  respondWithJSON(res, 200, {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
    token: accessToken,
    refreshToken,
  } satisfies LoginResponse);
}

export async function handlerRefresh(req: Request, res: Response) {
  type tokenResponse = {
    token: string;
  };

  const refreshToken = getBearerToken(req);

  const result = await userForRefreshToken(refreshToken);
  if (!result) {
    throw new UnauthorizedError("invalid refresh token");
  }

  const user = result.user;
  const accessToken = await makeJWT(user.id, DEF_DURATION, SECRET);

  respondWithJSON(res, 200, { token: accessToken } satisfies tokenResponse);
}

export async function handlerRevoke(req: Request, res: Response) {
  const refreshToken = getBearerToken(req);
  await revokeRefreshToken(refreshToken);
  res.status(204).send();
}
