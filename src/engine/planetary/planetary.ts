import type { CityLight, TemperatureBand } from '../../types';

export type RGBA = [number, number, number, number];

export interface SettlementInfo {
  x: number;
  y: number;
  faction: string;
  population: number;
}

export interface RenderParams {
  terrainHeight: Float32Array | number[];
  temperature: Float32Array | number[];
  seaLevel?: number;
  settlements?: SettlementInfo[];
  faithOverlay?: Uint8Array;
  nightMode?: boolean;
}

const FACTION_COLORS: Record<string, RGBA> = {
  ANIMIST: [16, 185, 129, 255],
  TECHNOCRAT: [6, 182, 212, 255],
  INTERVENTIONIST: [245, 158, 11, 255],
  NIHILIST: [139, 92, 246, 255],
  ELEMENTAL: [239, 68, 68, 255],
};

/**
 * PlanetaryView renders a top-down orthographic overview of the entire world
 * as a grid of RGBA colour values that can be drawn directly to a canvas.
 *
 * Features:
 * - Terrain heightmap (green → brown → white)
 * - Temperature band overlays
 * - Sea-level water rendering
 * - Settlement dots (faction-coloured, size ∝ population)
 * - City lights for night-side view (∝ population)
 * - Faith fog overlay
 * - Click-to-zoom region storage
 * - Camera zoom state (1.0 planetary → 0.0 isometric)
 */
export class PlanetaryView {
  public readonly width: number;
  public readonly height: number;
  public zoom: number;
  public lastClickedRegion: { x: number; y: number } | null;

  private renderBuffer: Uint8Array;

  constructor(width = 64, height = 64) {
    this.width = width;
    this.height = height;
    this.zoom = 1.0;
    this.lastClickedRegion = null;
    this.renderBuffer = new Uint8Array(width * height * 4);
  }

  /** Flatten grid coordinates to a 1-D buffer index. */
  private idx(x: number, y: number): number {
    return (y * this.width + x) * 4;
  }

  /** Clamp a coordinate to the grid bounds. */
  private clamp(v: number, max: number): number {
    return Math.max(0, Math.min(max - 1, v));
  }

  /** Write an RGBA pixel into the render buffer. */
  private setPixel(x: number, y: number, r: number, g: number, b: number, a = 255): void {
    const i = this.idx(this.clamp(x, this.width), this.clamp(y, this.height));
    this.renderBuffer[i + 0] = r;
    this.renderBuffer[i + 1] = g;
    this.renderBuffer[i + 2] = b;
    this.renderBuffer[i + 3] = a;
  }

  /** Alpha-blend `src` over the current buffer pixel at (x, y). */
  private blendPixel(x: number, y: number, r: number, g: number, b: number, a: number): void {
    const i = this.idx(this.clamp(x, this.width), this.clamp(y, this.height));
    const alpha = a / 255;
    const inv = 1 - alpha;
    this.renderBuffer[i + 0] = Math.round(this.renderBuffer[i + 0] * inv + r * alpha);
    this.renderBuffer[i + 1] = Math.round(this.renderBuffer[i + 1] * inv + g * alpha);
    this.renderBuffer[i + 2] = Math.round(this.renderBuffer[i + 2] * inv + b * alpha);
    this.renderBuffer[i + 3] = 255;
  }

