import type { ResourceType, ResourceStorage, Position, Flora, Structure } from '../../types';
import type { ECS } from '../ecs';

/**
 * Resource type metadata (base gather time, spoilage rate, etc.)
 */
export interface ResourceMeta {
  gatherTime: number; // seconds to gather 1 unit
  spoilageRate: number; // units lost per second (Food spoils, others are 0)
  weightPerUnit: number;
  color: string; // hex color for floating text
}

export const RESOURCE_META: Record<ResourceType, ResourceMeta> = {
  Wood: { gatherTime: 2.0, spoilageRate: 0, weightPerUnit: 1.0, color: '#8B4513' },
  Stone: { gatherTime: 3.0, spoilageRate: 0, weightPerUnit: 2.0, color: '#808080' },
  Food: { gatherTime: 1.5, spoilageRate: 0.05, weightPerUnit: 0.5, color: '#32CD32' },
  Metal: { gatherTime: 5.0, spoilageRate: 0, weightPerUnit: 3.0, color: '#C0C0C0' },
  Crystal: { gatherTime: 8.0, spoilageRate: 0, weightPerUnit: 1.5, color: '#9370DB' },
  DivineEssence: { gatherTime: 10.0, spoilageRate: 0, weightPerUnit: 0.1, color: '#FFD700' },
};

/**
 * Default storage capacities per structure category.
 */
export const DEFAULT_STORAGE_CAPACITY: Record<string, number> = {
  HABITAT: 500,
  FARM: 300,
  REACTOR: 400,
  ALTAR: 200,
  DEFENSE: 150,
  DEFAULT: 100,
};

/**
 * Maps flora subType to the resource it yields.
 */
export const FLORA_RESOURCE_MAP: Record<string, ResourceType> = {
  'OAK': 'Wood',
  'PINE': 'Wood',
  'GOLD': 'Food',
  'CYBER': 'Food',
  'VOID': 'Crystal',
  'CRYSTAL': 'Crystal',
  'IRONWOOD': 'Wood',
  'STONE_FRUIT': 'Food',
};

/**
 * ResourceManager handles storage creation, spoilage, and capacity queries.
 * Standalone manager — takes ECS as a constructor param.
 */
export class ResourceManager {
  constructor(private ecs: ECS) {}

  /**
   * Create a ResourceStorage component for a structure entity.
   * Uses the structure's category to pick a default capacity.
   */
  createStorage(structureEntity: string, overrideCapacity?: number): void {
    const structure = this.ecs.getComponent<Structure>(structureEntity, 'structure');
    const capacity = overrideCapacity ?? DEFAULT_STORAGE_CAPACITY[structure?.category ?? 'DEFAULT'] ?? DEFAULT_STORAGE_CAPACITY.DEFAULT;

    const storage: ResourceStorage = {
      type: 'resourceStorage',
      capacity,
      contents: {},
      structureType: structure?.category ?? 'DEFAULT',
    };
    this.ecs.addComponent(structureEntity, storage);
  }

  /**
   * Get total stored amount across all resource types in a storage entity.
   */
  getTotalStored(entity: string): number {
    const storage = this.ecs.getComponent<ResourceStorage>(entity, 'resourceStorage');
    if (!storage) return 0;
    return Object.values(storage.contents).reduce((sum, v) => sum + (v ?? 0), 0);
  }

  /**
   * Get remaining capacity for a storage entity.
   */
  getRemainingCapacity(entity: string): number {
    const storage = this.ecs.getComponent<ResourceStorage>(entity, 'resourceStorage');
    if (!storage) return 0;
    return Math.max(0, storage.capacity - this.getTotalStored(entity));
  }

  /**
   * Add resources to a storage entity. Returns the amount actually stored (respects capacity).
   */
  addResource(entity: string, resource: ResourceType, amount: number): number {
    const storage = this.ecs.getComponent<ResourceStorage>(entity, 'resourceStorage');
    if (!storage) return 0;

    const remaining = this.getRemainingCapacity(entity);
    const stored = Math.min(amount, remaining);
    storage.contents[resource] = (storage.contents[resource] ?? 0) + stored;
    return stored;
  }

  /**
   * Remove resources from a storage entity. Returns the amount actually removed.
   */
  removeResource(entity: string, resource: ResourceType, amount: number): number {
    const storage = this.ecs.getComponent<ResourceStorage>(entity, 'resourceStorage');
    if (!storage) return 0;

    const current = storage.contents[resource] ?? 0;
    const removed = Math.min(amount, current);
    if (removed > 0) {
      storage.contents[resource] = current - removed;
      if (storage.contents[resource] === 0) {
        delete storage.contents[resource];
      }
    }
    return removed;
  }

  /**
   * Get the resource type yielded by a flora entity, or undefined.
   */
  getFloraResourceType(floraEntity: string): ResourceType | undefined {
    const flora = this.ecs.getComponent<Flora>(floraEntity, 'flora');
    if (!flora) return undefined;
    return FLORA_RESOURCE_MAP[flora.subType] ?? 'Food';
  }

  /**
   * Apply spoilage decay to all Food in all storages.
   * Call once per tick with elapsed seconds.
   */
  applySpoilage(dt: number): void {
    const storages = this.ecs.getEntitiesWith(['resourceStorage']);
    for (const entity of storages) {
      const storage = this.ecs.getComponent<ResourceStorage>(entity, 'resourceStorage');
      if (!storage) continue;

      for (const [resource, amount] of Object.entries(storage.contents)) {
        if (resource === 'Food') {
          const meta = RESOURCE_META.Food;
          const decay = (amount ?? 0) * meta.spoilageRate * dt;
          const newAmount = Math.max(0, (amount ?? 0) - decay);
          if (newAmount <= 0) {
            delete storage.contents[resource];
          } else {
            storage.contents[resource] = newAmount;
          }
        }
      }
    }
  }

  /**
   * Find the nearest storage entity with remaining capacity for a given resource.
   */
  findNearestStorage(x: number, y: number, resource: ResourceType, minSpace = 1): string | null {
    const candidates = this.ecs.getEntitiesWith(['resourceStorage', 'position']);
    let best: string | null = null;
    let bestDist = Infinity;

    for (const entity of candidates) {
      const storage = this.ecs.getComponent<ResourceStorage>(entity, 'resourceStorage');
      const pos = this.ecs.getComponent<Position>(entity, 'position');
      if (!storage || !pos) continue;

      const hasSpace = this.getRemainingCapacity(entity) >= minSpace || (storage.contents[resource] ?? 0) + minSpace <= storage.capacity;
      if (!hasSpace) continue;

      const dx = pos.x - x;
      const dy = pos.y - y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = entity;
      }
    }
    return best;
  }
}
