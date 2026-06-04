/**
 * Status System Public API
 *
 * Export all status-effect and trait-related classes, functions, and constants.
 */

// Status effects
export {
  StatusEffectManager,
  STATUS_EFFECT_DEFS,
} from './effects';
export type {
  StatusEffectDef,
  TickResult,
} from './effects';

// Traits & DNA
export {
  TraitManager,
  TRAIT_DATABASE,
  encodeTraitsToDNA,
  decodeDNAtoTraits,
  parseBiologyDNA,
  calculateTraitBonuses,
} from './traits';
export type { AppliedTraitBonuses } from './traits';
