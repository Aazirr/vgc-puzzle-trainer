"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface PokemonSnapshot {
  name: string;
  hp: number;
  max_hp: number;
  speed: number;
  status: string | null;
  item: string;
  types: string[];
  tera: boolean;
}

interface GameState {
  your_side: PokemonSnapshot[];
  opp_side: PokemonSnapshot[];
  field: {
    weather: string | null;
    terrain: string | null;
    trick_room: boolean;
    trick_room_turns?: number;
  };
}

interface PuzzleAction {
  id: string;
  label: string;
  correct: boolean;
}

interface Puzzle {
  id: string;
  question_type: string;
  difficulty: number;
  title: string;
  prompt: string;
  game_state: GameState;
  actions: PuzzleAction[];
  explanation: { mechanical: string; pattern_tip: string };
  tags: string[];
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  Fire: "#E8623A", Water: "#4D9BE6", Grass: "#5DBD5D", Electric: "#F5C142",
  Psychic: "#E8609A", Ice: "#7CD4D4", Dragon: "#6B60C8", Dark: "#5A4E5A",
  Fairy: "#E98DCC", Fighting: "#C44B3D", Poison: "#9A5CAE", Ground: "#C9A84C",
  Flying: "#8EA8DD", Bug: "#A4C43E", Rock: "#B8A86C", Ghost: "#6A5B9E",
  Steel: "#9BAAB8", Normal: "#A8A07C",
};

const QUESTION_LABELS: Record<string, { label: string; color: string }> = {
  speed_check:       { label: "SPEED CHECK",        color: "#7db4ff" },
  ko_threshold:      { label: "KO THRESHOLD",       color: "#ff8080" },
  field_interaction: { label: "FIELD INTERACTION",  color: "#F5C142" },
};

const TERRAIN_COLORS: Record<string, string> = {
  "Electric Terrain": "#F5C142",
  "Psychic Terrain":  "#E8609A",
  "Misty Terrain":    "#E98DCC",
  "Grassy Terrain":   "#5DBD5D",
};

// ─── SECURITY ─────────────────────────────────────────────────────────────────
const sanitize = (s: string) =>
  String(s).replace(/[<>&"'`]/g, (c) => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&#39;","`":"&#96;"}[c] ?? c));

const POKEAPI_ORIGIN = "https://pokeapi.co";
const pokeCache = new Map<string, string | null>();

async function fetchSprite(name: string): Promise<string | null> {
  const key = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (pokeCache.has(key)) return pokeCache.get(key) ?? null;
  try {
    const url = new URL(`/api/v2/pokemon/${encodeURIComponent(key)}`, POKEAPI_ORIGIN);
    if (url.origin !== POKEAPI_ORIGIN) return null;
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) { pokeCache.set(key, null); return null; }
    const data = await res.json();
    const sprite: string | null =
      data?.sprites?.other?.["official-artwork"]?.front_default ??
      data?.sprites?.front_default ?? null;
    pokeCache.set(key, sprite);
    return sprite;
  } catch {
    pokeCache.set(key, null);
    return null;
  }
}

