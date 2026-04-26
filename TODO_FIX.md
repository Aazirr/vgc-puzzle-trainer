# Deployment Fix Plan

## Information Gathered
- Web build (Next.js 15.5.15) succeeds with all routes compiling
- API build (Express + TypeScript) succeeds
- Auth uses client-side sessionStorage + cookie, with API proxy routes to backend
- CSP and security headers are set in both `next.config.mjs` and `middleware.ts`

## Issues Found

### 1. CSP Syntax Error in `middleware.ts`
Missing space before `upgrade-insecure-requests` creates malformed CSP header.

### 2. Auth Proxy Routes Don't Forward Headers/Cookies
`/api/auth/login` and `/api/auth/register` proxy to backend but:
- Don't forward request cookies/headers to backend
- Don't forward backend `Set-Cookie` headers to client
- Have duplicated `getBackendBase()` code
- OPTIONS returns 204 with JSON body (HTTP violation)

### 3. `sanitizeInput` Can Crash Server-Side
`lib/security.ts` uses `document.createElement` without checking `typeof document !== "undefined"`.

### 4. Import Path Should Use Alias
`app/puzzles/[id]/page.tsx` uses `../../../components/...` instead of `@/components/...`.

### 5. Missing `sharp` Dependency
Next.js recommends `sharp` for image optimization in production.

### 6. Favicon Reference Without File
`layout.tsx` references `/favicon.ico` but no file exists in `public/`.

## Plan

### File-Level Changes

| File | Change |
|------|--------|
| `apps/web/middleware.ts` | Fix CSP string concatenation (add space) |
| `apps/web/lib/proxy.ts` | NEW: Shared auth proxy utility with `getBackendBase()`, `proxyToBackend()` |
| `apps/web/app/api/auth/login/route.ts` | Use shared proxy utility, forward headers/cookies |
| `apps/web/app/api/auth/register/route.ts` | Use shared proxy utility, forward headers/cookies |
| `apps/web/lib/security.ts` | Add `typeof document === "undefined"` guard in `sanitizeInput` |
| `apps/web/app/puzzles/[id]/page.tsx` | Change import to `@/components/vgc-puzzle-trainer-v2` |
| `apps/web/package.json` | Add `sharp` to dependencies |
| `apps/web/app/layout.tsx` | Remove manual favicon link (Next.js handles favicon conventionally) |

## Status
- [x] Fix CSP syntax in middleware.ts
- [x] Create shared auth proxy utility (lib/proxy.ts)
- [x] Update /api/auth/login to use shared proxy
- [x] Update /api/auth/register to use shared proxy
- [x] Fix sanitizeInput server-side crash
- [x] Fix puzzles/[id] import path
- [x] Add sharp dependency
- [x] Remove broken favicon link
- [x] Verify build succeeds

