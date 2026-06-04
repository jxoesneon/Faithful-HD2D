/**
 * Unit Types & Specializations
 *
 * Defines base stats per unit class, counter relationships,
 * and role bonuses (e.g. Support granting defense to allies).
 */

import type { CombatStats, UnitClass } from '../../types';
import { createCombatStats, DEFAULT_RESISTANCES } from './stats';

/** Base stat template for each unit class */
export interface UnitTypeTemplate {
  unitClass: UnitClass;
  baseStats: Omit<CombatStats, 'type' | 'resistances' | 'elementalType' | 'unitClass'>;
  /** Default elemental affinity */
  defaultElement: import('../../types').ElementalType;
  /** Base resistance bonuses per element */
  baseResistances: Partial<Record<import('../../types').ElementalType, number>>;
  /** Description of the unit's role */
  description: string;
}

export const UNIT_TEMPLATES: Record<UnitClass, UnitTypeTemplate> = {
  Infantry: {
    unitClass: 'Infantry',
    baseStats: { attack: 12, defense: 8, speed: 4, range: 1 },
    defaultElement: 'Earth',
    baseResistances: { Earth: 0.1 },
    description: 'Balanced frontline fighters with solid defense.',
  },
  Ranged: {
    unitClass: 'Ranged',
    baseStats: { attack: 14, defense: 3, speed: 5, range: 8 },
    defaultElement: 'Frost',
    baseResistances: { Frost: 0.1 },
    description: 'High damage at a distance but fragile.',
  },
  Cavalry: {
    unitClass: 'Cavalry',
    baseStats: { attack: 11, defense: 5, speed: 9, range: 1 },
    defaultElement: 'Lightning',
    baseResistances: { Lightning: 0.1 },
    description: 'Fast movers that excel at flanking ranged units.',
  },
  Siege: {
    unitClass: 'Siege',
    baseStats: { attack: 20, defense: 4, speed: 2, range: 12 },
    defaultElement: 'Fire',
    baseResistances: { Fire: 0.15 },
    description: 'Extreme range and damage, very slow and fragile.',
  },
  Support: {
    unitClass: 'Support',
    baseStats: { attack: 5, defense: 6, speed: 4, range: 5 },
    defaultElement: 'Divine',
    baseResistances: { Divine: 0.2 },
    description: 'Grants defense bonuses to adjacent allies.',
  },
  Stealth: {
    unitClass: 'Stealth',
    baseStats: { attack: 15, defense: 3, speed: 8, range: 2 },
    defaultElement: 'Frost',
    baseResistances: { Frost: 0.1 },
    description: 'High crit chance and speed; excels at ambush.',
  },
};

/** Counter relationship: attacker class -> array of classes it counters */
export const COUNTER_RELATIONSHIPS: Partial<Record<UnitClass, UnitClass[]>> = {
  Infantry: ['Cavalry', 'Stealth'],
  Ranged: ['Infantry', 'Siege'],
  Cavalry: ['Ranged', 'Support'],
  Siege: ['Cavalry', 'Infantry'],
  Support: ['Stealth', 'Siege'],
  Stealth: ['Ranged', 'Siege'],
};

/** Bonus multiplier when a unit attacks a class it counters */
export const COUNTER_DAMAGE_MULTIPLIER = 1.5;

/** Penalty multiplier when attacking a class that counters you */
export const COUNTERED_DAMAGE_MULTIPLIER = 0.75;

/** Defense bonus granted by an adjacent Support unit */
export const SUPPORT_DEFENSE_BONUS = 3;

/** Support aura radius (in grid/tile units) */
export const SUPPORT_AURA_RADIUS = 3;

/**
 * Checks if attacker counters target class.
 */
export function doesCounter(attackerClass: UnitClass, targetClass: UnitClass): boolean {
  return COUNTER_RELATIONSHIPS[attackerClass]?.includes(targetClass) ?? false;
}

/**
 * Returns the class interaction multiplier for damage.
 * 1.5 if countering, 0.75 if countered, 1.0 otherwise.
 */
export function getClassMultiplier(attackerClass: UnitClass, targetClass: UnitClass): number {
  if (doesCounter(attackerClass, targetClass)) return COUNTER_DAMAGE_MULTIPLIER;
  if (doesCounter(targetClass, attackerClass)) return COUNTERED_DAMAGE_MULTIPLIER;
  return 1.0;
}

/**
 * Creates CombatStats for a given unit class, merging template with overrides.
 */
export function createUnitStats(
  unitClass: UnitClass,
  overrides: Partial<Omit<CombatStats, 'type' | 'unitClass'>> = {}
): CombatStats {
  const template = UNIT_TEMPLATES[unitClass];
  const resistances = { ...DEFAULT_RESISTANCES };
  for (const [key, val] of Object.entries(template.baseResistances)) {
    resistances[key as import('../../types').ElementalType] = val ?? 0;
  }

  return createCombatStats({
    ...template.baseStats,
    elementalType: template.defaultElement,
    resistances: overrides.resistances ?? resistances,
    unitClass,
    ...overrides,
  });
}

/**
 * Calculates the defense bonus from nearby Support units.
 * Iterates over an array of ally {class, distance} objects.
 */
export function calculateSupportDefenseBonus(
  nearbyAllies: { unitClass: UnitClass; distance: number }[]
): number {
  let bonus = 0;
  for (const ally of nearbyAllies) {
    if (ally.unitClass === 'Support' && ally.distance <= SUPPORT_AURA_RADIUS) {
      bonus += SUPPORT_DEFENSE_BONUS;
    }
  }
  return bonus;
}
