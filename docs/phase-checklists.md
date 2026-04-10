# VGC Puzzle Trainer - Phase Checklists

Use these checklists to track phase completion and reduce missed dependencies.

## Phase 0 - Foundations

### Progress Update (2026-04-11)

- Completed: repository scaffold and monorepo workspace structure
- In progress: DB migrations, replay tokenizer, state rebuild, snapshot extractor, fixture tests

### Build Checklist

- [x] Create app/package folder structure
- [ ] Add DB migrations for core tables
- [ ] Implement replay log tokenizer
- [ ] Implement Showdown-based state rebuild
- [ ] Implement snapshot extractor
- [ ] Add fixture-based deterministic tests

### Validation Checklist

- [ ] Same replay fixture returns same snapshot output on repeated runs
- [ ] Migration up/down smoke test passes
- [ ] Contracts for puzzle schema and snapshot format are frozen

## Phase 1 - MVP Puzzle Loop

### Build Checklist

- [ ] Implement GET puzzle endpoint without pre-answer leakage
- [ ] Implement POST answer endpoint with correctness evaluation
- [ ] Build puzzle page (state display, question prompt, choices)
- [ ] Build explanation reveal panel
- [ ] Seed 10-20 approved hand-curated puzzles
- [ ] Record attempts for guest and account flows

### Validation Checklist

- [ ] No correct_action data in initial payload
- [ ] Correctness and explanation are returned only after answer submit
- [ ] Guest flow works with token tracking
- [ ] Authenticated attempt history persists

## Phase 2 - Simulation Supply

### Build Checklist

- [ ] Build scheduled simulation runner
- [ ] Connect candidate detector to pipeline
- [ ] Connect curation filter and rejection reasons
- [ ] Add duplicate detection hash
- [ ] Write pending candidates to DB queue

### Validation Checklist

- [ ] Nightly schedule executes successfully
- [ ] Candidate counts and acceptance ratio are logged
- [ ] Pending queue receives simulation output

## Phase 3 - Accounts and Progression

### Build Checklist

- [ ] Configure Auth.js providers and session behavior
- [ ] Implement streak update logic
- [ ] Implement user dashboard (streak, history)
- [ ] Add puzzle filters by type/tag/difficulty

### Validation Checklist

- [ ] Account upgrade from guest keeps progression continuity
- [ ] Streak increments and resets correctly
- [ ] Filter queries match expected results and latency budget

## Phase 4 - Community and Moderation

### Build Checklist

- [ ] Implement puzzle submission endpoint with deterministic-only checks
- [ ] Build moderation queue view
- [ ] Implement moderator actions and audit metadata
- [ ] Implement vote endpoint and auto-approval logic
- [ ] Implement flag flow that returns puzzle to review

### Validation Checklist

- [ ] Read-dependent and partial-range submissions are blocked
- [ ] Moderation actions update status consistently
- [ ] Auto-approval threshold and ratio logic tested

## Phase 5 - AI Explanation Enrichment

### Build Checklist

- [ ] Implement enrichment worker for approved puzzles
- [ ] Store ai_text alongside mechanical explanation
- [ ] Add frontend rendering logic for optional ai_text
- [ ] Add feature flag and rollback toggle

### Validation Checklist

- [ ] AI text appears only for approved puzzles
- [ ] Failed calls are retried and logged
- [ ] Turning off feature flag immediately hides ai_text

## Cross-Phase Release Checklist

- [ ] Required tests pass (unit, integration, E2E/manual critical path)
- [ ] API contract changes communicated
- [ ] Monitoring and alerts configured for changed services
- [ ] Documentation updated in companion docs
