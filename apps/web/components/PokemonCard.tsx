"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { getPokemonSpriteUrl, preloadPokemonSprites } from "../lib/pokeapi";
import { TYPE_COLORS, STATUS_COLORS } from "../lib/constants";
import type { PokemonSnapshot } from "../types";
import styles from "./PokemonCard.module.css";

interface PokemonCardProps {
  pokemon: PokemonSnapshot;
  slot: "a" | "b";
  side: "p1" | "p2";
  isActive: boolean;
  onHover?: (visible: boolean) => void;
}

/**
 * Display a single Pokémon with stats and status
 * Optimized for performance with lazy loading
 */
export function PokemonCard({
  pokemon,
  slot,
  side,
  isActive,
  onHover,
}: PokemonCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const spriteUrl = getPokemonSpriteUrl(pokemon.species);
  const hpPercentage = (pokemon.currentHp / pokemon.maxHp) * 100;
  const isLowHp = hpPercentage <= 25;

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Get primary type color
  const primaryType = pokemon.moves?.[0] || "normal";
  const typeColor = TYPE_COLORS[primaryType] || "#888";

  return (
    <div
      className={`${styles.card} ${isActive ? styles.active : ""} ${
        side === "p2" ? styles.opponent : ""
      }`}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Sprite */}
      <div className={styles.spriteContainer}>
        {!imageLoaded && !imageError && <div className={styles.skeleton} />}
        {!imageError && (
          <Image
            src={spriteUrl}
            alt={pokemon.species}
            width={96}
            height={96}
            priority={isActive}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              display: imageLoaded ? "block" : "none",
              filter: side === "p2" ? "scaleX(-1)" : "none",
            }}
          />
        )}
        {imageError && <div className={styles.placeholder}>?</div>}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.header}>
          <h4 className={styles.name}>{pokemon.species}</h4>
          <span className={styles.level}>Lv. {pokemon.level}</span>
        </div>

        {/* HP Bar */}
        <div className={styles.hpBar}>
          <div
            className={`${styles.hpFill} ${isLowHp ? styles.lowHp : ""}`}
            style={{
              width: `${Math.max(0, hpPercentage)}%`,
              backgroundColor: hpPercentage > 50 ? "#10b981" : "#f59e0b",
            }}
          />
        </div>
        <div className={styles.hpText}>
          {pokemon.currentHp} / {pokemon.maxHp} HP
        </div>

        {/* Status */}
        {pokemon.status && (
          <div
            className={styles.status}
            style={{
              backgroundColor: STATUS_COLORS[pokemon.status] || "#999",
            }}
          >
            {pokemon.status.toUpperCase()}
          </div>
        )}

        {/* Stat Boosts */}
        {Object.entries(pokemon.statBoosts).some(([_, v]) => v !== 0) && (
          <div className={styles.boosts}>
            {Object.entries(pokemon.statBoosts).map(
              ([stat, boost]) =>
                boost !== 0 && (
                  <span
                    key={stat}
                    className={`${styles.boost} ${
                      boost > 0 ? styles.positive : styles.negative
                    }`}
                  >
                    {stat}: {boost > 0 ? "+" : ""}{boost}
                  </span>
                )
            )}
          </div>
        )}

        {/* Ability & Item */}
        <div className={styles.details}>
          {pokemon.ability && (
            <small>
              <strong>Ability:</strong> {pokemon.ability}
            </small>
          )}
          {pokemon.item && (
            <small>
              <strong>Item:</strong> {pokemon.item}
            </small>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Preload all Pokémon sprites for a puzzle
 */
export async function preloadPokemonData(pokemonList: PokemonSnapshot[]) {
  const names = pokemonList.map((p) => p.species);
  await preloadPokemonSprites(names);
}
