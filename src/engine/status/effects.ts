/**
 * Status Effects & CC Framework
 *
 * Manages buffs, debuffs, crowd-control effects on entities.
 * Handles stacking rules, ticking (DOT), duration, and intensity.
 *
 * Standalone manager that works alongside the ECS.
 */

import type {
  Entity,
  StatusEffect,
  StatusEffectType,
  StatusEffectCategory,
  Biology,
  Fauna,
  Movement,
} from '../../types';
import type { ECS as ECSType } from '../ecs';

export interface StatusEffectDef {
  effectType: StatusEffectType;
  category: StatusEffectCategory;
  /** Default intensity */
  defaultIntensity: number;
  /** Default duration in seconds */
  defaultDuration: number;
  /** Tick interval in seconds (0 = non-ticking) */
  defaultTickInterval: number;
  /** Maximum intensity for stacking */
  maxIntensity: number;
  /** Max duration for stacking */
  maxDuration: number;
  /** Stacking behavior */
  stackMode: 'refresh' | 'stackIntensity' | 'stackDuration';
  /** Description of the effect */
  description: string;
}

/** Definitions for all built-in status effects */
export const STATUS_EFFECT_DEFS: Record<StatusEffectType, StatusEffectDef> = {
  Blessed: {
    effectType: 'Blessed',
    category: 'buff',
    defaultIntensity: 5,
    defaultDuration: 30,
    defaultTickInterval: 0,
    maxIntensity: 20,
    maxDuration: 60,
    stackMode: 'stackIntensity',
    description: 'Increases devotion generation.',
  },
  Inspired: {
    effectType: 'Inspired',
    category: 'buff',
    defaultIntensity: 10,
    defaultDuration: 20,
    defaultTickInterval: 0,
    maxIntensity: 30,
    maxDuration: 40,
    stackMode: 'refresh',
    description: 'Boosts productivity and efficiency.',
  },
  Hasted: {
    effectType: 'Hasted',
    category: 'buff',
    defaultIntensity: 3,
    defaultDuration: 15,
    defaultTickInterval: 0,
    maxIntensity: 10,
    maxDuration: 30,
    stackMode: 'stackIntensity',
    description: 'Increases movement and attack speed.',
  },
  Cursed: {
    effectType: 'Cursed',
    category: 'debuff',
    defaultIntensity: -5,
    defaultDuration: 30,
    defaultTickInterval: 0,
    maxIntensity: -20,
    maxDuration: 60,
    stackMode: 'stackIntensity',
    description: 'Reduces devotion generation.',
  },
  Diseased: {
    effectType: 'Diseased',
    category: 'debuff',
    defaultIntensity: -2,
    defaultDuration: 60,
    defaultTickInterval: 5,
    maxIntensity: -10,
    maxDuration: 120,
    stackMode: 'stackIntensity',
    description: 'Periodically drains health.',
  },
  Starving: {
    effectType: 'Starving',
    category: 'debuff',
    defaultIntensity: -5,
    defaultDuration: 45,
    defaultTickInterval: 0,
    maxIntensity: -15,
    maxDuration: 90,
    stackMode: 'refresh',
    description: 'Reduces attack strength.',
  },
  Poisoned: {
    effectType: 'Poisoned',
    category: 'debuff',
    defaultIntensity: 3,
    defaultDuration: 20,
    defaultTickInterval: 2,
    maxIntensity: 10,
    maxDuration: 40,
    stackMode: 'stackIntensity',
    description: 'Damage over time from poison.',
  },
  Stunned: {
    effectType: 'Stunned',
    category: 'cc',
    defaultIntensity: 1,
    defaultDuration: 3,
    defaultTickInterval: 0,
    maxIntensity: 1,
    maxDuration: 6,
    stackMode: 'stackDuration',
    description: 'Unable to act.',
  },
  Feared: {
    effectType: 'Feared',
    category: 'cc',
    defaultIntensity: 1,
    defaultDuration: 5,
    defaultTickInterval: 0,
    maxIntensity: 1,
    maxDuration: 10,
    stackMode: 'refresh',
    description: 'Forces movement away from enemies.',
  },
  Rooted: {
    effectType: 'Rooted',
    category: 'cc',
    defaultIntensity: 1,
    defaultDuration: 4,
    defaultTickInterval: 0,
    maxIntensity: 1,
    maxDuration: 8,
    stackMode: 'stackDuration',
    description: 'Unable to move.',
  },
  Slowed: {
    effectType: 'Slowed',
    category: 'cc',
    defaultIntensity: -3,
    defaultDuration: 6,
    defaultTickInterval: 0,
    maxIntensity: -8,
    maxDuration: 12,
    stackMode: 'stackIntensity',
    description: 'Reduces movement and attack speed.',
  },
  Blinded: {
    effectType: 'Blinded',
    category: 'cc',
    defaultIntensity: 1,
    defaultDuration: 5,
    defaultTickInterval: 0,
    maxIntensity: 1,
    maxDuration: 10,
    stackMode: 'refresh',
    description: 'Reduces accuracy and effective range.',
  },
};

