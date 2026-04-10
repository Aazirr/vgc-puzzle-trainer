# VGC Puzzle Trainer — Technical Design Documentation

---

## 1. System Architecture Overview

The system is composed of four independently deployable components that share a central database.

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Client                           │
│                  (Next.js / React SPA)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / REST + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                      API Server                             │
│                  (Node.js / Express)                        │
│   Auth · Puzzle serving · Submission queue · Voting         │
└───────┬────────────────┬───────────────────┬────────────────┘
        │                │                   │
┌───────▼──────┐  ┌──────▼───────┐  ┌───────▼──────────────┐
│  PostgreSQL  │  │  Sim Pipeline│  │  Explanation Service  │
│   Database   │  │  (Node.js +  │  │  (Templated V1 /      │
│              │  │  Showdown    │  │   Anthropic API V2)   │
│              │  │  engine)     │  │                       │
└──────────────┘  └──────────────┘  └───────────────────────┘
```

**Component responsibilities:**

| Component | Role |
|---|---|
| Web Client | Puzzle UI, user accounts, submission forms, moderation dashboard |
| API Server | All business logic, auth, puzzle serving, voting, moderation queue |
| PostgreSQL | Single source of truth for all puzzles, users, votes, sessions |
| Sim Pipeline | Offline job: runs Showdown simulations, flags candidate puzzles, writes to DB |
| Explanation Service | Generates and enriches puzzle explanations, called by API server |

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js (React) | SSR for SEO on puzzle pages, easy API routes, good DX |
| Backend | Node.js + Express | Same language as Showdown engine — replay parsing and sim pipeline share code |
| Database | PostgreSQL | Relational structure fits puzzle + votes + users; strong JSON support for game_state |
| Auth | Auth.js (NextAuth) | Handles guest sessions, OAuth (Discord, Google), and account upgrade flows |
| Sim Pipeline | Node.js job + Showdown engine fork | Runs as a standalone scheduled process, not part of the API server |
| Explanation V1 | Template engine (in-process) | Deterministic, no external dependency |
| Explanation V2 | Anthropic Claude API | Natural language enrichment on approved puzzles |
| Hosting (API + DB) | Railway or Render | Simple Node + Postgres deploys, good free tiers for early stages |
| Hosting (Frontend) | Vercel | Native Next.js support |
| Job scheduling | node-cron or Railway Cron | Trigger sim pipeline runs on a schedule |

---

## 3. Database Schema

### `users`
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'moderator' | 'admin'
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_seen_at  TIMESTAMPTZ
);
```

### `sessions`
Managed by Auth.js — standard session table, no custom schema needed.

### `puzzles`
```sql
CREATE TABLE puzzles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source           TEXT NOT NULL,               -- 'sim' | 'replay' | 'community'
  format           TEXT NOT NULL,               -- e.g. 'reg-h'
  game_state       JSONB NOT NULL,              -- full Showdown battle state
  player_side      TEXT NOT NULL,               -- 'p1' | 'p2'
  question_type    TEXT NOT NULL,               -- 'speed_check' | 'ko_threshold' | 'field_interaction'
  correct_action   JSONB NOT NULL,              -- { type, move, target, value }
  wrong_actions    JSONB NOT NULL,              -- array of same shape
  explanation      JSONB NOT NULL,              -- { template_type, fields, ai_text? }
  difficulty       SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
  tags             TEXT[],
  status           TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'approved'|'flagged'|'rejected'
  rejection_reason TEXT,
  submitted_by     UUID REFERENCES users(id),
  reviewed_by      UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  approved_at      TIMESTAMPTZ,
  upvotes          INT DEFAULT 0,
  downvotes        INT DEFAULT 0
);

CREATE INDEX idx_puzzles_status ON puzzles(status);
CREATE INDEX idx_puzzles_type ON puzzles(question_type);
CREATE INDEX idx_puzzles_tags ON puzzles USING GIN(tags);
```

### `puzzle_votes`
```sql
CREATE TABLE puzzle_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id  UUID REFERENCES puzzles(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id),
  vote       TEXT NOT NULL,    -- 'up' | 'down' | 'flag'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(puzzle_id, user_id)
);
```

