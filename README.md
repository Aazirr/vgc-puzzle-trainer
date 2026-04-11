# VGC Puzzle Trainer

A web-based training app for competitive VGC (doubles) players, inspired by chess puzzles.

Players are shown a frozen battle state at a deterministic decision point, choose the best action, and then receive the mechanically correct answer with an explanation.

## Purpose

The goal is to build fast, reliable mechanical decision-making for real VGC games:

- Speed tier calculations
- Guaranteed KO or guaranteed non-KO checks
- Deterministic field-condition interactions

The project intentionally excludes read-dependent and probability-based scenarios.

## Scope Summary

### In Scope

- VGC doubles only, current regulation
- Web app (desktop-first, mobile-responsive)
- Puzzle types with one provably correct answer:
  - Speed checks
  - Hard KO thresholds
  - Deterministic field interactions
- Three puzzle supply pipelines:
  - Simulation-generated candidates
  - Replay import from Showdown logs
  - Community submissions with moderation

### Out of Scope (V1)

- Smogon singles or non-VGC formats
- Full battle simulator or team builder
- Native mobile app
- Multiplayer head-to-head modes
- Monetization layer
- Probability or partial-range puzzle types

## Product Principles

- Every published puzzle must have a binary, provable answer
- No "best move" questions that depend on reads
- Explanations must show mechanics, not opinions
- Correct answer is hidden until user submits
- Community content is moderated and re-reviewable by flags

## High-Level Architecture

The system is designed as independently deployable components sharing one database:

- Web Client: Next.js and React app for puzzle play, browsing, submission, and moderation UI
- API Server: Node.js and Express for auth, puzzle serving, attempts, voting, moderation logic
- PostgreSQL: source of truth for users, puzzles, votes, attempts, and progression
- Simulation Pipeline: scheduled Node.js job using Showdown engine to generate and curate puzzle candidates
- Explanation Service: deterministic templates (V1) with optional AI enrichment (V2)

## Tech Stack

- Frontend: Next.js (React)
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: Auth.js (NextAuth)
- Battle Engine: Pokemon Showdown sim modules
- Scheduling: node-cron or platform cron
- Hosting:
  - Frontend: Vercel
  - API/DB/Workers: Railway or Render
- AI enrichment (Phase 5): Anthropic API

## Data Model Summary

Core entities:

- users
- puzzles
- puzzle_votes
- puzzle_attempts
- user_streaks

Key puzzle fields include:

- source (sim, replay, community)
- format (current regulation)
- game_state snapshot and full state
- question_type (speed_check, ko_threshold, field_interaction)
- correct_action and wrong_actions
- explanation object (templated and optional AI text)
- difficulty, tags, moderation status, vote counters

## Puzzle Supply Pipelines

### 1) Simulation Pipeline (Primary)

Runs offline simulations, flags deterministic puzzle moments, applies curation filters, and writes pending candidates to the database.

### 2) Replay Import Pipeline

Parses Showdown log files, rebuilds battle state turn-by-turn, detects publishable moments, and creates pending puzzle candidates.

### 3) Community Submission Pipeline

Accepts user-submitted puzzle candidates with proposed answers and explanations, then routes all submissions through moderation.

## Explanation System

### V1: Templated Mechanical Explanations

- Deterministic, structured, and trusted
- Shows concrete calculations (effective speed or full damage range vs HP)

### V2: AI-Enriched Learning Insight

- Added only to approved puzzles
- Provides short practical context and pattern-recognition tips
- Never replaces the mechanical explanation

## API Surface (Planned)

- Puzzle browsing and fetch
- Answer submission and reveal
- Community submission
- Voting and moderation queue actions
- User profile and attempt history

Auth routes are handled by Auth.js.

## Milestone Plan

- Phase 0: schema lock and replay parser foundation
- Phase 1: MVP puzzle loop with 10-20 curated puzzles
- Phase 2: simulation supply with curation and dedupe
- Phase 3: accounts, streaks, filters, and progression
- Phase 4: submissions, voting, and moderation tooling
- Phase 5: AI-enriched explanations on approved puzzles

## Development Workflow Companion Docs

Use these docs for execution and governance:

- docs/vgc-puzzle-trainer-scope.md
- docs/vgc-puzzle-trainer-technical-design.md
- docs/development-roadmap.md
- docs/phase-checklists.md
- docs/decision-log-template.md

## Current Status

Documentation, planning, and Phase 0 scaffold are in place.

Completed so far:

- Standalone project repository initialized and pushed
- Monorepo/workspace skeleton created for apps and shared packages
- Baseline contributor and environment setup files added
- Backend foundation started on branch `backend-phase-0`
- `.env.example` and workspace TypeScript configuration are in place
- Replay parser, migration runner, and smoke-test path are implemented
- Showdown engine is now present as a git submodule
- Showdown adapter wiring compiles across all workspaces
- Root workspace build now passes

Backend foundation includes:

- Structured Express app bootstrap for the API service
- Health route and puzzle contract route stubs
- Shared puzzle contracts in `packages/domain`
- Initial SQL migration for core tables
- Database client helper, migration runner, and readiness route
- Replay tokenizer, deterministic state reconstruction, and fixture tests in the pipeline workspace
- Writable migration smoke-test path for disposable databases

Current Phase 0 focus:

- run the migration smoke test against a fresh database
- keep expanding fixture coverage and quality gates
