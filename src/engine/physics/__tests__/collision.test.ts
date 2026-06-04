import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { CollisionManager, SpatialHash, aabbOverlap, aabbResolution, circleOverlap, raycast } from '../collision';
import type { Position, AABB } from '../../../types';

describe('SpatialHash', () => {
  let hash: SpatialHash;

  beforeEach(() => {
    hash = new SpatialHash(4);
  });

  it('inserts and queries entities', () => {
    hash.insert('e1', 0, 0, 2, 2);
    hash.insert('e2', 10, 10, 2, 2);
    const result = hash.query(0, 0, 3, 3);
    expect(result.has('e1')).toBe(true);
    expect(result.has('e2')).toBe(false);
  });

  it('finds entities across cell boundaries', () => {
    hash.insert('e1', 3, 3, 3, 3);
    const result = hash.query(2, 2, 3, 3);
    expect(result.has('e1')).toBe(true);
  });

  it('clears all entries', () => {
    hash.insert('e1', 0, 0, 2, 2);
    hash.clear();
    expect(hash.query(0, 0, 10, 10).size).toBe(0);
  });
});

describe('aabbOverlap', () => {
  it('returns true for overlapping AABBs', () => {
    const a: AABB = { type: 'aabb', x: 0, y: 0, width: 4, height: 4, layer: 'entity' };
    const b: AABB = { type: 'aabb', x: 2, y: 2, width: 4, height: 4, layer: 'entity' };
    expect(aabbOverlap(a, b)).toBe(true);
  });

  it('returns false for separated AABBs', () => {
    const a: AABB = { type: 'aabb', x: 0, y: 0, width: 2, height: 2, layer: 'entity' };
    const b: AABB = { type: 'aabb', x: 5, y: 5, width: 2, height: 2, layer: 'entity' };
    expect(aabbOverlap(a, b)).toBe(false);
  });
});

describe('aabbResolution', () => {
  it('returns horizontal push for thin horizontal overlap', () => {
    const a: AABB = { type: 'aabb', x: 0, y: 0, width: 4, height: 4, layer: 'entity' };
    const b: AABB = { type: 'aabb', x: 3, y: 0, width: 4, height: 4, layer: 'entity' };
    const res = aabbResolution(a, b);
    expect(res.x).not.toBe(0);
    expect(res.y).toBe(0);
  });

  it('returns vertical push for thin vertical overlap', () => {
    const a: AABB = { type: 'aabb', x: 0, y: 0, width: 4, height: 4, layer: 'entity' };
    const b: AABB = { type: 'aabb', x: 0, y: 3, width: 4, height: 4, layer: 'entity' };
    const res = aabbResolution(a, b);
    expect(res.x).toBe(0);
    expect(res.y).not.toBe(0);
  });
});

describe('circleOverlap', () => {
  it('returns true for overlapping circles', () => {
    const a = { type: 'circleCollider' as const, x: 0, y: 0, radius: 3, layer: 'entity' as const };
    const b = { type: 'circleCollider' as const, x: 4, y: 0, radius: 3, layer: 'entity' as const };
    expect(circleOverlap(a, b)).toBe(true);
  });

  it('returns false for separated circles', () => {
    const a = { type: 'circleCollider' as const, x: 0, y: 0, radius: 2, layer: 'entity' as const };
    const b = { type: 'circleCollider' as const, x: 10, y: 0, radius: 2, layer: 'entity' as const };
    expect(circleOverlap(a, b)).toBe(false);
  });
});

describe('raycast', () => {
  it('hits an obstacle in the path', () => {
    const result = raycast(0, 0, 1, 0, 10, [{ x: 5, y: -1, width: 2, height: 2 }]);
    expect(result.hit).toBe(true);
    expect(result.distance).toBeLessThan(10);
  });

  it('misses when no obstacles', () => {
    const result = raycast(0, 0, 1, 0, 10, []);
    expect(result.hit).toBe(false);
  });

  it('returns max distance when obstacle is beyond range', () => {
    const result = raycast(0, 0, 1, 0, 5, [{ x: 10, y: -1, width: 2, height: 2 }]);
    expect(result.hit).toBe(false);
    expect(result.distance).toBe(5);
  });
});

