export type PuzzleSource = "sim" | "replay" | "community";
export type QuestionType = "speed_check" | "ko_threshold" | "field_interaction";
export type PuzzleStatus = "pending" | "approved" | "flagged" | "rejected";
export type SideIdentifier = "p1" | "p2";

export interface PuzzleAction {
  type: string;
  move?: string;
  target?: string;
  value?: string | number;
}

export interface PuzzleExplanation {
  templateType: QuestionType;
  fields: Record<string, string | number | boolean | string[]>;
  aiText?: string;
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
    def: number;
    spd: number;
  };
}

export interface SideSnapshot {
  sideConditions: string[];
  active: PokemonSnapshot[];
  bench: PokemonSnapshot[];
}

export interface GameStateSnapshot {
  turn: number;
  weather: string | null;
  terrain: string | null;
  pseudoWeather: string[];
  p1: SideSnapshot;
  p2: SideSnapshot;
}

export interface PuzzleRecord {
  id: string;
  source: PuzzleSource;
  format: string;
  gameState: GameStateSnapshot;
  playerSide: SideIdentifier;
  questionType: QuestionType;
  correctAction: PuzzleAction;
  wrongActions: PuzzleAction[];
  explanation: PuzzleExplanation;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  status: PuzzleStatus;
  rejectionReason?: string | null;
  upvotes?: number;
  downvotes?: number;
}
