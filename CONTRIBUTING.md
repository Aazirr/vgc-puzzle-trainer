# Contributing

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

1. Clone the repository.
2. Copy .env.example to .env and fill required values.
3. Run npm install at repository root.

## Workflow

1. Create a short-lived feature branch from main.
2. Keep changes scoped to one vertical slice.
3. Run local checks before opening a PR:
   - npm run typecheck
   - npm run lint
   - npm run test
4. Update docs when contracts or behavior change.

## Pull Request Checklist

- Scope and acceptance criteria are clear.
- Tests for changed behavior are included.
- Any API/schema changes are documented.
- Screenshots or logs are attached for UI/API behavior.
