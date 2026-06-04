import type { ECS } from '../ecs';
import type {
  ResourceType,
  GatheringTask,
  Flora,
  Position,
  Movement,
  FloatingText,
  Entity,
} from '../../types';
import { ResourceManager, RESOURCE_META, FLORA_RESOURCE_MAP } from './resources';

/**
 * Result of a gathering tick.
 */
export interface GatherTickResult {
  completed: boolean;
  cancelled: boolean;
  amountCollected: number;
}

/**
 * GatheringManager handles harvest interactions, auto-gather AI, and visual feedback.
 * Standalone manager — takes ECS as a constructor param.
 */
export class GatheringManager {
  private resourceManager: ResourceManager;

  constructor(private ecs: ECS) {
    this.resourceManager = new ResourceManager(ecs);
  }

  /**
   * Start a gathering task on a target flora entity.
   * @param gatherer Entity with movement component.
   * @param target Flora entity to harvest.
   * @param autoGather Whether this is an AI-picked auto-gather task.
   * @returns The GatheringTask component or null if invalid target.
   */
  startGathering(gatherer: Entity, target: Entity, autoGather = false): GatheringTask | null {
    const flora = this.ecs.getComponent<Flora>(target, 'flora');
    const floraPos = this.ecs.getComponent<Position>(target, 'position');
    const gathererPos = this.ecs.getComponent<Position>(gatherer, 'position');
    const movement = this.ecs.getComponent<Movement>(gatherer, 'movement');

    if (!flora || !floraPos || !gathererPos || !movement) return null;
    if (flora.resourcesYield <= 0) return null;

    const resourceType = FLORA_RESOURCE_MAP[flora.subType] ?? 'Food';
    const meta = RESOURCE_META[resourceType];

    // Set movement target to the flora location
    movement.targetX = floraPos.x;
    movement.targetY = floraPos.y;
    movement.activityState = 'MOVING_TO_RESOURCE';

    const task: GatheringTask = {
      type: 'gatheringTask',
      targetEntity: target,
      resourceType,
      progress: 0,
      totalTime: meta.gatherTime / (movement.speed || 1),
      isAutoGather: autoGather,
    };

    this.ecs.addComponent(gatherer, task);
    return task;
  }

  /**
   * Process a single tick of gathering for a gatherer entity.
   * Should be called after the gatherer has reached the target.
   * @param gatherer The entity performing gathering.
   * @param dt Delta time in seconds.
   * @param storageEntity Optional explicit storage entity; otherwise nearest is used.
   * @returns GatherTickResult describing what happened.
   */
  tickGathering(gatherer: Entity, dt: number, storageEntity?: Entity): GatherTickResult {
    const task = this.ecs.getComponent<GatheringTask>(gatherer, 'gatheringTask');
    const movement = this.ecs.getComponent<Movement>(gatherer, 'movement');
    const gathererPos = this.ecs.getComponent<Position>(gatherer, 'position');

    if (!task || !movement || !gathererPos) {
      return { completed: false, cancelled: true, amountCollected: 0 };
    }

    const flora = this.ecs.getComponent<Flora>(task.targetEntity, 'flora');
    if (!flora || flora.resourcesYield <= 0) {
      this.cancelGathering(gatherer);
      return { completed: false, cancelled: true, amountCollected: 0 };
    }

    // Check distance — gatherer must be adjacent (within 1.5 units)
    const targetPos = this.ecs.getComponent<Position>(task.targetEntity, 'position');
    if (targetPos) {
      const dx = gathererPos.x - targetPos.x;
      const dy = gathererPos.y - targetPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1.5) {
        // Still moving
        return { completed: false, cancelled: false, amountCollected: 0 };
      }
    }

    // Perform gathering work
    task.progress += dt;

    if (task.progress >= task.totalTime) {
      // Harvest complete
      const amount = this.harvestFlora(task.targetEntity);

      if (amount > 0) {
        // Deposit to storage
        let store = storageEntity;
        if (!store) {
          store = this.resourceManager.findNearestStorage(gathererPos.x, gathererPos.y, task.resourceType, amount);
        }
        let deposited = 0;
        if (store) {
          deposited = this.resourceManager.addResource(store, task.resourceType, amount);
        }

        // Create floating text feedback
        this.spawnFloatingText(gathererPos.x, gathererPos.y, `+${deposited} ${task.resourceType}`, RESOURCE_META[task.resourceType].color);

        this.ecs.addComponent(gatherer, {
          ...movement,
          targetX: null,
          targetY: null,
          activityState: 'IDLE',
        } as Movement);

        this.ecs.addComponent(gatherer, {
          ...task,
          progress: 0,
        } as GatheringTask);

        // Remove the gathering task component
        // Since ECS doesn't have removeComponent, we overwrite with zero progress and mark via movement state
        // In practice the caller should check activityState == IDLE and treat as done

        return { completed: true, cancelled: false, amountCollected: deposited };
      }

      return { completed: true, cancelled: false, amountCollected: 0 };
    }

