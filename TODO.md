# Frontend Auth & Routing Fix — TODO

## Plan
Fix all frontend routing, auth, security, and design issues for production deployment.

## Steps

- [x] 1. Analyze codebase and identify all issues
- [x] 2. Fix `apps/web/lib/auth-client.ts` — `SameSite=Lax` cookie, remove localStorage fallback
- [x] 3. Create `apps/web/components/AuthProvider.tsx` — centralized auth context
- [x] 4. Fix `apps/web/middleware.ts` — public `/` and `/puzzles/*`, protected `/account`
- [x] 5. Fix `apps/web/app/layout.tsx` — wrap with AuthProvider
- [x] 6. Fix `apps/web/app/login/page.tsx` — use AuthProvider, clean copy, no flash
- [x] 7. Fix `apps/web/app/register/page.tsx` — use AuthProvider, clean copy, no flash
- [x] 8. Fix `apps/web/app/account/page.tsx` — use AuthProvider, clean loading state
- [x] 9. Fix `apps/web/app/page.tsx` — remove "prototype" copy, fix logout routing, use AuthProvider
- [x] 10. Fix `apps/web/next.config.mjs` — stronger security headers
- [x] 11. Run TypeScript check

## NEW: Fix Register Button & AUTH: BACKEND UNCONFIGURED

- [x] A. Fix `apps/web/lib/auth-client.ts` — fall back to same-origin on production
- [x] B. Create `apps/web/app/api/auth/register/route.ts` — proxy to backend
- [x] C. Create `apps/web/app/api/auth/login/route.ts` — proxy to backend
- [x] D. Fix `apps/web/next.config.mjs` — add `/auth/:path*` rewrite to proxy
- [x] E. Fix `apps/web/middleware.ts` — ensure CSP allows same-origin auth
- [x] F. Create `frontend` branch and commit changes
- [x] G. Push `frontend` branch to origin

