import { Request, Response } from "express";

import { upgradeUser } from "../lib/db/queries/users.js";
import { NotFoundError, UnauthorizedError } from "./errors.js";
import { cfg } from "../config.js";
import { getAPIKey } from "../auth.js";

const POLKA_KEY = cfg.api.polkaKey;

export async function handlerWebhooks(req: Request, res: Response) {
  type upgradeParams = {
    event: string;
    data: {
      userId: string;
    };
  };

  const key = getAPIKey(req);
  if (key !== POLKA_KEY) {
    throw new UnauthorizedError("invalid polka API key");
  }

  const params: upgradeParams = req.body;
  const userId = params.data.userId;

  if (params.event !== "user.upgraded") {
    res.status(204).send();
    return;
  }

  const user = await upgradeUser(userId);
  if (!user) {
    throw new NotFoundError(`unable to upgrade user with userId: ${userId}`);
  }

  res.status(204).send();
}
