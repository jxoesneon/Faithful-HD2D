import * as PIXI from 'pixi.js';
import type { Particle, EmitterConfig } from '../../types';

let globalParticleId = 0;
function nextId() {
  return ++globalParticleId;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/**
 * GPU-accelerated particle system using PIXI.js v8.
 * Uses object pooling for both data particles and PIXI.Graphics display objects.
 * Can be attached to any PIXI stage by accessing `engine.container`.
 *
 * @example
 * const engine = new ParticleEngine();
 * app.stage.addChild(engine.container);
 * const emitter = engine.addEmitter(meteorTrailConfig, { x: 100, y: 100 });
 * engine.update(16.6);
 */
export class ParticleEngine {
  public container: PIXI.Container;
  private emitters: Emitter[] = [];

  constructor() {
    this.container = new PIXI.Container();
  }

  /**
   * Create and register a new emitter at the given origin.
   */
  addEmitter(config: EmitterConfig, origin: { x: number; y: number }): Emitter {
    const emitter = new Emitter(config, origin, this.container);
    this.emitters.push(emitter);
    return emitter;
  }

  /**
   * Remove an emitter and destroy its pooled display objects.
   */
  removeEmitter(emitter: Emitter): void {
    const idx = this.emitters.indexOf(emitter);
    if (idx >= 0) {
      this.emitters.splice(idx, 1);
      emitter.destroy();
    }
  }

  /**
   * Update all emitters and particles.
   * @param dt Delta time in milliseconds.
   */
  update(dt: number): void {
    const dtSec = dt / 1000;
    for (const emitter of this.emitters) {
      emitter.update(dtSec);
    }
  }

  /**
   * Destroy the engine and all emitters.
   */
  destroy(): void {
    for (const emitter of this.emitters) {
      emitter.destroy();
    }
    this.emitters = [];
    this.container.destroy({ children: true });
  }

  /**
   * Current number of active particles across all emitters.
   */
  get activeParticleCount(): number {
    return this.emitters.reduce((sum, e) => sum + e.activeCount, 0);
  }

  /**
   * Current number of registered emitters.
   */
  get emitterCount(): number {
    return this.emitters.length;
  }
}

/**
 * A single emitter instance. Manages its own pool of particles and display objects.
 */
export class Emitter {
  public origin: { x: number; y: number };
  public config: EmitterConfig;
  public active = true;
  public activeCount = 0;

  private particles: Particle[] = [];
  private displayPool: (PIXI.Graphics | PIXI.Sprite)[] = [];
  private poolIndex = 0;
  private elapsed = 0;
  private spawnAccumulator = 0;
  private parent: PIXI.Container;

  constructor(config: EmitterConfig, origin: { x: number; y: number }, parent: PIXI.Container) {
    this.config = config;
    this.origin = origin;
    this.parent = parent;
    this.particles = new Array(config.maxParticles);
    for (let i = 0; i < config.maxParticles; i++) {
      this.particles[i] = this.createParticleData();
    }
    this.displayPool = new Array(config.maxParticles);
    for (let i = 0; i < config.maxParticles; i++) {
      const g = new PIXI.Graphics();
      g.visible = false;
      this.parent.addChild(g);
      this.displayPool[i] = g;
    }
    if (config.burstCount && config.burstCount > 0) {
      this.burst(config.burstCount);
    }
  }

  /**
   * Spawn a one-time burst of particles.
   */
  burst(count: number): void {
    const c = Math.min(count, this.config.maxParticles - this.activeCount);
    for (let i = 0; i < c; i++) {
      this.spawnParticle();
    }
  }

  /**
   * Move the emitter origin.
   */
  setOrigin(x: number, y: number): void {
    this.origin.x = x;
    this.origin.y = y;
  }

  update(dtSec: number): void {
    if (!this.active) return;
    this.elapsed += dtSec;

    // Finite duration check
    if (this.config.duration !== undefined && this.elapsed >= this.config.duration) {
      this.active = false;
    }

    // Spawn continuous particles
    if (this.active) {
      this.spawnAccumulator += dtSec;
      const interval = this.config.spawnRate > 0 ? 1 / this.config.spawnRate : Infinity;
      while (this.spawnAccumulator >= interval && this.activeCount < this.config.maxParticles) {
        this.spawnAccumulator -= interval;
        this.spawnParticle();
      }
    }

    // Update existing particles
    for (let i = 0; i < this.config.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      const disp = this.displayPool[i];

      p.life -= dtSec;
      if (p.life <= 0) {
        p.active = false;
        disp.visible = false;
        this.activeCount--;
        continue;
      }

      const t = clamp01(1 - p.life / p.maxLife);

      // Physics
      p.vx += this.config.gravity[0] * dtSec;
      p.vy += this.config.gravity[1] * dtSec;
      p.vx *= 1 - this.config.drag * dtSec;
      p.vy *= 1 - this.config.drag * dtSec;
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;

      // Rotation
      p.rotation += p.rotationSpeed * dtSec;

      // Size
      const sizeStart = p.size;
      const sizeEnd = this.config.sizeOverLife !== undefined ? sizeStart * this.config.sizeOverLife : sizeStart * 0.1;
      const currentSize = lerp(sizeStart, sizeEnd, t);

      // Color
      const r = lerp(this.config.colorStart[0], this.config.colorEnd[0], t);
      const g = lerp(this.config.colorStart[1], this.config.colorEnd[1], t);
      const b = lerp(this.config.colorStart[2], this.config.colorEnd[2], t);
      const a = lerp(this.config.colorStart[3], this.config.colorEnd[3], t);
      p.color = [r, g, b, a];

      // Update display object
      disp.visible = true;
      const gObj = disp as PIXI.Graphics;
      gObj.clear();
      gObj.circle(0, 0, currentSize);
      gObj.fill({ color: this.colorToHex(p.color), alpha: a });
      gObj.x = p.x;
      gObj.y = p.y;
      gObj.rotation = p.rotation;
      gObj.blendMode = this.config.blendMode === 'additive' ? 'add' : 'normal';
    }
  }

  destroy(): void {
    for (const disp of this.displayPool) {
      disp.destroy({ children: true });
    }
    this.displayPool = [];
    this.particles = [];
    this.activeCount = 0;
  }

  private spawnParticle(): void {
    if (this.activeCount >= this.config.maxParticles) return;
    const idx = this.findInactiveIndex();
    if (idx < 0) return;
    const p = this.particles[idx];
    p.active = true;
    p.id = nextId();
    p.life = randomRange(this.config.lifeMin, this.config.lifeMax);
    p.maxLife = p.life;
    p.size = randomRange(this.config.sizeMin, this.config.sizeMax);
    p.rotation = randomRange(this.config.rotationMin ?? 0, this.config.rotationMax ?? 0);
    p.rotationSpeed = randomRange(this.config.rotationSpeedMin ?? 0, this.config.rotationSpeedMax ?? 0);
    p.color = [...this.config.colorStart];

    // Position based on shape
    const angle = randomRange(0, Math.PI * 2);
    const radius = Math.random() * this.config.spawnRadius;
    if (this.config.shape === 'point') {
      p.x = this.origin.x;
      p.y = this.origin.y;
    } else if (this.config.shape === 'circle') {
      p.x = this.origin.x + Math.cos(angle) * radius;
      p.y = this.origin.y + Math.sin(angle) * radius;
    } else if (this.config.shape === 'rect') {
      p.x = this.origin.x + (Math.random() - 0.5) * this.config.spawnRadius * 2;
      p.y = this.origin.y + (Math.random() - 0.5) * this.config.spawnRadius * 2;
    } else if (this.config.shape === 'cone') {
      const dir = this.config.angle + randomRange(-this.config.angleSpread / 2, this.config.angleSpread / 2);
      const dist = Math.random() * this.config.spawnRadius;
      p.x = this.origin.x + Math.cos(dir) * dist;
      p.y = this.origin.y + Math.sin(dir) * dist;
    } else {
      p.x = this.origin.x;
      p.y = this.origin.y;
    }

    // Velocity based on angle and speed
    const velAngle = this.config.angle + randomRange(-this.config.angleSpread / 2, this.config.angleSpread / 2);
    const speed = randomRange(this.config.speedMin, this.config.speedMax);
    p.vx = Math.cos(velAngle) * speed;
    p.vy = Math.sin(velAngle) * speed;

    this.activeCount++;
  }

  private findInactiveIndex(): number {
    const len = this.config.maxParticles;
    for (let i = 0; i < len; i++) {
      const idx = (this.poolIndex + i) % len;
      if (!this.particles[idx].active) {
        this.poolIndex = (idx + 1) % len;
        return idx;
      }
    }
    return -1;
  }

  private createParticleData(): Particle {
    return {
      id: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      size: 1,
      color: [1, 1, 1, 1],
      rotation: 0,
      rotationSpeed: 0,
      active: false,
    };
  }

  private colorToHex(c: [number, number, number, number]): number {
    const r = Math.round(clamp01(c[0]) * 255);
    const g = Math.round(clamp01(c[1]) * 255);
    const b = Math.round(clamp01(c[2]) * 255);
    return (r << 16) | (g << 8) | b;
  }
}
