import type { ECS } from '../ecs';
import type {
  Entity,
  PopulationData,
  Society,
  Housing,
  Position,
  ResourceStorage,
  ResourceType,
} from '../../types';

/**
 * Configuration for population dynamics.
 */
export interface PopulationConfig {
  /** Chance per tick (at 100% happiness) that a valid couple produces a pregnancy. */
  baseCouplingChance: number;
  /** How long pregnancy lasts in seconds. */
  pregnancyDuration: number;
  /** How long a child takes to mature in seconds. */
  childGrowthDuration: number;
  /** Seconds without food before starvation begins. */
  starvationThreshold: number;
  /** Health damage per second while starving. */
  starvationDamageRate: number;
  /** Base chance per second of dying from old age when near maxAge. */
  ageMortalityRate: number;
  /** Disease damage per second. */
  diseaseDamageRate: number;
  /** Seconds until a sick entity dies if untreated. */
  diseaseDeathThreshold: number;
  /** How much happiness affects migration. */
  happinessMigrationThreshold: number;
  /** Base food consumption per entity per second. */
  foodConsumptionRate: number;
  /** Minimum age for coupling. */
  couplingMinAge: number;
  /** Max age difference for coupling. */
  couplingMaxAgeDiff: number;
}

export const DEFAULT_POPULATION_CONFIG: PopulationConfig = {
  baseCouplingChance: 0.001,
  pregnancyDuration: 60,
  childGrowthDuration: 120,
  starvationThreshold: 30,
  starvationDamageRate: 2,
  ageMortalityRate: 0.0005,
  diseaseDamageRate: 1,
  diseaseDeathThreshold: 60,
  happinessMigrationThreshold: 30,
  foodConsumptionRate: 0.02,
  couplingMinAge: 16,
  couplingMaxAgeDiff: 10,
};

/**
 * Birth event record.
 */
export interface BirthEvent {
  mother: Entity;
  father: Entity;
  child: Entity;
  societyId: Entity;
}

/**
 * Death event record.
 */
export interface DeathEvent {
  entity: Entity;
  cause: 'Age' | 'Combat' | 'Starvation' | 'Disease';
  societyId: Entity;
}

/**
 * Migration event record.
 */
export interface MigrationEvent {
  entity: Entity;
  fromSociety: Entity;
  toSociety: Entity;
  reason: string;
}

/**
 * PopulationManager handles births, deaths, migration, and population caps.
 * Standalone manager — takes ECS as a constructor param.
 */
export class PopulationManager {
  private config: PopulationConfig;

  constructor(
    private ecs: ECS,
    config?: Partial<PopulationConfig>
  ) {
    this.config = { ...DEFAULT_POPULATION_CONFIG, ...config };
  }

  /**
   * Initialize population data on an entity.
   * @param entity The entity to populate.
   * @param societyId The society this entity belongs to.
   * @param age Starting age.
   * @param gender Gender ('M', 'F', 'N').
   * @param maxAge Maximum lifespan.
   */
  createPopulationData(
    entity: Entity,
    societyId: Entity,
    age = 20,
    gender: 'M' | 'F' | 'N' = 'N',
    maxAge = 70
  ): PopulationData {
    const data: PopulationData = {
      type: 'populationData',
      age,
      maxAge,
      gender,
      isPregnant: false,
      pregnancyProgress: 0,
      pregnancyDuration: this.config.pregnancyDuration,
      partner: null,
      happiness: 70,
      healthStatus: 'Healthy',
      starvationTimer: 0,
      diseaseTimer: 0,
      childGrowthProgress: 0,
      isChild: age < (maxAge * 0.2), // roughly 20% of max age is childhood
      adulthoodAge: maxAge * 0.2,
      societyId,
    };
    this.ecs.addComponent(entity, data);
    return data;
  }

  /**
   * Create a Housing component on a structure entity.
   */
  createHousing(structureEntity: Entity, capacity: number, comfortLevel = 1): void {
    const housing: Housing = {
      type: 'housing',
      capacity,
      occupants: [],
      comfortLevel,
    };
    this.ecs.addComponent(structureEntity, housing);
  }

  /**
   * Update all population systems. Call once per tick.
   * @param dt Delta time in seconds.
   * @param events Collects events that occurred during this tick.
   */
  update(dt: number, events?: { births: BirthEvent[]; deaths: DeathEvent[]; migrations: MigrationEvent[] }): void {
    const birthEvents: BirthEvent[] = events?.births ?? [];
    const deathEvents: DeathEvent[] = events?.deaths ?? [];
    const migrationEvents: MigrationEvent[] = events?.migrations ?? [];

    this.processCouplingAndPregnancy(dt, birthEvents);
    this.processChildGrowth(dt);
    this.processStarvationAndDisease(dt, deathEvents);
    this.processAgeMortality(dt, deathEvents);
    this.processMigration(dt, migrationEvents);
    this.processFoodConsumption(dt);
  }

