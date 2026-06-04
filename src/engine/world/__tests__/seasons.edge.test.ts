import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { SeasonManager } from '../seasons';
import { Flora, Fauna, Position } from '../../../types';

describe('SeasonManager edge cases', () => {
  let ecs: ECS;
  let manager: SeasonManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new SeasonManager(ecs);
  });

  // Season boundary transitions
  it('returns SPRING on exact day 0', () => {
    expect(manager.getState(0).currentSeason).toBe('SPRING');
  });

  it('returns SPRING on last day of spring (day 4)', () => {
    expect(manager.getState(4).currentSeason).toBe('SPRING');
  });

  it('returns SUMMER on first day of summer (day 5)', () => {
    expect(manager.getState(5).currentSeason).toBe('SUMMER');
  });

  it('returns FALL on exact day 10', () => {
    expect(manager.getState(10).currentSeason).toBe('FALL');
  });

  it('returns WINTER on exact day 15', () => {
    expect(manager.getState(15).currentSeason).toBe('WINTER');
  });

  it('returns SPRING on exact year rollover (day 20)', () => {
    expect(manager.getState(20).currentSeason).toBe('SPRING');
  });

  it('returns SPRING on exact day 40 (two rollovers)', () => {
    expect(manager.getState(40).currentSeason).toBe('SPRING');
  });

  // Progress boundaries
  it('has seasonProgress 0 on first day of season', () => {
    expect(manager.getState(0).seasonProgress).toBe(0);
    expect(manager.getState(5).seasonProgress).toBe(0);
    expect(manager.getState(20).seasonProgress).toBe(0);
  });

  it('has seasonProgress near 0.8 on day 4', () => {
    expect(manager.getState(4).seasonProgress).toBeCloseTo(0.8, 5);
  });

  it('has daysIntoSeason 0 at season start', () => {
    expect(manager.getState(0).daysIntoSeason).toBe(0);
  });

  it('has daysIntoSeason 4 at last day of season', () => {
    expect(manager.getState(4).daysIntoSeason).toBe(4);
  });

  // Days remaining boundaries
  it('returns 5 days remaining at start of season', () => {
    expect(manager.getDaysRemainingInSeason(0)).toBe(5);
  });

  it('returns 1 day remaining at last day of season', () => {
    expect(manager.getDaysRemainingInSeason(4)).toBe(1);
    expect(manager.getDaysRemainingInSeason(9)).toBe(1);
    expect(manager.getDaysRemainingInSeason(14)).toBe(1);
    expect(manager.getDaysRemainingInSeason(19)).toBe(1);
  });

  it('returns 5 days remaining after year rollover', () => {
    expect(manager.getDaysRemainingInSeason(20)).toBe(5);
  });

  // Foliage color boundaries
  it('returns exact spring foliage color at day 0', () => {
    const state = manager.getState(0);
    expect(state.foliageColor).toEqual([0.35, 0.85, 0.35]);
  });

  it('returns exact summer foliage color at day 5', () => {
    const state = manager.getState(5);
    expect(state.foliageColor).toEqual([0.2, 0.7, 0.1]);
  });

  it('returns exact winter foliage color at day 15', () => {
    const state = manager.getState(15);
    expect(state.foliageColor).toEqual([0.9, 0.9, 0.95]);
  });

  // Year rollover & large values
  it('handles many year rollovers', () => {
    expect(manager.getState(2000).currentSeason).toBe('SPRING');
  });

  // Empty ECS
  it('does not throw when applying seasonal effects to empty ECS', () => {
    expect(() => manager.applySeasonalEffects(0)).not.toThrow();
  });

  it('does not throw when applying winter effects with no fauna', () => {
    const floraId = ecs.createEntity();
    ecs.addComponent(floraId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(floraId, {
      type: 'position',
      x: 0, y: 0, z: 0,
    } as Position);

    expect(() => manager.applySeasonalEffects(15)).not.toThrow();
  });

  it('does not throw when applying fall effects with no flora', () => {
    const faunaId = ecs.createEntity();
    ecs.addComponent(faunaId, {
      type: 'fauna',
      category: 'WOLF',
      subType: 'timber',
      health: 100,
      hunger: 10,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);

    expect(() => manager.applySeasonalEffects(10)).not.toThrow();
  });

  // Clamping edge cases
  it('clamps flora growth to max 100 in spring', () => {
    const floraId = ecs.createEntity();
    ecs.addComponent(floraId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 99.99,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(floraId, {
      type: 'position',
      x: 0, y: 0, z: 0,
    } as Position);

    manager.applySeasonalEffects(0);
    const flora = ecs.getComponent<Flora>(floraId, 'flora');
    expect(flora!.growth).toBeLessThanOrEqual(100);
  });

  it('clamps flora growth to min 0 in winter', () => {
    const floraId = ecs.createEntity();
    ecs.addComponent(floraId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 0.01,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(floraId, {
      type: 'position',
      x: 0, y: 0, z: 0,
    } as Position);

    manager.applySeasonalEffects(15);
    const flora = ecs.getComponent<Flora>(floraId, 'flora');
    expect(flora!.growth).toBeGreaterThanOrEqual(0);
  });
});
