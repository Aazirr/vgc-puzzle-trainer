import type {
  ReplayEvent,
  ReplayGameStateSnapshot,
  ReplayPokemonSnapshot,
  ReplaySideSnapshot
} from "./types.js";

interface MutablePokemonSnapshot extends ReplayPokemonSnapshot {
  species: string;
}

interface MutableSideSnapshot extends ReplaySideSnapshot {
  active: MutablePokemonSnapshot[];
  bench: MutablePokemonSnapshot[];
}

interface MutableBattleState extends Omit<ReplayGameStateSnapshot, "p1" | "p2"> {
  p1: MutableSideSnapshot;
  p2: MutableSideSnapshot;
}

function createEmptyPokemon(species = "Unknown"): MutablePokemonSnapshot {
  return {
    species,
    level: 50,
    currentHp: 0,
    maxHp: 0,
    status: null,
    statBoosts: {},
    moves: [],
    item: null,
    ability: "",
    stats: {
      spe: 0,
      atk: 0,
      spa: 0,
      def: 0,
      spd: 0
    }
  };
}

function createEmptySide(): MutableSideSnapshot {
  return {
    sideConditions: [],
    active: [createEmptyPokemon(), createEmptyPokemon()],
    bench: []
  };
}

function createEmptyBattleState(): MutableBattleState {
  return {
    turn: 0,
    weather: null,
    terrain: null,
    pseudoWeather: [],
    p1: createEmptySide(),
    p2: createEmptySide()
  };
}

function parseSide(target: string): "p1" | "p2" | null {
  const match = target.match(/^(p[12])/);
  return match ? (match[1] as "p1" | "p2") : null;
}

function parseSpecies(raw: string): string {
  const afterColon = raw.includes(":") ? raw.split(":").slice(1).join(":") : raw;
  const [species = "Unknown"] = afterColon.split(",");
  return species.trim();
}

function parseHp(raw: string): { currentHp: number; maxHp: number } {
  const [currentPart = "0", maxPart = currentPart] = raw.trim().split("/");
  const currentHp = Number.parseInt(currentPart, 10);
  const maxHp = Number.parseInt(maxPart, 10);

  return {
    currentHp: Number.isFinite(currentHp) ? currentHp : 0,
    maxHp: Number.isFinite(maxHp) ? maxHp : 0
  };
}

function getSide(state: MutableBattleState, side: "p1" | "p2") {
  return state[side];
}

function findPokemon(side: MutableSideSnapshot, species: string): MutablePokemonSnapshot | undefined {
  return [...side.active, ...side.bench].find((pokemon) => pokemon.species === species);
}

function ensurePokemon(side: MutableSideSnapshot, species: string): MutablePokemonSnapshot {
  const existing = findPokemon(side, species);
  if (existing) {
    return existing;
  }

  const pokemon = createEmptyPokemon(species);
  const emptyActiveSlot = side.active.find((entry) => entry.species === "Unknown" && entry.maxHp === 0);
  if (emptyActiveSlot) {
    Object.assign(emptyActiveSlot, pokemon);
    return emptyActiveSlot;
  }

  side.bench.push(pokemon);
  return pokemon;
}

function updatePokemonHp(pokemon: MutablePokemonSnapshot, hpText: string) {
  const { currentHp, maxHp } = parseHp(hpText);
  pokemon.currentHp = currentHp;
  pokemon.maxHp = maxHp;
}

function updatePokemonStatus(pokemon: MutablePokemonSnapshot, status: string | null) {
  pokemon.status = status;
}

function updateStatBoost(pokemon: MutablePokemonSnapshot, stat: string, delta: number) {
  const current = pokemon.statBoosts[stat] ?? 0;
  pokemon.statBoosts[stat] = current + delta;
}

function updateFieldState(state: MutableBattleState, effect: string, started: boolean) {
  if (/terrain/i.test(effect)) {
    state.terrain = started ? effect : null;
    return;
  }

  if (!state.pseudoWeather.includes(effect) && started) {
    state.pseudoWeather.push(effect);
    return;
  }

  if (!started) {
    state.pseudoWeather = state.pseudoWeather.filter((entry) => entry !== effect);
  }
}

