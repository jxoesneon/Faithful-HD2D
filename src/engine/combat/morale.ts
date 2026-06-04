/**
 * Morale & Psychology System
 *
 * Tracks per-entity morale (0-100), applies situational modifiers,
 * handles break/flee thresholds, rally abilities, and rout chains.
 *
 * Standalone manager that references the ECS for Position queries.
 */

import type { Entity, Position, Morale as MoraleComponent } from '../../types';
import type { ECS as ECSType } from '../ecs';

const MORALE_MIN = 0;
const MORALE_MAX = 100;

/** Morale below this causes the entity to flee */
export const BREAK_THRESHOLD = 25;

/** Radius for rout chain reactions and rally effects */
export const MORALE_AURA_RADIUS = 6;

/** Modifier values (percentage points) */
export const MORALE_MODIFIERS = {
  outnumbered: -10,
  commanderPresent: 15,
  allyCasualty: -5,
  victory: 10,
  nearbyFleeing: -8,
  rallyAbility: 20,
} as const;

export interface MoraleSnapshot {
  entity: Entity;
  value: number;
  isFleeing: boolean;
}

export interface MoraleManagerOptions {
  /** Tick interval in seconds for periodic morale updates */
  tickInterval?: number;
}

export class MoraleManager {
  private ecs: ECSType;
  private moraleData: Map<Entity, MoraleComponent> = new Map();
  private options: Required<MoraleManagerOptions>;
  private tickAccumulator = 0;

  constructor(ecs: ECSType, options: MoraleManagerOptions = {}) {
    this.ecs = ecs;
    this.options = {
      tickInterval: 1.0,
      ...options,
    };
  }

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  /**
   * Registers morale data for an entity.
   * Initial value defaults to 75.
   */
  registerMorale(entity: Entity, initialValue = 75): void {
    this.moraleData.set(entity, {
      type: 'morale',
      value: Math.min(MORALE_MAX, Math.max(MORALE_MIN, initialValue)),
      isFleeing: initialValue < BREAK_THRESHOLD,
      lastRallyTime: 0,
    });
  }

  /** Retrieves morale data for an entity. */
  getMorale(entity: Entity): MoraleComponent | undefined {
    return this.moraleData.get(entity);
  }

  /** Returns the numeric morale value (0-100) or undefined. */
  getMoraleValue(entity: Entity): number | undefined {
    return this.moraleData.get(entity)?.value;
  }

  /** Checks if the entity is currently fleeing. */
  isFleeing(entity: Entity): boolean {
    return this.moraleData.get(entity)?.isFleeing ?? false;
  }

  /** Unregisters morale data (e.g. on entity death). */
  unregisterMorale(entity: Entity): void {
    this.moraleData.delete(entity);
  }

  /** Returns all tracked entities. */
  getTrackedEntities(): Entity[] {
    return Array.from(this.moraleData.keys());
  }

  // ---------------------------------------------------------------------------
  // Morale manipulation
  // ---------------------------------------------------------------------------

  /**
   * Applies a flat morale delta, clamped to [0, 100], and updates flee state.
   */
  modifyMorale(entity: Entity, delta: number): MoraleComponent | undefined {
    const morale = this.moraleData.get(entity);
    if (!morale) return undefined;

    morale.value = Math.min(MORALE_MAX, Math.max(MORALE_MIN, morale.value + delta));
    morale.isFleeing = morale.value < BREAK_THRESHOLD;
    return morale;
  }

  /**
   * Sets morale to a specific value (clamped).
   */
  setMorale(entity: Entity, value: number): MoraleComponent | undefined {
    const morale = this.moraleData.get(entity);
    if (!morale) return undefined;

    morale.value = Math.min(MORALE_MAX, Math.max(MORALE_MIN, value));
    morale.isFleeing = morale.value < BREAK_THRESHOLD;
    return morale;
  }

  // ---------------------------------------------------------------------------
  // Situational modifiers
  // ---------------------------------------------------------------------------

  /**
   * Applies the "outnumbered" penalty if enemyCount > allyCount.
   */
  applyOutnumberedModifier(entity: Entity, allyCount: number, enemyCount: number): void {
    if (enemyCount > allyCount) {
      this.modifyMorale(entity, MORALE_MODIFIERS.outnumbered);
    }
  }

  /**
   * Applies the commander presence bonus.
   */
  applyCommanderPresence(entity: Entity): void {
    this.modifyMorale(entity, MORALE_MODIFIERS.commanderPresent);
  }

  /**
   * Applies casualty penalty per dead ally.
   */
  applyCasualtyModifier(entity: Entity, deadAllies: number): void {
    if (deadAllies > 0) {
      this.modifyMorale(entity, deadAllies * MORALE_MODIFIERS.allyCasualty);
    }
  }