// ─── PUZZLE DATA ──────────────────────────────────────────────────────────────
const PUZZLES: Puzzle[] = [
  {
    id: "pzl-001",
    question_type: "speed_check",
    difficulty: 1,
    title: "Outspeeding the Threat",
    prompt:
      "Your Miraidon is at +0 speed. The opponent's Iron Hands is also +0 with no boosts. Electric Terrain is active. Which of your active Pokémon is guaranteed to move before Iron Hands this turn?",
    game_state: {
      your_side: [
        { name: "Miraidon",     hp: 100, max_hp: 167, speed: 135, status: null, item: "Choice Specs",    types: ["Electric","Dragon"], tera: false },
        { name: "Flutter Mane", hp: 78,  max_hp: 131, speed: 135, status: null, item: "Focus Sash",      types: ["Ghost","Fairy"],     tera: false },
      ],
      opp_side: [
        { name: "Iron Hands",  hp: 100, max_hp: 227, speed: 50, status: null, item: "Assault Vest", types: ["Fighting","Electric"], tera: false },
        { name: "Rillaboom",   hp: 55,  max_hp: 197, speed: 85, status: null, item: "Choice Band",  types: ["Grass"],               tera: false },
      ],
      field: { weather: null, terrain: "Electric Terrain", trick_room: false },
    },
    actions: [
      { id: "a", label: "Miraidon — guaranteed faster than Iron Hands",              correct: true  },
      { id: "b", label: "Flutter Mane — same speed as Miraidon so it goes first",   correct: false },
      { id: "c", label: "They tie — Miraidon and Iron Hands share the same speed",  correct: false },
      { id: "d", label: "Iron Hands — Assault Vest boosts its priority",            correct: false },
    ],
    explanation: {
      mechanical:
        "Miraidon base Speed 135 vs Iron Hands base Speed 50. At max EVs (+Speed nature), Miraidon reaches ~205 and Iron Hands caps at ~107. Miraidon is always faster. Flutter Mane also has 135 base Speed — it ties with Miraidon, so it is NOT guaranteed to move before Iron Hands.",
      pattern_tip:
        "Electric Terrain activates Miraidon's Hadron Engine, boosting Special Attack. Confirm terrain is live before committing to an Electric-type KO.",
    },
    tags: ["speed", "terrain", "miraidon", "iron-hands"],
  },
  {
    id: "pzl-002",
    question_type: "ko_threshold",
    difficulty: 2,
    title: "Guaranteed KO — Surging Strikes",
    prompt:
      "Your Choice Band Urshifu-Rapid-Strike uses Surging Strikes (3 hits, each a guaranteed critical hit) on the opposing Dondozo at full HP. No weather, no terrain, no boosts. Does Urshifu guarantee a KO?",
    game_state: {
      your_side: [
        { name: "Urshifu-Rapid", hp: 100, max_hp: 175, speed: 97, status: null, item: "Choice Band",      types: ["Water","Fighting"], tera: false },
        { name: "Calyrex-Ice",   hp: 90,  max_hp: 175, speed: 50, status: null, item: "Weakness Policy", types: ["Psychic","Ice"],    tera: false },
      ],
      opp_side: [
        { name: "Dondozo",    hp: 100, max_hp: 285, speed: 35, status: null, item: "Leftovers",    types: ["Water"],          tera: false },
        { name: "Tatsugiri",  hp: 100, max_hp: 131, speed: 75, status: null, item: "Choice Scarf", types: ["Dragon","Water"], tera: false },
      ],
      field: { weather: null, terrain: null, trick_room: false },
    },
    actions: [
      { id: "a", label: "Yes — guaranteed 3-hit KO, each crit bypasses Unaware",       correct: true  },
      { id: "b", label: "No — Dondozo survives on minimum damage roll",                correct: false },
      { id: "c", label: "No — Tatsugiri uses Commander before Urshifu can attack",     correct: false },
      { id: "d", label: "Yes — but only if Tera is active on Urshifu",                correct: false },
    ],
    explanation: {
      mechanical:
        "Surging Strikes always deals 3 hits, each a guaranteed crit — bypassing Dondozo's Unaware and any Defense boosts. With Choice Band, Urshifu-Rapid's effective Attack is ~298. Minimum 3-hit total vs 285 HP / 100 Def Dondozo is ~107% max HP. Guaranteed KO.",
      pattern_tip:
        "Surging Strikes is the cleanest answer to Dondozo-Tatsugiri. The crit guarantee makes Unaware entirely irrelevant.",
    },
    tags: ["ko-check", "urshifu", "dondozo", "crit"],
  },
  {
    id: "pzl-003",
    question_type: "field_interaction",
    difficulty: 2,
    title: "Psychic Terrain & Spore",
    prompt:
      "Indeedee-F sets Psychic Terrain on its switch-in. Next turn, the opposing Amoonguss targets your Flutter Mane with Spore. Flutter Mane is not holding a Safety Goggles. Does Spore land?",
    game_state: {
      your_side: [
        { name: "Indeedee-F",   hp: 100, max_hp: 130, speed: 95,  status: null, item: "Psychic Seed",  types: ["Psychic","Normal"], tera: false },
        { name: "Flutter Mane", hp: 100, max_hp: 131, speed: 135, status: null, item: "Focus Sash",    types: ["Ghost","Fairy"],    tera: false },
      ],
      opp_side: [
        { name: "Amoonguss", hp: 100, max_hp: 197, speed: 30, status: null, item: "Rocky Helmet", types: ["Grass","Poison"], tera: false },
        { name: "Kingambit", hp: 100, max_hp: 191, speed: 50, status: null, item: "Black Glasses", types: ["Dark","Steel"],  tera: false },
      ],
      field: { weather: null, terrain: "Psychic Terrain", trick_room: false },
    },
    actions: [
      { id: "a", label: "No — Psychic Terrain blocks all status moves on grounded Pokémon", correct: false },
      { id: "b", label: "Yes — Flutter Mane is not grounded, Psychic Terrain does not protect it", correct: true },
      { id: "c", label: "No — Flutter Mane is Ghost-type and immune to Spore",               correct: false },
      { id: "d", label: "Yes — but only because Flutter Mane has no item to block it",       correct: false },
    ],
    explanation: {
      mechanical:
        "Psychic Terrain only protects grounded Pokémon from priority moves. It does NOT protect against Spore in any case. Flutter Mane is not grounded (it is airborne), so even if Psychic Terrain blocked sleep — which it does not — Flutter Mane would be outside its protection. Spore lands.",
      pattern_tip:
        "Psychic Terrain ≠ sleep immunity. Its only offensive effect against sleep is blocking moves that target grounded Pokémon via priority. Always verify grounded status when evaluating terrain protection.",
    },
    tags: ["terrain", "sleep", "indeedee", "flutter-mane", "amoonguss"],
  },
  {
    id: "pzl-004",
    question_type: "speed_check",
    difficulty: 3,
    title: "Trick Room Speed Reversal",
    prompt:
      "Trick Room is active (3 turns remaining). Your Calyrex-Ice Rider has no speed investment. The opponent's Miraidon has Choice Scarf. Under Trick Room, who moves first?",
    game_state: {
      your_side: [
        { name: "Calyrex-Ice", hp: 100, max_hp: 175, speed: 50, status: null, item: "Weakness Policy", types: ["Psychic","Ice"], tera: false },
        { name: "Amoonguss",   hp: 85,  max_hp: 197, speed: 30, status: null, item: "Rocky Helmet",   types: ["Grass","Poison"], tera: false },
      ],
      opp_side: [
        { name: "Miraidon",  hp: 100, max_hp: 167, speed: 135, status: null, item: "Choice Scarf", types: ["Electric","Dragon"], tera: false },
        { name: "Iron Hands", hp: 80, max_hp: 227, speed: 50,  status: null, item: "Assault Vest", types: ["Fighting","Electric"], tera: false },
      ],
      field: { weather: null, terrain: "Electric Terrain", trick_room: true, trick_room_turns: 3 },
    },
    actions: [
      { id: "a", label: "Calyrex-Ice — it has the lowest speed, moves first under Trick Room",    correct: true  },
      { id: "b", label: "Miraidon — Choice Scarf overrides Trick Room priority",                  correct: false },
      { id: "c", label: "Speed tie — Calyrex-Ice and Iron Hands share 50 base speed",            correct: false },
      { id: "d", label: "Miraidon — it always goes first in Electric Terrain",                   correct: false },
    ],
    explanation: {
      mechanical:
        "Under Trick Room, turn order is reversed: lowest final Speed acts first. Calyrex-Ice with no investment hits ~86 Speed. Miraidon with Choice Scarf hits ~307. Trick Room makes Calyrex-Ice (86) move before Miraidon (307). Choice Scarf does NOT override Trick Room — it still multiplies Speed, which only makes Miraidon slower in TR.",
      pattern_tip:
        "Choice Scarf is anti-synergistic with Trick Room — it raises speed, making the user move later. Never bring Scarf Pokémon in Trick Room unless they are the fastest on both teams.",
    },
    tags: ["trick-room", "speed", "calyrex", "miraidon", "scarf"],
  },
];

