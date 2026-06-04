import type { Entity, Position, CombatStats, CombatAIState, ElementalType } from '../../types';
import type { ECS as ECSType } from '../ecs';
import { calculateElementalMultiplier, calculateAttackDefenseRatio } from '../combat/stats';
import { getClassMultiplier, doesCounter } from '../combat/unitTypes';
import { BREAK_THRESHOLD } from '../combat/morale';

export type { CombatAIState };

// ============================================================================
// Threat Assessment
// ============================================================================

export interface ThreatTarget {
  entity: Entity;
  position: Position;
  stats: CombatStats;
  healthRatio: number;
}

export interface ThreatAssessmentData {
  entity: Entity;
  dangerScore: number;
  proximityScore: number;
  healthRatio: number;
  threatLevel: number;
}

export class ThreatAssessment {
  private ecs: ECSType;

  constructor(ecs: ECSType) {
    this.ecs = ecs;
  }

  /** Computes a composite danger score for a target. Higher = more dangerous. */
  evaluateDanger(target: ThreatTarget): number {
    const attackRatio = target.stats.attack / 10;
    const speedFactor = target.stats.speed / 10;
    const healthFactor = 1.1 - target.healthRatio; // lower health = slightly less dangerous
    return attackRatio * 2 + speedFactor + healthFactor;
  }

  /** Prioritizes targets by proximity, health, and threat. Lower score = higher priority. */
  prioritizeTargets(
    observer: Entity,
    candidates: ThreatTarget[],
    weights: { proximity: number; health: number; threat: number } = { proximity: 1, health: 0.5, threat: 1.5 }
  ): ThreatTarget[] {
    const observerPos = this.ecs.getComponent<Position>(observer, 'position');
    if (!observerPos) return [...candidates];

    const scored = candidates.map((t) => {
      const dx = t.position.x - observerPos.x;
      const dy = t.position.y - observerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const danger = this.evaluateDanger(t);
      const score = weights.proximity * dist + weights.health * t.healthRatio * 10 + weights.threat * danger;
      return { target: t, score };
    });

    scored.sort((a, b) => a.score - b.score);
    return scored.map((s) => s.target);
  }

  /** Quick danger score for a single enemy relative to the observer */
  computeThreatLevel(observerStats: CombatStats, enemyStats: CombatStats): number {
    const ratio = calculateAttackDefenseRatio(enemyStats.attack, observerStats.defense);
    const counterBonus = doesCounter(enemyStats.unitClass, observerStats.unitClass) ? 1.5 : 1.0;
    return ratio * counterBonus;
  }

  /** Produces a structured threat assessment for each candidate */
  assessThreats(
    observer: Entity,
    candidates: ThreatTarget[]
  ): ThreatAssessmentData[] {
    const observerPos = this.ecs.getComponent<Position>(observer, 'position');
    const observerStats = this.ecs.getComponent<CombatStats>(observer, 'combatStats');

    return candidates.map((t) => {
      const dist = observerPos
        ? Math.sqrt((t.position.x - observerPos.x) ** 2 + (t.position.y - observerPos.y) ** 2)
        : Infinity;
      const danger = this.evaluateDanger(t);
      const threatLevel = observerStats ? this.computeThreatLevel(observerStats, t.stats) : 1;
      return {
        entity: t.entity,
        dangerScore: danger,
        proximityScore: dist,
        healthRatio: t.healthRatio,
        threatLevel,
      };
    });
  }
}

// ============================================================================
// Tactical Positioning
// ============================================================================

export class TacticalPositioning {
  private ecs: ECSType;

  constructor(ecs: ECSType) {
    this.ecs = ecs;
  }

  /** Returns a flanking position on the left or right side of the target */
  calculateFlankPosition(
    target: Entity,
    side: 'left' | 'right',
    distance: number = 3
  ): { x: number; y: number } | undefined {
    const tPos = this.ecs.getComponent<Position>(target, 'position');
    if (!tPos) return undefined;

    const angle = side === 'left' ? -Math.PI / 2 : Math.PI / 2;
    return {
      x: tPos.x + Math.cos(angle) * distance,
      y: tPos.y + Math.sin(angle) * distance,
    };
  }

