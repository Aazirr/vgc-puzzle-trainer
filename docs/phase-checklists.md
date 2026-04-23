# VGC Puzzle Trainer - Phase Checklists

Use these checklists to track phase completion and reduce missed dependencies.

## Phase 0 - Foundations

### Progress Update (2026-04-11)

- Completed: repository scaffold and monorepo workspace structure
- Completed: backend app skeleton, shared contracts, initial SQL migration, migration runner, readiness endpoint
- Completed: replay tokenizer, state rebuild, snapshot extractor, fixture tests
- Completed: migration up/down smoke-test path, frozen snapshot schema version in shared contracts
- Completed: .env.example with required environment variable keys
- Completed: TypeScript configuration across workspaces
- Completed: Showdown engine added as git submodule
- Completed: Showdown submodule imports correctly in pipeline and parser workspaces
- Completed: TypeScript compiles with zero errors across all workspaces
- Not yet verified: replay fixture determinism against live parser inputs

### Progress Update (2026-04-23)

- Completed: backend work branch renamed from `backend-phase-0` to `backend`
- Verified: API package builds successfully
- Verified: pipeline package builds successfully
- Verified: replay tokenizer/state rebuild/snapshot fixture tests pass
- Verified: shared `domain`, `explanations`, and `showdown-adapter` packages build successfully
- Confirmed: Phase 1 puzzle API routes exist as backend stubs and still return `501 not_implemented`
- Still pending: migration smoke test against a fresh PostgreSQL database
- Still pending: replay fixture determinism against live parser inputs

### Build Checklist

- [x] Create app/package folder structure
- [x] Add DB migrations for core tables
- [x] Implement replay log tokenizer
- [x] Implement Showdown-based state rebuild
- [x] Implement snapshot extractor
- [x] Add fixture-based deterministic tests
- [x] Add .env.example with all required environment variable keys
- [x] Configure TypeScript (tsconfig.json) across workspaces
- [x] Add Showdown engine as git submodule
- [x] Define and freeze shared TypeScript interfaces in contracts package

### Validation Checklist

- [x] Same replay fixture returns same snapshot output on repeated runs
- [ ] Migration up/down smoke test passes
- [x] Contracts for puzzle schema and snapshot format are frozen
- [x] Showdown submodule imports correctly in pipeline and parser workspaces
- [x] TypeScript compiles with zero errors across all workspaces

### Status Note

The backend is currently at a runnable foundation stage: API boots, database migrations can be executed through the app workspace, readiness checks can verify DB access, the replay pipeline reconstructs deterministic snapshots from fixture logs, the migration smoke-test path now exists for disposable databases, and workspace TypeScript configuration is validated.

## Phase 1 - MVP Puzzle Loop

### Current Backend Status (2026-04-23)

- Route stubs exist for puzzle listing, puzzle fetch, and answer submission
- These routes intentionally return `501 not_implemented` until the next backend slice
- No seeded puzzle repository, answer hiding, answer evaluation, attempt recording, or filtering logic is implemented yet

### Build Checklist

- [ ] Implement GET puzzle endpoint without pre-answer leakage
- [ ] Implement POST answer endpoint with correctness evaluation
- [ ] Build puzzle page (state display, question prompt, choices)
- [ ] Build explanation reveal panel
- [ ] Seed 10-20 approved hand-curated puzzles
- [ ] Record attempts for guest and account flows
- [ ] Implement templated explanation renderer for speed_check and ko_threshold types
- [ ] Shuffle answer choices server-side before sending to client
- [ ] Add difficulty tag filtering to puzzle list endpoint

### Validation Checklist

- [ ] No correct_action data in initial payload
- [ ] Correctness and explanation are returned only after answer submit
- [ ] Guest flow works with token tracking
- [ ] Authenticated attempt history persists
- [ ] All 16 damage rolls confirmed fully above or below HP threshold on seeded KO puzzles
- [ ] Answer choices arrive shuffled and without a correct label in the payload
- [ ] Explanation template renders correctly for speed_check and ko_threshold