// ─── HP BAR ───────────────────────────────────────────────────────────────────
function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const color = pct > 50 ? "#2dce7a" : pct > 20 ? "#F5C142" : "#e05555";
  return (
    <div style={{ width: "100%", height: 4, background: "#1a1a2a", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.4s ease", borderRadius: 2 }} />
    </div>
  );
}

// ─── POKEMON CARD ─────────────────────────────────────────────────────────────
const PokemonCard = memo(function PokemonCard({
  mon, side,
}: { mon: PokemonSnapshot; side: "player" | "opp" }) {
  const [sprite, setSprite] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchSprite(mon.name).then((s) => { if (alive) setSprite(s); });
    return () => { alive = false; };
  }, [mon.name]);

  const primary = mon.types[0];
  const accent = TYPE_COLORS[primary] ?? "#4a4a5a";
  const hpPct = Math.round((mon.hp / mon.max_hp) * 100);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      background: `linear-gradient(155deg, #0b0d16 0%, ${accent}14 100%)`,
      border: `1px solid ${accent}28`, borderRadius: 12,
      padding: "14px 12px 12px", minWidth: 112, flex: 1, position: "relative",
    }}>
      {/* side label */}
      <span style={{
        position: "absolute", top: 6, left: 8,
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: 2,
        color: side === "player" ? "#4af0a0" : "#f04a6a", textTransform: "uppercase", fontWeight: 700,
      }}>{side === "player" ? "YOU" : "FOE"}</span>

      {/* tera indicator */}
      {mon.tera && (
        <span style={{ position: "absolute", top: 6, right: 8, fontSize: 10 }}>◈</span>
      )}

      {/* sprite */}
      <div style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
        {sprite
          ? <img src={sprite} alt={sanitize(mon.name)} width={72} height={72} loading="lazy" decoding="async"
              style={{ objectFit: "contain", filter: side === "opp" ? "brightness(0.82) hue-rotate(170deg)" : "none" }} />
          : <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1a1a2a", animation: "pulse 1.5s infinite" }} />
        }
      </div>

      {/* name */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 0.5, color: "#dde0f0", marginTop: 6, textTransform: "capitalize", textAlign: "center" }}>
        {sanitize(mon.name)}
      </div>

      {/* types */}
      <div style={{ display: "flex", gap: 3, marginTop: 5, flexWrap: "wrap", justifyContent: "center" }}>
        {mon.types.map((t) => (
          <span key={t} style={{
            background: (TYPE_COLORS[t] ?? "#666") + "25",
            border: `1px solid ${TYPE_COLORS[t] ?? "#666"}44`,
            color: TYPE_COLORS[t] ?? "#aaa",
            borderRadius: 3, padding: "1px 5px",
            fontSize: 8, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase",
          }}>{t}</span>
        ))}
      </div>

      {/* HP bar */}
      <div style={{ width: "100%", marginTop: 8 }}>
        <HpBar hp={mon.hp} maxHp={mon.max_hp} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#5a5a7a" }}>HP</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#8888aa" }}>{hpPct}%</span>
        </div>
      </div>

      {/* speed */}
      <div style={{ marginTop: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#5a5a7a" }}>
        <span style={{ color: "#7dd3fc" }}>SPD</span> {mon.speed}
      </div>

      {/* item */}
      {mon.item && (
        <div style={{ marginTop: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#4a4a6a", textAlign: "center", maxWidth: 96, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sanitize(mon.item)}
        </div>
      )}

      {/* status */}
      {mon.status && (
        <span style={{
          marginTop: 4, background: "#2a1a0a", border: "1px solid #a04a1a44",
          color: "#e08040", borderRadius: 3, padding: "1px 6px",
          fontSize: 8, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, textTransform: "uppercase",
        }}>{sanitize(mon.status)}</span>
      )}
    </div>
  );
});

// ─── FIELD BANNER ─────────────────────────────────────────────────────────────
function FieldBanner({ field }: { field: GameState["field"] }) {
  const tags: { label: string; color: string }[] = [];
  if (field.terrain) tags.push({ label: field.terrain, color: TERRAIN_COLORS[field.terrain] ?? "#aaa" });
  if (field.weather) tags.push({ label: field.weather, color: "#7dd3fc" });
  if (field.trick_room) tags.push({ label: `TRICK ROOM${field.trick_room_turns ? ` (${field.trick_room_turns})` : ""}`, color: "#c084fc" });
  if (tags.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", margin: "10px 0 0" }}>
      {tags.map((t) => (
        <span key={t.label} style={{
          background: t.color + "18", border: `1px solid ${t.color}44`,
          color: t.color, borderRadius: 6, padding: "4px 12px",
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
        }}>{t.label}</span>
      ))}
    </div>
  );
}

// ─── BATTLE FIELD ─────────────────────────────────────────────────────────────
function BattleField({ gs }: { gs: GameState }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, #05070f 0%, #0b0d18 50%, #05070f 100%)",
      border: "1px solid #151825", borderRadius: 14,
      padding: "20px 16px 16px", position: "relative", overflow: "hidden",
    }}>
      {/* grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.035,
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "20px 20px", pointerEvents: "none",
      }} />

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        {/* player side */}
        <div style={{ display: "flex", gap: 8, flex: 1 }}>
          {gs.your_side.map((m) => <PokemonCard key={m.name} mon={m} side="player" />)}
        </div>

        {/* VS */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#1e2035", letterSpacing: 2 }}>VS</div>

        {/* opp side */}
        <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "flex-end" }}>
          {gs.opp_side.map((m) => <PokemonCard key={m.name} mon={m} side="opp" />)}
        </div>
      </div>

      <FieldBanner field={gs.field} />
    </div>
  );
}

