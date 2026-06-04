import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ECS } from '../../ecs';
import { TechTreeManager, DEFAULT_TECHNOLOGIES } from '../techTree';
import type { TechProgress, Society, ResourceStorage } from '../../../types';

describe('TechTreeManager', () => {
  let ecs: ECS;
  let manager: TechTreeManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new TechTreeManager(ecs);
  });

  it('initializes with default technologies', () => {
    expect(manager.getAllTechnologies().length).toBe(DEFAULT_TECHNOLOGIES.length);
  });

  it('retrieves technology by id', () => {
    const tech = manager.getTechnology('agriculture');
    expect(tech).toBeDefined();
    expect(tech!.name).toBe('Agriculture');
    expect(tech!.tier).toBe(1);
  });

  it('registers new technology', () => {
    manager.registerTechnology({
      id: 'test_tech',
      name: 'Test Tech',
      description: 'Test',
      prerequisites: [],
      cost: {},
      researchTime: 1,
      unlocks: [],
      category: 'Infrastructure',
      tier: 1,
    });
    expect(manager.getTechnology('test_tech')).toBeDefined();
  });

  it('filters by category', () => {
    const industry = manager.getByCategory('Industry');
    expect(industry.every(t => t.category === 'Industry')).toBe(true);
  });

  it('creates tech progress on society', () => {
    const society = ecs.createEntity();
    manager.createTechProgress(society);
    const progress = ecs.getComponent<TechProgress>(society, 'techProgress');
    expect(progress).toBeDefined();
    expect(progress!.researchedTechs).toEqual([]);
    expect(progress!.activeResearch).toBeNull();
  });

  it('checks prerequisites', () => {
    const society = ecs.createEntity();
    manager.createTechProgress(society);
    expect(manager.arePrerequisitesMet('agriculture', society)).toBe(true);
    expect(manager.arePrerequisitesMet('metallurgy', society)).toBe(false);
  });

  it('checks affordability with resourceAccessor', () => {
    const society = ecs.createEntity();
    const accessor = vi.fn().mockReturnValue(100);
    expect(manager.canAfford(society, 'agriculture', accessor)).toBe(true);
    expect(accessor).toHaveBeenCalledWith(society, 'Food');
    expect(accessor).toHaveBeenCalledWith(society, 'Wood');
  });

  it('checks affordability without accessor (fallback to society.resources)', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 200, happiness: 50 } as Society);
    expect(manager.canAfford(society, 'agriculture')).toBe(true);
  });

  it('starts research when affordable and prereqs met', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 200, happiness: 50 } as Society);
    manager.createTechProgress(society);
    expect(manager.startResearch(society, 'agriculture')).toBe(true);

    const progress = ecs.getComponent<TechProgress>(society, 'techProgress');
    expect(progress!.activeResearch).toBe('agriculture');
  });

  it('does not start research if already researched', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 200, happiness: 50 } as Society);
    manager.createTechProgress(society);
    manager.startResearch(society, 'agriculture');
    manager.update(100);
    expect(manager.startResearch(society, 'agriculture')).toBe(false);
  });

  it('does not start research if another is active', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 500, happiness: 50 } as Society);
    manager.createTechProgress(society);
    manager.startResearch(society, 'agriculture');
    expect(manager.startResearch(society, 'stone_masonry')).toBe(false);
  });

  it('queues research', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 500, happiness: 50 } as Society);
    manager.createTechProgress(society);
    manager.queueResearch(society, 'agriculture');

    const progress = ecs.getComponent<TechProgress>(society, 'techProgress');
    expect(progress!.researchQueue).toContain('agriculture');
  });

  it('updates research progress to completion', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 200, happiness: 50 } as Society);
    manager.createTechProgress(society);
    manager.startResearch(society, 'agriculture');

    const onComplete = vi.fn();
    manager.update(100, onComplete);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(manager.isResearched(society, 'agriculture')).toBe(true);
  });

  it('auto-starts queued research after completion', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 500, happiness: 50 } as Society);
    manager.createTechProgress(society);
    manager.startResearch(society, 'agriculture');
    manager.queueResearch(society, 'stone_masonry');

    manager.update(200);
    const progress = ecs.getComponent<TechProgress>(society, 'techProgress');
    expect(progress!.researchedTechs).toContain('agriculture');
    expect(progress!.researchedTechs).toContain('stone_masonry');
  });

  it('returns active unlocks', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 200, happiness: 50 } as Society);
    manager.createTechProgress(society);
    manager.startResearch(society, 'agriculture');
    manager.update(100);

    const unlocks = manager.getActiveUnlocks(society);
    expect(unlocks.some(u => u.kind === 'structure' && u.structureType === 'FARM')).toBe(true);
  });

  it('computes passive bonuses', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 200, happiness: 50 } as Society);
    manager.createTechProgress(society);
    manager.startResearch(society, 'agriculture');
    manager.update(100);

    const bonuses = manager.getPassiveBonuses(society);
    expect(bonuses.foodProduction).toBe(1.2);
  });

  it('exports and imports tree', () => {
    const exported = manager.exportTree();
    expect(typeof exported).toBe('string');
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);

    const newManager = new TechTreeManager(ecs);
    newManager.importTree(exported);
    expect(newManager.getAllTechnologies().length).toBe(manager.getAllTechnologies().length);
  });

  it('ignores malformed import', () => {
    expect(() => manager.importTree('not json')).not.toThrow();
  });

  it('does not start research without resources', () => {
    const society = ecs.createEntity();
    ecs.addComponent(society, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 0, happiness: 50 } as Society);
    manager.createTechProgress(society);
    expect(manager.startResearch(society, 'agriculture')).toBe(false);
  });
});
