import * as PIXI from 'pixi.js';
import type { WaterTile, WaterSettings, Ripple } from '../../types';

// --- Water Vertex Shader ---
export const waterVertexShader = `
  attribute vec2 aPosition;
  attribute vec2 aUV;
  attribute float aDepth;
  attribute float aShoreline;

  uniform mat3 projectionMatrix;
  uniform mat3 translationMatrix;
  uniform float uTime;
  uniform float uWaveAmplitude;
  uniform float uWaveFrequency;

  varying vec2 vTextureCoord;
  varying float vWaveHeight;
  varying vec2 vWorldPos;
  varying float vDepth;
  varying float vShoreline;

  void main(void) {
    vec3 pos = vec3(aPosition, 1.0);
    float wave = sin(aPosition.x * uWaveFrequency + uTime) * uWaveAmplitude;
    float wave2 = cos(aPosition.y * uWaveFrequency * 0.8 + uTime * 1.2) * uWaveAmplitude * 0.5;
    pos.y += wave + wave2;

    vWaveHeight = wave + wave2;
    vWorldPos = aPosition;
    vTextureCoord = aUV;
    vDepth = aDepth;
    vShoreline = aShoreline;
    gl_Position = vec4((projectionMatrix * translationMatrix * pos).xy, 0.0, 1.0);
  }
`;

// --- Water Fragment Shader ---
export const waterFragmentShader = `
  precision highp float;

  varying vec2 vTextureCoord;
  varying float vWaveHeight;
  varying vec2 vWorldPos;
  varying float vDepth;
  varying float vShoreline;

  uniform float uTime;
  uniform float uWaveAmplitude;
  uniform vec3 uShallowColor;
  uniform vec3 uDeepColor;
  uniform vec3 uMurkyColor;
  uniform vec3 uSkyColor;
  uniform float uReflectionStrength;
  uniform vec3 uEntityPositions[8];
  uniform int uEntityCount;
  uniform float uFoamAmount;
  uniform float uRippleStrength;
  uniform vec2 uRippleCenters[16];
  uniform float uRippleTimes[16];
  uniform int uRippleCount;

  void main(void) {
    vec2 uv = vTextureCoord;

    // Depth-based color
    vec3 baseColor = mix(uShallowColor, uDeepColor, vDepth);
    if (vDepth > 0.85) {
      baseColor = mix(baseColor, uMurkyColor, (vDepth - 0.85) * 6.666);
    }

    // Simple sky reflection
    float reflection = uReflectionStrength * (0.5 + 0.5 * vWaveHeight / (uWaveAmplitude * 1.5 + 0.001));
    vec3 color = mix(baseColor, uSkyColor, reflection * 0.3);

    // Entity reflection approximation
    for (int i = 0; i < 8; i++) {
      if (i >= uEntityCount) break;
      float dist = length(vWorldPos - uEntityPositions[i].xy);
      if (dist < 20.0) {
        color += vec3(0.05) * (1.0 - dist / 20.0);
      }
    }

    // Foam
    if (vShoreline > 0.5) {
      float foam = sin(vWorldPos.x * 20.0 + uTime) * 0.5 + 0.5;
      foam *= sin(vWorldPos.y * 20.0 + uTime * 0.8) * 0.5 + 0.5;
      foam = smoothstep(0.3, 0.7, foam);
      color = mix(color, vec3(1.0), foam * uFoamAmount);
    }

    // Ripples
    for (int i = 0; i < 16; i++) {
      if (i >= uRippleCount) break;
      float dist = length(uv - uRippleCenters[i]);
      float ripple = sin(dist * 40.0 - uRippleTimes[i] * 5.0);
      ripple = smoothstep(0.0, 0.1, ripple) * smoothstep(0.3, 0.0, dist);
      color += vec3(0.1) * ripple * uRippleStrength;
    }

    gl_FragColor = vec4(color, 0.85);
  }
`;

export const DEFAULT_WATER_SETTINGS: WaterSettings = {
  waveAmplitude: 1.5,
  waveFrequency: 0.3,
  shallowColor: [0.4, 0.75, 0.9],
  deepColor: [0.1, 0.35, 0.7],
  murkyColor: [0.15, 0.25, 0.35],
  skyColor: [0.6, 0.75, 0.9],
  reflectionStrength: 0.4,
  foamAmount: 0.6,
  rippleDecayRate: 1.0,
  tileSize: 64,
  isoWidth: 64,
  isoHeight: 32,
};

export function classifyDepth(depth: number): WaterTile['type'] {
  if (depth <= 0.33) return 'shallow';
  if (depth <= 0.66) return 'deep';
  return 'murky';
}

export function calculateWaveDisplacement(
  x: number,
  y: number,
  time: number,
  amplitude: number,
  frequency: number
): number {
  const wave1 = Math.sin(x * frequency + time) * amplitude;
  const wave2 = Math.cos(y * frequency * 0.8 + time * 1.2) * amplitude * 0.5;
  return wave1 + wave2;
}

