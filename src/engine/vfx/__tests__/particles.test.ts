import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ParticleEngine, Emitter } from '../particles';
import type { EmitterConfig } from '../../../types';

const mockGraphics = {
  clear: vi.fn(),
  circle: vi.fn(),
  fill: vi.fn(),
  x: 0,
  y: 0,
  rotation: 0,
  visible: false,
  blendMode: 'normal',
  destroy: vi.fn(),
};

const mockContainer = {
  addChild: vi.fn(),
  removeChild: vi.fn(),
  destroy: vi.fn(),
  children: [] as any[],
};

vi.mock('pixi.js', () => ({
  Container: vi.fn(function () { return { ...mockContainer }; }),
  Graphics: vi.fn(function () { return { ...mockGraphics }; }),
}));

function makeConfig(overrides?: Partial<EmitterConfig>): EmitterConfig {
  return {
    name: 'test',
    spawnRate: 10,
    maxParticles: 10,
    shape: 'point',
    spawnRadius: 0,
    angle: 0,
    angleSpread: 0,
    speedMin: 0,
    speedMax: 0,
    lifeMin: 1,
    lifeMax: 1,
    sizeMin: 2,
    sizeMax: 2,
    sizeOverLife: 0.5,
    colorStart: [1, 1, 1, 1],
    colorEnd: [0, 0, 0, 0],
    gravity: [0, 0],
    drag: 0,
    blendMode: 'normal',
    ...overrides,
  };
}

describe('ParticleEngine', () => {
  let engine: ParticleEngine;

  beforeEach(() => {
    engine = new ParticleEngine();
  });

  afterEach(() => {
    engine.destroy();
    vi.clearAllMocks();
  });

  it('creates a container', () => {
    expect(engine.container).toBeDefined();
    expect(engine.emitterCount).toBe(0);
  });

  it('adds and tracks emitters', () => {
    const emitter = engine.addEmitter(makeConfig(), { x: 0, y: 0 });
    expect(engine.emitterCount).toBe(1);
    expect(emitter).toBeInstanceOf(Emitter);
  });

  it('removes emitters', () => {
    const emitter = engine.addEmitter(makeConfig(), { x: 0, y: 0 });
    engine.removeEmitter(emitter);
    expect(engine.emitterCount).toBe(0);
  });

  it('tracks active particle count', () => {
    const config = makeConfig({ burstCount: 3, maxParticles: 5 });
    engine.addEmitter(config, { x: 0, y: 0 });
    engine.update(0); // burst on creation
    expect(engine.activeParticleCount).toBe(3);
  });

  it('destroys all emitters on destroy', () => {
    engine.addEmitter(makeConfig(), { x: 0, y: 0 });
    engine.addEmitter(makeConfig(), { x: 0, y: 0 });
    engine.destroy();
    expect(engine.emitterCount).toBe(0);
  });
});

describe('Emitter', () => {
  let parent: typeof mockContainer;

  beforeEach(() => {
    parent = { ...mockContainer, children: [] };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('spawns burst particles on creation', () => {
    const config = makeConfig({ burstCount: 5, maxParticles: 10 });
    const emitter = new Emitter(config, { x: 0, y: 0 }, parent as any);
    expect(emitter.activeCount).toBe(5);
    emitter.destroy();
  });

  it('spawns particles over time', () => {
    const config = makeConfig({ spawnRate: 10, maxParticles: 5 });
    const emitter = new Emitter(config, { x: 0, y: 0 }, parent as any);
    emitter.activeCount = 0; // reset after burst if any; none because burstCount undefined
    emitter.update(0.5); // 5 particles expected at 10/sec over 0.5s
    expect(emitter.activeCount).toBeGreaterThan(0);
    emitter.destroy();
  });

  it('updates particle positions', () => {
    const config = makeConfig({
      burstCount: 1,
      maxParticles: 1,
      speedMin: 10,
      speedMax: 10,
      angle: 0,
      angleSpread: 0,
    });
    const emitter = new Emitter(config, { x: 0, y: 0 }, parent as any);
    const beforeX = (emitter as any).particles[0].x;
    emitter.update(0.1);
    const afterX = (emitter as any).particles[0].x;
    expect(afterX).toBeGreaterThan(beforeX);
    emitter.destroy();
  });

  it('kills particles after life expires', () => {
    const config = makeConfig({ burstCount: 2, maxParticles: 2, lifeMin: 0.05, lifeMax: 0.05 });
    const emitter = new Emitter(config, { x: 0, y: 0 }, parent as any);
    expect(emitter.activeCount).toBe(2);
    emitter.update(200); // way past life
    expect(emitter.activeCount).toBe(0);
    emitter.destroy();
  });

  it('obeys maxParticles limit', () => {
    const config = makeConfig({ burstCount: 20, maxParticles: 5 });
    const emitter = new Emitter(config, { x: 0, y: 0 }, parent as any);
    expect(emitter.activeCount).toBe(5);
    emitter.destroy();
  });

  it('supports setOrigin', () => {
    const config = makeConfig();
    const emitter = new Emitter(config, { x: 0, y: 0 }, parent as any);
    emitter.setOrigin(100, 200);
    expect(emitter.origin.x).toBe(100);
    expect(emitter.origin.y).toBe(200);
    emitter.destroy();
  });

  it('supports duration-based deactivation', () => {
    const config = makeConfig({ duration: 0.1, spawnRate: 100, maxParticles: 100 });
    const emitter = new Emitter(config, { x: 0, y: 0 }, parent as any);
    expect(emitter.active).toBe(true);
    emitter.update(0.2);
    expect(emitter.active).toBe(false);
    emitter.destroy();
  });
});
