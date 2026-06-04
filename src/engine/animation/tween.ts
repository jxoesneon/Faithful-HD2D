import type { TweenConfig, EasingName } from '../../types';

/**
 * Collection of easing functions.
 * All functions map t in [0, 1] to a value in [0, 1] (some may overshoot).
 */
export const Easing = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  bounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  back: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
};

/**
 * A single active tween instance.
 */
export class Tween {
  public isAlive = true;
  private elapsed = 0;
  private target: Record<string, number>;
  private from: Record<string, number>;
  private to: Record<string, number>;
  private duration: number;
  private easingFn: (t: number) => number;
  private delay: number;
  private onUpdate?: (obj: Record<string, number>) => void;
  private onComplete?: (obj: Record<string, number>) => void;

  constructor(config: TweenConfig) {
    this.target = config.target;
    this.from = {};
    this.to = { ...config.to };
    this.duration = Math.max(0, config.duration);
    this.easingFn = Easing[config.easing || 'linear'];
    this.delay = config.delay || 0;
    this.onUpdate = config.onUpdate;
    this.onComplete = config.onComplete;

    for (const key of Object.keys(config.to)) {
      this.from[key] = config.target[key] ?? 0;
    }
  }

  /**
   * Advance the tween by `dt` milliseconds.
   * Returns `false` when the tween has completed.
   */
  update(dt: number): boolean {
    if (!this.isAlive) return false;
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.delay > 0) return true;
      dt = -this.delay;
      this.delay = 0;
    }

    this.elapsed += dt;
    let t = this.duration === 0 ? 1 : this.elapsed / this.duration;
    if (t > 1) t = 1;

    const eased = this.easingFn(t);

    for (const key of Object.keys(this.to)) {
      const start = this.from[key];
      const end = this.to[key];
      this.target[key] = start + (end - start) * eased;
    }

    if (this.onUpdate) {
      this.onUpdate(this.target);
    }

    if (t >= 1) {
      this.isAlive = false;
      if (this.onComplete) {
        this.onComplete(this.target);
      }
      return false;
    }
    return true;
  }

  /** Immediately finish the tween and apply final values. */
  finish(): void {
    if (!this.isAlive) return;
    for (const key of Object.keys(this.to)) {
      this.target[key] = this.to[key];
    }
    if (this.onUpdate) this.onUpdate(this.target);
    this.isAlive = false;
    if (this.onComplete) this.onComplete(this.target);
  }
}

/**
 * Global tween manager. Call `update(dt)` each frame.
 */
export class TweenManager {
  private tweens: Tween[] = [];

  add(config: TweenConfig): Tween {
    const tween = new Tween(config);
    this.tweens.push(tween);
    return tween;
  }

  update(dt: number): void {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const alive = this.tweens[i].update(dt);
      if (!alive) {
        this.tweens.splice(i, 1);
      }
    }
  }

  clear(): void {
    this.tweens = [];
  }

  get count(): number {
    return this.tweens.length;
  }
}

/**
 * Utility to tween a number and invoke a callback on each update.
 */
export function countTo(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void,
  onComplete?: () => void,
  easing?: EasingName
): Tween {
  const proxy = { value: from };
  return new Tween({
    target: proxy,
    to: { value: to },
    duration,
    easing,
    onUpdate: () => onUpdate(proxy.value),
    onComplete: () => onComplete && onComplete(),
  });
}

/**
 * Camera shake utility. Mutates a camera object `{ x, y }`.
 * Call `update(dt)` each frame and read `offsetX / offsetY`.
 */
export class CameraShake {
  public offsetX = 0;
  public offsetY = 0;
  private elapsed = 0;
  private duration: number;
  private intensity: number;
  private frequency: number;

  constructor(duration = 300, intensity = 8, frequency = 60) {
    this.duration = duration;
    this.intensity = intensity;
    this.frequency = frequency;
  }

  update(dt: number): boolean {
    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.offsetX = 0;
      this.offsetY = 0;
      return false;
    }
    const t = this.elapsed / this.duration;
    const damping = 1 - t;
    const shake = Math.sin(this.elapsed * (this.frequency / 1000) * Math.PI * 2) * this.intensity * damping;
    this.offsetX = shake * (Math.random() > 0.5 ? 1 : -1);
    this.offsetY = shake * (Math.random() > 0.5 ? 1 : -1);
    return true;
  }
}

/**
 * Quick slide-in preset for UI panels.
 */
export function slideIn(
  target: { x: number; y: number },
  fromX: number,
  fromY: number,
  duration = 400,
  onComplete?: () => void
): Tween {
  target.x = fromX;
  target.y = fromY;
  return new Tween({
    target,
    to: { x: 0, y: 0 },
    duration,
    easing: 'easeOutCubic',
    onComplete,
  });
}