export interface TickResult {
  entity: Entity;
  effectType: StatusEffectType;
  /** Damage or heal applied this tick */
  healthDelta: number;
  /** Whether the effect expired */
  expired: boolean;
}

export class StatusEffectManager {
  private ecs: ECSType;
  private effects: Map<Entity, StatusEffect[]> = new Map();

  constructor(ecs: ECSType) {
    this.ecs = ecs;
  }

  // ---------------------------------------------------------------------------
  // Application
  // ---------------------------------------------------------------------------

  /**
   * Applies a status effect to an entity.
   * Respects stacking rules defined by the effect type.
   *
   * @param entity - Target entity
   * @param effectType - Type of effect to apply
   * @param source - Entity that caused the effect
   * @param overrides - Optional overrides for intensity/duration
   * @returns The applied (or updated) StatusEffect
   */
  applyEffect(
    entity: Entity,
    effectType: StatusEffectType,
    source: Entity,
    overrides: Partial<Pick<StatusEffect, 'intensity' | 'duration'>> = {}
  ): StatusEffect {
    const def = STATUS_EFFECT_DEFS[effectType];
    let entityEffects = this.effects.get(entity);
    if (!entityEffects) {
      entityEffects = [];
      this.effects.set(entity, entityEffects);
    }

    const existing = entityEffects.find((e) => e.effectType === effectType);
    const newIntensity = overrides.intensity ?? def.defaultIntensity;
    const newDuration = overrides.duration ?? def.defaultDuration;

    if (existing) {
      // Stacking logic
      switch (existing.stackMode) {
        case 'refresh':
          existing.duration = Math.max(existing.duration, newDuration);
          existing.tickTimer = Math.min(existing.tickTimer, existing.tickInterval);
          break;
        case 'stackIntensity': {
          const proposed = existing.intensity + newIntensity;
          const clamped =
            def.maxIntensity > 0
              ? Math.min(proposed, def.maxIntensity)
              : Math.max(proposed, def.maxIntensity);
          existing.intensity = clamped;
          existing.duration = Math.max(existing.duration, newDuration);
          break;
        }
        case 'stackDuration':
          existing.duration = Math.min(existing.duration + newDuration, def.maxDuration);
          break;
      }
      return existing;
    }

    const effect: StatusEffect = {
      type: 'statusEffect',
      effectType,
      category: def.category,
      intensity: newIntensity,
      duration: newDuration,
      tickInterval: def.defaultTickInterval,
      tickTimer: def.defaultTickInterval,
      source,
      maxDuration: def.maxDuration,
      maxIntensity: def.maxIntensity,
      stackMode: def.stackMode,
    };

    entityEffects.push(effect);
    return effect;
  }

  /**
   * Convenience helper: applies an effect using its definition defaults.
   */
  applyEffectDefault(entity: Entity, effectType: StatusEffectType, source: Entity): StatusEffect {
    return this.applyEffect(entity, effectType, source);
  }

  /**
   * Removes all effects of a specific type from an entity.
   */
  removeEffect(entity: Entity, effectType: StatusEffectType): void {
    const entityEffects = this.effects.get(entity);
    if (!entityEffects) return;
    const idx = entityEffects.findIndex((e) => e.effectType === effectType);
    if (idx !== -1) {
      entityEffects.splice(idx, 1);
    }
  }

  /**
   * Removes all status effects from an entity.
   */
  clearEffects(entity: Entity): void {
    this.effects.delete(entity);
  }

  /**
   * Gets all active effects on an entity.
   */
  getEffects(entity: Entity): StatusEffect[] {
    return (this.effects.get(entity) ?? []).map((e) => ({ ...e }));
  }

  /**
   * Gets a specific active effect on an entity.
   */
  getEffect(entity: Entity, effectType: StatusEffectType): StatusEffect | undefined {
    return this.effects.get(entity)?.find((e) => e.effectType === effectType);
  }

  /**
   * Checks if an entity has a specific effect.
   */
  hasEffect(entity: Entity, effectType: StatusEffectType): boolean {
    return this.effects.get(entity)?.some((e) => e.effectType === effectType) ?? false;
  }

  // ---------------------------------------------------------------------------
  // Tick / update
  // ---------------------------------------------------------------------------

