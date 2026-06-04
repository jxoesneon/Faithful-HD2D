import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { PopulationManager, DEFAULT_POPULATION_CONFIG } from '../population';
import type { PopulationData, Society, Housing, Position, ResourceStorage } from '../../../types';

describe('PopulationManager', () => {
  let ecs: ECS;
  let manager: PopulationManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new PopulationManager(ecs);
  });

  it('creates population data', () => {
    const entity = ecs.createEntity();
    const society = ecs.createEntity();
    const data = manager.createPopulationData(entity, society, 25, 'M', 80);
    expect(data.age).toBe(25);
    expect(data.gender).toBe('M');
    expect(data.maxAge).toBe(80);
    expect(data.societyId).toBe(society);
    expect(data.isChild).toBe(false);
  });

  it('creates housing', () => {
    const structure = ecs.createEntity();
    manager.createHousing(structure, 5, 2);
    const housing = ecs.getComponent<Housing>(structure, 'housing');
    expect(housing).toBeDefined();
    expect(housing!.capacity).toBe(5);
    expect(housing!.comfortLevel).toBe(2);
    expect(housing!.occupants).toEqual([]);
  });

  it('counts population per society', () => {
    const society = ecs.createEntity();
    const e1 = ecs.createEntity();
    manager.createPopulationData(e1, society, 20, 'M', 70);
    const e2 = ecs.createEntity();
    manager.createPopulationData(e2, society, 25, 'F', 70);
    const otherSociety = ecs.createEntity();
    const e3 = ecs.createEntity();
    manager.createPopulationData(e3, otherSociety, 30, 'M', 70);

    expect(manager.getPopulationCount(society)).toBe(2);
    expect(manager.getPopulationCount(otherSociety)).toBe(1);
  });

  it('calculates population cap', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);

    const house = ecs.createEntity();
    manager.createHousing(house, 10);
    ecs.addComponent(house, { type: 'position', x: 0, y: 0, z: 0 } as Position);

    expect(manager.getPopulationCap(society, 5)).toBe(10 + 100 + 5); // housing + food*20 + base
  });

  it('processes pregnancy and birth', () => {
    const customManager = new PopulationManager(ecs, { baseCouplingChance: 1.0, pregnancyDuration: 2, childGrowthDuration: 5 });
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);

    const female = ecs.createEntity();
    customManager.createPopulationData(female, society, 25, 'F', 70);
    const male = ecs.createEntity();
    customManager.createPopulationData(male, society, 25, 'M', 70);

    // Add food so they don't starve during the test
    const store = ecs.createEntity();
    ecs.addComponent(store, { type: 'resourceStorage', capacity: 1000, contents: { Food: 1000 }, structureType: 'FARM' } as ResourceStorage);
    ecs.addComponent(store, { type: 'position', x: 0, y: 0, z: 0 } as Position);

    const events = { births: [] as any[], deaths: [] as any[], migrations: [] as any[] };

    customManager.update(1, events);
    customManager.update(5, events);

    expect(events.births.length).toBeGreaterThan(0);
  });

  it('processes child growth', () => {
    const customManager = new PopulationManager(ecs, { starvationThreshold: 10000 });
    const society = ecs.createEntity();
    const child = ecs.createEntity();
    // Use high maxAge so age-mortality does not kill the child during growth
    customManager.createPopulationData(child, society, 0, 'M', 200);
    const data = ecs.getComponent<PopulationData>(child, 'populationData')!;
    expect(data.isChild).toBe(true);

    // Add food so child doesn't starve
    const store = ecs.createEntity();
    ecs.addComponent(store, { type: 'resourceStorage', capacity: 1000, contents: { Food: 1000 }, structureType: 'FARM' } as ResourceStorage);
    ecs.addComponent(store, { type: 'position', x: 0, y: 0, z: 0 } as Position);

    const events = { births: [] as any[], deaths: [] as any[], migrations: [] as any[] };
    // Update in chunks to avoid age-mortality death within a single large tick
    const chunks = 12;
    const chunkSize = (DEFAULT_POPULATION_CONFIG.childGrowthDuration + 1) / chunks;
    for (let i = 0; i < chunks; i++) {
      customManager.update(chunkSize, events);
    }

    const updated = ecs.getComponent<PopulationData>(child, 'populationData');
    expect(updated!.isChild).toBe(false);
  });

  it('processes starvation', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);

    const person = ecs.createEntity();
    manager.createPopulationData(person, society, 30, 'M', 70);
    ecs.addComponent(person, { type: 'position', x: 0, y: 0, z: 0 } as Position);

    const events = { births: [] as any[], deaths: [] as any[], migrations: [] as any[] };
    // No food storage => starvation
    manager.update(100, events);
    expect(events.deaths.length).toBeGreaterThan(0);
    expect(ecs.getEntitiesWith(['populationData']).includes(person)).toBe(false);
  });

  it('processes age mortality', () => {
    const society = ecs.createEntity();
    const old = ecs.createEntity();
    manager.createPopulationData(old, society, 69, 'M', 70);

    const events = { births: [] as any[], deaths: [] as any[], migrations: [] as any[] };
    // Run until death from old age
    for (let i = 0; i < 1000; i++) {
      manager.update(1, events);
      if (!ecs.getEntitiesWith(['populationData']).includes(old)) break;
    }

    expect(events.deaths.some(d => d.cause === 'Age')).toBe(true);
    expect(ecs.getEntitiesWith(['populationData']).includes(old)).toBe(false);
  });

  it('processes disease death', () => {
    const society = ecs.createEntity();
    const person = ecs.createEntity();
    manager.createPopulationData(person, society, 30, 'M', 70);
    manager.infectEntity(person);

    const events = { births: [] as any[], deaths: [] as any[], migrations: [] as any[] };
    manager.update(DEFAULT_POPULATION_CONFIG.diseaseDeathThreshold + 10, events);

    expect(events.deaths.some(d => d.cause === 'Disease')).toBe(true);
  });

  it('processes migration based on happiness', () => {
    const customManager = new PopulationManager(ecs, { starvationThreshold: 100000 });
    const happySociety = ecs.createEntity();
    ecs.addComponent(happySociety, { type: 'society', name: 'Happy', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);

    const sadSociety = ecs.createEntity();
    ecs.addComponent(sadSociety, { type: 'society', name: 'Sad', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);

    // Use very high maxAge to avoid age-mortality killing the migrant during test
    const migrant = ecs.createEntity();
    customManager.createPopulationData(migrant, sadSociety, 30, 'M', 100000);
    const data = ecs.getComponent<PopulationData>(migrant, 'populationData')!;
    data.happiness = 10;
    ecs.addComponent(migrant, data);

    // Make happy society very happy
    const happyPerson = ecs.createEntity();
    customManager.createPopulationData(happyPerson, happySociety, 30, 'F', 100000);
    const happyData = ecs.getComponent<PopulationData>(happyPerson, 'populationData')!;
    happyData.happiness = 95;
    ecs.addComponent(happyPerson, happyData);

    const events = { births: [] as any[], deaths: [] as any[], migrations: [] as any[] };
    // Larger dt increases migration probability while high maxAge prevents death
    for (let i = 0; i < 200; i++) {
      customManager.update(10, events);
      if (events.migrations.length > 0) break;
    }

    expect(events.migrations.length).toBeGreaterThan(0);
  });

  it('applies combat damage', () => {
    const society = ecs.createEntity();
    const person = ecs.createEntity();
    manager.createPopulationData(person, society, 30, 'M', 70);

    expect(manager.applyCombatDamage(person, 60)).toBe(true);
    expect(ecs.getEntitiesWith(['populationData']).includes(person)).toBe(false);

    const survivor = ecs.createEntity();
    manager.createPopulationData(survivor, society, 30, 'M', 70);
    expect(manager.applyCombatDamage(survivor, 10)).toBe(false);
    const data = ecs.getComponent<PopulationData>(survivor, 'populationData');
    expect(data!.healthStatus).toBe('Injured');
  });

  it('heals entities', () => {
    const society = ecs.createEntity();
    const person = ecs.createEntity();
    manager.createPopulationData(person, society, 30, 'M', 70);
    const data = ecs.getComponent<PopulationData>(person, 'populationData')!;
    data.healthStatus = 'Injured';
    data.starvationTimer = 50;
    ecs.addComponent(person, data);

    manager.healEntity(person, 10);
    const healed = ecs.getComponent<PopulationData>(person, 'populationData');
    expect(healed!.healthStatus).toBe('Healthy');
  });

  it('infects entities', () => {
    const society = ecs.createEntity();
    const person = ecs.createEntity();
    manager.createPopulationData(person, society, 30, 'M', 70);
    manager.infectEntity(person);
    const data = ecs.getComponent<PopulationData>(person, 'populationData');
    expect(data!.healthStatus).toBe('Sick');
    expect(data!.diseaseTimer).toBe(0);
  });

  it('food consumption reduces stored food', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);

    const person = ecs.createEntity();
    manager.createPopulationData(person, society, 30, 'M', 70);

    const store = ecs.createEntity();
    ecs.addComponent(store, { type: 'resourceStorage', capacity: 100, contents: { Food: 50 }, structureType: 'FARM' } as ResourceStorage);
    ecs.addComponent(store, { type: 'position', x: 0, y: 0, z: 0 } as Position);

    const events = { births: [] as any[], deaths: [] as any[], migrations: [] as any[] };
    manager.update(10, events);

    const storage = ecs.getComponent<ResourceStorage>(store, 'resourceStorage');
    expect(storage!.contents.Food).toBeLessThan(50);
  });
});
