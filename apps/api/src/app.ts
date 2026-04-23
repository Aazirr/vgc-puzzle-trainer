import express from "express";
import { registerHealthRoutes } from "./routes/health.js";
import { registerPuzzleRoutes } from "./routes/puzzles.js";
import { registerReadyRoutes } from "./routes/ready.js";

export function createApiApp() {
  const app = express();

  app.use(express.json());
  app.get("/", (_req, res) => {
    res.json({ service: "api", status: "running" });
  });

  registerHealthRoutes(app);
  registerReadyRoutes(app);
  registerPuzzleRoutes(app);

  return app;
}
