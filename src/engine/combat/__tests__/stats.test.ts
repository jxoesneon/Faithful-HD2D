import { describe, it, expect } from 'vitest';
import {
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
} from '../stats';
import type { CombatStats, ElementalType } from '../../../types';

describe('createCombatStats', () => {
  it('creates default combat stats', () => {
    const stats = createCombatStats();
    expect(stats.type).toBe('combatStats');
    expect(stats.attack).toBe(10);
    expect(stats.defense).toBe(5);
    expect(stats.speed).toBe(5);
    expect(stats.range).toBe(1);
    expect(stats.unitClass).toBe('Infantry');
    expect(stats.resistances).toEqual(DEFAULT_RESISTANCES);
  });

  it('applies overrides', () => {
    const stats = createCombatStats({ attack: 20, defense: 15, speed: 8 });
    expect(stats.attack).toBe(20);
    expect(stats.defense).toBe(15);
    expect(stats.speed).toBe(8);
  });

  it('clones default resistances so mutations do not leak', () => {
    const stats = createCombatStats();
    stats.resistances.Fire = 0.5;
    const stats2 = createCombatStats();
    expect(stats2.resistances.Fire).toBe(0);
  });
});

describe('calculateCritChance', () => {
  it('returns base chance at speed 5', () => {
    expect(calculateCritChance(5)).toBe(BASE_CRIT_CHANCE);
  });

  it('adds 0.5% per speed above 5', () => {
    expect(calculateCritChance(10)).toBe(BASE_CRIT_CHANCE + 5 * 0.005);
  });

  it('does not go below base chance', () => {
    expect(calculateCritChance(1)).toBe(BASE_CRIT_CHANCE);
  });
});

describe('rollCrit', () => {
  it('returns true when rng is below threshold', () => {
    expect(rollCrit(5, () => 0)).toBe(true);
  });

  it('returns false when rng is above threshold', () => {
    expect(rollCrit(5, () => 1)).toBe(false);
  });

  it('returns false exactly at threshold', () => {
    expect(rollCrit(5, () => BASE_CRIT_CHANCE)).toBe(false);
  });
});

describe('rollVariance', () => {
  it('returns 1.0 when rng is 0.5 (midpoint)', () => {
    expect(rollVariance(() => 0.5)).toBe(1);
  });

  it('returns max when rng is 1', () => {
    expect(rollVariance(() => 1)).toBe(1 + DAMAGE_VARIANCE);
  });

  it('returns min when rng is 0', () => {
    expect(rollVariance(() => 0)).toBe(1 - DAMAGE_VARIANCE);
  });
});

describe('calculateElementalMultiplier', () => {
  it('returns 1.0 for zero resistance', () => {
    expect(calculateElementalMultiplier('Fire', DEFAULT_RESISTANCES)).toBe(1);
  });

  it('returns 0.5 for 50% resistance', () => {
    const res = { ...DEFAULT_RESISTANCES, Fire: 0.5 };
    expect(calculateElementalMultiplier('Fire', res)).toBe(0.5);
  });

  it('returns min multiplier for 100% resistance', () => {
    const res = { ...DEFAULT_RESISTANCES, Fire: 1.0 };
    expect(calculateElementalMultiplier('Fire', res)).toBe(MIN_ELEMENTAL_MULTIPLIER);
  });

  it('returns >1 for negative resistance', () => {
    const res = { ...DEFAULT_RESISTANCES, Fire: -0.2 };
    expect(calculateElementalMultiplier('Fire', res)).toBe(1.2);
  });
});

describe('calculateAttackDefenseRatio', () => {
  it('returns attack / defense for normal values', () => {
    expect(calculateAttackDefenseRatio(10, 5)).toBe(2);
  });

  it('clamps to min ratio for very low attack', () => {
    expect(calculateAttackDefenseRatio(0.1, 100)).toBe(MIN_ATTACK_DEFENSE_RATIO);
  });

  it('clamps to max ratio for very high attack', () => {
    expect(calculateAttackDefenseRatio(1000, 1)).toBe(MAX_ATTACK_DEFENSE_RATIO);
  });

  it('prevents division by zero and clamps to max ratio', () => {
    expect(calculateAttackDefenseRatio(10, 0)).toBe(5); // 10/1 clamped to MAX_ATTACK_DEFENSE_RATIO
  });
});

describe('calculateDamage', () => {
  const attacker: Pick<CombatStats, 'attack' | 'speed' | 'elementalType'> = {
    attack: 10,
    speed: 5,
    elementalType: 'Fire',
  };

  const target: Pick<CombatStats, 'defense' | 'resistances'> = {
    defense: 5,
    resistances: { ...DEFAULT_RESISTANCES },
  };

  it('calculates damage with all multipliers at baseline', () => {
    // crit false, variance 1.0, elemental 1.0
    const rng = () => 0.99; // above crit threshold, variance = 1 + (0.99*2-1)*0.15 = 1.1475
    const result = calculateDamage(10, attacker, target, rng);
    expect(result.damage).toBeGreaterThanOrEqual(1);
    expect(result.isCrit).toBe(false);
    expect(result.multipliers.critMultiplier).toBe(1);
    expect(result.multipliers.elementalMultiplier).toBe(1);
  });

  it('produces crit when rng is low enough', () => {
    let calls = 0;
    const rng = () => {
      calls++;
      return calls === 1 ? 0 : 0.5; // first call = crit roll, second = variance
    };
    const result = calculateDamage(10, attacker, target, rng);
    expect(result.isCrit).toBe(true);
    expect(result.multipliers.critMultiplier).toBe(CRIT_MULTIPLIER);
  });

  it('caps minimum damage at 1', () => {
    const weakAttacker = { attack: 1, speed: 1, elementalType: 'Fire' as ElementalType };
    const strongTarget = { defense: 999, resistances: { ...DEFAULT_RESISTANCES, Fire: 1.0 } };
    const result = calculateDamage(1, weakAttacker, strongTarget, () => 0);
    expect(result.damage).toBe(1);
  });
});

describe('applySpeedModifier', () => {
  it('adds modifier to base speed', () => {
    expect(applySpeedModifier(5, 3)).toBe(8);
  });

  it('does not drop below 1', () => {
    expect(applySpeedModifier(5, -10)).toBe(1);
  });
});
