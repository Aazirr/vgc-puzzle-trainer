# VGC Puzzle Trainer - Shared Phase Checklists

This document is the coordination contract between the backend assistant and the frontend assistant. Keep ownership boundaries clear so both sides can move quickly without overwriting each other.

## Assistant Coordination Rules

### Backend Assistant Instructions

- Own `apps/api`, `apps/pipeline`, `packages/domain`, `packages/explanations`, `packages/showdown-adapter`, database migrations, backend deployment docs, and backend checklist updates.
- Do not edit frontend UI files in `apps/web` unless explicitly asked.
- When changing response shapes, update the API contract notes in this file and `apps/api/README.md`.
- Keep frontend compatibility with the current web contract unless a coordinated change is recorded below.
- Verify backend work with `npm --workspace apps/api run build` and any affected package builds.
- If migrations change, note whether Neon has been migrated manually or still needs `npm --workspace apps/api run db:migrate`.

### Frontend Assistant Instructions

- Own `apps/web` UI, routing, client-side state, visual polish, and Vercel deployment.
- Do not edit backend files in `apps/api`, migrations, or backend shared packages unless explicitly asked.
- Use the backend contracts documented here. If the UI needs a different payload, add a request under "Frontend Requests For Backend" instead of changing backend code directly.
- Set `NEXT_PUBLIC_AUTH_API_BASE` to the Railway API origin for backend auth.
- Persist `guestToken` returned by answer submissions and send it on future answer submissions.
- Do not assume initial puzzle fetch includes explanations, `correctAction`, or correctness labels.

### Shared Handoff Protocol

- Use `backend` for backend work and the frontend branch chosen by the frontend owner for UI work.
- Before merging, each assistant should pull from `main` and resolve only files in their ownership area unless coordinated.
- Any cross-boundary change must include a short note in "Integration Contracts".
- If a phase item depends on the other side, mark it as `Blocked by Backend` or `Blocked by Frontend`.

## Current Deployment State

- Frontend hosting: Vercel
- Backend hosting: Railway `api` service
- Database: Neon PostgreSQL
- Railway API env: `DATABASE_URL` is configured
- API CORS env: `CORS_ORIGIN` should match the Vercel frontend origin
- Frontend auth env: `NEXT_PUBLIC_AUTH_API_BASE` should match the Railway API origin
- Neon migrations: manually run through `0003_seed_phase1_puzzles.sql`
- Pending migration: `0004_attempt_history_indexes.sql` must be run after the next backend deploy

## Integration Contracts

### Auth Contract

Frontend calls:

- `POST /auth/register`
- `POST /auth/login`

Request shape:

```json
{
  "email": "trainer@example.com",
  "password": "change-me-123",
  "displayName": "TrainerName"
}
```

Success shape:

```json
{
  "user": {
    "id": "uuid",
    "email": "trainer@example.com",
    "displayName": "TrainerName"
  }
}
```

Comment: This is a temporary password-auth bridge to unblock login/register. Durable server sessions, OAuth, and guest account upgrade remain Phase 3 work.

### Puzzle Fetch Contract

Frontend calls:

- `GET /api/puzzles`
- `GET /api/puzzles/random`
- `GET /api/puzzles/:id`

Initial puzzle payload intentionally includes:

- puzzle metadata
- `gameState`
- `playerSide`
- shuffled `actions`

Initial puzzle payload intentionally excludes:

- `correctAction`
- correctness labels
- explanation text

Comment: The frontend must render answer choices from `actions[].action` and should not depend on answer order.

### Answer Submit Contract

Frontend submits:

- `POST /api/puzzles/:id/answer`

Request shape:

```json
{
  "selectedAction": {
    "type": "move",
    "move": "Electro Shot",
    "target": "p2a"
  },
  "guestToken": "optional-existing-token",
  "userId": "optional-auth-user-id",
  "timeTaken": 12000
}
```

Success shape:

```json
{
  "correct": true,
  "explanation": {
    "templateType": "speed_check",
    "fields": {},
    "mechanicalText": "Rendered explanation text"
  },
  "correctAction": {
    "type": "move",
    "move": "Electro Shot",
    "target": "p2a"
  },
  "guestToken": "persist-this-token"
}
```

Comment: If `guestToken` is missing, the backend generates one. Frontend should persist and reuse it for guest continuity.

### Progress Contract

Frontend can call:

- `GET /api/attempts?guestToken=...`
- `GET /api/attempts?userId=...`
- `GET /api/users/:id/progress`

Comment: These endpoints are backend-ready for future dashboard wiring, but durable auth/session identity is not complete yet.

## Frontend Requests For Backend