### `puzzle_attempts`
```sql
CREATE TABLE puzzle_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id   UUID REFERENCES puzzles(id),
  user_id     UUID REFERENCES users(id),   -- nullable for guest attempts
  guest_token TEXT,                         -- anonymous session token for guests
  correct     BOOLEAN NOT NULL,
  time_taken  INT,                          -- milliseconds
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attempts_user ON puzzle_attempts(user_id);
```

### `user_streaks`
```sql
CREATE TABLE user_streaks (
  user_id         UUID PRIMARY KEY REFERENCES users(id),
  current_streak  INT DEFAULT 0,
  longest_streak  INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ
);
```

---

## 4. Showdown Integration

### 4.1 Forking the Engine

Clone `smogon/pokemon-showdown` and import only the battle engine, not the server. The relevant module is `sim/` — specifically:

- `sim/battle.ts` — core battle state machine
- `sim/dex.ts` — Pokédex data (moves, abilities, items, base stats)
- `sim/tools.ts` — damage calculator utilities

Do not run Showdown's full server. Import the engine as a Node module in both the sim pipeline and the replay parser.

```bash
git clone https://github.com/smogon/pokemon-showdown.git
cd pokemon-showdown
npm install
```

In your project:
```javascript
import { Battle } from './showdown/sim/battle';
import { Dex } from './showdown/sim/dex';
```

### 4.2 Game State Snapshot

A game state snapshot is the minimum data needed to reconstruct a battle moment as a puzzle. It is derived from Showdown's `battle.toJSON()` output and then trimmed to only what the puzzle UI needs.

```typescript
interface GameStateSnapshot {
  turn: number;
  weather: string | null;
  terrain: string | null;
  pseudoWeather: string[];        // trick room, gravity, etc.
  p1: SideSnapshot;
  p2: SideSnapshot;
}

interface SideSnapshot {
  sideConditions: string[];       // tailwind, reflect, light screen, etc.
  active: PokemonSnapshot[];      // 2 active slots
  bench: PokemonSnapshot[];       // remaining team
}

interface PokemonSnapshot {
  species: string;
  level: number;
  currentHp: number;
  maxHp: number;
  status: string | null;          // burn, paralysis, etc.
  statBoosts: Record<string, number>;
  moves: string[];
  item: string | null;
  ability: string;
  stats: {                        // actual computed stats (not base stats)
    spe: number;
    atk: number;
    spa: number;
    def: number;
    spd: number;
  };
}
```

**Important:** Store actual computed stats (EVs, nature, level applied), not base stats. This is what makes speed checks and KO calculations deterministic.

---

## 5. Replay Parser

### 5.1 Input Format

Showdown replays are plain text `.log` files. Each line is a pipe-delimited protocol message. Example:

```
|move|p1a: Tornadus|Tailwind|p1: Tornadus
|move|p2a: Flutter Mane|Moonblast|p1a: Tornadus
|-damage|p1a: Tornadus|45/100
|turn|3
```

### 5.2 Parser Architecture

```
replay.log
    │
    ▼
┌─────────────────────────┐
│   Log Line Tokenizer    │  splits raw log into structured event objects
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│   Battle State Rebuild  │  feeds events into Showdown engine to reconstruct
│   (Showdown sim)        │  the exact battle state turn-by-turn
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│   Candidate Detector    │  checks each turn for publishable puzzle criteria
│                         │  (see section 6.2)
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│   Snapshot Extractor    │  takes the game state at flagged turns,
│                         │  produces GameStateSnapshot + puzzle candidate
└───────────┬─────────────┘
            │
       puzzle_candidates[]
       → written to DB with status = 'pending'
```

### 5.3 Key Parser Functions

```typescript
// Parse raw log into structured events
function tokenizeLog(rawLog: string): BattleEvent[]

// Rebuild battle state by replaying events through Showdown engine
function rebuildBattleState(events: BattleEvent[]): Battle

// Check if a turn qualifies as a publishable puzzle candidate
function detectCandidateTurn(battle: Battle, turn: number): CandidateResult | null

// Extract a GameStateSnapshot from a live Battle object at a specific turn
function extractSnapshot(battle: Battle, turn: number): GameStateSnapshot
```

