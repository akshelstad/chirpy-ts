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
  handlerDeleteChirp,
} from "./api/chirps.js";
import { handlerAddUser, handlerUpdateUser } from "./api/users.js";
import { handlerLogin, handlerRefresh, handlerRevoke } from "./api/auth.js";
import {
  middlewareErrors,
  middlewareLogResponses,
  middlewareMetricsInc,
} from "./api/middleware.js";
import { cfg } from "./config.js";
import { handlerWebhooks } from "./api/webhooks.js";

const migrationClient = postgres(cfg.db.url, { max: 1 });
await migrate(drizzle(migrationClient), cfg.db.migrationConfig);

const PORT = cfg.api.port;

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

app.post("/api/login", (req, res, next) => {
  Promise.resolve(handlerLogin(req, res).catch(next));
});

app.post("/api/users", (req, res, next) => {
  Promise.resolve(handlerAddUser(req, res).catch(next));
});
app.put("/api/users", (req, res, next) => {
  Promise.resolve(handlerUpdateUser(req, res).catch(next));
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
app.delete("/api/chirps/:chirpId", (req, res, next) => {
  Promise.resolve(handlerDeleteChirp(req, res).catch(next));
});

app.post("/api/refresh", (req, res, next) => {
  Promise.resolve(handlerRefresh(req, res).catch(next));
});
app.post("/api/revoke", (req, res, next) => {
  Promise.resolve(handlerRevoke(req, res).catch(next));
});

app.post("/api/polka/webhooks", (req, res, next) => {
  Promise.resolve(handlerWebhooks(req, res).catch(next));
});

app.use(middlewareErrors);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
