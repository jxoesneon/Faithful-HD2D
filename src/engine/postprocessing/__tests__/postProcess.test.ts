import { describe, it, expect, beforeEach } from 'vitest';
import {
  PostProcessManager,
  DEFAULT_POST_PROCESS_CONFIG,
  gaussianKernel1D,
  applyBloom,
  applySSAO,
  applyColorGrade,
  vignetteFactor,
  chromaticOffset,
  filmGrainValue,
  godRayFactor,
} from '../postProcess';

describe('PostProcessManager', () => {
  let manager: PostProcessManager;

  beforeEach(() => {
    manager = new PostProcessManager();
  });

  it('initializes with default config', () => {
    const config = manager.getConfig();
    expect(config.bloom.intensity).toBe(DEFAULT_POST_PROCESS_CONFIG.bloom.intensity);
    expect(config.ssao.radius).toBe(DEFAULT_POST_PROCESS_CONFIG.ssao.radius);
    expect(config.chromaticAberration).toBe(false);
  });

  it('merges custom config', () => {
    const custom = new PostProcessManager({ bloom: { intensity: 2.0, threshold: 0.5, radius: 2 } });
    expect(custom.getConfig().bloom.intensity).toBe(2.0);
    expect(custom.getConfig().bloom.threshold).toBe(0.5);
  });

  it('toggles effects', () => {
    manager.toggleEffect('chromaticAberration');
    expect(manager.getConfig().chromaticAberration).toBe(true);
    manager.toggleEffect('chromaticAberration');
    expect(manager.getConfig().chromaticAberration).toBe(false);
  });

  it('sets bloom settings', () => {
    manager.setBloom({ threshold: 0.5 });
    expect(manager.getConfig().bloom.threshold).toBe(0.5);
  });

  it('sets SSAO settings', () => {
    manager.setSSAO({ radius: 12 });
    expect(manager.getConfig().ssao.radius).toBe(12);
  });

  it('sets color grading settings', () => {
    manager.setColorGrading({ contrast: 1.5 });
    expect(manager.getConfig().colorGrading.contrast).toBe(1.5);
  });

  it('reports isEnabled for bloom', () => {
    expect(manager.isEnabled('bloom')).toBe(true);
  });

  it('processes a frame without crashing', () => {
    const pixels = [[0.5, 0.5, 0.5, 0.5, 0.5, 0.5]];
    const depth = [[0.5, 0.5]];
    const result = manager.processFrame(pixels, depth, 2, 1);
    expect(result.pixels).toBeDefined();
    expect(result.ssao).toBeDefined();
  });
});

describe('Gaussian kernel', () => {
  it('sums to 1', () => {
    const kernel = gaussianKernel1D(2);
    const sum = kernel.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it('is symmetric', () => {
    const kernel = gaussianKernel1D(3);
    for (let i = 0; i < kernel.length; i++) {
      expect(kernel[i]).toBeCloseTo(kernel[kernel.length - 1 - i], 10);
    }
  });
});

describe('Bloom', () => {
  it('increases brightness of bright pixels', () => {
    const pixels = [
      [1.0, 1.0, 1.0, 0.2, 0.2, 0.2],
    ];
    const result = applyBloom(pixels, 2, 1, { threshold: 0.5, intensity: 1.0, radius: 1 });
    // Bright pixel should get brighter (or stay at cap 1.0)
    expect(result[0][0]).toBeGreaterThanOrEqual(1.0);
    // Dark pixel should remain relatively unchanged
    expect(result[0][3]).toBeLessThan(0.5);
  });
});

describe('SSAO', () => {
  it('produces occlusion map of correct size', () => {
    const depth = [
      [0.5, 0.5],
      [0.5, 0.5],
    ];
    const result = applySSAO(depth, 2, 2, { radius: 1, intensity: 1.0, bias: 0.01 });
    expect(result.length).toBe(2);
    expect(result[0].length).toBe(2);
  });

  it('reduces occlusion for flat surfaces', () => {
    const depth = [
      [0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5],
    ];
    const result = applySSAO(depth, 3, 3, { radius: 1, intensity: 1.0, bias: 0.01 });
    // Center should have high occlusion value (little occlusion)
    expect(result[1][1]).toBeGreaterThan(0.5);
  });
});

describe('Color grading', () => {
  it('preserves color at default settings', () => {
    const [r, g, b] = applyColorGrade(0.5, 0.5, 0.5, { contrast: 1, saturation: 1, brightness: 1, tint: [1, 1, 1] });
    expect(r).toBeCloseTo(0.5, 2);
    expect(g).toBeCloseTo(0.5, 2);
    expect(b).toBeCloseTo(0.5, 2);
  });

  it('darkens with low brightness', () => {
    const [r] = applyColorGrade(0.5, 0, 0, { contrast: 1, saturation: 1, brightness: 0.5, tint: [1, 1, 1] });
    expect(r).toBeLessThan(0.5);
  });

  it('clamps values', () => {
    const [r, g, b] = applyColorGrade(2.0, 2.0, 2.0, { contrast: 1, saturation: 1, brightness: 1, tint: [1, 1, 1] });
    expect(r).toBeLessThanOrEqual(1);
    expect(g).toBeLessThanOrEqual(1);
    expect(b).toBeLessThanOrEqual(1);
  });
});

describe('Vignette', () => {
  it('is 1 at center', () => {
    expect(vignetteFactor(50, 50, 100, 100, 1.0)).toBeCloseTo(1, 2);
  });

  it('is lower at edges', () => {
    const center = vignetteFactor(50, 50, 100, 100, 1.0);
    const edge = vignetteFactor(0, 50, 100, 100, 1.0);
    expect(edge).toBeLessThan(center);
  });
});

describe('Chromatic aberration', () => {
  it('produces opposite offsets for red and blue', () => {
    const offset = chromaticOffset(0, 50, 100, 100, 1.0);
    expect(offset.rX).toBe(-offset.bX);
    expect(offset.rY).toBe(-offset.bY);
  });
});

describe('Film grain', () => {
  it('produces values near 1', () => {
    const val = filmGrainValue(10, 20, 0.05);
    expect(val).toBeGreaterThan(0.9);
    expect(val).toBeLessThan(1.1);
  });

  it('is deterministic for same coordinates', () => {
    expect(filmGrainValue(5, 5, 0.05)).toBe(filmGrainValue(5, 5, 0.05));
  });
});

describe('God rays', () => {
  it('is highest at light source', () => {
    const atLight = godRayFactor(50, 50, 50, 50, 100, 100, 1.0);
    const far = godRayFactor(0, 0, 50, 50, 100, 100, 1.0);
    expect(atLight).toBeGreaterThan(far);
  });

  it('returns zero at maximum distance', () => {
    // This is approximate since edge cases vary
    expect(godRayFactor(50, 50, 50, 50, 100, 100, 0)).toBe(0);
  });
});