function updateWeather(state: MutableBattleState, weather: string) {
  state.weather = weather;
}

function updateSideCondition(state: MutableBattleState, side: "p1" | "p2", condition: string, started: boolean) {
  const sideState = getSide(state, side);

  if (started) {
    if (!sideState.sideConditions.includes(condition)) {
      sideState.sideConditions.push(condition);
    }
    return;
  }

  sideState.sideConditions = sideState.sideConditions.filter((entry) => entry !== condition);
}

function registerSwitch(state: MutableBattleState, side: "p1" | "p2", species: string, hp: string | null) {
  const sideState = getSide(state, side);
  const pokemon = ensurePokemon(sideState, species);
  pokemon.species = species;

  if (hp) {
    updatePokemonHp(pokemon, hp);
  }
}

function parseActorSide(actor: string): "p1" | "p2" | null {
  return parseSide(actor);
}

function updateFromEvent(state: MutableBattleState, event: ReplayEvent) {
  switch (event.type) {
    case "turn":
      state.turn = event.turn;
      return;
    case "weather":
      updateWeather(state, event.weather);
      return;
    case "fieldstart":
      updateFieldState(state, event.effect, true);
      return;
    case "fieldend":
      updateFieldState(state, event.effect, false);
      return;
    case "sidestart":
      updateSideCondition(state, event.side, event.condition, true);
      return;
    case "sideend":
      updateSideCondition(state, event.side, event.condition, false);
      return;
    case "switch":
      registerSwitch(state, event.side, event.species, event.hp);
      return;
    case "move": {
      const side = parseActorSide(event.actor);
      if (side) {
        const pokemon = ensurePokemon(getSide(state, side), parseSpecies(event.actor));
        pokemon.moves = Array.from(new Set([...pokemon.moves, event.move]));
      }
      return;
    }
    case "damage": {
      const side = parseActorSide(event.target);
      if (side) {
        const pokemon = ensurePokemon(getSide(state, side), parseSpecies(event.target));
        updatePokemonHp(pokemon, event.hp);
      }
      return;
    }
    case "heal": {
      const side = parseActorSide(event.target);
      if (side) {
        const pokemon = ensurePokemon(getSide(state, side), parseSpecies(event.target));
        updatePokemonHp(pokemon, event.hp);
      }
      return;
    }
    case "status": {
      const side = parseActorSide(event.target);
      if (side) {
        const pokemon = ensurePokemon(getSide(state, side), parseSpecies(event.target));
        updatePokemonStatus(pokemon, event.status);
      }
      return;
    }
    case "curestatus": {
      const side = parseActorSide(event.target);
      if (side) {
        const pokemon = ensurePokemon(getSide(state, side), parseSpecies(event.target));
        updatePokemonStatus(pokemon, null);
      }
      return;
    }
    case "boost": {
      const side = parseActorSide(event.target);
      if (side) {
        const pokemon = ensurePokemon(getSide(state, side), parseSpecies(event.target));
        updateStatBoost(pokemon, event.stat, event.amount);
      }
      return;
    }
    case "unboost": {
      const side = parseActorSide(event.target);
      if (side) {
        const pokemon = ensurePokemon(getSide(state, side), parseSpecies(event.target));
        updateStatBoost(pokemon, event.stat, -event.amount);
      }
      return;
    }
    case "unknown":
      return;
  }
}

export function rebuildBattleState(events: ReplayEvent[]): ReplayGameStateSnapshot {
  const state = createEmptyBattleState();

  for (const event of events) {
    updateFromEvent(state, event);
  }

  return {
    turn: state.turn,
    weather: state.weather,
    terrain: state.terrain,
    pseudoWeather: state.pseudoWeather,
    p1: state.p1,
    p2: state.p2
  };
}
