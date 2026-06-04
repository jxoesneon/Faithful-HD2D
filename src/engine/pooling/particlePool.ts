import * as PIXI from 'pixi.js';
import { ObjectPool } from './objectPool';

export interface ParticlePoolOptions {
  maxSize?: number;
}

/**
 * Object pool for PIXI.Graphics circles used by particle effects.
 * Designed to be used standalone by the ParticleEngine or other VFX systems.
 */
export class ParticlePool {
  private pool: ObjectPool<PIXI.Graphics>;

  constructor(options: ParticlePoolOptions = {}) {
    this.pool = new ObjectPool<PIXI.Graphics>({
      create: () => new PIXI.Graphics(),
      reset: (g) => {
        g.clear();
        g.visible = false;
        g.x = 0;
        g.y = 0;
        g.rotation = 0;
        g.alpha = 1;
        g.scale.set(1);
      },
      maxSize: options.maxSize ?? 500,
    });
  }

  /**
   * Acquire a graphics object for particle use.
   */
  acquire(): PIXI.Graphics {
    const g = this.pool.acquire();
    g.visible = true;
    return g;
  }

  /**
   * Release a graphics object back to the pool.
   */
  release(g: PIXI.Graphics): void {
    this.pool.release(g);
  }

  /**
   * Current pool statistics.
   */
  get stats(): { active: number; pooled: number; totalCreated: number } {
    return this.pool.stats;
  }

  /**
   * Pre-warm the pool with N graphics objects.
   */
  prewarm(count: number): void {
    this.pool.prewarm(count);
  }

  /**
   * Clear the pool and destroy all graphics objects.
   */
  clear(): void {
    this.pool.clear((g) => {
      g.destroy({ children: true });
    });
  }
}
