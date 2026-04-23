import { PuzzlePageV2 } from "../../../components/vgc-puzzle-trainer-v2";
import { getPuzzleById, getStaticPuzzleIds } from "@/lib/puzzles";

/**
 * Puzzle page layout
 * Fetches puzzle data and renders the puzzle UI using the V2 interface
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const puzzle = getPuzzleById(id);
  if (!puzzle) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Puzzle not found</h1>
        <p>The puzzle you're looking for doesn't exist.</p>
      </main>
    );
  }

  return <PuzzlePageV2 puzzle={puzzle} />;
}

/**
 * Generate static params for known puzzles
 * This enables ISR (Incremental Static Regeneration)
 */
export async function generateStaticParams() {
  return getStaticPuzzleIds().map((id) => ({ id }));
}
