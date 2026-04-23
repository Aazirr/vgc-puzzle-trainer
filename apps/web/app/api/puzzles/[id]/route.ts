import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPuzzleById } from "@/lib/puzzles";

/**
 * Get puzzle by ID
 * GET /api/puzzles/:id
 */
export async function GET(request: NextRequest) {
  try {
    // Extract puzzle ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const puzzleId = pathParts[pathParts.length - 1];

    // Validate puzzle ID format
    if (!puzzleId || puzzleId.length < 3) {
      return NextResponse.json(
        { error: "Invalid puzzle ID" },
        { status: 400 }
      );
    }

    // TODO: Fetch from actual backend API
    // For now, return mock data
    const puzzle = getPuzzleById(puzzleId);
    if (puzzle) {
      return NextResponse.json(puzzle, {
        headers: {
          "Cache-Control": "max-age=300, s-maxage=300", // Cache for 5 minutes
        },
      });
    }

    return NextResponse.json(
      { error: "Puzzle not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Puzzle fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
