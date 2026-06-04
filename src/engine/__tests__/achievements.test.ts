import { describe, it, expect } from 'vitest';
import { AchievementEngine, ACHIEVEMENT_DATABASE, PLAYER_TITLES } from '../achievements';
import type { WorldStateSnapshot } from '../../types';

const baseWorld: WorldStateSnapshot = {
  population: 100,
  tribeCount: 1,
  averageHappiness: 50,
  averageTech: 2,
  weather: 'CLEAR',
  devotion: 200,
  totalStructures: 10,
  totalFlora: 40,
  totalFauna: 20,
  conflictsActive: 0,
  timePlayed: 0,
};

describe('ACHIEVEMENT_DATABASE', () => {
  it('has 50+ achievements', () => {
    expect(ACHIEVEMENT_DATABASE.length).toBeGreaterThanOrEqual(50);
  });

  it('has valid categories', () => {
    const valid = new Set(['Progression', 'Combat', 'Divine', 'Economy', 'Ecology', 'Social', 'Secret']);
    for (const ach of ACHIEVEMENT_DATABASE) {
      expect(valid.has(ach.category)).toBe(true);
    }
  });
});

describe('AchievementEngine', () => {
  it('unlocks stat_threshold achievements', () => {
    const engine = new AchievementEngine();
    const world = { ...baseWorld, tribeCount: 1 };
    const unlocked = engine.update(world);
    expect(unlocked).toContain('ach_first_tribe');
    expect(engine.isUnlocked('ach_first_tribe')).toBe(true);
  });

  it('unlocks event_trigger achievements', () => {
    const engine = new AchievementEngine();
    engine.triggerEvent('evt_prophet');
    const unlocked = engine.update(baseWorld);
    expect(unlocked).toContain('ach_prophet');
  });

  it('unlocks compound achievements', () => {
    const engine = new AchievementEngine();
    engine.setCustomStat('peaceTime', 300);
    const world = { ...baseWorld, conflictsActive: 0, peaceTime: 300 } as any;
    engine.update(world);
    expect(engine.isUnlocked('ach_pacifist')).toBe(true);
  });

  it('tracks progress', () => {
    const engine = new AchievementEngine();
    engine.update(baseWorld);
    const prog = engine.getProgress('ach_city_builder');
    expect(prog).toBeDefined();
    expect(prog!.current).toBe(100);
  });

  it('computes completion rate', () => {
    const engine = new AchievementEngine();
    expect(engine.completionRate).toBe(0);
    engine.update({ ...baseWorld, tribeCount: 1 });
    expect(engine.completionRate).toBeGreaterThan(0);
    expect(engine.completionRate).toBeLessThanOrEqual(1);
  });

  it('returns a title', () => {
    const engine = new AchievementEngine();
    expect(engine.getCurrentTitle().id).toBe('title_novice');
  });

  it('counts unlocked', () => {
    const engine = new AchievementEngine();
    engine.update({ ...baseWorld, tribeCount: 1, population: 50 });
    expect(engine.unlockedCount).toBeGreaterThanOrEqual(2);
  });
});
