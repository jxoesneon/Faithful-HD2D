import { ECS } from '../ecs';
import {
  FaithSystemType,
  Faith,
  Position,
  FaithChunkData,
  Entity,
} from '../../types';

/** RGBA color mapping for each faith system (used by the visual overlay). */
export const FAITH_COLORS: Record<FaithSystemType, [number, number, number, number]> = {
  ANIMISM: [34, 139, 34, 255],      // forest green
  ELEMENTALISM: [30, 144, 255, 255], // dodger blue
  INTERVENTIONIST: [255, 215, 0, 255], // gold
  SECULAR: [169, 169, 169, 255],    // dark gray
  NIHILISM: [75, 0, 130, 255],      // indigo
};

const ALL_FAITHS: FaithSystemType[] = ['ANIMISM', 'ELEMENTALISM', 'INTERVENTIONIST', 'SECULAR', 'NIHILISM'];

/**
 * FaithFogManager maintains per-tile ideology intensity maps and computes
 * dominant religions per region, border conflicts, and visual overlay data.
 *
 * The overlay is stored as one Float32Array per {@link FaithSystemType} on a
 * fixed grid (default 64×64). Each tick the grid diffuses influence to
 * orthogonal neighbours and decays. Entities carrying a {@link Faith} component
 * act as living sources.
 */
export class FaithFogManager {
  public readonly width: number;
  public readonly height: number;
  public readonly chunkSize: number;

  /** Per-faith intensity grids (length = width * height). */
  public readonly overlays: Record<FaithSystemType, Float32Array>;
  /** Accumulated tension at each tile (border conflict intensity). */
  public readonly tensionMap: Float32Array;

  /** Portion of a tile's value that attempts to spread each tick. */
  public spreadRate = 0.15;
  /** Multiplier applied to the retained value after spreading. */
  public decay = 0.98;
  /** Minimum intensity required before a tile is considered for visualisation. */
  public intensityThreshold = 0.01;
  /** Base tension added when different faiths collide on a border. */
  public tensionBuildRate = 0.5;
  /** Tension natural decay per tick. */
  public tensionDecay = 0.95;

  private readonly tempBuffer: Float32Array;
  private readonly visualBuffer: Uint8Array;

  constructor(width = 64, height = 64, chunkSize = 5) {
    this.width = width;
    this.height = height;
    this.chunkSize = chunkSize;

    const size = width * height;
    this.overlays = {
      ANIMISM: new Float32Array(size),
      ELEMENTALISM: new Float32Array(size),
      INTERVENTIONIST: new Float32Array(size),
      SECULAR: new Float32Array(size),
      NIHILISM: new Float32Array(size),
    };
    this.tensionMap = new Float32Array(size);
    this.tempBuffer = new Float32Array(size);
    this.visualBuffer = new Uint8Array(size * 4);
  }

  /** Flat grid index from tile coordinates. */
  private idx(x: number, y: number): number {
    return y * this.width + x;
  }

  /** Clamp a coordinate to the grid bounds. */
  private clamp(v: number, max: number): number {
    return Math.max(0, Math.min(max - 1, v));
  }

  /**
   * Inject raw faith strength at a specific tile. Typically called when a
   * shrine is built or a miracle occurs.
   */
  setFaithSource(x: number, y: number, system: FaithSystemType, strength: number): void {
    const ix = this.clamp(Math.floor(x), this.width);
    const iy = this.clamp(Math.floor(y), this.height);
    const i = this.idx(ix, iy);
    this.overlays[system][i] += strength;
  }

  /** Returns the dominant {@link FaithSystemType} at a specific tile, or `SECULAR` if empty. */
  getDominantFaithAt(x: number, y: number): FaithSystemType {
    const ix = this.clamp(Math.floor(x), this.width);
    const iy = this.clamp(Math.floor(y), this.height);
    const i = this.idx(ix, iy);
    let best: FaithSystemType = 'SECULAR';
    let bestVal = 0;
    for (const f of ALL_FAITHS) {
      const v = this.overlays[f][i];
      if (v > bestVal) {
        bestVal = v;
        best = f;
      }
    }
    return best;
  }

