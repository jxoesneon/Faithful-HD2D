import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { DiseaseManager } from '../disease';
import { Flora, Fauna, Society, Position } from '../../../types';

describe('DiseaseManager', () => {
  let ecs: ECS;
  let manager: DiseaseManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new DiseaseManager(ecs);
  });

  it('infects a flora entity with blight', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);

    const result = manager.infectEntity(id, 'BLIGHT');
    expect(result).toBe(true);
    expect(manager.isInfected(id)).toBe(true);
  });

  it('blocks reinfection of same type', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);

    manager.infectEntity(id, 'BLIGHT');
    const result = manager.infectEntity(id, 'BLIGHT');
    expect(result).toBe(false);
  });

  it('reduces flora growth with blight', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);

    manager.infectEntity(id, 'BLIGHT');
    manager.update(60);
    const flora = ecs.getComponent<Flora>(id, 'flora');
    expect(flora!.growth).toBeLessThan(50);
    expect(flora!.diseaseActive).toBe(true);
  });

  it('increases pest level with PEST disease', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
      pestLevel: 0,
    } as Flora);

    manager.infectEntity(id, 'PEST');
    manager.update(60);
    const flora = ecs.getComponent<Flora>(id, 'flora');
    expect(flora!.pestLevel).toBeGreaterThan(0);
  });

  it('reduces fauna health with plague', () => {
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

    manager.infectEntity(id, 'PLAGUE');
    manager.update(60);
    const fauna = ecs.getComponent<Fauna>(id, 'fauna');
    expect(fauna!.health).toBeLessThan(100);
  });

  it('reduces society population with plague', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'society',
      name: 'Test',
      faction: 'ANIMIST',
      population: 100,
      technologyLevel: 1,
      resources: 100,
      happiness: 50,
    } as Society);

    manager.infectEntity(id, 'PLAGUE');
    manager.update(60);
    const society = ecs.getComponent<Society>(id, 'society');
    expect(society!.population).toBeLessThan(100);
    expect(society!.happiness).toBeLessThan(50);
  });

  it('spreads contact diseases to nearby flora', () => {
    const infectedId = ecs.createEntity();
    ecs.addComponent(infectedId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(infectedId, {
      type: 'position',
      x: 0,
      y: 0,
      z: 0,
    } as Position);

    const nearbyId = ecs.createEntity();
    ecs.addComponent(nearbyId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(nearbyId, {
      type: 'position',
      x: 1,
      y: 0,
      z: 0,
    } as Position);

    // Extend duration so it doesn't expire during test; high infectiousness forces deterministic spread
    const disease = {
      type: 'disease',
      diseaseType: 'BLIGHT' as const,
      carrierId: infectedId,
      transmissionModel: 'CONTACT' as const,
      infectiousness: 10.0,
      mortalityRate: 0,
      recoveryRate: 0,
      durationRemaining: 9999,
      spreadRadius: 2,
      isQuarantined: false,
    };
    ecs.addComponent(infectedId, disease);

    // Spread should happen on the first tick (deterministic with infectiousness=1.0)
    manager.update(1);
    expect(manager.isInfected(nearbyId)).toBe(true);
  });

  it('quarantine prevents spread', () => {
    const infectedId = ecs.createEntity();
    ecs.addComponent(infectedId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(infectedId, {
      type: 'position',
      x: 0,
      y: 0,
      z: 0,
    } as Position);

    const nearbyId = ecs.createEntity();
    ecs.addComponent(nearbyId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(nearbyId, {
      type: 'position',
      x: 1,
      y: 0,
      z: 0,
    } as Position);

    manager.infectEntity(infectedId, 'BLIGHT');
    manager.quarantine(infectedId);

    for (let i = 0; i < 100; i++) {
      manager.update(10);
    }

    expect(manager.isInfected(nearbyId)).toBe(false);
  });

  it('purify cures and grants immunity', () => {
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

    manager.infectEntity(id, 'PLAGUE');
    expect(manager.isInfected(id)).toBe(true);

    manager.purify(id);
    expect(manager.isInfected(id)).toBe(false);

    // Should be immune to reinfection
    const reinfect = manager.infectEntity(id, 'PLAGUE');
    expect(reinfect).toBe(false);
  });

  it('burnInfected destroys infected flora', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);

    manager.infectEntity(id, 'BLIGHT');
    const result = manager.burnInfected(id);
    expect(result).toBe(true);

    const flora = ecs.getComponent<Flora>(id, 'flora');
    expect(flora!.growth).toBe(0);
  });

  it('returns false for burn on non-flora', () => {
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

    const result = manager.burnInfected(id);
    expect(result).toBe(false);
  });

  it('returns disease stats', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);

    manager.infectEntity(id, 'BLIGHT');
    const stats = manager.getDiseaseStats('BLIGHT');
    expect(stats.infectedCount).toBe(1);
    expect(stats.totalChecked).toBeGreaterThanOrEqual(1);
  });

  it('computes herd immunity ratio', () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
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
      ids.push(id);
    }

    manager.infectEntity(ids[0], 'PLAGUE');
    manager.purify(ids[0]);

    const ratio = manager.getHerdImmunityRatio('PLAGUE', ids);
    expect(ratio).toBeGreaterThan(0);
  });

  it('recovers from disease naturally over time', () => {
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

    // Use a disease with very high recovery rate to force recovery
    ecs.addComponent(id, {
      type: 'disease',
      diseaseType: 'PLAGUE',
      carrierId: id,
      transmissionModel: 'AIRBORNE',
      infectiousness: 0,
      mortalityRate: 0,
      recoveryRate: 1.0,
      durationRemaining: 9999,
      spreadRadius: 8,
      isQuarantined: false,
    });

    expect(manager.isInfected(id)).toBe(true);

    // Run ticks to trigger guaranteed recovery
    for (let i = 0; i < 100; i++) {
      manager.update(1);
    }

    expect(manager.isInfected(id)).toBe(false);
    const fauna = ecs.getComponent<Fauna>(id, 'fauna');
    expect(fauna!.health).toBeGreaterThan(0);
  });

  it('getAllDiseases returns active diseases', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);

    manager.infectEntity(id, 'BLIGHT');
    const diseases = manager.getAllDiseases();
    expect(diseases.length).toBeGreaterThan(0);
    expect(diseases[0].diseaseType).toBe('BLIGHT');
  });
});
