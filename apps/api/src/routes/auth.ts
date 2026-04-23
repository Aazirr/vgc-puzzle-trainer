import crypto from "node:crypto";
import type { Express } from "express";
import { loadApiEnv } from "../config/env.js";
import { createDatabaseClient } from "../db/client.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCRYPT_KEY_LENGTH = 64;

interface AuthBody {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
}

interface DbUser {
  id: string;
  email: string;
  display_name: string;
  password_hash: string | null;
}

function normalizeEmail(input: unknown): string {
  return typeof input === "string" ? input.trim().toLowerCase() : "";
}

function normalizeDisplayName(input: unknown, email: string): string {
  const value = typeof input === "string" ? input.trim() : "";
  if (value.length >= 2) return value.slice(0, 32);
  return (email.split("@")[0] || "trainer").slice(0, 32);
}

function validateCredentials(email: string, password: unknown) {
  if (!EMAIL_PATTERN.test(email)) {
    return "Please provide a valid email.";
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 120) {
    return "Password must be 8-120 characters.";
  }
  return null;
}

function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(`scrypt:${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [scheme, salt, keyHex] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !keyHex) {
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      const storedKey = Buffer.from(keyHex, "hex");
      if (storedKey.length !== derivedKey.length) {
        resolve(false);
        return;
      }
      resolve(crypto.timingSafeEqual(storedKey, derivedKey));
    });
  });
}

function toAuthUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name
  };
}

export function registerAuthRoutes(app: Express) {
  app.post("/auth/register", async (req, res) => {
    const env = loadApiEnv();
    if (!env.databaseUrl) {
      res.status(503).json({ error: "database_unconfigured", message: "DATABASE_URL is not configured." });
      return;
    }

    const body = req.body as AuthBody;
    const email = normalizeEmail(body.email);
    const password = body.password;
    const credentialError = validateCredentials(email, password);
    if (credentialError || typeof password !== "string") {
      res.status(400).json({ error: "invalid_credentials", message: credentialError });
      return;
    }

    const displayName = normalizeDisplayName(body.displayName, email);
    const passwordHash = await hashPassword(password);
    const client = createDatabaseClient(env.databaseUrl);

    try {
      await client.connect();
      const result = await client.query<DbUser>(
        `INSERT INTO users (email, display_name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, display_name, password_hash`,
        [email, displayName, passwordHash]
      );
      const user = result.rows[0];
      if (!user) {
        res.status(500).json({ error: "registration_failed", message: "Registration failed." });
        return;
      }
      res.status(201).json({ user: toAuthUser(user) });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "23505") {
        res.status(409).json({ error: "email_exists", message: "This email is already registered." });
        return;
      }
      res.status(500).json({
        error: "registration_failed",
        message: error instanceof Error ? error.message : "Registration failed."
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  });

  app.post("/auth/login", async (req, res) => {
    const env = loadApiEnv();
    if (!env.databaseUrl) {
      res.status(503).json({ error: "database_unconfigured", message: "DATABASE_URL is not configured." });
      return;
    }

    const body = req.body as AuthBody;
    const email = normalizeEmail(body.email);
    const password = body.password;
    const credentialError = validateCredentials(email, password);
    if (credentialError || typeof password !== "string") {
      res.status(400).json({ error: "invalid_credentials", message: credentialError });
      return;
    }

    const client = createDatabaseClient(env.databaseUrl);
    try {
      await client.connect();
      const result = await client.query<DbUser>(
        `SELECT id, email, display_name, password_hash
         FROM users
         WHERE email = $1`,
        [email]
      );
      const user = result.rows[0];
      if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) {
        res.status(401).json({ error: "invalid_login", message: "Invalid email or password." });
        return;
      }

      res.json({ user: toAuthUser(user) });
    } catch (error) {
      res.status(500).json({
        error: "login_failed",
        message: error instanceof Error ? error.message : "Login failed."
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  });
}
