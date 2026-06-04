import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ObjectPool } from '../objectPool';
import { SpritePool } from '../spritePool';
import { ParticlePool } from '../particlePool';

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
  scale: { set: vi.fn() },
  alpha: 1,
};

const mockSprite = {
  visible: false,
  x: 0,
  y: 0,
  rotation: 0,
  alpha: 1,
  destroy: vi.fn(),
  scale: { set: vi.fn() },
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
  Sprite: vi.fn(function () { return { ...mockSprite }; }),
}));

describe('ObjectPool', () => {
  it('acquires and releases objects', () => {
    const create = vi.fn(() => ({ id: Math.random() }));
    const pool = new ObjectPool({ create });

    const obj = pool.acquire();
    expect(create).toHaveBeenCalledTimes(1);

    pool.release(obj);
    expect(pool.stats.active).toBe(0);
    expect(pool.stats.pooled).toBe(1);
  });

  it('reuses pooled objects on acquire', () => {
    const create = vi.fn(() => ({ value: 1 }));
    const pool = new ObjectPool({ create });

    const obj1 = pool.acquire();
    pool.release(obj1);
    const obj2 = pool.acquire();

    expect(obj1).toBe(obj2);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('pre-warms the pool', () => {
    const create = vi.fn(() => ({ value: 1 }));
    const pool = new ObjectPool({ create, maxSize: 5 });

    pool.prewarm(3);
    expect(pool.stats.pooled).toBe(3);
    expect(pool.stats.totalCreated).toBe(3);
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('respects max size during pre-warm', () => {
    const create = vi.fn(() => ({ value: 1 }));
    const pool = new ObjectPool({ create, maxSize: 2 });

    pool.prewarm(5);
    expect(pool.stats.pooled).toBe(2);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('enforces max size and evicts LRU on release', () => {
    const create = vi.fn(() => ({}));
    const pool = new ObjectPool({ create, maxSize: 2 });

    const a = pool.acquire();
    const b = pool.acquire();
    const c = pool.acquire();

    pool.release(a);
    pool.release(b);
    pool.release(c);

    expect(pool.stats.pooled).toBe(2);
    expect(pool.stats.totalCreated).toBe(3);
  });

  it('executes reset callback before reuse', () => {
    const reset = vi.fn();
    const pool = new ObjectPool({
      create: () => ({ value: 0 }),
      reset,
    });

    const obj = pool.acquire();
    obj.value = 42;
    pool.release(obj);

    const obj2 = pool.acquire();
    expect(reset).toHaveBeenCalledWith(obj);
    expect(obj2).toBe(obj);
  });

  it('tracks statistics', () => {
    const pool = new ObjectPool({ create: () => ({}) });

    const a = pool.acquire();
    const b = pool.acquire();
    pool.release(a);

    expect(pool.stats.active).toBe(1);
    expect(pool.stats.pooled).toBe(1);
    expect(pool.stats.totalCreated).toBe(2);
  });
});

describe('SpritePool', () => {
  let pool: SpritePool;

  beforeEach(() => {
    pool = new SpritePool({ maxSizePerCategory: 3 });
  });

  afterEach(() => {
    pool.clear();
    vi.clearAllMocks();
  });

  it('acquires sprites per category', () => {
    const tribe = pool.acquireSprite('Tribe');
    const flora = pool.acquireSprite('Flora');

    expect(tribe).toBeDefined();
    expect(flora).toBeDefined();
    expect(tribe).not.toBe(flora);
  });

  it('isolates categories', () => {
    const tribe1 = pool.acquireSprite('Tribe');
    pool.releaseSprite(tribe1, 'Tribe');

    const flora1 = pool.acquireSprite('Flora');
    expect(flora1).not.toBe(tribe1);
  });

  it('reuses released sprites within category', () => {
    const tribe1 = pool.acquireSprite('Tribe');
    pool.releaseSprite(tribe1, 'Tribe');

    const tribe2 = pool.acquireSprite('Tribe');
    expect(tribe2).toBe(tribe1);
  });

  it('tracks per-category statistics', () => {
    pool.acquireSprite('Tribe');
    pool.acquireSprite('Tribe');

    const stats = pool.getStats('Tribe');
    expect(stats.active).toBe(2);
    expect(stats.totalCreated).toBe(2);
  });

  it('tracks all stats', () => {
    pool.acquireSprite('Tribe');
    pool.acquireSprite('Flora');

    const all = pool.getAllStats();
    expect(all.Tribe.active).toBe(1);
    expect(all.Flora.active).toBe(1);
    expect(all.Fauna.active).toBe(0);
    expect(all.Structure.active).toBe(0);
  });

  it('enforces max size per category', () => {
    const s1 = pool.acquireSprite('Tribe');
    const s2 = pool.acquireSprite('Tribe');
    const s3 = pool.acquireSprite('Tribe');

    pool.releaseSprite(s1, 'Tribe');
    pool.releaseSprite(s2, 'Tribe');
    pool.releaseSprite(s3, 'Tribe');

    expect(pool.getStats('Tribe').pooled).toBe(3);

    const s4 = pool.acquireSprite('Tribe');
    pool.releaseSprite(s4, 'Tribe');

    expect(pool.getStats('Tribe').pooled).toBe(3);
  });
});

describe('ParticlePool', () => {
  let pool: ParticlePool;

  beforeEach(() => {
    pool = new ParticlePool({ maxSize: 5 });
  });

  afterEach(() => {
    pool.clear();
    vi.clearAllMocks();
  });

  it('acquires graphics objects', () => {
    const g = pool.acquire();
    expect(g).toBeDefined();
    expect(g.visible).toBe(true);
  });

  it('releases graphics back to pool', () => {
    const g = pool.acquire();
    pool.release(g);
    expect(pool.stats.active).toBe(0);
    expect(pool.stats.pooled).toBe(1);
  });

  it('reuses graphics objects', () => {
    const g1 = pool.acquire();
    pool.release(g1);
    const g2 = pool.acquire();
    expect(g2).toBe(g1);
  });

  it('pre-warms the pool', () => {
    pool.prewarm(3);
    expect(pool.stats.pooled).toBe(3);
  });

  it('tracks statistics', () => {
    pool.acquire();
    pool.acquire();
    expect(pool.stats.active).toBe(2);
    expect(pool.stats.totalCreated).toBe(2);
  });
});
