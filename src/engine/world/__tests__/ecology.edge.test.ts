import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ECS } from '../../ecs';
import { EcologyManager } from '../ecology';
import { Flora, Fauna, Position } from '../../../types';

describe('EcologyManager edge cases', () => {
  let ecs: ECS;
  let manager: EcologyManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new EcologyManager(ecs);
    vi.restoreAllMocks();
  });

  // Empty populations
  it('does not throw when updating with no entities', () => {
    expect(() => manager.update(10)).not.toThrow();
  });

  it('does not throw when updating with only non-ecology entities', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'society',
      name: 'Ghost',
      faction: 'ANIMIST',
      population: 0,
      technologyLevel: 1,
      resources: 0,
      happiness: 0,
    });
    expect(() => manager.update(10)).not.toThrow();
  });

  // Zero growth rates (unknown flora category)
  it('uses default growth rate for unknown flora category', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'UNKNOWN' as any,
      subType: 'mystery',
      growth: 0,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(id, {
      type: 'position',
      x: 0, y: 0, z: 0,
    } as Position);

    manager.update(100);
    const flora = ecs.getComponent<Flora>(id, 'flora');
    expect(flora!.growth).toBeGreaterThan(0);
  });

  // Maxed-out soil values
  it('clamps soil nutrients to max 100', () => {
    const soil = manager.getSoil(0, 0);
    soil.nutrients = 99.99;
    manager.update(100);
    const after = manager.getSoil(0, 0);
    expect(after.nutrients).toBeLessThanOrEqual(100);
  });

  it('clamps soil moisture to max 100', () => {
    const soil = manager.getSoil(0, 0);
    soil.moisture = 99.99;
    manager.update(100);
    const after = manager.getSoil(0, 0);
    expect(after.moisture).toBeLessThanOrEqual(100);
  });

  it('clamps ashFertility to max 1', () => {
    manager.triggerLightningStrike(0, 0, 1.0);
    manager.update(20);
    const soil = manager.getSoil(0, 0);
    expect(soil.ashFertility).toBeLessThanOrEqual(1);
  });

  it('does not regenerate nutrients above 100', () => {
    const soil = manager.getSoil(0, 0);
    soil.nutrients = 100;
    manager.update(1000);
    const after = manager.getSoil(0, 0);
    expect(after.nutrients).toBeLessThanOrEqual(100);
  });

  // Multiple fires
  it('handles multiple simultaneous fires', () => {
    manager.triggerLightningStrike(0, 0, 0.8);
    manager.triggerLightningStrike(5, 5, 0.6);
    manager.triggerLightningStrike(-3, 2, 0.9);
    expect(manager.getActiveFires().length).toBe(3);
    manager.update(20);
    expect(manager.getActiveFires().length).toBe(0);
  });

  // Fire with no nearby flora
  it('does not throw when fire spreads with no nearby flora', () => {
    manager.triggerLightningStrike(0, 0, 1.0);
    expect(() => manager.update(5)).not.toThrow();
  });

  // Edge case reproduction
  it('returns null when spawning offspring without parent position', () => {
    const parentId = ecs.createEntity();
    ecs.addComponent(parentId, {
      type: 'fauna',
      category: 'COW',
      subType: 'dairy',
      health: 100,
      hunger: 10,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);
    // No position component

    const offspringId = manager.spawnOffspring(parentId, 'COW', 'dairy');
    expect(offspringId).toBeNull();
  });

  it('returns null when parent reproduction cooldown is active', () => {
    const parentId = ecs.createEntity();
    ecs.addComponent(parentId, {
      type: 'fauna',
      category: 'COW',
      subType: 'dairy',
      health: 100,
      hunger: 10,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);
    ecs.addComponent(parentId, {
      type: 'position',
      x: 10, y: 10, z: 0,
    } as Position);

    manager.spawnOffspring(parentId, 'COW', 'dairy');
    const second = manager.spawnOffspring(parentId, 'COW', 'dairy');
    expect(second).toBeNull();
  });

  it('tracks lastOffspringId after successful spawn', () => {
    const parentId = ecs.createEntity();
    ecs.addComponent(parentId, {
      type: 'fauna',
      category: 'COW',
      subType: 'dairy',
      health: 100,
      hunger: 10,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);
    ecs.addComponent(parentId, {
      type: 'position',
      x: 10, y: 10, z: 0,
    } as Position);

    const offspringId = manager.spawnOffspring(parentId, 'COW', 'dairy');
    expect(offspringId).not.toBeNull();
  });

  // estimatePopulationTrend edge cases
  it('returns negative predatorDelta when predators exist but no prey', () => {
    const trend = manager.estimatePopulationTrend(0, 10);
    expect(trend.preyDeltaPerMinute).toBe(0);
    expect(trend.predatorDeltaPerMinute).toBeLessThan(0);
  });

  it('returns positive preyDelta when prey exist but no predators', () => {
    const trend = manager.estimatePopulationTrend(50, 0);
    expect(trend.preyDeltaPerMinute).toBeGreaterThan(0);
    expect(trend.predatorDeltaPerMinute).toBe(0);
  });

  it('returns zero deltas for zero prey and zero predators', () => {
    const trend = manager.estimatePopulationTrend(0, 0);
    expect(trend.preyDeltaPerMinute).toBe(0);
    expect(trend.predatorDeltaPerMinute).toBe(0);
  });

  // Fauna death & cleanup
  it('immediately marks dead fauna for removal', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'fauna',
      category: 'WOLF',
      subType: 'timber',
      health: 0,
      hunger: 10,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);

    manager.update(1);
    expect(ecs.getEntitiesWith(['fauna'])).not.toContain(id);
  });

  it('kills fauna from starvation when hunger reaches 90', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'fauna',
      category: 'STAG',
      subType: 'red',
      health: 10,
      hunger: 89,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);

    manager.update(100);
    expect(ecs.getEntitiesWith(['fauna'])).not.toContain(id);
  });

  it('does not kill fauna with health above 0 and hunger below 90', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'fauna',
      category: 'STAG',
      subType: 'red',
      health: 100,
      hunger: 10,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);

    manager.update(100);
    expect(ecs.getEntitiesWith(['fauna'])).toContain(id);
  });

  // Flora without position
  it('does not throw when flora lacks position component', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    // No position
    expect(() => manager.update(10)).not.toThrow();
  });

  // Fire intensity boundaries
  it('caps soil fire intensity at maximum 1', () => {
    manager.triggerLightningStrike(0, 0, 5.0);
    const soil = manager.getSoil(0, 0);
    expect(soil.fireIntensity).toBeLessThanOrEqual(1);
  });

  it('extinguishes fire when intensity reaches 0', () => {
    manager.triggerLightningStrike(0, 0, 0.01);
    manager.update(2);
    expect(manager.getActiveFires().length).toBe(0);
  });

  // Soil at negative coordinates
  it('creates and tracks soil at negative coordinates', () => {
    const soil = manager.getSoil(-5, -10);
    expect(soil.x).toBe(-5);
    expect(soil.y).toBe(-10);
  });

  // Flora lifecycle: exact stage thresholds
  it('transitions flora to SPROUT exactly at growth 10', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 9.99,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(id, {
      type: 'position',
      x: 0, y: 0, z: 0,
    } as Position);

    manager.update(1);
    expect(manager.getFloraStage(id)).toBe('SPROUT');
  });

  it('transitions flora to MATURE exactly at growth 40', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 39.99,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(id, {
      type: 'position',
      x: 0, y: 0, z: 0,
    } as Position);
    ecs.addComponent(id, {
      type: 'floraLifecycle',
      stage: 'SPROUT',
      ageMinutes: 0,
      seedDropTimer: 0,
      decayProgress: 0,
    });

    manager.update(1);
    expect(manager.getFloraStage(id)).toBe('MATURE');
  });

  it('transitions flora to DECAYING exactly at growth 90', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 89.99,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(id, {
      type: 'position',
      x: 0, y: 0, z: 0,
    } as Position);
    ecs.addComponent(id, {
      type: 'floraLifecycle',
      stage: 'MATURE',
      ageMinutes: 0,
      seedDropTimer: 0,
      decayProgress: 0,
    });

    manager.update(1);
    expect(manager.getFloraStage(id)).toBe('DECAYING');
  });
});
