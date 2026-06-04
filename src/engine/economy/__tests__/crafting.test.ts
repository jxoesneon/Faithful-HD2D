import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ECS } from '../../ecs';
import { CraftingManager, DEFAULT_RECIPES } from '../crafting';
import type { CraftingQueue, ResourceStorage, Structure } from '../../../types';

describe('CraftingManager', () => {
  let ecs: ECS;
  let manager: CraftingManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new CraftingManager(ecs);
  });

  it('registers and retrieves recipes', () => {
    const recipe = manager.getRecipe('basic_food');
    expect(recipe).toBeDefined();
    expect(recipe!.name).toBe('Basic Rations');
    expect(recipe!.requiredStructure).toBe('FARM');
  });

  it('returns all recipes', () => {
    const all = manager.getAllRecipes();
    expect(all.length).toBe(DEFAULT_RECIPES.length);
  });

  it('filters recipes by structure category', () => {
    const farmRecipes = manager.getRecipesForStructure('FARM');
    expect(farmRecipes.every(r => r.requiredStructure === 'FARM')).toBe(true);
  });

  it('registers a custom recipe', () => {
    manager.registerRecipe({
      id: 'custom_test',
      name: 'Test Recipe',
      ingredients: [],
      craftingTime: 1,
      outputItem: 'Test',
      outputQuantity: 1,
      requiredStructure: 'HABITAT',
      baseFailureChance: 0,
      qualityTiers: false,
    });
    expect(manager.getRecipe('custom_test')).toBeDefined();
  });

  it('creates a crafting queue', () => {
    const structure = ecs.createEntity();
    manager.createCraftingQueue(structure);
    const queue = ecs.getComponent<CraftingQueue>(structure, 'craftingQueue');
    expect(queue).toBeDefined();
    expect(queue!.queue).toEqual([]);
    expect(queue!.currentJob).toBeNull();
  });

  it('enqueues a recipe', () => {
    const structure = ecs.createEntity();
    manager.createCraftingQueue(structure);
    expect(manager.enqueueRecipe(structure, 'basic_food')).toBe(true);

    const queue = ecs.getComponent<CraftingQueue>(structure, 'craftingQueue');
    expect(queue!.queue.length).toBe(1);
    expect(queue!.queue[0].recipeId).toBe('basic_food');
  });

  it('does not enqueue unknown recipe', () => {
    const structure = ecs.createEntity();
    manager.createCraftingQueue(structure);
    expect(manager.enqueueRecipe(structure, 'unknown')).toBe(false);
  });

  it('checks canCraft based on storage', () => {
    const structure = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'FARM', subType: 'wheat', durability: 100, efficiency: 1 };
    ecs.addComponent(structure, s);
    const storage: ResourceStorage = { type: 'resourceStorage', capacity: 100, contents: { Food: 10 }, structureType: 'FARM' };
    ecs.addComponent(structure, storage);

    expect(manager.canCraft(structure, 'basic_food')).toBe(true);
    expect(manager.canCraft(structure, 'metal_ingot')).toBe(false);
  });

  it('processes crafting queue to completion', () => {
    const structure = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'FARM', subType: 'wheat', durability: 100, efficiency: 1 };
    ecs.addComponent(structure, s);
    const storage: ResourceStorage = { type: 'resourceStorage', capacity: 100, contents: { Food: 10 }, structureType: 'FARM' };
    ecs.addComponent(structure, storage);
    manager.createCraftingQueue(structure);
    manager.enqueueRecipe(structure, 'basic_food');

    const onComplete = vi.fn();
    manager.update(10, onComplete);

    // should have consumed ingredients and produced output
    const updatedStorage = ecs.getComponent<ResourceStorage>(structure, 'resourceStorage');
    expect(updatedStorage!.contents.Food).toBe(7 + 5); // 10 - 3 + 5 = 12
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0][1].success).toBe(true);
    expect(onComplete.mock.calls[0][1].outputQuantity).toBe(5);
  });

  it('applies structure efficiency to crafting speed', () => {
    const structure = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'FARM', subType: 'wheat', durability: 100, efficiency: 2 };
    ecs.addComponent(structure, s);
    const storage: ResourceStorage = { type: 'resourceStorage', capacity: 100, contents: { Food: 10 }, structureType: 'FARM' };
    ecs.addComponent(structure, storage);
    manager.createCraftingQueue(structure);
    manager.enqueueRecipe(structure, 'basic_food');

    const onComplete = vi.fn();
    // Recipe takes 5s, efficiency 2 means 2.5s
    manager.update(3, onComplete);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('handles quality tiers', () => {
    const structure = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'REACTOR', subType: 'forge', durability: 100, efficiency: 10 };
    ecs.addComponent(structure, s);
    const storage: ResourceStorage = { type: 'resourceStorage', capacity: 200, contents: { Metal: 10, Wood: 10 }, structureType: 'REACTOR' };
    ecs.addComponent(structure, storage);
    manager.createCraftingQueue(structure);
    manager.enqueueRecipe(structure, 'metal_ingot', 'Normal');

    const onComplete = vi.fn();
    manager.update(20, onComplete);
    expect(onComplete).toHaveBeenCalledOnce();
    const result = onComplete.mock.calls[0][1];
    expect(['Normal', 'Refined', 'Masterwork']).toContain(result.quality);
  });

  it('fails craft based on failure chance', () => {
    const structure = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'REACTOR', subType: 'forge', durability: 100, efficiency: 10 };
    ecs.addComponent(structure, s);
    const storage: ResourceStorage = { type: 'resourceStorage', capacity: 200, contents: { Metal: 10, Wood: 10 }, structureType: 'REACTOR' };
    ecs.addComponent(structure, storage);
    manager.createCraftingQueue(structure);
    manager.enqueueRecipe(structure, 'metal_ingot');

    let successes = 0;
    let failures = 0;
    for (let i = 0; i < 50; i++) {
      // reset
      const freshEcs = new ECS();
      const freshManager = new CraftingManager(freshEcs);
      const struct = freshEcs.createEntity();
      freshEcs.addComponent(struct, { type: 'structure', category: 'REACTOR', subType: 'forge', durability: 100, efficiency: 10 } as Structure);
      freshEcs.addComponent(struct, { type: 'resourceStorage', capacity: 200, contents: { Metal: 10, Wood: 10 }, structureType: 'REACTOR' } as ResourceStorage);
      freshManager.createCraftingQueue(struct);
      freshManager.enqueueRecipe(struct, 'metal_ingot');
      freshManager.update(20, (s, r) => {
        if (r.success) successes++;
        else failures++;
      });
    }
    expect(failures).toBeGreaterThan(0);
  });

  it('cancels current job', () => {
    const structure = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'FARM', subType: 'wheat', durability: 100, efficiency: 1 };
    ecs.addComponent(structure, s);
    const storage: ResourceStorage = { type: 'resourceStorage', capacity: 100, contents: { Food: 10 }, structureType: 'FARM' };
    ecs.addComponent(structure, storage);
    manager.createCraftingQueue(structure);
    manager.enqueueRecipe(structure, 'basic_food');
    manager.update(0.1);

    expect(manager.cancelCurrentJob(structure)).toBe(true);
    const status = manager.getQueueStatus(structure);
    expect(status!.current).toBeNull();
    expect(status!.queued.length).toBe(1);
  });

  it('clears queue', () => {
    const structure = ecs.createEntity();
    manager.createCraftingQueue(structure);
    manager.enqueueRecipe(structure, 'basic_food');
    manager.enqueueRecipe(structure, 'basic_food');

    expect(manager.clearQueue(structure)).toBe(true);
    const status = manager.getQueueStatus(structure);
    expect(status!.queued.length).toBe(0);
    expect(status!.current).toBeNull();
  });

  it('returns null status for entity without queue', () => {
    expect(manager.getQueueStatus('none')).toBeNull();
  });

  it('does not craft without sufficient ingredients', () => {
    const structure = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'FARM', subType: 'wheat', durability: 100, efficiency: 1 };
    ecs.addComponent(structure, s);
    const storage: ResourceStorage = { type: 'resourceStorage', capacity: 100, contents: { Food: 1 }, structureType: 'FARM' };
    ecs.addComponent(structure, storage);
    manager.createCraftingQueue(structure);
    manager.enqueueRecipe(structure, 'basic_food');

    const onComplete = vi.fn();
    manager.update(10, onComplete);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
