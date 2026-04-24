import { safeJsonParse, sanitizeInput, validateEmail } from "./security";

export interface AuthUser {
  email: string;
  displayName: string;
  loggedAt: number;
}

export type AuthProvider = "backend" | "local";

export interface AuthInput {
  email: string;
  password: string;
  displayName?: string;
}

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string };

const SESSION_KEY = "vgc.frontend.session.v1";
const SESSION_COOKIE = "vgc_session";

const AUTH_API_BASE = (process.env.NEXT_PUBLIC_AUTH_API_BASE ?? "").trim();
const API_URL_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();

function normalizeApiBase(input: string): string {
  return input.trim().replace(/\/+$/, "");
}

export function getAuthApiBase(): string {
  if (AUTH_API_BASE) return normalizeApiBase(AUTH_API_BASE);
  if (API_URL_BASE) return normalizeApiBase(API_URL_BASE);

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local")
    ) {
      return "http://localhost:3001";
    }
    // On production (Vercel, custom domain), use same-origin proxy
    return window.location.origin;
  }

  return "";
}

function normalizeDisplayName(input: string | undefined, email: string): string {
  const base = sanitizeInput(input ?? "").trim();
  if (base.length >= 2) return base.slice(0, 32);
  const fallback = sanitizeInput(email.split("@")[0] ?? "trainer").trim();
  return fallback.slice(0, 32) || "trainer";
}

function normalizeEmail(input: string): string {
  return sanitizeInput(input).trim().toLowerCase();
}

function passwordStrongEnough(password: string): boolean {
  return password.length >= 8 && password.length <= 120;
}

async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function updateSessionCookie(isAuthenticated: boolean): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const sameSite = "; SameSite=Lax"; // Lax allows cookie on top-level navigations
  if (isAuthenticated) {
    document.cookie = `${SESSION_COOKIE}=1; Path=/; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
  }
}

function toAuthUser(email: string, displayName: string): AuthUser {
  return {
    email,
    displayName,
    loggedAt: Date.now(),
  };
}

function extractApiUser(payload: unknown): AuthUser | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const maybeUser = obj.user && typeof obj.user === "object"
    ? obj.user
    : obj;
  const userObj = maybeUser as Record<string, unknown>;

  if (typeof userObj.email !== "string" || typeof userObj.displayName !== "string") {
    return null;
  }
  return toAuthUser(
    normalizeEmail(userObj.email),
    sanitizeInput(userObj.displayName).trim().slice(0, 32) || "trainer"
  );
}

async function tryApiAuth(
  path: "login" | "register",
  input: AuthInput
): Promise<AuthResult> {
  const apiBase = getAuthApiBase();
  if (!apiBase) {
    return {
      ok: false,
      message: "Authentication API is not configured. Set NEXT_PUBLIC_AUTH_API_BASE or NEXT_PUBLIC_API_URL.",
    };
  }

  try {
    const response = await fetch(`${apiBase}/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        displayName: input.displayName,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : `Backend auth ${path} failed with status ${response.status}.`;
      return { ok: false, message };
    }

    const user = extractApiUser(payload);
    if (!user) {
      return { ok: false, message: "Backend auth response did not include a valid user." };
    }

    return { ok: true, user };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof TypeError
        ? `Could not reach backend auth API at ${apiBase}. Check Vercel env, Railway domain, CORS_ORIGINS, and CSP.`
        : error instanceof Error
          ? error.message
          : "Could not reach backend auth API.",
    };
  }
}

function persistSession(user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  updateSessionCookie(true);
}

export function getSessionUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const parsed = safeJsonParse<AuthUser | null>(raw, null);
  if (!parsed || typeof parsed.email !== "string" || typeof parsed.displayName !== "string") return null;
  return parsed;
}

export function clearSessionUser(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
  updateSessionCookie(false);
}

export function getAuthProviderStatus(): {
  provider: AuthProvider;
  backendConfigured: boolean;
  apiBase: string | null;
} {
  const apiBase = getAuthApiBase();
  const backendConfigured = apiBase.length > 0;
  return {
    provider: "backend",
    backendConfigured,
    apiBase: backendConfigured ? apiBase : null,
  };
}

export async function registerUser(input: AuthInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const displayName = normalizeDisplayName(input.displayName, email);

  if (!validateEmail(email)) return { ok: false, message: "Please provide a valid email." };
  if (!passwordStrongEnough(password)) return { ok: false, message: "Password must be 8-120 characters." };

  if (!getAuthApiBase()) {
    return {
      ok: false,
      message: "Authentication API is not configured. Set NEXT_PUBLIC_AUTH_API_BASE or NEXT_PUBLIC_API_URL.",
    };
  }

  const apiResult = await tryApiAuth("register", { email, password, displayName });
  if (!apiResult.ok) {
    return apiResult;
  }

  persistSession(apiResult.user);
  return { ok: true, user: apiResult.user };
}

export async function loginUser(input: AuthInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!validateEmail(email)) return { ok: false, message: "Please provide a valid email." };
  if (!passwordStrongEnough(password)) return { ok: false, message: "Password must be 8-120 characters." };

  if (!getAuthApiBase()) {
    return {
      ok: false,
      message: "Authentication API is not configured. Set NEXT_PUBLIC_AUTH_API_BASE or NEXT_PUBLIC_API_URL.",
    };
  }

  const apiResult = await tryApiAuth("login", { email, password });
  if (!apiResult.ok) {
    return apiResult;
  }

  persistSession(apiResult.user);
  return { ok: true, user: apiResult.user };
}

export async function logoutUser(): Promise<void> {
  clearSessionUser();
}

