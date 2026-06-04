import { ECS } from '../ecs';
import { Entity, Position } from '../../types';

export const CHUNK_SIZE = 16;
export const WORLD_WIDTH = 64;
export const WORLD_HEIGHT = 64;
export const CHUNKS_X = WORLD_WIDTH / CHUNK_SIZE; // 4
export const CHUNKS_Y = WORLD_HEIGHT / CHUNK_SIZE; // 4

/** Deterministic pseudo-random helper for terrain generation. */
function hash2D(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h & 0x7fffffff) / 0x7fffffff;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const a = hash2D(ix, iy);
  const b = hash2D(ix + 1, iy);
  const c = hash2D(ix, iy + 1);
  const d = hash2D(ix + 1, iy + 1);

  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);

  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

/** A 16x16 segment of the world containing terrain and entities. */
export class Chunk {
  /** Chunk grid coordinate (0..3 for a 64x64 world). */
  x: number;
  y: number;
  /** 16x16 terrain height values (0-1). */
  terrain: number[][];
  /** Entities currently residing in this chunk. */
  entities: Set<Entity>;
  /** Level of detail: 0 = full, 1 = medium, 2 = low. */
  lodLevel: number;
  /** Whether this chunk has completed loading. */
  isLoaded: boolean;
  /** Last time this chunk was accessed (for LRU eviction if needed). */
  lastAccessed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.terrain = Array.from({ length: CHUNK_SIZE }, () => Array(CHUNK_SIZE).fill(0));
    this.entities = new Set();
    this.lodLevel = 0;
    this.isLoaded = false;
    this.lastAccessed = 0;
  }

  /** Populate terrain using a deterministic smooth-noise function. */
  generateTerrain(): void {
    const worldBaseX = this.x * CHUNK_SIZE;
    const worldBaseY = this.y * CHUNK_SIZE;
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = worldBaseX + lx;
        const wy = worldBaseY + ly;
        // Layered noise for richer terrain
        let h = smoothNoise(wx * 0.08, wy * 0.08) * 0.6;
        h += smoothNoise(wx * 0.2, wy * 0.2) * 0.3;
        h += smoothNoise(wx * 0.5, wy * 0.5) * 0.1;
        this.terrain[ly][lx] = Math.max(0, Math.min(1, h));
      }
    }
  }

  /** Add an entity to this chunk's residency list. */
  addEntity(entity: Entity): void {
    this.entities.add(entity);
  }

  /** Remove an entity from this chunk's residency list. */
  removeEntity(entity: Entity): void {
    this.entities.delete(entity);
  }

  /** Check if a world tile coordinate falls inside this chunk. */
  contains(worldX: number, worldY: number): boolean {
    const left = this.x * CHUNK_SIZE;
    const top = this.y * CHUNK_SIZE;
    const right = left + CHUNK_SIZE - 1;
    const bottom = top + CHUNK_SIZE - 1;
    return worldX >= left && worldX <= right && worldY >= top && worldY <= bottom;
  }

  /** Return chunk-local coordinates for a world position. */
  toLocal(worldX: number, worldY: number): { lx: number; ly: number } {
    return {
      lx: worldX - this.x * CHUNK_SIZE,
      ly: worldY - this.y * CHUNK_SIZE,
    };
  }

  /** Return terrain height at a world coordinate (or 0 if out of bounds). */
  getTerrainAt(worldX: number, worldY: number): number {
    const { lx, ly } = this.toLocal(worldX, worldY);
    if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_SIZE) return 0;
    return this.terrain[ly][lx];
  }

  /** Return visible entities based on current LOD level. */
  getVisibleEntities(): Entity[] {
    const all = Array.from(this.entities);
    if (this.lodLevel === 0) return all;
    if (this.lodLevel === 1) return all.filter((_, i) => i % 2 === 0);
    return all.filter((_, i) => i % 4 === 0);
  }

  /** Return the effective terrain detail factor (1.0 = full detail). */
  getTerrainDetail(): number {
    if (this.lodLevel === 0) return 1.0;
    if (this.lodLevel === 1) return 0.5;
    return 0.25;
  }

  /** Simplify terrain for distant viewing by skipping samples. */
  getSimplifiedTerrain(): number[][] {
    const detail = this.getTerrainDetail();
    if (detail >= 1.0) return this.terrain;
    const step = Math.max(1, Math.round(1 / detail));
    const simplified: number[][] = [];
    for (let ly = 0; ly < CHUNK_SIZE; ly += step) {
      const row: number[] = [];
      for (let lx = 0; lx < CHUNK_SIZE; lx += step) {
        row.push(this.terrain[ly][lx]);
      }
      simplified.push(row);
    }
    return simplified;
  }
}

/** Manages the 4x4 chunk grid, loading/unloading and LOD based on camera position. */
export class ChunkManager {
  private chunks = new Map<string, Chunk>();
  private _ecs: ECS;
  chunkSize = CHUNK_SIZE;
  worldWidth = WORLD_WIDTH;
  worldHeight = WORLD_HEIGHT;
  /** How many chunks around the camera to keep loaded. */
  loadRadius = 2;
  /** How many chunks around the camera are considered "visible" (full detail). */
  visibleRadius = 1.5;
  private time = 0;

