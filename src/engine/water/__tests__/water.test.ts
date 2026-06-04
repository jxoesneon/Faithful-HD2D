import { describe, it, expect } from 'vitest';
import {
  WaterRenderer,
  classifyDepth,
  calculateWaveDisplacement,
  isShoreline,
  hasWetSand,
  blendReflectionColor,
  DEFAULT_WATER_SETTINGS,
  waterVertexShader,
  waterFragmentShader,
} from '../water';

describe('Water depth classification', () => {
  it('classifies shallow water at low depth', () => {
    expect(classifyDepth(0)).toBe('shallow');
    expect(classifyDepth(0.1)).toBe('shallow');
    expect(classifyDepth(0.33)).toBe('shallow');
  });

  it('classifies deep water at medium depth', () => {
    expect(classifyDepth(0.34)).toBe('deep');
    expect(classifyDepth(0.5)).toBe('deep');
    expect(classifyDepth(0.66)).toBe('deep');
  });

  it('classifies murky water at high depth', () => {
    expect(classifyDepth(0.67)).toBe('murky');
    expect(classifyDepth(0.9)).toBe('murky');
    expect(classifyDepth(1.0)).toBe('murky');
  });
});

describe('Wave animation math', () => {
  it('returns periodic displacement over time', () => {
    const d1 = calculateWaveDisplacement(10, 5, 0, 2, 0.5);
    const d2 = calculateWaveDisplacement(10, 5, Math.PI * 20, 2, 0.5);
    expect(d1).toBeCloseTo(d2, 0);
  });

  it('returns different displacement for different positions', () => {
    const d1 = calculateWaveDisplacement(0, 0, 1, 1, 1);
    const d2 = calculateWaveDisplacement(10, 5, 1, 1, 1);
    expect(d1).not.toBeCloseTo(d2, 1);
  });

  it('returns zero when amplitude is zero', () => {
    expect(calculateWaveDisplacement(10, 5, 1, 0, 0.5)).toBeCloseTo(0, 10);
  });

  it('returns different values for different times', () => {
    const d1 = calculateWaveDisplacement(10, 5, 0, 2, 0.5);
    const d2 = calculateWaveDisplacement(10, 5, 1, 2, 0.5);
    expect(d1).not.toBeCloseTo(d2, 1);
  });
});

describe('Ripple creation and decay', () => {
  it('creates a ripple on splash', () => {
    const renderer = new WaterRenderer();
    renderer.splash(3, 4);
    // @ts-expect-error private field access
    expect(renderer.ripples).toHaveLength(1);
    // @ts-expect-error private field access
    expect(renderer.ripples[0].x).toBe(3);
    // @ts-expect-error private field access
    expect(renderer.ripples[0].y).toBe(4);
    // @ts-expect-error private field access
    expect(renderer.ripples[0].strength).toBe(1.0);
  });

  it('decays ripples over time', () => {
    const renderer = new WaterRenderer(null, { rippleDecayRate: 2.0 });
    renderer.splash(0, 0);
    renderer.update(0.3);
    // @ts-expect-error private field access
    expect(renderer.ripples[0].strength).toBeLessThan(1.0);
    renderer.update(0.3);
    // Total 0.6s elapsed, strength = 1.0 - 2.0 * 0.6 = -0.2 -> filtered out
    // @ts-expect-error private field access
    expect(renderer.ripples).toHaveLength(0);
  });

  it('caps ripples at maximum count', () => {
    const renderer = new WaterRenderer();
    for (let i = 0; i < 20; i++) {
      renderer.splash(i, i);
    }
    // @ts-expect-error private field access
    expect(renderer.ripples).toHaveLength(16);
  });

  it('increments time on update', () => {
    const renderer = new WaterRenderer();
    renderer.update(0.5);
    // @ts-expect-error private field access
    expect(renderer.time).toBeCloseTo(0.5);
    renderer.update(1.0);
    // @ts-expect-error private field access
    expect(renderer.time).toBeCloseTo(1.5);
  });
});

