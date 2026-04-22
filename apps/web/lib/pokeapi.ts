/**
 * PokéAPI client with caching and security best practices
 * - Uses official Pokémon sprites (CDN-backed)
 * - Implements request deduplication
 * - Type-safe responses
 */

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const OFFICIAL_ARTWORK =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/other/official-artwork";
const OFFICIAL_SPRITES =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon";

// In-memory cache with TTL
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

interface PokemonData {
  id: number;
  name: string;
  species: {
    name: string;
    url: string;
  };
  sprites: {
    front_default: string;
    other?: {
      "official-artwork"?: {
        front_default?: string;
      };
    };
  };
  stats: Array<{
    base_stat: number;
    stat: { name: string };
  }>;
  types: Array<{
    type: { name: string };
  }>;
}

interface SpeciesData {
  name: string;
  id: number;
}

/**
 * Fetch with cache and error handling
 */
async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {}
): Promise<T | null> {
  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "User-Agent": "VGC-Puzzle-Trainer/1.0",
      },
    });

    if (!response.ok) {
      console.error(`PokéAPI request failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as T;

    // Cache successful responses
    cache.set(url, {
      data,
      expires: Date.now() + CACHE_TTL,
    });

    return data;
  } catch (error) {
    console.error("PokéAPI fetch error:", error);
    return null;
  }
}

/**
 * Get Pokémon sprite URL
 * Uses official artwork from the GitHub mirror
 */
export function getPokemonSpriteUrl(
  pokemonName: string,
  variant: "official" | "animated" = "official"
): string {
  const normalized = pokemonName.toLowerCase().replace(/[^\w-]/g, "");

  if (variant === "official") {
    return `${OFFICIAL_ARTWORK}/${normalized}.png`;
  }

  return `${OFFICIAL_SPRITES}/${normalized}.png`;
}

/**
 * Get Pokémon data from PokéAPI with proper error handling
 */
export async function getPokemonData(
  pokemonName: string
): Promise<{
  name: string;
  spriteUrl: string;
  types: string[];
} | null> {
  const url = `${POKEAPI_BASE}/pokemon/${pokemonName.toLowerCase()}`;
  const data = await fetchWithCache<PokemonData>(url);

  if (!data) {
    return null;
  }

  return {
    name: data.name,
    spriteUrl: getPokemonSpriteUrl(data.name),
    types: data.types.map((t) => t.type.name),
  };
}

/**
 * Get move data from PokéAPI
 */
export async function getMoveData(
  moveName: string
): Promise<{
  name: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
} | null> {
  const url = `${POKEAPI_BASE}/move/${moveName.toLowerCase()}`;

  interface MoveData {
    name: string;
    type: { name: string };
    damage_class: { name: string };
    power: number | null;
    accuracy: number | null;
  }

  const data = await fetchWithCache<MoveData>(url);

  if (!data) {
    return null;
  }

  return {
    name: data.name,
    type: data.type.name,
    category: data.damage_class.name,
    power: data.power,
    accuracy: data.accuracy,
  };
}

/**
 * Get ability data from PokéAPI
 */
export async function getAbilityData(
  abilityName: string
): Promise<{
  name: string;
  description: string;
} | null> {
  const url = `${POKEAPI_BASE}/ability/${abilityName.toLowerCase()}`;

  interface AbilityData {
    name: string;
    effect_entries: Array<{
      effect: string;
      language: { name: string };
    }>;
  }

  const data = await fetchWithCache<AbilityData>(url);

  if (!data) {
    return null;
  }

  const englishEntry = data.effect_entries.find(
    (e) => e.language.name === "en"
  );

  return {
    name: data.name,
    description: englishEntry?.effect || "No description available",
  };
}

/**
 * Preload multiple Pokémon sprites for better UX
 */
export async function preloadPokemonSprites(
  pokemonNames: string[]
): Promise<void> {
  const promises = pokemonNames.map((name) => {
    const img = new Image();
    img.src = getPokemonSpriteUrl(name);
    return img;
  });

  // Wait for all images to load
  await Promise.allSettled(
    promises.map((img) => {
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
}

/**
 * Clear cache for testing/reset
 */
export function clearPokemonCache(): void {
  cache.clear();
}
