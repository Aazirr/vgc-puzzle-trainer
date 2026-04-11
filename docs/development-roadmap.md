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

Exit criteria:

- Replay fixtures are deterministic
- Migrations run cleanly on fresh DB
- Core contracts documented and agreed

### Phase 1 - MVP Puzzle Loop

Goal: playable puzzle experience with verified reveal flow.

Deliverables:

- Puzzle fetch endpoint without answer leakage
- Answer submission endpoint with correctness result
- Puzzle page with answer options and explanation reveal
- Seed bank of 10-20 hand-curated approved puzzles

Exit criteria:

- End-to-end play works for guest and signed-in user
- Correct answer is never returned before submit
- Attempt data is recorded correctly

### Phase 2 - Simulation Supply

Goal: build sustainable puzzle inflow.

Deliverables:

- Scheduled simulation job
- Candidate detector and curation filter
- Duplicate detection and rejection reason capture

Exit criteria:

- Scheduled runs produce candidate output and logs
- Queue receives pending puzzles from sim pipeline
- Publishable ratio is tracked

### Phase 3 - Accounts and Progression

Goal: retention and progression features.

Deliverables:

- Auth providers and guest upgrade path
- Streak tracking and attempt history
- Browse filters for question type, tags, and difficulty

Exit criteria:

- Returning users keep progression data
- Filters perform within agreed latency targets

### Phase 4 - Community and Moderation

Goal: scalable contribution workflow.

Deliverables:

- Community submission endpoint with deterministic validation
- Moderator queue and actions (approve/reject/flag)
- Voting and auto-approval checks

Exit criteria:

- Invalid submissions are rejected with clear reason
- Moderators can process queue without direct DB edits
- Re-flagging flow returns puzzles to review state

### Phase 5 - AI Explanation Enrichment

Goal: add optional learning context on approved puzzles.

Deliverables:

- Post-approval enrichment worker
- ai_text storage and rendering
- Feature flag and rollback switch

Exit criteria:

- AI text only appears on approved puzzles
- Failed enrichment retries without blocking puzzle access

## 3. Weekly Cadence

- Monday: pick one milestone target and 3-5 deliverables
- Midweek: blocker and risk checkpoint
- Friday: demo, decision log update, carryover planning

## 4. Delivery Rules

- Prefer vertical slices over horizontal batching
- One PR should target one meaningful slice
- Every PR includes scope, risk, test evidence, and doc impact
- Do not close a phase until exit criteria are explicitly checked

## 5. Risk Triggers

Take action if any trigger is hit:

- Publishable ratio under 10 percent for 2+ sim runs
- Moderation queue age exceeds 7 days
- Regulation shift occurs and puzzle bank is not refresh-tagged within 72 hours
- Any verified explanation error on approved puzzle

## 6. Done Definition (Per Milestone)

A milestone is done only if all are true:

- Acceptance criteria signed off
- Backend and frontend behavior match API contract
- Required automated tests pass
- Manual QA checklist completed
- Monitoring/alert coverage exists for new services
- Companion docs are updated

## 7. Progress Log

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

Still pending:

- Migration up/down smoke test against a fresh database
- Contract freeze for the replay snapshot shape