- None currently.

## Backend Requests For Frontend

- Persist `guestToken` after answer submission.
- Send `guestToken` with future guest answer submissions.
- Send `userId` from auth response with authenticated answer submissions when available.
- Point `NEXT_PUBLIC_AUTH_API_BASE` at the Railway API origin.
- Confirm whether the frontend will call Railway API directly for puzzles or continue using Next.js mock/proxy routes.

## Phase 0 - Foundations

Comment: Foundation is functionally complete for backend development. Remaining items are operational hardening, not blockers for Phase 1.

### Backend Checklist

- [x] Create app/package folder structure
- [x] Add DB migrations for core tables
- [x] Implement replay log tokenizer
- [x] Implement Showdown-based state rebuild
- [x] Implement snapshot extractor
- [x] Add fixture-based deterministic tests
- [x] Add `.env.example` with required environment variable keys
- [x] Configure TypeScript across workspaces
- [x] Add Showdown engine as git submodule
- [x] Define and freeze shared TypeScript interfaces in contracts package
- [x] Configure Neon PostgreSQL as managed database target
- [x] Confirm Railway API service has `DATABASE_URL`
- [x] Fresh PostgreSQL migration smoke test passes
- [ ] Add down/rollback migration strategy if required before production
- [ ] Verify replay fixture determinism against live parser inputs

### Frontend Checklist

- [x] Project scaffold exists under `apps/web`
- [x] Frontend hosted separately on Vercel
- [x] Login/register UI exists
- [ ] Configure production `NEXT_PUBLIC_AUTH_API_BASE`

## Phase 1 - MVP Puzzle Loop

Comment: Backend can now serve seeded approved puzzles and evaluate answers. Frontend integration should focus on replacing mock/proxy puzzle behavior with the backend contract without exposing answer data early.

### Backend Checklist

- [x] Implement GET puzzle endpoint without pre-answer leakage
- [x] Implement POST answer endpoint with correctness evaluation
- [x] Seed 10 approved hand-curated puzzles
- [x] Record attempts for guest and account flows
- [x] Implement templated explanation renderer for `speed_check` and `ko_threshold`
- [x] Implement templated explanation renderer for `field_interaction`
- [x] Shuffle answer choices server-side before sending to client
- [x] Add difficulty and tag filtering to puzzle list endpoint
- [x] Add random approved puzzle endpoint
- [x] Add attempt history endpoint
- [x] Add user progress endpoint
- [ ] Run `0004_attempt_history_indexes.sql` on Neon after deploy
- [ ] Add automated API route tests for no-answer-leak and answer submit behavior
- [ ] Validate all seeded KO puzzles against all 16 damage rolls

### Frontend Checklist

- [x] Build puzzle page UI
- [x] Build explanation reveal UI
- [ ] Wire puzzle fetch to backend or confirm Next.js proxy strategy
- [ ] Persist returned `guestToken`
- [ ] Submit selected backend `action` object to answer endpoint
- [ ] Render `explanation.mechanicalText` after submit
- [ ] Ensure initial UI does not require `correctAction`
- [ ] Add loading/error states for Railway API failures

### Validation Checklist

- [x] No `correctAction` field or correctness label in initial backend payload
- [x] Correctness and explanation are returned only after answer submit
- [x] Backend guest flow supports token tracking
- [x] Backend authenticated attempt history persists when `userId` is supplied
- [x] Answer choices arrive shuffled and without a correct label
- [x] Explanation template renders for `speed_check` and `ko_threshold`
- [ ] Frontend confirms guest token persistence end-to-end
- [ ] Frontend confirms authenticated answer submit sends `userId`
- [ ] Seeded KO puzzles are mechanically verified with all 16 rolls

## Phase 2 - Simulation Supply

Comment: This phase belongs mostly to backend/pipeline. Frontend should not block on it, but may later need status/admin views if requested.

### Backend Checklist

- [ ] Build scheduled simulation runner
- [ ] Connect candidate detector to pipeline
- [ ] Connect curation filter and rejection reasons
- [ ] Add duplicate detection hash
- [ ] Write pending candidates to DB queue
- [ ] Implement hard KO threshold roll check using all 16 damage rolls
- [ ] Implement speed check detector with field-condition-aware effective speed calculation
- [ ] Add team pool input from JSON files of VGC teams
- [ ] Add curation trivial-puzzle filter to reject too-easy candidates by margin threshold

### Frontend Checklist

- [ ] No frontend work required until candidate review/admin UI is planned

### Validation Checklist

