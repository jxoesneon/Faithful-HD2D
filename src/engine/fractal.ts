
import { createNoise2D } from 'simplex-noise';

export class FractalDetailEngine {
  private noise2D = createNoise2D();
  private seed: string;

  constructor(seed: string = Math.random().toString()) {
    this.seed = seed;
    // Re-seed if necessary, but simplex-noise v4 uses a function approach
  }

  /**
   * Sample fractal noise at a specific coordinate with octaves
   */
  sample(x: number, y: number, octaves: number = 4, persistence: number = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    // Normalize to 0-1
    return (total / maxValue + 1) / 2;
  }

  /**
   * Get a grid of samples with a specific resolution (LOD)
   * resolution 1 = high detail (every point)
   * resolution 2 = half detail (every 2nd point)
   */
  getGrid(startX: number, startY: number, size: number, resolution: number): number[][] {
    const grid: number[][] = [];
    const steps = Math.floor(size / resolution);

    for (let x = 0; x < steps; x++) {
      grid[x] = [];
      for (let y = 0; y < steps; y++) {
        grid[x][y] = this.sample(
          (startX + x * resolution) * 0.05, 
          (startY + y * resolution) * 0.05
        );
      }
    }
    return grid;
  }
}
