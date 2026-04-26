import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Resolve the backend API base URL from environment variables.
 * Returns empty string if not configured (caller should handle gracefully).
 */
export function getBackendBase(): string {
  const apiBase = (
    process.env.AUTH_API_BASE ??
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_AUTH_API_BASE ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  return apiBase;
}

/**
 * Headers to forward from the incoming request to the backend.
 */
const REQUEST_HEADERS_TO_FORWARD = [
  "content-type",
  "authorization",
  "x-request-id",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-forwarded-host",
];

/**
 * Headers to forward from the backend response to the client.
 */
const RESPONSE_HEADERS_TO_FORWARD = [
  "set-cookie",
  "www-authenticate",
  "x-request-id",
];

/**
 * Proxy an incoming request to the backend auth API.
 *
 * @param request - The incoming Next.js request
 * @param path - The backend path segment (e.g. "login" or "register")
 * @returns NextResponse with the backend's response
 */
export async function proxyToBackend(
  request: NextRequest,
  path: "login" | "register"
): Promise<NextResponse> {
  const backendBase = getBackendBase();

  if (!backendBase) {
    return NextResponse.json(
      {
        error: "proxy_unconfigured",
        message:
          "Auth backend is not configured. Set AUTH_API_BASE or API_URL environment variable.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    // Build headers to forward
    const headers = new Headers();
    for (const key of REQUEST_HEADERS_TO_FORWARD) {
      const value = request.headers.get(key);
      if (value) {
        headers.set(key, value);
      }
    }
    // Forward cookies
    const cookie = request.headers.get("cookie");
    if (cookie) {
      headers.set("cookie", cookie);
    }

    const response = await fetch(`${backendBase}/auth/${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    const nextResponse = NextResponse.json(data ?? { error: "unknown" }, {
      status: response.status,
    });

    // Forward selected response headers
    for (const key of RESPONSE_HEADERS_TO_FORWARD) {
      const value = response.headers.get(key);
      if (value) {
        nextResponse.headers.set(key, value);
      }
    }

    return nextResponse;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backend unreachable";
    return NextResponse.json(
      {
        error: "proxy_error",
        message: `Auth backend unreachable at ${backendBase}. ${message}`,
      },
      { status: 503 }
    );
  }
}

/**
 * Return a proper empty 204 response for OPTIONS preflight.
 */
export function optionsResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

