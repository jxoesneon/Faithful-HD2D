import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { SeasonManager } from '../seasons';
import { Flora, Fauna, Position } from '../../../types';

describe('SeasonManager', () => {
  let ecs: ECS;
  let manager: SeasonManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new SeasonManager(ecs);
  });

  it('returns SPRING for days 0-4', () => {
    expect(manager.getState(0).currentSeason).toBe('SPRING');
    expect(manager.getState(4).currentSeason).toBe('SPRING');
  });

  it('returns SUMMER for days 5-9', () => {
    expect(manager.getState(5).currentSeason).toBe('SUMMER');
    expect(manager.getState(9).currentSeason).toBe('SUMMER');
  });

  it('returns FALL for days 10-14', () => {
    expect(manager.getState(10).currentSeason).toBe('FALL');
    expect(manager.getState(14).currentSeason).toBe('FALL');
  });

  it('returns WINTER for days 15-19', () => {
    expect(manager.getState(15).currentSeason).toBe('WINTER');
    expect(manager.getState(19).currentSeason).toBe('WINTER');
  });

  it('cycles back to SPRING after 20 days', () => {
    expect(manager.getState(20).currentSeason).toBe('SPRING');
    expect(manager.getState(24).currentSeason).toBe('SPRING');
  });

  it('reports season progress within 0-1', () => {
    const state = manager.getState(2);
    expect(state.seasonProgress).toBeCloseTo(0.4, 5);
    expect(state.daysIntoSeason).toBe(2);
  });

  it('has high snow cover in winter', () => {
    const winter = manager.getState(15);
    expect(winter.snowCoverProbability).toBe(0.8);
  });

  it('has zero snow cover in summer', () => {
    const summer = manager.getState(5);
    expect(summer.snowCoverProbability).toBe(0);
  });

  it('has high dry grass in summer', () => {
    const summer = manager.getState(5);
    expect(summer.dryGrassProbability).toBe(0.6);
  });

  it('has higher crop growth in spring', () => {
    const spring = manager.getState(0);
    const winter = manager.getState(15);
    expect(spring.cropGrowthMultiplier).toBeGreaterThan(winter.cropGrowthMultiplier);
  });

  it('has higher food scarcity in winter', () => {
    const winter = manager.getState(15);
    const summer = manager.getState(5);
    expect(winter.foodScarcityMultiplier).toBeGreaterThan(summer.foodScarcityMultiplier);
  });

  it('has higher migration probability in fall', () => {
    const fall = manager.getState(10);
    expect(fall.animalMigrationProbability).toBe(0.4);
  });

  it('interpolates foliage colors between seasons', () => {
    const spring = manager.getState(0);
    const summer = manager.getState(5);
    const mid = manager.getState(4);
    // Day 4 is 80% through spring, foliage should be transitioning toward summer
    expect(mid.foliageColor).not.toEqual(spring.foliageColor);
    expect(mid.foliageColor).not.toEqual(summer.foliageColor);
  });

  it('predicts future season state', () => {
    const prediction = manager.predictSeason(25);
    expect(prediction.currentSeason).toBe('SUMMER');
  });

  it('returns days remaining in season', () => {
    expect(manager.getDaysRemainingInSeason(0)).toBe(5);
    expect(manager.getDaysRemainingInSeason(4)).toBe(1);
    expect(manager.getDaysRemainingInSeason(5)).toBe(5);
  });

  describe('applySeasonalEffects', () => {
    it('slows flora growth in winter', () => {
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
        x: 0,
        y: 0,
        z: 0,
      } as Position);

      manager.applySeasonalEffects(15); // winter
      const flora = ecs.getComponent<Flora>(floraId, 'flora');
      expect(flora!.growth).toBeLessThan(50);
    });

    it('accelerates flora growth in spring', () => {
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
        x: 0,
        y: 0,
        z: 0,
      } as Position);

      manager.applySeasonalEffects(0); // spring
      const flora = ecs.getComponent<Flora>(floraId, 'flora');
      expect(flora!.growth).toBeGreaterThan(50);
    });

    it('increases fauna hunger in winter', () => {
      const faunaId = ecs.createEntity();
      ecs.addComponent(faunaId, {
        type: 'fauna',
        category: 'STAG',
        subType: 'red',
        health: 100,
        hunger: 10,
        aggressiveness: 10,
        actionState: 'WANDERING',
      } as Fauna);

      manager.applySeasonalEffects(15); // winter
      const fauna = ecs.getComponent<Fauna>(faunaId, 'fauna');
      expect(fauna!.hunger).toBeGreaterThan(10);
    });

    it('increases fauna aggressiveness in fall', () => {
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

      manager.applySeasonalEffects(10); // fall
      const fauna = ecs.getComponent<Fauna>(faunaId, 'fauna');
      expect(fauna!.aggressiveness).toBeGreaterThan(10);
    });
  });
});
