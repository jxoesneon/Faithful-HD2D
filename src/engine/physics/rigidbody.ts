import type { ECS } from '../ecs';
import type { Entity, Position, RigidBody, Projectile } from '../../types';

export interface ProjectileArc {
  x: number;
  y: number;
  z: number; // height
  vx: number;
  vy: number;
  vz: number;
}

/** Manager for velocity-based movement, knockback, and projectiles */
export class RigidBodyManager {
  private ecs: ECS;
  private projectiles: Map<Entity, ProjectileArc> = new Map();

  constructor(ecs: ECS) {
    this.ecs = ecs;
  }

  /** Apply velocity with friction, update positions */
  update(dt: number): void {
    const entities = this.ecs.getEntitiesWith(['rigidBody', 'position']);
    for (const id of entities) {
      const rb = this.ecs.getComponent<RigidBody>(id, 'rigidBody');
      const pos = this.ecs.getComponent<Position>(id, 'position');
      if (!rb || !pos || rb.isStatic) continue;

      // Apply friction
      rb.vx *= Math.pow(1 - rb.friction, dt * 60);
      rb.vy *= Math.pow(1 - rb.friction, dt * 60);

      // Stop if very slow
      if (Math.abs(rb.vx) < 0.001) rb.vx = 0;
      if (Math.abs(rb.vy) < 0.001) rb.vy = 0;

      // Update position
      pos.x += rb.vx * dt;
      pos.y += rb.vy * dt;

      this.ecs.addComponent(id, pos);
      this.ecs.addComponent(id, rb);
    }

    // Update projectiles
    this.updateProjectiles(dt);
  }

  /** Apply instantaneous knockback force */
  applyKnockback(entity: Entity, dirX: number, dirY: number, force: number): void {
    const rb = this.ecs.getComponent<RigidBody>(entity, 'rigidBody');
    if (!rb || rb.isStatic) return;

    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len === 0) return;

    rb.vx += (dirX / len) * force / Math.max(rb.mass, 0.1);
    rb.vy += (dirY / len) * force / Math.max(rb.mass, 0.1);
    this.ecs.addComponent(entity, rb);
  }

  /** Spawn a projectile with parabolic arc */
  spawnProjectile(
    ownerId: Entity,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    speed: number = 10,
    gravity: number = 9.8,
    damage: number = 10,
    lifetime: number = 3
  ): Entity {
    const id = this.ecs.createEntity();

    const proj: Projectile = {
      type: 'projectile',
      ownerId,
      startX,
      startY,
      targetX,
      targetY,
      speed,
      gravity,
      damage,
      elapsed: 0,
      lifetime,
    };

    const pos: Position = {
      type: 'position',
      x: startX,
      y: startY,
      z: 0,
    };

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dist > 0 ? dx / dist : 1;
    const dirY = dist > 0 ? dy / dist : 0;

    // Calculate initial vertical velocity for arc
    const timeToTarget = dist / speed;
    const vz = (gravity * timeToTarget) / 2;

    this.projectiles.set(id, {
      x: startX,
      y: startY,
      z: 0,
      vx: dirX * speed,
      vy: dirY * speed,
      vz: vz,
    });

    this.ecs.addComponent(id, proj);
    this.ecs.addComponent(id, pos);

    return id;
  }

  private updateProjectiles(dt: number): void {
    const projEntities = this.ecs.getEntitiesWith(['projectile']);
    for (const id of projEntities) {
      const proj = this.ecs.getComponent<Projectile>(id, 'projectile');
      const pos = this.ecs.getComponent<Position>(id, 'position');
      const arc = this.projectiles.get(id);
      if (!proj || !pos || !arc) continue;

      proj.elapsed += dt;
      if (proj.elapsed >= proj.lifetime) {
        this.ecs.removeEntity(id);
        this.projectiles.delete(id);
        continue;
      }

      // Update arc physics
      arc.x += arc.vx * dt;
      arc.y += arc.vy * dt;
      arc.z += arc.vz * dt;
      arc.vz -= proj.gravity * dt;

      pos.x = arc.x;
      pos.y = arc.y;
      // z represents height for rendering; if below ground, hit
      if (arc.z <= 0) {
        arc.z = 0;
        this.ecs.removeEntity(id);
        this.projectiles.delete(id);
        continue;
      }

      this.ecs.addComponent(id, pos);
      this.ecs.addComponent(id, proj);
    }
  }

  /** Get current arc data for rendering */
  getProjectileArc(id: Entity): ProjectileArc | undefined {
    return this.projectiles.get(id);
  }

  /** Get all active projectiles */
  getActiveProjectiles(): Entity[] {
    return Array.from(this.projectiles.keys());
  }
}
