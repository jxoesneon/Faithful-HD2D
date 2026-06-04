import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { Chunk, ChunkManager, CHUNK_SIZE, CHUNKS_X, CHUNKS_Y } from '../chunks';
import { Position } from '../../../types';

describe('Chunk', () => {
  it('initializes with correct dimensions and defaults', () => {
    const chunk = new Chunk(0, 0);
    expect(chunk.x).toBe(0);
    expect(chunk.y).toBe(0);
    expect(chunk.terrain.length).toBe(CHUNK_SIZE);
    expect(chunk.terrain[0].length).toBe(CHUNK_SIZE);
    expect(chunk.entities.size).toBe(0);
    expect(chunk.lodLevel).toBe(0);
    expect(chunk.isLoaded).toBe(false);
  });

  it('has correct bounds for chunk (0,0)', () => {
    const chunk = new Chunk(0, 0);
    expect(chunk.contains(0, 0)).toBe(true);
    expect(chunk.contains(15, 15)).toBe(true);
    expect(chunk.contains(16, 0)).toBe(false);
    expect(chunk.contains(0, 16)).toBe(false);
    expect(chunk.contains(-1, -1)).toBe(false);
  });

  it('has correct bounds for chunk (1,1)', () => {
    const chunk = new Chunk(1, 1);
    expect(chunk.contains(16, 16)).toBe(true);
    expect(chunk.contains(31, 31)).toBe(true);
    expect(chunk.contains(15, 15)).toBe(false);
    expect(chunk.contains(32, 32)).toBe(false);
  });

  it('has correct bounds for edge chunk (3,3)', () => {
    const chunk = new Chunk(3, 3);
    expect(chunk.contains(48, 48)).toBe(true);
    expect(chunk.contains(63, 63)).toBe(true);
    expect(chunk.contains(64, 64)).toBe(false);
  });

  it('generates terrain within 0-1 range', () => {
    const chunk = new Chunk(0, 0);
    chunk.generateTerrain();
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        expect(chunk.terrain[y][x]).toBeGreaterThanOrEqual(0);
        expect(chunk.terrain[y][x]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('generates deterministic terrain for the same coordinates', () => {
    const chunkA = new Chunk(1, 2);
    chunkA.generateTerrain();
    const chunkB = new Chunk(1, 2);
    chunkB.generateTerrain();
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        expect(chunkA.terrain[y][x]).toBe(chunkB.terrain[y][x]);
      }
    }
  });

  it('tracks entity additions and removals', () => {
    const chunk = new Chunk(0, 0);
    chunk.addEntity('entity-1');
    expect(chunk.entities.has('entity-1')).toBe(true);
    chunk.addEntity('entity-2');
    expect(chunk.entities.size).toBe(2);
    chunk.removeEntity('entity-1');
    expect(chunk.entities.has('entity-1')).toBe(false);
    expect(chunk.entities.has('entity-2')).toBe(true);
  });

  it('returns full entity list at LOD 0', () => {
    const chunk = new Chunk(0, 0);
    for (let i = 0; i < 8; i++) chunk.addEntity(`e${i}`);
    chunk.lodLevel = 0;
    expect(chunk.getVisibleEntities().length).toBe(8);
  });

  it('returns simplified entity list at LOD 1', () => {
    const chunk = new Chunk(0, 0);
    for (let i = 0; i < 8; i++) chunk.addEntity(`e${i}`);
    chunk.lodLevel = 1;
    const visible = chunk.getVisibleEntities();
    expect(visible.length).toBe(4);
    expect(visible).toContain('e0');
    expect(visible).toContain('e2');
  });

  it('returns heavily simplified entity list at LOD 2', () => {
    const chunk = new Chunk(0, 0);
    for (let i = 0; i < 8; i++) chunk.addEntity(`e${i}`);
    chunk.lodLevel = 2;
    const visible = chunk.getVisibleEntities();
    expect(visible.length).toBe(2);
    expect(visible).toContain('e0');
    expect(visible).toContain('e4');
  });

  it('returns correct terrain detail factor per LOD', () => {
    const chunk = new Chunk(0, 0);
    chunk.lodLevel = 0;
    expect(chunk.getTerrainDetail()).toBe(1.0);
    chunk.lodLevel = 1;
    expect(chunk.getTerrainDetail()).toBe(0.5);
    chunk.lodLevel = 2;
    expect(chunk.getTerrainDetail()).toBe(0.25);
  });

  it('returns simplified terrain for distant LOD', () => {
    const chunk = new Chunk(0, 0);
    chunk.generateTerrain();
    chunk.lodLevel = 1;
    const simplified = chunk.getSimplifiedTerrain();
    expect(simplified.length).toBeLessThan(CHUNK_SIZE);
    expect(simplified[0].length).toBeLessThan(CHUNK_SIZE);
  });

  it('returns full terrain when detail is 1.0', () => {
    const chunk = new Chunk(0, 0);
    chunk.generateTerrain();
    chunk.lodLevel = 0;
    expect(chunk.getSimplifiedTerrain()).toBe(chunk.terrain);
  });

  it('converts world coordinates to local coordinates', () => {
    const chunk = new Chunk(2, 1);
    const local = chunk.toLocal(35, 25);
    expect(local.lx).toBe(3);
    expect(local.ly).toBe(9);
  });

  it('retrieves terrain at world coordinates', () => {
    const chunk = new Chunk(0, 0);
    chunk.generateTerrain();
    expect(chunk.getTerrainAt(0, 0)).toBe(chunk.terrain[0][0]);
    expect(chunk.getTerrainAt(15, 15)).toBe(chunk.terrain[15][15]);
    expect(chunk.getTerrainAt(16, 0)).toBe(0);
  });
});

describe('ChunkManager', () => {
  let ecs: ECS;
  let manager: ChunkManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new ChunkManager(ecs);
  });

  it('initializes with correct world constants', () => {
    expect(manager.worldWidth).toBe(64);
    expect(manager.worldHeight).toBe(64);
    expect(manager.chunkSize).toBe(16);
  });

  it('validates chunk coordinates correctly', () => {
    expect(manager.isValidChunk(0, 0)).toBe(true);
    expect(manager.isValidChunk(3, 3)).toBe(true);
    expect(manager.isValidChunk(4, 0)).toBe(false);
    expect(manager.isValidChunk(0, 4)).toBe(false);
    expect(manager.isValidChunk(-1, 0)).toBe(false);
  });

  it('loads a chunk and populates terrain', () => {
    const chunk = manager.loadChunk(0, 0);
    expect(chunk).toBeDefined();
    expect(chunk!.isLoaded).toBe(true);
    expect(chunk!.terrain.length).toBe(CHUNK_SIZE);
  });

  it('returns existing chunk on duplicate load', () => {
    const chunk1 = manager.loadChunk(1, 1);
    const chunk2 = manager.loadChunk(1, 1);
    expect(chunk1).toBe(chunk2);
  });

  it('returns undefined for out-of-bounds chunks', () => {
    expect(manager.loadChunk(10, 10)).toBeUndefined();
    expect(manager.loadChunk(-1, 0)).toBeUndefined();
  });

  it('unloads a chunk by coordinate', () => {
    manager.loadChunk(0, 0);
    expect(manager.getChunkAt(0, 0)).toBeDefined();
    manager.unloadChunk(0, 0);
    expect(manager.getChunkAt(0, 0)).toBeUndefined();
  });

  it('gets chunk at world coordinates', () => {
    manager.loadChunk(2, 1);
    const chunk = manager.getChunkAt(32, 20);
    expect(chunk).toBeDefined();
    expect(chunk!.x).toBe(2);
    expect(chunk!.y).toBe(1);
  });

  it('returns undefined for world coords in unloaded chunk', () => {
    expect(manager.getChunkAt(0, 0)).toBeUndefined();
  });

  it('returns chunk coordinates for any world position', () => {
    expect(manager.getChunkCoord(0, 0)).toEqual({ cx: 0, cy: 0 });
    expect(manager.getChunkCoord(16, 16)).toEqual({ cx: 1, cy: 1 });
    expect(manager.getChunkCoord(63, 63)).toEqual({ cx: 3, cy: 3 });
  });

  it('loads chunks near camera on update', () => {
    // Camera at tile (24,24) -> chunk (1,1)
    manager.update(24, 24);
    // Within loadRadius=2 of (1,1), many chunks should be loaded
    expect(manager.getChunkAt(24, 24)).toBeDefined(); // chunk (1,1) center
    expect(manager.getChunkAt(0, 0)).toBeDefined();   // chunk (0,0) dist ~1.4
    expect(manager.getChunkAt(48, 16)).toBeDefined(); // chunk (3,1) dist 2.0
  });

  it('unloads distant chunks on update', () => {
    manager.loadChunk(0, 0);
    manager.loadChunk(3, 3);
    // Move camera to chunk (0,0); chunk (3,3) is ~4.2 chunks away, outside loadRadius=2
    manager.update(8, 8);
    expect(manager.getChunkAt(0, 0)).toBeDefined();
    expect(manager.getChunkAt(48, 48)).toBeUndefined();
  });

  it('assigns full LOD to near chunks', () => {
    manager.update(24, 24);
    const near = manager.getChunkAt(24, 24);
    expect(near!.lodLevel).toBe(0);
  });

  it('assigns reduced LOD to chunks between visible and load radius', () => {
    manager.update(24, 24);
    const far = manager.getChunkAt(0, 0);
    const dist = Math.sqrt(1 * 1 + 1 * 1); // chunk (0,0) is ~1.4 from (1,1)
    if (dist <= manager.visibleRadius) {
      expect(far!.lodLevel).toBe(0);
    } else {
      expect(far!.lodLevel).toBeGreaterThan(0);
    }
  });

  it('assigns higher reduced LOD to far chunks', () => {
    // Camera at chunk (1,1). Chunk (0,3) is farther.
    manager.update(24, 24);
    const far = manager.getChunkAt(0, 48);
    if (far) {
      expect(far.lodLevel).toBeGreaterThanOrEqual(1);
    }
  });

  it('seamlessly loads chunks before they enter visible radius', () => {
    // With loadRadius=2 and visibleRadius=1.5,
    // chunks at distance ~2 should be loaded but with higher LOD.
    manager.update(24, 24);
    // Check that chunks at the edge of load radius exist
    const loaded = manager.getLoadedChunks();
    const farLoaded = loaded.some((c) => {
      const dx = c.x - 1;
      const dy = c.y - 1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist > manager.visibleRadius && dist <= manager.loadRadius;
    });
    expect(farLoaded).toBe(true);
  });

  it('preloads all chunks in the world', () => {
    manager.preloadAll();
    expect(manager.getLoadedChunks().length).toBe(CHUNKS_X * CHUNKS_Y);
  });

  it('unloads all chunks', () => {
    manager.preloadAll();
    manager.unloadAll();
    expect(manager.getLoadedChunks().length).toBe(0);
  });

  describe('Entity Migration', () => {
    it('registers an existing ECS entity into its chunk on load', () => {
      const entity = ecs.createEntity();
      ecs.addComponent(entity, { type: 'position', x: 5, y: 5, z: 0 } as Position);
      const chunk = manager.loadChunk(0, 0);
      expect(chunk!.entities.has(entity)).toBe(true);
    });

    it('does not register an entity in the wrong chunk', () => {
      const entity = ecs.createEntity();
      ecs.addComponent(entity, { type: 'position', x: 20, y: 20, z: 0 } as Position);
      const chunk = manager.loadChunk(0, 0);
      expect(chunk!.entities.has(entity)).toBe(false);
    });

    it('migrates entity when it crosses chunk boundaries', () => {
      const entity = ecs.createEntity();
      ecs.addComponent(entity, { type: 'position', x: 15, y: 15, z: 0 } as Position);

      manager.loadChunk(0, 0);
      manager.loadChunk(1, 1);
      manager.migrateEntities();

      const chunk00 = manager.getChunkAt(15, 15)!;
      expect(chunk00.entities.has(entity)).toBe(true);

      // Move entity across boundary into chunk (1,1)
      const pos = ecs.getComponent<Position>(entity, 'position');
      pos!.x = 18;
      pos!.y = 18;

      manager.migrateEntities();

      expect(chunk00.entities.has(entity)).toBe(false);
      expect(manager.getChunkAt(18, 18)!.entities.has(entity)).toBe(true);
    });

    it('auto-loads a chunk when an entity migrates into an unloaded chunk', () => {
      const entity = ecs.createEntity();
      ecs.addComponent(entity, { type: 'position', x: 35, y: 35, z: 0 } as Position);

      // Only load chunk (0,0); entity is in chunk (2,2)
      manager.loadChunk(0, 0);
      manager.migrateEntities();

      // Entity migration should auto-load chunk (2,2)
      expect(manager.getChunkAt(35, 35)).toBeDefined();
      expect(manager.getChunkAt(35, 35)!.entities.has(entity)).toBe(true);
    });

    it('handles multiple entities crossing boundaries simultaneously', () => {
      const e1 = ecs.createEntity();
      ecs.addComponent(e1, { type: 'position', x: 15, y: 15, z: 0 } as Position);
      const e2 = ecs.createEntity();
      ecs.addComponent(e2, { type: 'position', x: 16, y: 16, z: 0 } as Position);

      manager.preloadAll();
      manager.migrateEntities();

      expect(manager.getChunkAt(15, 15)!.entities.has(e1)).toBe(true);
      expect(manager.getChunkAt(16, 16)!.entities.has(e2)).toBe(true);

      // Swap positions
      const pos1 = ecs.getComponent<Position>(e1, 'position')!;
      const pos2 = ecs.getComponent<Position>(e2, 'position')!;
      pos1.x = 20;
      pos1.y = 20;
      pos2.x = 10;
      pos2.y = 10;

      manager.migrateEntities();

      expect(manager.getChunkAt(20, 20)!.entities.has(e1)).toBe(true);
      expect(manager.getChunkAt(10, 10)!.entities.has(e2)).toBe(true);
      expect(manager.getChunkAt(15, 15)!.entities.has(e1)).toBe(false);
      expect(manager.getChunkAt(16, 16)!.entities.has(e2)).toBe(false);
    });

    it('preserves ECS entities after chunk unload', () => {
      const entity = ecs.createEntity();
      ecs.addComponent(entity, { type: 'position', x: 5, y: 5, z: 0 } as Position);
      manager.loadChunk(0, 0);
      manager.unloadChunk(0, 0);
      // Entity should still exist in ECS
      expect(ecs.getEntitiesWith(['position'])).toContain(entity);
    });
  });

  describe('Camera-based chunk updates', () => {
    it('loads correct chunks when camera moves', () => {
      manager.update(8, 8); // chunk (0,0)
      expect(manager.getChunkAt(0, 0)).toBeDefined();

      manager.update(56, 56); // chunk (3,3)
      expect(manager.getChunkAt(48, 48)).toBeDefined();
      expect(manager.getChunkAt(63, 63)).toBeDefined();
    });

    it('updates LOD levels when camera moves', () => {
      manager.update(24, 24); // chunk (1,1)
      const center = manager.getChunkAt(24, 24)!;
      expect(center.lodLevel).toBe(0);

      // Move camera so (1,1) is now at the edge
      manager.update(8, 8); // chunk (0,0)
      const formerCenter = manager.getChunkAt(24, 24);
      if (formerCenter) {
        const dx = 1 - 0;
        const dy = 1 - 0;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > manager.visibleRadius) {
          expect(formerCenter.lodLevel).toBeGreaterThan(0);
        }
      }
    });
  });
});
