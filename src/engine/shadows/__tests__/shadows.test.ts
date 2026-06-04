import { describe, it, expect, beforeEach } from 'vitest';
import {
  ShadowMapManager,
  createShadowCaster,
  buildShadowCasterState,
  DEFAULT_SHADOW_SETTINGS,
} from '../shadows';

describe('ShadowMapManager', () => {
  let manager: ShadowMapManager;

  beforeEach(() => {
    manager = new ShadowMapManager();
  });

  const noonSun = { x: 0.2, y: 0.95, z: 0.1 };
  const belowHorizonSun = { x: 0.5, y: -0.2, z: 0.1 };

  describe('createShadowCaster', () => {
    it('creates a default shadow caster', () => {
      const caster = createShadowCaster();
      expect(caster.type).toBe('shadowCaster');
      expect(caster.width).toBe(24);
      expect(caster.height).toBe(12);
      expect(caster.castHeight).toBe(16);
      expect(caster.isStatic).toBe(false);
      expect(caster.category).toBe('Structure');
    });

    it('accepts custom options', () => {
      const caster = createShadowCaster({ width: 40, height: 20, castHeight: 32, isStatic: true, category: 'Tribe' });
      expect(caster.width).toBe(40);
      expect(caster.isStatic).toBe(true);
      expect(caster.category).toBe('Tribe');
    });
  });

  describe('buildShadowCasterState', () => {
    it('combines component with position and id', () => {
      const caster = createShadowCaster({ width: 10, height: 5 });
      const state = buildShadowCasterState('e1', caster, 50, 60);
      expect(state.entityId).toBe('e1');
      expect(state.x).toBe(50);
      expect(state.y).toBe(60);
      expect(state.width).toBe(10);
    });
  });

  describe('computeIntensity', () => {
    it('returns zero when sun is below horizon', () => {
      const intensity = manager.computeIntensity(belowHorizonSun, 720);
      expect(intensity).toBe(0);
    });

    it('returns positive intensity at noon', () => {
      const intensity = manager.computeIntensity(noonSun, 720);
      expect(intensity).toBeGreaterThan(0);
      expect(intensity).toBeLessThanOrEqual(1);
    });

    it('returns zero at night', () => {
      const intensity = manager.computeIntensity(noonSun, 0);
      expect(intensity).toBe(0);
    });

    it('scales intensity during twilight', () => {
      const earlyMorning = manager.computeIntensity(noonSun, 390);
      const midday = manager.computeIntensity(noonSun, 720);
      expect(earlyMorning).toBeLessThan(midday);
    });
  });

  describe('computeShadowDirection', () => {
    it('returns a direction vector', () => {
      const dir = manager.computeShadowDirection(noonSun);
      expect(typeof dir.dx).toBe('number');
      expect(typeof dir.dy).toBe('number');
    });
  });

  describe('computeShadowLength', () => {
    it('is longer when sun is low', () => {
      const lowSun = { x: 0.5, y: 0.1, z: 0.1 };
      const highSun = { x: 0.2, y: 0.95, z: 0.1 };
      const lowLen = manager.computeShadowLength(lowSun, 16);
      const highLen = manager.computeShadowLength(highSun, 16);
      expect(lowLen).toBeGreaterThan(highLen);
    });

    it('is capped at maximum', () => {
      const len = manager.computeShadowLength({ x: 0, y: 0.01, z: 0 }, 100);
      expect(len).toBeLessThanOrEqual(DEFAULT_SHADOW_SETTINGS.shadowLengthMultiplier * 3);
    });
  });

  describe('calculatePCFKernel', () => {
    it('returns larger kernel for longer shadows', () => {
      const shortLen = manager.calculatePCFKernel(10);
      const longLen = manager.calculatePCFKernel(200);
      expect(longLen).toBeGreaterThanOrEqual(shortLen);
    });

    it('is at least 1', () => {
      expect(manager.calculatePCFKernel(0)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('buildShadowVertices', () => {
    it('produces a vertex array', () => {
      const caster = buildShadowCasterState('e1', createShadowCaster(), 0, 0);
      const result = manager.buildShadowVertices(caster, noonSun);
      expect(result.vertices.length).toBeGreaterThan(0);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('isNearCamera', () => {
    it('returns true for nearby casters', () => {
      const caster = buildShadowCasterState('e1', createShadowCaster(), 0, 0);
      expect(manager.isNearCamera(caster, { x: 0, y: 0 }, 100)).toBe(true);
    });

    it('returns false for distant casters', () => {
      const caster = buildShadowCasterState('e1', createShadowCaster(), 500, 500);
      expect(manager.isNearCamera(caster, { x: 0, y: 0 }, 100)).toBe(false);
    });
  });

  describe('getStats', () => {
    it('starts with zero active shadows', () => {
      const stats = manager.getStats();
      expect(stats.activeShadows).toBe(0);
      expect(stats.pooledGraphics).toBe(0);
    });
  });
});