  /**
   * Calculate the total population cap for a society based on housing and food production.
   * @param societyEntity The society entity.
   * @param foodProductionPerSec Current food production rate (units/sec).
   */
  getPopulationCap(societyEntity: Entity, foodProductionPerSec = 1): number {
    const housingEntities = this.ecs.getEntitiesWith(['housing', 'position']);
    let housingCap = 0;
    for (const h of housingEntities) {
      const housing = this.ecs.getComponent<Housing>(h, 'housing');
      if (housing) housingCap += housing.capacity;
    }

    // Food-based cap: each person needs ~1 food per second
    const foodCap = Math.floor(foodProductionPerSec * 20); // 20x multiplier for playable numbers

    // Society also contributes a small base
    const society = this.ecs.getComponent<Society>(societyEntity, 'society');
    const baseCap = (society?.tierLevel ?? 1) * 5;

    return housingCap + foodCap + baseCap;
  }

  /**
   * Get current population count for a society.
   */
  getPopulationCount(societyEntity: Entity): number {
    const all = this.ecs.getEntitiesWith(['populationData']);
    let count = 0;
    for (const e of all) {
      const pop = this.ecs.getComponent<PopulationData>(e, 'populationData');
      if (pop && pop.societyId === societyEntity) count++;
    }
    return count;
  }

  /**
   * Get all population data for a society.
   */
  getSocietyPopulation(societyEntity: Entity): Array<{ entity: Entity; data: PopulationData }> {
    const all = this.ecs.getEntitiesWith(['populationData']);
    const result: Array<{ entity: Entity; data: PopulationData }> = [];
    for (const e of all) {
      const pop = this.ecs.getComponent<PopulationData>(e, 'populationData');
      if (pop && pop.societyId === societyEntity) {
        result.push({ entity: e, data: pop });
      }
    }
    return result;
  }

  private processCouplingAndPregnancy(dt: number, births: BirthEvent[]): void {
    const allPop = this.ecs.getEntitiesWith(['populationData']);
    // Group by society
    const bySociety = new Map<Entity, Entity[]>();
    for (const e of allPop) {
      const pop = this.ecs.getComponent<PopulationData>(e, 'populationData');
      if (!pop || pop.isChild || pop.isPregnant || pop.partner) continue;
      const list = bySociety.get(pop.societyId) ?? [];
      list.push(e);
      bySociety.set(pop.societyId, list);
    }

    for (const [societyId, entities] of bySociety.entries()) {
      // Shuffle for randomness
      const shuffled = [...entities].sort(() => Math.random() - 0.5);
      const females = shuffled.filter((e) => {
        const pop = this.ecs.getComponent<PopulationData>(e, 'populationData');
        return pop && pop.gender === 'F' && pop.age >= this.config.couplingMinAge;
      });
      const males = shuffled.filter((e) => {
        const pop = this.ecs.getComponent<PopulationData>(e, 'populationData');
        return pop && pop.gender === 'M' && pop.age >= this.config.couplingMinAge;
      });

      for (const f of females) {
        const fPop = this.ecs.getComponent<PopulationData>(f, 'populationData')!;
        if (fPop.partner) continue;

        // Find compatible male
        const partner = males.find((m) => {
          const mPop = this.ecs.getComponent<PopulationData>(m, 'populationData');
          if (!mPop || mPop.partner) return false;
          return Math.abs(fPop.age - mPop.age) <= this.config.couplingMaxAgeDiff;
        });

        if (partner) {
          const happinessFactor = fPop.happiness / 100;
          if (Math.random() < this.config.baseCouplingChance * happinessFactor * dt) {
            // Couple formed and pregnancy begins
            fPop.partner = partner;
            fPop.isPregnant = true;
            fPop.pregnancyProgress = 0;
            this.ecs.addComponent(f, fPop);

            const mPop = this.ecs.getComponent<PopulationData>(partner, 'populationData')!;
            mPop.partner = f;
            this.ecs.addComponent(partner, mPop);

            // Remove partner from available males
            const idx = males.indexOf(partner);
            if (idx !== -1) males.splice(idx, 1);
          }
        }
      }
    }

    // Progress pregnancy
    for (const e of allPop) {
      const pop = this.ecs.getComponent<PopulationData>(e, 'populationData');
      if (!pop || !pop.isPregnant) continue;

      pop.pregnancyProgress += dt;
      if (pop.pregnancyProgress >= pop.pregnancyDuration) {
        // Birth
        const child = this.ecs.createEntity();
        const motherPop = this.ecs.getComponent<PopulationData>(e, 'populationData')!;
        const father = motherPop.partner;
        const fatherPop = father ? this.ecs.getComponent<PopulationData>(father, 'populationData') : undefined;

        this.createPopulationData(child, motherPop.societyId, 0, Math.random() > 0.5 ? 'M' : 'F', motherPop.maxAge);
        const childData = this.ecs.getComponent<PopulationData>(child, 'populationData')!;
        childData.isChild = true;
        childData.childGrowthProgress = 0;
        this.ecs.addComponent(child, childData);

        // Copy position from mother
        const motherPos = this.ecs.getComponent<Position>(e, 'position');
        if (motherPos) {
          this.ecs.addComponent(child, { ...motherPos } as Position);
        }

        // Reset mother
        motherPop.isPregnant = false;
        motherPop.pregnancyProgress = 0;
        this.ecs.addComponent(e, motherPop);

        births.push({ mother: e, father: father ?? 'none', child, societyId: motherPop.societyId });
      } else {
        this.ecs.addComponent(e, pop);
      }
    }
  }