---

## 6. Simulation Pipeline

### 6.1 Overview

The sim pipeline is an offline Node.js job. It does not run as part of the API server. It runs on a schedule (e.g., nightly) or manually triggered, generates battles using real VGC team compositions, and flags turns that meet the publishable puzzle criteria.

```
┌──────────────────────────┐
│   Team Pool              │  hand-curated or scraped from rental codes /
│   (JSON files)           │  Pokepaste / tournament usage stats
└───────────┬──────────────┘
            │
┌───────────▼──────────────┐
│   Battle Generator       │  runs N random battles between sampled teams
│   (Showdown engine)      │  using Showdown's built-in random AI or
│                          │  a policy-guided AI (future improvement)
└───────────┬──────────────┘
            │  full battle logs
┌───────────▼──────────────┐
│   Candidate Detector     │  same detector used by replay parser
└───────────┬──────────────┘
            │  candidate turns
┌───────────▼──────────────┐
│   Curation Filter        │  rejects trivial candidates (too easy),
│                          │  deduplicates near-identical scenarios,
│                          │  tags difficulty and question_type
└───────────┬──────────────┘
            │
      DB: puzzles (status = 'pending')
```

### 6.2 Candidate Detection Rules

A turn is flagged as a candidate if it meets one of the following criteria:

**Speed Check Candidate**
```
- Two or more Pokémon are about to act
- Their effective Speed values (after all field conditions applied) are within
  a meaningful comparison range — i.e. one outspeeds the other and it matters
  which goes first (the slower one's action would change the outcome)
- The speed relationship is not immediately obvious from base stats alone
  (filter out trivially large speed gaps)
```

**KO Threshold Candidate**
```
- A damaging move is about to be used
- Calculate all 16 damage rolls against the target's current HP
- Flag ONLY if: all 16 rolls >= target HP  (guaranteed KO)
             OR all 16 rolls < target HP   (guaranteed non-KO)
- Discard any turn where rolls straddle the threshold (partial range)
- The HP percentage of the target should be non-trivial (not 100% or <5%)
  to avoid obvious puzzles
```

**Field Interaction Candidate**
```
- A move is used under conditions that meaningfully modify its outcome
  (terrain boost, weather boost, Helping Hand, etc.)
- The interaction produces a deterministic yes/no result that differs
  from what it would be without the field condition
- Can be combined with KO Threshold: "does this move KO WITH Tailwind
  but not without it?" is a valid puzzle
```

### 6.3 Curation Filter (Post-Detection)

Candidates pass through a filter before being written to the database:

```typescript
function curate(candidate: PuzzleCandidate): CurationResult {
  // Reject if difficulty < 1 (trivially obvious answer)
  // Reject if scenario is near-duplicate of existing approved puzzle
  // Assign difficulty 1–5 based on:
  //   - number of field conditions active
  //   - how close the speed/damage values are
  //   - how many calculations are needed to arrive at the answer
  // Assign tags from active field conditions + question_type
  // Return: { pass: boolean, difficulty: number, tags: string[], reason?: string }
}
```

---

## 7. API Server

### 7.1 Endpoints

#### Puzzles
```
GET    /api/puzzles                  List approved puzzles (paginated, filterable by type/tag/difficulty)
GET    /api/puzzles/:id              Get a single puzzle (without revealing correct_action until answered)
POST   /api/puzzles/:id/answer       Submit an answer; returns { correct, explanation }
POST   /api/puzzles                  Submit a community puzzle (auth required)
```

#### Voting & Moderation
```
POST   /api/puzzles/:id/vote         Cast vote: { vote: 'up' | 'down' | 'flag' } (auth required)
GET    /api/moderation/queue         Get pending puzzles (moderator role required)
PATCH  /api/moderation/:id           Approve, reject (with reason), or flag a puzzle (moderator required)
```

#### Users
```
GET    /api/users/me                 Get current user profile, streak, history
GET    /api/users/me/attempts        Get puzzle attempt history
```

