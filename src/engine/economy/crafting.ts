import type { ECS } from '../ecs';
import type {
  Recipe,
  CraftingQueue,
  CraftingJob,
  CraftingQuality,
  ResourceType,
  ResourceStorage,
  Item,
  Entity,
  Structure,
} from '../../types';

/**
 * Crafting result returned when a job completes.
 */
export interface CraftingResult {
  success: boolean;
  outputEntity: Entity | null;
  outputQuantity: number;
  quality: CraftingQuality;
  message: string;
}

/**
 * Default recipes shipped with the game.
 */
export const DEFAULT_RECIPES: Recipe[] = [
  {
    id: 'basic_food',
    name: 'Basic Rations',
    ingredients: [{ resourceType: 'Food', quantity: 3 }],
    craftingTime: 5,
    outputItem: 'Food',
    outputQuantity: 5,
    requiredStructure: 'FARM',
    baseFailureChance: 0.05,
    qualityTiers: false,
  },
  {
    id: 'wooden_plank',
    name: 'Wooden Plank',
    ingredients: [{ resourceType: 'Wood', quantity: 2 }],
    craftingTime: 8,
    outputItem: 'Wood',
    outputQuantity: 1,
    requiredStructure: 'HABITAT',
    baseFailureChance: 0.02,
    qualityTiers: false,
  },
  {
    id: 'stone_brick',
    name: 'Stone Brick',
    ingredients: [{ resourceType: 'Stone', quantity: 3 }],
    craftingTime: 10,
    outputItem: 'Stone',
    outputQuantity: 2,
    requiredStructure: 'HABITAT',
    baseFailureChance: 0.05,
    qualityTiers: false,
  },
  {
    id: 'metal_ingot',
    name: 'Metal Ingot',
    ingredients: [{ resourceType: 'Metal', quantity: 2 }, { resourceType: 'Wood', quantity: 1 }],
    craftingTime: 15,
    outputItem: 'Metal',
    outputQuantity: 1,
    requiredStructure: 'REACTOR',
    baseFailureChance: 0.1,
    qualityTiers: true,
  },
  {
    id: 'crystal_lens',
    name: 'Crystal Lens',
    ingredients: [{ resourceType: 'Crystal', quantity: 3 }],
    craftingTime: 20,
    outputItem: 'Crystal',
    outputQuantity: 1,
    requiredStructure: 'REACTOR',
    requiredTech: 'optics',
    baseFailureChance: 0.15,
    qualityTiers: true,
  },
  {
    id: 'divine_essence_refine',
    name: 'Divine Essence Refinement',
    ingredients: [{ resourceType: 'DivineEssence', quantity: 5 }],
    craftingTime: 30,
    outputItem: 'DivineEssence',
    outputQuantity: 6,
    requiredStructure: 'ALTAR',
    requiredTech: 'divine_crafting',
    baseFailureChance: 0.2,
    qualityTiers: true,
  },
  {
    id: 'stone_axe_craft',
    name: 'Stone Axe',
    ingredients: [{ resourceType: 'Stone', quantity: 2 }, { resourceType: 'Wood', quantity: 1 }],
    craftingTime: 12,
    outputItem: 'Stone Axe',
    outputQuantity: 1,
    requiredStructure: 'HABITAT',
    baseFailureChance: 0.08,
    qualityTiers: true,
  },
];

/**
 * CraftingManager handles recipe lookup, queue management, and job completion.
 * Standalone manager — takes ECS as a constructor param.
 */
export class CraftingManager {
  private recipes: Map<string, Recipe> = new Map();

  constructor(private ecs: ECS) {
    for (const recipe of DEFAULT_RECIPES) {
      this.recipes.set(recipe.id, recipe);
    }
  }

  /**
   * Register a new recipe (e.g. from mods).
   */
  registerRecipe(recipe: Recipe): void {
    this.recipes.set(recipe.id, recipe);
  }

  /**
   * Get all registered recipes.
   */
  getAllRecipes(): Recipe[] {
    return Array.from(this.recipes.values());
  }

  /**
   * Get recipes available for a given structure category.
   */
  getRecipesForStructure(structureCategory: string): Recipe[] {
    return this.getAllRecipes().filter((r) => r.requiredStructure === structureCategory);
  }

  /**
   * Get a recipe by ID.
   */
  getRecipe(id: string): Recipe | undefined {
    return this.recipes.get(id);
  }