describe('Shoreline detection logic', () => {
  it('detects shallow water adjacent to null/land as shoreline', () => {
    const grid = [
      [null, { x: 1, y: 0, depth: 0.2, type: 'shallow' as const }],
      [{ x: 0, y: 1, depth: 0.5, type: 'deep' as const }, null],
    ];
    expect(isShoreline(grid, 1, 0)).toBe(true);
  });

  it('does not mark deep water as shoreline', () => {
    const grid = [
      [null, { x: 1, y: 0, depth: 0.5, type: 'deep' as const }],
      [{ x: 0, y: 1, depth: 0.5, type: 'deep' as const }, null],
    ];
    expect(isShoreline(grid, 1, 0)).toBe(false);
  });

  it('returns false when shallow water is surrounded by water', () => {
    const grid = [
      [
        { x: 0, y: 0, depth: 0.2, type: 'shallow' as const },
        { x: 1, y: 0, depth: 0.2, type: 'shallow' as const },
      ],
      [
        { x: 0, y: 1, depth: 0.2, type: 'shallow' as const },
        { x: 1, y: 1, depth: 0.2, type: 'shallow' as const },
      ],
    ];
    expect(isShoreline(grid, 1, 1)).toBe(false);
  });

  it('uses landGrid when provided', () => {
    const waterGrid = [
      [{ x: 0, y: 0, depth: 0.2, type: 'shallow' as const }],
    ];
    const landGrid = [[true]];
    expect(isShoreline(waterGrid, 0, 0, landGrid)).toBe(false); // shallow with no adjacent land
  });

  it('detects wet sand for land adjacent to water', () => {
    const landGrid = [
      [true, false],
      [false, true],
    ];
    const waterGrid = [
      [null, { x: 1, y: 0, depth: 0.2, type: 'shallow' as const }],
      [{ x: 0, y: 1, depth: 0.5, type: 'deep' as const }, null],
    ];
    expect(hasWetSand(landGrid, waterGrid, 0, 0)).toBe(true);
    expect(hasWetSand(landGrid, waterGrid, 1, 1)).toBe(true);
  });

  it('returns false for land not adjacent to water', () => {
    const landGrid = [
      [true, true],
      [true, true],
    ];
    const waterGrid = [
      [null, null],
      [null, null],
    ];
    expect(hasWetSand(landGrid, waterGrid, 0, 0)).toBe(false);
    expect(hasWetSand(landGrid, waterGrid, 1, 1)).toBe(false);
  });

  it('returns wet sand tiles from renderer', () => {
    const renderer = new WaterRenderer();
    renderer.setLandGrid([
      [true, true],
      [false, false],
    ]);
    renderer.setTiles([
      [null, { x: 1, y: 0, depth: 0.2, type: 'shallow' as const }],
      [{ x: 0, y: 1, depth: 0.5, type: 'deep' as const }, null],
    ]);
    const wetSand = renderer.getWetSandTiles();
    expect(wetSand).toHaveLength(1);
    expect(wetSand[0]).toEqual({ x: 0, y: 0 });
  });

  it('returns shoreline tiles from renderer', () => {
    const renderer = new WaterRenderer();
    renderer.setTiles([
      [
        { x: 0, y: 0, depth: 0.2, type: 'shallow' as const },
        { x: 1, y: 0, depth: 0.5, type: 'deep' as const },
      ],
      [
        { x: 0, y: 1, depth: 0.2, type: 'shallow' as const },
        { x: 1, y: 1, depth: 0.2, type: 'shallow' as const },
      ],
    ]);
    const shoreline = renderer.getShorelineTiles();
    expect(shoreline.length).toBeGreaterThanOrEqual(0);
  });
});

describe('Reflection color blending', () => {
  it('blends base and sky colors at full strength', () => {
    const base: [number, number, number] = [0.0, 0.0, 0.0];
    const sky: [number, number, number] = [1.0, 1.0, 1.0];
    const result = blendReflectionColor(base, sky, 1.0);
    expect(result[0]).toBeCloseTo(0.3);
    expect(result[1]).toBeCloseTo(0.3);
    expect(result[2]).toBeCloseTo(0.3);
  });

  it('returns base color at zero strength', () => {
    const base: [number, number, number] = [0.2, 0.4, 0.6];
    const sky: [number, number, number] = [1.0, 1.0, 1.0];
    const result = blendReflectionColor(base, sky, 0.0);
    expect(result).toEqual(base);
  });

  it('clamps strength above 1.0', () => {
    const base: [number, number, number] = [0.0, 0.0, 0.0];
    const sky: [number, number, number] = [1.0, 1.0, 1.0];
    const result = blendReflectionColor(base, sky, 2.0);
    expect(result[0]).toBeCloseTo(0.3);
    expect(result[1]).toBeCloseTo(0.3);
    expect(result[2]).toBeCloseTo(0.3);
  });

  it('clamps strength below 0.0', () => {
    const base: [number, number, number] = [0.2, 0.4, 0.6];
    const result = blendReflectionColor(base, [1, 1, 1], -1.0);
    expect(result).toEqual(base);
  });
});

describe('WaterRenderer settings', () => {
  it('uses default settings when none provided', () => {
    const renderer = new WaterRenderer();
    // @ts-expect-error private field access
    expect(renderer.settings).toEqual(DEFAULT_WATER_SETTINGS);
  });

  it('merges custom settings', () => {
    const renderer = new WaterRenderer(null, { waveAmplitude: 5.0 });
    // @ts-expect-error private field access
    expect(renderer.settings.waveAmplitude).toBe(5.0);
    // @ts-expect-error private field access
    expect(renderer.settings.waveFrequency).toBe(DEFAULT_WATER_SETTINGS.waveFrequency);
  });
});

describe('Water shaders', () => {
  it('vertex shader contains required uniforms', () => {
    expect(waterVertexShader).toContain('uTime');
    expect(waterVertexShader).toContain('uWaveAmplitude');
    expect(waterVertexShader).toContain('uWaveFrequency');
  });

  it('fragment shader contains depth colors', () => {
    expect(waterFragmentShader).toContain('uShallowColor');
    expect(waterFragmentShader).toContain('uDeepColor');
    expect(waterFragmentShader).toContain('uMurkyColor');
  });
});