describe('CollisionManager', () => {
  let ecs: ECS;
  let manager: CollisionManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new CollisionManager(ecs);
  });

  it('detects AABB collisions between entities', () => {
    const e1 = ecs.createEntity();
    ecs.addComponent(e1, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(e1, { type: 'aabb', x: 0, y: 0, width: 4, height: 4, layer: 'entity' });

    const e2 = ecs.createEntity();
    ecs.addComponent(e2, { type: 'position', x: 2, y: 2, z: 0 } as Position);
    ecs.addComponent(e2, { type: 'aabb', x: 0, y: 0, width: 4, height: 4, layer: 'entity' });

    const collisions = manager.update();
    expect(collisions.length).toBe(1);
    expect(collisions[0].entityA).toBe(e1);
    expect(collisions[0].entityB).toBe(e2);
  });

  it('ignores collisions on non-interacting layers', () => {
    manager.setLayerMask('entity', ['structure']);

    const e1 = ecs.createEntity();
    ecs.addComponent(e1, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(e1, { type: 'aabb', x: 0, y: 0, width: 4, height: 4, layer: 'entity' });

    const e2 = ecs.createEntity();
    ecs.addComponent(e2, { type: 'position', x: 2, y: 2, z: 0 } as Position);
    ecs.addComponent(e2, { type: 'aabb', x: 0, y: 0, width: 4, height: 4, layer: 'entity' });

    const collisions = manager.update();
    expect(collisions.length).toBe(0);
  });

  it('resolves collisions by pushing entities apart', () => {
    const e1 = ecs.createEntity();
    ecs.addComponent(e1, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(e1, { type: 'aabb', x: 0, y: 0, width: 4, height: 4, layer: 'entity' });

    const e2 = ecs.createEntity();
    ecs.addComponent(e2, { type: 'position', x: 3, y: 0, z: 0 } as Position);
    ecs.addComponent(e2, { type: 'aabb', x: 0, y: 0, width: 4, height: 4, layer: 'entity' });

    const collisions = manager.update();
    manager.resolveCollisions(collisions);

    const pos1 = ecs.getComponent<Position>(e1, 'position');
    const pos2 = ecs.getComponent<Position>(e2, 'position');
    expect(pos1!.x).not.toBe(0);
    expect(pos2!.x).not.toBe(3);
  });

  it('raycastFromEntity returns hit when obstacle exists', () => {
    const origin = ecs.createEntity();
    ecs.addComponent(origin, { type: 'position', x: 0, y: 0, z: 0 } as Position);

    const obstacle = ecs.createEntity();
    ecs.addComponent(obstacle, { type: 'position', x: 5, y: -1, z: 0 } as Position);
    ecs.addComponent(obstacle, { type: 'aabb', x: 0, y: 0, width: 2, height: 2, layer: 'structure' });

    const result = manager.raycastFromEntity(origin, 1, 0, 10);
    expect(result.hit).toBe(true);
    expect(result.distance).toBeLessThan(10);
  });

  it('returns no collisions when entities are far apart', () => {
    const e1 = ecs.createEntity();
    ecs.addComponent(e1, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(e1, { type: 'aabb', x: 0, y: 0, width: 2, height: 2, layer: 'entity' });

    const e2 = ecs.createEntity();
    ecs.addComponent(e2, { type: 'position', x: 20, y: 20, z: 0 } as Position);
    ecs.addComponent(e2, { type: 'aabb', x: 0, y: 0, width: 2, height: 2, layer: 'entity' });

    const collisions = manager.update();
    expect(collisions.length).toBe(0);
  });
});
