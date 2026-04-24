// @ts-nocheck
"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── Security: sanitize all dynamic strings before render ─────────────────────
function san(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

// ─── Asset helpers ────────────────────────────────────────────────────────────
// Showdown animated sprite (front, from PokeAPI sprites repo which mirrors Showdown)
const showdownSprite = (slug: string): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${san(slug)}.gif`;
const showdownSpriteBack = (slug: string): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/${san(slug)}.gif`;
// Official artwork fallback
const officialArt = (id: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
// Showdown item sprite
const itemSprite = (itemSlug: string): string =>
  `https://play.pokemonshowdown.com/sprites/itemicons/${san(itemSlug)}.png`;
// Type badge colors
const TYPE_COLOR = {
  Electric:"#F7D02C",Water:"#6390F0",Fighting:"#C22E28",Ice:"#96D9D6",
  Grass:"#7AC74C",Normal:"#A8A878",Fire:"#EE8130",Psychic:"#F95587",
  Dragon:"#6F35FC",Ghost:"#735797",Steel:"#B7B7CE",Fairy:"#D685AD",
  Dark:"#705746",Ground:"#E2BF65",Rock:"#B6A136",Bug:"#A6B91A",
  Flying:"#A98FF3",Poison:"#A33EA1",
};

// ─── Pokémon name → PokeAPI slug & ID map (VGC-relevant roster) ──────────────
const POKEDEX = {
  "Miraidon":          { slug:"miraidon",           id:1008 },
  "Flutter Mane":      { slug:"flutter-mane",       id:987  },
  "Iron Hands":        { slug:"iron-hands",         id:992  },
  "Rillaboom":         { slug:"rillaboom",          id:812  },
  "Urshifu-Rapid":     { slug:"urshifu-rapid-strike",id:892 },
  "Calyrex-Ice":       { slug:"calyrex-ice",        id:898  },
  "Dondozo":           { slug:"dondozo",            id:977  },
  "Tatsugiri":         { slug:"tatsugiri",          id:978  },
  "Porygon2":          { slug:"porygon2",           id:233  },
  "Amoonguss":         { slug:"amoonguss",          id:591  },
  "Tornadus":          { slug:"tornadus",           id:641  },
  "Landorus-T":        { slug:"landorus-therian",   id:645  },
  "Incineroar":        { slug:"incineroar",         id:727  },
  "Raging Bolt":       { slug:"raging-bolt",        id:1021 },
  "Farigiraf":         { slug:"farigiraf",          id:981  },
  "Gholdengo":         { slug:"gholdengo",          id:1000 },
};

function getSprite(name, back=false) {
  const entry = POKEDEX[name];
  if (!entry) return officialArt(0);
  return back ? showdownSpriteBack(entry.slug) : showdownSprite(entry.slug);
}
function getArt(name) {
  const entry = POKEDEX[name];
  return entry ? officialArt(entry.id) : officialArt(0);
}

// ─── Item slug map (Showdown item icon names) ─────────────────────────────────
const ITEM_SLUG = {
  "Choice Specs":"choicespecs","Choice Band":"choiceband","Choice Scarf":"choicescarf",
  "Assault Vest":"assaultvest","Focus Sash":"focussash","Leftovers":"leftovers",
  "Rocky Helmet":"rockyhelmet","Weakness Policy":"weaknesspolicy","Eviolite":"eviolite",
  "Life Orb":"lifeorb","Sitrus Berry":"sitrusberry","Lum Berry":"lumberry",
};

// ─── Puzzle data ──────────────────────────────────────────────────────────────
const PUZZLES = [
  {
    id:"pzl-001", question_type:"speed_check", difficulty:1,
    title:"Outspeeding the Threat",
    prompt:"Your Miraidon is at +0 speed. The opponent's Iron Hands is also +0 with no boosts. Electric Terrain is active. Which of your active Pokémon is guaranteed to move before Iron Hands this turn?",
    game_state:{
      your_side:[
        { name:"Miraidon",     hp:100,max_hp:167,status:null,item:"Choice Specs",  types:["Electric","Dragon"], tera:false },
        { name:"Flutter Mane", hp:78, max_hp:131,status:null,item:"Focus Sash",    types:["Ghost","Fairy"],     tera:false },
      ],
      opp_side:[
        { name:"Iron Hands",   hp:100,max_hp:227,status:null,item:"Assault Vest",  types:["Fighting","Electric"],tera:false },
        { name:"Rillaboom",    hp:55, max_hp:197,status:null,item:"Choice Band",   types:["Grass"],             tera:false },
      ],
      field:{ weather:null, terrain:"Electric Terrain", trick_room:false, tailwind:{your:false,opp:false} },
    },
    actions:[
      { id:"a", label:"Miraidon — guaranteed faster than Iron Hands",  correct:true  },
      { id:"b", label:"Flutter Mane — same speed as Miraidon so it goes first", correct:false },
      { id:"c", label:"They tie — Miraidon and Iron Hands share the same speed", correct:false },
      { id:"d", label:"Iron Hands — Assault Vest boosts its priority",  correct:false },
    ],
    explanation:{
      mechanical:"Miraidon base Speed is 135, Iron Hands base Speed is 50. At max EVs (+Speed nature), Miraidon hits ~205 and Iron Hands caps at ~107. Miraidon is always faster. Flutter Mane also has 135 base Speed — because it shares Miraidon's exact speed bracket, which of them acts first is a random Speed tie, so it is NOT guaranteed. Only Miraidon's priority over Iron Hands is provably deterministic.",
      pattern_tip:"Electric Terrain activates Miraidon's Hadron Engine ability, boosting its Special Attack — confirm terrain is live before committing to an Electric KO.",
    },
    tags:["speed","terrain","miraidon","iron-hands"],
  },
  {
    id:"pzl-002", question_type:"ko_threshold", difficulty:2,
    title:"Guaranteed KO — Surging Strikes",
    prompt:"Your Choice Band Urshifu-Rapid-Strike uses Surging Strikes (3 hits, each a guaranteed critical hit) on the opposing Dondozo at full HP. No weather, no terrain, no boosts. Does Urshifu guarantee a KO?",
    game_state:{
      your_side:[
        { name:"Urshifu-Rapid", hp:100,max_hp:175,status:null,item:"Choice Band",     types:["Water","Fighting"], tera:false },
        { name:"Calyrex-Ice",   hp:90, max_hp:175,status:null,item:"Weakness Policy", types:["Psychic","Ice"],    tera:false },
      ],
      opp_side:[
        { name:"Dondozo",    hp:100,max_hp:285,status:null,item:"Leftovers",    types:["Water"],           tera:false },
        { name:"Tatsugiri",  hp:100,max_hp:131,status:null,item:"Choice Scarf", types:["Dragon","Water"],  tera:false },
      ],
      field:{ weather:null, terrain:null, trick_room:false, tailwind:{your:false,opp:false} },
    },
    actions:[
      { id:"a", label:"Yes — guaranteed 3-hit KO, Surging Strikes always crits bypassing Unaware", correct:true  },
      { id:"b", label:"No — Dondozo survives on minimum damage roll",                              correct:false },
      { id:"c", label:"No — Tatsugiri uses Commander before Urshifu can attack",                   correct:false },
      { id:"d", label:"Yes — but only if Tera is active on Urshifu",                               correct:false },
    ],
    explanation:{
      mechanical:"Surging Strikes always deals 3 hits, each a guaranteed crit — this bypasses Dondozo's Unaware and any Defense boosts. With Choice Band, Urshifu-Rapid's effective Attack is ~298. Minimum 3-hit total against 285 HP / 100 Def Dondozo is ~107% of max HP. This is a guaranteed KO. Tatsugiri's Commander activates only when Dondozo uses a move to 'eat' Tatsugiri — it cannot trigger reactively mid-turn in response to targeting.",
      pattern_tip:"Surging Strikes is the cleanest counter to Dondozo-Tatsugiri — crit guarantee makes Unaware irrelevant. Confirm Commander is not already active before committing.",
    },
    tags:["ko-check","urshifu","dondozo","commander","crit"],
  },
  {
    id:"pzl-003", question_type:"field_interaction", difficulty:2,
    title:"Trick Room & Scarf Reversal",
    prompt:"Trick Room is active (3 turns remaining). The opponent switches in Choice Scarf Tornadus. Which side controls the speed order — who moves first?",
    game_state:{
      your_side:[
        { name:"Porygon2",  hp:100,max_hp:177,status:null,item:"Eviolite",     types:["Normal"],          tera:false },
        { name:"Amoonguss", hp:100,max_hp:190,status:null,item:"Rocky Helmet", types:["Grass","Poison"],  tera:false },
      ],
      opp_side:[
        { name:"Tornadus",   hp:100,max_hp:167,status:null,item:"Choice Scarf",  types:["Flying"],         tera:false },
        { name:"Landorus-T", hp:85, max_hp:185,status:null,item:"Rocky Helmet",  types:["Ground","Flying"],tera:false },
      ],
      field:{ weather:null, terrain:null, trick_room:true, trick_room_turns:3, tailwind:{your:false,opp:false} },
    },
    actions:[
      { id:"a", label:"Your side — Porygon2 & Amoonguss are slowest and move first under TR",    correct:true  },
      { id:"b", label:"Opponent — Scarf doubles Tornadus' speed, making it fastest even in TR",  correct:false },
      { id:"c", label:"Tied — Scarf and TR cancel each other out for Tornadus",                  correct:false },
      { id:"d", label:"Opponent — Landorus-T is slower than your team so it goes first in TR",   correct:false },
    ],
    explanation:{
      mechanical:"Under Trick Room, lowest Speed moves first. Your speeds: Amoonguss 30, Porygon2 60. Opponent speeds: Landorus-T 91, Tornadus with Choice Scarf = 111 × 1.5 = ~166. Reversed order: Amoonguss (30) → Porygon2 (60) → Landorus-T (91) → Tornadus (166). Both your Pokémon move before both opponents'.",
      pattern_tip:"Choice Scarf backfires hard under Trick Room — the multiplier makes the user even slower in reverse priority. Always track TR turns before switching in Scarf users.",
    },
    tags:["trick-room","speed-control","tornadus","field"],
  },
];

const Q_TYPE_LABEL = { speed_check:"Speed Check", ko_threshold:"KO Threshold", field_interaction:"Field Interaction" };
const DIFF_LABEL    = ["","Beginner","Intermediate","Advanced"];
const DIFF_COLOR    = ["","#4ade80","#facc15","#f87171"];

// ─── PokéAPI hook — fetches type data & sprite fallback ───────────────────────
// ─── HP bar ───────────────────────────────────────────────────────────────────
function hpBar(pct) {
  if (pct > 50) return "#4ade80";
  if (pct > 25) return "#facc15";
  return "#f87171";
}

// ─── Type pill ────────────────────────────────────────────────────────────────
function TypePill({ type }) {
  const c = TYPE_COLOR[type] || "#64748b";
  return (
    <span style={{
      background: c + "30", color: c, border:`1px solid ${c}55`,
      borderRadius:3, padding:"1px 5px", fontSize:10, fontWeight:700,
      letterSpacing:"0.05em",
    }}>{san(type)}</span>
  );
}

// ─── Pokémon card with live sprite ────────────────────────────────────────────
function PokemonCard({ mon, back }) {
  const [imgSrc, setImgSrc] = useState(getSprite(mon.name, back));
  const [imgLoaded, setImgLoaded] = useState(false);
  const hpPct = Math.round((mon.hp / mon.max_hp) * 100);

  // Fallback chain: showdown GIF → official art → silhouette
  function handleImgError() {
    if (imgSrc !== getArt(mon.name)) setImgSrc(getArt(mon.name));
  }

  const itemSlug = ITEM_SLUG[mon.item];

  return (
    <div style={{
      flex:"1 1 148px", minWidth:140, maxWidth:200,
      background: back ? "#0f1a2a" : "#160a0a",
      border:`1px solid ${back ? "#1e3a5f" : "#3a1010"}`,
      borderRadius:8, padding:"10px 10px 8px",
      display:"flex", flexDirection:"column", gap:5,
    }}>
      {/* Sprite */}
      <div style={{ textAlign:"center", height:80, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        {!imgLoaded && (
          <div style={{
            width:64, height:64, borderRadius:"50%",
            background:"#1e293b", animation:"pulse 1.5s ease infinite",
          }}/>
        )}
        <img
          src={imgSrc}
          alt={san(mon.name)}
          onLoad={()=>setImgLoaded(true)}
          onError={handleImgError}
          style={{ maxHeight:80, maxWidth:96, imageRendering:"pixelated",
            opacity: imgLoaded ? 1 : 0, position: imgLoaded ? "static" : "absolute",
            transition:"opacity 0.2s",
            filter: mon.status === "fnt" ? "grayscale(1) opacity(0.4)" : "none",
          }}
        />
        {mon.tera && (
          <span style={{ position:"absolute", top:0, right:0,
            background:"#f59e0b", color:"#1a0a00", borderRadius:3,
            fontSize:9, fontWeight:900, padding:"1px 4px",
          }}>TERA</span>
        )}
      </div>
      {/* Name */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
        <span style={{ fontWeight:700, fontSize:12, color:"#e2e8f0", lineHeight:1.2 }}>{san(mon.name)}</span>
        {itemSlug && (
          <img src={itemSprite(itemSlug)} alt={san(mon.item)} title={san(mon.item)}
            style={{ width:20, height:20, imageRendering:"pixelated" }}
            onError={e=>e.target.style.display="none"}
          />
        )}
      </div>
      {/* Types */}
      <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
        {(mon.types||[]).map(t => <TypePill key={t} type={t}/>)}
      </div>
      {/* HP */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"#94a3b8", marginBottom:2 }}>
          <span>HP</span><span style={{ color:hpBar(hpPct), fontWeight:700 }}>{hpPct}%</span>
        </div>
        <div style={{ background:"#1e293b", borderRadius:2, height:4, overflow:"hidden" }}>
          <div style={{ width:`${hpPct}%`, background:hpBar(hpPct), height:"100%", transition:"width 0.4s" }}/>
        </div>
      </div>
      {/* Status */}
      {mon.status && (
        <div style={{ fontSize:10 }}>
          <span style={{ color:"#f59e0b", fontWeight:600 }}>{san(mon.status).toUpperCase()}</span>
        </div>
      )}
      {/* Item text */}
      <div style={{ fontSize:9, color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {san(mon.item)}
      </div>
    </div>
  );
}

// ─── Field conditions banner ──────────────────────────────────────────────────
function FieldBanner({ field }) {
  const pills = [];
  if (field.terrain)   pills.push({ label:field.terrain, color:"#a78bfa" });
  if (field.weather)   pills.push({ label:field.weather, color:"#60a5fa" });
  if (field.trick_room)pills.push({ label:`Trick Room ×${field.trick_room_turns??"?"}`, color:"#f472b6" });
  if (field.tailwind?.your) pills.push({ label:"Your Tailwind", color:"#34d399" });
  if (field.tailwind?.opp)  pills.push({ label:"Opp Tailwind",  color:"#fb923c" });

  return (
    <div style={{ padding:"6px 0", textAlign:"center", display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center" }}>
      {pills.length === 0
        ? <span style={{ fontSize:10, color:"#334155", letterSpacing:"0.08em" }}>NO FIELD CONDITIONS</span>
        : pills.map(p => (
          <span key={p.label} style={{
            background:p.color+"22", color:p.color, border:`1px solid ${p.color}55`,
            borderRadius:4, padding:"2px 10px", fontSize:11, fontWeight:700, letterSpacing:"0.05em",
          }}>{p.label}</span>
        ))
      }
    </div>
  );
}

// ─── Battle field ─────────────────────────────────────────────────────────────
function BattleField({ game_state }) {
  return (
    <div style={{
      background:"linear-gradient(180deg,#0a0e18 0%,#0d1520 50%,#0a0e18 100%)",
      border:"1px solid #1e293b", borderRadius:12, padding:16, marginBottom:20,
      position:"relative", overflow:"hidden",
    }}>
      {/* Background grid texture */}
      <div style={{
        position:"absolute", inset:0, opacity:0.04,
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 31px,#fff 31px,#fff 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,#fff 31px,#fff 32px)",
        pointerEvents:"none",
      }}/>

      <div style={{ fontSize:10, fontWeight:800, color:"#ef444488", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>
        ▲ Opponent's Side
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        {game_state.opp_side.map(m => <PokemonCard key={m.name} mon={m} back={false}/>)}
      </div>

      <div style={{ borderTop:"1px solid #1e293b30", borderBottom:"1px solid #1e293b30", margin:"8px 0" }}>
        <FieldBanner field={game_state.field}/>
      </div>

      <div style={{ fontSize:10, fontWeight:800, color:"#22d3ee88", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8, marginTop:12 }}>
        ▼ Your Side
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {game_state.your_side.map(m => <PokemonCard key={m.name} mon={m} back={true}/>)}
      </div>
    </div>
  );
}

// ─── Answer button ────────────────────────────────────────────────────────────
function AnswerBtn({ action, selected, revealed, onClick }) {
  let bg="#0f172a", border="#1e293b", color="#94a3b8";
  if (revealed) {
    if (action.correct)              { bg="#052e16"; border="#16a34a"; color="#4ade80"; }
    else if (selected && !action.correct) { bg="#1c0505"; border="#dc2626"; color="#f87171"; }
  } else if (selected) {
    bg="#172554"; border="#3b82f6"; color="#93c5fd";
  }
  return (
    <button onClick={()=>!revealed&&onClick(action.id)} style={{
      display:"flex", alignItems:"center", gap:10,
      background:bg, border:`1.5px solid ${border}`, borderRadius:8,
      padding:"11px 14px", width:"100%", cursor:revealed?"default":"pointer",
      color, fontSize:13, textAlign:"left", fontFamily:"inherit",
      transition:"all 0.15s ease",
    }}>
      <span style={{
        width:24, height:24, borderRadius:5, border:`1.5px solid ${border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:11, fontWeight:800, flexShrink:0,
        background: selected||(revealed&&action.correct) ? border : "transparent",
        color: selected||(revealed&&action.correct) ? "#fff" : border,
      }}>{action.id.toUpperCase()}</span>
      <span style={{ lineHeight:1.4 }}>{san(action.label)}</span>
      {revealed && action.correct    && <span style={{ marginLeft:"auto", fontSize:18 }}>✓</span>}
      {revealed && selected && !action.correct && <span style={{ marginLeft:"auto", fontSize:18 }}>✗</span>}
    </button>
  );
}

// ─── Explanation panel ────────────────────────────────────────────────────────
function Explanation({ explanation, correct }) {
  return (
    <div style={{
      marginTop:14, borderRadius:10, overflow:"hidden",
      border:`1px solid ${correct?"#16a34a44":"#dc262644"}`,
      animation:"slideUp 0.25s ease both",
    }}>
      <div style={{
        background: correct?"#052e16":"#1c0505", padding:"10px 16px",
        display:"flex", gap:8, alignItems:"center",
      }}>
        <span style={{ fontSize:20 }}>{correct?"🎉":"📖"}</span>
        <span style={{ fontWeight:700, fontSize:13, color:correct?"#4ade80":"#f87171" }}>
          {correct ? "Correct!" : "Not quite — here's the mechanic:"}
        </span>
      </div>
      <div style={{ background:"#0d1117", padding:16 }}>
        <p style={{ fontSize:13, color:"#cbd5e1", lineHeight:1.75, margin:0, marginBottom:12 }}>
          {san(explanation.mechanical)}
        </p>
        <div style={{
          background:"#0a0f1a", borderLeft:"3px solid #a78bfa",
          borderRadius:"0 6px 6px 0", padding:"9px 12px",
        }}>
          <div style={{ fontSize:9, fontWeight:800, color:"#a78bfa", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>
            Pattern Recognition
          </div>
          <p style={{ fontSize:12, color:"#c4b5fd", lineHeight:1.65, margin:0 }}>
            {san(explanation.pattern_tip)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PuzzlePageV2({ puzzle }) {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  // Support both old structure (game_state, actions) and new structure (gameState, correctAction, wrongActions)
  const gameState = puzzle.gameState || puzzle.game_state;
  const questionType = puzzle.questionType || puzzle.question_type;
  const difficulty = puzzle.difficulty || 1;

  // Transform new structure (p1/p2) to old structure (your_side/opp_side) if needed
  const transformedGameState = gameState && gameState.p1 && gameState.p2 ? {
    your_side: (gameState[puzzle.playerSide] || gameState.p1)?.active?.map(poke => ({
      name: poke.species,
      hp: poke.currentHp,
      max_hp: poke.maxHp,
      status: poke.status,
      item: poke.item,
      types: [], // Would need to look up from a database
      tera: false,
    })) || [],
    opp_side: (gameState[puzzle.playerSide === 'p1' ? 'p2' : 'p1'] || gameState.p2)?.active?.map(poke => ({
      name: poke.species,
      hp: poke.currentHp,
      max_hp: poke.maxHp,
      status: poke.status,
      item: poke.item,
      types: [],
      tera: false,
    })) || [],
    field: {
      weather: gameState.weather || null,
      terrain: gameState.terrain || null,
      trick_room: false,
    }
  } : gameState;

  const actions = puzzle.actions || [
    { id: "correct", label: "Correct Action", correct: true },
    ...(puzzle.wrongActions?.map((action, i) => ({
      id: `wrong-${i}`,
      label: `Alternative ${i + 1}`,
      correct: false
    })) || [])
  ];

  const correct = revealed ? actions.find(a => a.id === selected)?.correct : null;

  const submit = useCallback(() => {
    if (!selected || revealed) return;
    setRevealed(true);
  }, [selected, revealed]);

  const retry = useCallback(() => {
    setSelected(null);
    setRevealed(false);
  }, []);

  const goRandom = useCallback(() => {
    router.push("/puzzles/random");
  }, [router]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#060b12;color:#e2e8f0;font-family:'Syne',system-ui,sans-serif}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0f172a}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <header style={{
          width: "100%", maxWidth: 780,
          padding: "14px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #1e293b",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>
              <span style={{ color: "#22d3ee" }}>VGC</span>
              <span style={{ color: "#e2e8f0" }}> Puzzle Trainer</span>
            </div>
            <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'IBM Plex Mono',monospace" }}>
              {Q_TYPE_LABEL[questionType] || "Puzzle"} · {DIFF_LABEL[difficulty] || "Practice"}
            </div>
          </div>
          <div style={{
            background: "#0f172a", border: "1px solid #1e293b",
            borderRadius: 6, padding: "5px 12px",
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: "#94a3b8",
          }}>
            {puzzle.id.toUpperCase()}
          </div>
        </header>

        <main style={{ width: "100%", maxWidth: 780, padding: "22px 20px 64px", flex: 1 }}>
          <div style={{ animation: "slideUp 0.3s ease" }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#334155", letterSpacing: "0.1em" }}>
                  {san(puzzle.title)}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#a78bfa" }}>
                  {Math.round((revealed ? 1 : 0) * 100)}%
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{
                background: "#0ea5e920", color: "#22d3ee", border: "1px solid #22d3ee33",
                borderRadius: 4, padding: "2px 9px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                fontFamily: "'IBM Plex Mono',monospace",
              }}>{Q_TYPE_LABEL[puzzle.question_type] || "Puzzle"}</span>
              <span style={{
                background: DIFF_COLOR[puzzle.difficulty] + "20",
                color: DIFF_COLOR[puzzle.difficulty] || "#94a3b8",
                border: `1px solid ${DIFF_COLOR[puzzle.difficulty] || "#94a3b8"}33`,
                borderRadius: 4, padding: "2px 9px", fontSize: 10,
                fontFamily: "'IBM Plex Mono',monospace",
              }}>{DIFF_LABEL[puzzle.difficulty] || "Practice"}</span>
              {(puzzle.tags || []).map(t => (
                <span key={t} style={{
                  background: "#1e293b", color: "#475569",
                  borderRadius: 4, padding: "2px 8px", fontSize: 9,
                  fontFamily: "'IBM Plex Mono',monospace",
                }}>#{san(t)}</span>
              ))}
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 8, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              {san(puzzle.title)}
            </h1>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, marginBottom: 20 }}>
              {san(puzzle.prompt)}
            </p>

            <BattleField game_state={transformedGameState} />

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {actions.map(a => (
                <AnswerBtn key={a.id} action={a} selected={selected === a.id}
                  revealed={revealed} onClick={setSelected} />
              ))}
            </div>

            {!revealed ? (
              <button onClick={submit} disabled={!selected} style={{
                width: "100%", padding: "13px", borderRadius: 8, border: "none",
                background: selected ? "#1d4ed8" : "#1e293b",
                color: selected ? "#dbeafe" : "#475569",
                fontSize: 14, fontWeight: 800, cursor: selected ? "pointer" : "not-allowed",
                letterSpacing: "0.05em", transition: "all 0.15s",
              }}>Submit Answer</button>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <button onClick={goRandom} style={{
                  width: "100%", padding: "13px", borderRadius: 8, border: "none",
                  background: "#7c3aed", color: "#ede9fe", fontSize: 14, fontWeight: 800,
                  cursor: "pointer", letterSpacing: "0.05em",
                }}>Next Random Puzzle →</button>
                <button onClick={retry} style={{
                  width: "100%", padding: "13px", borderRadius: 8, border: "1px solid #334155",
                  background: "transparent", color: "#cbd5e1", fontSize: 14, fontWeight: 800,
                  cursor: "pointer", letterSpacing: "0.05em",
                }}>Try Again</button>
              </div>
            )}

            {revealed && correct !== null && <Explanation explanation={puzzle.explanation} correct={correct} />}
          </div>
        </main>

        <footer style={{ borderTop: "1px solid #1e293b", width: "100%", padding: "10px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 10, color: "#1e293b", fontFamily: "'IBM Plex Mono',monospace", letterSpacing: "0.08em" }}>
            SPRITES © POKÉAPI · SHOWDOWN ENGINE © SMOGON · PUZZLES HAVE PROVABLY CORRECT ANSWERS ONLY
          </span>
        </footer>
      </div>
    </>
  );
}

// ─── Score screen ─────────────────────────────────────────────────────────────
function ScoreScreen({ results, onRestart }) {
  const correct = results.filter(Boolean).length;
  const pct     = Math.round(correct/results.length*100);
  return (
    <div style={{ textAlign:"center", padding:"48px 20px", animation:"slideUp 0.35s ease" }}>
      <div style={{ fontSize:72, marginBottom:12, lineHeight:1 }}>
        {pct===100?"🏆":pct>=66?"⚡":"📚"}
      </div>
      <div style={{ fontSize:44, fontWeight:900, color:"#e2e8f0", fontVariantNumeric:"tabular-nums" }}>
        {correct}/{results.length}
      </div>
      <div style={{ fontSize:14, color:"#64748b", marginTop:4, marginBottom:6 }}>{pct}% accuracy</div>
      <p style={{ fontSize:13, color:"#94a3b8", maxWidth:320, margin:"0 auto 32px", lineHeight:1.7 }}>
        {pct===100
          ? "Flawless. Your mechanical reads are tournament-ready."
          : pct>=66
          ? "Solid work. Review the explanations on missed puzzles to tighten your edge."
          : "Keep drilling — these mechanics become automatic with repetition."}
      </p>
      <button onClick={onRestart} style={{
        background:"#1d4ed8", color:"#dbeafe", border:"none",
        borderRadius:8, padding:"12px 32px", fontSize:14, fontWeight:800,
        cursor:"pointer", letterSpacing:"0.05em",
      }}>
        Try Again ↺
      </button>
    </div>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [idx,      setIdx]      = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [results,  setResults]  = useState([]);
  const [done,     setDone]     = useState(false);

  const puzzle  = PUZZLES[idx];
  const actions = puzzle.actions || [];
  const correct = revealed ? actions.find(a=>a.id===selected)?.correct : null;

  const submit = useCallback(() => {
    if (!selected || revealed) return;
    const ok = actions.find(a=>a.id===selected)?.correct ?? false;
    setRevealed(true);
    setResults(r=>[...r,ok]);
  }, [selected, revealed, puzzle]);

  const next = useCallback(() => {
    if (idx+1 >= PUZZLES.length) { setDone(true); return; }
    setIdx(i=>i+1); setSelected(null); setRevealed(false);
  }, [idx]);

  const restart = useCallback(() => {
    setIdx(0); setSelected(null); setRevealed(false); setResults([]); setDone(false);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#060b12;color:#e2e8f0;font-family:'Syne',system-ui,sans-serif}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0f172a}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center" }}>

        {/* Header */}
        <header style={{
          width:"100%", maxWidth:780,
          padding:"14px 20px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          borderBottom:"1px solid #1e293b",
        }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-0.01em" }}>
              <span style={{ color:"#22d3ee" }}>VGC</span>
              <span style={{ color:"#e2e8f0" }}> Puzzle Trainer</span>
            </div>
            <div style={{ fontSize:9, color:"#334155", letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'IBM Plex Mono',monospace" }}>
              Doubles · Current Regulation
            </div>
          </div>
          <div style={{
            background:"#0f172a", border:"1px solid #1e293b",
            borderRadius:6, padding:"5px 12px",
            fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:"#94a3b8",
          }}>
            ✓ {results.filter(Boolean).length} / {results.length || "—"}
          </div>
        </header>

        {/* Main */}
        <main style={{ width:"100%", maxWidth:780, padding:"22px 20px 64px", flex:1 }}>
          {done ? (
            <ScoreScreen results={results} onRestart={restart}/>
          ) : (
            <div style={{ animation:"slideUp 0.3s ease" }} key={idx}>

              {/* Progress */}
              <div style={{ marginBottom:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"#334155", letterSpacing:"0.1em" }}>
                    PUZZLE {idx+1} / {PUZZLES.length}
                  </span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"#a78bfa" }}>
                    {Math.round((idx+1)/PUZZLES.length*100)}%
                  </span>
                </div>
                <div style={{ background:"#1e293b", borderRadius:3, height:3 }}>
                  <div style={{ width:`${(idx+1)/PUZZLES.length*100}%`, background:"#a78bfa", height:"100%", borderRadius:3, transition:"width 0.4s ease" }}/>
                </div>
              </div>

              {/* Meta badges */}
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                <span style={{
                  background:"#0ea5e920", color:"#22d3ee", border:"1px solid #22d3ee33",
                  borderRadius:4, padding:"2px 9px", fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
                  fontFamily:"'IBM Plex Mono',monospace",
                }}>{Q_TYPE_LABEL[puzzle.question_type]}</span>
                <span style={{
                  background:DIFF_COLOR[puzzle.difficulty]+"20",
                  color:DIFF_COLOR[puzzle.difficulty],
                  border:`1px solid ${DIFF_COLOR[puzzle.difficulty]}33`,
                  borderRadius:4, padding:"2px 9px", fontSize:10,
                  fontFamily:"'IBM Plex Mono',monospace",
                }}>{DIFF_LABEL[puzzle.difficulty]}</span>
                {puzzle.tags.map(t=>(
                  <span key={t} style={{
                    background:"#1e293b", color:"#475569",
                    borderRadius:4, padding:"2px 8px", fontSize:9,
                    fontFamily:"'IBM Plex Mono',monospace",
                  }}>#{san(t)}</span>
                ))}
              </div>

              {/* Title + Prompt */}
              <h1 style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:8, lineHeight:1.2, letterSpacing:"-0.01em" }}>
                {san(puzzle.title)}
              </h1>
              <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.75, marginBottom:20 }}>
                {san(puzzle.prompt)}
              </p>

              {/* Battle field */}
              <BattleField game_state={puzzle.game_state}/>

              {/* Actions */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                {actions.map(a=>(
                  <AnswerBtn key={a.id} action={a} selected={selected===a.id}
                    revealed={revealed} onClick={setSelected}/>
                ))}
              </div>

              {/* Submit / Next */}
              {!revealed ? (
                <button onClick={submit} disabled={!selected} style={{
                  width:"100%", padding:"13px", borderRadius:8, border:"none",
                  background: selected?"#1d4ed8":"#1e293b",
                  color: selected?"#dbeafe":"#475569",
                  fontSize:14, fontWeight:800, cursor:selected?"pointer":"not-allowed",
                  letterSpacing:"0.05em", transition:"all 0.15s",
                }}>Submit Answer</button>
              ) : (
                <button onClick={next} style={{
                  width:"100%", padding:"13px", borderRadius:8, border:"none",
                  background:"#7c3aed", color:"#ede9fe",
                  fontSize:14, fontWeight:800, cursor:"pointer", letterSpacing:"0.05em",
                }}>
                  {idx+1<PUZZLES.length ? "Next Puzzle →" : "See Results →"}
                </button>
              )}

              {/* Explanation */}
              {revealed && <Explanation explanation={puzzle.explanation} correct={correct}/>}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{ borderTop:"1px solid #1e293b", width:"100%", padding:"10px 20px", textAlign:"center" }}>
          <span style={{ fontSize:10, color:"#1e293b", fontFamily:"'IBM Plex Mono',monospace", letterSpacing:"0.08em" }}>
            SPRITES © POKÉAPI · SHOWDOWN ENGINE © SMOGON · PUZZLES HAVE PROVABLY CORRECT ANSWERS ONLY
          </span>
        </footer>
      </div>
    </>
  );
}

