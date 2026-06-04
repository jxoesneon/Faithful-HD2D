/**
 * Combat Stats System
 *
 * Provides stat definitions, base values, damage formulas,
 * critical hit calculations, variance, and elemental multipliers.
 */

import type { CombatStats, ElementalType } from '../../types';

/** Default resistance values for a neutral entity */
export const DEFAULT_RESISTANCES: Record<ElementalType, number> = {
  Fire: 0,
  Frost: 0,
  Lightning: 0,
  Earth: 0,
  Divine: 0,
};

/** Base critical hit chance (5%) */
export const BASE_CRIT_CHANCE = 0.05;

/** Critical hit damage multiplier (2x) */
export const CRIT_MULTIPLIER = 2.0;

/** Damage variance range (±15%) */
export const DAMAGE_VARIANCE = 0.15;

/** Minimum attack/defense ratio to prevent division-by-zero issues */
export const MIN_ATTACK_DEFENSE_RATIO = 0.1;

/** Maximum attack/defense ratio to prevent extreme damage */
export const MAX_ATTACK_DEFENSE_RATIO = 5.0;

/** Minimum elemental multiplier (even strong resistance doesn't fully negate) */
export const MIN_ELEMENTAL_MULTIPLIER = 0.05;

/**
 * Creates a fresh CombatStats object with default values.
 */
export function createCombatStats(
  overrides: Partial<Omit<CombatStats, 'type'>> & { type?: 'combatStats' } = {}
): CombatStats {
  return {
    type: 'combatStats',
    attack: 10,
    defense: 5,
    speed: 5,
    range: 1,
    resistances: { ...DEFAULT_RESISTANCES },
    unitClass: 'Infantry',
    ...overrides,
    elementalType: overrides.elementalType ?? 'Physical' as ElementalType,
  };
}

/**
 * Calculates critical hit chance based on speed stat.
 * Base 5% + 0.5% per speed point above 5.
 */
export function calculateCritChance(speed: number): number {
  const speedBonus = Math.max(0, speed - 5) * 0.005;
  return BASE_CRIT_CHANCE + speedBonus;
}

/**
 * Rolls for a critical hit. Returns true if crit succeeds.
 * Seeded for testability; defaults to Math.random() in production.
 */
export function rollCrit(speed: number, rng: () => number = Math.random): boolean {
  return rng() < calculateCritChance(speed);
}

/**
 * Generates a random variance multiplier in range [1 - DAMAGE_VARIANCE, 1 + DAMAGE_VARIANCE].
 * Seeded for testability.
 */
export function rollVariance(rng: () => number = Math.random): number {
  return 1 + (rng() * 2 - 1) * DAMAGE_VARIANCE;
}

/**
 * Calculates the elemental multiplier based on attacker element and target resistances.
 * resistance of 1.0 = 100% resistance = 0.05x damage (minimum).
 * resistance of 0.0 = 0% resistance = 1.0x damage.
 * Negative resistance amplifies damage.
 */
export function calculateElementalMultiplier(
  attackerElement: ElementalType,
  targetResistances: Record<ElementalType, number>
): number {
  const resistance = targetResistances[attackerElement] ?? 0;
  const multiplier = 1 - resistance;
  return Math.max(MIN_ELEMENTAL_MULTIPLIER, multiplier);
}

/**
 * Computes the attack/defense ratio, clamped to sane bounds.
 */
export function calculateAttackDefenseRatio(attack: number, defense: number): number {
  const ratio = attack / Math.max(defense, 1);
  return Math.max(MIN_ATTACK_DEFENSE_RATIO, Math.min(MAX_ATTACK_DEFENSE_RATIO, ratio));
}

/**
 * Calculates final damage from base damage, stats, and RNG rolls.
 * Returns both final damage and all intermediate multipliers for logging.
 */
export function calculateDamage(
  baseDamage: number,
  attackerStats: Pick<CombatStats, 'attack' | 'speed' | 'elementalType'>,
  targetStats: Pick<CombatStats, 'defense' | 'resistances'>,
  rng: () => number = Math.random
): {
  damage: number;
  isCrit: boolean;
  multipliers: {
    attackDefenseRatio: number;
    critMultiplier: number;
    varianceMultiplier: number;
    elementalMultiplier: number;
  };
} {
  const attackDefenseRatio = calculateAttackDefenseRatio(attackerStats.attack, targetStats.defense);
  const isCrit = rollCrit(attackerStats.speed, rng);
  const critMultiplier = isCrit ? CRIT_MULTIPLIER : 1.0;
  const varianceMultiplier = rollVariance(rng);
  const elementalMultiplier = calculateElementalMultiplier(
    attackerStats.elementalType,
    targetStats.resistances
  );

  const damage = Math.max(
    1,
    Math.round(
      baseDamage * attackDefenseRatio * critMultiplier * varianceMultiplier * elementalMultiplier
    )
  );

  return {
    damage,
    isCrit,
    multipliers: {
      attackDefenseRatio,
      critMultiplier,
      varianceMultiplier,
      elementalMultiplier,
    },
  };
}

/**
 * Calculates effective speed, factoring in a simple haste/slow multiplier.
 * Used by status effect integration.
 */
export function applySpeedModifier(baseSpeed: number, modifier: number): number {
  return Math.max(1, baseSpeed + modifier);
}
