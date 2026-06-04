/**
 * Combat Resolution Engine
 *
 * Manages combat phases, damage calculation, combat log,
 * and produces visual feedback data structures (damage numbers, hit sparks).
 *
 * Standalone manager — stores combat state outside the ECS to avoid WASM rebuilds.
 */

import type {
  Entity,
  CombatStats,
  CombatEvent,
  DamageNumber,
  HitSpark,
  CombatPhase,
  Biology,
  Fauna,
  Position,
} from '../../types';
import type { ECS as ECSType } from '../ecs';
import {
  calculateDamage,
  calculateAttackDefenseRatio,
  CRIT_MULTIPLIER,
} from './stats';
import { getClassMultiplier } from './unitTypes';

const PHASE_DURATIONS: Record<CombatPhase, number> = {
  Initiation: 0.5,
  Approach: 1.0,
  Attack: 0.2,
  Resolution: 0.1,
  Cooldown: 1.0,
};

/** Seconds until a damage number/hit spark expires */
const VISUAL_TTL = 1.5;

/** Unique ID generator */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export interface CombatManagerOptions {
  /** Base damage used when none is provided */
  defaultBaseDamage?: number;
  /** Cooldown between attacks in seconds */
  attackCooldown?: number;
  /** Max entries in combat log before pruning */
  maxLogSize?: number;
}

export class CombatManager {
  private ecs: ECSType;
  private combatStats: Map<Entity, CombatStats> = new Map();
  private combatLog: CombatEvent[] = [];
  private damageNumbers: DamageNumber[] = [];
  private hitSparks: HitSpark[] = [];
  private options: Required<CombatManagerOptions>;

  constructor(ecs: ECSType, options: CombatManagerOptions = {}) {
    this.ecs = ecs;
    this.options = {
      defaultBaseDamage: 10,
      attackCooldown: 1.2,
      maxLogSize: 500,
      ...options,
    };
  }

  // ---------------------------------------------------------------------------
  // Stat registration
  // ---------------------------------------------------------------------------

  /**
   * Registers combat stats for an entity.
   * These stats are managed by CombatManager, not added to ECS directly.
   */
  registerCombatStats(entity: Entity, stats: CombatStats): void {
    this.combatStats.set(entity, stats);
  }

  /** Retrieves registered combat stats for an entity. */
  getCombatStats(entity: Entity): CombatStats | undefined {
    return this.combatStats.get(entity);
  }

  /** Removes combat stats for an entity (e.g. on death). */
  unregisterCombatStats(entity: Entity): void {
    this.combatStats.delete(entity);
  }

  /** Returns all entities currently tracked by the combat manager. */
  getTrackedEntities(): Entity[] {
    return Array.from(this.combatStats.keys());
  }

  // ---------------------------------------------------------------------------
  // Combat log & visual feedback
  // ---------------------------------------------------------------------------

  /** Returns a shallow copy of the current combat log. */
  getCombatLog(): CombatEvent[] {
    return [...this.combatLog];
  }

  /** Returns current damage numbers awaiting visual rendering. */
  getDamageNumbers(): DamageNumber[] {
    return [...this.damageNumbers];
  }

  /** Returns current hit sparks awaiting visual rendering. */
  getHitSparks(): HitSpark[] {
    return [...this.hitSparks];
  }

  /** Clears expired visual feedback entries. Call each tick/frame. */
  cleanupVisualFeedback(currentTime: number): void {
    this.damageNumbers = this.damageNumbers.filter((dn) => currentTime - dn.timestamp < dn.ttl);
    this.hitSparks = this.hitSparks.filter((hs) => currentTime - hs.timestamp < hs.ttl);
  }

  /** Clears the entire combat log. */
  clearLog(): void {
    this.combatLog = [];
  }

  // ---------------------------------------------------------------------------
  // Core combat actions
  // ---------------------------------------------------------------------------

  /**
   * Initiates combat between attacker and target.
   * Sets both entities to the Initiation phase.
   */
  initiateCombat(attacker: Entity, target: Entity): void {
    const aStats = this.combatStats.get(attacker);
    const tStats = this.combatStats.get(target);
    if (!aStats || !tStats) return;

    aStats.target = target;
    aStats.currentPhase = 'Initiation';
    aStats.phaseTimer = PHASE_DURATIONS.Initiation;

    tStats.target = attacker;
    tStats.currentPhase = 'Initiation';
    tStats.phaseTimer = PHASE_DURATIONS.Initiation;
  }

