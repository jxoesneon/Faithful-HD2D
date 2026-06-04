import type { ECS } from '../ecs';
import type { Entity, Position, AABB, CircleCollider, CollisionLayer } from '../../types';

export interface RaycastResult {
  hit: boolean;
  point: { x: number; y: number } | null;
  entity: Entity | null;
  distance: number;
}

export interface CollisionPair {
  entityA: Entity;
  entityB: Entity;
  overlapX: number;
  overlapY: number;
}

/** Spatial hash for broad-phase collision detection */
export class SpatialHash {
  private cellSize: number;
  private cells = new Map<string, Set<Entity>>();

  constructor(cellSize: number = 4) {
    this.cellSize = cellSize;
  }

  private key(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  clear(): void {
    this.cells.clear();
  }

  insert(entity: Entity, x: number, y: number, width: number, height: number): void {
    const minX = Math.floor(x / this.cellSize);
    const minY = Math.floor(y / this.cellSize);
    const maxX = Math.floor((x + width) / this.cellSize);
    const maxY = Math.floor((y + height) / this.cellSize);

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const k = this.key(cx, cy);
        if (!this.cells.has(k)) this.cells.set(k, new Set());
        this.cells.get(k)!.add(entity);
      }
    }
  }

  query(x: number, y: number, width: number, height: number): Set<Entity> {
    const result = new Set<Entity>();
    const minX = Math.floor(x / this.cellSize);
    const minY = Math.floor(y / this.cellSize);
    const maxX = Math.floor((x + width) / this.cellSize);
    const maxY = Math.floor((y + height) / this.cellSize);

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const k = this.key(cx, cy);
        const cell = this.cells.get(k);
        if (cell) {
          for (const e of cell) result.add(e);
        }
      }
    }
    return result;
  }
}

/** Check if two AABBs overlap */
export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Calculate AABB vs AABB overlap resolution vector */
export function aabbResolution(a: AABB, b: AABB): { x: number; y: number } {
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

  if (overlapX < overlapY) {
    return a.x < b.x ? { x: -overlapX, y: 0 } : { x: overlapX, y: 0 };
  } else {
    return a.y < b.y ? { x: 0, y: -overlapY } : { x: 0, y: overlapY };
  }
}

/** Check if two circles overlap */
export function circleOverlap(a: CircleCollider, b: CircleCollider): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < a.radius + b.radius;
}

/** Ray cast from origin in direction, returns first hit */
export function raycast(
  originX: number,
  originY: number,
  dirX: number,
  dirY: number,
  maxDistance: number,
  obstacles: Array<{ x: number; y: number; width: number; height: number }>
): RaycastResult {
  const len = Math.sqrt(dirX * dirX + dirY * dirY);
  if (len === 0) return { hit: false, point: null, entity: null, distance: 0 };
  const ndx = dirX / len;
  const ndy = dirY / len;

  let closest: RaycastResult = { hit: false, point: null, entity: null, distance: maxDistance };

  for (const obs of obstacles) {
    const hit = rayAABB(originX, originY, ndx, ndy, obs.x, obs.y, obs.width, obs.height);
    if (hit && hit.distance < closest.distance) {
      closest = { hit: true, point: hit.point, entity: null, distance: hit.distance };
    }
  }

  return closest;
}

function rayAABB(
  ox: number, oy: number, dx: number, dy: number,
  ax: number, ay: number, aw: number, ah: number
): { point: { x: number; y: number }; distance: number } | null {
  let tmin = -Infinity;
  let tmax = Infinity;

  if (dx !== 0) {
    const tx1 = (ax - ox) / dx;
    const tx2 = (ax + aw - ox) / dx;
    tmin = Math.max(tmin, Math.min(tx1, tx2));
    tmax = Math.min(tmax, Math.max(tx1, tx2));
  } else if (ox < ax || ox > ax + aw) {
    return null;
  }

  if (dy !== 0) {
    const ty1 = (ay - oy) / dy;
    const ty2 = (ay + ah - oy) / dy;
    tmin = Math.max(tmin, Math.min(ty1, ty2));
    tmax = Math.min(tmax, Math.max(ty1, ty2));
  } else if (oy < ay || oy > ay + ah) {
    return null;
  }

  if (tmax < 0 || tmin > tmax) return null;

  const dist = tmin < 0 ? 0 : tmin;
  return {
    point: { x: ox + dx * dist, y: oy + dy * dist },
    distance: dist,
  };
}