export function isShoreline(
  waterGrid: (WaterTile | null)[][],
  x: number,
  y: number,
  landGrid?: boolean[][]
): boolean {
  const tile = waterGrid[y]?.[x];
  if (!tile || tile.type !== 'shallow') return false;
  const neighbors = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
  for (const [nx, ny] of neighbors) {
    if (landGrid && landGrid.length > 0) {
      if (landGrid[ny]?.[nx] === true) return true;
    } else {
      const row = waterGrid[ny];
      if (row === undefined) continue;
      if (nx < 0 || nx >= row.length) continue;
      if (row[nx] === null) return true;
    }
  }
  return false;
}

export function hasWetSand(
  landGrid: boolean[][],
  waterGrid: (WaterTile | null)[][],
  x: number,
  y: number
): boolean {
  if (!landGrid[y]?.[x]) return false;
  const neighbors = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
  for (const [nx, ny] of neighbors) {
    const row = waterGrid[ny];
    if (row === undefined) continue;
    if (nx < 0 || nx >= row.length) continue;
    if (row[nx]) return true;
  }
  return false;
}

export function blendReflectionColor(
  baseColor: [number, number, number],
  skyColor: [number, number, number],
  strength: number
): [number, number, number] {
  const s = Math.max(0, Math.min(1, strength));
  const blend = s * 0.3;
  return [
    baseColor[0] + (skyColor[0] - baseColor[0]) * blend,
    baseColor[1] + (skyColor[1] - baseColor[1]) * blend,
    baseColor[2] + (skyColor[2] - baseColor[2]) * blend,
  ];
}

export class WaterRenderer {
  private app: PIXI.Application | null;
  private mesh: PIXI.Mesh | null = null;
  private shader: PIXI.Shader | null = null;
  private waterUniforms: PIXI.UniformGroup | null = null;
  private tiles: (WaterTile | null)[][] = [];
  private landGrid: boolean[][] = [];
  private ripples: Ripple[] = [];
  private settings: WaterSettings;
  private time = 0;
  private entityPositions: { x: number; y: number }[] = [];

  constructor(app: PIXI.Application | null = null, settings?: Partial<WaterSettings>) {
    this.app = app;
    this.settings = { ...DEFAULT_WATER_SETTINGS, ...settings };
  }

  public setTiles(tiles: (WaterTile | null)[][]) {
    this.tiles = tiles;
    this.mesh = null;
  }

  public setLandGrid(landGrid: boolean[][]) {
    this.landGrid = landGrid;
    this.mesh = null;
  }

  public setEntityPositions(positions: { x: number; y: number }[]) {
    this.entityPositions = positions;
    if (this.waterUniforms) {
      const u = this.waterUniforms.uniforms;
      const maxEntities = 8;
      for (let i = 0; i < maxEntities; i++) {
        if (i < this.entityPositions.length) {
          u.uEntityPositions[i * 3] = this.entityPositions[i].x;
          u.uEntityPositions[i * 3 + 1] = this.entityPositions[i].y;
          u.uEntityPositions[i * 3 + 2] = 0;
        }
      }
      u.uEntityCount = Math.min(this.entityPositions.length, maxEntities);
      this.waterUniforms.update();
    }
  }

  public splash(x: number, y: number) {
    this.ripples.push({
      x,
      y,
      time: 0,
      strength: 1.0,
    });
    if (this.ripples.length > 16) {
      this.ripples.shift();
    }
  }

  public update(dt: number) {
    this.time += dt;
    for (const ripple of this.ripples) {
      ripple.time += dt;
      ripple.strength -= this.settings.rippleDecayRate * dt;
    }
    this.ripples = this.ripples.filter((r) => r.strength > 0);

    if (this.waterUniforms) {
      const u = this.waterUniforms.uniforms;
      u.uTime = this.time;

      const maxRipples = 16;
      u.uRippleCount = Math.min(this.ripples.length, maxRipples);
      for (let i = 0; i < maxRipples; i++) {
        if (i < this.ripples.length) {
          u.uRippleCenters[i * 2] = this.ripples[i].x;
          u.uRippleCenters[i * 2 + 1] = this.ripples[i].y;
          u.uRippleTimes[i] = this.ripples[i].time;
        }
      }
      this.waterUniforms.update();
    }
  }

  public getShorelineTiles(): WaterTile[] {
    const result: WaterTile[] = [];
    for (let y = 0; y < this.tiles.length; y++) {
      const row = this.tiles[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        if (isShoreline(this.tiles, x, y, this.landGrid.length > 0 ? this.landGrid : undefined)) {
          const tile = row[x];
          if (tile) result.push(tile);
        }
      }
    }
    return result;
  }

