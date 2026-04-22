"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BattleField } from "./BattleField";
import { PuzzleQuestion, PuzzleExplanation } from "./PuzzleQuestion";
import { usePuzzleAttempt, useFormSubmit } from "../lib/hooks";
import { RateLimiter, sanitizeInput } from "../lib/security";
import type { Puzzle, PuzzleAnswer } from "@/types";
import styles from "./puzzle.module.css";

// Rate limiter for submissions
const submitLimiter = new RateLimiter(5, 60000);

interface PuzzlePageProps {
  puzzle: Puzzle;
}

/**
 * Main puzzle page component
 * Displays battle state and handles answer submission
 */
export function PuzzlePage({ puzzle }: PuzzlePageProps) {
  const router = useRouter();
  const attempt = usePuzzleAttempt();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { submit: submitAnswer, isLoading } = useFormSubmit<PuzzleAnswer>(
    async (data) => {
      // Rate limiting check
      if (!submitLimiter.isAllowed("puzzle_submit")) {
        throw new Error("Too many submissions. Please try again later.");
      }

      const response = await fetch("/api/puzzles/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          puzzleId: puzzle.id,
          selectedAction: data.selectedAction,
          timeTaken: data.timeTaken,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer. Please try again.");
      }

      const result = await response.json();
      attempt.setIsCorrect(result.isCorrect);
      setSubmitted(true);
      setServerError(null);
    },
    undefined,
    (error) => {
      setServerError(error.message);
    }
  );

  const handleSelectAnswer = (actionIndex: number) => {
    if (!submitted) {
      attempt.submitAnswer(String(actionIndex));
    }
  };

  const handleSubmitAnswer = () => {
    if (attempt.selectedAnswer === null) return;

    const selectedIdx = parseInt(attempt.selectedAnswer, 10);
    if (Number.isNaN(selectedIdx)) return;

    const allActions = [puzzle.correctAction, ...puzzle.wrongActions];
    const selectedAction = allActions[selectedIdx];
    if (!selectedAction) return;

    const isCorrect = selectedIdx === 0;
    attempt.setIsCorrect(isCorrect);

    // Submit to server
    submitAnswer({
      puzzleId: puzzle.id,
      selectedAction,
      timeTaken: attempt.elapsedTime,
      isCorrect,
    });
  };

  const handleNextPuzzle = () => {
    attempt.resetAttempt();
    setSubmitted(false);
    router.push("/puzzles/random");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>VGC Puzzle Trainer</h1>
        <div className={styles.puzzleInfo}>
          <span className={styles.difficulty}>
            {"⭐".repeat(puzzle.difficulty)}
          </span>
          <span className={styles.format}>{puzzle.format}</span>
        </div>
      </header>

      <main className={styles.main}>
        {/* Battle Field */}
        <section className={styles.battleSection}>
          <BattleField
            gameState={puzzle.gameState}
            playerSide={puzzle.playerSide}
          />
        </section>

        {/* Question/Explanation */}
        <section className={styles.questionSection}>
          {!submitted ? (
            <PuzzleQuestion
              puzzle={puzzle}
              selectedAnswer={attempt.selectedAnswer}
              isSubmitting={isLoading}
              onSelectAnswer={handleSelectAnswer}
              onSubmit={handleSubmitAnswer}
            />
          ) : attempt.isCorrect !== null ? (
            <>
              <PuzzleExplanation
                isCorrect={attempt.isCorrect}
                explanation={puzzle.explanation}
                correctAction={puzzle.correctAction}
                difficulty={puzzle.difficulty}
                tags={puzzle.tags}
              />
              <button
                className={styles.nextButton}
                onClick={handleNextPuzzle}
              >
                Next Puzzle →
              </button>
            </>
          ) : null}

          {serverError && (
            <div className={styles.error} role="alert">
              {sanitizeInput(serverError)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
