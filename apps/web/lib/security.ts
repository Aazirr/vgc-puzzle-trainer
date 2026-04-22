/**
 * Security utilities for the frontend
 */

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate email format (basic client-side validation)
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Create Content Security Policy meta tag
 * Note: This should ideally be set on the server via headers
 */
export function getCSPMeta(): Record<string, string> {
  return {
    "default-src": "'self'",
    "script-src": "'self' 'unsafe-inline'", // Next.js requires unsafe-inline
    "style-src": "'self' 'unsafe-inline'",
    "img-src": "'self' data: https:",
    "font-src": "'self' data:",
    "connect-src": "'self' https://pokeapi.co https://raw.githubusercontent.com",
    "frame-ancestors": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
  };
}

/**
 * Validate and sanitize API response
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: Record<string, string>
): data is T {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  for (const [key, expectedType] of Object.entries(schema)) {
    if (!(key in obj)) {
      console.error(`Missing required field: ${key}`);
      return false;
    }

    if (typeof obj[key] !== expectedType) {
      console.error(
        `Invalid type for ${key}: expected ${expectedType}, got ${typeof obj[key]}`
      );
      return false;
    }
  }

  return true;
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    console.error("JSON parse error");
    return fallback;
  }
}

/**
 * Generate random CSRF token for forms
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Rate limit helper - track API calls
 */
export class RateLimiter {
  private calls: Map<string, number[]> = new Map();
  private readonly maxCalls: number;
  private readonly windowMs: number;

  constructor(maxCalls: number = 10, windowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const calls = this.calls.get(key) || [];

    // Remove old calls outside the window
    const recentCalls = calls.filter((time) => now - time < this.windowMs);

    if (recentCalls.length >= this.maxCalls) {
      return false;
    }

    recentCalls.push(now);
    this.calls.set(key, recentCalls);
    return true;
  }
}
