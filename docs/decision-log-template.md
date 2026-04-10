# Decision Log Template (ADR-Light)

Use one entry for each meaningful product or technical decision.

## Entry Format

### Decision Title

Short and specific.

### Date

YYYY-MM-DD

### Context

What problem or uncertainty required a decision?

### Options Considered

1. Option A
2. Option B
3. Option C

### Decision

Chosen option and one-sentence reason.

### Rationale

Why this option is best now, including key tradeoffs.

### Impact

- Components affected:
- Data/API impact:
- Operational impact:
- User impact:

### Risks

Known downsides and mitigation plan.

### Validation Plan

How to verify this decision is working in practice.

### Revisit Trigger

Clear condition that should trigger re-evaluation.

### Status

Proposed | Accepted | Deprecated

---

## Example Entry

### Decision Title

Use Git submodule for Pokemon Showdown engine

### Date

2026-04-11

### Context

The engine is required by both replay parsing and simulation pipeline. We need updateability without deep fork maintenance.

### Options Considered

1. Full fork in repository
2. NPM package consumption
3. Git submodule

### Decision

Choose git submodule to keep upstream updates accessible while isolating local adapters.

### Rationale

A full fork increases maintenance overhead. NPM distribution does not guarantee the exact integration shape needed for parser and sim internals. Submodule gives controlled version pinning and easier updates.

### Impact

- Components affected: pipeline, replay parser, shared adapter layer
- Data/API impact: none
- Operational impact: CI and setup must initialize submodules
- User impact: none directly

### Risks

Submodule setup may be skipped by contributors. Mitigate with onboarding scripts and CI checks.

### Validation Plan

- CI fails if submodule path missing
- Replay and sim integration tests pass on pinned version

### Revisit Trigger

If submodule update friction blocks releases for two consecutive cycles.

### Status

Accepted
