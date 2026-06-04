import { describe, it, expect, beforeEach } from 'vitest';
import {
  TraitManager,
  TRAIT_DATABASE,
  encodeTraitsToDNA,
  decodeDNAtoTraits,
  parseBiologyDNA,
  calculateTraitBonuses,
} from '../traits';

describe('TRAIT_DATABASE', () => {
  it('contains expected traits', () => {
    expect(TRAIT_DATABASE.thick_fur).toBeDefined();
    expect(TRAIT_DATABASE.night_vision).toBeDefined();
    expect(TRAIT_DATABASE.fast_metabolism).toBeDefined();
    expect(TRAIT_DATABASE.iron_will).toBeDefined();
  });

  it('every trait has id, name, description', () => {
    for (const [key, trait] of Object.entries(TRAIT_DATABASE)) {
      expect(trait.id).toBe(key);
      expect(trait.name).toBeTruthy();
      expect(trait.description).toBeTruthy();
    }
  });
});

describe('encodeTraitsToDNA', () => {
  it('encodes trait IDs into DNA string', () => {
    expect(encodeTraitsToDNA(['thick_fur', 'night_vision'])).toBe('Tthick_fur,Tnight_vision');
  });

  it('returns empty string for empty array', () => {
    expect(encodeTraitsToDNA([])).toBe('');
  });
});

