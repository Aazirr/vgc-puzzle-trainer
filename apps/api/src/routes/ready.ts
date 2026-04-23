import type { Express } from "express";
import { createDatabaseClient } from "../db/client.js";
import { loadApiEnv } from "../config/env.js";

export function registerReadyRoutes(app: Express) {
  app.get("/ready", async (_req, res) => {
    const env = loadApiEnv();

    if (!env.databaseUrl) {
      res.status(503).json({
        service: "api",
        status: "not_ready",
        reason: "DATABASE_URL is not configured"
      });
      return;
    }

    const client = createDatabaseClient(env.databaseUrl);

    try {
      await client.connect();
      await client.query("SELECT 1");
      res.json({ service: "api", status: "ready" });
    } catch (error) {
      res.status(503).json({
        service: "api",
        status: "not_ready",
        reason: error instanceof Error ? error.message : "unknown error"
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  });
}
