export type ReplayEvent =
  | { type: "turn"; turn: number }
  | { type: "weather"; weather: string }
  | { type: "fieldstart"; effect: string }
  | { type: "fieldend"; effect: string }
  | { type: "sidestart"; side: "p1" | "p2"; condition: string }
  | { type: "sideend"; side: "p1" | "p2"; condition: string }
  | { type: "switch"; side: "p1" | "p2"; species: string; hp: string | null }
  | { type: "move"; actor: string; move: string; target?: string }
  | { type: "damage"; target: string; hp: string }
  | { type: "heal"; target: string; hp: string }
  | { type: "status"; target: string; status: string }
  | { type: "curestatus"; target: string; status?: string }
  | { type: "boost"; target: string; stat: string; amount: number }
  | { type: "unboost"; target: string; stat: string; amount: number }
  | { type: "unknown"; raw: string };

export interface ReplayPokemonSnapshot {
  species: string;
  level: number;
  currentHp: number;
  maxHp: number;
  status: string | null;
  statBoosts: Record<string, number>;
  moves: string[];
  item: string | null;
  ability: string;
  stats: {
    spe: number;
    atk: number;
    spa: number;
    def: number;
    spd: number;
  };
}

export interface ReplaySideSnapshot {
  sideConditions: string[];
  active: ReplayPokemonSnapshot[];
  bench: ReplayPokemonSnapshot[];
}

export interface ReplayGameStateSnapshot {
  turn: number;
  weather: string | null;
  terrain: string | null;
  pseudoWeather: string[];
  p1: ReplaySideSnapshot;
  p2: ReplaySideSnapshot;
}