/** Collision manager that operates on the ECS */
export class CollisionManager {
  private ecs: ECS;
  private spatialHash = new SpatialHash(4);
  private layerMasks: Record<CollisionLayer, CollisionLayer[]> = {
    terrain: ['entity', 'projectile', 'structure'],
    structure: ['entity', 'projectile', 'terrain'],
    entity: ['terrain', 'structure', 'entity', 'projectile'],
    projectile: ['terrain', 'structure', 'entity'],
  };

  constructor(ecs: ECS) {
    this.ecs = ecs;
  }

  /** Update spatial hash and detect all collisions for this tick */
  update(): CollisionPair[] {
    this.spatialHash.clear();

    // Insert all AABB entities
    const aabbEntities = this.ecs.getEntitiesWith(['aabb', 'position']);
    for (const id of aabbEntities) {
      const aabb = this.ecs.getComponent<AABB>(id, 'aabb');
      const pos = this.ecs.getComponent<Position>(id, 'position');
      if (aabb && pos) {
        this.spatialHash.insert(id, pos.x + aabb.x, pos.y + aabb.y, aabb.width, aabb.height);
      }
    }

    const collisions: CollisionPair[] = [];
    const checked = new Set<string>();

    for (const id of aabbEntities) {
      const aabb = this.ecs.getComponent<AABB>(id, 'aabb');
      const pos = this.ecs.getComponent<Position>(id, 'position');
      if (!aabb || !pos) continue;

      const candidates = this.spatialHash.query(pos.x + aabb.x, pos.y + aabb.y, aabb.width, aabb.height);
      for (const otherId of candidates) {
        if (otherId === id) continue;
        const pairKey = id < otherId ? `${id}|${otherId}` : `${otherId}|${id}`;
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        const otherAabb = this.ecs.getComponent<AABB>(otherId, 'aabb');
        const otherPos = this.ecs.getComponent<Position>(otherId, 'position');
        if (!otherAabb || !otherPos) continue;

        if (!this.layersCanCollide(aabb.layer, otherAabb.layer)) continue;

        const localA: AABB = { ...aabb, x: pos.x + aabb.x, y: pos.y + aabb.y };
        const localB: AABB = { ...otherAabb, x: otherPos.x + otherAabb.x, y: otherPos.y + otherAabb.y };

        if (aabbOverlap(localA, localB)) {
          const res = aabbResolution(localA, localB);
          collisions.push({ entityA: id, entityB: otherId, overlapX: res.x, overlapY: res.y });
        }
      }
    }

    return collisions;
  }

  /** Resolve collisions by pushing entities apart */
  resolveCollisions(collisions: CollisionPair[]): void {
    for (const col of collisions) {
      const posA = this.ecs.getComponent<Position>(col.entityA, 'position');
      const posB = this.ecs.getComponent<Position>(col.entityB, 'position');
      if (!posA || !posB) continue;

      posA.x += col.overlapX * 0.5;
      posA.y += col.overlapY * 0.5;
      posB.x -= col.overlapX * 0.5;
      posB.y -= col.overlapY * 0.5;

      this.ecs.addComponent(col.entityA, posA);
      this.ecs.addComponent(col.entityB, posB);
    }
  }

  /** Cast a ray and find the first entity hit */
  raycastFromEntity(
    originId: Entity,
    dirX: number,
    dirY: number,
    maxDistance: number = 20
  ): RaycastResult {
    const origin = this.ecs.getComponent<Position>(originId, 'position');
    if (!origin) return { hit: false, point: null, entity: null, distance: 0 };

    const obstacles: Array<{ x: number; y: number; width: number; height: number }> = [];
    const all = this.ecs.getEntitiesWith(['aabb', 'position']);
    for (const id of all) {
      if (id === originId) continue;
      const aabb = this.ecs.getComponent<AABB>(id, 'aabb');
      const pos = this.ecs.getComponent<Position>(id, 'position');
      if (aabb && pos) {
        obstacles.push({ x: pos.x + aabb.x, y: pos.y + aabb.y, width: aabb.width, height: aabb.height });
      }
    }

    return raycast(origin.x, origin.y, dirX, dirY, maxDistance, obstacles);
  }

  /** Check if two layers can collide */
  layersCanCollide(a: CollisionLayer, b: CollisionLayer): boolean {
    return this.layerMasks[a]?.includes(b) ?? false;
  }

  /** Set which layers can collide with a given layer */
  setLayerMask(layer: CollisionLayer, canCollideWith: CollisionLayer[]): void {
    this.layerMasks[layer] = canCollideWith;
  }
}
