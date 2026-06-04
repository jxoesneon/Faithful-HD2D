import type { ECS } from '../ecs';
import type { Technology, TechProgress, TechUnlock, ResourceType, Entity, Society } from '../../types';

/**
 * Default technology tree shipped with the game.
 */
export const DEFAULT_TECHNOLOGIES: Technology[] = [
  {
    id: 'agriculture',
    name: 'Agriculture',
    description: 'Enables basic farming and food production.',
    prerequisites: [],
    cost: { Food: 50, Wood: 30 },
    researchTime: 60,
    unlocks: [
      { kind: 'structure', structureType: 'FARM' },
      { kind: 'passive', stat: 'foodProduction', value: 1.2, operation: 'multiply' },
    ],
    category: 'Agriculture',
    tier: 1,
  },
  {
    id: 'stone_masonry',
    name: 'Stone Masonry',
    description: 'Advanced stone working for durable structures.',
    prerequisites: [],
    cost: { Stone: 50, Wood: 20 },
    researchTime: 90,
    unlocks: [
      { kind: 'structure', structureType: 'DEFENSE' },
      { kind: 'passive', stat: 'structureDurability', value: 1.3, operation: 'multiply' },
    ],
    category: 'Infrastructure',
    tier: 1,
  },
  {
    id: 'metallurgy',
    name: 'Metallurgy',
    description: 'Smelting and metal working techniques.',
    prerequisites: ['stone_masonry'],
    cost: { Stone: 40, Metal: 20, Wood: 40 },
    researchTime: 120,
    unlocks: [
      { kind: 'structure', structureType: 'REACTOR' },
      { kind: 'recipe', recipeId: 'metal_ingot' },
      { kind: 'passive', stat: 'gatherSpeed', value: 1.2, operation: 'multiply' },
    ],
    category: 'Industry',
    tier: 2,
  },
  {
    id: 'optics',
    name: 'Optics',
    description: 'Crystal lens grinding for divine light manipulation.',
    prerequisites: ['metallurgy'],
    cost: { Crystal: 30, Metal: 30 },
    researchTime: 150,
    unlocks: [
      { kind: 'recipe', recipeId: 'crystal_lens' },
      { kind: 'ability', abilityId: 'lens_flare' },
    ],
    category: 'Industry',
    tier: 3,
  },
  {
    id: 'divine_crafting',
    name: 'Divine Crafting',
    description: 'Channel divine essence into usable materials.',
    prerequisites: ['optics'],
    cost: { DivineEssence: 50, Crystal: 30 },
    researchTime: 200,
    unlocks: [
      { kind: 'recipe', recipeId: 'divine_essence_refine' },
      { kind: 'passive', stat: 'devotionGain', value: 1.5, operation: 'multiply' },
    ],
    category: 'Divine',
    tier: 4,
  },
  {
    id: 'militia_training',
    name: 'Militia Training',
    description: 'Basic combat techniques for villagers.',
    prerequisites: ['stone_masonry'],
    cost: { Food: 60, Wood: 40 },
    researchTime: 80,
    unlocks: [
      { kind: 'unit', unitType: 'militia' },
      { kind: 'passive', stat: 'combatDamage', value: 5, operation: 'add' },
    ],
    category: 'Military',
    tier: 2,
  },
  {
    id: 'faith_structures',
    name: 'Faith Structures',
    description: 'Building altars to channel divine power.',
    prerequisites: ['agriculture'],
    cost: { Wood: 60, Stone: 40 },
    researchTime: 100,
    unlocks: [
      { kind: 'structure', structureType: 'ALTAR' },
      { kind: 'passive', stat: 'prayerEfficiency', value: 1.3, operation: 'multiply' },
    ],
    category: 'Faith',
    tier: 2,
  },
];

/**
 * TechTreeManager handles DAG validation, research progress, and unlock application.
 * Standalone manager — takes ECS as a constructor param.
 */
export class TechTreeManager {
  private techs: Map<string, Technology> = new Map();

  constructor(private ecs: ECS) {
    for (const tech of DEFAULT_TECHNOLOGIES) {
      this.techs.set(tech.id, tech);
    }
  }

