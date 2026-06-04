import { ECS } from '../ecs';
import {
  Entity,
  FaithSystemType,
  TenetDefinition,
  Dogma,
  Society,
  Faith,
  Flora,
} from '../../types';

// ── Tenet Database (25 tenets across 5 faith systems) ──

export const TENETS: TenetDefinition[] = [
  // ANIMISM
  {
    id: 'nature_reverence',
    name: 'Nature Reverence',
    description: 'Flora grows faster; strip mining is spiritually damaging.',
    effects: { floraGrowthModifier: 0.15, stripMiningPenalty: -3, happinessDelta: 0.2 },
    unlockRequirement: { divineLevel: 1 },
    conflictsWith: ['industrial_progress', 'entropy_worship'],
    faithSystem: 'ANIMISM',
  },
  {
    id: 'spirit_walk',
    name: 'Spirit Walk',
    description: 'The tribe communes with spirits, boosting happiness but dulling scientific curiosity.',
    effects: { happinessDelta: 0.3, techModifier: -0.05 },
    unlockRequirement: { divineLevel: 2 },
    conflictsWith: ['rational_governance', 'education_first'],
    faithSystem: 'ANIMISM',
  },
  {
    id: 'animal_totems',
    name: 'Animal Totems',
    description: 'Fauna are sacred; hunting yields decline but beasts thrive.',
    effects: { hunterModifier: -0.1, faunaHealthModifier: 0.1, happinessDelta: 0.1 },
    unlockRequirement: { divineLevel: 1, tribeSize: 15 },
    conflictsWith: ['crusade_mandate', 'dominion_over_beasts'],
    faithSystem: 'ANIMISM',
  },
  {
    id: 'seasonal_rituals',
    name: 'Seasonal Rituals',
    description: 'Devotion waxes and wanes with the turning of seasons.',
    effects: { devotionDelta: 0.5, happinessDelta: 0.1 },
    unlockRequirement: { divineLevel: 2, events: ['MIRACLE'] },
    conflictsWith: ['void_embrace', 'nothing_is_sacred'],
    faithSystem: 'ANIMISM',
  },
  {
    id: 'ancestor_worship',
    name: 'Ancestor Worship',
    description: 'The dead guide the living, deepening devotion at the cost of forward-looking ambition.',
    effects: { devotionDelta: 0.8, techModifier: -0.08, happinessDelta: 0.15 },
    unlockRequirement: { divineLevel: 3, tribeSize: 30 },
    conflictsWith: ['nothing_is_sacred', 'meritocracy'],
    faithSystem: 'ANIMISM',
  },

  // ELEMENTALISM
  {
    id: 'elemental_harmony',
    name: 'Elemental Harmony',
    description: 'Aligning with the elements brings spiritual power but rigidity.',
    effects: { devotionDelta: 0.4, happinessDelta: -0.1 },
    unlockRequirement: { divineLevel: 1 },
    conflictsWith: ['tech_hate', 'rational_governance'],
    faithSystem: 'ELEMENTALISM',
  },
  {
    id: 'fire_purification',
    name: 'Fire Purification',
    description: 'Flame cleanses all, raising devotion while scorching the land.',
    effects: { devotionDelta: 0.6, floraGrowthModifier: -0.15, happinessDelta: -0.2 },
    unlockRequirement: { divineLevel: 2 },
    conflictsWith: ['nature_reverence', 'water_blessing'],
    faithSystem: 'ELEMENTALISM',
  },
  {
    id: 'water_blessing',
    name: 'Water Blessing',
    description: 'Crops swell with life; wood warps and rots.',
    effects: { floraGrowthModifier: 0.2, structureEfficiencyModifier: -0.1, happinessDelta: 0.1 },
    unlockRequirement: { divineLevel: 1, tribeSize: 20 },
    conflictsWith: ['fire_purification', 'entropy_worship'],
    faithSystem: 'ELEMENTALISM',
  },
  {
    id: 'earth_binding',
    name: 'Earth Binding',
    description: 'Stone endures; structures harden but feet grow heavy.',
    effects: { structureEfficiencyModifier: 0.15, movementSpeedModifier: -0.1 },
    unlockRequirement: { divineLevel: 2, events: ['MIRACLE'] },
    conflictsWith: ['storm_calling', 'urban_planning'],
    faithSystem: 'ELEMENTALISM',
  },
  {
    id: 'storm_calling',
    name: 'Storm Calling',
    description: 'The faithful draw power from tempests, yet fear weakens morale.',
    effects: { devotionDelta: 0.7, happinessDelta: -0.25 },
    unlockRequirement: { divineLevel: 3 },
    conflictsWith: ['earth_binding', 'seasonal_rituals'],
    faithSystem: 'ELEMENTALISM',
  },

  // INTERVENTIONIST
  {
    id: 'divine_right',
    name: 'Divine Right',
    description: 'The priesthood rules absolutely; devotion soars, liberty withers.',
    effects: { devotionDelta: 1.0, happinessDelta: -0.3 },
    unlockRequirement: { divineLevel: 1 },
    conflictsWith: ['meritocracy', 'free_trade'],
    faithSystem: 'INTERVENTIONIST',
  },
  {
    id: 'miracle_working',
    name: 'Miracle Working',
    description: 'Frequent miracles drain resources but cement belief.',
    effects: { devotionDelta: 0.9, resourcesDelta: -0.5 },
    unlockRequirement: { divineLevel: 2, events: ['MIRACLE'] },
    conflictsWith: ['rational_governance', 'nothing_is_sacred'],
    faithSystem: 'INTERVENTIONIST',
  },
  {
    id: 'prophetic_visions',
    name: 'Prophetic Visions',
    description: 'Mad seers glimpse the future, accelerating research at a maddening cost.',
    effects: { techModifier: 0.1, happinessDelta: -0.2, devotionDelta: 0.2 },
    unlockRequirement: { divineLevel: 3 },
    conflictsWith: ['education_first', 'void_embrace'],
    faithSystem: 'INTERVENTIONIST',
  },
  {
    id: 'crusade_mandate',
    name: 'Crusade Mandate',
    description: 'The tribe must convert or destroy unbelievers.',
    effects: { hunterModifier: 0.15, happinessDelta: -0.2, devotionDelta: 0.3 },
    unlockRequirement: { divineLevel: 2, tribeSize: 40 },
    conflictsWith: ['animal_totems', 'peaceful_coexistence'],
    faithSystem: 'INTERVENTIONIST',
  },
  {
    id: 'sacred_tithe',
    name: 'Sacred Tithe',
    description: 'Mandatory offerings flood the divine coffers but impoverish the people.',
    effects: { devotionDelta: 1.2, resourcesDelta: -0.8, happinessDelta: -0.2 },
    unlockRequirement: { divineLevel: 1, tribeSize: 25 },
    conflictsWith: ['free_trade', 'urban_planning'],
    faithSystem: 'INTERVENTIONIST',
  },

  // SECULAR
  {
    id: 'rational_governance',
    name: 'Rational Governance',
    description: 'Logic replaces superstition; technology flourishes, faith recedes.',
    effects: { techModifier: 0.12, devotionDelta: -0.4, happinessDelta: 0.1 },
    unlockRequirement: { divineLevel: 1 },
    conflictsWith: ['spirit_walk', 'miracle_working', 'divine_right'],
    faithSystem: 'SECULAR',
  },
  {
    id: 'free_trade',
    name: 'Free Trade',
    description: 'Markets open; wealth accumulates and spirits dampen.',
    effects: { resourcesDelta: 0.6, happinessDelta: 0.2, devotionDelta: -0.2 },
    unlockRequirement: { divineLevel: 1, tribeSize: 20 },
    conflictsWith: ['sacred_tithe', 'divine_right'],
    faithSystem: 'SECULAR',
  },
  {
    id: 'education_first',
    name: 'Education First',
    description: 'Knowledge is the true god. Researchers multiply; priests dwindle.',
    effects: { researcherModifier: 0.15, acolyteModifier: -0.1, techModifier: 0.08 },
    unlockRequirement: { divineLevel: 2 },
    conflictsWith: ['spirit_walk', 'prophetic_visions'],
    faithSystem: 'SECULAR',
  },
  {
    id: 'meritocracy',
    name: 'Meritocracy',
    description: 'The worthy rise; happiness spreads, ancient bloodlines fade.',
    effects: { happinessDelta: 0.25, devotionDelta: -0.1 },
    unlockRequirement: { divineLevel: 2, tribeSize: 35 },
    conflictsWith: ['ancestor_worship', 'divine_right'],
    faithSystem: 'SECULAR',
  },
  {
    id: 'urban_planning',
    name: 'Urban Planning',
    description: 'Cities rise in ordered grids; nature is pushed back.',
    effects: { structureEfficiencyModifier: 0.2, floraGrowthModifier: -0.1, happinessDelta: 0.1 },
    unlockRequirement: { divineLevel: 3 },
    conflictsWith: ['nature_reverence', 'earth_binding'],
    faithSystem: 'SECULAR',
  },

  // NIHILISM
  {
    id: 'void_embrace',
    name: 'Void Embrace',
    description: 'In nothingness there is peace—and power.',
    effects: { devotionDelta: 0.5, happinessDelta: -0.4 },
    unlockRequirement: { divineLevel: 1 },
    conflictsWith: ['seasonal_rituals', 'prophetic_visions', 'miracle_working'],
    faithSystem: 'NIHILISM',
  },
  {
    id: 'entropy_worship',
    name: 'Entropy Worship',
    description: 'Decay is the only truth; structures rot but the void grows.',
    effects: { structureEfficiencyModifier: -0.2, devotionDelta: 0.6 },
    unlockRequirement: { divineLevel: 2 },
    conflictsWith: ['nature_reverence', 'water_blessing', 'urban_planning'],
    faithSystem: 'NIHILISM',
  },
  {
    id: 'meaninglessness',
    name: 'Meaninglessness',
    description: 'No purpose, no pain—existence is a blank slate.',
    effects: { happinessDelta: -0.5, conversionResistance: 0.3 },
    unlockRequirement: { divineLevel: 1, events: ['SCHISM'] },
    conflictsWith: ['ancestor_worship', 'divine_right'],
    faithSystem: 'NIHILISM',
  },
  {
    id: 'annihilation_doctrine',
    name: 'Annihilation Doctrine',
    description: 'The tribe exists to end existence; hunters become executioners.',
    effects: { hunterModifier: 0.2, happinessDelta: -0.3, devotionDelta: 0.2 },
    unlockRequirement: { divineLevel: 3, tribeSize: 50 },
    conflictsWith: ['animal_totems', 'peaceful_coexistence'],
    faithSystem: 'NIHILISM',
  },
  {
    id: 'nothing_is_sacred',
    name: 'Nothing is Sacred',
    description: 'All dogma is illusion; resources flow freely but the soul starves.',
    effects: { resourcesDelta: 0.8, devotionDelta: -1.0, happinessDelta: -0.2 },
    unlockRequirement: { divineLevel: 4 },
    conflictsWith: ['seasonal_rituals', 'ancestor_worship', 'miracle_working', 'sacred_tithe'],
    faithSystem: 'NIHILISM',
  },
  // Extra generic tenets to round out the set
  {
    id: 'tech_hate',
    name: 'Tech Hate',
    description: 'Innovation is heresy. Research stalls but faith hardens.',
    effects: { techModifier: -0.15, devotionDelta: 0.3, happinessDelta: -0.1 },
    unlockRequirement: { divineLevel: 2 },
    conflictsWith: ['rational_governance', 'education_first', 'prophetic_visions'],
    faithSystem: 'INTERVENTIONIST',
  },
  {
    id: 'peaceful_coexistence',
    name: 'Peaceful Coexistence',
    description: 'Refuse holy war; neighbours are left alone.',
    effects: { happinessDelta: 0.3, devotionDelta: -0.1, hunterModifier: -0.05 },
    unlockRequirement: { divineLevel: 1 },
    conflictsWith: ['crusade_mandate', 'annihilation_doctrine'],
    faithSystem: 'SECULAR',
  },
  {
    id: 'industrial_progress',
    name: 'Industrial Progress',
    description: 'Smoke and steel above all; the land is a tool.',
    effects: { resourcesDelta: 0.5, floraGrowthModifier: -0.2, happinessDelta: -0.1 },
    unlockRequirement: { divineLevel: 3, tribeSize: 60 },
    conflictsWith: ['nature_reverence', 'water_blessing'],
    faithSystem: 'SECULAR',
  },
  {
    id: 'dominion_over_beasts',
    name: 'Dominion Over Beasts',
    description: 'Animals exist to serve; hunting and domestication surge.',
    effects: { hunterModifier: 0.1, faunaHealthModifier: -0.1, resourcesDelta: 0.3 },
    unlockRequirement: { divineLevel: 1 },
    conflictsWith: ['animal_totems', 'nature_reverence'],
    faithSystem: 'INTERVENTIONIST',
  },
];

