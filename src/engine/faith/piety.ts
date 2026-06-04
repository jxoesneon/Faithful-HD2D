import { ECS } from '../ecs';
import {
  Entity,
  Piety,
  Faith,
  Society,
  Prayer,
  Position,
} from '../../types';

export type PrayerType = 'petition' | 'thanksgiving' | 'penance' | 'intercession';

/** Internal tracking record for an active prayer. */
export interface PrayerRecord {
  id: string;
  entity: Entity;
  prayerType: PrayerType;
  createdAt: number; // tick count
  duration: number;
  targetValue: string;
  answered: boolean;
}

/** Base answer probability modifiers per prayer type. */
export const PRAYER_TYPE_BONUS: Record<PrayerType, number> = {
  petition: 0.10,
  thanksgiving: 0.35,
  penance: 0.15,
  intercession: 0.05,
};

/** Default cooldown (in seconds/ticks) before an entity can pray again. */
export const DEFAULT_PRAYER_COOLDOWN = 10;
/** Cooldown between mass-prayer events. */
export const MASS_PRAYER_COOLDOWN = 300;
/** Piety lost when a prayer expires unanswered. */
export const CRISIS_OF_FAITH_PENALTY = 8;
/** Piety gained when a prayer is answered. */
export const ANSWERED_PRAYER_BOOST = 5;

/**
 * PietyManager governs individual spiritual scores, prayer cooldowns,
 * answering mechanics, and mass-prayer rituals.
 *
 * Each entity may carry a {@link Piety} component (0-100 score). The manager
 * creates and answers {@link Prayer} components while tracking metadata in
 * lightweight `PrayerRecord` objects.
 */
export class PietyManager {
  /** Running tick counter (increments every `tick()` call). */
  public tickCount = 0;
  /** Accumulated divine devotion used to weight answer probability. */
  public globalDevotionPool = 0;
  /** Active prayers being tracked this tick. */
  public activePrayers: PrayerRecord[] = [];
  /** Unique ID counter for prayer records. */
  private prayerIdCounter = 0;
  /** Tick index of the last mass-prayer event. */
  public lastMassPrayerTick = -Infinity;
  /** Cooldown ticks required between mass prayers. */
  public massPrayerCooldown = MASS_PRAYER_COOLDOWN;

  /**
   * Advance cooldowns, expire unanswered prayers (crisis of faith), and
   * recompute the global devotion pool from all `Faith` components.
   */
  tick(dt: number, ecs: ECS): void {
    this.tickCount += Math.max(0, dt);

    // Recompute devotion pool
    let devotionSum = 0;
    const faithful = ecs.getEntitiesWith(['faith']);
    for (const ent of faithful) {
      const faith = ecs.getComponent<Faith>(ent, 'faith');
      if (faith) devotionSum += faith.devotion;
    }
    this.globalDevotionPool = devotionSum;

    // Advance per-entity cooldowns
    const pious = ecs.getEntitiesWith(['piety']);
    for (const ent of pious) {
      const piety = ecs.getComponent<Piety>(ent, 'piety');
      if (piety) {
        piety.prayerCooldown = Math.max(0, piety.prayerCooldown - dt);
      }
    }

    // Process active prayers
    for (let i = this.activePrayers.length - 1; i >= 0; i--) {
      const rec = this.activePrayers[i];
      const prayerComp = ecs.getComponent<Prayer>(rec.entity, 'prayer');
      if (!prayerComp) {
        // Prayer component missing — clean up the record
        this.activePrayers.splice(i, 1);
        continue;
      }

      prayerComp.durationLeft -= dt;

      if (prayerComp.durationLeft <= 0 && !rec.answered) {
        this.handleUnansweredPrayer(rec, ecs);
        this.activePrayers.splice(i, 1);
      } else if (prayerComp.isFulfilled && !rec.answered) {
        // If something external fulfilled the quest, auto-answer it
        this.answerPrayerByRecord(rec, ecs);
        this.activePrayers.splice(i, 1);
      }
    }
  }

  /**
   * Attach a {@link Piety} component to an entity if it does not already
   * have one.
   */
  ensurePiety(entity: Entity, ecs: ECS, initialScore = 50): Piety {
    let piety = ecs.getComponent<Piety>(entity, 'piety');
    if (!piety) {
      piety = {
        type: 'piety',
        score: Math.max(0, Math.min(100, initialScore)),
        lastPrayerTime: 0,
        prayerCooldown: 0,
      };
      ecs.addComponent(entity, piety);
    }
    return piety;
  }

  /** Read the piety score for an entity (0 if none). */
  getPiety(entity: Entity, ecs: ECS): number {
    const piety = ecs.getComponent<Piety>(entity, 'piety');
    return piety ? piety.score : 0;
  }

  /** Write the piety score for an entity, clamped to [0,100]. */
  setPiety(entity: Entity, ecs: ECS, value: number): void {
    const piety = this.ensurePiety(entity, ecs);
    piety.score = Math.max(0, Math.min(100, value));
  }

