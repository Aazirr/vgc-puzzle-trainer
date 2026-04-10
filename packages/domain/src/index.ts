export type PuzzleSource = "sim" | "replay" | "community";
export type QuestionType = "speed_check" | "ko_threshold" | "field_interaction";

export interface PuzzleRecord {
  id: string;
  source: PuzzleSource;
  format: string;
  questionType: QuestionType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}
