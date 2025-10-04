import * as argon2 from "argon2";
import { randomBytes } from "node:crypto";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken") as typeof import("jsonwebtoken");
import { JwtPayload } from "jsonwebtoken";

import type { Request } from "express";

import { BadRequestError, UnauthorizedError } from "./api/errors.js";
import { cfg } from "./config.js";

const ISSUER = cfg.jwt.issuer;

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string) {
  if (!password) return false;
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function makeJWT(
  userId: string,
  expiresIn: number,
  secret: string
) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + expiresIn;
  const token = jwt.sign(
    {
      iss: ISSUER,
      sub: userId,
      iat: issuedAt,
      exp: expiresAt,
    } satisfies payload,
    secret,
    { algorithm: "HS256" }
  );

  return token;
}

export async function validateJWT(tokenString: string, secret: string) {
  let decoded: payload;
  try {
    decoded = jwt.verify(tokenString, secret) as JwtPayload;
  } catch (err) {
    throw new UnauthorizedError("invalid token");
  }

  if (decoded.iss !== ISSUER) {
    throw new UnauthorizedError("invalid issuer");
  }

  if (!decoded.sub) {
    throw new UnauthorizedError("token missing user ID");
  }

  return decoded;
}

export type ReqLike = Pick<Request, "headers" | "get">;

export function getBearerToken(req: Request | ReqLike) {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throw new UnauthorizedError("malformed authorization header");
  }

  return extractBearerToken(authHeader);
}

function extractBearerToken(header: string) {
  const splitAuth = header.split(" ");
  if (splitAuth.length < 2 || splitAuth[0] !== "Bearer") {
    throw new BadRequestError("malformed authorization header");
  }
  if (!splitAuth[1]) {
    throw new BadRequestError("token not present in header");
  }

  return splitAuth[1];
}

export function getAPIKey(req: Request | ReqLike) {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throw new UnauthorizedError("malformed authorization header");
  }

  return extractAPIKey(authHeader);
}

function extractAPIKey(header: string) {
  const splitAuth = header.split(" ");
  if (splitAuth.length < 2 || splitAuth[0] !== "ApiKey") {
    throw new BadRequestError("malformed authorization header");
  }
  if (!splitAuth[1]) {
    throw new BadRequestError("key not present in header");
  }

  return splitAuth[1];
}

export async function makeRefreshToken() {
  return randomBytes(32).toString("hex");
}
