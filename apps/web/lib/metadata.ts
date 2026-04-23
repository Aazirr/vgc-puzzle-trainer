/**
 * Metadata configuration for SEO and social sharing
 */

import type { Metadata } from "next";

export const siteMetadata: Metadata = {
  title: "VGC Puzzle Trainer",
  description:
    "Master the mechanics of VGC doubles with deterministic puzzles. Train your speed calculations, KO thresholds, and field interactions.",
  keywords: [
    "VGC",
    "Pokémon",
    "Competitive",
    "Puzzles",
    "Training",
    "Doubles",
    "Game Mechanics",
  ],
  authors: [{ name: "VGC Puzzle Trainer Team" }],
  creator: "VGC Puzzle Trainer",
  robots: "index, follow",
  openGraph: {
    title: "VGC Puzzle Trainer",
    description:
      "Master the mechanics of VGC doubles with deterministic puzzles.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VGC Puzzle Trainer",
    description: "Master the mechanics of VGC doubles with deterministic puzzles.",
  },

  // viewport/colorScheme moved to layout.tsx to fix warnings

  formatDetection: {
    email: false,
    telephone: false,
  },
};

/**
 * Per-page metadata builders
 */
export function generatePuzzleMetadata(puzzleId: string): Metadata {
  return {
    title: `Puzzle ${puzzleId} - VGC Puzzle Trainer`,
    description: "Solve this VGC puzzle and master competitive mechanics.",
    openGraph: {
      title: `VGC Puzzle ${puzzleId}`,
      description: "Train your VGC fundamentals with this puzzle.",
      type: "website",
    },
  };
}
