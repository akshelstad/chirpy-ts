import express from "express";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { handlerReadiness } from "./api/readiness.js";
import { handlerMetrics } from "./api/metrics.js";
import { handlerReset } from "./api/reset.js";
import {
  handlerAddChirp,
  handlerGetChirps,
  handlerGetChirp,
} from "./api/chirps.js";
import { handlerAddUser } from "./api/users.js";
import {
  middlewareErrors,
  middlewareLogResponses,
  middlewareMetricsInc,
} from "./api/middleware.js";
import { cfg } from "./config.js";

const migrationClient = postgres(cfg.db.url, { max: 1 });
await migrate(drizzle(migrationClient), cfg.db.migrationConfig);

const app = express();

app.use(middlewareLogResponses);
app.use(express.json());

app.use("/app", middlewareMetricsInc, express.static("./src/app"));

app.get("/api/healthz", (req, res, next) => {
  Promise.resolve(handlerReadiness(req, res)).catch(next);
});
app.get("/admin/metrics", (req, res, next) => {
  Promise.resolve(handlerMetrics(req, res)).catch(next);
});
app.post("/admin/reset", (req, res, next) => {
  Promise.resolve(handlerReset(req, res)).catch(next);
});

app.post("/api/chirps", (req, res, next) => {
  Promise.resolve(handlerAddChirp(req, res)).catch(next);
});
app.get("/api/chirps", (req, res, next) => {
  Promise.resolve(handlerGetChirps(req, res).catch(next));
});
app.get("/api/chirps/:chirpId", (req, res, next) => {
  Promise.resolve(handlerGetChirp(req, res).catch(next));
});

app.post("/api/users", (req, res, next) => {
  Promise.resolve(handlerAddUser(req, res).catch(next));
});

app.use(middlewareErrors);

app.listen(cfg.api.port, () => {
  console.log(`Server is running at http://localhost:${cfg.api.port}`);
});