  /** Evaluates high-ground advantage based on terrain height at observer vs target */
  evaluateHighGround(observer: Entity, target: Entity, terrain: number[][]): number {
    const oPos = this.ecs.getComponent<Position>(observer, 'position');
    const tPos = this.ecs.getComponent<Position>(target, 'position');
    if (!oPos || !tPos) return 0;

    const oHeight = terrain[Math.floor(oPos.y)]?.[Math.floor(oPos.x)] ?? 0;
    const tHeight = terrain[Math.floor(tPos.y)]?.[Math.floor(tPos.x)] ?? 0;
    return Math.max(0, oHeight - tHeight);
  }

  /** Returns the closest cover position from a set of candidate cells */
  findCover(observer: Entity, obstacles: Set<string>): { x: number; y: number } | undefined {
    const oPos = this.ecs.getComponent<Position>(observer, 'position');
    if (!oPos) return undefined;

    let best: { x: number; y: number } | undefined;
    let bestDist = Infinity;
    for (const key of obstacles) {
      const [ox, oy] = key.split(',').map(Number);
      const dx = ox - oPos.x;
      const dy = oy - oPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist && dist > 0) {
        bestDist = dist;
        best = { x: ox, y: oy };
      }
    }
    return best;
  }

  /** Computes an ambush position behind the target relative to observer */
  calculateAmbushPosition(target: Entity, observer: Entity, offset: number = 4): { x: number; y: number } | undefined {
    const tPos = this.ecs.getComponent<Position>(target, 'position');
    const oPos = this.ecs.getComponent<Position>(observer, 'position');
    if (!tPos || !oPos) return undefined;

    const dx = tPos.x - oPos.x;
    const dy = tPos.y - oPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x: tPos.x + (dx / dist) * offset,
      y: tPos.y + (dy / dist) * offset,
    };
  }
}

// ============================================================================
// Ability Selection
// ============================================================================

export interface AISelectableAbility {
  name: string;
  damage?: number;
  healing?: number;
  range: number;
  cooldown: number;
  currentCooldown: number;
  elementalType: ElementalType;
  preferredTargetType?: 'single' | 'aoe' | 'self';
}

export class AbilitySelector {
  /** Selects the best ability against a target based on cooldowns and effectiveness */
  selectAbility(
    abilities: AISelectableAbility[],
    observerStats: CombatStats,
    targetStats: CombatStats
  ): AISelectableAbility | undefined {
    const available = abilities.filter((a) => a.currentCooldown <= 0);
    if (available.length === 0) return undefined;

    let best: AISelectableAbility | undefined;
    let bestScore = -Infinity;

    for (const ability of available) {
      let score = 0;

      // Damage effectiveness using elemental multiplier and class multiplier
      if (ability.damage) {
        const elementalMult = calculateElementalMultiplier(ability.elementalType, targetStats.resistances);
        const classMult = getClassMultiplier(observerStats.unitClass, targetStats.unitClass);
        score += ability.damage * elementalMult * classMult;
      }

      // Healing value
      if (ability.healing) {
        score += ability.healing * 0.8;
      }

      // Range bonus (prefer abilities that can be used now)
      score += ability.range * 0.5;

      // Penalize long cooldowns slightly
      score -= ability.cooldown * 0.2;

      if (score > bestScore) {
        bestScore = score;
        best = ability;
      }
    }

    return best;
  }

  /** Reduces currentCooldown for all abilities by delta */
  tickCooldowns(abilities: AISelectableAbility[], delta: number): void {
    for (const a of abilities) {
      a.currentCooldown = Math.max(0, a.currentCooldown - delta);
    }
  }
}

// ============================================================================
// Retreat Logic
// ============================================================================

export interface RetreatCheck {
  shouldRetreat: boolean;
  healthRatio: number;
  outnumberedRatio: number;
  moraleValue?: number;
}

export class RetreatLogic {
  private ecs: ECSType;

  constructor(ecs: ECSType) {
    this.ecs = ecs;
  }