  /**
   * Create a CraftingQueue component on a structure entity.
   */
  createCraftingQueue(structureEntity: Entity): void {
    const queue: CraftingQueue = {
      type: 'craftingQueue',
      queue: [],
      currentJob: null,
      structureEntity,
    };
    this.ecs.addComponent(structureEntity, queue);
  }

  /**
   * Enqueue a recipe at a structure.
   * @param structureEntity The structure with a craftingQueue.
   * @param recipeId Recipe to craft.
   * @param quality Desired quality tier.
   * @param crafter Optional entity performing the craft.
   * @returns true if enqueued.
   */
  enqueueRecipe(structureEntity: Entity, recipeId: string, quality: CraftingQuality = 'Normal', crafter: Entity | null = null): boolean {
    const queue = this.ecs.getComponent<CraftingQueue>(structureEntity, 'craftingQueue');
    const recipe = this.recipes.get(recipeId);
    if (!queue || !recipe) return false;

    const job: CraftingJob = {
      recipeId,
      progress: 0,
      totalTime: recipe.craftingTime,
      assignedQuality: quality,
      assignedCrafter: crafter,
    };
    queue.queue.push(job);
    this.ecs.addComponent(structureEntity, queue);
    return true;
  }

  /**
   * Check if a structure has enough resources in its storage for a recipe.
   */
  canCraft(structureEntity: Entity, recipeId: string): boolean {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) return false;

    const storage = this.ecs.getComponent<ResourceStorage>(structureEntity, 'resourceStorage');
    if (!storage) return false;

