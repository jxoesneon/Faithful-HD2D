/**
 * Traits & DNA System
 *
 * Defines a trait database, DNA string encoding/decoding for inheritance,
 * and applies trait modifiers to entities.
 *
 * Traits are stored externally (not in ECS components) and managed by TraitManager.
 */

import type { Entity, Trait, ElementalType, TraitComponent } from '../../types';

// ---------------------------------------------------------------------------
// Trait Database
// ---------------------------------------------------------------------------

export const TRAIT_DATABASE: Record<string, Trait> = {
  thick_fur: {
    id: 'thick_fur',
    name: 'Thick Fur',
    description: 'Natural insulation reduces Frost damage.',
    statModifiers: { defense: 2 },
    moraleModifier: 0,
    speedMultiplier: 1.0,
  },
  thick_fur_resistance: {
    id: 'thick_fur_resistance',
    name: 'Thick Fur Resistance',
    description: 'Grants 20% Frost resistance.',
    statModifiers: { resistanceModifiers: { Frost: 0.2 } },
    moraleModifier: 0,
    speedMultiplier: 1.0,
  },
  night_vision: {
    id: 'night_vision',
    name: 'Night Vision',
    description: 'Enhanced accuracy and perception in darkness.',
    statModifiers: { attack: 1, speed: 1 },
    moraleModifier: 2,
    speedMultiplier: 1.0,
  },
  fast_metabolism: {
    id: 'fast_metabolism',
    name: 'Fast Metabolism',
    description: 'Increased speed but reduced defenses.',
    statModifiers: { defense: -1, speed: 3 },
    moraleModifier: 0,
    speedMultiplier: 1.1,
  },
  iron_will: {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Resilient psyche grants bonus morale.',
    statModifiers: { defense: 1 },
    moraleModifier: 10,
    speedMultiplier: 1.0,
  },
  bloodrage: {
    id: 'bloodrage',
    name: 'Bloodrage',
    description: 'Attack increases when health is low.',
    statModifiers: { attack: 3 },
    moraleModifier: -5,
    speedMultiplier: 1.0,
  },
  divine_blessing: {
    id: 'divine_blessing',
    name: 'Divine Blessing',
    description: 'Grants Divine resistance and minor defense.',
    statModifiers: { defense: 1, resistanceModifiers: { Divine: 0.15 } },
    moraleModifier: 5,
    speedMultiplier: 1.0,
  },
  earthen_skin: {
    id: 'earthen_skin',
    name: 'Earthen Skin',
    description: 'Earth-aligned hide grants Earth resistance.',
    statModifiers: { defense: 2, resistanceModifiers: { Earth: 0.2 } },
    moraleModifier: 0,
    speedMultiplier: 0.95,
  },
  stormborn: {
    id: 'stormborn',
    name: 'Stormborn',
    description: 'Attuned to lightning; gains speed and Lightning resistance.',
    statModifiers: { speed: 2, resistanceModifiers: { Lightning: 0.2 } },
    moraleModifier: 0,
    speedMultiplier: 1.05,
  },
  pyromaniac: {
    id: 'pyromaniac',
    name: 'Pyromaniac',
    description: 'Fire-aligned; bonus attack and Fire resistance.',
    statModifiers: { attack: 2, resistanceModifiers: { Fire: 0.15 } },
    moraleModifier: 0,
    speedMultiplier: 1.0,
  },
};

// ---------------------------------------------------------------------------
// DNA Encoding / Decoding
// ---------------------------------------------------------------------------

const DNA_TRAIT_DELIMITER = ',';
const DNA_TRAIT_PREFIX = 'T';

/**
 * Encodes an array of trait IDs into a DNA string.
 * Format: T<trait_id>,T<trait_id>,...
 *
 * @param traitIds - Array of trait IDs
 * @returns Compact DNA string
 */
export function encodeTraitsToDNA(traitIds: string[]): string {
  return traitIds.map((id) => `${DNA_TRAIT_PREFIX}${id}`).join(DNA_TRAIT_DELIMITER);
}

/**
 * Decodes a DNA string into an array of trait IDs.
 * Ignores malformed segments silently.
 *
 * @param dna - DNA string to decode
 * @returns Array of valid trait IDs
 */
export function decodeDNAtoTraits(dna: string): string[] {
  if (!dna || dna.trim().length === 0) return [];
  const traitIds: string[] = [];
  const segments = dna.split(DNA_TRAIT_DELIMITER);
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (trimmed.startsWith(DNA_TRAIT_PREFIX)) {
      const id = trimmed.slice(DNA_TRAIT_PREFIX.length);
      if (id && TRAIT_DATABASE[id]) {
        traitIds.push(id);
      }
    }
  }
  return traitIds;
}

/**
 * Creates a DNA string from a parent entity's Biology.dna field.
 * If the Biology component exists and has a dna string, decodes it;
 * otherwise returns empty array.
 */
