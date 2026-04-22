import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Submit puzzle answer
 * POST /api/puzzles/submit
 *
 * Body:
 * - puzzleId: string
 * - selectedAction: { type, move?, target?, value? }
 * - timeTaken: number (ms)
 */
export async function POST(request: NextRequest) {
  try {
    // Validate content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.puzzleId || !body.selectedAction || typeof body.timeTaken !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic rate limiting (1 request per second per IP)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    // TODO: Implement proper rate limiting with Redis or similar

    // TODO: Validate against backend API
    // For now, return mock response
    const isCorrect = body.selectedAction.move === "correct_move";

    return NextResponse.json({
      isCorrect,
      puzzleId: body.puzzleId,
      timeTaken: body.timeTaken,
      message: isCorrect ? "Correct!" : "Try again!",
    });
  } catch (error) {
    console.error("Puzzle submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Validate method
 */
export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