  public getWetSandTiles(): { x: number; y: number }[] {
    const result: { x: number; y: number }[] = [];
    for (let y = 0; y < this.landGrid.length; y++) {
      const row = this.landGrid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        if (hasWetSand(this.landGrid, this.tiles, x, y)) {
          result.push({ x, y });
        }
      }
    }
    return result;
  }

  public getMesh(): PIXI.Mesh | null {
    if (this.mesh) return this.mesh;
    if (!this.app) return null;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const depths: number[] = [];
    const shorelines: number[] = [];

    let indexOffset = 0;
    const isoW = this.settings.isoWidth;
    const isoH = this.settings.isoHeight;

    for (let y = 0; y < this.tiles.length; y++) {
      const row = this.tiles[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const tile = row[x];
        if (!tile) continue;

        const cx = (x - y) * (isoW / 2);
        const cy = (x + y) * (isoH / 2);
        const hw = isoW / 2;
        const hh = isoH / 2;

        // Diamond vertices: left, top, right, bottom
        positions.push(cx - hw, cy, cx, cy - hh, cx + hw, cy, cx, cy + hh);
        uvs.push(0, 0, 0.5, 0, 1, 0, 0.5, 1);
        depths.push(tile.depth, tile.depth, tile.depth, tile.depth);
        const isShore = isShoreline(this.tiles, x, y, this.landGrid.length > 0 ? this.landGrid : undefined) ? 1.0 : 0.0;
        shorelines.push(isShore, isShore, isShore, isShore);

        indices.push(
          indexOffset, indexOffset + 1, indexOffset + 2,
          indexOffset, indexOffset + 2, indexOffset + 3
        );
        indexOffset += 4;
      }
    }

    if (positions.length === 0) return null;

    const geometry = new PIXI.MeshGeometry({
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint32Array(indices),
    });

    const depthBuffer = new PIXI.Buffer({ data: new Float32Array(depths), usage: PIXI.BufferUsage.VERTEX });
    (geometry as any).addAttribute('aDepth', { buffer: depthBuffer, format: 'float32', size: 1 });

    const shoreBuffer = new PIXI.Buffer({ data: new Float32Array(shorelines), usage: PIXI.BufferUsage.VERTEX });
    (geometry as any).addAttribute('aShoreline', { buffer: shoreBuffer, format: 'float32', size: 1 });

    const maxEntities = 8;
    const entityPositionsArr = new Float32Array(maxEntities * 3);
    for (let i = 0; i < Math.min(this.entityPositions.length, maxEntities); i++) {
      entityPositionsArr[i * 3] = this.entityPositions[i].x;
      entityPositionsArr[i * 3 + 1] = this.entityPositions[i].y;
      entityPositionsArr[i * 3 + 2] = 0;
    }

    const maxRipples = 16;
    const rippleCenters = new Float32Array(maxRipples * 2);
    const rippleTimes = new Float32Array(maxRipples);

    this.waterUniforms = new PIXI.UniformGroup({
      uTime: { value: 0.0, type: 'f32' },
      uWaveAmplitude: { value: this.settings.waveAmplitude, type: 'f32' },
      uWaveFrequency: { value: this.settings.waveFrequency, type: 'f32' },
      uShallowColor: { value: new Float32Array(this.settings.shallowColor), type: 'vec3<f32>' },
      uDeepColor: { value: new Float32Array(this.settings.deepColor), type: 'vec3<f32>' },
      uMurkyColor: { value: new Float32Array(this.settings.murkyColor), type: 'vec3<f32>' },
      uSkyColor: { value: new Float32Array(this.settings.skyColor), type: 'vec3<f32>' },
      uReflectionStrength: { value: this.settings.reflectionStrength, type: 'f32' },
      uEntityPositions: { value: entityPositionsArr, type: 'vec3<f32>' },
      uEntityCount: { value: Math.min(this.entityPositions.length, maxEntities), type: 'i32' },
      uFoamAmount: { value: this.settings.foamAmount, type: 'f32' },
      uRippleStrength: { value: 1.0, type: 'f32' },
      uRippleCenters: { value: rippleCenters, type: 'vec2<f32>' },
      uRippleTimes: { value: rippleTimes, type: 'f32' },
      uRippleCount: { value: 0, type: 'i32' },
    });

    const glProgram = PIXI.GlProgram.from({
      vertex: waterVertexShader,
      fragment: waterFragmentShader,
    });

    this.shader = new PIXI.Shader({
      glProgram,
      resources: {
        waterUniforms: this.waterUniforms,
      },
    }) as any;

    this.mesh = new PIXI.Mesh({ geometry, shader: this.shader }) as any;
    return this.mesh;
  }

  public dispose() {
    this.mesh?.destroy();
    this.mesh = null;
    this.shader = null;
    this.waterUniforms = null;
  }
}
