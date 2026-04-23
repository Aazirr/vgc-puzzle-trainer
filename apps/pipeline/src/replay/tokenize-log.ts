import type { ReplayEvent } from "./types.js";

function parseSideIdentifier(raw: string | undefined): "p1" | "p2" | null {
  if (!raw) {
    return null;
  }

  const match = raw.match(/^(p[12])/);
  if (!match) {
    return null;
  }

  return match[1] as "p1" | "p2";
}

function parseSpecies(raw: string): string {
  const [species = "Unknown"] = raw.split(",");
  return species.trim();
}

function parseHp(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseAmount(raw: string | undefined): number {
  if (!raw) {
    return 0;
  }

  const amount = Number.parseInt(raw, 10);
  return Number.isFinite(amount) ? amount : 0;
}

function parseTarget(raw: string): string {
  const [name = "Unknown"] = raw.split("|");
  return name.trim();
}

export function tokenizeLog(rawLog: string): ReplayEvent[] {
  const events: ReplayEvent[] = [];
  const lines = rawLog
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    if (!line.startsWith("|")) {
      continue;
    }

    const parts = line.split("|").slice(1);
    const [tag = ""] = parts;

    switch (tag) {
      case "turn": {
        const turn = Number.parseInt(parts[1] ?? "0", 10);
        events.push({ type: "turn", turn: Number.isFinite(turn) ? turn : 0 });
        break;
      }
      case "-weather": {
        const weather = parts[1]?.trim();
        if (weather) {
          events.push({ type: "weather", weather });
        }
        break;
      }
      case "-fieldstart": {
        const effect = parts[1]?.trim();
        if (effect) {
          events.push({ type: "fieldstart", effect });
        }
        break;
      }
      case "-fieldend": {
        const effect = parts[1]?.trim();
        if (effect) {
          events.push({ type: "fieldend", effect });
        }
        break;
      }
      case "-sidestart": {
        const [sideRaw = "", conditionRaw = ""] = parts[1]?.split(":") ?? [];
        const side = parseSideIdentifier(sideRaw);
        const condition = conditionRaw.trim();
        if (side && condition) {
          events.push({ type: "sidestart", side, condition });
        }
        break;
      }
      case "-sideend": {
        const [sideRaw = "", conditionRaw = ""] = parts[1]?.split(":") ?? [];
        const side = parseSideIdentifier(sideRaw);
        const condition = conditionRaw.trim();
        if (side && condition) {
          events.push({ type: "sideend", side, condition });
        }
        break;
      }
      case "switch": {
        const side = parseSideIdentifier(parts[1]);
        const species = parts[2] ? parseSpecies(parts[2]) : "Unknown";
        const hp = parseHp(parts[3]);
        if (side) {
          events.push({ type: "switch", side, species, hp });
        }
        break;
      }
      case "move": {
        const actor = parseTarget(parts[1] ?? "Unknown");
        const move = parts[2]?.trim() ?? "Unknown";
        const target = parts[3]?.trim();
        events.push({ type: "move", actor, move, target });
        break;
      }
      case "-damage": {
        const target = parseTarget(parts[1] ?? "Unknown");
        const hp = parts[2]?.trim();
        if (hp) {
          events.push({ type: "damage", target, hp });
        }
        break;
      }
      case "-heal": {
        const target = parseTarget(parts[1] ?? "Unknown");
        const hp = parts[2]?.trim();
        if (hp) {
          events.push({ type: "heal", target, hp });
        }
        break;
      }
      case "-status": {
        const target = parseTarget(parts[1] ?? "Unknown");
        const status = parts[2]?.trim();
        if (status) {
          events.push({ type: "status", target, status });
        }
        break;
      }
      case "-curestatus": {
        const target = parseTarget(parts[1] ?? "Unknown");
        const status = parts[2]?.trim();
        events.push({ type: "curestatus", target, status });
        break;
      }
      case "-boost": {
        const target = parseTarget(parts[1] ?? "Unknown");
        const stat = parts[2]?.trim() ?? "unknown";
        const amount = parseAmount(parts[3]);
        events.push({ type: "boost", target, stat, amount });
        break;
      }
      case "-unboost": {
        const target = parseTarget(parts[1] ?? "Unknown");
        const stat = parts[2]?.trim() ?? "unknown";
        const amount = parseAmount(parts[3]);
        events.push({ type: "unboost", target, stat, amount });
        break;
      }
      default:
        events.push({ type: "unknown", raw: line });
        break;
    }
  }

  return events;
}
