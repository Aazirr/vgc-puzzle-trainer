import { redirect } from "next/navigation";

/**
 * Random puzzle route
 * Redirects to a random puzzle
 */
export async function GET() {
  // TODO: Get actual random puzzle from backend
  // For now, redirect to a mock puzzle
  redirect("/puzzles/puzzle-001");
}
