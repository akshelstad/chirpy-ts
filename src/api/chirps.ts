import { Request, Response } from "express";

import { respondWithJSON } from "./json.js";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "./errors.js";
import {
  createChirp,
  deleteChirp,
  getChirpById,
  getChirps,
} from "../lib/db/queries/chirps.js";
import { getBearerToken, validateJWT } from "../auth.js";
import { cfg } from "../config.js";

const SECRET = cfg.jwt.secret;

export async function handlerAddChirp(req: Request, res: Response) {
  type parameters = {
    body: string;
  };
  const params: parameters = req.body;

  if (!params.body) {
    throw new BadRequestError("missing required fields for chirp");
  }

  const token = getBearerToken(req);
  const validJWT = await validateJWT(token, SECRET);
  if (!validJWT?.sub) {
    throw new UnauthorizedError("invalid token");
  }

  const cleanedBody = validateChirp(params.body);
  const chirp = await createChirp({
    body: cleanedBody,
    userId: validJWT.sub,
  });

  if (!chirp) {
    throw new InternalServerError("unable to create chirp");
  }

  respondWithJSON(res, 201, chirp);
}

export async function handlerGetChirps(req: Request, res: Response) {
  const chirps = await getChirps();

  let authorId = "";
  let authorIdQuery = req.query.authorId;
  if (typeof authorIdQuery === "string") {
    authorId = authorIdQuery;
  }

  let sort = "asc";
  let sortQuery = req.query.sort;
  if (typeof sortQuery === "string") {
    sort = sortQuery;
  }

  if (sort === "desc") {
    chirps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else {
    chirps.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const filteredChirps = chirps.filter(
    (chirp) => chirp.userId === authorId || authorId === ""
  );

  respondWithJSON(res, 200, filteredChirps);
}

export async function handlerGetChirp(req: Request, res: Response) {
  const { chirpId } = req.params;

  const chirp = await getChirpById(chirpId);
  if (!chirp) {
    throw new NotFoundError(`chirp with chirpId: ${chirpId} not found`);
  }

  respondWithJSON(res, 200, chirp);
}

export async function handlerDeleteChirp(req: Request, res: Response) {
  const { chirpId } = req.params;

  const token = getBearerToken(req);
  const validJWT = await validateJWT(token, SECRET);

  const chirp = await getChirpById(chirpId);
  if (!chirp) {
    throw new NotFoundError(`chirp with chirpId: ${chirpId} not found`);
  }

  if (!validJWT?.sub || validJWT.sub !== chirp.userId) {
    throw new ForbiddenError("invalid token");
  }

  const deleted = await deleteChirp(chirpId);
  if (!deleted) {
    throw new InternalServerError(
      `unable to delete chirp with chirpId: ${chirpId}`
    );
  }
  res.status(204).send();
}

function validateChirp(body: string) {
  const maxChirpLength = 140;
  if (body.length > maxChirpLength) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  }

  return removeBadWords(body);
}

function removeBadWords(input: string): string {
  const badWords = ["kerfuffle", "sharbert", "fornax"];
  const words = input.split(" ");
  words.forEach((word, i) => {
    if (badWords.includes(word.toLowerCase())) {
      words[i] = "****";
    }
  });
  return words.join(" ");
}