    for (const ing of recipe.ingredients) {
      if (ing.resourceType) {
        const available = storage.contents[ing.resourceType] ?? 0;
        if (available < ing.quantity) return false;
      }
      // Note: item-type ingredients not checked via storage currently
    }
    return true;
  }

  /**
   * Deduct recipe ingredients from a structure's storage.
   * @returns true if deducted.
   */
  private consumeIngredients(structureEntity: Entity, recipe: Recipe): boolean {
    const storage = this.ecs.getComponent<ResourceStorage>(structureEntity, 'resourceStorage');
    if (!storage) return false;

    // Verify first
    for (const ing of recipe.ingredients) {
      if (ing.resourceType) {
        if ((storage.contents[ing.resourceType] ?? 0) < ing.quantity) return false;
      }
    }

    // Deduct
    for (const ing of recipe.ingredients) {
      if (ing.resourceType) {
        storage.contents[ing.resourceType] = (storage.contents[ing.resourceType] ?? 0) - ing.quantity;
        if (storage.contents[ing.resourceType] === 0) {
          delete storage.contents[ing.resourceType];
        }
      }
    }

    this.ecs.addComponent(structureEntity, storage);
    return true;
  }

  /**
   * Update all crafting queues. Call once per tick.
   * @param dt Delta time in seconds.
   * @param onComplete Optional callback when a job completes.
   * @param skillModifier Optional function to adjust failure chance based on crafter skill.
   */
  update(dt: number, onComplete?: (structure: Entity, result: CraftingResult) => void, skillModifier?: (crafter: Entity | null) => number): void {
    const queues = this.ecs.getEntitiesWith(['craftingQueue']);
    for (const structureEntity of queues) {
      const queue = this.ecs.getComponent<CraftingQueue>(structureEntity, 'craftingQueue');
      if (!queue) continue;

      if (!queue.currentJob && queue.queue.length > 0) {
        // Try to start next job
        const next = queue.queue[0];
        const recipe = this.recipes.get(next.recipeId);
        if (recipe && this.canCraft(structureEntity, next.recipeId)) {
          this.consumeIngredients(structureEntity, recipe);
          queue.currentJob = next;
          queue.queue.shift();
        }
      }

      if (queue.currentJob) {
        const job = queue.currentJob;
        const recipe = this.recipes.get(job.recipeId);
        if (!recipe) {
          queue.currentJob = null;
          this.ecs.addComponent(structureEntity, queue);
          continue;
        }

        // Apply structure efficiency to speed
        const structure = this.ecs.getComponent<Structure>(structureEntity, 'structure');
        const efficiency = structure?.efficiency ?? 1;
        job.progress += dt * efficiency;

        if (job.progress >= job.totalTime) {
          // Job complete
          const result = this.completeJob(structureEntity, job, recipe, skillModifier);
          queue.currentJob = null;
          this.ecs.addComponent(structureEntity, queue);
          if (onComplete) {
            onComplete(structureEntity, result);
          }
        } else {
          queue.currentJob = job;
          this.ecs.addComponent(structureEntity, queue);
        }
      } else {
        this.ecs.addComponent(structureEntity, queue);
      }
    }
  }

  /**
   * Complete a crafting job and produce output.
   */
  private completeJob(
    structureEntity: Entity,
    job: CraftingJob,
    recipe: Recipe,
    skillModifier?: (crafter: Entity | null) => number
  ): CraftingResult {
    const modifier = skillModifier ? skillModifier(job.assignedCrafter) : 0;
    const failureChance = Math.max(0, recipe.baseFailureChance - modifier);
    const roll = Math.random();

    if (roll < failureChance) {
      return {
        success: false,
        outputEntity: null,
        outputQuantity: 0,
        quality: job.assignedQuality,
        message: `Failed to craft ${recipe.name}: catastrophic failure`,
      };
    }

    // Determine quality roll
    let finalQuality = job.assignedQuality;
    if (recipe.qualityTiers) {
      const qualityRoll = Math.random();
      if (qualityRoll > 0.95) finalQuality = 'Masterwork';
      else if (qualityRoll > 0.80) finalQuality = 'Refined';
      else finalQuality = 'Normal';
    }

    const outputQty = Math.floor(recipe.outputQuantity * (finalQuality === 'Masterwork' ? 1.5 : finalQuality === 'Refined' ? 1.25 : 1));

    // If output is a resource, add to storage; if an item, create item entity
    let outputEntity: Entity | null = null;
    const isResource = Object.keys({ Wood:1, Stone:1, Food:1, Metal:1, Crystal:1, DivineEssence:1 } as Record<ResourceType, 1>).includes(recipe.outputItem);

    if (isResource) {
      const storage = this.ecs.getComponent<ResourceStorage>(structureEntity, 'resourceStorage');
      if (storage) {
        const resourceType = recipe.outputItem as ResourceType;
        storage.contents[resourceType] = (storage.contents[resourceType] ?? 0) + outputQty;
        this.ecs.addComponent(structureEntity, storage);
      }
    } else {
      // Create item entity placeholder — in practice this would integrate with InventoryManager
      outputEntity = this.ecs.createEntity();
      const item: Item = {
        type: 'item',
        name: recipe.outputItem,
        itemType: 'Material',
        rarity: finalQuality === 'Masterwork' ? 'Epic' : finalQuality === 'Refined' ? 'Rare' : 'Common',
        durability: 100,
        maxDurability: 100,
        weight: 1.0,
        effects: [],
        quality: finalQuality,
      };
      this.ecs.addComponent(outputEntity, item);
    }

    return {
      success: true,
      outputEntity,
      outputQuantity: outputQty,
      quality: finalQuality,
      message: `Crafted ${outputQty}x ${recipe.outputItem} (${finalQuality})`,
    };
  }

  /**
   * Cancel the current job and return it to the front of the queue.
   * Ingredients are NOT refunded.
   */
  cancelCurrentJob(structureEntity: Entity): boolean {
    const queue = this.ecs.getComponent<CraftingQueue>(structureEntity, 'craftingQueue');
    if (!queue || !queue.currentJob) return false;

    queue.queue.unshift(queue.currentJob);
    queue.currentJob = null;
    this.ecs.addComponent(structureEntity, queue);
    return true;
  }

  /**
   * Clear the entire queue for a structure.
   */
  clearQueue(structureEntity: Entity): boolean {
    const queue = this.ecs.getComponent<CraftingQueue>(structureEntity, 'craftingQueue');
    if (!queue) return false;

    queue.queue = [];
    queue.currentJob = null;
    this.ecs.addComponent(structureEntity, queue);
    return true;
  }

  /**
   * Get queue status for a structure.
   */
  getQueueStatus(structureEntity: Entity): { current: CraftingJob | null; queued: CraftingJob[]; totalJobs: number } | null {
    const queue = this.ecs.getComponent<CraftingQueue>(structureEntity, 'craftingQueue');
    if (!queue) return null;
    return {
      current: queue.currentJob,
      queued: queue.queue,
      totalJobs: (queue.currentJob ? 1 : 0) + queue.queue.length,
    };
  }
}
