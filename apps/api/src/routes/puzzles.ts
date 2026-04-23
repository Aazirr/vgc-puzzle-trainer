import type { Express } from "express";

export function registerPuzzleRoutes(app: Express) {
  app.get("/api/puzzles", (_req, res) => {
    res.status(501).json({
      error: "not_implemented",
      message: "Puzzle listing will be added in the next backend slice."
    });
  });

  app.get("/api/puzzles/:id", (_req, res) => {
    res.status(501).json({
      error: "not_implemented",
      message: "Puzzle fetch will be added in the next backend slice."
    });
  });

  app.post("/api/puzzles/:id/answer", (_req, res) => {
    res.status(501).json({
      error: "not_implemented",
      message: "Answer submission will be added in the next backend slice."
    });
  });
}
