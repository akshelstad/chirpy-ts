import { Request, Response } from "express";

import { respondWithJSON } from "./json.js";
import { createUser, updateUser } from "../lib/db/queries/users.js";
import { NewUser, User } from "../lib/db/schema.js";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "./errors.js";
import { getBearerToken, hashPassword, validateJWT } from "../auth.js";
import { cfg } from "../config.js";

const SECRET = cfg.jwt.secret;

export type UserResponse = Omit<User, "hashedPassword">;

type parameters = {
  email: string;
  password: string;
};

export async function handlerAddUser(req: Request, res: Response) {
  const params: parameters = req.body;
  if (!params.email || !params.password) {
    throw new BadRequestError("missing required fields for user");
  }

  const hashed = await hashPassword(params.password);

  const user = await createUser({
    email: params.email,
    hashedPassword: hashed,
  } satisfies NewUser);

  if (!user) {
    throw new InternalServerError("unable to create user");
  }

  respondWithJSON(res, 201, {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
  } satisfies UserResponse);
}

export async function handlerUpdateUser(req: Request, res: Response) {
  const params: parameters = req.body;
  if (!params.email || !params.password) {
    throw new BadRequestError("missing required fields for user");
  }

  const token = getBearerToken(req);
  const validJWT = await validateJWT(token, SECRET);
  if (!validJWT?.sub) {
    throw new UnauthorizedError("invalid token");
  }
  const hashed = await hashPassword(params.password);

  const user = await updateUser(validJWT.sub, hashed, params.email);

  respondWithJSON(res, 200, {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
  } satisfies UserResponse);
}
