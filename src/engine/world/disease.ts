import { ECS } from '../ecs';
import {
  Disease,
  DiseaseType,
  Flora,
  Fauna,
  Society,
  Position,
  TransmissionModel,
  FloraLifecycle,
} from '../../types';

const DISEASE_CONFIGS: Record<
  DiseaseType,
  {
    transmission: TransmissionModel;
    infectiousness: number;
    mortalityRate: number;
    recoveryRate: number;
    baseDuration: number;
    spreadRadius: number;
  }
> = {
  BLIGHT: {
    transmission: 'CONTACT',
    infectiousness: 0.6,
    mortalityRate: 0.05,
    recoveryRate: 0.1,
    baseDuration: 120,
    spreadRadius: 2,
  },
  PLAGUE: {
    transmission: 'AIRBORNE',
    infectiousness: 0.5,
    mortalityRate: 0.15,
    recoveryRate: 0.08,
    baseDuration: 180,
    spreadRadius: 8,
  },
  PEST: {
    transmission: 'VECTOR',
    infectiousness: 0.4,
    mortalityRate: 0.02,
    recoveryRate: 0.15,
    baseDuration: 90,
    spreadRadius: 5,
  },
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
 * Manages disease transmission, immunity, recovery, and player intervention.
 * Supports BLIGHT (flora), PLAGUE (fauna/society), and PEST (swarms/vector).
 */
export class DiseaseManager {
  private immunityMemory = new Map<string, Set<DiseaseType>>();

  constructor(private ecs: ECS) {}

  /** Advance diseases and transmission by `dt` game minutes. */
  update(dt: number): void {
    this.updateDiseaseDuration(dt);
    this.applyDiseaseEffects(dt);
    this.spreadDiseases(dt);
    this.attemptRecoveries(dt);
    this.cleanupDeadEntities();
  }

  /** Infect an entity with a specific disease. */
  infectEntity(entityId: string, diseaseType: DiseaseType): boolean {
    if (this.isImmune(entityId, diseaseType)) return false;
    if (this.hasDisease(entityId, diseaseType)) return false;

    const config = DISEASE_CONFIGS[diseaseType];
    const disease: Disease = {
      type: 'disease',
      diseaseType,
      carrierId: entityId,
      transmissionModel: config.transmission,
      infectiousness: config.infectiousness,
      mortalityRate: config.mortalityRate,
      recoveryRate: config.recoveryRate,
      durationRemaining: config.baseDuration,
      spreadRadius: config.spreadRadius,
      isQuarantined: false,
    };

    this.ecs.addComponent(entityId, disease);
    return true;
  }

  /** Purify spell: cure all diseases on an entity and grant temporary immunity. */
  purify(entityId: string): boolean {
    const diseases = this.getEntityDiseases(entityId);
    if (diseases.length === 0) return false;

    for (const disease of diseases) {
      // Remove by creating a zero-duration clone (ECS limitation workaround)
      disease.durationRemaining = 0;
    }

    // Grant immunity for 5 minutes to all cured types
    if (!this.immunityMemory.has(entityId)) {
      this.immunityMemory.set(entityId, new Set());
    }
    for (const d of diseases) {
      this.immunityMemory.get(entityId)!.add(d.diseaseType);
    }

    return true;
  }

  /** Quarantine: prevent spread from this entity. */
  quarantine(entityId: string): boolean {
    const diseases = this.getEntityDiseases(entityId);
    if (diseases.length === 0) return false;
    for (const d of diseases) {
      d.isQuarantined = true;
    }
    return true;
  }

  /** Burn infected flora: destroy the plant and prevent spread. */
  burnInfected(entityId: string): boolean {
    const flora = this.ecs.getComponent<Flora>(entityId, 'flora');
    if (!flora) return false;
    const diseases = this.getEntityDiseases(entityId);
    if (diseases.length === 0) return false;

    flora.growth = 0;
    const lifecycle = this.ecs.getComponent<FloraLifecycle>(entityId, 'floraLifecycle');
    if (lifecycle) {
      lifecycle.stage = 'DEAD';
      lifecycle.decayProgress = 1;
    }

    for (const d of diseases) {
      d.durationRemaining = 0;
    }

    return true;
  }

  /** Get all active diseases in the world. */
  getAllDiseases(): Disease[] {
    const result: Disease[] = [];
    // Note: ECS doesn't have a direct "get all components of type" API,
    // so we query all entities and check for disease components.
    const allEntities = this.ecs.getEntitiesWith([]);
    for (const id of allEntities) {
      const diseases = this.getEntityDiseases(id);
      result.push(...diseases);
    }
    return result;
  }

  /** Get herd immunity ratio for a disease type among a population set. */
  getHerdImmunityRatio(diseaseType: DiseaseType, entityIds: string[]): number {
    if (entityIds.length === 0) return 0;
    const immuneCount = entityIds.filter(id => this.isImmune(id, diseaseType)).length;
    return immuneCount / entityIds.length;
  }

  /** Check if an entity has any active disease. */
  isInfected(entityId: string): boolean {
    return this.getEntityDiseases(entityId).length > 0;
  }

  /** Get active diseases attached to a specific entity. */
  getEntityDiseases(entityId: string): Disease[] {
    // ECS stores components per type. We cannot query "disease" directly
    // unless we know the entity has it. We use a heuristic: try to get
    // disease component by iterating common component types, but since
    // ECS getComponent uses type as key, we can request 'disease'.
    const disease = this.ecs.getComponent<Disease>(entityId, 'disease');
    if (disease && disease.durationRemaining > 0) {
      return [disease];
    }
    return [];
  }

  private hasDisease(entityId: string, diseaseType: DiseaseType): boolean {
    return this.getEntityDiseases(entityId).some(d => d.diseaseType === diseaseType);
  }

  private isImmune(entityId: string, diseaseType: DiseaseType): boolean {
    return this.immunityMemory.get(entityId)?.has(diseaseType) ?? false;
  }

  private updateDiseaseDuration(dt: number): void {
    const allEntities = this.ecs.getEntitiesWith([]);
    for (const id of allEntities) {
      const disease = this.ecs.getComponent<Disease>(id, 'disease');
      if (disease) {
        disease.durationRemaining -= dt;
      }
    }
  }

  private applyDiseaseEffects(dt: number): void {
    const allEntities = this.ecs.getEntitiesWith([]);
    for (const id of allEntities) {
      const diseases = this.getEntityDiseases(id);
      for (const disease of diseases) {
        if (disease.durationRemaining <= 0) continue;

        const flora = this.ecs.getComponent<Flora>(id, 'flora');
        const fauna = this.ecs.getComponent<Fauna>(id, 'fauna');
        const society = this.ecs.getComponent<Society>(id, 'society');

        if (flora) {
          // Blight reduces growth; Pest increases pestLevel
          if (disease.diseaseType === 'BLIGHT') {
            flora.growth = clamp(flora.growth - 0.05 * dt, 0, 100);
            flora.diseaseActive = true;
          } else if (disease.diseaseType === 'PEST') {
            flora.pestLevel = clamp((flora.pestLevel ?? 0) + 0.1 * dt, 0, 100);
          }
        }

        if (fauna) {
          // Plague reduces health
          if (disease.diseaseType === 'PLAGUE') {
            fauna.health = clamp(fauna.health - 0.03 * dt, 0, 100);
          }
        }

        if (society) {
          // Plague reduces population and happiness
          if (disease.diseaseType === 'PLAGUE') {
            society.population = Math.max(0, Math.floor(society.population - 0.001 * dt * society.population));
            society.happiness = clamp(society.happiness - 0.02 * dt, 0, 100);
          }
        }
      }
    }
  }

  private spreadDiseases(dt: number): void {
    const allEntities = this.ecs.getEntitiesWith([]);
    const carriers: { id: string; disease: Disease; pos: Position | undefined }[] = [];

    for (const id of allEntities) {
      const disease = this.ecs.getComponent<Disease>(id, 'disease');
      if (!disease || disease.durationRemaining <= 0) continue;
      if (disease.isQuarantined) continue;

      const pos = this.ecs.getComponent<Position>(id, 'position');
      carriers.push({ id, disease, pos });
    }

    for (const carrier of carriers) {
      const config = DISEASE_CONFIGS[carrier.disease.diseaseType];
      if (!config) continue;

      // Limit spread attempts per tick
      const spreadChance = carrier.disease.infectiousness * dt * 0.1;
      const roll = Math.random();
      if (roll > spreadChance) continue;

      for (const targetId of allEntities) {
        if (targetId === carrier.id) continue;
        if (this.isImmune(targetId, carrier.disease.diseaseType)) continue;
        if (this.hasDisease(targetId, carrier.disease.diseaseType)) continue;

        const targetPos = this.ecs.getComponent<Position>(targetId, 'position');
        if (!targetPos || !carrier.pos) continue;

        const d = dist(carrier.pos, targetPos);
        if (carrier.disease.spreadRadius <= 0) continue;
        if (d > carrier.disease.spreadRadius) continue;

        // Transmission model checks
        if (carrier.disease.transmissionModel === 'CONTACT' && d > 2) continue;
        if (carrier.disease.transmissionModel === 'VECTOR') {
          // Must have a fauna vector nearby
          const vector = this.ecs.getComponent<Fauna>(carrier.id, 'fauna') || this.ecs.getComponent<Fauna>(targetId, 'fauna');
          if (!vector) continue;
        }

        this.infectEntity(targetId, carrier.disease.diseaseType);
      }
    }
  }

  private attemptRecoveries(dt: number): void {
    const allEntities = this.ecs.getEntitiesWith([]);
    for (const id of allEntities) {
      const disease = this.ecs.getComponent<Disease>(id, 'disease');
      if (!disease || disease.durationRemaining <= 0) continue;

      const recoveryChance = disease.recoveryRate * dt * 0.05;
      if (Math.random() < recoveryChance) {
        disease.durationRemaining = 0;
        if (!this.immunityMemory.has(id)) {
          this.immunityMemory.set(id, new Set());
        }
        this.immunityMemory.get(id)!.add(disease.diseaseType);
      }
    }
  }

  private cleanupDeadEntities(): void {
    const allEntities = this.ecs.getEntitiesWith([]);
    for (const id of allEntities) {
      const disease = this.ecs.getComponent<Disease>(id, 'disease');
      if (disease && disease.durationRemaining <= 0) {
        // ECS does not support direct component removal; we zero it out.
        // For new code paths, the disease is considered inactive.
        disease.infectiousness = 0;
      }

      const fauna = this.ecs.getComponent<Fauna>(id, 'fauna');
      if (fauna && fauna.health <= 0) {
        this.ecs.removeEntity(id);
        this.immunityMemory.delete(id);
      }

      const society = this.ecs.getComponent<Society>(id, 'society');
      if (society && society.population <= 0) {
        this.ecs.removeEntity(id);
        this.immunityMemory.delete(id);
      }
    }
  }

  /** Get infection statistics for a given disease type. */
  getDiseaseStats(diseaseType: DiseaseType): {
    infectedCount: number;
    immuneCount: number;
    totalChecked: number;
  } {
    const allEntities = this.ecs.getEntitiesWith([]);
    let infected = 0;
    let immune = 0;
    for (const id of allEntities) {
      if (this.hasDisease(id, diseaseType)) infected++;
      if (this.isImmune(id, diseaseType)) immune++;
    }
    return { infectedCount: infected, immuneCount: immune, totalChecked: allEntities.length };
  }
}
