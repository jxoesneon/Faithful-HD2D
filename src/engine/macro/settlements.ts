import type { ECS } from '../ecs';
import type { Entity, Position, Structure, Society, Settlement } from '../../types';

const SETTLEMENT_NAMES = [
  'Aethelgard', 'Brighthollow', 'Cinderfall', 'Dawnwatch', 'Emberpeak',
  'Frosthaven', 'Goldmere', 'Hollowdeep', 'Ironhold', 'Jadewater',
  'Kingsrest', 'Lightford', 'Mistwood', 'Northpoint', 'Oakenshield',
];

const NAME_PREFIXES = [
  'Ash','Brim','Cinder','Dusk','Ebon','Frost','Glen','Hollow','Iron','Jade',
  'Keld','Lore','Mist','Neth','Oak','Pine','Quar','Rime','Silk','Thorn',
];
const NAME_SUFFIXES = [
  'ford','haven','wick','mere','hollow','crest','holm','reach','watch','port',
  'stead','bury','minster','wich','borough','ton','dale','ridge','wood','by',
];

export const LEVEL_THRESHOLDS = [
  { level: 'Hamlet' as const, min: 1, max: 3 },
  { level: 'Village' as const, min: 4, max: 8 },
  { level: 'Town' as const, min: 9, max: 20 },
  { level: 'City' as const, min: 21, max: Infinity },
];

export const CLUSTER_RADIUS = 3;
export const ROAD_MAX_DISTANCE = 8;

/**
 * SettlementManager clusters adjacent structures, upgrades settlement tiers,
 * generates procedural names, tracks reputation, and auto-connects roads.
 */
export class SettlementManager {
  private ecs: ECS;
  private nameIndex = 0;

  constructor(ecs: ECS) {
    this.ecs = ecs;
  }

  /** Detect clusters of nearby structures and form settlements. */
  update(): void {
    this.computeClusters();
  }

  /** Group all structures into faction-colored clusters based on proximity. */
  computeClusters(): Entity[] {
    const settlementIds: Entity[] = [];
    const societies = this.ecs.getEntitiesWith(['society', 'position']);

    for (const societyId of societies) {
      const society = this.ecs.getComponent<Society>(societyId, 'society');
      if (!society) continue;

      const structures = this.findStructuresForSociety(societyId, society.faction);
      const existing = this.findSettlementForSociety(societyId);

      if (structures.length >= 1) {
        if (existing) {
          this.updateSettlement(existing, structures);
        } else {
          this.createSettlement(societyId, structures);
        }
        settlementIds.push(societyId);
      }
    }

    this.updateConnections();
    return settlementIds;
  }

  /** Determine settlement level from structure count. */
  getSettlementLevel(count: number): Settlement['level'] {
    for (const t of LEVEL_THRESHOLDS) {
      if (count >= t.min && count <= t.max) return t.level;
    }
    return 'Hamlet';
  }

  /** Create a new settlement around a society's structures. */
  createSettlement(societyId: Entity, structures: Entity[]): Settlement {
    const level = this.getSettlementLevel(structures.length);

    const settlement: Settlement = {
      type: 'settlement',
      level,
      name: this.generateName(),
      structureIds: structures,
      connectedSettlements: [],
      reputation: 50,
    };

    this.ecs.addComponent(societyId, settlement);
    return settlement;
  }

  /** Re-evaluate all settlement levels based on current structure counts. */
  upgradeSettlements(): void {
    const entities = this.ecs.getEntitiesWith(['settlement']);
    for (const id of entities) {
      const sett = this.ecs.getComponent<Settlement>(id, 'settlement');
      if (!sett) continue;
      const newLevel = this.getSettlementLevel(sett.structureIds.length);
      if (newLevel !== sett.level) {
        sett.level = newLevel;
      }
    }
  }