  /** Sum intensity for a single faith on the entire grid. */
  getTotalIntensity(system: FaithSystemType): number {
    const arr = this.overlays[system];
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    return sum;
  }

  /**
   * Compute the dominant faith for a chunk coordinate.
   * Returns the dominant system and the average intensity of that system inside
   * the chunk.
   */
  getChunkDominantFaith(chunkX: number, chunkY: number): FaithChunkData {
    const startX = chunkX * this.chunkSize;
    const startY = chunkY * this.chunkSize;
    const endX = Math.min(startX + this.chunkSize, this.width);
    const endY = Math.min(startY + this.chunkSize, this.height);

    const sums: Record<FaithSystemType, number> = {
      ANIMISM: 0,
      ELEMENTALISM: 0,
      INTERVENTIONIST: 0,
      SECULAR: 0,
      NIHILISM: 0,
    };
    let count = 0;

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const i = this.idx(x, y);
        count++;
        for (const f of ALL_FAITHS) {
          sums[f] += this.overlays[f][i];
        }
      }
    }

    let best: FaithSystemType = 'SECULAR';
    let bestVal = -1;
    for (const f of ALL_FAITHS) {
      if (sums[f] > bestVal) {
        bestVal = sums[f];
        best = f;
      }
    }

    const tension = this.getChunkTension(chunkX, chunkY);
    return {
      chunkX,
      chunkY,
      dominantSystem: best,
      intensity: count > 0 ? bestVal / count : 0,
      tension,
    };
  }

  /** Average tension inside a chunk. */
  private getChunkTension(chunkX: number, chunkY: number): number {
    const startX = chunkX * this.chunkSize;
    const startY = chunkY * this.chunkSize;
    const endX = Math.min(startX + this.chunkSize, this.width);
    const endY = Math.min(startY + this.chunkSize, this.height);
    let sum = 0;
    let count = 0;
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        sum += this.tensionMap[this.idx(x, y)];
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  }

  /**
   * Scan the grid for tiles where the dominant faith differs from an
   * orthogonal neighbour. Those tiles accumulate tension and are returned as
   * conflict points.
   */
  getBorderConflicts(): Array<{
    x: number;
    y: number;
    tension: number;
    faithA: FaithSystemType;
    faithB: FaithSystemType;
  }> {
    const conflicts: Array<{ x: number; y: number; tension: number; faithA: FaithSystemType; faithB: FaithSystemType }> = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = this.idx(x, y);
        const dom = this.getDominantFaithAt(x, y);
        // Check right and down neighbours only to avoid duplicates
        const neighbors: Array<{ x: number; y: number }> = [
          { x: x + 1, y },
          { x, y: y + 1 },
        ];
        for (const n of neighbors) {
          if (n.x >= this.width || n.y >= this.height) continue;
          const other = this.getDominantFaithAt(n.x, n.y);
          if (other !== dom) {
            const t = this.tensionMap[i];
            if (t > 0.1) {
              conflicts.push({
                x,
                y,
                tension: t,
                faithA: dom,
                faithB: other,
              });
            }
          }
        }
      }
    }
    return conflicts;
  }

  /**
   * Build an RGBA Uint8Array suitable for a PIXI.js texture overlay.
   * Each pixel is blended from the dominant faith's colour weighted by its
   * intensity (plus a red channel boost for high tension).
   */
  getVisualOverlay(): Uint8Array {
    const buf = this.visualBuffer;
    const size = this.width * this.height;
    for (let i = 0; i < size; i++) {
      let best: FaithSystemType = 'SECULAR';
      let bestVal = -1;
      for (const f of ALL_FAITHS) {
        const v = this.overlays[f][i];
        if (v > bestVal) {
          bestVal = v;
          best = f;
        }
      }
      const col = FAITH_COLORS[best];
      const intensity = Math.min(1, bestVal);
      const tension = Math.min(1, this.tensionMap[i]);
      const idx4 = i * 4;
      buf[idx4 + 0] = Math.min(255, col[0] * intensity + tension * 200);
      buf[idx4 + 1] = Math.min(255, col[1] * intensity);
      buf[idx4 + 2] = Math.min(255, col[2] * intensity);
      buf[idx4 + 3] = Math.max(20, Math.floor(intensity * 200)); // minimum faint visibility
    }
    return buf;
  }

  /**
   * Diffuse faith intensity, apply decay, integrate living faith sources from
   * the ECS, and update tension on borders.
   */
  tick(dt: number, ecs: ECS): void {
    const size = this.width * this.height;

    // 1. Diffuse each faith independently
    for (const faith of ALL_FAITHS) {
      const src = this.overlays[faith];
      const dst = this.tempBuffer;
      dst.fill(0);

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const i = this.idx(x, y);
          const val = src[i];
          if (val <= 0) continue;

          const outflow = val * this.spreadRate;
          const remain = val - outflow;
          dst[i] += remain * this.decay;

          const share = outflow * 0.25;
          if (x > 0) dst[this.idx(x - 1, y)] += share;
          if (x < this.width - 1) dst[this.idx(x + 1, y)] += share;
          if (y > 0) dst[this.idx(x, y - 1)] += share;
          if (y < this.height - 1) dst[this.idx(x, y + 1)] += share;
        }
      }

      // copy back
      for (let i = 0; i < size; i++) {
        src[i] = dst[i];
      }
    }

    // 2. Inject sources from ECS entities with Faith + Position
    const faithful = ecs.getEntitiesWith(['faith', 'position']);
    for (const ent of faithful) {
      const faith = ecs.getComponent<Faith>(ent, 'faith');
      const pos = ecs.getComponent<Position>(ent, 'position');
      if (!faith || !pos) continue;
      const devotionFactor = Math.min(faith.devotion, 100) / 100;
      this.setFaithSource(pos.x, pos.y, faith.dominantSystem, devotionFactor * 2.0 * dt);
    }

    // 3. Update tension map
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = this.idx(x, y);
        let t = this.tensionMap[i] * this.tensionDecay;
        const dom = this.getDominantFaithAt(x, y);
        // Check all 4 orthogonal neighbours for differing faiths
        const checks = [
          { x: x - 1, y },
          { x: x + 1, y },
          { x, y: y - 1 },
          { x, y: y + 1 },
        ];
        for (const c of checks) {
          if (c.x < 0 || c.x >= this.width || c.y < 0 || c.y >= this.height) continue;
          const other = this.getDominantFaithAt(c.x, c.y);
          if (other !== dom) {
            t += this.tensionBuildRate * dt;
          }
        }
        this.tensionMap[i] = Math.max(0, t);
      }
    }
  }

  /** Clear all overlays and tension. */
  clear(): void {
    const size = this.width * this.height;
    for (const f of ALL_FAITHS) {
      this.overlays[f].fill(0);
    }
    this.tensionMap.fill(0);
    this.visualBuffer.fill(0);
  }

  /** Total number of chunks along the X axis. */
  get chunkCountX(): number {
    return Math.ceil(this.width / this.chunkSize);
  }

  /** Total number of chunks along the Y axis. */
  get chunkCountY(): number {
    return Math.ceil(this.height / this.chunkSize);
  }

  /** Iterate every chunk and return its summary data. */
  getAllChunkData(): FaithChunkData[] {
    const out: FaithChunkData[] = [];
    for (let cy = 0; cy < this.chunkCountY; cy++) {
      for (let cx = 0; cx < this.chunkCountX; cx++) {
        out.push(this.getChunkDominantFaith(cx, cy));
      }
    }
    return out;
  }
}
