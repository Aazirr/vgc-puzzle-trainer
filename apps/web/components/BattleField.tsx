"use client";

import { PokemonCard } from "./PokemonCard";
import type { GameStateSnapshot } from "../types";
import styles from "./BattleField.module.css";
import { WEATHER_ICONS, TERRAIN_ICONS } from "../lib/constants";

interface BattleFieldProps {
  gameState: GameStateSnapshot;
  playerSide: "p1" | "p2";
}

/**
 * Display the battle field with both sides' Pokémon
 * Shows active Pokémon prominently and bench in the background
 */
export function BattleField({ gameState, playerSide }: BattleFieldProps) {
  const playerSideData = gameState[playerSide];
  const opponentSide = playerSide === "p1" ? "p2" : "p1";
  const opponentSideData = gameState[opponentSide];

  return (
    <div className={styles.container}>
      {/* Weather and Terrain Info */}
      {(gameState.weather || gameState.terrain) && (
        <div className={styles.fieldInfo}>
          {gameState.weather && (
            <div className={styles.condition}>
              {WEATHER_ICONS[gameState.weather.toLowerCase()] || "⛅"}
              <span>{gameState.weather}</span>
            </div>
          )}
          {gameState.terrain && (
            <div className={styles.condition}>
              {TERRAIN_ICONS[gameState.terrain.toLowerCase()] || "🌍"}
              <span>{gameState.terrain}</span>
            </div>
          )}
          {gameState.pseudoWeather.length > 0 && (
            <div className={styles.pseudoWeather}>
              {gameState.pseudoWeather.map((pw) => (
                <span key={pw} className={styles.pwBadge}>
                  {pw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Opponent Side */}
      <section className={styles.side}>
        <h3 className={styles.sideTitle}>Opponent</h3>

        {/* Active Pokémon */}
        <div className={styles.activeRow}>
          {opponentSideData.active.map((pokemon, idx) => (
            <PokemonCard
              key={idx}
              pokemon={pokemon}
              slot={idx === 0 ? "a" : "b"}
              side={playerSide === "p1" ? "p2" : "p1"}
              isActive={true}
            />
          ))}
        </div>

        {/* Bench */}
        {opponentSideData.bench.length > 0 && (
          <div className={styles.bench}>
            <h4 className={styles.benchTitle}>Bench</h4>
            <div className={styles.benchPokemon}>
              {opponentSideData.bench.map((pokemon) => (
                <div key={pokemon.species} className={styles.benchItem}>
                  <div
                    className={styles.benchSprite}
                    title={pokemon.species}
                  >
                    {pokemon.species.charAt(0)}
                  </div>
                  <small>{pokemon.species}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Side Conditions */}
        {opponentSideData.sideConditions.length > 0 && (
          <div className={styles.sideConditions}>
            {opponentSideData.sideConditions.map((condition) => (
              <span key={condition} className={styles.condition}>
                {condition}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Player Side */}
      <section className={styles.side}>
        <h3 className={styles.sideTitle}>Your Pokémon</h3>

        {/* Active Pokémon */}
        <div className={styles.activeRow}>
          {playerSideData.active.map((pokemon, idx) => (
            <PokemonCard
              key={idx}
              pokemon={pokemon}
              slot={idx === 0 ? "a" : "b"}
              side={playerSide}
              isActive={true}
            />
          ))}
        </div>

        {/* Bench */}
        {playerSideData.bench.length > 0 && (
          <div className={styles.bench}>
            <h4 className={styles.benchTitle}>Bench</h4>
            <div className={styles.benchPokemon}>
              {playerSideData.bench.map((pokemon) => (
                <div key={pokemon.species} className={styles.benchItem}>
                  <div
                    className={styles.benchSprite}
                    title={pokemon.species}
                  >
                    {pokemon.species.charAt(0)}
                  </div>
                  <small>{pokemon.species}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Side Conditions */}
        {playerSideData.sideConditions.length > 0 && (
          <div className={styles.sideConditions}>
            {playerSideData.sideConditions.map((condition) => (
              <span key={condition} className={styles.condition}>
                {condition}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Turn Counter */}
      <div className={styles.turnCounter}>Turn {gameState.turn}</div>
    </div>
  );
}