## Phase 2 - Simulation Supply

### Build Checklist

- [ ] Build scheduled simulation runner
- [ ] Connect candidate detector to pipeline
- [ ] Connect curation filter and rejection reasons
- [ ] Add duplicate detection hash
- [ ] Write pending candidates to DB queue
- [ ] Implement hard KO threshold roll check using all 16 damage rolls
- [ ] Implement speed check detector with field-condition-aware effective speed calculation
- [ ] Add team pool input from JSON files of VGC teams
- [ ] Add curation trivial-puzzle filter to reject too-easy candidates by margin threshold

### Validation Checklist

- [ ] Nightly schedule executes successfully
- [ ] Candidate counts and acceptance ratio are logged
- [ ] Pending queue receives simulation output
- [ ] Partial range KO candidates are rejected and logged with reason
- [ ] Speed check detector correctly applies Tailwind, Trick Room, paralysis, and stat boosts
- [ ] No sim-generated puzzle enters the DB without a difficulty and at least one tag

## Phase 3 - Accounts and Progression

### Build Checklist

- [ ] Configure Auth.js providers and session behavior
- [ ] Implement streak update logic
- [ ] Implement user dashboard (streak, history)
- [ ] Add puzzle filters by type/tag/difficulty
- [ ] Lock design-tokens.css before any frontend work begins

### Validation Checklist

- [ ] Account upgrade from guest keeps progression continuity
- [ ] Streak increments and resets correctly
- [ ] Filter queries match expected results and latency budget
- [ ] Filters work correctly under Trick Room

## Phase 4 - Community and Moderation

### Build Checklist

- [ ] Implement puzzle submission endpoint with deterministic-only checks
- [ ] Build moderation queue view
- [ ] Implement moderator actions and audit metadata
- [ ] Implement vote endpoint and auto-approval logic
- [ ] Implement flag flow that returns puzzle to review
- [ ] Add rejection_reason field populated on all rejected community submissions
- [ ] Notify submitter when puzzle is rejected, approved, or flagged
- [ ] Add moderator seed group setup with initial moderator roles in DB

### Validation Checklist

- [ ] Read-dependent and partial-range submissions are blocked
- [ ] Moderation actions update status consistently
- [ ] Auto-approval threshold and ratio logic tested
- [ ] Submitter receives rejection reason on blocked puzzles
- [ ] A puzzle flagged after approval returns to pending status, not rejected
- [ ] A single user cannot vote on the same puzzle twice

## Phase 5 - AI Explanation Enrichment

### Build Checklist

- [ ] Implement enrichment worker for approved puzzles
- [ ] Store ai_text alongside mechanical explanation
- [ ] Add frontend rendering logic for optional ai_text
- [ ] Add feature flag and rollback toggle
- [ ] Add human review step before AI-enriched text goes live
- [ ] Log all Anthropic API calls with puzzle ID for auditing

### Validation Checklist

- [ ] AI text appears only for approved puzzles
- [ ] Failed calls are retried and logged
- [ ] Turning off feature flag immediately hides ai_text
- [ ] AI text is blocked from publishing if the enrichment call fails or returns empty
- [ ] An incorrect AI explanation flagged by community triggers re-review

## Cross-Phase Release Checklist

- [ ] Required tests pass (unit, integration, E2E/manual critical path)
- [ ] API contract changes communicated
- [ ] Monitoring and alerts configured for changed services
- [ ] Documentation updated in companion docs
- [ ] Non-affiliation legal disclaimer appears in site footer on every page
- [ ] No official Pokemon sprites or artwork are used anywhere in the UI
- [ ] DATABASE_URL points to a separate Railway PostgreSQL service, not app container
- [ ] Prisma migrations run on deploy without force: true or synchronize: true
- [ ] Domain name does not include the word Pokemon
