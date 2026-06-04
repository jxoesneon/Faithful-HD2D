import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { RigidBodyManager } from '../rigidbody';
import type { Position, RigidBody, Projectile } from '../../../types';

describe('RigidBodyManager', () => {
  let ecs: ECS;
  let manager: RigidBodyManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new RigidBodyManager(ecs);
  });

  it('moves entity by velocity', () => {
    const e = ecs.createEntity();
    ecs.addComponent(e, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(e, { type: 'rigidBody', vx: 10, vy: 0, mass: 1, friction: 0, restitution: 0, isStatic: false } as RigidBody);

    manager.update(1);
    const pos = ecs.getComponent<Position>(e, 'position');
    expect(pos!.x).toBe(10);
  });

  it('applies friction over time', () => {
    const e = ecs.createEntity();
    ecs.addComponent(e, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(e, { type: 'rigidBody', vx: 10, vy: 0, mass: 1, friction: 0.1, restitution: 0, isStatic: false } as RigidBody);

    manager.update(1);
    const rb = ecs.getComponent<RigidBody>(e, 'rigidBody');
    expect(rb!.vx).toBeLessThan(10);
    expect(rb!.vx).toBeGreaterThan(0);
  });

  it('does not move static bodies', () => {
    const e = ecs.createEntity();
    ecs.addComponent(e, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(e, { type: 'rigidBody', vx: 10, vy: 0, mass: 1, friction: 0, restitution: 0, isStatic: true } as RigidBody);

    manager.update(1);
    const pos = ecs.getComponent<Position>(e, 'position');
    expect(pos!.x).toBe(0);
  });

  it('applies knockback force', () => {
    const e = ecs.createEntity();
    ecs.addComponent(e, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(e, { type: 'rigidBody', vx: 0, vy: 0, mass: 1, friction: 0, restitution: 0, isStatic: false } as RigidBody);

    manager.applyKnockback(e, 1, 0, 50);
    const rb = ecs.getComponent<RigidBody>(e, 'rigidBody');
    expect(rb!.vx).toBeGreaterThan(0);
  });

  it('does not apply knockback to static bodies', () => {
    const e = ecs.createEntity();
    ecs.addComponent(e, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(e, { type: 'rigidBody', vx: 0, vy: 0, mass: 1, friction: 0, restitution: 0, isStatic: true } as RigidBody);

    manager.applyKnockback(e, 1, 0, 50);
    const rb = ecs.getComponent<RigidBody>(e, 'rigidBody');
    expect(rb!.vx).toBe(0);
  });

  it('spawns and tracks a projectile', () => {
    const owner = ecs.createEntity();
    const proj = manager.spawnProjectile(owner, 0, 0, 10, 0, 10, 9.8, 20, 3);
    expect(manager.getActiveProjectiles()).toContain(proj);
  });

  it('updates projectile position over time', () => {
    const owner = ecs.createEntity();
    const proj = manager.spawnProjectile(owner, 0, 0, 10, 0, 10, 9.8, 20, 3);
    manager.update(0.5);
    const pos = ecs.getComponent<Position>(proj, 'position');
    expect(pos!.x).toBeGreaterThan(0);
  });

  it('removes projectile when it hits ground (z <= 0)', () => {
    const owner = ecs.createEntity();
    const proj = manager.spawnProjectile(owner, 0, 0, 10, 0, 10, 100, 20, 10);
    // High gravity brings it down after ~1.5s (Euler integration with dt=0.5 * 3)
    manager.update(0.5);
    manager.update(0.5);
    manager.update(0.5);
    expect(manager.getActiveProjectiles()).not.toContain(proj);
  });

  it('removes projectile after lifetime expires', () => {
    const owner = ecs.createEntity();
    const proj = manager.spawnProjectile(owner, 0, 0, 10, 0, 10, 0, 20, 0.5);
    manager.update(1);
    expect(manager.getActiveProjectiles()).not.toContain(proj);
  });
});
