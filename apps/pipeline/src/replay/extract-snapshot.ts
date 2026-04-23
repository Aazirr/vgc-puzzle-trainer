import type { ReplayEvent, ReplayGameStateSnapshot } from "./types.js";
import { rebuildBattleState } from "./rebuild-battle-state.js";

export function extractSnapshot(events: ReplayEvent[]): ReplayGameStateSnapshot {
  return rebuildBattleState(events);
}
