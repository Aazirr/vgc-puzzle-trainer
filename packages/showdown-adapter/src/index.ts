import * as BattleModule from "pokemon-showdown/sim/battle";
import * as DexModule from "pokemon-showdown/sim/dex";

export interface ShowdownAdapterSummary {
  source: string;
  battleExportCount: number;
  dexExportCount: number;
}

export function getShowdownAdapterSummary(): ShowdownAdapterSummary {
  return {
    source: "vendor/pokemon-showdown",
    battleExportCount: Object.keys(BattleModule).length,
    dexExportCount: Object.keys(DexModule).length
  };
}export function adapterStatus(): string {
  return "showdown adapter scaffold ready";
}
