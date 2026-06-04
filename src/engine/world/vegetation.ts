import { ECS } from '../ecs';
import { Flora, Position } from '../../types';
import { WindSystem } from './wind';

/** Mutable target that VegetationAnimator can sway. */
export interface SwayTarget {
  x?: number;
  y?: number;
  rotation?: number;
}

/** Height factor per flora category (0 = rigid, 1 = very flexible / tall). */
const CATEGORY_HEIGHT_FACTORS: Record<Flora['category'], number> = {
  TREE: 1.0,
  EXOTIC: 0.75,
  NANO_BANANA: 0.5,
  CROP: 0.3,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Applies wind-induced sway to flora sprites.
 * Tall trees sway more than short crops.
 */
export class VegetationAnimator {
  constructor(
    private ecs: ECS,
    private windSystem: WindSystem,
    private getSprite?: (entityId: string) => SwayTarget | undefined
  ) {}

  /** Apply sway offsets to all flora entities for this frame. */
  update(dt: number): void {
    const floraIds = this.ecs.getEntitiesWith(['flora', 'position']);

    for (const id of floraIds) {
      const flora = this.ecs.getComponent<Flora>(id, 'flora');
      const pos = this.ecs.getComponent<Position>(id, 'position');
      if (!flora || !pos) continue;

      const categoryFactor = CATEGORY_HEIGHT_FACTORS[flora.category] ?? 0.5;
      const growthFactor = 0.2 + 0.8 * (flora.growth / 100);
      const heightFactor = categoryFactor * growthFactor;

      const sway = this.windSystem.getSwayAmount(id, heightFactor);

      if (this.getSprite) {
        const sprite = this.getSprite(id);
        if (sprite) {
          if (typeof sprite.x === 'number') {
            sprite.x += sway.swayX;
          }
          if (typeof sprite.y === 'number') {
            sprite.y += sway.swayY;
          }
          if (typeof sprite.rotation === 'number') {
            sprite.rotation += sway.swayRot;
          }
        }
      }
    }
  }

  /**
   * Returns the computed sway for a single entity without applying it.
   * Useful for external consumers (e.g. custom renderers).
   */
  getSwayForEntity(entityId: string): { swayX: number; swayY: number; swayRot: number } | null {
    const flora = this.ecs.getComponent<Flora>(entityId, 'flora');
    const pos = this.ecs.getComponent<Position>(entityId, 'position');
    if (!flora || !pos) return null;

    const categoryFactor = CATEGORY_HEIGHT_FACTORS[flora.category] ?? 0.5;
    const growthFactor = 0.2 + 0.8 * (flora.growth / 100);
    const heightFactor = categoryFactor * growthFactor;

    return this.windSystem.getSwayAmount(entityId, heightFactor);
  }
}
