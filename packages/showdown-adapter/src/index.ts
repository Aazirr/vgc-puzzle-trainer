import { createRequire } from "node:module";

export interface ShowdownAdapterSummary {
  source: string;
  battleExportCount: number;
  dexExportCount: number;
  ready: boolean;
  error?: string;
}

interface ShowdownModules {
  battle: Record<string, unknown>;
  dex: Record<string, unknown>;
}

let cachedModules: ShowdownModules | null = null;
let cachedError: string | null = null;

function loadShowdownModules(): ShowdownModules | null {
  if (cachedModules) return cachedModules;
  if (cachedError) return null;

  const require = createRequire(import.meta.url);
  const candidatePairs = [
    ["pokemon-showdown/sim/battle", "pokemon-showdown/sim/dex"],
    ["pokemon-showdown/dist/sim/battle", "pokemon-showdown/dist/sim/dex"],
    ["pokemon-showdown/sim/battle.js", "pokemon-showdown/sim/dex.js"],
    ["pokemon-showdown/dist/sim/battle.js", "pokemon-showdown/dist/sim/dex.js"]
  ] as const;

  for (const [battlePath, dexPath] of candidatePairs) {
    try {
      const battle = require(battlePath) as Record<string, unknown>;
      const dex = require(dexPath) as Record<string, unknown>;
      cachedModules = { battle, dex };
      return cachedModules;
    } catch {
      // Continue trying alternate import paths.
    }
  }

  cachedError = "pokemon-showdown runtime modules were not found";
  return null;
}

export function getShowdownAdapterSummary(): ShowdownAdapterSummary {
  const modules = loadShowdownModules();
  if (!modules) {
    return {
      source: "vendor/pokemon-showdown",
      battleExportCount: 0,
      dexExportCount: 0,
      ready: false,
      error: cachedError ?? "unknown showdown adapter load error"
    };
  }

  return {
    source: "vendor/pokemon-showdown",
    battleExportCount: Object.keys(modules.battle).length,
    dexExportCount: Object.keys(modules.dex).length,
    ready: true
  };
}

export function adapterStatus(): string {
  return "showdown adapter scaffold ready";
}