  /** Connect nearby settlements of the same faction with road links. */
  generateRoads(maxDistance = ROAD_MAX_DISTANCE): void {
    const settlements = this.getAllSettlements();
    for (const a of settlements) {
      const posA = this.ecs.getComponent<Position>(a.societyId, 'position');
      const socA = this.ecs.getComponent<Society>(a.societyId, 'society');
      if (!posA || !socA) continue;

      a.settlement.connectedSettlements = [];
      for (const b of settlements) {
        if (a.societyId === b.societyId) continue;
        const posB = this.ecs.getComponent<Position>(b.societyId, 'position');
        const socB = this.ecs.getComponent<Society>(b.societyId, 'society');
        if (!posB || !socB) continue;
        if (socA.faction !== socB.faction) continue;

        const dist = Math.hypot(posA.x - posB.x, posA.y - posB.y);
        if (dist <= maxDistance) {
          a.settlement.connectedSettlements.push(b.societyId);
        }
      }
    }
  }

  /** Generate a procedural settlement name. */
  generateName(): string {
    // Alternate between list names and generated names
    if (Math.random() < 0.3) {
      const name = SETTLEMENT_NAMES[this.nameIndex % SETTLEMENT_NAMES.length];
      this.nameIndex++;
      return name;
    }
    const pre = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
    const suf = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
    return pre + suf;
  }

  /** Adjust reputation, clamped to [-100, 100]. */
  updateReputation(settlementId: Entity, delta: number): void {
    const sett = this.ecs.getComponent<Settlement>(settlementId, 'settlement');
    if (!sett) return;
    sett.reputation = Math.max(-100, Math.min(100, sett.reputation + delta));
  }

  /** Get settlement by society ID. */
  getSettlement(societyId: Entity): Settlement | undefined {
    return this.ecs.getComponent<Settlement>(societyId, 'settlement');
  }

  /** Get all settlements. */
  getAllSettlements(): Array<{ societyId: Entity; settlement: Settlement }> {
    const result: Array<{ societyId: Entity; settlement: Settlement }> = [];
    const entities = this.ecs.getEntitiesWith(['settlement']);
    for (const id of entities) {
      const settlement = this.ecs.getComponent<Settlement>(id, 'settlement');
      if (settlement) result.push({ societyId: id, settlement });
    }
    return result;
  }

  /** Get settlement level name based on structure count. */
  private calculateLevel(count: number): Settlement['level'] {
    return this.getSettlementLevel(count);
  }

  /** Find structures owned by or near a society (within 15 tiles). */
  private findStructuresForSociety(societyId: Entity, faction: string): Entity[] {
    const societyPos = this.ecs.getComponent<Position>(societyId, 'position');
    if (!societyPos) return [];

    const result: Entity[] = [];
    const structures = this.ecs.getEntitiesWith(['structure', 'position']);
    for (const structId of structures) {
      const struct = this.ecs.getComponent<Structure>(structId, 'structure');
      const pos = this.ecs.getComponent<Position>(structId, 'position');
      if (!struct || !pos) continue;

      const dist = Math.hypot(pos.x - societyPos.x, pos.y - societyPos.y);
      if (dist <= 15) {
        result.push(structId);
      }
    }
    return result;
  }

  private findSettlementForSociety(societyId: Entity): Settlement | undefined {
    return this.ecs.getComponent<Settlement>(societyId, 'settlement');
  }

  private updateSettlement(settlement: Settlement, structures: Entity[]): void {
    settlement.structureIds = structures;
    const newLevel = this.calculateLevel(structures.length);
    if (newLevel !== settlement.level) {
      settlement.level = newLevel;
    }
  }

  /** Update road connections between nearby settlements (legacy max 30). */
  private updateConnections(): void {
    const settlements = this.getAllSettlements();
    for (const a of settlements) {
      const posA = this.ecs.getComponent<Position>(a.societyId, 'position');
      if (!posA) continue;

      a.settlement.connectedSettlements = [];
      for (const b of settlements) {
        if (a.societyId === b.societyId) continue;
        const posB = this.ecs.getComponent<Position>(b.societyId, 'position');
        if (!posB) continue;

        const dist = Math.hypot(posA.x - posB.x, posA.y - posB.y);
        if (dist <= 30) {
          a.settlement.connectedSettlements.push(b.societyId);
        }
      }
    }
  }
}