  /** Determines if an entity should retreat based on health, threats, and morale */
  shouldRetreat(
    entity: Entity,
    stats: CombatStats,
    nearbyEnemies: number,
    nearbyAllies: number,
    moraleValue?: number
  ): RetreatCheck {
    const healthComp = this.ecs.getComponent<{ type: 'biology'; health: number }>(entity, 'biology') ??
                       this.ecs.getComponent<{ type: 'fauna'; health: number }>(entity, 'fauna');
    const maxHealth = 100; // default assumption; callers can override
    const healthRatio = healthComp ? healthComp.health / maxHealth : 1;

    const outnumberedRatio = nearbyEnemies / Math.max(1, nearbyAllies);

    let should = false;
    if (moraleValue !== undefined && moraleValue < BREAK_THRESHOLD) {
      should = true;
    } else if (healthRatio < 0.2) {
      should = true;
    } else if (outnumberedRatio > 3) {
      should = true;
    } else if (healthRatio < 0.4 && outnumberedRatio > 1.5) {
      should = true;
    }

    return { shouldRetreat: should, healthRatio, outnumberedRatio, moraleValue };
  }

  /** Calculates a retreat destination away from the weighted center of threats */
  calculateRetreatDestination(entity: Entity, threatPositions: Position[]): { x: number; y: number } | undefined {
    const pos = this.ecs.getComponent<Position>(entity, 'position');
    if (!pos) return undefined;

    if (threatPositions.length === 0) return { x: pos.x, y: pos.y };

    let cx = 0;
    let cy = 0;
    for (const tp of threatPositions) {
      cx += tp.x;
      cy += tp.y;
    }
    cx /= threatPositions.length;
    cy /= threatPositions.length;

    const dx = pos.x - cx;
    const dy = pos.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const retreatDist = 8;

    return {
      x: pos.x + (dx / dist) * retreatDist,
      y: pos.y + (dy / dist) * retreatDist,
    };
  }

  /** Returns allies within the call-for-help radius */
  getAlliesInRadius(entity: Entity, allies: Entity[], radius: number): Entity[] {
    const pos = this.ecs.getComponent<Position>(entity, 'position');
    if (!pos) return [];

    const r2 = radius * radius;
    return allies.filter((ally) => {
      if (ally === entity) return false;
      const aPos = this.ecs.getComponent<Position>(ally, 'position');
      if (!aPos) return false;
      const dx = aPos.x - pos.x;
      const dy = aPos.y - pos.y;
      return dx * dx + dy * dy <= r2;
    });
  }
}

// ============================================================================
// Combat AI Manager
// ============================================================================

export interface CombatAIEntityState {
  entity: Entity;
  abilities: AISelectableAbility[];
  lastThreatCheck: number;
  state: 'IDLE' | 'ENGAGING' | 'FLANKING' | 'RETREATING' | 'SEEKING_COVER';
  preferredRange: number;
}

export interface CombatAIManagerOptions {
  threatCheckInterval?: number;
  callForHelpRadius?: number;
  preferredRangeBuffer?: number;
}

export class CombatAIManager {
  private ecs: ECSType;
  private entities = new Map<Entity, CombatAIEntityState>();
  private threatAssessment: ThreatAssessment;
  private positioning: TacticalPositioning;
  private abilitySelector: AbilitySelector;
  private retreatLogic: RetreatLogic;
  private options: Required<CombatAIManagerOptions>;

  constructor(ecs: ECSType, options: CombatAIManagerOptions = {}) {
    this.ecs = ecs;
    this.threatAssessment = new ThreatAssessment(ecs);
    this.positioning = new TacticalPositioning(ecs);
    this.abilitySelector = new AbilitySelector();
    this.retreatLogic = new RetreatLogic(ecs);
    this.options = {
      threatCheckInterval: 0.5,
      callForHelpRadius: 10,
      preferredRangeBuffer: 1,
      ...options,
    };
  }

