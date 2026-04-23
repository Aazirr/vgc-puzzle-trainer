# Neon PostgreSQL Setup

Use Neon as the managed PostgreSQL database for the backend.

Neon fits the current backend architecture:

- API connects through `DATABASE_URL`
- SQL migrations live in `apps/api/db/migrations`
- `npm --workspace apps/api run db:migrate` applies migrations
- `npm --workspace apps/api run db:smoke-test` verifies a disposable/fresh database

## Connection Setup

1. Create a Neon project.
2. Create or select the database for this app.
3. Copy the direct connection string for migrations.
4. Copy the pooled connection string for deployed app runtime if the API runs in a serverless/high-concurrency environment.
5. Store the chosen connection string in the API environment:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require
CORS_ORIGIN=https://YOUR_FRONTEND_DOMAIN
```

Use the direct Neon connection string for schema migrations and administrative jobs. Use the pooled connection string for runtime if the deployment target opens many concurrent connections.

Set `CORS_ORIGIN` to the frontend origin that will call the API, for example `http://localhost:3000` in local development or the production Vercel URL after deploy.

The frontend login/register flow also needs:

```env
NEXT_PUBLIC_AUTH_API_BASE=https://YOUR_API_DOMAIN
```

## Migration Commands

From the repo root:

```powershell
npm --workspace apps/api run db:migrate
npm --workspace apps/api run db:smoke-test
```

## Required Initial SQL Migration

The required migrations are already present in `apps/api/db/migrations`.

`0001_initial.sql` creates:

- `users`
- `puzzles`
- `puzzle_votes`
- `puzzle_attempts`
- `user_streaks`
- supporting indexes
- `pgcrypto` for UUID generation

`0002_password_auth.sql` adds:

- `users.password_hash`
- an email lookup index for login/register

`0003_seed_phase1_puzzles.sql` adds:

- 10 approved Phase 1 starter puzzles
- seed coverage across speed checks, KO thresholds, and field interactions

## Current Migration SQL

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  format TEXT NOT NULL,
  game_state JSONB NOT NULL,
  player_side TEXT NOT NULL,
  question_type TEXT NOT NULL,
  correct_action JSONB NOT NULL,
  wrong_actions JSONB NOT NULL,
  explanation JSONB NOT NULL,
  difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  submitted_by UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  upvotes INT NOT NULL DEFAULT 0,
  downvotes INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_puzzles_status ON puzzles(status);
CREATE INDEX idx_puzzles_type ON puzzles(question_type);
CREATE INDEX idx_puzzles_tags ON puzzles USING GIN(tags);

CREATE TABLE puzzle_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id UUID REFERENCES puzzles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  vote TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(puzzle_id, user_id)
);

CREATE TABLE puzzle_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id UUID REFERENCES puzzles(id),
  user_id UUID REFERENCES users(id),
  guest_token TEXT,
  correct BOOLEAN NOT NULL,
  time_taken INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempts_user ON puzzle_attempts(user_id);

CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ
);
```
