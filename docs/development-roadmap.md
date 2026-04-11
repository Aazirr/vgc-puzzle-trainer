# VGC Puzzle Trainer - Development Roadmap

This document defines how to execute development in a controlled way without changing product scope. It complements:

- docs/vgc-puzzle-trainer-scope.md
- docs/vgc-puzzle-trainer-technical-design.md

## 1. Working Model

Run the project in five workstreams, each with one owner:

- Product and Puzzle Design
- Engine and Data Pipeline
- API and Backend
- Frontend Experience
- Quality and Operations

Use weekly planning and short delivery slices where each slice includes contract, implementation, UI integration, validation, and documentation.

## 2. Phase Plan

### Phase 0 - Foundations

Goal: lock data contracts and deterministic state reconstruction.

Deliverables:

- Repo structure for web, api, pipeline, shared packages
- Initial database migrations
- Replay tokenizer and state rebuild path
- Snapshot extractor with fixture tests
- .env.example with all required environment variable keys
- TypeScript configuration across workspaces
- Showdown engine added as git submodule
- Shared TypeScript interfaces frozen in contracts package

Exit criteria:

- Replay fixtures are deterministic
- Migrations run cleanly on fresh DB
- Core contracts documented and agreed
- Showdown submodule imports cleanly in pipeline and parser workspaces
- TypeScript compiles with zero errors across all workspaces

### Phase 1 - MVP Puzzle Loop

Goal: playable puzzle experience with verified reveal flow.

Deliverables:

- Puzzle fetch endpoint without answer leakage
- Answer submission endpoint with correctness result
- Puzzle page with answer options and explanation reveal
- Seed bank of 10-20 hand-curated approved puzzles
- Templated explanation renderer for speed_check and ko_threshold types
- Server-side answer choice shuffling before client delivery
- Difficulty tag filtering in puzzle list endpoint

Exit criteria:

- End-to-end play works for guest and signed-in user
- Correct answer is never returned before submit
- Attempt data is recorded correctly
- Seeded KO puzzles are strictly guaranteed KO or guaranteed non-KO only
- Answer choices are shuffled and unlabeled in payloads
- Templates render correctly for speed_check and ko_threshold puzzles

### Phase 2 - Simulation Supply

Goal: build sustainable puzzle inflow.

Deliverables:

- Scheduled simulation job
- Candidate detector and curation filter
- Duplicate detection and rejection reason capture
- Hard KO threshold roll check across all 16 damage rolls
- Speed check detector with all field conditions applied
- JSON team pool input for VGC teams
- Trivial-puzzle curation filter using margin threshold

Exit criteria:

- Scheduled runs produce candidate output and logs
- Queue receives pending puzzles from sim pipeline
- Publishable ratio is tracked
- Partial range KO candidates are rejected and logged
- Speed check detector accounts for Tailwind, Trick Room, paralysis, and stat boosts
- No sim-generated puzzle is stored without difficulty and tags

### Phase 3 - Accounts and Progression

Goal: retention and progression features.

Deliverables:

- Auth providers and guest upgrade path
- Streak tracking and attempt history
- Browse filters for question type, tags, and difficulty
- Design tokens stylesheet locked before frontend implementation expands

Exit criteria:

- Returning users keep progression data
- Filters perform within agreed latency targets
- Filters work correctly under Trick Room edge cases

### Phase 4 - Community and Moderation

Goal: scalable contribution workflow.

Deliverables:

- Community submission endpoint with deterministic validation
- Moderator queue and actions (approve/reject/flag)
- Voting and auto-approval checks
- Rejection reason stored for all rejected submissions
- Submitter notifications for rejected, approved, or flagged content
- Seed moderator group and initial DB role assignments

Exit criteria:

- Invalid submissions are rejected with clear reason
- Moderators can process queue without direct DB edits
- Re-flagging flow returns puzzles to review state
- Rejected submissions always persist a reason
- Flagged approved puzzles move back to pending, not rejected
- Duplicate voting by the same user is prevented