  registerEntity(
    entity: Entity,
    initialState: Partial<Omit<CombatAIState, 'type'>> = {}
  ): void {
    const aiState: CombatAIState = {
      type: 'combatAIState',
      currentTarget: null,
      threatLevel: 0,
      lastAbilityUsed: '',
      abilityCooldowns: {},
      isRetreating: false,
      calledForHelp: false,
      ...initialState,
    };
    this.ecs.addComponent(entity, aiState);
    this.entities.set(entity, {
      entity,
      abilities: [],
      lastThreatCheck: -Infinity,
      state: 'IDLE',
      preferredRange: 1,
    });
  }

  unregisterEntity(entity: Entity): void {
    this.entities.delete(entity);
  }

  getEntityState(entity: Entity): CombatAIEntityState | undefined {
    return this.entities.get(entity);
  }

  setAbilities(entity: Entity, abilities: AISelectableAbility[]): void {
    const state = this.entities.get(entity);
    if (state) state.abilities = abilities;
  }

  setPreferredRange(entity: Entity, range: number): void {
    const state = this.entities.get(entity);
    if (state) state.preferredRange = range;
  }

  /** Main tick: assess threats, choose tactics, update movement targets */
  tick(delta: number, time: number, enemiesByEntity: Map<Entity, Entity[]>): void {
    for (const state of this.entities.values()) {
      this.abilitySelector.tickCooldowns(state.abilities, delta);

      if (time - state.lastThreatCheck < this.options.threatCheckInterval) continue;
      state.lastThreatCheck = time;

      const enemies = enemiesByEntity.get(state.entity) ?? [];
      this.updateTactics(state, enemies);
    }
  }

