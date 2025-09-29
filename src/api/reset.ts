import { Request, Response } from "express";
import { ForbiddenError } from "./errors.js";
import { reset } from "../lib/db/queries/users.js";
import { cfg } from "../config.js";

export async function handlerReset(_: Request, res: Response) {
  if (cfg.api.platform !== "dev") {
    console.log(`Platform: ${cfg.api.platform}`);
    throw new ForbiddenError("reset is only allowed in dev environment.");
  }
  cfg.api.fileServerHits = 0;
  await reset();

  res.write("Hits reset to 0.");
  res.end();
}
