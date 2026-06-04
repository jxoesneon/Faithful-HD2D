import type { ECS } from '../ecs';
import type { Entity, Position } from '../../types';

export type LODLevel = 'near' | 'mid' | 'far';

export interface LODConfig {
  nearDistance: number;
  midDistance: number;
  farDistance: number;
}

export const DEFAULT_LOD_CONFIG: LODConfig = {
  nearDistance: 200,
  midDistance: 500,
  farDistance: 1000,
};

export class LODManager {
  private ecs: ECS;
  private cameraX = 0;
  private cameraY = 0;
  private config: LODConfig;

  constructor(ecs: ECS, config: Partial<LODConfig> = {}) {
    this.ecs = ecs;
    this.config = { ...DEFAULT_LOD_CONFIG, ...config };
  }

  /** Update camera position. */
  setCamera(x: number, y: number): void {
    this.cameraX = x;
    this.cameraY = y;
  }

  /** Get LOD level for an entity based on distance from camera. */
  getLODLevel(entityId: Entity): LODLevel {
    const pos = this.ecs.getComponent<Position>(entityId, 'position');
    if (!pos) return 'near';

    const dx = pos.x - this.cameraX;
    const dy = pos.y - this.cameraY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= this.config.nearDistance) return 'near';
    if (dist <= this.config.midDistance) return 'mid';
    return 'far';
  }

  /** Get all entities grouped by LOD level. */
  getEntitiesByLOD(): Record<LODLevel, Entity[]> {
    const result: Record<LODLevel, Entity[]> = { near: [], mid: [], far: [] };
    const entities = this.ecs.getEntitiesWith(['position']);
    for (const id of entities) {
      const level = this.getLODLevel(id);
      result[level].push(id);
    }
    return result;
  }

  /** Get scale factor for a LOD level (for sprite scaling). */
  getScaleForLOD(level: LODLevel): number {
    switch (level) {
      case 'near': return 1.0;
      case 'mid': return 0.75;
      case 'far': return 0.5;
    }
  }

  /** Get detail factor for a LOD level (for animation/simulation detail). */
  getDetailForLOD(level: LODLevel): number {
    switch (level) {
      case 'near': return 1.0;
      case 'mid': return 0.6;
      case 'far': return 0.3;
    }
  }

  getConfig(): LODConfig {
    return { ...this.config };
  }
}
