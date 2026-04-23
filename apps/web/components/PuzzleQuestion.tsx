"use client";

import styles from "./PuzzleQuestion.module.css";
import type { Puzzle, PuzzleAction } from "../types";
import { QUESTION_TYPE_LABELS } from "../lib/constants";

interface PuzzleQuestionProps {
  puzzle: Puzzle;
  selectedAnswer: string | null;
  isSubmitting: boolean;
  onSelectAnswer: (actionIndex: number) => void;
  onSubmit: () => void;
}

/**
 * Display puzzle question with multiple choice answers
 */
export function PuzzleQuestion({
  puzzle,
  selectedAnswer,
  isSubmitting,
  onSelectAnswer,
  onSubmit,
}: PuzzleQuestionProps) {
  const allActions = [puzzle.correctAction, ...puzzle.wrongActions];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>What's the best move?</h2>
        <p className={styles.subtitle}>
          {QUESTION_TYPE_LABELS[puzzle.questionType]}
        </p>
      </div>

      <div className={styles.actions}>
        {allActions.map((action, idx) => (
          <button
            key={idx}
            className={`${styles.actionButton} ${
              selectedAnswer === String(idx) ? styles.selected : ""
            }`}
            onClick={() => onSelectAnswer(idx)}
            disabled={isSubmitting}
          >
            <div className={styles.actionContent}>
              {action.type === "move" && (
                <>
                  <div className={styles.actionType}>Move</div>
                  <div className={styles.actionName}>{action.move}</div>
                  {action.target && (
                    <div className={styles.actionTarget}>
                      Target: {action.target}
                    </div>
                  )}
                </>
              )}
              {action.type === "switch" && (
                <>
                  <div className={styles.actionType}>Switch</div>
                  <div className={styles.actionName}>{action.value}</div>
                </>
              )}
            </div>
            <div
              className={styles.checkmark}
              aria-hidden="true"
            >
              ✓
            </div>
          </button>
        ))}
      </div>

      <button
        className={styles.submitButton}
        onClick={onSubmit}
        disabled={selectedAnswer === null || isSubmitting}
      >
        {isSubmitting ? "Checking..." : "Submit Answer"}
      </button>
    </div>
  );
}

/**
 * Display explanation after answer is submitted
 */
interface PuzzleExplanationProps {
  isCorrect: boolean;
  explanation: Puzzle["explanation"];
  correctAction: PuzzleAction;
  difficulty: number;
  tags: string[];
}

export function PuzzleExplanation({
  isCorrect,
  explanation,
  correctAction,
  difficulty,
  tags,
}: PuzzleExplanationProps) {
  return (
    <div className={`${styles.explanationContainer} ${
      isCorrect ? styles.correct : styles.incorrect
    }`}>
      <div className={styles.resultHeader}>
        <div className={styles.resultIcon}>
          {isCorrect ? "✓" : "✗"}
        </div>
        <div>
          <h3>{isCorrect ? "Correct!" : "Incorrect"}</h3>
          <p className={styles.resultMessage}>
            {isCorrect
              ? "Great job! You found the optimal move."
              : "Not quite right. Here's the correct answer:"}
          </p>
        </div>
      </div>

      {!isCorrect && (
        <div className={styles.correctAnswer}>
          <strong>Correct Move:</strong> {correctAction.move || correctAction.value}
        </div>
      )}

      <div className={styles.explanationContent}>
        <h4>Explanation</h4>
        {explanation.ai_text ? (
          <p>{explanation.ai_text}</p>
        ) : (
          <div className={styles.templateExplanation}>
            <pre>{JSON.stringify(explanation.fields, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className={styles.metadata}>
        <div className={styles.metaItem}>
          <strong>Difficulty:</strong> {"⭐".repeat(difficulty)}
        </div>
        {tags.length > 0 && (
          <div className={styles.metaItem}>
            <strong>Tags:</strong>
            <div className={styles.tagList}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
