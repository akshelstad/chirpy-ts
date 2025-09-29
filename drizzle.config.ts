import { defineConfig } from "drizzle-kit";

import { cfg } from "./src/config.ts";

export default defineConfig({
  schema: "src/lib/db/schema.ts",
  out: "src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: cfg.db.url,
  },
});