/** Helper map for O(1) tenet lookups. */
export const TENET_MAP: Record<string, TenetDefinition> = TENETS.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {} as Record<string, TenetDefinition>);

/**
 * DogmaManager owns the tenet database, unlock logic, conflict detection,
 * and per-tick effect application to societies.
 */
export class DogmaManager {
  /** Ticks between automatic unlock checks. */
  public autoUnlockInterval = 60;
  private tickCounter = 0;

  /**
   * Scan every entity with `Dogma` + `Society` and attempt to auto-unlock
   * eligible tenets, then apply active effects.
   */
  tick(dt: number, ecs: ECS, divineLevel = 1, globalEvents: string[] = []): void {
    this.tickCounter += dt;

    const entities = ecs.getEntitiesWith(['dogma', 'society']);
    for (const ent of entities) {
      const dogma = ecs.getComponent<Dogma>(ent, 'dogma');
      const society = ecs.getComponent<Society>(ent, 'society');
      if (!dogma || !society) continue;

      if (this.tickCounter >= this.autoUnlockInterval) {
        this.checkAndAutoUnlock(ent, ecs, divineLevel, globalEvents);
      }

      this.applyEffects(ent, ecs, dt);
      this.updateSchismRisk(dogma);
    }
  }

  /**
   * Return the subset of tenets that are unlocked for a given entity based on
   * current divine level, tribe size, and global event history.
   */
  getUnlockedTenets(entity: Entity, ecs: ECS, divineLevel: number, globalEvents: string[]): TenetDefinition[] {
    const society = ecs.getComponent<Society>(entity, 'society');
    const pop = society ? society.population : 0;

    return TENETS.filter((t) => {
      const req = t.unlockRequirement;
      if (req.divineLevel && divineLevel < req.divineLevel) return false;
      if (req.tribeSize && pop < req.tribeSize) return false;
      if (req.events && req.events.length > 0) {
        const hasEvent = req.events.some((ev) => globalEvents.includes(ev));
        if (!hasEvent) return false;
      }
      return true;
    });
  }

