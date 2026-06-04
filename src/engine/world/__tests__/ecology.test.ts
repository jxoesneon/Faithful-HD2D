import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { EcologyManager } from '../ecology';
import { Flora, Fauna, Position } from '../../../types';

describe('EcologyManager', () => {
  let ecs: ECS;
  let manager: EcologyManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new EcologyManager(ecs);
  });

  // ---------------------------------------------------------------------------
  // Flora Lifecycle
  // ---------------------------------------------------------------------------

  it('advances flora from SEED to SPROUT', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 0,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(id, {
      type: 'position',
      x: 0,
      y: 0,
      z: 0,
    } as Position);

    manager.update(300); // enough game minutes to reach SPROUT
    expect(manager.getFloraStage(id)).toBe('SPROUT');
  });

  it('advances flora from SPROUT to MATURE', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 10,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(id, {
      type: 'position',
      x: 0,
      y: 0,
      z: 0,
    } as Position);

    // Pre-seed lifecycle to SPROUT so the test targets the right transition
    ecs.addComponent(id, {
      type: 'floraLifecycle',
      stage: 'SPROUT',
      ageMinutes: 0,
      seedDropTimer: 0,
      decayProgress: 0,
    });
    manager.update(800);
    expect(manager.getFloraStage(id)).toBe('MATURE');
  });

  it('decays mature flora over time', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 90,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(id, {
      type: 'position',
      x: 0,
      y: 0,
      z: 0,
    } as Position);
    // Pre-seed lifecycle to MATURE so it can decay
    ecs.addComponent(id, {
      type: 'floraLifecycle',
      stage: 'MATURE',
      ageMinutes: 0,
      seedDropTimer: 0,
      decayProgress: 0,
    });

    manager.update(100);
    expect(manager.getFloraStage(id)).toBe('DECAYING');
  });

  it('cycles dead flora back to seed after timer', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 0,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(id, {
      type: 'position',
      x: 0,
      y: 0,
      z: 0,
    } as Position);

    // Pre-seed lifecycle to DECAYING and push to DEAD quickly
    ecs.addComponent(id, {
      type: 'floraLifecycle',
      stage: 'DECAYING',
      ageMinutes: 0,
      seedDropTimer: 0,
      decayProgress: 0.99,
    });
    ecs.getComponent<Flora>(id, 'flora')!.growth = 1;

    manager.update(10);
    expect(manager.getFloraStage(id)).toBe('DEAD');

    manager.update(40);
    expect(manager.getFloraStage(id)).toBe('SEED');
  });

  // ---------------------------------------------------------------------------
  // Fauna Lifecycle
  // ---------------------------------------------------------------------------

  it('tracks fauna birth stage', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'fauna',
      category: 'WOLF',
      subType: 'timber',
      health: 100,
      hunger: 10,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);

    manager.update(10);
    expect(manager.getFaunaStage(id)).toBe('BIRTH');
  });

  it('advances fauna to GROWTH stage', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'fauna',
      category: 'WOLF',
      subType: 'timber',
      health: 100,
      hunger: 10,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);

    manager.update(500); // exceeds 30% of reproduction age
    expect(manager.getFaunaStage(id)).toBe('GROWTH');
  });

  it('kills fauna when health reaches zero', () => {
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

    manager.update(10);
    expect(ecs.getEntitiesWith(['fauna'])).not.toContain(id);
  });

  // ---------------------------------------------------------------------------
  // Predator-Prey
  // ---------------------------------------------------------------------------

  it('wolves hunt nearby stags', () => {
    const wolfId = ecs.createEntity();
    ecs.addComponent(wolfId, {
      type: 'fauna',
      category: 'WOLF',
      subType: 'timber',
      health: 100,
      hunger: 50,
      aggressiveness: 50,
      actionState: 'WANDERING',
    } as Fauna);
    ecs.addComponent(wolfId, {
      type: 'position',
      x: 0,
      y: 0,
      z: 0,
    } as Position);

    const stagId = ecs.createEntity();
    ecs.addComponent(stagId, {
      type: 'fauna',
      category: 'STAG',
      subType: 'red',
      health: 100,
      hunger: 10,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);
    ecs.addComponent(stagId, {
      type: 'position',
      x: 1,
      y: 0,
      z: 0,
    } as Position);

    manager.update(10);
    const stag = ecs.getComponent<Fauna>(stagId, 'fauna');
    expect(stag!.health).toBeLessThan(100);
  });

  it('stags graze nearby crops', () => {
    const stagId = ecs.createEntity();
    ecs.addComponent(stagId, {
      type: 'fauna',
      category: 'STAG',
      subType: 'red',
      health: 100,
      hunger: 50,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);
    ecs.addComponent(stagId, {
      type: 'position',
      x: 0,
      y: 0,
      z: 0,
    } as Position);

    const cropId = ecs.createEntity();
    ecs.addComponent(cropId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(cropId, {
      type: 'position',
      x: 1,
      y: 0,
      z: 0,
    } as Position);

    manager.update(10);
    const crop = ecs.getComponent<Flora>(cropId, 'flora');
    expect(crop!.growth).toBeLessThan(50);
  });

  it('estimates population trends via Lotka-Volterra', () => {
    const trend = manager.estimatePopulationTrend(50, 5);
    expect(typeof trend.preyDeltaPerMinute).toBe('number');
    expect(typeof trend.predatorDeltaPerMinute).toBe('number');
  });

  // ---------------------------------------------------------------------------
  // Soil
  // ---------------------------------------------------------------------------

  it('creates soil cells on demand', () => {
    const soil = manager.getSoil(5, 5);
    expect(soil.x).toBe(5);
    expect(soil.y).toBe(5);
    expect(soil.moisture).toBeGreaterThanOrEqual(0);
    expect(soil.nutrients).toBeGreaterThanOrEqual(0);
  });

  it('regenerates soil nutrients over time', () => {
    const soil = manager.getSoil(0, 0);
    const before = soil.nutrients;
    manager.update(100);
    const after = manager.getSoil(0, 0).nutrients;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  // ---------------------------------------------------------------------------
  // Fire
  // ---------------------------------------------------------------------------

  it('starts a fire on lightning strike', () => {
    manager.triggerLightningStrike(0, 0, 0.8);
    const fires = manager.getActiveFires();
    expect(fires.length).toBeGreaterThan(0);
    expect(fires[0].intensity).toBeGreaterThan(0);
  });

  it('fire intensity decays over time', () => {
    manager.triggerLightningStrike(0, 0, 0.8);
    manager.update(20);
    const fires = manager.getActiveFires();
    expect(fires.length).toBe(0); // fire should have burnt out
  });

  it('deposits ash fertility after fire', () => {
    manager.triggerLightningStrike(0, 0, 0.8);
    manager.update(20);
    const soil = manager.getSoil(0, 0);
    expect(soil.ashFertility).toBeGreaterThan(0);
  });

  it('fire damages nearby flora', () => {
    const cropId = ecs.createEntity();
    ecs.addComponent(cropId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 80,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(cropId, {
      type: 'position',
      x: 0.5,
      y: 0,
      z: 0,
    } as Position);

    manager.triggerLightningStrike(0, 0, 1.0);
    manager.update(5);
    const crop = ecs.getComponent<Flora>(cropId, 'flora');
    expect(crop!.growth).toBeLessThan(80);
  });

  // ---------------------------------------------------------------------------
  // Reproduction
  // ---------------------------------------------------------------------------

  it('spawns offspring near parent', () => {
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
      x: 10,
      y: 10,
      z: 0,
    } as Position);

    const offspringId = manager.spawnOffspring(parentId, 'COW', 'dairy');
    expect(offspringId).toBeTruthy();
    const pos = ecs.getComponent<Position>(offspringId!, 'position');
    expect(pos!.x).not.toBe(10);
    expect(pos!.y).not.toBe(10);
  });

  it('prevents rapid repeat reproduction', () => {
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
      x: 10,
      y: 10,
      z: 0,
    } as Position);

    manager.spawnOffspring(parentId, 'COW', 'dairy');
    const second = manager.spawnOffspring(parentId, 'COW', 'dairy');
    expect(second).toBeNull();
  });
});