- [ ] Nightly schedule executes successfully
- [ ] Candidate counts and acceptance ratio are logged
- [ ] Pending queue receives simulation output
- [ ] Partial range KO candidates are rejected and logged with reason
- [ ] Speed check detector applies Tailwind, Trick Room, paralysis, and stat boosts
- [ ] No sim-generated puzzle enters DB without difficulty and at least one tag

## Phase 3 - Accounts And Progression

Comment: Backend has a temporary auth bridge and progress data endpoints. The production auth model still needs a deliberate decision before building durable sessions or guest upgrade.

### Backend Checklist

- [x] Minimal email/password auth endpoints for login/register compatibility
- [x] Implement streak update logic
- [x] Implement user dashboard data endpoint
- [ ] Decide production auth provider/session strategy
- [ ] Configure Auth.js or selected auth provider
- [ ] Implement durable server-side sessions or token verification
- [ ] Implement guest-to-account upgrade path
- [ ] Add authenticated attempt ownership based on session, not caller-supplied `userId`

### Frontend Checklist

- [x] Login page exists
- [x] Register page exists
- [ ] Connect deployed frontend to backend auth via `NEXT_PUBLIC_AUTH_API_BASE`
- [ ] Store backend auth user id for authenticated answer submissions
- [ ] Build or wire dashboard UI to `/api/users/:id/progress`
- [ ] Implement account upgrade UX after backend contract is finalized

### Validation Checklist

- [ ] Login/register works against Railway API
- [ ] Account upgrade from guest keeps progression continuity
- [x] Backend streak increments/resets correctly when `userId` is supplied
- [ ] Frontend dashboard displays backend streak/history
- [ ] Filters work correctly under Trick Room

## Phase 4 - Community And Moderation

Comment: Not started. Backend should define moderation contracts before frontend builds views.

### Backend Checklist

- [ ] Implement puzzle submission endpoint with deterministic-only checks
- [ ] Implement moderation queue API
- [ ] Implement moderator actions and audit metadata
- [ ] Implement vote endpoint and auto-approval logic
- [ ] Implement flag flow that returns puzzle to review
- [ ] Add `rejection_reason` field populated on all rejected submissions
- [ ] Notify submitter when puzzle is rejected, approved, or flagged
- [ ] Add moderator seed group setup with initial moderator roles in DB

### Frontend Checklist

- [ ] Build moderation queue view after backend API contract exists
- [ ] Build submission UX after deterministic validation contract exists
- [ ] Build vote/flag UX after backend endpoint exists

### Validation Checklist

- [ ] Read-dependent and partial-range submissions are blocked
- [ ] Moderation actions update status consistently
- [ ] Auto-approval threshold and ratio logic tested
- [ ] Submitter receives rejection reason on blocked puzzles
- [ ] Flagged approved puzzle returns to pending, not rejected
- [ ] A single user cannot vote on the same puzzle twice

## Phase 5 - AI Explanation Enrichment

Comment: Not started. Keep AI text optional and separate from mechanical explanations.

### Backend Checklist

- [ ] Implement enrichment worker for approved puzzles
- [ ] Store `ai_text` alongside mechanical explanation
- [ ] Add feature flag and rollback toggle
- [ ] Add human review step before AI-enriched text goes live
- [ ] Log all Anthropic API calls with puzzle ID for auditing

### Frontend Checklist

- [ ] Add frontend rendering logic for optional `ai_text`
- [ ] Hide `ai_text` immediately when feature flag is off
- [ ] Add community flag UX for incorrect AI explanations

### Validation Checklist

- [ ] AI text appears only for approved puzzles
- [ ] Failed calls are retried and logged
- [ ] Turning off feature flag immediately hides `ai_text`
- [ ] AI text is blocked from publishing if enrichment fails or returns empty
- [ ] Incorrect AI explanation flagged by community triggers re-review

## Cross-Phase Release Checklist

### Backend

- [ ] Required backend tests pass
- [ ] API contract changes communicated in this file
- [ ] Monitoring and alerts configured for API and pipeline services
- [x] `DATABASE_URL` points to Neon PostgreSQL, not app container
- [ ] Migrations run on deploy without destructive sync behavior
- [ ] No official Pokemon sprites or artwork are stored by backend services

### Frontend

- [ ] Required frontend tests/build pass
- [ ] Non-affiliation legal disclaimer appears in site footer on every page
- [ ] No official Pokemon sprites or artwork are used anywhere in the UI
- [ ] Domain name does not include the word Pokemon
- [ ] Vercel production env points to Railway API where required

### Shared

- [ ] Documentation updated in companion docs
- [ ] Manual critical path QA completed after every backend/frontend integration
- [ ] Any cross-boundary contract changes are recorded under "Integration Contracts"