  /**
   * Advances all status effects by delta seconds.
   * Processes tick intervals (DOT), expiration, and writes health changes to ECS.
   *
   * @param delta - Elapsed seconds
   * @returns Array of tick results for this frame
   */
  tick(delta: number): TickResult[] {
    const results: TickResult[] = [];

    for (const [entity, entityEffects] of this.effects.entries()) {
      for (let i = entityEffects.length - 1; i >= 0; i--) {
        const effect = entityEffects[i];
        effect.duration -= delta;
        let expired = false;
        let healthDelta = 0;

        if (effect.tickInterval > 0) {
          effect.tickTimer -= delta;
          while (effect.tickTimer <= 0 && effect.duration > 0) {
            const tickValue = this.processTickEffect(entity, effect);
            healthDelta += tickValue;
            effect.tickTimer += effect.tickInterval;
          }
        }

        if (effect.duration <= 0) {
          entityEffects.splice(i, 1);
          expired = true;
        }

        if (healthDelta !== 0 || expired) {
          results.push({ entity, effectType: effect.effectType, healthDelta, expired });
        }
      }

      if (entityEffects.length === 0) {
        this.effects.delete(entity);
      }
    }

    return results;
  }

  /**
   * Processes a single tick of a status effect.
   * Returns health delta (negative for damage, positive for heal).
   */
  private processTickEffect(entity: Entity, effect: StatusEffect): number {
    switch (effect.effectType) {
      case 'Poisoned':
        return -Math.abs(effect.intensity);
      case 'Diseased':
        return -Math.abs(effect.intensity);
      default:
        return 0;
    }
  }

  /**
   * Applies accumulated health deltas from tick results to ECS components.
   * Should be called after tick() if you want health written immediately.
   */
  applyHealthDeltas(results: TickResult[]): void {
    // Group by entity
    const deltas = new Map<Entity, number>();
    for (const r of results) {
      if (r.healthDelta === 0) continue;
      deltas.set(r.entity, (deltas.get(r.entity) ?? 0) + r.healthDelta);
    }

    for (const [entity, delta] of deltas.entries()) {
      const biology = this.ecs.getComponent<Biology>(entity, 'biology');
      const fauna = this.ecs.getComponent<Fauna>(entity, 'fauna');
      if (biology) {
        this.ecs.addComponent(entity, { ...biology, health: Math.max(0, biology.health + delta) });
      } else if (fauna) {
        this.ecs.addComponent(entity, { ...fauna, health: Math.max(0, fauna.health + delta) });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns all entities currently affected by any status effect.
   */
  getAffectedEntities(): Entity[] {
    return Array.from(this.effects.keys());
  }

  /**
   * Returns all entities with a specific effect type.
   */
  getEntitiesWithEffect(effectType: StatusEffectType): Entity[] {
    const entities: Entity[] = [];
    for (const [entity, effs] of this.effects.entries()) {
      if (effs.some((e) => e.effectType === effectType)) {
        entities.push(entity);
      }
    }
    return entities;
  }

  /**
   * Returns entities currently under crowd control.
   */
  getCCdEntities(): Entity[] {
    const entities: Entity[] = [];
    for (const [entity, effs] of this.effects.entries()) {
      if (effs.some((e) => e.category === 'cc')) {
        entities.push(entity);
      }
    }
    return entities;
  }

  /**
   * Returns total active effect count across all entities.
   */
  getTotalActiveEffectCount(): number {
    let count = 0;
    for (const effs of this.effects.values()) {
      count += effs.length;
    }
    return count;
  }

  // ---------------------------------------------------------------------------
  // Modifier helpers (for external systems)
  // ---------------------------------------------------------------------------

  /**
   * Gets the total speed modifier from Hasted / Slowed effects.
   * Returns additive modifier (positive = faster).
   */
  getNetSpeedModifier(entity: Entity): number {
    const effs = this.effects.get(entity);
    if (!effs) return 0;
    let modifier = 0;
    for (const e of effs) {
      if (e.effectType === 'Hasted') modifier += e.intensity;
      if (e.effectType === 'Slowed') modifier += e.intensity;
    }
    return modifier;
  }

  /**
   * Gets the total attack modifier from Starving / Inspired effects.
   */
  getNetAttackModifier(entity: Entity): number {
    const effs = this.effects.get(entity);
    if (!effs) return 0;
    let modifier = 0;
    for (const e of effs) {
      if (e.effectType === 'Inspired') modifier += e.intensity;
      if (e.effectType === 'Starving') modifier += e.intensity;
    }
    return modifier;
  }

  /**
   * Checks if an entity is stunned (cannot act).
   */
  isStunned(entity: Entity): boolean {
    return this.hasEffect(entity, 'Stunned');
  }

  /**
   * Checks if an entity is rooted (cannot move).
   */
  isRooted(entity: Entity): boolean {
    return this.hasEffect(entity, 'Rooted');
  }
}
