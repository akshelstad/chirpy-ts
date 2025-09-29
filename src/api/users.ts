import { Request, Response } from "express";

import { respondWithJSON } from "./json.js";
import { createUser } from "../lib/db/queries/users.js";
import { NewUser, User } from "../lib/db/schema.js";
import { BadRequestError, InternalServerError } from "./errors.js";
import { hashPassword } from "src/lib/auth/auth.js";

type userSafe = Omit<User, "hashedPassword">;

export async function handlerAddUser(req: Request, res: Response) {
  type parameters = {
    email: string;
    password: string;
  };

  const params: parameters = req.body;

  if (!params.email || !params.password) {
    throw new BadRequestError("missing required fields for user");
  }

  const hashedPassword = await hashPassword(params.password);

  const user: userSafe = await createUser({
    email: params.email,
    hashedPassword,
  });

  if (!user) {
    throw new InternalServerError("unable to create user");
  }

  respondWithJSON(res, 201, {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}
