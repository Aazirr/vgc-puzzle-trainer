import type { Express } from "express";
import { loadApiEnv } from "../config/env.js";
import { createDatabaseClient } from "../db/client.js";

interface PuzzleAction {
  type: string;
  move?: string;
  target?: string;
  value?: string | number;
}

interface PuzzleRow {
  id: string;
  source: string;
  format: string;
  game_state: unknown;
  player_side: string;
  question_type: string;
  correct_action: PuzzleAction;
  wrong_actions: PuzzleAction[];
  explanation: unknown;
  difficulty: number;
  tags: string[];
  status: string;
}

interface PuzzleAnswerBody {
  selectedAction?: unknown;
  guestToken?: unknown;
  userId?: unknown;
  timeTaken?: unknown;
}

function getDatabaseUrl() {
  return loadApiEnv().databaseUrl;
}

function parseLimit(input: unknown) {
  const value = typeof input === "string" ? Number.parseInt(input, 10) : 20;
  if (!Number.isFinite(value)) return 20;
  return Math.min(Math.max(value, 1), 100);
}

function parseDifficulty(input: unknown) {
  if (typeof input !== "string") return null;
  const value = Number.parseInt(input, 10);
  return value >= 1 && value <= 5 ? value : null;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

function isSameAction(left: unknown, right: unknown) {
  return stableStringify(left) === stableStringify(right);
}

function unwrapSelectedAction(input: unknown): unknown {
  if (input && typeof input === "object" && "action" in input) {
    return (input as { action: unknown }).action;
  }
  return input;
}

function shuffleActions(actions: PuzzleAction[]) {
  const shuffled = actions.map((action) => ({ action }));
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    const target = shuffled[swapIndex];
    if (!current || !target) continue;
    shuffled[index] = target;
    shuffled[swapIndex] = current;
  }

  return shuffled.map((choice, index) => ({
    id: String.fromCharCode(97 + index),
    action: choice.action
  }));
}

function toPuzzlePayload(row: PuzzleRow) {
  return {
    id: row.id,
    source: row.source,
    format: row.format,
    gameState: row.game_state,
    playerSide: row.player_side,
    questionType: row.question_type,
    difficulty: row.difficulty,
    tags: row.tags,
    actions: shuffleActions([row.correct_action, ...(row.wrong_actions ?? [])])
  };
}

function toPuzzleSummary(row: Pick<PuzzleRow, "id" | "format" | "question_type" | "difficulty" | "tags">) {
  return {
    id: row.id,
    format: row.format,
    questionType: row.question_type,
    difficulty: row.difficulty,
    tags: row.tags
  };
}

