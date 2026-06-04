import * as PIXI from 'pixi.js';
import { ObjectPool } from './objectPool';

export type SpriteCategory = 'Tribe' | 'Flora' | 'Fauna' | 'Structure';

export interface SpritePoolOptions {
  maxSizePerCategory?: number;
  createSprite?: (category: SpriteCategory) => PIXI.Sprite | PIXI.Graphics;
}

export class SpritePool {
  private pools = new Map<SpriteCategory, ObjectPool<PIXI.Sprite | PIXI.Graphics>>();
  private maxSizePerCategory: number;
  private createSprite: (category: SpriteCategory) => PIXI.Sprite | PIXI.Graphics;

  constructor(options: SpritePoolOptions = {}) {
    this.maxSizePerCategory = options.maxSizePerCategory ?? 200;
    this.createSprite = options.createSprite ?? (() => new PIXI.Sprite());

    const categories: SpriteCategory[] = ['Tribe', 'Flora', 'Fauna', 'Structure'];
    for (const category of categories) {
      this.pools.set(
        category,
        new ObjectPool<PIXI.Sprite | PIXI.Graphics>({
          create: () => this.createSprite(category),
          reset: (sprite) => {
            sprite.visible = false;
            sprite.x = 0;
            sprite.y = 0;
            sprite.rotation = 0;
            sprite.scale.set(1);
            sprite.alpha = 1;
            if ('clear' in sprite && typeof (sprite as PIXI.Graphics).clear === 'function') {
              (sprite as PIXI.Graphics).clear();
            }
          },
          maxSize: this.maxSizePerCategory,
        })
      );
    }
  }

  /**
   * Acquire a sprite/graphics object for the given category.
   */
  acquireSprite(category: SpriteCategory): PIXI.Sprite | PIXI.Graphics {
    const pool = this.pools.get(category);
    if (!pool) throw new Error(`Unknown sprite category: ${category}`);
    const sprite = pool.acquire();
    sprite.visible = true;
    return sprite;
  }

  /**
   * Release a sprite/graphics object back to the given category pool.
   */
  releaseSprite(sprite: PIXI.Sprite | PIXI.Graphics, category: SpriteCategory): void {
    const pool = this.pools.get(category);
    if (!pool) throw new Error(`Unknown sprite category: ${category}`);
    pool.release(sprite);
  }

  /**
   * Get statistics for a specific category.
   */
  getStats(category: SpriteCategory): { active: number; pooled: number; totalCreated: number } {
    const pool = this.pools.get(category);
    if (!pool) throw new Error(`Unknown sprite category: ${category}`);
    return pool.stats;
  }

  /**
   * Get statistics for all categories.
   */
  getAllStats(): Record<SpriteCategory, { active: number; pooled: number; totalCreated: number }> {
    const stats = {} as Record<SpriteCategory, { active: number; pooled: number; totalCreated: number }>;
    for (const [category, pool] of this.pools) {
      stats[category] = pool.stats;
    }
    return stats;
  }

  /**
   * Clear all category pools and destroy pooled objects.
   */
  clear(): void {
    for (const pool of this.pools.values()) {
      pool.clear((sprite) => {
        sprite.destroy({ children: true });
      });
    }
  }
}
