import { WindState, VegetationSway } from '../../types';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Simple string hash producing a value in [0, 1). */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10007) / 10007;
}

export interface Gust {
  startTime: number;
  duration: number;
  strength: number;
}

/**
 * Manages global and local wind dynamics with Perlin-like noise variation
 * and occasional gust events.
 */
export class WindSystem {
  private time = 0;
  private baseDirection = 0; // radians
  private baseStrength = 0.3; // 0-1
  private gusts: Gust[] = [];
  private gustTimer = 0;
  private nextGustIn = 5;

  /** Advance wind simulation by `dt` seconds. */
  update(dt: number): void {
    this.time += dt;

    // Evolve base direction with multiple sine waves (pseudo-noise)
    this.baseDirection =
      Math.sin(this.time * 0.15) * 0.8 +
      Math.sin(this.time * 0.07) * 0.4 +
      Math.sin(this.time * 0.03) * 0.2;

    // Evolve base strength with layered frequencies
    this.baseStrength =
      0.25 +
      0.15 * Math.sin(this.time * 0.25) +
      0.1 * Math.sin(this.time * 0.11) +
      0.05 * Math.sin(this.time * 0.04);
    this.baseStrength = clamp(this.baseStrength, 0, 1);

    // Gust spawning
    this.gustTimer += dt;
    if (this.gustTimer >= this.nextGustIn) {
      this.spawnGust();
      this.gustTimer = 0;
      this.nextGustIn = 5 + Math.random() * 15; // 5–20 seconds
    }

    // Expire old gusts
    this.gusts = this.gusts.filter(
      (g) => this.time - g.startTime < g.duration
    );
  }

  /** Get the global wind vector (direction + strength). */
  getGlobalWind(): WindState {
    return {
      direction: this.baseDirection,
      strength: clamp(this.baseStrength + this.getGustStrength(), 0, 1),
    };
  }

  /** Get local wind variation at a world position. */
  getWindAt(x: number, y: number): WindState {
    const localDirOffset =
      Math.sin(x * 0.12 + this.time * 0.06) * 0.25 +
      Math.cos(y * 0.08 + this.time * 0.04) * 0.25;

    const localStrMod =
      Math.sin(x * 0.05 + y * 0.05 + this.time * 0.1) * 0.08 +
      Math.cos(x * 0.03 - y * 0.07 + this.time * 0.05) * 0.05;

    return {
      direction: this.baseDirection + localDirOffset,
      strength: clamp(
        this.baseStrength + localStrMod + this.getGustStrength(),
        0,
        1
      ),
    };
  }

  /** Calculate sway displacement for a specific plant entity. */
  getSwayAmount(
    entityId: string,
    plantHeightFactor = 1.0
  ): VegetationSway {
    const wind = this.getGlobalWind();
    const hash = hashString(entityId);
    const phase = hash * Math.PI * 2;
    const frequency = 1.2 + hash * 0.6; // 1.2–1.8 Hz variation per plant

    const swayMag =
      Math.sin(this.time * frequency + phase) *
      wind.strength *
      plantHeightFactor;

    return {
      swayX: swayMag * Math.cos(wind.direction),
      swayY: swayMag * 0.2 * Math.sin(wind.direction),
      swayRot: swayMag * 0.08,
    };
  }

  /** Exposed for testing / inspection. */
  getActiveGusts(): readonly Gust[] {
    return this.gusts;
  }

  /** Inject a gust directly (useful for tests). */
  addGust(gust: Gust): void {
    this.gusts.push(gust);
  }

  private spawnGust(): void {
    const duration = 2 + Math.random() * 4; // 2–6 seconds
    const strength = 0.2 + Math.random() * 0.5; // 0.2–0.7 added strength
    this.gusts.push({
      startTime: this.time,
      duration,
      strength,
    });
  }

  private getGustStrength(): number {
    let total = 0;
    for (const g of this.gusts) {
      const elapsed = this.time - g.startTime;
      const t = elapsed / g.duration;
      // Spike envelope: full strength at start, linear decay to zero
      const envelope = Math.max(0, 1 - t);
      total += g.strength * envelope;
    }
    return total;
  }
}
