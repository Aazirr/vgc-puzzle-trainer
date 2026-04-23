# @vgc/api

Express API server for auth, puzzle serving, submissions, voting, and moderation.

## Phase 0 backend foundation

- Structured app/bootstrap entrypoint
- Route modules for health and puzzle contract stubs
- Initial SQL migration for core data model
- Shared puzzle contracts imported from `packages/domain`

## Auth bridge

The API exposes minimal email/password auth endpoints to unblock the current frontend login/register flow:

- `POST /auth/register`
- `POST /auth/login`

Required runtime environment:

- `DATABASE_URL`
- `CORS_ORIGIN` when the frontend is served from another origin

## Puzzle API

The API exposes the Phase 1 puzzle loop foundation:

- `GET /api/puzzles`
- `GET /api/puzzles/random`
- `GET /api/puzzles/:id`
- `POST /api/puzzles/:id/answer`
- `GET /api/attempts`
- `GET /api/users/:id/progress`

Puzzle fetch responses include shuffled action choices without correctness labels and do not include the explanation until after answer submission. Answer submissions compare the selected action to the stored deterministic correct action and record an attempt when the puzzle exists.

If an answer submission does not include a `guestToken`, the API generates one and returns it in the response so clients can persist guest attempt continuity. If a submission includes `userId`, the API updates `user_streaks` and authenticated progress can be read from `/api/users/:id/progress`.
