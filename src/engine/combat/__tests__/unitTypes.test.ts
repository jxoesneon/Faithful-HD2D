import { describe, it, expect } from 'vitest';
import {
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
} from '../unitTypes';
import type { UnitClass } from '../../../types';

describe('UNIT_TEMPLATES', () => {
  it('has templates for all unit classes', () => {
    const classes: UnitClass[] = ['Infantry', 'Ranged', 'Cavalry', 'Siege', 'Support', 'Stealth'];
    for (const cls of classes) {
      expect(UNIT_TEMPLATES[cls]).toBeDefined();
      expect(UNIT_TEMPLATES[cls].unitClass).toBe(cls);
    }
  });
});

describe('doesCounter', () => {
  it('returns true for Infantry vs Cavalry', () => {
    expect(doesCounter('Infantry', 'Cavalry')).toBe(true);
  });

  it('returns true for Ranged vs Infantry', () => {
    expect(doesCounter('Ranged', 'Infantry')).toBe(true);
  });

  it('returns false when no counter relationship exists', () => {
    expect(doesCounter('Siege', 'Siege')).toBe(false);
  });
});

describe('getClassMultiplier', () => {
  it('returns 1.5 when countering', () => {
    expect(getClassMultiplier('Infantry', 'Cavalry')).toBe(COUNTER_DAMAGE_MULTIPLIER);
  });

  it('returns 0.75 when countered', () => {
    expect(getClassMultiplier('Cavalry', 'Infantry')).toBe(COUNTERED_DAMAGE_MULTIPLIER);
  });

  it('returns 1.0 for neutral matchups', () => {
    expect(getClassMultiplier('Infantry', 'Support')).toBe(1.0);
  });
});

describe('createUnitStats', () => {
  it('creates Infantry with template stats', () => {
    const stats = createUnitStats('Infantry');
    expect(stats.unitClass).toBe('Infantry');
    expect(stats.attack).toBe(UNIT_TEMPLATES.Infantry.baseStats.attack);
    expect(stats.defense).toBe(UNIT_TEMPLATES.Infantry.baseStats.defense);
    expect(stats.elementalType).toBe(UNIT_TEMPLATES.Infantry.defaultElement);
  });

  it('allows stat overrides', () => {
    const stats = createUnitStats('Ranged', { attack: 99 });
    expect(stats.attack).toBe(99);
    expect(stats.unitClass).toBe('Ranged');
  });

  it('applies base resistance bonuses from template', () => {
    const stats = createUnitStats('Support');
    expect(stats.resistances.Divine).toBe(UNIT_TEMPLATES.Support.baseResistances.Divine);
  });
});

describe('calculateSupportDefenseBonus', () => {
  it('grants bonus for nearby Support allies', () => {
    const allies = [
      { unitClass: 'Support' as UnitClass, distance: 2 },
      { unitClass: 'Infantry' as UnitClass, distance: 1 },
    ];
    expect(calculateSupportDefenseBonus(allies)).toBe(SUPPORT_DEFENSE_BONUS);
  });

  it('grants no bonus when no Support is present', () => {
    const allies = [
      { unitClass: 'Infantry' as UnitClass, distance: 1 },
      { unitClass: 'Cavalry' as UnitClass, distance: 2 },
    ];
    expect(calculateSupportDefenseBonus(allies)).toBe(0);
  });

  it('grants no bonus when Support is out of range', () => {
    const allies = [{ unitClass: 'Support' as UnitClass, distance: SUPPORT_AURA_RADIUS + 1 }];
    expect(calculateSupportDefenseBonus(allies)).toBe(0);
  });

  it('stacks for multiple Support allies', () => {
    const allies = [
      { unitClass: 'Support' as UnitClass, distance: 1 },
      { unitClass: 'Support' as UnitClass, distance: 2 },
    ];
    expect(calculateSupportDefenseBonus(allies)).toBe(SUPPORT_DEFENSE_BONUS * 2);
  });
});
