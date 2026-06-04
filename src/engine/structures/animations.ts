import type { StructureState, StructureAnimation, WorkAnimationConfig } from '../../types';

/**
 * Default animation configurations per structure category.
 */
export const DEFAULT_ANIMATION_CONFIGS: Record<string, WorkAnimationConfig> = {
  ALTAR: {
    category: 'ALTAR',
    idle: { type: 'glow_pulse', intensity: 0.3, speed: 0.5 },
    working: { type: 'glow_pulse', intensity: 1.0, speed: 2.0 },
    complete: { type: 'glow_pulse', intensity: 0.6, speed: 1.0 },
    baseGlowIntensity: 0.4,
    nightGlowMultiplier: 2.0,
  },
  REACTOR: {
    category: 'REACTOR',
    idle: { type: 'smoke', intensity: 0.2, speed: 0.3 },
    working: { type: 'smoke', intensity: 1.0, speed: 2.5 },
    complete: { type: 'smoke', intensity: 0.5, speed: 0.8 },
    baseGlowIntensity: 0.6,
    nightGlowMultiplier: 1.5,
  },
  FARM: {
    category: 'FARM',
    idle: { type: 'spin', intensity: 0.1, speed: 0.2 },
    working: { type: 'spin', intensity: 1.0, speed: 3.0 },
    complete: { type: 'spin', intensity: 0.4, speed: 0.5 },
    baseGlowIntensity: 0.2,
    nightGlowMultiplier: 1.0,
  },
  HABITAT: {
    category: 'HABITAT',
    idle: { type: 'none', intensity: 0, speed: 0 },
    working: { type: 'none', intensity: 0, speed: 0 },
    complete: { type: 'none', intensity: 0, speed: 0 },
    baseGlowIntensity: 0.15,
    nightGlowMultiplier: 1.2,
  },
  DEFENSE: {
    category: 'DEFENSE',
    idle: { type: 'none', intensity: 0, speed: 0 },
    working: { type: 'glow_pulse', intensity: 0.8, speed: 1.5 },
    complete: { type: 'none', intensity: 0, speed: 0 },
    baseGlowIntensity: 0.25,
    nightGlowMultiplier: 1.0,
  },
};

/**
 * Tracks and updates per-structure animation states and visual emission data.
 * Stores plain data components — no PIXI objects — so the renderer remains independent.
 */
export class StructureAnimator {
  private states = new Map<string, StructureState>();
  private configs = new Map<string, WorkAnimationConfig>();

  constructor() {
    for (const config of Object.values(DEFAULT_ANIMATION_CONFIGS)) {
      this.registerConfig(config);
    }
  }

  /**
   * Register a custom animation config (e.g. for mods).
   */
  registerConfig(config: WorkAnimationConfig): void {
    const key = this.configKey(config.category, config.subType);
    this.configs.set(key, config);
  }

  /**
   * Retrieve a config by category and optional sub-type.
   */
  getConfig(category: string, subType?: string): WorkAnimationConfig | undefined {
    const specific = this.configs.get(this.configKey(category, subType));
    if (specific) return specific;
    return this.configs.get(this.configKey(category));
  }

  /**
   * Register a structure entity for animation tracking.
   */
  registerStructure(entityId: string, category: string, subType?: string): void {
    const config = this.getConfig(category, subType) ?? DEFAULT_ANIMATION_CONFIGS.HABITAT;
    const state: StructureState = {
      entityId,
      category,
      state: 'idle',
      workProgress: 0,
      animation: { ...config.idle },
      glowIntensity: config.baseGlowIntensity * config.idle.intensity,
      nightGlowIntensity: this.computeNightGlow(config, 'idle', 0),
      flickerTimer: 0,
      isCollapsed: false,
      efficiencyModifier: 1,
    };
    this.states.set(entityId, state);
  }

  /**
   * Get the current animation state for a structure, or undefined.
   */
  getState(entityId: string): StructureState | undefined {
    return this.states.get(entityId);
  }

  /**
   * Set a structure to idle state.
   */
  setIdle(entityId: string): void {
    const state = this.states.get(entityId);
    if (!state) return;
    const config = this.findConfigForState(state);
    state.state = 'idle';
    state.workProgress = 0;
    state.animation = { ...config.idle };
    state.glowIntensity = config.baseGlowIntensity * config.idle.intensity;
    state.nightGlowIntensity = this.computeNightGlow(config, 'idle', 0);
    state.efficiencyModifier = 1;
    state.isCollapsed = false;
  }

  /**
   * Set a structure to working state, optionally with an explicit progress value.
   */
  setWorking(entityId: string, progress = 0): void {
    const state = this.states.get(entityId);
    if (!state) return;
    const config = this.findConfigForState(state);
    state.state = 'working';
    state.workProgress = Math.max(0, Math.min(1, progress));
    state.animation = { ...config.working };
    state.glowIntensity = this.computeWorkingGlow(config, state.workProgress);
    state.nightGlowIntensity = this.computeNightGlow(config, 'working', state.workProgress);
    state.efficiencyModifier = 1;
    state.isCollapsed = false;
  }