  /**
   * Register a new technology (e.g. from mods).
   */
  registerTechnology(tech: Technology): void {
    this.techs.set(tech.id, tech);
  }

  /**
   * Get a technology by ID.
   */
  getTechnology(id: string): Technology | undefined {
    return this.techs.get(id);
  }

  /**
   * Get all technologies.
   */
  getAllTechnologies(): Technology[] {
    return Array.from(this.techs.values());
  }

  /**
   * Get technologies filtered by category.
   */
  getByCategory(category: Technology['category']): Technology[] {
    return this.getAllTechnologies().filter((t) => t.category === category);
  }

  /**
   * Initialize TechProgress on a society entity.
   */
  createTechProgress(societyEntity: Entity): void {
    const progress: TechProgress = {
      type: 'techProgress',
      researchedTechs: [],
      activeResearch: null,
      researchProgress: 0,
      researchQueue: [],
    };
    this.ecs.addComponent(societyEntity, progress);
  }

  /**
   * Check if a technology's prerequisites are met for a society.
   */
  arePrerequisitesMet(techId: string, societyEntity: Entity): boolean {
    const tech = this.techs.get(techId);
    const progress = this.ecs.getComponent<TechProgress>(societyEntity, 'techProgress');
    if (!tech || !progress) return false;

    return tech.prerequisites.every((pre) => progress.researchedTechs.includes(pre));
  }

  /**
   * Check if a society can afford to research a technology.
   * @param societyEntity Society with a resourceStorage or Society component.
   * @param techId Technology to research.
   * @param resourceAccessor Optional function to query resources; defaults to checking Society.resources (single pool).
   */
  canAfford(
    societyEntity: Entity,
    techId: string,
    resourceAccessor?: (entity: Entity, resource: ResourceType) => number
  ): boolean {
    const tech = this.techs.get(techId);
    if (!tech) return false;

    if (resourceAccessor) {
      for (const [resource, cost] of Object.entries(tech.cost)) {
        if (resourceAccessor(societyEntity, resource as ResourceType) < (cost ?? 0)) return false;
      }
      return true;
    }

    // Fallback: use Society.resources as a generic pool
    const society = this.ecs.getComponent<Society>(societyEntity, 'society');
    if (!society) return false;
    const totalCost = Object.values(tech.cost).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;
    return society.resources >= totalCost;
  }

  /**
   * Deduct research cost from a society.
   */
  private deductCost(societyEntity: Entity, tech: Technology, resourceAccessor?: (entity: Entity, resource: ResourceType) => number, resourceDeductor?: (entity: Entity, resource: ResourceType, amount: number) => void): boolean {
    if (resourceDeductor) {
      for (const [resource, cost] of Object.entries(tech.cost)) {
        resourceDeductor(societyEntity, resource as ResourceType, cost ?? 0);
      }
      return true;
    }

    const society = this.ecs.getComponent<Society>(societyEntity, 'society');
    if (!society) return false;
    const totalCost = Object.values(tech.cost).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;
    if (society.resources < totalCost) return false;
    society.resources -= totalCost;
    this.ecs.addComponent(societyEntity, society);
    return true;
  }

  /**
   * Start researching a technology for a society.
   * @returns true if started.
   */
  startResearch(societyEntity: Entity, techId: string, resourceAccessor?: (entity: Entity, resource: ResourceType) => number, resourceDeductor?: (entity: Entity, resource: ResourceType, amount: number) => void): boolean {
    const progress = this.ecs.getComponent<TechProgress>(societyEntity, 'techProgress');
    const tech = this.techs.get(techId);
    if (!progress || !tech) return false;
    if (progress.researchedTechs.includes(techId)) return false;
    if (progress.activeResearch) return false;
    if (!this.arePrerequisitesMet(techId, societyEntity)) return false;
    if (!this.canAfford(societyEntity, techId, resourceAccessor)) return false;

    this.deductCost(societyEntity, tech, resourceAccessor, resourceDeductor);
    progress.activeResearch = techId;
    progress.researchProgress = 0;
    this.ecs.addComponent(societyEntity, progress);
    return true;
  }

