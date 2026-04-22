// Pokemon types from Showdown/domain
export type PuzzleSource = "sim" | "replay" | "community";
export type QuestionType = "speed_check" | "ko_threshold" | "field_interaction";

export interface GameStateSnapshot {
  turn: number;
  weather: string | null;
  terrain: string | null;
  pseudoWeather: string[];
  p1: SideSnapshot;
  p2: SideSnapshot;
}

export interface SideSnapshot {
  sideConditions: string[];
  active: PokemonSnapshot[];
  bench: PokemonSnapshot[];
}

export interface PokemonSnapshot {
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
    spd: number;
    def: number;
    hp: number;
  };
}

export interface PuzzleAction {
  type: "move" | "switch";
  move?: string;
  target?: "p1a" | "p1b" | "p2a" | "p2b";
  value?: string;
}

export interface Puzzle {
  id: string;
  source: PuzzleSource;
  format: string;
  gameState: GameStateSnapshot;
  playerSide: "p1" | "p2";
  questionType: QuestionType;
  correctAction: PuzzleAction;
  wrongActions: PuzzleAction[];
  explanation: {
    template_type: string;
    fields: Record<string, unknown>;
    ai_text?: string;
  };
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  status: "pending" | "approved" | "flagged" | "rejected";
  upvotes: number;
  downvotes: number;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  spriteUrl: string;
  artworkUrl: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
}

export interface PuzzleAnswer {
  puzzleId: string;
  selectedAction: PuzzleAction;
  timeTaken: number;
  isCorrect: boolean;
}
