import { Request, Response } from "express";

import { respondWithJSON } from "./json.js";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "./errors.js";
import {
  createChirp,
  getChirpById,
  getChirps,
} from "../lib/db/queries/chirps.js";

export async function handlerAddChirp(req: Request, res: Response) {
  type parameters = {
    body: string;
    userId: string;
  };
  const params: parameters = req.body;

  if (!params.body || !params.userId) {
    throw new BadRequestError("missing required fields for chirp");
  }

  const cleanedBody = validateChirp(params.body);
  const chirp = await createChirp({
    body: cleanedBody,
    userId: params.userId,
  });

  if (!chirp) {
    throw new InternalServerError("unable to create chirp");
  }

  respondWithJSON(res, 201, chirp);
}

export async function handlerGetChirps(_: Request, res: Response) {
  const chirps = await getChirps();
  respondWithJSON(res, 200, chirps);
}

export async function handlerGetChirp(req: Request, res: Response) {
  const { chirpId } = req.params;

  const chirp = await getChirpById(chirpId);
  if (!chirp) {
    throw new NotFoundError(`chirp with chirpId: ${chirpId} not found`);
  }

  respondWithJSON(res, 200, chirp);
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
