# VGC Puzzle Trainer — Project Scope

## Overview

A web-based puzzle training app for competitive VGC (doubles) players. The experience mirrors chess puzzles — a real game state is frozen at a critical, mechanically deterministic decision point, the player picks the best action, and the system reveals the correct answer with a precise mechanical explanation.

The tool is strictly limited to puzzles where one answer is unambiguously correct by the numbers. No judgment calls, no read-dependent scenarios, no probability framing. Every puzzle has a clean right answer that can be proven with a calculation. The goal is to build muscle memory for VGC fundamentals — speed tiers, KO thresholds, and field condition interactions — so these calculations happen faster and more reliably during real matches.

---

## Format & Platform

- **Format:** VGC doubles only, current regulation
- **Platform:** Web app (desktop-first, mobile-responsive)
- **Engine:** Pokémon Showdown open-source game engine
- **Replay format:** Showdown `.log` / replay parser as the canonical input format across all puzzle pipelines

---

## Puzzle Philosophy

The chess puzzle analogy only holds when there is one provably correct answer. VGC is a hidden-information game with randomness, so most in-game moments are genuinely ambiguous. This tool deliberately excludes those moments.

**Publishable puzzle types are limited to:**

### Speed Checks
Who moves first under the current field conditions? The answer is always deterministic given known stats and field state. Conditions in scope include Tailwind, Trick Room, paralysis, stat boosts/drops, and Prankster/Gale Wings priority.

Example: *Tornadus has +1 Speed under Tailwind. Flutter Mane has no boosts. Trick Room is not active. Who outspeeds whom, and by how much?*

### Hard KO Thresholds
Does this move guarantee the KO, or does it guaranteed not KO? Only publish puzzles where the entire 16-roll damage range falls entirely above or entirely below the target's remaining HP. Do not publish puzzles where some rolls KO and others don't — these are probability questions, not mechanical ones, and belong in a different tool.

Example: *Urshifu uses Close Combat into a Dondozo at 45% HP with no defensive boosts. Does it KO? (All 16 rolls are above the threshold — yes, guaranteed.)*

### Field Condition Interactions (Mechanically Deterministic Only)
Puzzles testing whether a player correctly understands how layered field conditions interact, when the outcome is a fixed yes/no. For example: does redirection override spread moves? Does Helping Hand + terrain boost change a guaranteed KO to a guaranteed non-KO or vice versa?

Only publish if the answer is binary and provable. Do not publish if it depends on what the opponent chooses to do.

---

## What Is Explicitly Out of Scope (Puzzle Types)

These puzzle types will not be published, regardless of how well-authored they are:

- **Optimal play / best move** — depends on reads, opponent decisions, and risk tolerance
- **Switch decisions** — almost always read-dependent
- **Partial KO ranges** — "68% chance to KO" is a probability lesson, not a puzzle
- **Prediction-based scenarios** — correct answer changes based on opponent's action
- **Long-sequence planning** — too many branches to have one clean answer

---

## Puzzle Supply: Three Pipelines

### 1. Simulation-Generated (Primary)
The backend runs many game simulations using Showdown's engine and flags moments that meet the publishable criteria: a speed check or a hard KO threshold. These states are packaged as puzzle candidates with full metadata. This is the scalable, evergreen supply source.

Quality control note: most flagged states will be trivial or too niche. A curation layer is required to filter for puzzles that are pedagogically useful and representative of real competitive play.

### 2. Replay Import
High-level VGC replays — from official tournaments or top-ladder Showdown matches — are parsed and key turning points extracted. Only moments that pass the deterministic criteria are packaged as puzzles. This grounds the puzzle bank in real competitive scenarios rather than synthetic ones.

### 3. Community Submission
Users submit game states as puzzle candidates. Every submission must include a proposed correct answer and a mechanical explanation. Submissions enter a moderation queue before going live. Submissions that are read-dependent or involve partial damage ranges are rejected at the queue level with a reason given.

---

## Community Moderation (Hybrid Model)

- A seed group of trusted moderators (knowledgeable players, founder-curated initially) reviews all submissions early on
- Once a puzzle accumulates sufficient upvotes from verified accounts it auto-graduates to the live pool
- Any user can flag a puzzle's explanation as incorrect, which returns it to review regardless of approval status
- Downvotes and flags together can pull an approved puzzle back into review at any time

---

## Explanation System

Every puzzle reveals a full explanation after the player answers. Explanations are mechanical and precise — they show the calculation, not just the conclusion.

**V1 — Templated explanations**
Generated from puzzle metadata. Each puzzle type has a structured explanation template (e.g., speed formula with values filled in, damage roll range displayed against remaining HP). Deterministic and trustworthy.

**V2 — AI-enriched explanations**
Natural language context layered on top of approved puzzles. Explains why the scenario matters competitively, what the wrong answers miss, and how to recognise this pattern in a real match. Applied only to puzzles that are already approved and have a verified correct answer.

---

## User Accounts & Progression

- **Guest mode:** full puzzle access, no account required
- **Accounts unlock:** streak tracking, puzzle history, submission rights, voting and flagging
- Difficulty rating per puzzle (1–5) based on the complexity of the calculation required
- Tag filtering so users can drill specific mechanics (e.g., only Trick Room speed checks, only Tailwind KO thresholds)

---

## Puzzle Data Schema

Every pipeline outputs the same shape. This schema is locked before any pipeline is built.

```
puzzle
  id
  source            # "sim" | "replay" | "community"
  format            # e.g., "reg-h"
  game_state        # full Showdown battle state at decision point
  player_side       # which side the user is playing
  question_type     # "speed_check" | "ko_threshold" | "field_interaction"
  correct_action    # the answer that is provably correct
  wrong_actions     # 2–3 plausible wrong answers
  explanation       # structured object: template fields (V1) or AI text (V2)
  difficulty        # 1–5
  tags              # ["tailwind", "trick-room", "speed-tie", "helping-hand", etc.]
  status            # "pending" | "approved" | "flagged" | "rejected"
  rejection_reason  # populated if status is "rejected"
  votes             # upvote/downvote counts
```

---

## Out of Scope (V1)

- Previous generation or non-current regulation coverage
- Full battle simulator or team builder
- Native mobile app
- Smogon / singles formats
- Multiplayer or head-to-head modes
- Monetization layer
- Probability-based or partial-range puzzles

---

## Milestones

| Phase | Goal |
|---|---|
| 0 | Lock puzzle schema; build Showdown replay parser |
| 1 | MVP — hand-curated puzzle bank (10–20 puzzles), basic UI, answer + explanation reveal |
| 2 | Simulation pipeline with curation layer feeding puzzle bank automatically |
| 3 | User accounts, streaks, tag filtering, difficulty ratings |
| 4 | Community submission queue + voting + moderation tools |
| 5 | AI-enriched explanations on approved puzzles |

---

## Key Risks (Acknowledged)

- **Puzzle supply is narrower than expected.** Hard KO thresholds and clean speed checks are a small subset of all game moments. The simulation pipeline needs a tight filter, and the curation burden is real.
- **Regulation cycles deprecate puzzle banks.** New regulations require fresh puzzle generation. Legacy puzzles should be tagged and archived, not deleted.
- **Community cold start.** The submission and voting pipeline depends on an engaged user base. Milestones 1–3 need to be strong enough to build that base before Phase 4 is meaningful.
- **Explanation quality.** V2 AI explanations must be reviewed before publishing. An incorrect AI-generated explanation on an approved puzzle damages trust faster than a missing explanation.
