CREATE INDEX IF NOT EXISTS idx_attempts_guest_token ON puzzle_attempts(guest_token);
CREATE INDEX IF NOT EXISTS idx_attempts_puzzle ON puzzle_attempts(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON puzzle_attempts(created_at DESC);