  private processChildGrowth(dt: number): void {
    const allPop = this.ecs.getEntitiesWith(['populationData']);
    for (const e of allPop) {
      const pop = this.ecs.getComponent<PopulationData>(e, 'populationData');
      if (!pop || !pop.isChild) continue;

      pop.childGrowthProgress += dt;
      pop.age += dt / this.config.childGrowthDuration * pop.maxAge * 0.2; // rough age scaling
      if (pop.childGrowthProgress >= this.config.childGrowthDuration) {
        pop.isChild = false;
      }
      this.ecs.addComponent(e, pop);
    }
  }

  private processStarvationAndDisease(dt: number, deaths: DeathEvent[]): void {
    const allPop = this.ecs.getEntitiesWith(['populationData']);
    for (const e of allPop) {
      const pop = this.ecs.getComponent<PopulationData>(e, 'populationData');
      if (!pop) continue;

      // Disease
      if (pop.healthStatus === 'Sick') {
        pop.diseaseTimer += dt;
        if (pop.diseaseTimer >= this.config.diseaseDeathThreshold) {
          deaths.push({ entity: e, cause: 'Disease', societyId: pop.societyId });
          this.removeFromHousing(e);
          this.ecs.removeEntity(e);
          continue;
        }
        this.ecs.addComponent(e, pop);
      }

      // Starvation
      if (pop.starvationTimer > 0) {
        pop.starvationTimer += dt;
        if (pop.starvationTimer >= this.config.starvationThreshold) {
          pop.healthStatus = 'Starving';
          // Damage accumulates implicitly; after threshold, kill
          if (pop.starvationTimer >= this.config.starvationThreshold + 10) {
            deaths.push({ entity: e, cause: 'Starvation', societyId: pop.societyId });
            this.removeFromHousing(e);
            this.ecs.removeEntity(e);
            continue;
          }
        }
        this.ecs.addComponent(e, pop);
      }
    }
  }

  private processAgeMortality(dt: number, deaths: DeathEvent[]): void {
    const allPop = this.ecs.getEntitiesWith(['populationData']);
    for (const e of allPop) {
      const pop = this.ecs.getComponent<PopulationData>(e, 'populationData');
      if (!pop || pop.isChild) continue;

      pop.age += dt;
      const ageRatio = pop.age / pop.maxAge;
      if (ageRatio >= 1.0) {
        deaths.push({ entity: e, cause: 'Age', societyId: pop.societyId });
        this.removeFromHousing(e);
        this.ecs.removeEntity(e);
      } else if (ageRatio > 0.8) {
        const chance = this.config.ageMortalityRate * ageRatio * dt;
        if (Math.random() < chance) {
          deaths.push({ entity: e, cause: 'Age', societyId: pop.societyId });
          this.removeFromHousing(e);
          this.ecs.removeEntity(e);
        } else {
          this.ecs.addComponent(e, pop);
        }
      } else {
        this.ecs.addComponent(e, pop);
      }
    }
  }

