import type { ECS } from '../ecs';
import type { Entity, Position, Society, Border, Allegiance, Faith } from '../../types';

const GRID_SIZE = 64;

/**
 * BorderManager computes Voronoi-like territory claims, manages allegiances,
 * and calculates border tension from faith conflicts and political relations.
 */
export class BorderManager {
  private tileOwnerMap: Map<string, Entity> = new Map();

  constructor(private ecs: ECS) {}

  /** Recalculate borders for all societies (Voronoi-like on 64x64). */
  computeBorders(): void {
    // Remove old border components from society entities
    const societies = this.ecs.getEntitiesWith(['society', 'position']);
    for (const s of societies) {
      const old = this.ecs.getComponent<Border>(s, 'border');
      if (old) {
        // ECS doesn't support component removal; overwrite with empty border
        this.ecs.addComponent(s, { type: 'border', societyId: s, territoryTiles: [], tension: 0 } as Border);
      }
    }
    this.tileOwnerMap.clear();

    if (societies.length === 0) return;

    for (const societyId of societies) {
      const pos = this.ecs.getComponent<Position>(societyId, 'position');
      if (!pos) continue;
      const territory = this.calculateTerritory(societyId, pos);
      const border: Border = {
        type: 'border',
        societyId,
        territoryTiles: territory,
        tension: 0,
      };
      this.ecs.addComponent(societyId, border);

      for (const t of territory) {
        this.tileOwnerMap.set(`${t.x},${t.y}`, societyId);
      }
    }
  }

  /** Alias for computeBorders matching legacy update() behavior. */
  update(): void {
    this.computeBorders();
    this.updateBorderTension();
  }

  /** Return the society that owns a specific tile, or null. */
  getTileOwner(x: number, y: number): Entity | null {
    return this.tileOwnerMap.get(`${x},${y}`) ?? null;
  }

  /** Initialize allegiance for a society if missing. */
  initAllegiance(societyId: Entity): void {
    const existing = this.ecs.getComponent<Allegiance>(societyId, 'allegiance');
    if (existing) return;
    const allegiance: Allegiance = {
      type: 'allegiance',
      overlordId: null,
      vassals: [],
      allies: [],
      enemies: [],
    };
    this.ecs.addComponent(societyId, allegiance);
  }

  /** Set allegiance relationship between two societies. */
  setAllegiance(
    subject: Entity,
    overlord: Entity | null,
    relation: 'independent' | 'vassal' | 'tributary' | 'ally' | 'enemy'
  ): void {
    this.initAllegiance(subject);
    if (overlord) this.initAllegiance(overlord);

    const allegiance = this.ecs.getComponent<Allegiance>(subject, 'allegiance')!;
    if (overlord) {
      const targetAllegiance = this.ecs.getComponent<Allegiance>(overlord, 'allegiance')!;
      // Clear existing relationships between the two
      this.removeFromAllRelationships(allegiance, overlord);
      this.removeFromAllRelationships(targetAllegiance, subject);

      switch (relation) {
        case 'ally':
          allegiance.allies.push(overlord);
          targetAllegiance.allies.push(subject);
          break;
        case 'vassal':
        case 'tributary':
          allegiance.overlordId = overlord;
          targetAllegiance.vassals.push(subject);
          break;
        case 'enemy':
          allegiance.enemies.push(overlord);
          targetAllegiance.enemies.push(subject);
          break;
        case 'independent':
          break;
      }

      this.ecs.addComponent(overlord, targetAllegiance);
    } else {
      // independent: clear all relationships
      const allSocieties = this.ecs.getEntitiesWith(['society']);
      for (const otherId of allSocieties) {
        if (otherId === subject) continue;
        const otherAlleg = this.ecs.getComponent<Allegiance>(otherId, 'allegiance');
        if (otherAlleg) {
          this.removeFromAllRelationships(otherAlleg, subject);
          this.ecs.addComponent(otherId, otherAlleg);
        }
      }
      allegiance.overlordId = null;
    }

    this.ecs.addComponent(subject, allegiance);
  }

  /** Calculate tension between two societies (0-100). */
  calculateTension(societyA: Entity, societyB: Entity): number {
    return this.getTension(societyA, societyB);
  }