  /**
   * Queue a technology to be researched after the current one.
   */
  queueResearch(societyEntity: Entity, techId: string): boolean {
    const progress = this.ecs.getComponent<TechProgress>(societyEntity, 'techProgress');
    const tech = this.techs.get(techId);
    if (!progress || !tech) return false;
    if (progress.researchedTechs.includes(techId)) return false;
    if (progress.researchQueue.includes(techId)) return false;
    if (!this.arePrerequisitesMet(techId, societyEntity)) return false;

    progress.researchQueue.push(techId);
    this.ecs.addComponent(societyEntity, progress);
    return true;
  }

  /**
   * Update research progress for all societies. Call once per tick.
   * @param dt Delta time in seconds.
   * @param onComplete Optional callback when a tech is fully researched.
   */
  update(dt: number, onComplete?: (society: Entity, techId: string) => void): void {
    const societies = this.ecs.getEntitiesWith(['techProgress']);
    for (const societyEntity of societies) {
      let progress = this.ecs.getComponent<TechProgress>(societyEntity, 'techProgress');
      if (!progress || !progress.activeResearch) continue;

      let remainingDt = dt;
      while (remainingDt > 0 && progress?.activeResearch) {
        const tech = this.techs.get(progress.activeResearch);
        if (!tech) {
          progress.activeResearch = null;
          progress.researchProgress = 0;
          this.ecs.addComponent(societyEntity, progress);
          break;
        }

        const needed = tech.researchTime - progress.researchProgress;
        if (remainingDt >= needed) {
          // Complete this tech
          remainingDt -= needed;
          progress.researchProgress = 0;
          progress.researchedTechs.push(tech.id);
          progress.activeResearch = null;
          this.ecs.addComponent(societyEntity, progress);

          if (onComplete) {
            onComplete(societyEntity, tech.id);
          }

          // Auto-start next queued research
          if (progress.researchQueue.length > 0) {
            const next = progress.researchQueue.shift()!;
            const started = this.startResearch(societyEntity, next);
            if (started) {
              progress = this.ecs.getComponent<TechProgress>(societyEntity, 'techProgress');
            }
          }
        } else {
          progress.researchProgress += remainingDt;
          remainingDt = 0;
          this.ecs.addComponent(societyEntity, progress);
        }
      }
    }
  }

  /**
   * Check if a technology has been researched by a society.
   */
  isResearched(societyEntity: Entity, techId: string): boolean {
    const progress = this.ecs.getComponent<TechProgress>(societyEntity, 'techProgress');
    if (!progress) return false;
    return progress.researchedTechs.includes(techId);
  }

  /**
   * Get all unlocks for a society's researched technologies.
   */
  getActiveUnlocks(societyEntity: Entity): TechUnlock[] {
    const progress = this.ecs.getComponent<TechProgress>(societyEntity, 'techProgress');
    if (!progress) return [];

    const unlocks: TechUnlock[] = [];
    for (const techId of progress.researchedTechs) {
      const tech = this.techs.get(techId);
      if (tech) {
        unlocks.push(...tech.unlocks);
      }
    }
    return unlocks;
  }

  /**
   * Get passive bonuses from researched techs for a society.
   */
  getPassiveBonuses(societyEntity: Entity): Record<string, number> {
    const bonuses: Record<string, number> = {};
    const unlocks = this.getActiveUnlocks(societyEntity);
    for (const unlock of unlocks) {
      if (unlock.kind === 'passive') {
        if (unlock.operation === 'add') {
          bonuses[unlock.stat] = (bonuses[unlock.stat] ?? 0) + unlock.value;
        } else if (unlock.operation === 'multiply') {
          bonuses[unlock.stat] = (bonuses[unlock.stat] ?? 1) * unlock.value;
        }
      }
    }
    return bonuses;
  }

  /**
   * Export the tech tree as JSON (for mod support).
   */
  exportTree(): string {
    const tree = this.getAllTechnologies();
    return JSON.stringify(tree, null, 2);
  }

  /**
   * Import a tech tree from JSON. Merges with existing tree (overwrites duplicates).
   */
  importTree(json: string): void {
    try {
      const tree: Technology[] = JSON.parse(json);
      for (const tech of tree) {
        this.registerTechnology(tech);
      }
    } catch (_e) {
      // silently ignore malformed JSON
    }
  }
}