### Phase 5 - AI Explanation Enrichment

Goal: add optional learning context on approved puzzles.

Deliverables:

- Post-approval enrichment worker
- ai_text storage and rendering
- Feature flag and rollback switch
- Human review gate before AI-enriched text goes live
- Auditable logging for Anthropic API calls with puzzle IDs

Exit criteria:

- AI text only appears on approved puzzles
- Failed enrichment retries without blocking puzzle access
- Empty or failed AI responses are not published
- Community-flagged AI explanations re-enter review

## 3. Cross-Phase Guardrails

These rules apply before shipping any public-facing release:

- Non-affiliation legal disclaimer appears in the site footer on every page
- No official Pokemon sprites or artwork are used in the UI
- DATABASE_URL points to a separate Railway PostgreSQL service, not the app container
- Prisma migrations run on deploy without force: true or synchronize: true
- The domain name does not include the word Pokemon

## 4. Weekly Cadence

- Monday: pick one milestone target and 3-5 deliverables
- Midweek: blocker and risk checkpoint
- Friday: demo, decision log update, carryover planning

## 5. Delivery Rules

- Prefer vertical slices over horizontal batching
- One PR should target one meaningful slice
- Every PR includes scope, risk, test evidence, and doc impact
- Do not close a phase until exit criteria are explicitly checked

## 6. Risk Triggers

Take action if any trigger is hit:

- Publishable ratio under 10 percent for 2+ sim runs
- Moderation queue age exceeds 7 days
- Regulation shift occurs and puzzle bank is not refresh-tagged within 72 hours
- Any verified explanation error on approved puzzle

## 7. Done Definition (Per Milestone)

A milestone is done only if all are true:

- Acceptance criteria signed off
- Backend and frontend behavior match API contract
- Required automated tests pass
- Manual QA checklist completed
- Monitoring/alert coverage exists for new services
- Companion docs are updated

## 8. Progress Log

### 2026-04-11

Completed:

- Initial documentation set and companion planning docs created
- Project initialized as its own git repository and pushed to GitHub
- Phase 0 scaffold created:
  - apps/web, apps/api, apps/pipeline
  - packages/domain, packages/showdown-adapter, packages/explanations, packages/config
  - shared root config (.gitignore, .editorconfig, tsconfig.base.json, .env.example, CONTRIBUTING.md)
- Workspace package management initialized with npm workspaces and lockfile
- Backend foundation started on branch `backend-phase-0`:
	- structured Express app bootstrap
	- health route and puzzle contract route stubs
	- shared backend-facing puzzle contracts in `packages/domain`
	- initial SQL migration for core schema
	- database client helper, migration runner, and readiness route

Next:

- Add replay tokenizer and state reconstruction foundation
- Implement replay tokenizer in pipeline
- Implement deterministic battle state reconstruction and snapshot extractor
- Add initial fixture-based deterministic tests

### 2026-04-11 - Backend Follow-up

Completed:

- API can now boot with a readiness route that checks database connectivity
- Workspace exposes a `db:migrate` command for the API package
- Initial schema migration runner is wired into the app codebase
- Replay parser now tokenizes Showdown-style logs, reconstructs deterministic snapshot state, and passes fixture tests
- API now exposes a `db:smoke-test` command for disposable-database migration verification
- Shared snapshot contract is versioned via `GAME_STATE_SNAPSHOT_SCHEMA_VERSION = "1.0.0"`
- `.env.example` now contains the required environment variable keys
- Workspace TypeScript configuration is in place across the monorepo
- `apps/web` builds successfully and picked up the expected Next.js TypeScript include update
- Showdown engine has been added as a git submodule
- Showdown adapter wiring now compiles and the full root workspace build passes

Still pending:

- Run the migration smoke test against a fresh database
