import type { Puzzle } from "@/types";

const mockPuzzle: Puzzle = {
  id: "puzzle-001",
  source: "sim",
  format: "reg-h",
  gameState: {
    turn: 5,
    weather: "tailwind",
    terrain: null,
    pseudoWeather: [],
    p1: {
      sideConditions: [],
      active: [
        {
          species: "Landorus-Therian",
          level: 50,
          currentHp: 100,
          maxHp: 120,
          status: null,
          statBoosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, hp: 0 },
          moves: ["Earthquake", "U-turn", "Stealth Rock", "Superpower"],
          item: "Assault Vest",
          ability: "Intimidate",
          stats: { hp: 120, atk: 145, def: 90, spa: 105, spd: 100, spe: 115 },
        },
        {
          species: "Indeedee-F",
          level: 50,
          currentHp: 95,
          maxHp: 95,
          status: null,
          statBoosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, hp: 0 },
          moves: ["Psychic", "Dazzling Gleam", "Trick Room", "Follow Me"],
          item: "Redcard",
          ability: "Psychic Surge",
          stats: { hp: 95, atk: 55, def: 80, spa: 105, spd: 105, spe: 75 },
        },
      ],
      bench: [
        {
          species: "Rillaboom",
          level: 50,
          currentHp: 120,
          maxHp: 120,
          status: null,
          statBoosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, hp: 0 },
          moves: [],
          item: null,
          ability: "Grassy Surge",
          stats: { hp: 120, atk: 115, def: 90, spa: 65, spd: 90, spe: 85 },
        },
      ],
    },
    p2: {
      sideConditions: [],
      active: [
        {
          species: "Incineroar",
          level: 50,
          currentHp: 45,
          maxHp: 110,
          status: null,
          statBoosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 1, hp: 0 },
          moves: ["Flare Blitz", "Fake Out", "Low Kick", "Knock Off"],
          item: "Assault Vest",
          ability: "Blaze",
          stats: { hp: 110, atk: 145, def: 90, spa: 80, spd: 85, spe: 100 },
        },
        {
          species: "Togekiss",
          level: 50,
          currentHp: 110,
          maxHp: 110,
          status: null,
          statBoosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, hp: 0 },
          moves: ["Air Stream", "Dazzling Gleam", "Protect", "Follow Me"],
          item: "Choice Scarf",
          ability: "Serene Grace",
          stats: { hp: 110, atk: 50, def: 95, spa: 120, spd: 115, spe: 80 },
        },
      ],
      bench: [
        {
          species: "Urshifu",
          level: 50,
          currentHp: 130,
          maxHp: 130,
          status: null,
          statBoosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, hp: 0 },
          moves: [],
          item: null,
          ability: "Unseen Fist",
          stats: { hp: 130, atk: 140, def: 95, spa: 75, spd: 60, spe: 120 },
        },
      ],
    },
  },
  playerSide: "p1",
  questionType: "speed_check",
  correctAction: {
    type: "move",
    move: "Earthquake",
    target: "p2a",
  },
  wrongActions: [
    {
      type: "move",
      move: "U-turn",
      target: "p2a",
    },
    {
      type: "switch",
      value: "Rillaboom",
    },
  ],
  explanation: {
    template_type: "speed_check",
    fields: {
      p1_pokemon: "Landorus-Therian",
      p1_speed: 115,
      p1_boost: 0,
      p2_pokemon: "Incineroar",
      p2_speed: 100,
      p2_boost: 1,
      field_effect: "Tailwind (boosts Speed by 1.5x for your Pokemon)",
      winner: "Landorus-Therian outspeeds Incineroar",
      reasoning:
        "Landorus at 115 SPE with Tailwind (172.5) vs Incineroar at 100 SPE + 1 (200). Actually Incineroar is faster, but you need to KO Incineroar first to win.",
    },
    ai_text:
      "Incineroar is at 41% HP after taking damage. Landorus-Therian's Earthquake will guarantee the KO since it deals 100+ damage to Incineroar. This ends the threat immediately.",
  },
  difficulty: 2,
  tags: ["speed_check", "tailwind", "damage_calculation"],
  status: "approved",
  upvotes: 23,
  downvotes: 2,
};

export function getPuzzleById(id: string): Puzzle | null {
  if (id === "random" || id === "puzzle-001") {
    return mockPuzzle;
  }

  return null;
}

export function getStaticPuzzleIds(): string[] {
  return ["puzzle-001", "random"];
}