describe('decodeDNAtoTraits', () => {
  it('decodes valid DNA string', () => {
    const dna = 'Tthick_fur,Tnight_vision';
    expect(decodeDNAtoTraits(dna)).toEqual(['thick_fur', 'night_vision']);
  });

  it('ignores unknown trait IDs', () => {
    const dna = 'Tthick_fur,Tunknown_trait,Tnight_vision';
    expect(decodeDNAtoTraits(dna)).toEqual(['thick_fur', 'night_vision']);
  });

  it('ignores malformed segments', () => {
    const dna = 'Tthick_fur,invalid,Tnight_vision';
    expect(decodeDNAtoTraits(dna)).toEqual(['thick_fur', 'night_vision']);
  });

  it('returns empty array for empty string', () => {
    expect(decodeDNAtoTraits('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(decodeDNAtoTraits('   ')).toEqual([]);
  });
});

describe('parseBiologyDNA', () => {
  it('parses biology dna string', () => {
    expect(parseBiologyDNA('Tthick_fur')).toEqual(['thick_fur']);
  });

  it('returns empty array for undefined', () => {
    expect(parseBiologyDNA(undefined)).toEqual([]);
  });
});

describe('calculateTraitBonuses', () => {
  it('sums attack bonuses', () => {
    const bonuses = calculateTraitBonuses(['bloodrage', 'pyromaniac']);
    expect(bonuses.attack).toBe(5);
  });

  it('sums defense bonuses', () => {
    const bonuses = calculateTraitBonuses(['thick_fur', 'earthen_skin']);
    expect(bonuses.defense).toBe(4);
  });

  it('sums speed bonuses', () => {
    const bonuses = calculateTraitBonuses(['fast_metabolism', 'stormborn']);
    expect(bonuses.speed).toBe(5);
  });

  it('applies morale modifiers', () => {
    const bonuses = calculateTraitBonuses(['iron_will', 'divine_blessing']);
    expect(bonuses.morale).toBe(15);
  });

  it('multiplies speed multipliers', () => {
    const bonuses = calculateTraitBonuses(['fast_metabolism', 'stormborn']);
    expect(bonuses.speedMultiplier).toBeCloseTo(1.1 * 1.05, 5);
  });

  it('sums resistance modifiers', () => {
    const bonuses = calculateTraitBonuses(['thick_fur_resistance', 'earthen_skin']);
    expect(bonuses.resistances.Frost).toBe(0.2);
    expect(bonuses.resistances.Earth).toBe(0.2);
  });

  it('ignores unknown trait IDs', () => {
    const bonuses = calculateTraitBonuses(['unknown_trait']);
    expect(bonuses.attack).toBe(0);
    expect(bonuses.defense).toBe(0);
  });

  it('returns zeroed bonuses for empty array', () => {
    const bonuses = calculateTraitBonuses([]);
    expect(bonuses.attack).toBe(0);
    expect(bonuses.speedMultiplier).toBe(1);
  });
});

describe('TraitManager', () => {
  let manager: TraitManager;
  let entity: string;

  beforeEach(() => {
    manager = new TraitManager();
    entity = 'entity-1';
  });

  describe('registerTraits', () => {
    it('registers traits for an entity', () => {
      manager.registerTraits(entity, ['thick_fur', 'night_vision']);
      expect(manager.getTraits(entity)).toEqual(['thick_fur', 'night_vision']);
    });

    it('filters out invalid traits', () => {
      manager.registerTraits(entity, ['thick_fur', 'invalid']);
      expect(manager.getTraits(entity)).toEqual(['thick_fur']);
    });
  });

  describe('addTrait', () => {
    it('adds a valid trait', () => {
      expect(manager.addTrait(entity, 'thick_fur')).toBe(true);
      expect(manager.hasTrait(entity, 'thick_fur')).toBe(true);
    });

    it('rejects invalid trait', () => {
      expect(manager.addTrait(entity, 'invalid')).toBe(false);
    });

    it('prevents duplicates', () => {
      manager.addTrait(entity, 'thick_fur');
      expect(manager.addTrait(entity, 'thick_fur')).toBe(false);
    });
  });

  describe('removeTrait', () => {
    it('removes an existing trait', () => {
      manager.addTrait(entity, 'thick_fur');
      expect(manager.removeTrait(entity, 'thick_fur')).toBe(true);
      expect(manager.hasTrait(entity, 'thick_fur')).toBe(false);
    });

    it('returns false for missing trait', () => {
      expect(manager.removeTrait(entity, 'thick_fur')).toBe(false);
    });
  });

  describe('getTraitObjects', () => {
    it('returns full trait objects', () => {
      manager.addTrait(entity, 'thick_fur');
      const objects = manager.getTraitObjects(entity);
      expect(objects.length).toBe(1);
      expect(objects[0].id).toBe('thick_fur');
    });
  });

  describe('getBonuses', () => {
    it('calculates cumulative bonuses for entity', () => {
      manager.registerTraits(entity, ['bloodrage', 'iron_will']);
      const bonuses = manager.getBonuses(entity);
      expect(bonuses.attack).toBe(3);
      expect(bonuses.morale).toBe(5); // iron_will +10, bloodrage -5
    });
  });

  describe('unregisterTraits', () => {
    it('removes all traits for entity', () => {
      manager.registerTraits(entity, ['thick_fur']);
      manager.unregisterTraits(entity);
      expect(manager.getTraits(entity)).toEqual([]);
    });
  });

  describe('getEntitiesWithTrait', () => {
    it('returns entities that have a specific trait', () => {
      const e2 = 'entity-2';
      manager.addTrait(entity, 'thick_fur');
      manager.addTrait(e2, 'night_vision');
      manager.addTrait(e2, 'thick_fur');
      expect(manager.getEntitiesWithTrait('thick_fur')).toContain(entity);
      expect(manager.getEntitiesWithTrait('thick_fur')).toContain(e2);
      expect(manager.getEntitiesWithTrait('night_vision')).toEqual([e2]);
    });
  });

  describe('getTrackedEntities', () => {
    it('lists all entities with traits', () => {
      const e2 = 'entity-2';
      manager.addTrait(entity, 'thick_fur');
      manager.addTrait(e2, 'night_vision');
      expect(manager.getTrackedEntities()).toHaveLength(2);
    });
  });

  describe('DNA encoding/decoding', () => {
    it('encodes entity DNA', () => {
      manager.addTrait(entity, 'thick_fur');
      manager.addTrait(entity, 'night_vision');
      expect(manager.encodeEntityDNA(entity)).toBe('Tthick_fur,Tnight_vision');
    });

    it('decodes DNA and assigns traits', () => {
      manager.decodeAndAssign(entity, 'Tthick_fur,Tnight_vision');
      expect(manager.getTraits(entity)).toEqual(['thick_fur', 'night_vision']);
    });
  });
});
