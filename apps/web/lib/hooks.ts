"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Hook to fetch puzzle data
 */
export function usePuzzle(puzzleId?: string) {
  return useSWR(puzzleId ? `/api/puzzles/${puzzleId}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
  });
}

/**
 * Hook to fetch random puzzle
 */
export function useRandomPuzzle(difficulty?: number) {
  const params = difficulty ? `?difficulty=${difficulty}` : "";
  return useSWR(`/api/puzzles/random${params}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
}

/**
 * Hook to track local attempt state
 */
export function usePuzzleAttempt() {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState(Date.now());

  const submitAnswer = (answerId: string) => {
    setSelectedAnswer(answerId);
    // isCorrect will be set after validation
  };

  const resetAttempt = () => {
    setIsCorrect(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  return {
    isCorrect,
    selectedAnswer,
    showExplanation,
    setIsCorrect,
    setShowExplanation,
    submitAnswer,
    resetAttempt,
    elapsedTime: Date.now() - startTime,
  };
}

/**
 * Hook for client-side form submission with validation
 */
export function useFormSubmit<T>(
  onSubmit: (data: T) => Promise<void>,
  onSuccess?: () => void,
  onError?: (error: Error) => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = async (data: T) => {
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(data);
      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { submit, isLoading, error };
}

/**
 * Hook to track performance metrics
 */
export function usePerformanceMetrics() {
  useEffect(() => {
    // Use Web Vitals API
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Log metrics for monitoring
          console.debug("Performance metric:", entry.name, entry);
        }
      });

      observer.observe({
        entryTypes: ["largest-contentful-paint", "first-input", "layout-shift"],
      });

      return () => observer.disconnect();
    }
  }, []);
}
