import { PuzzlePage } from "../../../components/PuzzlePage";

interface PuzzlePageParams {
  params: {
    id: string;
  };
}

/**
 * Puzzle page layout
 * Fetches puzzle data and renders the puzzle UI
 */
export default async function Page({ params }: PuzzlePageParams) {
  const { id } = await params;

  // Fetch puzzle from API
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/puzzles/${id}`, {
    next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
  });

  if (!response.ok) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Puzzle not found</h1>
        <p>The puzzle you're looking for doesn't exist.</p>
      </main>
    );
  }

  const puzzle = await response.json();

  return <PuzzlePage puzzle={puzzle} />;
}

/**
 * Generate static params for known puzzles
 * This enables ISR (Incremental Static Regeneration)
 */
export async function generateStaticParams() {
  // TODO: Fetch list of puzzle IDs from backend
  return [
    { id: "puzzle-001" },
    { id: "random" },
  ];
}