  /** Draw a circular dot on the grid with the given radius (in pixels). */
  private drawDot(cx: number, cy: number, radius: number, color: RGBA): void {
    const rSq = radius * radius;
    const minX = Math.floor(cx - radius);
    const maxX = Math.ceil(cx + radius);
    const minY = Math.floor(cy - radius);
    const maxY = Math.ceil(cy + radius);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= rSq) {
          this.setPixel(x, y, color[0], color[1], color[2], color[3]);
        }
      }
    }
  }

  /** Store the last clicked region (clamped to grid). */
  click(x: number, y: number): void {
    this.lastClickedRegion = {
      x: this.clamp(Math.floor(x), this.width),
      y: this.clamp(Math.floor(y), this.height),
    };
  }

  // ---------------------------------------------------------------------------
  // Pure colour utilities
  // ---------------------------------------------------------------------------

  /** Terrain colour based on height: green (low) → brown (mid) → white (high). */
  static getTerrainColor(height: number): RGBA {
    const h = Math.max(0, Math.min(1, height));
    if (h <= 0.3) {
      const t = h / 0.3;
      return [
        Math.round(34 + (60 - 34) * t),
        Math.round(139 + (110 - 139) * t),
        Math.round(34 + (60 - 34) * t),
        255,
      ];
    }
    if (h <= 0.6) {
      const t = (h - 0.3) / 0.3;
      return [
        Math.round(60 + (139 - 60) * t),
        Math.round(110 + (69 - 110) * t),
        Math.round(60 + (19 - 60) * t),
        255,
      ];
    }
    const t = (h - 0.6) / 0.4;
    return [
      Math.round(139 + (255 - 139) * t),
      Math.round(69 + (255 - 69) * t),
      Math.round(19 + (255 - 19) * t),
      255,
    ];
  }

  /** Temperature band classification and representative colour. */
  static getTemperatureBand(temperature: number): TemperatureBand {
    const t = Math.max(0, Math.min(100, temperature));
    if (t < 20) {
      return { minTemp: 0, maxTemp: 20, classification: 'frozen', color: [200, 230, 255] };
    }
    if (t < 40) {
      return { minTemp: 20, maxTemp: 40, classification: 'cold', color: [180, 220, 200] };
    }
    if (t < 60) {
      return { minTemp: 40, maxTemp: 60, classification: 'temperate', color: [255, 255, 255] };
    }
    if (t < 80) {
      return { minTemp: 60, maxTemp: 80, classification: 'hot', color: [255, 200, 100] };
    }
    return { minTemp: 80, maxTemp: 100, classification: 'scorched', color: [255, 100, 80] };
  }

  /** Subtle temperature tint colour for blending onto terrain. */
  static getTemperatureColor(temperature: number): RGBA {
    const band = PlanetaryView.getTemperatureBand(temperature);
    return [...band.color, 80] as RGBA;
  }

  /** Water colour based on depth: shallow → deep. */
  static getWaterColor(depth: number): RGBA {
    const d = Math.max(0, Math.min(1, depth));
    return [
      Math.round(135 - 100 * d),
      Math.round(206 - 100 * d),
      Math.round(235 - 80 * d),
      255,
    ];
  }

  /** Resolve a faction string to its RGBA colour. */
  static getFactionColor(faction: string): RGBA {
    return FACTION_COLORS[faction] || [148, 163, 184, 255];
  }

  // ---------------------------------------------------------------------------
  // Feature computation
  // ---------------------------------------------------------------------------

  /**
   * Compute city lights for night-side rendering.
   * Light count is proportional to settlement population.
   */
  computeCityLights(settlements: SettlementInfo[]): CityLight[] {
    const lights: CityLight[] = [];
    for (const s of settlements) {
      const count = Math.max(1, Math.floor(s.population / 10));
      const intensity = Math.min(1, Math.max(0.1, s.population / 100));
      const radius = 2;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const dist = Math.random() * radius;
        const lx = Math.round(s.x + Math.cos(angle) * dist);
        const ly = Math.round(s.y + Math.sin(angle) * dist);
        lights.push({
          x: this.clamp(lx, this.width),
          y: this.clamp(ly, this.height),
          intensity,
          population: s.population,
        });
      }
    }
    return lights;
  }

  /** Compute settlement dot size proportional to population. */
  computeSettlementDots(settlements: SettlementInfo[]): Array<{ x: number; y: number; size: number; color: RGBA }> {
    return settlements.map((s) => ({
      x: s.x,
      y: s.y,
      size: Math.min(6, Math.max(2, Math.floor(Math.sqrt(s.population) / 3))),
      color: PlanetaryView.getFactionColor(s.faction),
    }));
  }

  /** Sample a colour from a flat RGBA buffer at (x, y). */
  sampleOverlayColor(overlay: Uint8Array, x: number, y: number): RGBA {
    const i = (y * this.width + x) * 4;
    return [overlay[i], overlay[i + 1], overlay[i + 2], overlay[i + 3]];
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  /**
   * Render the planetary view into a `width × height` RGBA `Uint8Array`.
   *
   * Rendering order:
   * 1. Terrain heightmap
   * 2. Water (sea level)
   * 3. Temperature band tint
   * 4. Faith fog overlay
   * 5. Settlement dots
   * 6. City lights (night mode only)
   */
  render(params: RenderParams): Uint8Array {
    const {
      terrainHeight,
      temperature,
      seaLevel = 0.2,
      settlements = [],
      faithOverlay,
      nightMode = false,
    } = params;

    const size = this.width * this.height;
    if (terrainHeight.length < size || temperature.length < size) {
      throw new Error('Terrain and temperature arrays must cover the full grid size.');
    }

    // Clear buffer
    this.renderBuffer.fill(0);

    // 1. Terrain + Water + Temperature
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = y * this.width + x;
        const h = terrainHeight[i] as number;
        const temp = temperature[i] as number;

        if (h < seaLevel) {
          const depth = seaLevel - h;
          const wColor = PlanetaryView.getWaterColor(depth);
          this.setPixel(x, y, wColor[0], wColor[1], wColor[2], wColor[3]);
        } else {
          const tColor = PlanetaryView.getTerrainColor(h);
          this.setPixel(x, y, tColor[0], tColor[1], tColor[2], tColor[3]);
        }

        const tint = PlanetaryView.getTemperatureColor(temp);
        this.blendPixel(x, y, tint[0], tint[1], tint[2], tint[3]);
      }
    }

    // 2. Faith fog overlay
    if (faithOverlay && faithOverlay.length >= size * 4) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const fi = (y * this.width + x) * 4;
          const fa = faithOverlay[fi + 3];
          if (fa > 0) {
            this.blendPixel(x, y, faithOverlay[fi], faithOverlay[fi + 1], faithOverlay[fi + 2], fa);
          }
        }
      }
    }

    // 3. Settlement dots
    const dots = this.computeSettlementDots(settlements);
    for (const dot of dots) {
      this.drawDot(dot.x, dot.y, dot.size, dot.color);
    }

    // 4. City lights (night mode)
    if (nightMode) {
      const lights = this.computeCityLights(settlements);
      const lightColor: RGBA = [255, 220, 100, 255];
      for (const light of lights) {
        const glowSize = Math.max(1, Math.round(light.intensity * 2));
        this.drawDot(light.x, light.y, glowSize, lightColor);
      }
    }

    return new Uint8Array(this.renderBuffer);
  }

  /** Convenience accessor to inspect a rendered pixel. */
  getPixel(buffer: Uint8Array, x: number, y: number): RGBA {
    const i = (y * this.width + x) * 4;
    return [buffer[i], buffer[i + 1], buffer[i + 2], buffer[i + 3]];
  }
}
