import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware for security headers and request validation
 * Runs on all requests
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  response.headers.set(
    "X-Content-Type-Options",
    "nosniff"
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // CSP Header
  const cspHeader =
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.vercel-insights.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://pokeapi.co https://raw.githubusercontent.com vercel.live; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';";

  response.headers.set("Content-Security-Policy", cspHeader);

  // Prevent cache for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