// ─── ANSWER BUTTON ────────────────────────────────────────────────────────────
function AnswerBtn({
  action, selected, revealed, onClick,
}: { action: PuzzleAction; selected: boolean; revealed: boolean; onClick: () => void }) {
  let bg = "#09090f", border = "#151825", color = "#b0b0c8";
  if (selected && !revealed)  { bg = "#0e1428"; border = "#4a7fff"; color = "#fff"; }
  if (revealed && action.correct) { bg = "#081d12"; border = "#2dce7a"; color = "#2dce7a"; }
  if (revealed && selected && !action.correct) { bg = "#1a0808"; border = "#e05555"; color = "#e05555"; }

  return (
    <button
      onClick={onClick}
      disabled={revealed}
      aria-pressed={selected}
      style={{
        width: "100%", textAlign: "left", padding: "13px 16px",
        background: bg, border: `1px solid ${border}`, borderRadius: 9,
        color, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 0.2,
        cursor: revealed ? "default" : "pointer", transition: "all 0.18s ease",
        display: "flex", alignItems: "center", gap: 12, outline: "none",
      }}
      onMouseEnter={(e) => { if (!revealed) (e.currentTarget as HTMLButtonElement).style.borderColor = "#4a7fff44"; }}
      onMouseLeave={(e) => { if (!revealed) (e.currentTarget as HTMLButtonElement).style.borderColor = "#151825"; }}
    >
      <span style={{
        width: 24, height: 24, borderRadius: 5, border: `1px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 700, flexShrink: 0,
        background: selected ? border + "30" : "transparent",
      }}>
        {action.id.toUpperCase()}
      </span>
      <span style={{ flex: 1 }}>{action.label}</span>
      {revealed && action.correct   && <span style={{ fontSize: 14, marginLeft: "auto" }}>✓</span>}
      {revealed && selected && !action.correct && <span style={{ fontSize: 14, marginLeft: "auto" }}>✗</span>}
    </button>
  );
}

// ─── EXPLANATION ──────────────────────────────────────────────────────────────
function Explanation({ exp, correct }: { exp: Puzzle["explanation"]; correct: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 60); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      background: correct ? "#071510" : "#150707",
      border: `1px solid ${correct ? "#2dce7a28" : "#e0555528"}`,
      borderRadius: 12, padding: "18px 18px",
      opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
    }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: 3, color: correct ? "#2dce7a" : "#e05555", marginBottom: 10, textTransform: "uppercase" }}>
        {correct ? "✓ CORRECT — MECHANIC" : "✗ INCORRECT — MECHANIC"}
      </div>
      <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: "#c0c0d8", lineHeight: 1.75, margin: "0 0 12px 0" }}>
        {exp.mechanical}
      </p>
      <div style={{ borderTop: "1px solid #ffffff08", paddingTop: 12, fontFamily: "'Syne', sans-serif", fontSize: 13, color: "#7a7a9a", lineHeight: 1.65 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: 2, color: "#F5C142", marginRight: 8 }}>TIP</span>
        {exp.pattern_tip}
      </div>
    </div>
  );
}

// ─── DIFFICULTY STARS ─────────────────────────────────────────────────────────
function Stars({ n }: { n: number }) {
  return (
    <span>{[1,2,3].map((i) => (
      <span key={i} style={{ color: i <= n ? "#F5C142" : "#1e2035", fontSize: 11, letterSpacing: 2 }}>★</span>
    ))}</span>
  );
}

// ─── PROGRESS DOTS ────────────────────────────────────────────────────────────
function ProgressDots({ total, current, results }: { total: number; current: number; results: boolean[] }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => {
        const solved = i < results.length;
        const active = i === current;
        return (
          <div key={i} style={{
            width: active ? 22 : 8, height: 8, borderRadius: 4,
            background: solved ? (results[i] ? "#2dce7a" : "#e05555") : active ? "#4a7fff" : "#151825",
            transition: "all 0.3s ease",
          }} />
        );
      })}
    </div>
  );
}

// ─── SCORE SCREEN ─────────────────────────────────────────────────────────────
function ScoreScreen({ score, total, onRestart }: { score: number; total: number; onRestart: () => void }) {
  const pct = score / total;
  const color = pct === 1 ? "#F5C142" : pct >= 0.5 ? "#2dce7a" : "#e05555";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 24, textAlign: "center" }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: 4, color: "#4a7fff" }}>SESSION COMPLETE</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 64, color, lineHeight: 1 }}>
        {score}<span style={{ fontSize: 24, color: "#252535" }}>/{total}</span>
      </div>
      <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: "#7a7a9a", maxWidth: 320, lineHeight: 1.7 }}>
        {pct === 1
          ? "Flawless. Your mechanical reads are tournament-ready."
          : pct >= 0.5
          ? "Solid foundation. Keep drilling the edge cases."
          : "Mechanics don't lie. Review the breakdowns and run again."}
      </p>
      <button
        onClick={onRestart}
        style={{
          background: "#09090f", border: "1px solid #4a7fff55", color: "#7db4ff",
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 3,
          padding: "14px 36px", borderRadius: 10, cursor: "pointer", transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#111828"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#09090f"; }}
      >
        RESTART SESSION
      </button>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Page() {
  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults]   = useState<boolean[]>([]);
  const [done, setDone]         = useState(false);

  const puzzle = PUZZLES[idx];
  const qMeta = QUESTION_LABELS[puzzle.question_type] ?? { label: "PUZZLE", color: "#aaa" };
  const wasCorrect = revealed
    ? (puzzle.actions.find((a) => a.id === selected)?.correct ?? false)
    : false;

  const submit = useCallback(() => {
    if (!selected || revealed) return;
    const ok = puzzle.actions.find((a) => a.id === selected)?.correct ?? false;
    setRevealed(true);
    setResults((r) => [...r, ok]);
  }, [selected, revealed, puzzle]);

  const next = useCallback(() => {
    if (idx + 1 >= PUZZLES.length) { setDone(true); return; }
    setIdx((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  }, [idx]);

  const restart = useCallback(() => {
    setIdx(0); setSelected(null); setRevealed(false); setResults([]); setDone(false);
  }, []);

  const streak = (() => {
    let s = 0;
    for (let i = results.length - 1; i >= 0; i--) { if (results[i]) s++; else break; }
    return s;
  })();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #04060e; color: #e0e0f0; font-family: 'Syne', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }
        :focus-visible { outline: 2px solid #4a7fff; outline-offset: 2px; }
        ::selection { background: #4a7fff30; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #04060e; }
        ::-webkit-scrollbar-thumb { background: #151825; border-radius: 3px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 15% 8%, #080e28 0%, #04060e 55%)",
        padding: "28px 16px 60px",
        display: "flex", justifyContent: "center",
      }}>
        <div style={{ width: "100%", maxWidth: 700 }}>

          {/* ── HEADER ── */}
          <header style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            paddingBottom: 20, borderBottom: "1px solid #151825", marginBottom: 24,
            flexWrap: "wrap", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 17, letterSpacing: 3,
                background: "linear-gradient(90deg, #4a7fff, #c084fc)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>VGC.TRAIN</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#252535", letterSpacing: 2 }}>PUZZLE ENGINE</span>
            </div>
            <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              {streak > 0 && (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#F5C142", letterSpacing: 1 }}>
                  🔥 {streak} STREAK
                </span>
              )}
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#4a4a6a", letterSpacing: 1 }}>
                SOLVED <span style={{ color: "#2dce7a" }}>{results.length}</span>
              </span>
            </div>
          </header>

          {done ? (
            <ScoreScreen score={results.filter(Boolean).length} total={PUZZLES.length} onRestart={restart} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* ── PUZZLE META ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{
                    background: qMeta.color + "18", border: `1px solid ${qMeta.color}38`,
                    color: qMeta.color, borderRadius: 5, padding: "3px 10px",
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: 2,
                  }}>{qMeta.label}</span>
                  <Stars n={puzzle.difficulty} />
                  {puzzle.tags.slice(0,3).map((t) => (
                    <span key={t} style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#2a2a40", letterSpacing: 1,
                    }}>#{t}</span>
                  ))}
                </div>
                <ProgressDots total={PUZZLES.length} current={idx} results={results} />
              </div>

              {/* ── TITLE ── */}
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: 3, color: "#4a7fff", marginBottom: 6 }}>
                  PUZZLE {idx + 1} / {PUZZLES.length} — {puzzle.id.toUpperCase()}
                </div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#eeeeff", lineHeight: 1.2 }}>
                  {puzzle.title}
                </h1>
              </div>

              {/* ── BATTLE FIELD ── */}
              <BattleField gs={puzzle.game_state} />

              {/* ── SCENARIO ── */}
              <div style={{ background: "#06080f", border: "1px solid #151825", borderRadius: 11, padding: "16px 18px" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: 3, color: "#4a7fff", marginBottom: 8 }}>SCENARIO</div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: "#b8b8d0", lineHeight: 1.75 }}>
                  {puzzle.prompt}
                </p>
              </div>

              {/* ── ACTIONS ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }} role="radiogroup" aria-label="Answer choices">
                {puzzle.actions.map((a) => (
                  <AnswerBtn
                    key={a.id} action={a}
                    selected={selected === a.id}
                    revealed={revealed}
                    onClick={() => { if (!revealed) setSelected(a.id); }}
                  />
                ))}
              </div>

              {/* ── SUBMIT ── */}
              {!revealed && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={submit}
                    disabled={!selected}
                    style={{
                      background: selected ? "#0c1428" : "#06080f",
                      border: `1px solid ${selected ? "#4a7fff" : "#151825"}`,
                      color: selected ? "#7db4ff" : "#252535",
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 3,
                      padding: "12px 26px", borderRadius: 8,
                      cursor: selected ? "pointer" : "not-allowed",
                      transition: "all 0.18s ease",
                    }}
                  >
                    SUBMIT ANSWER
                  </button>
                </div>
              )}

              {/* ── EXPLANATION ── */}
              {revealed && <Explanation exp={puzzle.explanation} correct={wasCorrect} />}

              {/* ── NEXT ── */}
              {revealed && (
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: wasCorrect ? "#071510" : "#150707",
                  border: `1px solid ${wasCorrect ? "#2dce7a1a" : "#e055551a"}`,
                  borderRadius: 9, padding: "12px 16px",
                }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: wasCorrect ? "#2dce7a" : "#e05555" }}>
                    {wasCorrect ? "Correct. On to the next." : "Study the breakdown."}
                  </span>
                  <button
                    onClick={next}
                    style={{
                      background: "#09090f", border: "1px solid #4a7fff44", color: "#4a7fff",
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 2,
                      padding: "9px 20px", borderRadius: 7, cursor: "pointer", transition: "all 0.18s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0e1428"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#09090f"; }}
                  >
                    {idx + 1 >= PUZZLES.length ? "FINISH →" : "NEXT →"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── FOOTER ── */}
          <footer style={{
            marginTop: 44, borderTop: "1px solid #0e1020", paddingTop: 16,
            display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
          }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#151825", letterSpacing: 2 }}>VGC PUZZLE TRAINER · DOUBLES ONLY · REG G</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#151825", letterSpacing: 1 }}>SPRITES VIA POKEAPI.CO</span>
          </footer>
        </div>
      </div>
    </>
  );
}
