import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { ResourceManager, RESOURCE_META, DEFAULT_STORAGE_CAPACITY, FLORA_RESOURCE_MAP } from '../resources';
import type { Flora, Position, Structure, ResourceStorage } from '../../../types';

describe('ResourceManager', () => {
  let ecs: ECS;
  let manager: ResourceManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new ResourceManager(ecs);
  });

  it('creates storage with default capacity', () => {
    const struct = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'FARM', subType: 'wheat', durability: 100, efficiency: 1 };
    ecs.addComponent(struct, s);
    manager.createStorage(struct);

    const storage = ecs.getComponent<ResourceStorage>(struct, 'resourceStorage');
    expect(storage).toBeDefined();
    expect(storage!.capacity).toBe(DEFAULT_STORAGE_CAPACITY.FARM);
    expect(storage!.contents).toEqual({});
  });

  it('creates storage with override capacity', () => {
    const struct = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'FARM', subType: 'wheat', durability: 100, efficiency: 1 };
    ecs.addComponent(struct, s);
    manager.createStorage(struct, 999);

    const storage = ecs.getComponent<ResourceStorage>(struct, 'resourceStorage');
    expect(storage!.capacity).toBe(999);
  });

  it('adds and removes resources respecting capacity', () => {
    const struct = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'HABITAT', subType: 'tent', durability: 100, efficiency: 1 };
    ecs.addComponent(struct, s);
    manager.createStorage(struct, 10);

    expect(manager.addResource(struct, 'Wood', 5)).toBe(5);
    expect(manager.addResource(struct, 'Wood', 10)).toBe(5); // only 5 left
    expect(manager.getTotalStored(struct)).toBe(10);
    expect(manager.getRemainingCapacity(struct)).toBe(0);

    expect(manager.removeResource(struct, 'Wood', 3)).toBe(3);
    expect(manager.getTotalStored(struct)).toBe(7);
  });

  it('returns undefined flora resource type for non-flora', () => {
    expect(manager.getFloraResourceType('nonexistent')).toBeUndefined();
  });

  it('maps flora subType to resource type', () => {
    const flora = ecs.createEntity();
    const f: Flora = { type: 'flora', category: 'TREE', subType: 'OAK', growth: 80, resourcesYield: 10, isHarvested: false };
    ecs.addComponent(flora, f);
    expect(manager.getFloraResourceType(flora)).toBe('Wood');
  });

  it('applies food spoilage over time', () => {
    const struct = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'FARM', subType: 'wheat', durability: 100, efficiency: 1 };
    ecs.addComponent(struct, s);
    manager.createStorage(struct, 100);
    manager.addResource(struct, 'Food', 100);

    manager.applySpoilage(10);
    const storage = ecs.getComponent<ResourceStorage>(struct, 'resourceStorage');
    expect(storage!.contents.Food).toBeLessThan(100);
    expect(storage!.contents.Food).toBeGreaterThan(0);
  });

  it('does not spoil non-food resources', () => {
    const struct = ecs.createEntity();
    const s: Structure = { type: 'structure', category: 'FARM', subType: 'wheat', durability: 100, efficiency: 1 };
    ecs.addComponent(struct, s);
    manager.createStorage(struct, 100);
    manager.addResource(struct, 'Wood', 50);

    manager.applySpoilage(100);
    const storage = ecs.getComponent<ResourceStorage>(struct, 'resourceStorage');
    expect(storage!.contents.Wood).toBe(50);
  });

  it('finds nearest storage with space', () => {
    const struct1 = ecs.createEntity();
    ecs.addComponent(struct1, { type: 'structure', category: 'HABITAT', subType: 'tent', durability: 100, efficiency: 1 } as Structure);
    ecs.addComponent(struct1, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    manager.createStorage(struct1, 5);
    manager.addResource(struct1, 'Wood', 5); // full

    const struct2 = ecs.createEntity();
    ecs.addComponent(struct2, { type: 'structure', category: 'HABITAT', subType: 'tent', durability: 100, efficiency: 1 } as Structure);
    ecs.addComponent(struct2, { type: 'position', x: 10, y: 0, z: 0 } as Position);
    manager.createStorage(struct2, 10);

    const nearest = manager.findNearestStorage(0, 0, 'Wood', 1);
    expect(nearest).toBe(struct2);
  });
});

describe('RESOURCE_META', () => {
  it('has metadata for all resource types', () => {
    const types = ['Wood', 'Stone', 'Food', 'Metal', 'Crystal', 'DivineEssence'] as const;
    for (const t of types) {
      expect(RESOURCE_META[t]).toBeDefined();
      expect(RESOURCE_META[t].gatherTime).toBeGreaterThan(0);
      expect(RESOURCE_META[t].weightPerUnit).toBeGreaterThan(0);
    }
  });

  it('only food has spoilage', () => {
    expect(RESOURCE_META.Food.spoilageRate).toBeGreaterThan(0);
    expect(RESOURCE_META.Wood.spoilageRate).toBe(0);
    expect(RESOURCE_META.Stone.spoilageRate).toBe(0);
  });
});

describe('FLORA_RESOURCE_MAP', () => {
  it('maps known subTypes', () => {
    expect(FLORA_RESOURCE_MAP.OAK).toBe('Wood');
    expect(FLORA_RESOURCE_MAP.GOLD).toBe('Food');
    expect(FLORA_RESOURCE_MAP.VOID).toBe('Crystal');
  });
});