  constructor(ecs: ECS) {
    this._ecs = ecs;
  }

  private getKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  /** Check if chunk coordinates are within the world bounds. */
  isValidChunk(cx: number, cy: number): boolean {
    return cx >= 0 && cy >= 0 && cx < CHUNKS_X && cy < CHUNKS_Y;
  }

  /**
   * Create and populate a chunk at the given chunk coordinates.
   * If the chunk is already loaded, return the existing instance.
   */
  loadChunk(cx: number, cy: number): Chunk | undefined {
    if (!this.isValidChunk(cx, cy)) return undefined;

    const key = this.getKey(cx, cy);
    if (this.chunks.has(key)) {
      const existing = this.chunks.get(key)!;
      existing.lastAccessed = this.time;
      return existing;
    }

    const chunk = new Chunk(cx, cy);
    chunk.generateTerrain();
    chunk.isLoaded = true;
    chunk.lastAccessed = this.time;

    // Scan ECS for existing entities that belong to this chunk
    const allEntities = this._ecs.getEntitiesWith(['position']);
    for (const entity of allEntities) {
      const pos = this._ecs.getComponent<Position>(entity, 'position');
      if (pos && chunk.contains(pos.x, pos.y)) {
        chunk.addEntity(entity);
      }
    }

    this.chunks.set(key, chunk);
    return chunk;
  }

  /** Remove a chunk from the loaded set. Entities remain in the global ECS. */
  unloadChunk(cx: number, cy: number): void {
    const key = this.getKey(cx, cy);
    const chunk = this.chunks.get(key);
    if (chunk) {
      chunk.isLoaded = false;
      this.chunks.delete(key);
    }
  }

  /** Get the loaded chunk that contains the given world tile coordinates. */
  getChunkAt(worldX: number, worldY: number): Chunk | undefined {
    const cx = Math.floor(worldX / this.chunkSize);
    const cy = Math.floor(worldY / this.chunkSize);
    return this.chunks.get(this.getKey(cx, cy));
  }

  /** Resolve chunk coordinates for a world position without requiring the chunk to be loaded. */
  getChunkCoord(worldX: number, worldY: number): { cx: number; cy: number } {
    return {
      cx: Math.floor(worldX / this.chunkSize),
      cy: Math.floor(worldY / this.chunkSize),
    };
  }

  /** Return all currently loaded chunks. */
  getLoadedChunks(): Chunk[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Update chunk loading, unloading, LOD, and entity migration
   * based on the current camera position (in tile coordinates).
   */
  update(cameraX: number, cameraY: number): void {
    this.time++;

    const camCX = Math.floor(cameraX / this.chunkSize);
    const camCY = Math.floor(cameraY / this.chunkSize);

    const radiusCeil = Math.ceil(this.loadRadius);

    // Load chunks inside the load radius and assign LOD
    for (let dy = -radiusCeil; dy <= radiusCeil; dy++) {
      for (let dx = -radiusCeil; dx <= radiusCeil; dx++) {
        const cx = camCX + dx;
        const cy = camCY + dy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.loadRadius && this.isValidChunk(cx, cy)) {
          const chunk = this.loadChunk(cx, cy);
          if (chunk) {
            if (dist <= this.visibleRadius) {
              chunk.lodLevel = 0;
            } else if (dist <= this.visibleRadius + 0.5) {
              chunk.lodLevel = 1;
            } else {
              chunk.lodLevel = 2;
            }
          }
        }
      }
    }

    // Unload chunks outside the load radius
    for (const [key, chunk] of this.chunks) {
      const dx = chunk.x - camCX;
      const dy = chunk.y - camCY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.loadRadius) {
        this.unloadChunk(chunk.x, chunk.y);
      }
    }

    // Migrate entities that have crossed chunk boundaries
    this.migrateEntities();
  }

  /**
   * Scan all ECS entities with a position and ensure each one
   * is registered in the correct loaded chunk. If a chunk is not
   * loaded for an entity, auto-load it so nothing is lost.
   */
  migrateEntities(): void {
    // Clear entity lists so we can rebuild them
    for (const chunk of this.chunks.values()) {
      chunk.entities.clear();
    }

    const allEntities = this._ecs.getEntitiesWith(['position']);
    for (const entity of allEntities) {
      const pos = this._ecs.getComponent<Position>(entity, 'position');
      if (!pos) continue;

      const cx = Math.floor(pos.x / this.chunkSize);
      const cy = Math.floor(pos.y / this.chunkSize);

      let chunk = this.chunks.get(this.getKey(cx, cy));
      if (!chunk && this.isValidChunk(cx, cy)) {
        // Auto-load the chunk so the entity isn't orphaned
        chunk = this.loadChunk(cx, cy);
      }

      if (chunk) {
        chunk.addEntity(entity);
      }
    }
  }

  /** Preload all chunks in the world (useful for small 64x64 maps). */
  preloadAll(): void {
    for (let cy = 0; cy < CHUNKS_Y; cy++) {
      for (let cx = 0; cx < CHUNKS_X; cx++) {
        this.loadChunk(cx, cy);
      }
    }
  }

  /** Remove every loaded chunk. Entities remain in ECS. */
  unloadAll(): void {
    this.chunks.clear();
  }
}