export function parseBiologyDNA(dna: string | undefined): string[] {
  if (!dna) return [];
  return decodeDNAtoTraits(dna);
}

// ---------------------------------------------------------------------------
// Trait Application
// ---------------------------------------------------------------------------

export interface AppliedTraitBonuses {
  attack: number;
  defense: number;
  speed: number;
  range: number;
  morale: number;
  speedMultiplier: number;
  resistances: Partial<Record<ElementalType, number>>;
}

/**
 * Computes cumulative bonuses from a list of trait IDs.
 * Missing traits are silently skipped.
 */
export function calculateTraitBonuses(traitIds: string[]): AppliedTraitBonuses {
  const bonuses: AppliedTraitBonuses = {
    attack: 0,
    defense: 0,
    speed: 0,
    range: 0,
    morale: 0,
    speedMultiplier: 1.0,
    resistances: {},
  };

  for (const id of traitIds) {
    const trait = TRAIT_DATABASE[id];
    if (!trait) continue;

    const mods = trait.statModifiers;
    if (mods.attack !== undefined) bonuses.attack += mods.attack;
    if (mods.defense !== undefined) bonuses.defense += mods.defense;
    if (mods.speed !== undefined) bonuses.speed += mods.speed;
    if (mods.range !== undefined) bonuses.range += mods.range;
    if (trait.moraleModifier !== undefined) bonuses.morale += trait.moraleModifier;
    if (trait.speedMultiplier !== undefined) bonuses.speedMultiplier *= trait.speedMultiplier;

    if (mods.resistanceModifiers) {
      for (const [element, val] of Object.entries(mods.resistanceModifiers)) {
        const el = element as ElementalType;
        bonuses.resistances[el] = (bonuses.resistances[el] ?? 0) + (val ?? 0);
      }
    }
  }

  return bonuses;
}

// ---------------------------------------------------------------------------
// Trait Manager
// ---------------------------------------------------------------------------

export class TraitManager {
  private entityTraits: Map<Entity, string[]> = new Map();

  /**
   * Registers traits for an entity.
   */
  registerTraits(entity: Entity, traitIds: string[]): void {
    const validated = traitIds.filter((id) => id in TRAIT_DATABASE);
    this.entityTraits.set(entity, validated);
  }

  /**
   * Adds a single trait to an entity.
   */
  addTrait(entity: Entity, traitId: string): boolean {
    if (!TRAIT_DATABASE[traitId]) return false;
    const current = this.entityTraits.get(entity) ?? [];
    if (current.includes(traitId)) return false;
    current.push(traitId);
    this.entityTraits.set(entity, current);
    return true;
  }

  /**
   * Removes a trait from an entity.
   */
  removeTrait(entity: Entity, traitId: string): boolean {
    const current = this.entityTraits.get(entity);
    if (!current) return false;
    const idx = current.indexOf(traitId);
    if (idx === -1) return false;
    current.splice(idx, 1);
    if (current.length === 0) {
      this.entityTraits.delete(entity);
    }
    return true;
  }

  /**
   * Gets all trait IDs for an entity.
   */
  getTraits(entity: Entity): string[] {
    return [...(this.entityTraits.get(entity) ?? [])];
  }

  /**
   * Gets full Trait objects for an entity.
   */
  getTraitObjects(entity: Entity): Trait[] {
    return this.getTraits(entity)
      .map((id) => TRAIT_DATABASE[id])
      .filter(Boolean);
  }

  /**
   * Computes cumulative bonuses for an entity.
   */
  getBonuses(entity: Entity): AppliedTraitBonuses {
    return calculateTraitBonuses(this.getTraits(entity));
  }

  /**
   * Checks if an entity has a specific trait.
   */
  hasTrait(entity: Entity, traitId: string): boolean {
    return this.entityTraits.get(entity)?.includes(traitId) ?? false;
  }

  /**
   * Unregisters all traits for an entity.
   */
  unregisterTraits(entity: Entity): void {
    this.entityTraits.delete(entity);
  }

  /**
   * Returns all registered entity IDs.
   */
  getTrackedEntities(): Entity[] {
    return Array.from(this.entityTraits.keys());
  }

  /**
   * Returns entities that have a specific trait.
   */
  getEntitiesWithTrait(traitId: string): Entity[] {
    const entities: Entity[] = [];
    for (const [entity, traits] of this.entityTraits.entries()) {
      if (traits.includes(traitId)) entities.push(entity);
    }
    return entities;
  }

  /**
   * Encodes an entity's traits into a DNA string.
   */
  encodeEntityDNA(entity: Entity): string {
    return encodeTraitsToDNA(this.getTraits(entity));
  }

  /**
   * Decodes a DNA string and assigns traits to an entity.
   */
  decodeAndAssign(entity: Entity, dna: string): void {
    const traitIds = decodeDNAtoTraits(dna);
    this.registerTraits(entity, traitIds);
  }
}
