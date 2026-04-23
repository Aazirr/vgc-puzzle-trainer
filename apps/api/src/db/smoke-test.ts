import { createDatabaseClient } from "./client.js";
import { applyMigrations } from "./migrate.js";
import { loadApiEnv } from "../config/env.js";

const REQUIRED_TABLES = ["users", "puzzles", "puzzle_votes", "puzzle_attempts", "user_streaks"];

async function resetPublicSchema(client: ReturnType<typeof createDatabaseClient>) {
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");
}

async function getExistingTables(client: ReturnType<typeof createDatabaseClient>) {
  const result = await client.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'`
  );

  return new Set(result.rows.map((row) => row.table_name));
}

async function run() {
  const env = loadApiEnv();
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required to run the migration smoke test.");
  }

  const client = createDatabaseClient(env.databaseUrl);
  await client.connect();

  try {
    await resetPublicSchema(client);
    await applyMigrations(client);

    const tables = await getExistingTables(client);
    const missingTables = REQUIRED_TABLES.filter((tableName) => !tables.has(tableName));

    if (missingTables.length > 0) {
      throw new Error(`Missing expected tables after migration: ${missingTables.join(", ")}`);
    }

    console.log("Migration smoke test passed.");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("Migration smoke test failed:", error);
  process.exit(1);
});
