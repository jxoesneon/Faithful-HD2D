import type { EntityAnimState } from '../../types';
import { Tween } from './tween';

/**
 * Frame timing configuration per entity animation state.
 */
export const STATE_FRAME_DURATION: Record<EntityAnimState['state'], number> = {
  idle: 0.8,
  walk: 0.15,
  attack: 0.12,
  death: 0.2,
  spawn: 0.3,
};

export const STATE_FRAME_COUNTS: Record<EntityAnimState['state'], number> = {
  idle: 4,
  walk: 4,
  attack: 4,
  death: 4,
  spawn: 4,
};

export interface EntityAnimConfig {
  frameDuration?: Partial<Record<EntityAnimState['state'], number>>;
  frameCounts?: Partial<Record<EntityAnimState['state'], number>>;
  transitionDuration?: number; // ms
}

/**
 * Controls per-entity animation states and smooth positional interpolation.
 * Standalone — the integrator calls `update(dt)` each tick.
 */
export class EntityAnimationController {
  private states = new Map<string, EntityAnimState>();
  private positions = new Map<string, { x: number; y: number; tween: Tween | null }>();
  private frameDurations: Record<EntityAnimState['state'], number>;
  private frameCounts: Record<EntityAnimState['state'], number>;
  private transitionDuration: number;

  constructor(config?: EntityAnimConfig) {
    this.frameDurations = { ...STATE_FRAME_DURATION, ...config?.frameDuration };
    this.frameCounts = { ...STATE_FRAME_COUNTS, ...config?.frameCounts };
    this.transitionDuration = config?.transitionDuration ?? 200;
  }

  /**
   * Register or update an entity's animation state.
   */
  setState(entityId: string, state: EntityAnimState['state'], direction?: EntityAnimState['direction']): void {
    const existing = this.states.get(entityId);
    if (existing) {
      if (existing.state !== state) {
        existing.state = state;
        existing.frameIndex = 0;
        existing.frameTimer = 0;
        existing.transitionProgress = 0;
      }
      if (direction) existing.direction = direction;
    } else {
      this.states.set(entityId, {
        entityId,
        state,
        frameIndex: 0,
        frameTimer: 0,
        direction: direction || 's',
        transitionProgress: 0,
      });
    }
  }

  /**
   * Get the current animation state for an entity, or undefined.
   */
  getState(entityId: string): EntityAnimState | undefined {
    return this.states.get(entityId);
  }

  /**
   * Remove an entity from the controller.
   */
  removeEntity(entityId: string): void {
    this.states.delete(entityId);
    const pos = this.positions.get(entityId);
    if (pos) {
      if (pos.tween) pos.tween.finish();
      this.positions.delete(entityId);
    }
  }

  /**
   * Smoothly move an entity from its current position to a target tile.
   * @param duration Optional glide duration in ms (default 300)
   */
  moveEntity(entityId: string, toX: number, toY: number, duration = 300): void {
    let pos = this.positions.get(entityId);
    if (!pos) {
      pos = { x: toX, y: toY, tween: null };
      this.positions.set(entityId, pos);
      return;
    }
    if (pos.tween && pos.tween.isAlive) {
      pos.tween.finish();
    }
    const target = { x: pos.x, y: pos.y };
    pos.tween = new Tween({
      target,
      to: { x: toX, y: toY },
      duration,
      easing: 'easeInOutQuad',
      onUpdate: () => {
        pos!.x = target.x;
        pos!.y = target.y;
      },
    });
  }

  /**
   * Get the current interpolated visual position for an entity.
   */
  getVisualPosition(entityId: string): { x: number; y: number } | undefined {
    return this.positions.get(entityId);
  }

  /**
   * Advance all animation states and position tweens.
   * @param dt Delta time in milliseconds.
   */
  update(dt: number): void {
    for (const state of this.states.values()) {
      state.frameTimer += dt / 1000;
      const duration = this.frameDurations[state.state];
      if (state.frameTimer >= duration) {
        state.frameTimer = 0;
        const count = this.frameCounts[state.state];
        state.frameIndex = (state.frameIndex + 1) % count;
      }
      if (state.transitionProgress < 1) {
        state.transitionProgress = Math.min(1, state.transitionProgress + dt / this.transitionDuration);
      }
    }

    for (const pos of this.positions.values()) {
      if (pos.tween && pos.tween.isAlive) {
        pos.tween.update(dt);
      }
    }
  }

  /**
   * Total number of tracked entities.
   */
  get count(): number {
    return this.states.size;
  }

  /**
   * Reset all tracked data.
   */
  clear(): void {
    this.states.clear();
    this.positions.clear();
  }
}
