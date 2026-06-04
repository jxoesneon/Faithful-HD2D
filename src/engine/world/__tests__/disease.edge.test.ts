import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ECS } from '../../ecs';
import { DiseaseManager } from '../disease';
import { Flora, Fauna, Society, Position, Disease } from '../../../types';

describe('DiseaseManager edge cases', () => {
  let ecs: ECS;
  let manager: DiseaseManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new DiseaseManager(ecs);
    vi.restoreAllMocks();
  });

  // Quarantine edge cases
  it('returns false when quarantining non-infected entity', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);

    const result = manager.quarantine(id);
    expect(result).toBe(false);
  });

  it('does not spread from already quarantined entity', () => {
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
      x: 0, y: 0, z: 0,
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
      x: 1, y: 0, z: 0,
    } as Position);

    manager.infectEntity(infectedId, 'BLIGHT');
    manager.quarantine(infectedId);
    manager.update(1);
    expect(manager.isInfected(nearbyId)).toBe(false);
  });

  // Zero-radius spread
  it('does not spread when spreadRadius is 0', () => {
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
      x: 0, y: 0, z: 0,
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
      x: 0, y: 0, z: 0, // same position
    } as Position);

    // Manually create disease with spreadRadius 0 and max infectiousness
    ecs.addComponent(infectedId, {
      type: 'disease',
      diseaseType: 'BLIGHT',
      carrierId: infectedId,
      transmissionModel: 'CONTACT',
      infectiousness: 1.0,
      mortalityRate: 0,
      recoveryRate: 0,
      durationRemaining: 9999,
      spreadRadius: 0,
      isQuarantined: false,
    });

    manager.update(1);
    expect(manager.isInfected(nearbyId)).toBe(false);
  });

  // Maxed infectiousness
  it('spreads disease deterministically with maxed infectiousness', () => {
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
      x: 0, y: 0, z: 0,
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
      x: 1, y: 0, z: 0,
    } as Position);

    ecs.addComponent(infectedId, {
      type: 'disease',
      diseaseType: 'BLIGHT',
      carrierId: infectedId,
      transmissionModel: 'CONTACT',
      infectiousness: 10.0,
      mortalityRate: 0,
      recoveryRate: 0,
      durationRemaining: 9999,
      spreadRadius: 2,
      isQuarantined: false,
    });

    manager.update(1);
    expect(manager.isInfected(nearbyId)).toBe(true);
  });

  // Overlapping diseases (ECS stores one 'disease' component per entity)
  it('allows different disease type when one is already active (overwrites component)', () => {
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
    // hasDisease checks for the specific type, so PEST is not considered present
    const result = manager.infectEntity(id, 'PEST');
    expect(result).toBe(true);
  });

  // Immunity edge cases
  it('grants immunity after purify and blocks reinfection', () => {
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
    manager.purify(id);
    expect(manager.infectEntity(id, 'PLAGUE')).toBe(false);
  });

  it('does not grant cross-disease immunity after purify', () => {
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
    manager.purify(id);
    // Can still infect with different disease (ECS limitation: only one disease component,
    // but infectEntity checks hasDisease which returns true because durationRemaining=0 
    // component still exists. Actually let me check...)
    // Looking at getEntityDiseases: it checks durationRemaining > 0, so expired diseases
    // are not returned. hasDisease uses getEntityDiseases, so after purify (duration=0),
    // hasDisease returns false. So infecting with a different type should succeed.
    expect(manager.infectEntity(id, 'PEST')).toBe(true);
  });

  // Herd immunity with empty population
  it('returns 0 herd immunity for empty population', () => {
    const ratio = manager.getHerdImmunityRatio('PLAGUE', []);
    expect(ratio).toBe(0);
  });

  // Disease stats with no diseases
  it('returns zero infected for disease stats with no diseases', () => {
    const stats = manager.getDiseaseStats('BLIGHT');
    expect(stats.infectedCount).toBe(0);
    expect(stats.immuneCount).toBe(0);
  });

  // Spread with no carriers
  it('does not throw when updating with no infected entities', () => {
    expect(() => manager.update(10)).not.toThrow();
  });

  // Vector transmission without fauna vector
  it('blocks vector transmission without fauna vector', () => {
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
      x: 0, y: 0, z: 0,
    } as Position);

    const targetId = ecs.createEntity();
    ecs.addComponent(targetId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(targetId, {
      type: 'position',
      x: 1, y: 0, z: 0,
    } as Position);

    ecs.addComponent(infectedId, {
      type: 'disease',
      diseaseType: 'PEST',
      carrierId: infectedId,
      transmissionModel: 'VECTOR',
      infectiousness: 1.0,
      mortalityRate: 0,
      recoveryRate: 0,
      durationRemaining: 9999,
      spreadRadius: 5,
      isQuarantined: false,
    });

    manager.update(1);
    expect(manager.isInfected(targetId)).toBe(false);
  });

  // Cleanup dead entities
  it('removes society entity when population reaches 0', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'society',
      name: 'Doomed',
      faction: 'ANIMIST',
      population: 1,
      technologyLevel: 1,
      resources: 100,
      happiness: 50,
    } as Society);

    manager.infectEntity(id, 'PLAGUE');
    // Plague reduces population by 0.001 * dt * population per tick
    // With population=1, it takes many ticks to reach 0
    for (let i = 0; i < 2000; i++) {
      manager.update(1);
    }
    expect(ecs.getEntitiesWith([])).not.toContain(id);
  });

  it('cleans up immunity memory when fauna dies', () => {
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
    manager.purify(id);
    expect(manager.getHerdImmunityRatio('PLAGUE', [id])).toBe(1);

    // Directly kill fauna and trigger cleanup
    const fauna = ecs.getComponent<Fauna>(id, 'fauna');
    fauna!.health = 0;
    manager.update(1);

    expect(ecs.getEntitiesWith(['fauna'])).not.toContain(id);
    expect(manager.getHerdImmunityRatio('PLAGUE', [id])).toBe(0);
  });

  // Purify with no diseases
  it('returns false when purifying uninfected entity', () => {
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

    expect(manager.purify(id)).toBe(false);
  });

  // Contact transmission beyond distance 2
  it('blocks contact transmission beyond distance 2', () => {
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
      x: 0, y: 0, z: 0,
    } as Position);

    const targetId = ecs.createEntity();
    ecs.addComponent(targetId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(targetId, {
      type: 'position',
      x: 3, y: 0, z: 0, // distance 3 > 2
    } as Position);

    ecs.addComponent(infectedId, {
      type: 'disease',
      diseaseType: 'BLIGHT',
      carrierId: infectedId,
      transmissionModel: 'CONTACT',
      infectiousness: 1.0,
      mortalityRate: 0,
      recoveryRate: 0,
      durationRemaining: 9999,
      spreadRadius: 5,
      isQuarantined: false,
    });

    manager.update(1);
    expect(manager.isInfected(targetId)).toBe(false);
  });

  // getAllDiseases with expired diseases
  it('excludes expired diseases from getAllDiseases', () => {
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
    expect(manager.getAllDiseases().length).toBe(1);

    // Force expiration
    const disease = ecs.getComponent<Disease>(id, 'disease');
    if (disease) disease.durationRemaining = 0;

    expect(manager.getAllDiseases().length).toBe(0);
  });

  // infectEntity with immune entity
  it('returns false when infecting immune entity', () => {
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
    manager.purify(id);
    expect(manager.infectEntity(id, 'PLAGUE')).toBe(false);
  });

  // burnInfected on non-infected flora
  it('returns false when burning non-infected flora', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);

    expect(manager.burnInfected(id)).toBe(false);
  });

  // Disease effects on entity with both flora and fauna components
  it('applies correct disease effect based on entity type', () => {
    // Note: ECS allows multiple components, so an entity can have both flora and fauna
    const id = ecs.createEntity();
    ecs.addComponent(id, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
    } as Flora);
    ecs.addComponent(id, {
      type: 'fauna',
      category: 'STAG',
      subType: 'red',
      health: 100,
      hunger: 10,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);

    manager.infectEntity(id, 'BLIGHT');
    manager.update(60);
    const flora = ecs.getComponent<Flora>(id, 'flora');
    const fauna = ecs.getComponent<Fauna>(id, 'fauna');
    expect(flora!.growth).toBeLessThan(50);
    expect(fauna!.health).toBe(100); // BLIGHT does not affect fauna
  });
});
