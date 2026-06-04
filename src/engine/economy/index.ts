/**
 * Economy & Progression Systems for Faithful
 *
 * This module provides standalone manager classes for:
 * - Resource management and storage
 * - Gathering and harvesting
 * - Inventory, equipment, and loot
 * - Crafting and production queues
 * - Technology tree research
 * - Population dynamics (birth, death, migration)
 *
 * All managers accept an ECS instance and operate independently
 * of the Rust WASM simulation core.
 */

export {
  ResourceManager,
  RESOURCE_META,
  DEFAULT_STORAGE_CAPACITY,
  FLORA_RESOURCE_MAP,
} from './resources';
export type { ResourceMeta } from './resources';

export {
  GatheringManager,
} from './gathering';
export type { GatherTickResult } from './gathering';

export {
  InventoryManager,
  DEFAULT_LOOT_TABLES,
  RARITY_EFFECT_MULTIPLIER,
} from './inventory';
export type { LootEntry, LootTable } from './inventory';

export {
  CraftingManager,
  DEFAULT_RECIPES,
} from './crafting';
export type { CraftingResult } from './crafting';

export {
  TechTreeManager,
  DEFAULT_TECHNOLOGIES,
} from './techTree';

export {
  PopulationManager,
  DEFAULT_POPULATION_CONFIG,
} from './population';
export type { PopulationConfig, BirthEvent, DeathEvent, MigrationEvent } from './population';
