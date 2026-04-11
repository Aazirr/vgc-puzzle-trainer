import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabaseClient } from "./client.js";
import { loadApiEnv } from "../config/env.js";

interface MigrationFile {
  name: string;
  path: string;
  sql: string;
}

function resolveProjectRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

async function loadMigrationFiles(): Promise<MigrationFile[]> {
  const migrationsDir = path.join(resolveProjectRoot(), "db", "migrations");
  const entries = await fs.readdir(migrationsDir);
  const sqlFiles = entries.filter((entry) => entry.endsWith(".sql")).sort();

  const migrations: MigrationFile[] = [];
  for (const fileName of sqlFiles) {
    const filePath = path.join(migrationsDir, fileName);
    const sql = await fs.readFile(filePath, "utf8");
    migrations.push({ name: fileName, path: filePath, sql });
  }

  return migrations;
}

async function ensureMigrationsTable(client: ReturnType<typeof createDatabaseClient>) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client: ReturnType<typeof createDatabaseClient>) {
  const result = await client.query<{ name: string }>(
    "SELECT name FROM schema_migrations ORDER BY name ASC"
  );
  return new Set(result.rows.map((row) => row.name));
}

async function run() {
  const env = loadApiEnv();
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  const client = createDatabaseClient(env.databaseUrl);
  await client.connect();

  try {
    await ensureMigrationsTable(client);
    const appliedMigrations = await getAppliedMigrations(client);
    const migrations = await loadMigrationFiles();

    for (const migration of migrations) {
      if (appliedMigrations.has(migration.name)) {
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [migration.name]);
        await client.query("COMMIT");
        console.log(`Applied migration: ${migration.name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
