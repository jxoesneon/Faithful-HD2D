import { ECS } from '../ecs';
import {
  Entity,
  FaithSystemType,
  Missionary,
  Position,
  Faith,
  Society,
  Dogma,
} from '../../types';

/** Base conversion progress per tick under ideal conditions. */
export const BASE_CONVERSION_RATE = 0.05;
/** Distance at which a missionary can begin influencing a target. */
export const CONVERSION_RANGE = 1.5;
/** Speed tiles per tick when moving toward a target. */
export const MISSIONARY_SPEED = 2.0;
/** Number of recent conversions required to trigger a holy-war warning. */
export const HOLY_WAR_THRESHOLD = 3;
/** Window (in ticks) during which conversions count toward the holy-war threshold. */
export const HOLY_WAR_WINDOW = 300;
/** Schism risk added to the target society on a forced conversion. */
export const SCHISM_RISK_ON_CONVERSION = 20;

export interface ConversionEvent {
  entity: Entity;
  oldFaith: FaithSystemType;
  newFaith: FaithSystemType;
  tick: number;
  wasForced: boolean;
}

/**
 * MissionaryManager handles travelling conversion units, resistance
 * calculations, schism events from aggressive proselytising, and the
 * holy-war declaration threshold.
 */
export class MissionaryManager {
  /** Record of recent conversions for threshold tracking. */
  public conversionEvents: ConversionEvent[] = [];
  /** Running tick counter. */
  public tickCount = 0;
  /** Base conversion rate (clamped per-tick). */
  public baseConversionRate = BASE_CONVERSION_RATE;
  /** Holy-war threshold (customisable per game). */
  public holyWarThreshold = HOLY_WAR_THRESHOLD;

  /**
   * Move all missionaries toward their targets and, when in range, apply
   * conversion pressure.
   */
  tick(dt: number, ecs: ECS): void {
    this.tickCount += dt;
    this.purgeOldConversionEvents();

    const missionaries = ecs.getEntitiesWith(['missionary', 'position']);
    for (const ent of missionaries) {
      const mis = ecs.getComponent<Missionary>(ent, 'missionary');
      const pos = ecs.getComponent<Position>(ent, 'position');
      if (!mis || !pos) continue;

      if (mis.targetEntity) {
        this.moveTowardTarget(ent, pos, mis.targetEntity, dt, ecs);
        this.applyConversionPressure(ent, mis.targetEntity, dt, ecs);
      }
    }
  }

