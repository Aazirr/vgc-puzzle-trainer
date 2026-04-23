import type { Express } from "express";
import { loadApiEnv } from "../config/env.js";
import { createDatabaseClient } from "../db/client.js";

interface AttemptRow {
  id: string;
  puzzle_id: string;
  user_id: string | null;
  guest_token: string | null;
  correct: boolean;
  time_taken: number | null;
  created_at: Date;
  question_type: string;
  difficulty: number;
  tags: string[];
}

interface StreakRow {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_attempt_at: Date | null;
}

function parseLimit(input: unknown) {
  const value = typeof input === "string" ? Number.parseInt(input, 10) : 20;
  if (!Number.isFinite(value)) return 20;
  return Math.min(Math.max(value, 1), 100);
}

function toAttemptPayload(row: AttemptRow) {
  return {
    id: row.id,
    puzzleId: row.puzzle_id,
    userId: row.user_id,
    guestToken: row.guest_token,
    correct: row.correct,
    timeTaken: row.time_taken,
    createdAt: row.created_at,
    puzzle: {
      questionType: row.question_type,
      difficulty: row.difficulty,
      tags: row.tags
    }
  };
}

export function registerAttemptRoutes(app: Express) {
  app.get("/api/attempts", async (req, res) => {
    const databaseUrl = loadApiEnv().databaseUrl;
    if (!databaseUrl) {
      res.status(503).json({ error: "database_unconfigured", message: "DATABASE_URL is not configured." });
      return;
    }

    const userId = typeof req.query.userId === "string" ? req.query.userId.trim() : "";
    const guestToken = typeof req.query.guestToken === "string" ? req.query.guestToken.trim() : "";
    if (!userId && !guestToken) {
      res.status(400).json({ error: "missing_identity", message: "userId or guestToken is required." });
      return;
    }

    const conditions: string[] = [];
    const values: unknown[] = [];
    if (userId) {
      values.push(userId);
      conditions.push(`a.user_id::text = $${values.length}`);
    }
    if (guestToken) {
      values.push(guestToken);
      conditions.push(`a.guest_token = $${values.length}`);
    }

    const limit = parseLimit(req.query.limit);
    values.push(limit);
    const client = createDatabaseClient(databaseUrl);

    try {
      await client.connect();
      const result = await client.query<AttemptRow>(
        `SELECT a.id, a.puzzle_id, a.user_id, a.guest_token, a.correct, a.time_taken, a.created_at,
                p.question_type, p.difficulty, p.tags
         FROM puzzle_attempts a
         JOIN puzzles p ON p.id = a.puzzle_id
         WHERE ${conditions.join(" OR ")}
         ORDER BY a.created_at DESC
         LIMIT $${values.length}`,
        values
      );
      res.json({ attempts: result.rows.map(toAttemptPayload) });
    } catch (error) {
      res.status(500).json({
        error: "attempt_history_failed",
        message: error instanceof Error ? error.message : "Failed to fetch attempt history."
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  });

  app.get("/api/users/:id/progress", async (req, res) => {
    const databaseUrl = loadApiEnv().databaseUrl;
    if (!databaseUrl) {
      res.status(503).json({ error: "database_unconfigured", message: "DATABASE_URL is not configured." });
      return;
    }

    const client = createDatabaseClient(databaseUrl);
    try {
      await client.connect();
      const streakResult = await client.query<StreakRow>(
        `SELECT user_id, current_streak, longest_streak, last_attempt_at
         FROM user_streaks
         WHERE user_id::text = $1`,
        [req.params.id]
      );
      const statsResult = await client.query<{ total_attempts: string; correct_attempts: string }>(
        `SELECT COUNT(*)::text AS total_attempts,
                COUNT(*) FILTER (WHERE correct)::text AS correct_attempts
         FROM puzzle_attempts
         WHERE user_id::text = $1`,
        [req.params.id]
      );

      const streak = streakResult.rows[0] ?? null;
      const stats = statsResult.rows[0] ?? { total_attempts: "0", correct_attempts: "0" };
      res.json({
        userId: req.params.id,
        streak: {
          current: streak?.current_streak ?? 0,
          longest: streak?.longest_streak ?? 0,
          lastAttemptAt: streak?.last_attempt_at ?? null
        },
        attempts: {
          total: Number.parseInt(stats.total_attempts, 10),
          correct: Number.parseInt(stats.correct_attempts, 10)
        }
      });
    } catch (error) {
      res.status(500).json({
        error: "progress_fetch_failed",
        message: error instanceof Error ? error.message : "Failed to fetch progress."
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  });
}