  private processMigration(dt: number, migrations: MigrationEvent[]): void {
    const societies = this.ecs.getEntitiesWith(['society']);
    const allPop = this.ecs.getEntitiesWith(['populationData']);

    // Compute happiness per society
    const societyHappiness = new Map<Entity, number>();
    for (const s of societies) {
      const pops = this.getSocietyPopulation(s);
      if (pops.length === 0) continue;
      const avg = pops.reduce((sum, p) => sum + p.data.happiness, 0) / pops.length;
      societyHappiness.set(s, avg);
    }

    for (const e of allPop) {
      const pop = this.ecs.getComponent<PopulationData>(e, 'populationData');
      if (!pop || pop.isChild) continue;

      if (pop.happiness < this.config.happinessMigrationThreshold) {
        // Chance to migrate to a happier society
        const currentHappiness = societyHappiness.get(pop.societyId) ?? 50;
        for (const [societyId, happiness] of societyHappiness.entries()) {
          if (societyId === pop.societyId) continue;
          if (happiness > currentHappiness + 10) {
            const migrationChance = 0.0001 * dt * (happiness - currentHappiness);
            if (Math.random() < migrationChance) {
              const oldSociety = pop.societyId;
              pop.societyId = societyId;
              this.ecs.addComponent(e, pop);
              migrations.push({ entity: e, fromSociety: oldSociety, toSociety: societyId, reason: 'Better happiness' });
              break;
            }
          }
        }
      }
    }
  }

  private processFoodConsumption(dt: number): void {
    const allPop = this.ecs.getEntitiesWith(['populationData']);
    for (const e of allPop) {
      const pop = this.ecs.getComponent<PopulationData>(e, 'populationData');
      if (!pop || pop.isChild) continue;

      // Find society storage
      const society = this.ecs.getComponent<Society>(pop.societyId, 'society');
      const storages = this.ecs.getEntitiesWith(['resourceStorage', 'position']);
      let foundFood = false;
      for (const store of storages) {
        const storage = this.ecs.getComponent<ResourceStorage>(store, 'resourceStorage');
        if (!storage) continue;
        const food = storage.contents['Food'] ?? 0;
        if (food >= this.config.foodConsumptionRate * dt) {
          storage.contents['Food'] = food - this.config.foodConsumptionRate * dt;
          if (storage.contents['Food'] === 0) delete storage.contents['Food'];
          this.ecs.addComponent(store, storage);
          foundFood = true;
          pop.starvationTimer = Math.max(0, pop.starvationTimer - dt * 2);
          break;
        }
      }

      if (!foundFood) {
        pop.starvationTimer += dt;
        if (pop.starvationTimer > this.config.starvationThreshold) {
          pop.healthStatus = 'Starving';
          pop.happiness = Math.max(0, pop.happiness - 5 * dt);
        }
      } else {
        pop.healthStatus = pop.healthStatus === 'Starving' ? 'Healthy' : pop.healthStatus;
        pop.happiness = Math.min(100, pop.happiness + 0.5 * dt);
      }
      this.ecs.addComponent(e, pop);
    }
  }

  private removeFromHousing(entity: Entity): void {
    const housings = this.ecs.getEntitiesWith(['housing']);
    for (const h of housings) {
      const housing = this.ecs.getComponent<Housing>(h, 'housing');
      if (!housing) continue;
      const idx = housing.occupants.indexOf(entity);
      if (idx !== -1) {
        housing.occupants.splice(idx, 1);
        this.ecs.addComponent(h, housing);
      }
    }
  }

  /**
   * Manually apply combat damage to a population entity.
   * @returns true if the entity died.
   */
  applyCombatDamage(entity: Entity, damage: number): boolean {
    const pop = this.ecs.getComponent<PopulationData>(entity, 'populationData');
    if (!pop) return false;

    // Simplified: treat as fatal if damage > 50
    if (damage > 50) {
      this.removeFromHousing(entity);
      this.ecs.removeEntity(entity);
      return true;
    }

    pop.healthStatus = 'Injured';
    pop.happiness = Math.max(0, pop.happiness - damage);
    this.ecs.addComponent(entity, pop);
    return false;
  }

  /**
   * Heal / cure an entity.
   */
  healEntity(entity: Entity, amount: number): void {
    const pop = this.ecs.getComponent<PopulationData>(entity, 'populationData');
    if (!pop) return;

    if (pop.healthStatus === 'Sick' || pop.healthStatus === 'Injured' || pop.healthStatus === 'Starving') {
      pop.healthStatus = 'Healthy';
      pop.diseaseTimer = 0;
      pop.starvationTimer = Math.max(0, pop.starvationTimer - amount * 10);
      pop.happiness = Math.min(100, pop.happiness + amount);
      this.ecs.addComponent(entity, pop);
    }
  }

  /**
   * Infect an entity with disease.
   */
  infectEntity(entity: Entity): void {
    const pop = this.ecs.getComponent<PopulationData>(entity, 'populationData');
    if (!pop || pop.healthStatus === 'Sick') return;
    pop.healthStatus = 'Sick';
    pop.diseaseTimer = 0;
    this.ecs.addComponent(entity, pop);
  }
}