  private updateTactics(state: CombatAIEntityState, enemyIds: Entity[]): void {
    const entity = state.entity;
    const pos = this.ecs.getComponent<Position>(entity, 'position');
    const stats = this.ecs.getComponent<CombatStats>(entity, 'combatStats');
    const movement = this.ecs.getComponent<{ type: 'movement'; targetX: number | null; targetY: number | null; speed: number; vx: number; vy: number; activityState: string }>(entity, 'movement');

    if (!pos || !stats) return;

    // Build threat targets from enemy IDs
    const targets: ThreatTarget[] = [];
    for (const eid of enemyIds) {
      const ePos = this.ecs.getComponent<Position>(eid, 'position');
      const eStats = this.ecs.getComponent<CombatStats>(eid, 'combatStats');
      if (!ePos || !eStats) continue;

      const healthComp = this.ecs.getComponent<{ type: 'biology'; health: number }>(eid, 'biology') ??
                         this.ecs.getComponent<{ type: 'fauna'; health: number }>(eid, 'fauna');
      const healthRatio = healthComp ? healthComp.health / 100 : 1;
      targets.push({ entity: eid, position: ePos, stats: eStats, healthRatio });
    }

    // Retreat check
    const nearbyAllies = this.retreatLogic.getAlliesInRadius(entity, Array.from(this.entities.keys()), this.options.callForHelpRadius);
    const moraleComp = this.ecs.getComponent<{ type: 'morale'; value: number }>(entity, 'morale');
    const retreatCheck = this.retreatLogic.shouldRetreat(entity, stats, enemyIds.length, nearbyAllies.length, moraleComp?.value);

    const ecsComp = this.ecs.getComponent<CombatAIState>(entity, 'combatAIState');

    if (retreatCheck.shouldRetreat) {
      state.state = 'RETREATING';
      if (ecsComp) {
        this.ecs.addComponent(entity, { ...ecsComp, currentTarget: null, isRetreating: true, threatLevel: 100 });
      }
      const threatPositions = targets.map((t) => t.position);
      const dest = this.retreatLogic.calculateRetreatDestination(entity, threatPositions);
      if (dest && movement) {
        movement.targetX = dest.x;
        movement.targetY = dest.y;
        movement.activityState = 'FLEEING';
        this.ecs.addComponent(entity, movement);
      }
      return;
    }

    if (targets.length === 0) {
      state.state = 'IDLE';
      if (ecsComp) {
        this.ecs.addComponent(entity, { ...ecsComp, currentTarget: null, isRetreating: false, threatLevel: 0 });
      }
      return;
    }

    // Prioritize targets
    const prioritized = this.threatAssessment.prioritizeTargets(entity, targets);
    const chosen = prioritized[0];
    if (!chosen) return;

    // Ability selection
    const bestAbility = this.abilitySelector.selectAbility(state.abilities, stats, chosen.stats);
    const effectiveRange = bestAbility?.range ?? stats.range;

    // Determine tactic
    const dx = chosen.position.x - pos.x;
    const dy = chosen.position.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > effectiveRange + this.options.preferredRangeBuffer) {
      state.state = 'ENGAGING';
      if (ecsComp) {
        this.ecs.addComponent(entity, { ...ecsComp, currentTarget: chosen.entity, isRetreating: false, threatLevel: this.threatAssessment.computeThreatLevel(stats, chosen.stats) });
      }
      if (movement) {
        movement.targetX = chosen.position.x;
        movement.targetY = chosen.position.y;
        movement.activityState = 'MOVING_TO_RESOURCE';
        this.ecs.addComponent(entity, movement);
      }
    } else if (dist <= effectiveRange) {
      // In range: decide between flanking or staying
      const flankPos = this.positioning.calculateFlankPosition(chosen.entity, 'right', effectiveRange);
      if (flankPos && state.state !== 'FLANKING') {
        state.state = 'FLANKING';
        if (ecsComp) {
          this.ecs.addComponent(entity, { ...ecsComp, currentTarget: chosen.entity, isRetreating: false, threatLevel: this.threatAssessment.computeThreatLevel(stats, chosen.stats) });
        }
        if (movement) {
          movement.targetX = flankPos.x;
          movement.targetY = flankPos.y;
          movement.activityState = 'MOVING_TO_RESOURCE';
          this.ecs.addComponent(entity, movement);
        }
      } else {
        state.state = 'ENGAGING';
        if (ecsComp) {
          this.ecs.addComponent(entity, { ...ecsComp, currentTarget: chosen.entity, isRetreating: false, threatLevel: this.threatAssessment.computeThreatLevel(stats, chosen.stats) });
        }
      }
    } else {
      // Within buffer but not quite in range
      state.state = 'ENGAGING';
      if (ecsComp) {
        this.ecs.addComponent(entity, { ...ecsComp, currentTarget: chosen.entity, isRetreating: false, threatLevel: this.threatAssessment.computeThreatLevel(stats, chosen.stats) });
      }
      if (movement) {
        movement.targetX = chosen.position.x;
        movement.targetY = chosen.position.y;
        movement.activityState = 'MOVING_TO_RESOURCE';
        this.ecs.addComponent(entity, movement);
      }
    }
  }

  /** Manually assign a target to an entity */
  assignTarget(entity: Entity, target: Entity): void {
    const state = this.entities.get(entity);
    if (!state) return;
    const ecsComp = this.ecs.getComponent<CombatAIState>(entity, 'combatAIState');
    if (ecsComp) {
      this.ecs.addComponent(entity, { ...ecsComp, currentTarget: target });
    }
  }

  /** Returns current target of an entity */
  getTarget(entity: Entity): Entity | null | undefined {
    return this.ecs.getComponent<CombatAIState>(entity, 'combatAIState')?.currentTarget;
  }

  /** Returns all registered entity IDs */
  getRegisteredEntities(): Entity[] {
    return Array.from(this.entities.keys());
  }

  /** Delegates to ThreatAssessment for structured threat data */
  assessThreats(entity: Entity, candidates: ThreatTarget[]): ThreatAssessmentData[] {
    return this.threatAssessment.assessThreats(entity, candidates);
  }

  /** Returns a tactical position to engage the given target */
  positionToEngage(entity: Entity, target: Entity): { x: number; y: number } | undefined {
    const flank = this.positioning.calculateFlankPosition(target, 'right', 3);
    if (flank) return flank;

    const tPos = this.ecs.getComponent<Position>(target, 'position');
    return tPos ? { x: tPos.x, y: tPos.y } : undefined;
  }
}