  /** Try to add every newly-eligible tenet that the entity does not yet have. */
  checkAndAutoUnlock(entity: Entity, ecs: ECS, divineLevel: number, globalEvents: string[]): void {
    const dogma = ecs.getComponent<Dogma>(entity, 'dogma');
    if (!dogma) return;
    const unlocked = this.getUnlockedTenets(entity, ecs, divineLevel, globalEvents);
    for (const t of unlocked) {
      if (!dogma.tenets.includes(t.id)) {
        dogma.tenets.push(t.id);
      }
    }
  }

  /** Add a tenet by ID if it exists. Returns `true` on success. */
  addTenet(entity: Entity, tenetId: string, ecs: ECS): boolean {
    const dogma = ecs.getComponent<Dogma>(entity, 'dogma');
    const def = TENET_MAP[tenetId];
    if (!dogma || !def) return false;
    if (dogma.tenets.includes(tenetId)) return false;
    dogma.tenets.push(tenetId);
    this.updateSchismRisk(dogma);
    return true;
  }

  /** Remove a tenet by ID. Returns `true` if it was present. */
  removeTenet(entity: Entity, tenetId: string, ecs: ECS): boolean {
    const dogma = ecs.getComponent<Dogma>(entity, 'dogma');
    if (!dogma) return false;
    const idx = dogma.tenets.indexOf(tenetId);
    if (idx === -1) return false;
    dogma.tenets.splice(idx, 1);
    this.updateSchismRisk(dogma);
    return true;
  }

