/**
 * Combat System Public API
 *
 * Export all combat-related classes, functions, and constants.
 */

// Stats & formulas
export {
  createCombatStats,
  calculateCritChance,
  rollCrit,
  rollVariance,
  calculateElementalMultiplier,
  calculateAttackDefenseRatio,
  calculateDamage,
  applySpeedModifier,
  BASE_CRIT_CHANCE,
  CRIT_MULTIPLIER,
  DAMAGE_VARIANCE,
  MIN_ATTACK_DEFENSE_RATIO,
  MAX_ATTACK_DEFENSE_RATIO,
  MIN_ELEMENTAL_MULTIPLIER,
  DEFAULT_RESISTANCES,
} from './stats';

// Unit types & specializations
export {
  UNIT_TEMPLATES,
  COUNTER_RELATIONSHIPS,
  COUNTER_DAMAGE_MULTIPLIER,
  COUNTERED_DAMAGE_MULTIPLIER,
  SUPPORT_DEFENSE_BONUS,
  SUPPORT_AURA_RADIUS,
  doesCounter,
  getClassMultiplier,
  createUnitStats,
  calculateSupportDefenseBonus,
} from './unitTypes';
export type { UnitTypeTemplate } from './unitTypes';

// Combat resolution engine
export { CombatManager } from './resolution';
export type { CombatManagerOptions } from './resolution';

// Morale & psychology
export {
  MoraleManager,
  BREAK_THRESHOLD,
  MORALE_AURA_RADIUS,
  MORALE_MODIFIERS,
} from './morale';
export type { MoraleSnapshot, MoraleManagerOptions } from './morale';