#### Auth
```
Handled entirely by Auth.js — /api/auth/* routes auto-generated
```

### 7.2 Puzzle Serving — Answer Reveal Flow

The correct answer is never sent to the client with the initial puzzle fetch. It is only returned after the player submits an answer.

```
Client: GET /api/puzzles/:id
Server: Returns puzzle MINUS correct_action
        (wrong_actions are returned shuffled, with correct mixed in unlabelled)

Client: POST /api/puzzles/:id/answer  { chosen_action: ... }
Server: Compares chosen_action to correct_action
        Records attempt in puzzle_attempts
        Updates streak if user is authenticated
        Returns: { correct: boolean, correct_action, explanation }
```

### 7.3 Auto-Approval Logic

Run after every vote is cast:

```typescript
async function checkAutoApproval(puzzleId: string) {
  const puzzle = await db.puzzles.findById(puzzleId);
  const approvalThreshold = 10;   // configurable
  const ratioThreshold = 0.80;    // 80% upvote ratio required

  const total = puzzle.upvotes + puzzle.downvotes;
  const ratio = puzzle.upvotes / total;

  if (total >= approvalThreshold && ratio >= ratioThreshold) {
    await db.puzzles.updateStatus(puzzleId, 'approved');
  }
}
```

---

## 8. Explanation System

### 8.1 V1 — Templated Explanations

Each question type has a structured template. The sim pipeline and replay parser populate the template fields when generating a candidate. The API server renders the final explanation string at serve time.

**Speed Check Template:**
```typescript
interface SpeedCheckExplanation {
  template_type: 'speed_check';
  pokemon_a: string;
  pokemon_b: string;
  base_speed_a: number;
  base_speed_b: number;
  effective_speed_a: number;      // after all field conditions applied
  effective_speed_b: number;
  conditions_applied: string[];   // e.g. ["Tailwind on p1", "Paralysis on p2"]
  winner: string;
  margin: number;                 // effective speed difference
}

// Rendered output example:
// "Flutter Mane has an effective Speed of 401 under normal conditions.
//  Tornadus under Tailwind has an effective Speed of 358 × 2 = 716.
//  Tornadus moves first by a margin of 315 Speed."
```

**KO Threshold Template:**
```typescript
interface KOThresholdExplanation {
  template_type: 'ko_threshold';
  attacker: string;
  defender: string;
  move: string;
  defender_current_hp: number;
  defender_max_hp: number;
  damage_roll_min: number;
  damage_roll_max: number;
  guaranteed_ko: boolean;
  conditions_applied: string[];   // e.g. ["Life Orb", "Helping Hand"]
  calculation_note: string;       // e.g. "252+ Atk Life Orb Urshifu Close Combat"
}

// Rendered output example:
// "Urshifu's Close Combat deals between 187–220 damage (252+ Atk, Life Orb).
//  Dondozo has 180 HP remaining. All 16 damage rolls exceed 180.
//  This is a guaranteed KO."
```

### 8.2 V2 — AI-Enriched Explanations

Applied only to puzzles already approved and with a verified correct answer. Called as a background job after approval, result stored in `explanation.ai_text`.

```typescript
async function enrichExplanation(puzzle: Puzzle): Promise<string> {
  const prompt = `
    You are explaining a competitive VGC Pokémon puzzle to an intermediate player.
    
    Puzzle type: ${puzzle.question_type}
    Game state summary: ${summariseGameState(puzzle.game_state)}
    Correct answer: ${JSON.stringify(puzzle.correct_action)}
    Mechanical explanation: ${renderTemplate(puzzle.explanation)}
    
    Write 2–3 sentences that:
    1. Explain why recognising this pattern matters in a real match
    2. Describe what a player who chose the wrong answer was likely thinking
    3. Give a tip for spotting this situation faster in future
    
    Be precise and concise. Do not repeat the mechanical calculation — that is shown separately.
    Do not use filler phrases. Write for a player who understands VGC basics.
  `;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content[0].text;
}
```

---

## 9. Frontend Architecture

### 9.1 Page Structure (Next.js)