  /**
   * Executes a single attack from attacker to target.
   * Computes damage, updates health, logs the event, and queues visual feedback.
   *
   * @param attacker - Attacking entity
   * @param target - Target entity
   * @param baseDamage - Optional override for base damage
   * @param rng - Optional random number generator for deterministic testing
   * @returns The generated CombatEvent, or undefined if either entity lacks stats
   */
  executeAttack(
    attacker: Entity,
    target: Entity,
    baseDamage?: number,
    rng: () => number = Math.random
  ): CombatEvent | undefined {
    const aStats = this.combatStats.get(attacker);
    const tStats = this.combatStats.get(target);
    if (!aStats || !tStats) return undefined;

    const effectiveBase = baseDamage ?? this.options.defaultBaseDamage;

    // Compute core damage
    const result = calculateDamage(
      effectiveBase,
      { attack: aStats.attack, speed: aStats.speed, elementalType: aStats.elementalType },
      { defense: tStats.defense, resistances: tStats.resistances },
      rng
    );

    // Apply class interaction multiplier
    const classMultiplier = getClassMultiplier(aStats.unitClass, tStats.unitClass);
    let finalDamage = Math.max(1, Math.round(result.damage * classMultiplier));

    // Pull target health from ECS Biology or Fauna component
    const biology = this.ecs.getComponent<Biology>(target, 'biology');
    const fauna = this.ecs.getComponent<Fauna>(target, 'fauna');
    let currentHealth = biology?.health ?? fauna?.health ?? 0;

    currentHealth = Math.max(0, currentHealth - finalDamage);

    // Write health back
    if (biology) {
      this.ecs.addComponent(target, { ...biology, health: currentHealth });
    } else if (fauna) {
      this.ecs.addComponent(target, { ...fauna, health: currentHealth });
    }

    const event: CombatEvent = {
      id: generateId(),
      attacker,
      target,
      damage: finalDamage,
      damageType: result.isCrit ? 'critical' : aStats.elementalType,
      timestamp: Date.now(),
      fatal: currentHealth <= 0,
      baseDamage: effectiveBase,
      multipliers: {
        ...result.multipliers,
        // Override with class-adjusted values for logging clarity
        attackDefenseRatio: result.multipliers.attackDefenseRatio * classMultiplier,
      },
    };

    this.combatLog.push(event);
    if (this.combatLog.length > this.options.maxLogSize) {
      this.combatLog.shift();
    }

    // Queue visual feedback
    this.damageNumbers.push({
      entity: target,
      value: finalDamage,
      type: result.isCrit ? 'crit' : 'damage',
      timestamp: event.timestamp,
      ttl: VISUAL_TTL,
    });

    this.hitSparks.push({
      entity: target,
      timestamp: event.timestamp,
      element: result.isCrit ? 'physical' : aStats.elementalType,
      ttl: VISUAL_TTL,
    });

    // Set cooldown on attacker
    aStats.cooldownTimer = this.options.attackCooldown;
    aStats.currentPhase = 'Cooldown';
    aStats.phaseTimer = PHASE_DURATIONS.Cooldown;

    return event;
  }

  /**
   * Checks if an entity can attack a target based on range.
   * Requires both entities to have Position components in the ECS.
   */
  canAttackInRange(attacker: Entity, target: Entity): boolean {
    const aStats = this.combatStats.get(attacker);
    const aPos = this.ecs.getComponent<Position>(attacker, 'position');
    const tPos = this.ecs.getComponent<Position>(target, 'position');
    if (!aStats || !aPos || !tPos) return false;

    const dx = aPos.x - tPos.x;
    const dy = aPos.y - tPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= aStats.range;
  }

  // ---------------------------------------------------------------------------
  // Phase management
  // ---------------------------------------------------------------------------

  /**
   * Advances combat phases for all tracked entities by delta seconds.
   * Handles phase transitions automatically.
   */
  updatePhases(delta: number): void {
    for (const [entity, stats] of this.combatStats.entries()) {
      if (!stats.currentPhase || stats.phaseTimer === undefined) continue;

      stats.phaseTimer -= delta;

      if (stats.phaseTimer <= 0) {
        this.advancePhase(entity, stats);
      }
    }
  }

  private advancePhase(entity: Entity, stats: CombatStats): void {
    const phaseOrder: CombatPhase[] = ['Initiation', 'Approach', 'Attack', 'Resolution', 'Cooldown'];
    const currentIdx = phaseOrder.indexOf(stats.currentPhase ?? 'Initiation');
    const nextIdx = currentIdx + 1;

    if (nextIdx >= phaseOrder.length) {
      // Combat cycle complete — reset to Approach to re-engage
      stats.currentPhase = 'Approach';
      stats.phaseTimer = PHASE_DURATIONS.Approach;
      return;
    }

    const nextPhase = phaseOrder[nextIdx];
    stats.currentPhase = nextPhase;
    stats.phaseTimer = PHASE_DURATIONS[nextPhase];

    if (nextPhase === 'Attack' && stats.target) {
      // Auto-execute attack when entering Attack phase
      this.executeAttack(entity, stats.target);
      // After attack, immediately move to Resolution
      stats.currentPhase = 'Resolution';
      stats.phaseTimer = PHASE_DURATIONS.Resolution;
    }
  }

  /**
   * Updates cooldown timers for all tracked entities.
   */
  updateCooldowns(delta: number): void {
    for (const stats of this.combatStats.values()) {
      if (stats.cooldownTimer !== undefined) {
        stats.cooldownTimer = Math.max(0, stats.cooldownTimer - delta);
      }
    }
  }

  /**
   * Returns the current phase of an entity, or undefined if not in combat.
   */
  getEntityPhase(entity: Entity): CombatPhase | undefined {
    return this.combatStats.get(entity)?.currentPhase;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Computes the effective attack-defense ratio for a specific engagement.
   */
  getEngagementRatio(attacker: Entity, target: Entity): number | undefined {
    const a = this.combatStats.get(attacker);
    const t = this.combatStats.get(target);
    if (!a || !t) return undefined;
    return calculateAttackDefenseRatio(a.attack, t.defense);
  }

  /**
   * Removes an entity from all combat tracking and clears its targets.
   */
  removeFromCombat(entity: Entity): void {
    // Clear any other entity targeting this one
    for (const stats of this.combatStats.values()) {
      if (stats.target === entity) {
        stats.target = undefined;
        stats.currentPhase = undefined;
        stats.phaseTimer = undefined;
      }
    }
    this.unregisterCombatStats(entity);
  }
}
