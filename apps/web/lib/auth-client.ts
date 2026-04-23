import { safeJsonParse, sanitizeInput, validateEmail } from "./security";

export interface AuthUser {
  email: string;
  displayName: string;
  loggedAt: number;
}

export type AuthProvider = "backend" | "local";

interface LocalAccount {
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: number;
}

export interface AuthInput {
  email: string;
  password: string;
  displayName?: string;
}

const SESSION_KEY = "vgc.frontend.session.v1";
const ACCOUNTS_KEY = "vgc.frontend.accounts.v1";
const SESSION_COOKIE = "vgc_session";
const AUTH_PROVIDER_KEY = "vgc.frontend.auth_provider.v1";
const AUTH_API_BASE = (process.env.NEXT_PUBLIC_AUTH_API_BASE ?? "").trim();

function getAuthApiBase(): string {
  if (AUTH_API_BASE) return AUTH_API_BASE;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3001";
    }
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

function readLocalAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  const parsed = safeJsonParse<LocalAccount[] | null>(raw, null);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item) =>
    item &&
    typeof item.email === "string" &&
    typeof item.displayName === "string" &&
    typeof item.passwordHash === "string" &&
    typeof item.createdAt === "number"
  );
}

function readStoredProvider(): AuthProvider | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(AUTH_PROVIDER_KEY);
  if (value === "backend" || value === "local") return value;
  return null;
}

function writeStoredProvider(provider: AuthProvider): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_PROVIDER_KEY, provider);
}

function writeLocalAccounts(accounts: LocalAccount[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function updateSessionCookie(isAuthenticated: boolean): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  if (isAuthenticated) {
    document.cookie = `${SESSION_COOKIE}=1; Path=/; SameSite=Strict${secure}`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; Max-Age=0; Path=/; SameSite=Strict${secure}`;
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
  const maybeUser = (obj.user && typeof obj.user === "object"
    ? obj.user
    : obj) as Record<string, unknown>;

  if (typeof maybeUser.email !== "string" || typeof maybeUser.displayName !== "string") {
    return null;
  }
  return toAuthUser(
    normalizeEmail(maybeUser.email),
    sanitizeInput(maybeUser.displayName).trim().slice(0, 32) || "trainer"
  );
}

async function tryApiAuth(
  path: "login" | "register",
  input: AuthInput
): Promise<AuthUser | null> {
  const apiBase = getAuthApiBase();
  if (!apiBase) return null;
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
    if (!response.ok) return null;
    const payload = await response.json();
    return extractApiUser(payload);
  } catch {
    return null;
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

export async function registerUser(input: AuthInput): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }> {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const displayName = normalizeDisplayName(input.displayName, email);

  if (!validateEmail(email)) return { ok: false, message: "Please provide a valid email." };
  if (!passwordStrongEnough(password)) return { ok: false, message: "Password must be 8-120 characters." };

  const apiUser = await tryApiAuth("register", { email, password, displayName });
  if (!apiUser) {
    return { ok: false, message: "Backend auth service is unavailable or registration failed." };
  }

  persistSession(apiUser);
  return { ok: true, user: apiUser };
}

export async function loginUser(input: AuthInput): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }> {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!validateEmail(email)) return { ok: false, message: "Please provide a valid email." };
  if (!passwordStrongEnough(password)) return { ok: false, message: "Password must be 8-120 characters." };

  const apiUser = await tryApiAuth("login", { email, password });
  if (!apiUser) {
    return { ok: false, message: "Backend auth service is unavailable or login failed." };
  }

  persistSession(apiUser);
  return { ok: true, user: apiUser };
}