  /**
   * Set a structure to complete state.
   */
  setComplete(entityId: string): void {
    const state = this.states.get(entityId);
    if (!state) return;
    const config = this.findConfigForState(state);
    state.state = 'complete';
    state.workProgress = 1;
    state.animation = { ...config.complete };
    state.glowIntensity = config.baseGlowIntensity * config.complete.intensity;
    state.nightGlowIntensity = this.computeNightGlow(config, 'complete', 1);
    state.efficiencyModifier = 1;
    state.isCollapsed = false;
  }

  /**
   * Set a structure to damaged state.
   */
  setDamaged(entityId: string): void {
    const state = this.states.get(entityId);
    if (!state) return;
    const config = this.findConfigForState(state);
    state.state = 'damaged';
    state.animation = { type: 'none', intensity: 0, speed: 0 };
    state.glowIntensity = config.baseGlowIntensity * 0.3;
    state.nightGlowIntensity = this.computeNightGlow(config, 'damaged', 0);
    state.efficiencyModifier = 0.5;
    state.isCollapsed = false;
  }

  /**
   * Set a structure to destroyed state.
   */
  setDestroyed(entityId: string): void {
    const state = this.states.get(entityId);
    if (!state) return;
    state.state = 'destroyed';
    state.workProgress = 0;
    state.animation = { type: 'none', intensity: 0, speed: 0 };
    state.glowIntensity = 0;
    state.nightGlowIntensity = 0;
    state.efficiencyModifier = 0;
    state.isCollapsed = true;
  }

  /**
   * Explicitly set the production progress for a structure (0-1).
   */
  setWorkProgress(entityId: string, progress: number): void {
    const state = this.states.get(entityId);
    if (!state) return;
    state.workProgress = Math.max(0, Math.min(1, progress));
    if (state.state === 'working') {
      const config = this.findConfigForState(state);
      state.glowIntensity = this.computeWorkingGlow(config, state.workProgress);
      state.nightGlowIntensity = this.computeNightGlow(config, 'working', state.workProgress);
    }
  }

  /**
   * Advance all tracked structure animations.
   * @param dt Delta time in seconds.
   */
  update(dt: number): void {
    for (const state of this.states.values()) {
      switch (state.state) {
        case 'working': {
          const config = this.findConfigForState(state);
          state.workProgress = Math.min(1, state.workProgress + dt * config.working.speed * 0.1);
          state.glowIntensity = this.computeWorkingGlow(config, state.workProgress);
          state.nightGlowIntensity = this.computeNightGlow(config, 'working', state.workProgress);
          break;
        }
        case 'damaged': {
          state.flickerTimer += dt;
          const flicker = 0.5 + 0.5 * Math.sin(state.flickerTimer * 10);
          state.glowIntensity = this.findConfigForState(state).baseGlowIntensity * 0.3 * flicker;
          break;
        }
        case 'destroyed': {
          state.glowIntensity = 0;
          state.nightGlowIntensity = 0;
          break;
        }
        case 'complete': {
          const config = this.findConfigForState(state);
          state.nightGlowIntensity = this.computeNightGlow(config, 'complete', 1);
          break;
        }
        case 'idle': {
          const config = this.findConfigForState(state);
          state.nightGlowIntensity = this.computeNightGlow(config, 'idle', 0);
          break;
        }
      }
    }
  }

  /**
   * Remove a structure from tracking.
   */
  removeEntity(entityId: string): void {
    this.states.delete(entityId);
  }

  /**
   * Reset all tracked data.
   */
  clear(): void {
    this.states.clear();
  }

  /**
   * Total number of tracked structures.
   */
  get count(): number {
    return this.states.size;
  }

  /**
   * Get the efficiency modifier for a structure.
   * Useful for external systems (e.g. crafting) to apply.
   */
  getEfficiencyModifier(entityId: string): number {
    return this.states.get(entityId)?.efficiencyModifier ?? 1;
  }

  private configKey(category: string, subType?: string): string {
    return subType ? `${category}:${subType}` : category;
  }

  private findConfigForState(state: StructureState): WorkAnimationConfig {
    return this.getConfig(state.category) ?? DEFAULT_ANIMATION_CONFIGS.HABITAT;
  }

  private computeWorkingGlow(config: WorkAnimationConfig, progress: number): number {
    return config.baseGlowIntensity * config.working.intensity * (1 + progress * 0.5);
  }

  private computeNightGlow(
    config: WorkAnimationConfig,
    stateName: StructureState['state'],
    progress: number
  ): number {
    const activityFactor: Record<StructureState['state'], number> = {
      idle: 0.5,
      working: 1.0 + progress,
      complete: 0.8,
      damaged: 0.2,
      destroyed: 0,
    };
    return config.baseGlowIntensity * config.nightGlowMultiplier * activityFactor[stateName];
  }
}
