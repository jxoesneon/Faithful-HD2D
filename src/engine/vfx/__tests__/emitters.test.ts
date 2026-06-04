import { describe, it, expect } from 'vitest';
import {
  EMITTER_REGISTRY,
  meteorTrailConfig,
  healSparklesConfig,
  lightningArcConfig,
  shieldBubbleConfig,
  rainConfig,
  snowConfig,
  dustConfig,
  embersConfig,
  firefliesConfig,
  pollenConfig,
  magicDustConfig,
  bloodSprayConfig,
  blockSparksConfig,
  deathDissolveConfig,
} from '../emitters';

describe('Emitter presets', () => {
  it('has all named presets in registry', () => {
    expect(EMITTER_REGISTRY.meteorTrail).toBeDefined();
    expect(EMITTER_REGISTRY.healSparkles).toBeDefined();
    expect(EMITTER_REGISTRY.lightningArc).toBeDefined();
    expect(EMITTER_REGISTRY.shieldBubble).toBeDefined();
    expect(EMITTER_REGISTRY.rain).toBeDefined();
    expect(EMITTER_REGISTRY.snow).toBeDefined();
    expect(EMITTER_REGISTRY.dust).toBeDefined();
    expect(EMITTER_REGISTRY.embers).toBeDefined();
    expect(EMITTER_REGISTRY.fireflies).toBeDefined();
    expect(EMITTER_REGISTRY.pollen).toBeDefined();
    expect(EMITTER_REGISTRY.magicDust).toBeDefined();
    expect(EMITTER_REGISTRY.bloodSpray).toBeDefined();
    expect(EMITTER_REGISTRY.blockSparks).toBeDefined();
    expect(EMITTER_REGISTRY.deathDissolve).toBeDefined();
  });

  it('each preset has valid numeric ranges', () => {
    Object.values(EMITTER_REGISTRY).forEach((config) => {
      expect(config.spawnRate).toBeGreaterThan(0);
      expect(config.maxParticles).toBeGreaterThan(0);
      expect(config.lifeMin).toBeGreaterThan(0);
      expect(config.lifeMax).toBeGreaterThanOrEqual(config.lifeMin);
      expect(config.speedMax).toBeGreaterThanOrEqual(config.speedMin);
      expect(config.sizeMax).toBeGreaterThanOrEqual(config.sizeMin);
      expect(config.colorStart.length).toBe(4);
      expect(config.colorEnd.length).toBe(4);
    });
  });

  it('exports individual configs matching registry', () => {
    expect(meteorTrailConfig.name).toBe('meteorTrail');
    expect(healSparklesConfig.name).toBe('healSparkles');
    expect(lightningArcConfig.name).toBe('lightningArc');
    expect(shieldBubbleConfig.name).toBe('shieldBubble');
    expect(rainConfig.name).toBe('rain');
    expect(snowConfig.name).toBe('snow');
    expect(dustConfig.name).toBe('dust');
    expect(embersConfig.name).toBe('embers');
    expect(firefliesConfig.name).toBe('fireflies');
    expect(pollenConfig.name).toBe('pollen');
    expect(magicDustConfig.name).toBe('magicDust');
    expect(bloodSprayConfig.name).toBe('bloodSpray');
    expect(blockSparksConfig.name).toBe('blockSparks');
    expect(deathDissolveConfig.name).toBe('deathDissolve');
  });
});