  /**
   * Applies victory bonus.
   */
  applyVictoryModifier(entity: Entity): void {
    this.modifyMorale(entity, MORALE_MODIFIERS.victory);
  }

  // ---------------------------------------------------------------------------
  // Rally & Rout
  // ---------------------------------------------------------------------------

  /**
   * Executes a rally ability from a source entity.
   * Grants a morale boost to all tracked allies within MORALE_AURA_RADIUS.
   *
   * @param source - Entity performing the rally
   * @param affected - Array of allied entity IDs to check
   * @param currentTime - Current simulation time
   */
  rally(source: Entity, affected: Entity[], currentTime: number): Entity[] {
    const sourcePos = this.ecs.getComponent<Position>(source, 'position');
    const rallied: Entity[] = [];

    for (const entity of affected) {
      if (entity === source) continue;
      const morale = this.moraleData.get(entity);
      if (!morale) continue;

      // Check distance if source has a position
      if (sourcePos) {
        const targetPos = this.ecs.getComponent<Position>(entity, 'position');
        if (targetPos) {
          const dx = sourcePos.x - targetPos.x;
          const dy = sourcePos.y - targetPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > MORALE_AURA_RADIUS) continue;
        }
      }

      this.modifyMorale(entity, MORALE_MODIFIERS.rallyAbility);
      morale.lastRallyTime = currentTime;
      morale.isFleeing = false; // Rally stops fleeing
      rallied.push(entity);
    }

    return rallied;
  }

  /**
   * Propagates rout penalties when an entity flees.
   * Nearby allies within MORALE_AURA_RADIUS lose morale.
   *
   * @param fleeingEntity - The entity that just started fleeing
   * @returns Array of affected allies
   */
  propagateRout(fleeingEntity: Entity): Entity[] {
    const fleePos = this.ecs.getComponent<Position>(fleeingEntity, 'position');
    const affected: Entity[] = [];

    for (const [entity, morale] of this.moraleData.entries()) {
      if (entity === fleeingEntity) continue;
      if (!morale) continue;

      if (fleePos) {
        const targetPos = this.ecs.getComponent<Position>(entity, 'position');
        if (targetPos) {
          const dx = fleePos.x - targetPos.x;
          const dy = fleePos.y - targetPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > MORALE_AURA_RADIUS) continue;
        }
      }

      this.modifyMorale(entity, MORALE_MODIFIERS.nearbyFleeing);
      affected.push(entity);
    }

    return affected;
  }

  /**
   * Marks an entity as fleeing and triggers rout propagation.
   * Returns affected allies.
   */
  triggerFlee(entity: Entity): Entity[] {
    const morale = this.moraleData.get(entity);
    if (!morale) return [];

    morale.isFleeing = true;
    return this.propagateRout(entity);
  }

  // ---------------------------------------------------------------------------
  // Periodic tick
  // ---------------------------------------------------------------------------

  /**
   * Updates morale-related timers and processes per-tick effects.
   * Call each simulation step with delta time.
   */
  tick(delta: number): void {
    this.tickAccumulator += delta;
    if (this.tickAccumulator < this.options.tickInterval) return;
    this.tickAccumulator = 0;

    // No per-tick passive decay by default; extend here if desired
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns a snapshot of morale state for all tracked entities.
   */
  getAllMorale(): MoraleSnapshot[] {
    const snapshots: MoraleSnapshot[] = [];
    for (const [entity, morale] of this.moraleData.entries()) {
      snapshots.push({ entity, value: morale.value, isFleeing: morale.isFleeing });
    }
    return snapshots;
  }

  /**
   * Returns all entities currently fleeing.
   */
  getFleeingEntities(): Entity[] {
    const fleeing: Entity[] = [];
    for (const [entity, morale] of this.moraleData.entries()) {
      if (morale.isFleeing) fleeing.push(entity);
    }
    return fleeing;
  }

  /**
   * Returns entities whose morale is below the break threshold but not yet marked fleeing.
   * Useful for triggering flee state before the next update.
   */
  getBrokenEntities(): Entity[] {
    const broken: Entity[] = [];
    for (const [entity, morale] of this.moraleData.entries()) {
      if (morale.value < BREAK_THRESHOLD && !morale.isFleeing) broken.push(entity);
    }
    return broken;
  }

  /**
   * Bulk-applies flee state to all broken entities and triggers rout.
   * Returns all newly affected allies from rout chains.
   */
  resolveBreaks(): Map<Entity, Entity[]> {
    const results = new Map<Entity, Entity[]>();
    for (const entity of this.getBrokenEntities()) {
      results.set(entity, this.triggerFlee(entity));
    }
    return results;
  }
}
