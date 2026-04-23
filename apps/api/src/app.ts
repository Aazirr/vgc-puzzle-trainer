import express from "express";
import { loadApiEnv } from "./config/env.js";
import { registerAttemptRoutes } from "./routes/attempts.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerPuzzleRoutes } from "./routes/puzzles.js";
import { registerReadyRoutes } from "./routes/ready.js";

export function createApiApp() {
  const app = express();
  const env = loadApiEnv();

  app.use((req, res, next) => {
    const corsOrigin = env.corsOrigin || (env.nodeEnv === "development" ? "*" : null);
    if (corsOrigin) {
      const allowOrigin = corsOrigin === "*" ? (req.headers.origin || "*") : corsOrigin;
      res.header("Access-Control-Allow-Origin", allowOrigin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    }

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  });
  app.use(express.json());
  app.get("/", (_req, res) => {
    res.json({ service: "api", status: "running" });
  });

  registerHealthRoutes(app);
  registerReadyRoutes(app);
  registerAuthRoutes(app);
  registerAttemptRoutes(app);
  registerPuzzleRoutes(app);

  return app;
}