```
/                          Landing page + featured puzzles
/puzzles                   Browse + filter puzzle list
/puzzles/[id]              Single puzzle view (the main gameplay page)
/submit                    Community submission form (auth required)
/dashboard                 User streak, history, stats (auth required)
/moderate                  Moderation queue (moderator role required)
/login                     Auth.js sign-in page
```

### 9.2 Puzzle Page Component Tree

```
<PuzzlePage>
  ├── <BattleStateDisplay>
  │     ├── <FieldConditionsBar />         weather, terrain, pseudo-weather
  │     ├── <SideDisplay side="opponent">
  │     │     ├── <ActiveSlot />  ×2
  │     │     └── <BenchSlot />   ×4
  │     └── <SideDisplay side="player">
  │           ├── <ActiveSlot />  ×2
  │           └── <BenchSlot />   ×4
  │
  ├── <QuestionPrompt />                   "Who moves first?" / "Does this KO?"
  │
  ├── <AnswerChoices>
  │     └── <AnswerOption />  ×3–4         shuffled, unlabelled correct/wrong
  │
  └── <ExplanationPanel />                 hidden until answer submitted
        ├── <ResultBanner />               Correct / Incorrect
        ├── <MechanicalExplanation />      rendered template
        ├── <AIInsight />                  ai_text if available (V2)
        └── <NextPuzzleButton />
```

### 9.3 State Management

Keep it simple — no global state library needed at V1. Use React's `useState` and `useReducer` within the puzzle page. Server state (puzzle data, attempt results) managed with SWR or React Query.

```typescript
type PuzzlePhase = 'unanswered' | 'correct' | 'incorrect';

interface PuzzlePageState {
  phase: PuzzlePhase;
  selectedAction: Action | null;
  explanation: Explanation | null;   // populated after answer submitted
}
```

---

## 10. Auth & Sessions

| User Type | Access |
|---|---|
| Guest (no account) | Play all approved puzzles, attempt recorded with guest token |
| Registered user | Everything above + streak, history, submit puzzles, vote |
| Moderator | Everything above + moderation queue, approve/reject/flag puzzles |
| Admin | Everything above + role management, pipeline controls |

Auth.js handles OAuth (Discord recommended for the Pokémon community, Google as fallback) and magic link email login. Guest sessions are tracked via a cookie-stored UUID — no account required.

---

## 11. Deployment Architecture

```
Vercel                      Railway (or Render)
──────────────────          ──────────────────────────────
Next.js frontend      ───►  Express API server
(CDN edge rendering)        PostgreSQL database
                            Sim pipeline (cron job)
                            Explanation enrichment worker
```

All environment variables (DB connection string, Anthropic API key, Auth.js secret) stored in Railway/Vercel environment config. Never committed to source.

### Environment Variables Required

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
ANTHROPIC_API_KEY          # V2 explanations only
SIM_PIPELINE_CRON          # e.g. "0 2 * * *" for 2am nightly
AUTO_APPROVE_THRESHOLD     # vote count required for auto-approval
AUTO_APPROVE_RATIO         # upvote ratio required (0.0–1.0)
```

---

## 12. Open Technical Decisions

These need to be resolved before or during Phase 0:

| Decision | Options | Recommendation |
|---|---|---|
| Showdown engine import strategy | Full fork vs. npm package vs. git submodule | Git submodule — keeps engine updatable without a full fork |
| Game state storage | Full Showdown JSON vs. trimmed snapshot | Store both: full JSON for re-processing, snapshot for serving |
| Sim pipeline AI quality | Random AI vs. policy-guided AI for both sides | Start with Showdown's built-in random AI; upgrade later if puzzle quality is poor |
| Wrong answer generation | Hand-authored vs. auto-generated from nearby game states | Auto-generate from the same turn: pick plausible alternatives that are mechanically wrong |
| Puzzle deduplication | Exact match vs. semantic similarity | Hash key game state fields (Pokémon species, HP%, conditions) for near-duplicate detection |
| Moderation dashboard | Custom-built vs. simple DB admin panel (e.g. Retool) | Retool or similar for V1 — build custom only when moderator volume justifies it |