  /** Move a missionary entity one step closer to its assigned target. */
  private moveTowardTarget(
    _entity: Entity,
    pos: Position,
    target: Entity,
    dt: number,
    ecs: ECS
  ): void {
    const targetPos = ecs.getComponent<Position>(target, 'position');
    if (!targetPos) return;

    const dx = targetPos.x - pos.x;
    const dy = targetPos.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > CONVERSION_RANGE && dist > 0) {
      const step = Math.min(dist - CONVERSION_RANGE, MISSIONARY_SPEED * dt);
      pos.x += (dx / dist) * step;
      pos.y += (dy / dist) * step;
    }
  }

  /**
   * Apply conversion pressure to a target entity when the missionary is in
   * range. Progress accumulates each tick based on piety, resistance, and time.
   */
  applyConversionPressure(missionaryEntity: Entity, targetEntity: Entity, dt: number, ecs: ECS): void {
    const mis = ecs.getComponent<Missionary>(missionaryEntity, 'missionary');
    const mPos = ecs.getComponent<Position>(missionaryEntity, 'position');
    const tPos = ecs.getComponent<Position>(targetEntity, 'position');
    if (!mis || !mPos || !tPos) return;

    const dist = Math.sqrt((mPos.x - tPos.x) ** 2 + (mPos.y - tPos.y) ** 2);
    if (dist > CONVERSION_RANGE) return;

    const resistance = this.calculateResistance(targetEntity, ecs);
    const rate =
      this.baseConversionRate * (mis.piety / 100) * Math.max(0, 1 - resistance) * dt;

    mis.conversionProgress = Math.min(1, mis.conversionProgress + rate);

    if (mis.conversionProgress >= 1) {
      this.completeConversion(missionaryEntity, targetEntity, ecs);
    }
  }

  /**
   * Calculate how resistant a target society is to conversion.
   * Factors: native faith strength, population (cultural inertia), and
   * specific tenets such as `meaninglessness`.
   */
  calculateResistance(entity: Entity, ecs: ECS): number {
    const faith = ecs.getComponent<Faith>(entity, 'faith');
    const society = ecs.getComponent<Society>(entity, 'society');
    if (!faith || !society) return 1;

    const nativeStrength = faith.beliefMatrix[faith.dominantSystem] || 0;
    const maxBelief = Math.max(1, ...Object.values(faith.beliefMatrix));
    const nativeFactor = nativeStrength / maxBelief;

    const pop = society.population;
    const isolationFactor = Math.min(1, pop / 100);

    let dogmaResistance = 0;
    const dogma = ecs.getComponent<Dogma>(entity, 'dogma');
    if (dogma) {
      if (dogma.tenets.includes('meaninglessness')) dogmaResistance += 0.3;
      if (dogma.tenets.includes('ancestor_worship')) dogmaResistance += 0.1;
    }

    return Math.min(1, nativeFactor * 0.5 + isolationFactor * 0.3 + dogmaResistance);
  }

  /**
   * Finalise a conversion: mutate the target's `Faith` component, log the
   * event, and evaluate schism / holy-war consequences.
   */
  completeConversion(missionaryEntity: Entity, targetEntity: Entity, ecs: ECS): void {
    const mis = ecs.getComponent<Missionary>(missionaryEntity, 'missionary');
    const targetFaith = ecs.getComponent<Faith>(targetEntity, 'faith');
    if (!mis || !targetFaith) return;

    const oldFaith = targetFaith.dominantSystem;
    const wasForced = this.calculateResistance(targetEntity, ecs) > 0.5;

    // Mutate target faith
    targetFaith.dominantSystem = mis.originFaith;
    targetFaith.beliefMatrix[mis.originFaith] =
      (targetFaith.beliefMatrix[mis.originFaith] || 0) + 25;
    // Slightly erode old belief
    targetFaith.beliefMatrix[oldFaith] =
      Math.max(0, (targetFaith.beliefMatrix[oldFaith] || 0) - 15);

    // Log event
    this.conversionEvents.push({
      entity: targetEntity,
      oldFaith,
      newFaith: mis.originFaith,
      tick: this.tickCount,
      wasForced,
    });

    // Reset missionary for next assignment
    mis.conversionProgress = 0;
    mis.targetEntity = null;

    // Schism check on the target society
    if (wasForced) {
      this.applySchismRisk(targetEntity, SCHISM_RISK_ON_CONVERSION, ecs);
    }
  }

  /** Bump a society's schism risk (capped at 100). */
  applySchismRisk(entity: Entity, amount: number, ecs: ECS): void {
    const dogma = ecs.getComponent<Dogma>(entity, 'dogma');
    if (dogma) {
      dogma.schismRisk = Math.min(100, dogma.schismRisk + amount);
    }
  }

  /** Spawn (or attach) a Missionary component to an existing entity. */
  spawnMissionary(
    entity: Entity,
    ecs: ECS,
    originFaith: FaithSystemType,
    piety: number,
    targetEntity: Entity | null = null
  ): void {
    const existing = ecs.getComponent<Missionary>(entity, 'missionary');
    if (existing) {
      existing.originFaith = originFaith;
      existing.piety = piety;
      existing.targetEntity = targetEntity;
      existing.conversionProgress = 0;
    } else {
      ecs.addComponent<Missionary>(entity, {
        type: 'missionary',
        targetEntity,
        piety,
        conversionProgress: 0,
        originFaith,
      });
    }
  }

  /** Assign a new conversion target to an existing missionary. */
  assignTarget(missionaryEntity: Entity, targetEntity: Entity, ecs: ECS): boolean {
    const mis = ecs.getComponent<Missionary>(missionaryEntity, 'missionary');
    if (!mis) return false;
    mis.targetEntity = targetEntity;
    mis.conversionProgress = 0;
    return true;
  }

  /** Returns true if recent conversion volume exceeds the holy-war threshold. */
  checkHolyWarThreshold(): boolean {
    this.purgeOldConversionEvents();
    return this.conversionEvents.length >= this.holyWarThreshold;
  }

  /**
   * Identify societies whose dominant faith matches a recently-converted
   * entity's *old* faith. These are potential holy-war instigators.
   */
  getHolyWarCandidates(ecs: ECS): Array<{ entity: Entity; oldFaith: FaithSystemType; newFaith: FaithSystemType }> {
    const candidates: Array<{ entity: Entity; oldFaith: FaithSystemType; newFaith: FaithSystemType }> = [];
    for (const ev of this.conversionEvents) {
      const societies = ecs.getEntitiesWith(['faith', 'society']);
      for (const ent of societies) {
        if (ent === ev.entity) continue;
        const faith = ecs.getComponent<Faith>(ent, 'faith');
        if (faith && faith.dominantSystem === ev.oldFaith) {
          candidates.push({ entity: ent, oldFaith: ev.oldFaith, newFaith: ev.newFaith });
        }
      }
    }
    return candidates;
  }

  /** Remove conversion events older than `HOLY_WAR_WINDOW`. */
  private purgeOldConversionEvents(): void {
    const cutoff = this.tickCount - HOLY_WAR_WINDOW;
    this.conversionEvents = this.conversionEvents.filter((e) => e.tick >= cutoff);
  }

  /** Return all current missionary entities. */
  getMissionaries(ecs: ECS): Entity[] {
    return ecs.getEntitiesWith(['missionary']);
  }

  /** Return the conversion progress (0-1) for a missionary entity. */
  getConversionProgress(entity: Entity, ecs: ECS): number {
    const mis = ecs.getComponent<Missionary>(entity, 'missionary');
    return mis ? mis.conversionProgress : 0;
  }
}
