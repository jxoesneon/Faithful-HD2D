import { ECS } from '../ecs';
import {
  Flora,
  Fauna,
  Position,
  FloraLifecycle,
  FaunaLifecycle,
  FloraLifecycleStage,
  FaunaLifecycleStage,
  SoilCell,
  FireState,
} from '../../types';

const FLORA_GROWTH_RATES: Record<string, number> = {
  CROP: 0.15,
  NANO_BANANA: 0.12,
  EXOTIC: 0.08,
  TREE: 0.05,
};

const FAUNA_LIFESPAN_MINUTES: Record<string, number> = {
  WOLF: 2880, // 2 game days
  STAG: 2160,
  COW: 4320,
  CELESTIAL: 5760,
};

const REPRODUCTION_AGE_MINUTES: Record<string, number> = {
  WOLF: 720,
  STAG: 480,
  COW: 600,
  CELESTIAL: 1440,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function dist(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Manages flora/fauna lifecycles, predator-prey dynamics, soil nutrients,
 * and fire ecology.
 */
export class EcologyManager {
  private soils = new Map<string, SoilCell>();
  private fires: FireState[] = [];

  constructor(private ecs: ECS) {}

  /** Main tick: advance ecology by `dt` game minutes. */
  update(dt: number): void {
    this.updateFlora(dt);
    this.updateFauna(dt);
    this.updatePredatorPrey(dt);
    this.updateSoil(dt);
    this.updateFire(dt);
  }

  // ---------------------------------------------------------------------------
  // Flora Lifecycle
  // ---------------------------------------------------------------------------

  private updateFlora(dt: number): void {
    const floraIds = this.ecs.getEntitiesWith(['flora']);
    for (const id of floraIds) {
      const flora = this.ecs.getComponent<Flora>(id, 'flora');
      const pos = this.ecs.getComponent<Position>(id, 'position');
      if (!flora || !pos) continue;

      const lifecycle = this.getOrCreateFloraLifecycle(id);
      lifecycle.ageMinutes += dt;

      const growthRate = FLORA_GROWTH_RATES[flora.category] ?? 0.1;
      const soil = this.getSoilAt(Math.round(pos.x), Math.round(pos.y));

      // Soil nutrients and moisture affect growth
      const soilFactor = (soil.nutrients / 100) * (soil.moisture / 100) + soil.ashFertility;
      const effectiveGrowthRate = growthRate * soilFactor;

      switch (lifecycle.stage) {
        case 'SEED':
          flora.growth = clamp(flora.growth + effectiveGrowthRate * dt, 0, 10);
          if (flora.growth >= 10) {
            lifecycle.stage = 'SPROUT';
          }
          break;
        case 'SPROUT':
          flora.growth = clamp(flora.growth + effectiveGrowthRate * dt, 0, 40);
          if (flora.growth >= 40) {
            lifecycle.stage = 'MATURE';
          }
          break;
        case 'MATURE':
          flora.growth = clamp(flora.growth + effectiveGrowthRate * dt * 0.5, 0, 90);
          if (flora.growth >= 90) {
            lifecycle.stage = 'DECAYING';
          }
          break;
        case 'DECAYING':
          lifecycle.decayProgress += (dt / 60); // takes ~60 min to fully decay
          flora.growth = clamp(flora.growth - 0.05 * dt, 0, 100);
          if (lifecycle.decayProgress >= 1 || flora.growth <= 0) {
            lifecycle.stage = 'DEAD';
            flora.growth = 0;
            lifecycle.seedDropTimer = 30; // seeds drop in 30 min
          }
          break;
        case 'DEAD':
          lifecycle.seedDropTimer -= dt;
          if (lifecycle.seedDropTimer <= 0) {
            // Respawn as seed (reset)
            this.resetFloraToSeed(id, flora, lifecycle);
          }
          break;
      }

      // Deplete soil as flora consumes nutrients
      if (lifecycle.stage === 'SPROUT' || lifecycle.stage === 'MATURE') {
        soil.nutrients = clamp(soil.nutrients - 0.01 * dt, 0, 100);
        soil.moisture = clamp(soil.moisture - 0.02 * dt, 0, 100);
        this.setSoilAt(soil.x, soil.y, soil);
      }
    }
  }

  private getOrCreateFloraLifecycle(entityId: string): FloraLifecycle {
    const existing = this.ecs.getComponent<FloraLifecycle>(entityId, 'floraLifecycle');
    if (existing) return existing;

    const lifecycle: FloraLifecycle = {
      type: 'floraLifecycle',
      stage: 'SEED',
      ageMinutes: 0,
      seedDropTimer: 0,
      decayProgress: 0,
    };
    this.ecs.addComponent(entityId, lifecycle);
    return lifecycle;
  }

  private resetFloraToSeed(entityId: string, flora: Flora, lifecycle: FloraLifecycle): void {
    flora.growth = 0;
    flora.isHarvested = false;
    lifecycle.stage = 'SEED';
    lifecycle.ageMinutes = 0;
    lifecycle.decayProgress = 0;
    lifecycle.seedDropTimer = 0;
  }

  // ---------------------------------------------------------------------------
  // Fauna Lifecycle
  // ---------------------------------------------------------------------------

  private updateFauna(dt: number): void {
    const faunaIds = this.ecs.getEntitiesWith(['fauna']);
    for (const id of faunaIds) {
      const fauna = this.ecs.getComponent<Fauna>(id, 'fauna');
      if (!fauna) continue;

      const lifecycle = this.getOrCreateFaunaLifecycle(id);
      lifecycle.ageMinutes += dt;
      if (lifecycle.reproductionCooldown > 0) {
        lifecycle.reproductionCooldown -= dt;
      }

      const lifespan = FAUNA_LIFESPAN_MINUTES[fauna.category] ?? 2000;
      const reproAge = REPRODUCTION_AGE_MINUTES[fauna.category] ?? 600;
      const ageRatio = lifecycle.ageMinutes / lifespan;

      // Determine stage
      if (fauna.health <= 0) {
        lifecycle.stage = 'DEATH';
        // Actual removal is handled separately to avoid mid-iteration issues
        continue;
      }

      if (lifecycle.ageMinutes < reproAge * 0.3) {
        lifecycle.stage = 'BIRTH';
      } else if (lifecycle.ageMinutes < reproAge) {
        lifecycle.stage = 'GROWTH';
      } else if (lifecycle.ageMinutes < lifespan * 0.8) {
        lifecycle.stage = 'REPRODUCTION';
      } else {
        lifecycle.stage = 'AGING';
      }

      // Age-based health decline
      if (lifecycle.stage === 'AGING') {
        fauna.health = clamp(fauna.health - 0.01 * dt, 0, 100);
      }

      // Hunger increases over time
      fauna.hunger = clamp(fauna.hunger + 0.05 * dt, 0, 100);
      if (fauna.hunger >= 90) {
        fauna.health = clamp(fauna.health - 0.1 * dt, 0, 100);
      }
    }

    // Clean up dead fauna
    for (const id of faunaIds) {
      const fauna = this.ecs.getComponent<Fauna>(id, 'fauna');
      if (fauna && fauna.health <= 0) {
        this.ecs.removeEntity(id);
      }
    }
  }

  private getOrCreateFaunaLifecycle(entityId: string): FaunaLifecycle {
    const existing = this.ecs.getComponent<FaunaLifecycle>(entityId, 'faunaLifecycle');
    if (existing) return existing;

    const lifecycle: FaunaLifecycle = {
      type: 'faunaLifecycle',
      stage: 'BIRTH',
      ageMinutes: 0,
      reproductionCooldown: 0,
      lastOffspringId: null,
    };
    this.ecs.addComponent(entityId, lifecycle);
    return lifecycle;
  }

  // ---------------------------------------------------------------------------
  // Predator-Prey Dynamics & Food Chain
  // ---------------------------------------------------------------------------

  private updatePredatorPrey(dt: number): void {
    const allFauna = this.ecs.getEntitiesWith(['fauna']);
    const wolves: { id: string; fauna: Fauna; pos: Position | undefined }[] = [];
    const stags: { id: string; fauna: Fauna; pos: Position | undefined }[] = [];

    for (const id of allFauna) {
      const fauna = this.ecs.getComponent<Fauna>(id, 'fauna');
      const pos = this.ecs.getComponent<Position>(id, 'position');
      if (!fauna) continue;
      if (fauna.category === 'WOLF') wolves.push({ id, fauna, pos });
      if (fauna.category === 'STAG') stags.push({ id, fauna, pos });
    }

    // Wolves hunt stags
    for (const wolf of wolves) {
      if (!wolf.pos || wolf.fauna.hunger < 30) continue;
      wolf.fauna.actionState = 'HUNTING';

      // Find nearest stag
      let nearest: { id: string; pos: Position; dist: number } | null = null;
      for (const stag of stags) {
        if (!stag.pos || stag.fauna.health <= 0) continue;
        const d = dist(wolf.pos, stag.pos);
        if (!nearest || d < nearest.dist) {
          nearest = { id: stag.id, pos: stag.pos, dist: d };
        }
      }

      if (nearest && nearest.dist < 3) {
        // Attack
        const stagFauna = this.ecs.getComponent<Fauna>(nearest.id, 'fauna');
        if (stagFauna) {
          stagFauna.health = clamp(stagFauna.health - 10, 0, 100);
          wolf.fauna.hunger = clamp(wolf.fauna.hunger - 40, 0, 100);
          wolf.fauna.actionState = 'WANDERING';
        }
      }
    }

    // Stags eat crops
    for (const stag of stags) {
      if (!stag.pos || stag.fauna.hunger < 40) continue;
      stag.fauna.actionState = 'GRAZING';

      const nearbyFlora = this.ecs.getEntitiesWith(['flora', 'position']);
      for (const floraId of nearbyFlora) {
        const flora = this.ecs.getComponent<Flora>(floraId, 'flora');
        const fPos = this.ecs.getComponent<Position>(floraId, 'position');
        if (!flora || !fPos) continue;
        if (flora.category !== 'CROP') continue;
        if (dist(stag.pos, fPos) < 2) {
          flora.growth = clamp(flora.growth - 5, 0, 100);
          stag.fauna.hunger = clamp(stag.fauna.hunger - 20, 0, 100);
          stag.fauna.actionState = 'WANDERING';
          break;
        }
      }
    }
  }

  /** Simplified Lotka-Volterra population trend estimation. Returns population deltas per minute. */
  estimatePopulationTrend(preyCount: number, predatorCount: number): {
    preyDeltaPerMinute: number;
    predatorDeltaPerMinute: number;
  } {
    const a = 0.02; // prey growth rate
    const b = 0.002; // predation rate
    const c = 0.001; // predator efficiency
    const d = 0.015; // predator death rate

    const preyDelta = a * preyCount - b * preyCount * predatorCount;
    const predatorDelta = c * preyCount * predatorCount - d * predatorCount;

    return {
      preyDeltaPerMinute: preyDelta,
      predatorDeltaPerMinute: predatorDelta,
    };
  }

  // ---------------------------------------------------------------------------
  // Soil System
  // ---------------------------------------------------------------------------

  private getSoilKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private getSoilAt(x: number, y: number): SoilCell {
    const key = this.getSoilKey(x, y);
    if (!this.soils.has(key)) {
      this.soils.set(key, {
        x,
        y,
        moisture: 60,
        nutrients: 60,
        ashFertility: 0,
        fireIntensity: 0,
      });
    }
    return this.soils.get(key)!;
  }

  private setSoilAt(x: number, y: number, cell: SoilCell): void {
    this.soils.set(this.getSoilKey(x, y), cell);
  }

  private updateSoil(dt: number): void {
    for (const cell of this.soils.values()) {
      // Natural regeneration
      cell.nutrients = clamp(cell.nutrients + 0.005 * dt, 0, 100);
      cell.moisture = clamp(cell.moisture + 0.002 * dt, 0, 100);
      // Ash fertility decays
      cell.ashFertility = clamp(cell.ashFertility - 0.001 * dt, 0, 1);
      // Fire intensity decays
      if (cell.fireIntensity > 0) {
        cell.fireIntensity = clamp(cell.fireIntensity - 0.05 * dt, 0, 1);
      }
    }
  }

  /** Get soil data at a coordinate (for UI or gameplay queries). */
  getSoil(x: number, y: number): SoilCell {
    return this.getSoilAt(x, y);
  }

  // ---------------------------------------------------------------------------
  // Fire Ecology
  // ---------------------------------------------------------------------------

  /** Trigger a lightning strike fire (call during TEMPEST weather). */
  triggerLightningStrike(x: number, y: number, intensity = 0.7): void {
    this.startFire(x, y, intensity);
  }

  private startFire(x: number, y: number, intensity: number): void {
    const soil = this.getSoilAt(x, y);
    soil.fireIntensity = clamp(soil.fireIntensity + intensity, 0, 1);
    this.setSoilAt(x, y, soil);

    this.fires.push({
      x,
      y,
      intensity: clamp(intensity, 0, 1),
      spreadRadius: 1,
      durationLeft: 5 + Math.random() * 10,
    });
  }

  private updateFire(dt: number): void {
    const remainingFires: FireState[] = [];

    for (const fire of this.fires) {
      fire.durationLeft -= dt;
      fire.intensity = clamp(fire.intensity - 0.01 * dt, 0, 1);

      if (fire.durationLeft <= 0 || fire.intensity <= 0) {
        // Fire goes out, deposit ash
        const soil = this.getSoilAt(Math.round(fire.x), Math.round(fire.y));
        soil.ashFertility = clamp(soil.ashFertility + 0.3, 0, 1);
        this.setSoilAt(soil.x, soil.y, soil);
        continue;
      }

      remainingFires.push(fire);

      // Spread to adjacent flora
      if (fire.intensity > 0.3 && Math.random() < 0.1 * dt) {
        const nearbyFlora = this.ecs.getEntitiesWith(['flora', 'position']);
        for (const floraId of nearbyFlora) {
          const pos = this.ecs.getComponent<Position>(floraId, 'position');
          const flora = this.ecs.getComponent<Flora>(floraId, 'flora');
          if (!pos || !flora) continue;
          const d = Math.sqrt((pos.x - fire.x) ** 2 + (pos.y - fire.y) ** 2);
          if (d <= fire.spreadRadius + 1) {
            flora.growth = clamp(flora.growth - 20, 0, 100);
            if (flora.growth <= 0) {
              const lifecycle = this.ecs.getComponent<FloraLifecycle>(floraId, 'floraLifecycle');
              if (lifecycle) {
                lifecycle.stage = 'DEAD';
                lifecycle.decayProgress = 1;
              }
            }
            // Chance to start new fire
            if (Math.random() < 0.2) {
              this.startFire(pos.x, pos.y, fire.intensity * 0.5);
            }
          }
        }
      }
    }

    this.fires = remainingFires;
  }

  /** Get all active fires (for rendering). */
  getActiveFires(): FireState[] {
    return this.fires.map(f => ({ ...f }));
  }

  /** Spawn a new fauna offspring near a parent (reproduction hook). */
  spawnOffspring(parentId: string, category: string, subType: string): string | null {
    const parentPos = this.ecs.getComponent<Position>(parentId, 'position');
    const parentLifecycle = this.ecs.getComponent<FaunaLifecycle>(parentId, 'faunaLifecycle') ?? this.getOrCreateFaunaLifecycle(parentId);
    if (!parentPos) return null;
    if (parentLifecycle.reproductionCooldown > 0) return null;

    const offspringId = this.ecs.createEntity();
    const offsetX = (Math.random() - 0.5) * 2;
    const offsetY = (Math.random() - 0.5) * 2;

    this.ecs.addComponent(offspringId, {
      type: 'position',
      x: parentPos.x + offsetX,
      y: parentPos.y + offsetY,
      z: 0,
    } as Position);

    this.ecs.addComponent(offspringId, {
      type: 'fauna',
      category: category as any,
      subType,
      health: 30,
      hunger: 20,
      aggressiveness: 10,
      actionState: 'WANDERING',
    } as Fauna);

    this.ecs.addComponent(offspringId, {
      type: 'faunaLifecycle',
      stage: 'BIRTH',
      ageMinutes: 0,
      reproductionCooldown: 0,
      lastOffspringId: null,
    } as FaunaLifecycle);

    parentLifecycle.reproductionCooldown = 240; // 4 hours
    parentLifecycle.lastOffspringId = offspringId;

    return offspringId;
  }

  /** Get flora lifecycle stage for an entity. */
  getFloraStage(entityId: string): FloraLifecycleStage | null {
    const lc = this.ecs.getComponent<FloraLifecycle>(entityId, 'floraLifecycle');
    return lc?.stage ?? null;
  }

  /** Get fauna lifecycle stage for an entity. */
  getFaunaStage(entityId: string): FaunaLifecycleStage | null {
    const lc = this.ecs.getComponent<FaunaLifecycle>(entityId, 'faunaLifecycle');
    return lc?.stage ?? null;
  }
}