export function registerPuzzleRoutes(app: Express) {
  app.get("/api/puzzles", async (req, res) => {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      res.status(503).json({ error: "database_unconfigured", message: "DATABASE_URL is not configured." });
      return;
    }

    const conditions = ["status = 'approved'"];
    const values: unknown[] = [];
    const difficulty = parseDifficulty(req.query.difficulty);
    const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : "";
    const limit = parseLimit(req.query.limit);

    if (difficulty) {
      values.push(difficulty);
      conditions.push(`difficulty = $${values.length}`);
    }

    if (tag) {
      values.push([tag]);
      conditions.push(`tags @> $${values.length}::text[]`);
    }

    values.push(limit);
    const client = createDatabaseClient(databaseUrl);

    try {
      await client.connect();
      const result = await client.query<Pick<PuzzleRow, "id" | "format" | "question_type" | "difficulty" | "tags">>(
        `SELECT id, format, question_type, difficulty, tags
         FROM puzzles
         WHERE ${conditions.join(" AND ")}
         ORDER BY approved_at DESC NULLS LAST, created_at DESC
         LIMIT $${values.length}`,
        values
      );
      res.json({ puzzles: result.rows.map(toPuzzleSummary) });
    } catch (error) {
      res.status(500).json({
        error: "puzzle_list_failed",
        message: error instanceof Error ? error.message : "Failed to list puzzles."
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  });

  app.get("/api/puzzles/random", async (_req, res) => {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      res.status(503).json({ error: "database_unconfigured", message: "DATABASE_URL is not configured." });
      return;
    }

    const client = createDatabaseClient(databaseUrl);
    try {
      await client.connect();
      const result = await client.query<PuzzleRow>(
        `SELECT id, source, format, game_state, player_side, question_type,
                correct_action, wrong_actions, explanation, difficulty, tags, status
         FROM puzzles
         WHERE status = 'approved'
         ORDER BY random()
         LIMIT 1`
      );
      const puzzle = result.rows[0];
      if (!puzzle) {
        res.status(404).json({ error: "puzzle_not_found", message: "No approved puzzles are available." });
        return;
      }
      res.json({ puzzle: toPuzzlePayload(puzzle) });
    } catch (error) {
      res.status(500).json({
        error: "random_puzzle_failed",
        message: error instanceof Error ? error.message : "Failed to fetch a random puzzle."
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  });

  app.get("/api/puzzles/:id", async (req, res) => {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      res.status(503).json({ error: "database_unconfigured", message: "DATABASE_URL is not configured." });
      return;
    }

    const client = createDatabaseClient(databaseUrl);
    try {
      await client.connect();
      const result = await client.query<PuzzleRow>(
        `SELECT id, source, format, game_state, player_side, question_type,
                correct_action, wrong_actions, explanation, difficulty, tags, status
         FROM puzzles
         WHERE id::text = $1 AND status = 'approved'`,
        [req.params.id]
      );
      const puzzle = result.rows[0];
      if (!puzzle) {
        res.status(404).json({ error: "puzzle_not_found", message: "Puzzle not found." });
        return;
      }
      res.json({ puzzle: toPuzzlePayload(puzzle) });
    } catch (error) {
      res.status(500).json({
        error: "puzzle_fetch_failed",
        message: error instanceof Error ? error.message : "Failed to fetch puzzle."
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  });

  app.post("/api/puzzles/:id/answer", async (req, res) => {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      res.status(503).json({ error: "database_unconfigured", message: "DATABASE_URL is not configured." });
      return;
    }

    const body = req.body as PuzzleAnswerBody;
    const selectedAction = unwrapSelectedAction(body.selectedAction);
    if (!selectedAction || typeof selectedAction !== "object") {
      res.status(400).json({ error: "invalid_answer", message: "selectedAction is required." });
      return;
    }

    const guestToken = typeof body.guestToken === "string" ? body.guestToken.trim() : null;
    const userId = typeof body.userId === "string" ? body.userId.trim() : null;
    const timeTaken = typeof body.timeTaken === "number" && Number.isFinite(body.timeTaken)
      ? Math.round(body.timeTaken)
      : null;
    const client = createDatabaseClient(databaseUrl);

    try {
      await client.connect();
      const result = await client.query<Pick<PuzzleRow, "id" | "correct_action" | "explanation">>(
        `SELECT id, correct_action, explanation
         FROM puzzles
         WHERE id::text = $1 AND status = 'approved'`,
        [req.params.id]
      );
      const puzzle = result.rows[0];
      if (!puzzle) {
        res.status(404).json({ error: "puzzle_not_found", message: "Puzzle not found." });
        return;
      }

      const correct = isSameAction(selectedAction, puzzle.correct_action);
      await client.query(
        `INSERT INTO puzzle_attempts (puzzle_id, user_id, guest_token, correct, time_taken)
         VALUES ($1, $2, $3, $4, $5)`,
        [puzzle.id, userId || null, guestToken || null, correct, timeTaken]
      );

      res.json({
        correct,
        explanation: puzzle.explanation,
        correctAction: puzzle.correct_action
      });
    } catch (error) {
      res.status(500).json({
        error: "answer_submit_failed",
        message: error instanceof Error ? error.message : "Failed to submit answer."
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  });
}
