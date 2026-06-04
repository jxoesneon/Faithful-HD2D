import { ECS } from '../ecs';
import {
  FaithSystemType,
  Position,
  Structure,
  ShrineStatus,
  Society,
  Faith,
  Biology,
  Fauna,
  Flora,
  Entity,
  ShrineInfluenceSnapshot,
} from '../../types';

/** Default radius for a shrine when no {@link ShrineStatus} is present. */
export const DEFAULT_SHRINE_RADIUS = 6;
/** Default strength for a shrine when no {@link ShrineStatus} is present. */
export const DEFAULT_SHRINE_STRENGTH = 1.0;
/** Multiplier applied to positive effects when multiple shrines overlap. */
export const SACRED_GROUND_MULTIPLIER = 0.5;

/**
 * ShrineManager computes circular area-of-effect influence around ALTAR
 * structures and applies gameplay effects each tick.
 *
 * Overlapping non-desecrated shrines create "sacred ground" that amplifies
 * benefits. If *any* desecrated shrine overlaps a tile the effects are
 * inverted into "cursed ground".
 */
export class ShrineManager {
  /** Per-tick devotion generated at the centre of a strength-1 shrine. */
  public devotionBoostRate = 2.0;
  /** Per-tick healing (HP or growth) delivered at the centre. */
  public healingRate = 1.5;
  /** Per-tick happiness increase at the centre. */
  public happinessRate = 0.8;
  /** Per-tick debuff magnitude for enemies of the shrine's faith. */
  public enemyDebuffRate = 1.0;

  /**
   * Returns the aggregate influence at world coordinate `(x, y)`.
   * If `forFaith` is omitted the caller is assumed neutral and enemy-debuff
   * is not applied.
   */
  getInfluenceAt(x: number, y: number, forFaith?: FaithSystemType, ecs?: ECS): ShrineInfluenceSnapshot {
    const shrines = ecs ? this.getShrines(ecs) : [];
    let totalStrength = 0;
    let sacredCount = 0;
    let cursedCount = 0;
    let dominantFaith: FaithSystemType = 'SECULAR';

    for (const s of shrines) {
      const dx = x - s.x;
      const dy = y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > s.radius) continue;
      const falloff = 1 - dist / s.radius;
      const strength = s.strength * falloff;
      totalStrength += strength;
      if (s.isDesecrated) {
        cursedCount++;
      } else {
        sacredCount++;
        dominantFaith = s.faithSystem;
      }
    }

    const isSacredGround = sacredCount >= 2 && cursedCount === 0;
    const isCursedGround = cursedCount > 0;
    const overlapMult = isSacredGround ? 1 + (sacredCount - 1) * SACRED_GROUND_MULTIPLIER : 1.0;
    const curseMult = isCursedGround ? -1 : 1;

    const baseMult = totalStrength * overlapMult * curseMult;

    const devotionBoost = baseMult * this.devotionBoostRate;
    const healing = baseMult * this.healingRate;
    const happinessDelta = baseMult * this.happinessRate;
    const enemyDebuff =
      forFaith && forFaith !== dominantFaith ? baseMult * this.enemyDebuffRate : 0;

