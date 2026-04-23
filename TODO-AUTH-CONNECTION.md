# Auth Connection Progress

## Steps Completed:
- [x] Created `apps/web/.env.local` with `NEXT_PUBLIC_AUTH_API_BASE=http://localhost:3001`
- [ ] Run backend: `npm --workspace=apps/api run dev` (API on :3001)
- [ ] Run frontend: `npm --workspace=apps/web run dev` (Web on :3000)
- [ ] Test register/login - should now connect to backend/DB without "UNCONFIGURED"

## Next:
1. Open 2 terminals.
2. Backend terminal: `npm --workspace=apps/api run dev`
3. Frontend terminal: `npm --workspace=apps/web run dev`
4. Visit http://localhost:3000 - "AUTH: BACKEND" badge + working login/register.

Note: Assumes backend DATABASE_URL configured by friend.
