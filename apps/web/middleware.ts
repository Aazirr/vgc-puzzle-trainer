import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware for security headers and request validation
 * Runs on all requests
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.get("vgc_session")?.value === "1";
  const protectedPaths = ["/", "/account"];
  const authPaths = ["/login", "/register"];
  const isProtected = protectedPaths.includes(pathname) || pathname.startsWith("/puzzles");

  if (isProtected && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (authPaths.includes(pathname) && hasSession) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  const response = NextResponse.next();
  const authApiBase = (
    process.env.NEXT_PUBLIC_AUTH_API_BASE ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  ).trim().replace(/\/+$/, "");
  let authApiOrigin = "";
  if (authApiBase) {
    try {
      authApiOrigin = new URL(authApiBase).origin;
    } catch {
      authApiOrigin = "";
    }
  }

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
    "media-src 'self' https://raw.githubusercontent.com https://pokeapi.co; " +
    `connect-src 'self' https://pokeapi.co https://raw.githubusercontent.com vercel.live ${authApiOrigin}; ` +
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