    return { completed: false, cancelled: false, amountCollected: 0 };
  }

  /**
   * Reduce a flora's resourcesYield and mark as harvested.
   * @returns The amount yielded by this harvest.
   */
  private harvestFlora(floraEntity: Entity): number {
    const flora = this.ecs.getComponent<Flora>(floraEntity, 'flora');
    if (!flora || flora.resourcesYield <= 0) return 0;

    const amount = flora.resourcesYield;
    flora.resourcesYield = 0;
    flora.isHarvested = true;
    this.ecs.addComponent(floraEntity, flora); // re-add to overwrite
    return amount;
  }

  /**
   * Cancel the current gathering task for a gatherer.
   */
  cancelGathering(gatherer: Entity): void {
    const movement = this.ecs.getComponent<Movement>(gatherer, 'movement');
    if (movement) {
      this.ecs.addComponent(gatherer, {
        ...movement,
        targetX: null,
        targetY: null,
        activityState: 'IDLE',
      } as Movement);
    }
    // Overwrite gathering task with zero progress to indicate cancellation
    const task = this.ecs.getComponent<GatheringTask>(gatherer, 'gatheringTask');
    if (task) {
      this.ecs.addComponent(gatherer, { ...task, progress: -1, totalTime: 1 } as GatheringTask);
    }
  }

  /**
   * Auto-gather: pick the nearest unharvested flora and start gathering.
   * @param gatherer The entity that should auto-gather.
   * @returns The target flora entity or null if none found.
   */
  autoGather(gatherer: Entity): Entity | null {
    const pos = this.ecs.getComponent<Position>(gatherer, 'position');
    if (!pos) return null;

    // Check if already gathering
    const existing = this.ecs.getComponent<GatheringTask>(gatherer, 'gatheringTask');
    if (existing && existing.progress >= 0) return null;

    const floras = this.ecs.getEntitiesWith(['flora', 'position']);
    let best: Entity | null = null;
    let bestDist = Infinity;

    for (const floraId of floras) {
      const flora = this.ecs.getComponent<Flora>(floraId, 'flora');
      const floraPos = this.ecs.getComponent<Position>(floraId, 'position');
      if (!flora || !floraPos) continue;
      if (flora.isHarvested || flora.resourcesYield <= 0) continue;

      const dx = floraPos.x - pos.x;
      const dy = floraPos.y - pos.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = floraId;
      }
    }

    if (best) {
      this.startGathering(gatherer, best, true);
    }
    return best;
  }

  /**
   * Regrow harvested flora entities over time.
   * Call once per tick.
   * @param dt Delta time in seconds.
   * @param regrowRate How much resourcesYield is restored per second.
   */
  regrowFlora(dt: number, regrowRate = 0.5): void {
    const floras = this.ecs.getEntitiesWith(['flora']);
    for (const floraId of floras) {
      const flora = this.ecs.getComponent<Flora>(floraId, 'flora');
      if (!flora) continue;
      if (!flora.isHarvested || flora.resourcesYield > 0) continue;

      // Regrow based on growth stat
      const growthFactor = flora.growth / 100;
      flora.resourcesYield += regrowRate * growthFactor * dt;
      if (flora.resourcesYield >= 1) {
        flora.resourcesYield = Math.ceil(flora.resourcesYield);
        flora.isHarvested = false;
      }
      this.ecs.addComponent(floraId, flora);
    }
  }

  /**
   * Spawn a floating text visual feedback entity.
   */
  spawnFloatingText(x: number, y: number, text: string, color: string, lifetime = 1.5): string {
    const id = this.ecs.createEntity();
    const ft: FloatingText = {
      type: 'floatingText',
      text,
      color,
      lifetime,
      elapsed: 0,
    };
    this.ecs.addComponent(id, ft);
    // Also attach position so renderer can place it
    this.ecs.addComponent(id, { type: 'position', x, y, z: 1 } as Position);
    return id;
  }

  /**
   * Update all floating text entities (progress lifetime, remove expired).
   * Call once per tick.
   */
  updateFloatingText(dt: number): void {
    const texts = this.ecs.getEntitiesWith(['floatingText']);
    for (const entity of texts) {
      const ft = this.ecs.getComponent<FloatingText>(entity, 'floatingText');
      if (!ft) continue;
      ft.elapsed += dt;
      if (ft.elapsed >= ft.lifetime) {
        this.ecs.removeEntity(entity);
      } else {
        this.ecs.addComponent(entity, ft);
      }
    }
  }

  /**
   * Get all active gathering tasks.
   */
  getActiveTasks(): Array<{ gatherer: Entity; task: GatheringTask }> {
    const result: Array<{ gatherer: Entity; task: GatheringTask }> = [];
    const entities = this.ecs.getEntitiesWith(['gatheringTask']);
    for (const e of entities) {
      const task = this.ecs.getComponent<GatheringTask>(e, 'gatheringTask');
      if (task && task.progress >= 0 && task.progress < task.totalTime) {
        result.push({ gatherer: e, task });
      }
    }
    return result;
  }
}