    return {
      x,
      y,
      totalStrength,
      isSacredGround,
      isCursedGround,
      devotionBoost,
      healing,
      happinessDelta,
      enemyDebuff,
    };
  }

  /** Gather every ALTAR entity (with or without an explicit {@link ShrineStatus}). */
  getShrines(ecs: ECS): Array<{
    entity: Entity;
    x: number;
    y: number;
    radius: number;
    strength: number;
    isDesecrated: boolean;
    faithSystem: FaithSystemType;
  }> {
    const out: Array<{ entity: Entity; x: number; y: number; radius: number; strength: number; isDesecrated: boolean; faithSystem: FaithSystemType }> = [];
    const altars = ecs.getEntitiesWith(['structure', 'position']);
    for (const ent of altars) {
      const struct = ecs.getComponent<Structure>(ent, 'structure');
      const pos = ecs.getComponent<Position>(ent, 'position');
      if (!struct || !pos || struct.category !== 'ALTAR') continue;

      const status = ecs.getComponent<ShrineStatus>(ent, 'shrineStatus');
      if (status) {
        out.push({
          entity: ent,
          x: pos.x,
          y: pos.y,
          radius: status.radius,
          strength: status.strength,
          isDesecrated: status.isDesecrated,
          faithSystem: status.faithSystem,
        });
      } else {
        // Default shrine behaviour for ALTARs without an explicit status
        out.push({
          entity: ent,
          x: pos.x,
          y: pos.y,
          radius: DEFAULT_SHRINE_RADIUS,
          strength: DEFAULT_SHRINE_STRENGTH,
          isDesecrated: false,
          faithSystem: 'SECULAR',
        });
      }
    }
    return out;
  }

  /** Mark a shrine as desecrated, inverting its effects. */
  desecrateShrine(entity: Entity, ecs: ECS): void {
    const status = ecs.getComponent<ShrineStatus>(entity, 'shrineStatus');
    if (status) {
      status.isDesecrated = true;
    } else {
      // Attach a new desecrated status component
      const struct = ecs.getComponent<Structure>(entity, 'structure');
      const fallbackFaith: FaithSystemType = 'SECULAR';
      ecs.addComponent<ShrineStatus>(entity, {
        type: 'shrineStatus',
        isDesecrated: true,
        radius: DEFAULT_SHRINE_RADIUS,
        strength: DEFAULT_SHRINE_STRENGTH,
        faithSystem: fallbackFaith,
      });
    }
  }

  /** Restore a shrine to its consecrated (positive-effect) state. */
  consecrateShrine(entity: Entity, ecs: ECS): void {
    const status = ecs.getComponent<ShrineStatus>(entity, 'shrineStatus');
    if (status) {
      status.isDesecrated = false;
    }
  }

  /**
   * Apply shrine effects to all entities that currently sit inside at least
   * one shrine radius. This is called once per simulation tick.
   */
  tick(dt: number, ecs: ECS): void {
    const shrines = this.getShrines(ecs);
    if (shrines.length === 0) return;

    const entities = ecs.getEntitiesWith(['position']);
    for (const ent of entities) {
      const pos = ecs.getComponent<Position>(ent, 'position');
      if (!pos) continue;

      let totalDevotion = 0;
      let totalHealing = 0;
      let totalHappiness = 0;
      let totalDebuff = 0;

      for (const s of shrines) {
        const dx = pos.x - s.x;
        const dy = pos.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > s.radius) continue;

        const falloff = 1 - dist / s.radius;
        const strength = s.strength * falloff * dt;
        const curseMult = s.isDesecrated ? -1 : 1;

        totalDevotion += strength * this.devotionBoostRate * curseMult;
        totalHealing += strength * this.healingRate * curseMult;

        const entityFaith = ecs.getComponent<Faith>(ent, 'faith');
        const isEnemy = entityFaith && entityFaith.dominantSystem !== s.faithSystem;
        if (isEnemy && !s.isDesecrated) {
          totalDebuff += strength * this.enemyDebuffRate;
        } else {
          totalHappiness += strength * this.happinessRate * curseMult;
        }
      }

      // Apply sacred-ground amplification when multiple non-desecrated shrines overlap
      const overlapping = shrines.filter(
        (s) =>
          !s.isDesecrated &&
          Math.sqrt((pos.x - s.x) ** 2 + (pos.y - s.y) ** 2) <= s.radius
      );
      if (overlapping.length >= 2) {
        const mult = 1 + (overlapping.length - 1) * SACRED_GROUND_MULTIPLIER;
        totalDevotion *= mult;
        totalHealing *= mult;
        totalHappiness *= mult;
      }

      // Apply cursed-ground inversion when any desecrated shrine overlaps
      const cursed = shrines.filter(
        (s) =>
          s.isDesecrated &&
          Math.sqrt((pos.x - s.x) ** 2 + (pos.y - s.y) ** 2) <= s.radius
      );
      if (cursed.length > 0) {
        totalDevotion = -Math.abs(totalDevotion);
        totalHealing = -Math.abs(totalHealing);
        totalHappiness = -Math.abs(totalHappiness);
        totalDebuff = Math.abs(totalDebuff);
      }

      // Write effects back to components
      const faith = ecs.getComponent<Faith>(ent, 'faith');
      if (faith && totalDevotion !== 0) {
        faith.devotion = Math.max(0, faith.devotion + totalDevotion);
      }

      const society = ecs.getComponent<Society>(ent, 'society');
      if (society) {
        society.happiness = Math.max(0, Math.min(100, society.happiness + totalHappiness - totalDebuff));
      }

      // Healing can target biology, fauna, flora, or structure durability
      const biology = ecs.getComponent<Biology>(ent, 'biology');
      if (biology && totalHealing !== 0) {
        biology.health = Math.max(0, Math.min(100, biology.health + totalHealing));
      }
      const fauna = ecs.getComponent<Fauna>(ent, 'fauna');
      if (fauna && totalHealing !== 0) {
        fauna.health = Math.max(0, Math.min(100, fauna.health + totalHealing));
      }
      const flora = ecs.getComponent<Flora>(ent, 'flora');
      if (flora && totalHealing !== 0) {
        flora.growth = Math.max(0, Math.min(100, flora.growth + totalHealing));
      }
      const struct = ecs.getComponent<Structure>(ent, 'structure');
      if (struct && totalHealing !== 0) {
        struct.durability = Math.max(0, Math.min(100, struct.durability + totalHealing));
      }
    }
  }

  /** Upgrade an ALTAR with an explicit {@link ShrineStatus} component. */
  installShrineStatus(
    entity: Entity,
    ecs: ECS,
    faithSystem: FaithSystemType,
    radius = DEFAULT_SHRINE_RADIUS,
    strength = DEFAULT_SHRINE_STRENGTH
  ): void {
    ecs.addComponent<ShrineStatus>(entity, {
      type: 'shrineStatus',
      isDesecrated: false,
      radius,
      strength,
      faithSystem,
    });
  }
}