  /** Compute schism risk (0-100) from active conflicting tenets. */
  calculateSchismRisk(dogma: Dogma): number {
    let risk = 0;
    const ids = dogma.tenets;
    for (let i = 0; i < ids.length; i++) {
      const a = TENET_MAP[ids[i]];
      if (!a) continue;
      for (let j = i + 1; j < ids.length; j++) {
        const b = TENET_MAP[ids[j]];
        if (!b) continue;
        if (a.conflictsWith.includes(b.id) || b.conflictsWith.includes(a.id)) {
          risk += 12;
        }
      }
    }
    return Math.min(100, risk);
  }

  /** Recompute and store the schism risk inside the `Dogma` component. */
  updateSchismRisk(dogma: Dogma): void {
    dogma.schismRisk = this.calculateSchismRisk(dogma);
  }

  /** Returns `true` if the entity's schism risk exceeds the threshold. */
  isSchismImminent(entity: Entity, ecs: ECS, threshold = 60): boolean {
    const dogma = ecs.getComponent<Dogma>(entity, 'dogma');
    return dogma ? dogma.schismRisk >= threshold : false;
  }

  /**
   * Apply all active tenet effects to a single entity.
   * Effects mutate `Society`, `Faith`, and `Flora` components directly.
   */
  applyEffects(entity: Entity, ecs: ECS, dt: number): void {
    const dogma = ecs.getComponent<Dogma>(entity, 'dogma');
    const society = ecs.getComponent<Society>(entity, 'society');
    const faith = ecs.getComponent<Faith>(entity, 'faith');
    if (!dogma || !society) return;

    for (const tid of dogma.tenets) {
      const tenet = TENET_MAP[tid];
      if (!tenet) continue;
      const e = tenet.effects;

      // Happiness
      if (e.happinessDelta !== undefined) {
        society.happiness = Math.max(0, Math.min(100, society.happiness + e.happinessDelta * dt));
      }

      // Devotion -> Faith component
      if (e.devotionDelta !== undefined && faith) {
        faith.devotion = Math.max(0, faith.devotion + e.devotionDelta * dt);
      }

      // Technology level modifier (applied as flat per tick)
      if (e.techModifier !== undefined) {
        society.technologyLevel = Math.max(0, society.technologyLevel + e.techModifier * dt);
      }

      // Resources
      if (e.resourcesDelta !== undefined) {
        society.resources = Math.max(0, society.resources + e.resourcesDelta * dt);
      }

      // Ratio modifiers (optional fields on Society)
      if (e.gathererModifier !== undefined && society.gathererRatio !== undefined) {
        society.gathererRatio = Math.max(0, Math.min(1, society.gathererRatio + e.gathererModifier * dt * 0.01));
      }
      if (e.hunterModifier !== undefined && society.hunterRatio !== undefined) {
        society.hunterRatio = Math.max(0, Math.min(1, society.hunterRatio + e.hunterModifier * dt * 0.01));
      }
      if (e.researcherModifier !== undefined && society.researcherRatio !== undefined) {
        society.researcherRatio = Math.max(0, Math.min(1, society.researcherRatio + e.researcherModifier * dt * 0.01));
      }
      if (e.acolyteModifier !== undefined && society.acolyteRatio !== undefined) {
        society.acolyteRatio = Math.max(0, Math.min(1, society.acolyteRatio + e.acolyteModifier * dt * 0.01));
      }

      // Strip-mining penalty (applied while stripMineMode is active)
      if (e.stripMiningPenalty !== undefined && society.stripMineMode) {
        society.happiness = Math.max(0, society.happiness + e.stripMiningPenalty * dt);
      }

      // Structure efficiency (no clamp needed beyond reasonable bounds)
      if (e.structureEfficiencyModifier !== undefined) {
        // We don't have a direct global structure efficiency on Society,
        // so apply a small happiness adjustment to represent well-built cities.
        society.happiness = Math.max(0, Math.min(100, society.happiness + e.structureEfficiencyModifier * 0.2 * dt));
      }

      // Flora growth (affects any Flora component on the same entity)
      if (e.floraGrowthModifier !== undefined) {
        const flora = ecs.getComponent<Flora>(entity, 'flora');
        if (flora) {
          flora.growth = Math.max(0, Math.min(100, flora.growth + e.floraGrowthModifier * dt * 10));
        }
      }

      // Fauna health modifier (affects Fauna component)
      if (e.faunaHealthModifier !== undefined) {
        const faunaComp = ecs.getComponent<{ type: 'fauna'; health: number }>(entity, 'fauna');
        if (faunaComp) {
          faunaComp.health = Math.max(0, Math.min(100, faunaComp.health + e.faunaHealthModifier * dt * 5));
        }
      }
    }
  }

  /** Install an empty `Dogma` component on an entity if missing. */
  ensureDogma(entity: Entity, ecs: ECS): Dogma {
    let dogma = ecs.getComponent<Dogma>(entity, 'dogma');
    if (!dogma) {
      dogma = { type: 'dogma', tenets: [], schismRisk: 0 };
      ecs.addComponent(entity, dogma);
    }
    return dogma;
  }
}