  /** Get border tension between two societies. */
  getTension(societyA: Entity, societyB: Entity): number {
    if (societyA === societyB) return 0;

    const borderA = this.ecs.getComponent<Border>(societyA, 'border');
    const borderB = this.ecs.getComponent<Border>(societyB, 'border');
    const allegianceA = this.ecs.getComponent<Allegiance>(societyA, 'allegiance');
    const allegianceB = this.ecs.getComponent<Allegiance>(societyB, 'allegiance');
    if (!borderA || !borderB) return 0;

    let tension = 0;

    // Check for overlapping territory claims
    const sharedTiles = this.countSharedTiles(borderA.territoryTiles, borderB.territoryTiles);
    tension += sharedTiles * 2;

    // Faith conflict increases tension
    const faithA = this.ecs.getComponent<Faith>(societyA, 'faith');
    const faithB = this.ecs.getComponent<Faith>(societyB, 'faith');
    if (faithA && faithB && faithA.dominantSystem !== faithB.dominantSystem) {
      tension += 25;
    }

    // Political relation modifiers
    const isAllied =
      (allegianceA?.allies.includes(societyB) || allegianceB?.allies.includes(societyA)) ?? false;
    const isEnemy =
      (allegianceA?.enemies.includes(societyB) || allegianceB?.enemies.includes(societyA)) ?? false;
    const isVassalRelation =
      (allegianceA?.overlordId === societyB && allegianceB?.vassals.includes(societyA)) ||
      (allegianceB?.overlordId === societyA && allegianceA?.vassals.includes(societyB));

    if (isAllied) tension = Math.max(0, tension - 20);
    if (isEnemy) tension += 20;
    if (isVassalRelation) tension = Math.max(0, tension - 15);

    return Math.min(100, tension);
  }

  /** Get all border conflicts (pairs with tension > 0). */
  getConflicts(): Array<{ societyA: Entity; societyB: Entity; tension: number }> {
    const result: Array<{ societyA: Entity; societyB: Entity; tension: number }> = [];
    const societies = this.ecs.getEntitiesWith(['border']);
    const checked = new Set<string>();

    for (const a of societies) {
      for (const b of societies) {
        if (a >= b) continue;
        const key = `${a}|${b}`;
        if (checked.has(key)) continue;
        checked.add(key);

        const tension = this.getTension(a, b);
        if (tension > 0) {
          result.push({ societyA: a, societyB: b, tension });
        }
      }
    }

    return result;
  }

  /** Recalculate tension on every border component. */
  updateBorderTension(): void {
    const societies = this.ecs.getEntitiesWith(['border']);
    for (const societyId of societies) {
      const border = this.ecs.getComponent<Border>(societyId, 'border');
      if (!border) continue;

      let maxTension = 0;
      for (const otherId of societies) {
        if (otherId === societyId) continue;
        maxTension = Math.max(maxTension, this.getTension(societyId, otherId));
      }

      border.tension = maxTension;
    }
  }

  private calculateTerritory(societyId: Entity, center: Position): Array<{ x: number; y: number }> {
    const territory: Array<{ x: number; y: number }> = [];
    const radius = 8;

    for (let y = Math.max(0, Math.floor(center.y) - radius); y <= Math.min(GRID_SIZE - 1, Math.floor(center.y) + radius); y++) {
      for (let x = Math.max(0, Math.floor(center.x) - radius); x <= Math.min(GRID_SIZE - 1, Math.floor(center.x) + radius); x++) {
        const dx = x - center.x;
        const dy = y - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          if (this.isClosestSociety(societyId, x, y)) {
            territory.push({ x, y });
          }
        }
      }
    }

    return territory;
  }

  private isClosestSociety(societyId: Entity, x: number, y: number): boolean {
    const myPos = this.ecs.getComponent<Position>(societyId, 'position');
    if (!myPos) return false;

    const myDist = Math.sqrt((x - myPos.x) ** 2 + (y - myPos.y) ** 2);

    const all = this.ecs.getEntitiesWith(['society', 'position']);
    for (const otherId of all) {
      if (otherId === societyId) continue;
      const otherPos = this.ecs.getComponent<Position>(otherId, 'position');
      if (!otherPos) continue;
      const otherDist = Math.sqrt((x - otherPos.x) ** 2 + (y - otherPos.y) ** 2);
      if (otherDist < myDist) return false;
    }

    return true;
  }

  private countSharedTiles(a: Array<{ x: number; y: number }>, b: Array<{ x: number; y: number }>): number {
    const setA = new Set(a.map((t) => `${t.x},${t.y}`));
    let count = 0;
    for (const t of b) {
      if (setA.has(`${t.x},${t.y}`)) count++;
    }
    return count;
  }

  private removeFromAllRelationships(allegiance: Allegiance, targetId: Entity): void {
    allegiance.allies = allegiance.allies.filter((id) => id !== targetId);
    allegiance.enemies = allegiance.enemies.filter((id) => id !== targetId);
    allegiance.vassals = allegiance.vassals.filter((id) => id !== targetId);
    if (allegiance.overlordId === targetId) allegiance.overlordId = null;
  }
}
