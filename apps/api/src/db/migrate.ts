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

export interface DatabaseClientLike {
  connect(): Promise<void>;
  end(): Promise<void>;
  query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
}

function resolveProjectRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export async function loadMigrationFiles(): Promise<MigrationFile[]> {
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

export async function ensureMigrationsTable(client: DatabaseClientLike) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export async function getAppliedMigrations(client: DatabaseClientLike) {
  const result = await client.query<{ name: string }>(
    "SELECT name FROM schema_migrations ORDER BY name ASC"
  );
  return new Set(result.rows.map((row) => row.name));
}

export async function applyMigrations(client: DatabaseClientLike, migrationFiles?: MigrationFile[]) {
  const files = migrationFiles ?? (await loadMigrationFiles());

  await ensureMigrationsTable(client);
  const appliedMigrations = await getAppliedMigrations(client);

  for (const migration of files) {
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
}

export async function migrateDatabase(databaseUrl: string) {
  const client = createDatabaseClient(databaseUrl);
  await client.connect();

  try {
    await applyMigrations(client);
  } finally {
    await client.end();
  }
}

async function run() {
  const env = loadApiEnv();
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  await migrateDatabase(env.databaseUrl);
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
