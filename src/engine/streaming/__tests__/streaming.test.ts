import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ECS } from '../../ecs';
import { AssetLoader } from '../assetStreamer';
import { LODManager, DEFAULT_LOD_CONFIG } from '../lodManager';
import { Prefetcher } from '../prefetcher';
import type { Position } from '../../../types';

describe('AssetLoader', () => {
  let loader: AssetLoader;

  beforeEach(() => {
    loader = new AssetLoader();
    vi.restoreAllMocks();
  });

  it('caches loaded assets', async () => {
    const blob = new Blob(['test']);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) }));

    const asset1 = await loader.load('/sprite.png');
    const asset2 = await loader.load('/sprite.png');
    expect(asset1).toBe(asset2); // same cached object
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('tracks cache stats', () => {
    expect(loader.getStats().size).toBe(0);
    expect(loader.getStats().maxSize).toBe(100);
  });

  it('clears cache', () => {
    expect(loader.getStats().size).toBe(0);
    loader.clear();
    expect(loader.getStats().size).toBe(0);
  });
});

describe('LODManager', () => {
  let ecs: ECS;
  let lod: LODManager;

  beforeEach(() => {
    ecs = new ECS();
    lod = new LODManager(ecs);
  });

  function createEntity(x: number, y: number): string {
    const id = ecs.createEntity();
    ecs.addComponent(id, { type: 'position', x, y, z: 0 } as Position);
    return id;
  }

  it('classifies nearby entities as near', () => {
    lod.setCamera(0, 0);
    const e = createEntity(10, 10);
    expect(lod.getLODLevel(e)).toBe('near');
  });

  it('classifies distant entities as far', () => {
    lod.setCamera(0, 0);
    const e = createEntity(2000, 2000);
    expect(lod.getLODLevel(e)).toBe('far');
  });

  it('groups entities by LOD', () => {
    lod.setCamera(0, 0);
    createEntity(10, 0);
    createEntity(400, 0);
    createEntity(2000, 0);
    const groups = lod.getEntitiesByLOD();
    expect(groups.near.length).toBe(1);
    expect(groups.mid.length).toBe(1);
    expect(groups.far.length).toBe(1);
  });

  it('returns correct scale for each LOD', () => {
    expect(lod.getScaleForLOD('near')).toBe(1.0);
    expect(lod.getScaleForLOD('mid')).toBe(0.75);
    expect(lod.getScaleForLOD('far')).toBe(0.5);
  });

  it('returns correct detail for each LOD', () => {
    expect(lod.getDetailForLOD('near')).toBe(1.0);
    expect(lod.getDetailForLOD('mid')).toBe(0.6);
    expect(lod.getDetailForLOD('far')).toBe(0.3);
  });

  it('uses default config', () => {
    expect(lod.getConfig()).toEqual(DEFAULT_LOD_CONFIG);
  });
});

describe('Prefetcher', () => {
  let prefetcher: Prefetcher;

  beforeEach(() => {
    prefetcher = new Prefetcher();
  });

  it('predicts camera position from velocity', () => {
    prefetcher.updateCamera(0, 0, 100, 0, 1);
    const predicted = prefetcher.predictCameraPosition(100, 0);
    expect(predicted.x).toBeGreaterThan(100);
  });

  it('returns relevant zones overlapping predicted view', () => {
    prefetcher.addZone({ x: 0, y: 0, width: 100, height: 100, priority: 1, assets: ['a.png'] });
    prefetcher.addZone({ x: 1000, y: 1000, width: 100, height: 100, priority: 1, assets: ['b.png'] });

    const relevant = prefetcher.getRelevantZones(50, 50, 200, 200);
    expect(relevant.length).toBe(1);
    expect(relevant[0].assets).toContain('a.png');
  });

  it('sorts relevant zones by priority', () => {
    prefetcher.addZone({ x: 0, y: 0, width: 100, height: 100, priority: 1, assets: ['a.png'] });
    prefetcher.addZone({ x: 0, y: 0, width: 100, height: 100, priority: 5, assets: ['b.png'] });

    const relevant = prefetcher.getRelevantZones(50, 50, 200, 200);
    expect(relevant[0].assets).toContain('b.png');
  });

  it('returns assets to prefetch without duplicates', () => {
    prefetcher.addZone({ x: 0, y: 0, width: 100, height: 100, priority: 1, assets: ['a.png', 'b.png'] });
    prefetcher.addZone({ x: 0, y: 0, width: 100, height: 100, priority: 1, assets: ['b.png', 'c.png'] });

    const assets = prefetcher.getAssetsToPrefetch(50, 50, 200, 200);
    expect(assets).toContain('a.png');
    expect(assets).toContain('b.png');
    expect(assets).toContain('c.png');
    expect(assets.length).toBe(3);
  });

  it('clears zones', () => {
    prefetcher.addZone({ x: 0, y: 0, width: 100, height: 100, priority: 1, assets: ['a.png'] });
    prefetcher.clearZones();
    const assets = prefetcher.getAssetsToPrefetch(50, 50, 200, 200);
    expect(assets.length).toBe(0);
  });

  it('tracks velocity', () => {
    prefetcher.updateCamera(0, 0, 50, 25, 1);
    const vel = prefetcher.getVelocity();
    expect(vel.vx).toBe(50);
    expect(vel.vy).toBe(25);
  });
});
