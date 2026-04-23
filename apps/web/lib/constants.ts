/**
 * App constants and configuration
 */

export const PUZZLE_DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
  5: "Master",
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  speed_check: "Speed Check",
  ko_threshold: "KO Threshold",
  field_interaction: "Field Interaction",
};

export const WEATHER_ICONS: Record<string, string> = {
  sunny: "☀️",
  rain: "🌧️",
  sandstorm: "🌪️",
  hail: "❄️",
  heavy_rain: "⛈️",
};

export const TERRAIN_ICONS: Record<string, string> = {
  grassy: "🌿",
  electric: "⚡",
  psychic: "🧠",
  misty: "🌫️",
};

export const STATUS_COLORS: Record<string, string> = {
  burn: "#ff6b35",
  paralysis: "#ffd700",
  poison: "#9933ff",
  sleep: "#3366ff",
  freeze: "#66ccff",
};

export const TYPE_COLORS: Record<string, string> = {
  normal: "#a8a878",
  fire: "#f08030",
  water: "#6890f0",
  electric: "#f8d030",
  grass: "#78c850",
  ice: "#98d8d8",
  fighting: "#c03028",
  poison: "#a040a0",
  ground: "#e0c068",
  flying: "#a890f0",
  psychic: "#f85888",
  bug: "#a8b820",
  rock: "#b8a038",
  ghost: "#705898",
  dragon: "#7038f8",
  dark: "#705848",
  steel: "#b8b8d0",
  fairy: "#ee99ac",
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