  /**
   * Start a new prayer. Returns `true` if the prayer was created, or `false`
   * if the entity is still on cooldown.
   */
  startPrayer(
    entity: Entity,
    type: PrayerType,
    targetValue: string,
    duration: number,
    ecs: ECS
  ): boolean {
    const piety = this.ensurePiety(entity, ecs);
    if (piety.prayerCooldown > 0) return false;

    const reward = this.calculateReward(type, piety.score);

    const prayerComp: Prayer = {
      type: 'prayer',
      questType: type,
      targetValue,
      durationLeft: duration,
      rewardDevotion: reward,
      isFulfilled: false,
    };
    ecs.addComponent(entity, prayerComp);

    const rec: PrayerRecord = {
      id: `prayer-${this.prayerIdCounter++}`,
      entity,
      prayerType: type,
      createdAt: this.tickCount,
      duration,
      targetValue,
      answered: false,
    };
    this.activePrayers.push(rec);

    piety.lastPrayerTime = this.tickCount;
    piety.prayerCooldown = DEFAULT_PRAYER_COOLDOWN;

    return true;
  }

  /** Probability that a prayer with the given piety is answered this tick. */
  calculateAnswerProbability(pietyScore: number): number {
    const devotionFactor = Math.min(1, this.globalDevotionPool / 500);
    const pietyFactor = pietyScore / 100;
    const raw = pietyFactor * 0.4 + devotionFactor * 0.3;
    return Math.max(0.05, Math.min(0.95, raw));
  }

  /**
   * Attempt to answer a tracked prayer by its internal record ID.
   * Returns `true` if the prayer was successfully answered.
   */
  answerPrayer(prayerId: string, ecs: ECS): boolean {
    const rec = this.activePrayers.find((p) => p.id === prayerId);
    if (!rec || rec.answered) return false;
    return this.answerPrayerByRecord(rec, ecs);
  }

  private answerPrayerByRecord(rec: PrayerRecord, ecs: ECS): boolean {
    const piety = ecs.getComponent<Piety>(rec.entity, 'piety');
    const prayerComp = ecs.getComponent<Prayer>(rec.entity, 'prayer');
    if (!prayerComp) return false;

    const prob =
      this.calculateAnswerProbability(piety ? piety.score : 0) +
      PRAYER_TYPE_BONUS[rec.prayerType];
    const roll = Math.random();
    if (roll > prob) return false;

    // Prayer answered!
    rec.answered = true;
    prayerComp.isFulfilled = true;

    if (piety) {
      piety.score = Math.min(100, piety.score + ANSWERED_PRAYER_BOOST);
    }

    const faith = ecs.getComponent<Faith>(rec.entity, 'faith');
    if (faith) {
      faith.devotion += prayerComp.rewardDevotion;
    }

    return true;
  }

  private handleUnansweredPrayer(rec: PrayerRecord, ecs: ECS): void {
    const piety = ecs.getComponent<Piety>(rec.entity, 'piety');
    if (piety) {
      piety.score = Math.max(0, piety.score - CRISIS_OF_FAITH_PENALTY);
    }
  }

  /** Convenience method to answer every active prayer in one sweep. */
  answerAllPossiblePrayers(ecs: ECS): number {
    let answered = 0;
    for (const rec of this.activePrayers) {
      if (!rec.answered && this.answerPrayerByRecord(rec, ecs)) {
        answered++;
      }
    }
    // Remove answered records
    this.activePrayers = this.activePrayers.filter((r) => !r.answered);
    return answered;
  }

  /** Retrieve all active (unanswered) prayer records for a given entity. */
  getActivePrayersForEntity(entity: Entity): PrayerRecord[] {
    return this.activePrayers.filter((p) => p.entity === entity && !p.answered);
  }

  /**
   * Trigger a tribe-wide mass-prayer ritual. Every entity carrying a
   * {@link Society} component receives a piety boost and has its cooldown
   * reset. Returns the number of entities affected.
   */
  triggerMassPrayer(ecs: ECS): number {
    if (this.tickCount - this.lastMassPrayerTick < this.massPrayerCooldown) {
      return 0;
    }
    this.lastMassPrayerTick = this.tickCount;

    let affected = 0;
    const societies = ecs.getEntitiesWith(['society']);
    for (const ent of societies) {
      const piety = this.ensurePiety(ent, ecs);
      piety.score = Math.min(100, piety.score + 15);
      piety.prayerCooldown = 0;
      affected++;
    }
    return affected;
  }

  /** Reset every entity's prayer cooldown (divine intervention). */
  resetAllCooldowns(ecs: ECS): void {
    const pious = ecs.getEntitiesWith(['piety']);
    for (const ent of pious) {
      const piety = ecs.getComponent<Piety>(ent, 'piety');
      if (piety) piety.prayerCooldown = 0;
    }
  }

  private calculateReward(type: PrayerType, pietyScore: number): number {
    const base = 5;
    const mult = type === 'thanksgiving' ? 1.5 : type === 'intercession' ? 2.0 : 1.0;
    return base * mult + pietyScore * 0.1;
  }
}
