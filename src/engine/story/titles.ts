import type { ECS } from '../ecs';
import type { Entity, RankTitle, Fauna, Society } from '../../types';

const TITLE_DATABASE: RankTitle[] = [
  {
    id: 'first_tribe',
    name: 'Tribe Founder',
    description: 'Created your first tribe.',
    rank: 'Novice',
    unlockRequirements: [{ stat: 'tribesCreated', target: 1 }],
    isUnlocked: false,
  },
  {
    id: 'city_builder',
    name: 'City Builder',
    description: 'Grew a settlement to City level.',
    rank: 'Adept',
    unlockRequirements: [{ stat: 'maxSettlementLevel', target: 4 }],
    isUnlocked: false,
  },
  {
    id: 'wolf_slayer',
    name: 'Wolf Slayer',
    description: 'Defeated 10 wolves in combat.',
    rank: 'Novice',
    unlockRequirements: [{ stat: 'wolvesKilled', target: 10 }],
    isUnlocked: false,
  },
  {
    id: 'miracle_worker',
    name: 'Miracle Worker',
    description: 'Cast 50 miracles.',
    rank: 'Adept',
    unlockRequirements: [{ stat: 'miraclesCast', target: 50 }],
    isUnlocked: false,
  },
  {
    id: 'technocracy',
    name: 'Technocrat',
    description: 'Reached technology level 10.',
    rank: 'Master',
    unlockRequirements: [{ stat: 'maxTechLevel', target: 10 }],
    isUnlocked: false,
  },
  {
    id: 'benevolent_god',
    name: 'Benevolent God',
    description: 'Maintained 100+ happiness across all tribes.',
    rank: 'Legend',
    unlockRequirements: [{ stat: 'minHappiness', target: 100 }],
    isUnlocked: false,
  },
  {
    id: 'pacifist',
    name: 'Pacifist',
    description: 'Reached 1000 population without combat deaths.',
    rank: 'Adept',
    unlockRequirements: [{ stat: 'population', target: 1000 }],
    isUnlocked: false,
  },
];

export interface PlayerStats {
  tribesCreated: number;
  maxSettlementLevel: number;
  wolvesKilled: number;
  miraclesCast: number;
  maxTechLevel: number;
  minHappiness: number;
  population: number;
  totalDevotion: number;
}

export class TitleManager {
  private ecs: ECS;
  private titles: Map<string, RankTitle> = new Map();
  private currentTitle: string | null = null;

  constructor(ecs: ECS) {
    this.ecs = ecs;
    for (const title of TITLE_DATABASE) {
      this.titles.set(title.id, { ...title });
    }
  }

  /** Check all titles against current world state and unlock qualifying ones */
  evaluateTitles(): string[] {
    const stats = this.calculateStats();
    const newlyUnlocked: string[] = [];

    for (const title of this.titles.values()) {
      if (title.isUnlocked) continue;

      const meetsAll = title.unlockRequirements.every((req) => {
        const value = stats[req.stat as keyof PlayerStats] ?? 0;
        return value >= req.target;
      });

      if (meetsAll) {
        title.isUnlocked = true;
        newlyUnlocked.push(title.id);
      }
    }

    return newlyUnlocked;
  }

  /** Get all unlocked titles */
  getUnlockedTitles(): RankTitle[] {
    return Array.from(this.titles.values()).filter((t) => t.isUnlocked);
  }

  /** Get all titles */
  getAllTitles(): RankTitle[] {
    return Array.from(this.titles.values());
  }

  /** Get current active title */
  getCurrentTitle(): RankTitle | null {
    if (!this.currentTitle) return null;
    return this.titles.get(this.currentTitle) ?? null;
  }

  /** Set active title (must be unlocked) */
  setCurrentTitle(titleId: string): boolean {
    const title = this.titles.get(titleId);
    if (!title || !title.isUnlocked) return false;
    this.currentTitle = titleId;
    return true;
  }

  /** Get current player rank based on highest unlocked title */
  getCurrentRank(): RankTitle['rank'] {
    const unlocked = this.getUnlockedTitles();
    if (unlocked.length === 0) return 'Novice';

    const rankOrder: RankTitle['rank'][] = ['Novice', 'Adept', 'Master', 'Legend'];
    let maxIndex = 0;
    for (const t of unlocked) {
      const idx = rankOrder.indexOf(t.rank);
      if (idx > maxIndex) maxIndex = idx;
    }
    return rankOrder[maxIndex];
  }

  private calculateStats(): PlayerStats {
    const stats: PlayerStats = {
      tribesCreated: 0,
      maxSettlementLevel: 0,
      wolvesKilled: 0,
      miraclesCast: 0,
      maxTechLevel: 0,
      minHappiness: 100,
      population: 0,
      totalDevotion: 0,
    };

    const societies = this.ecs.getEntitiesWith(['society']);
    for (const id of societies) {
      const society = this.ecs.getComponent<Society>(id, 'society');
      if (!society) continue;

      stats.tribesCreated++;
      stats.population += society.population;
      stats.maxTechLevel = Math.max(stats.maxTechLevel, society.technologyLevel);
      stats.minHappiness = Math.min(stats.minHappiness, society.happiness);
    }

    const fauna = this.ecs.getEntitiesWith(['fauna']);
    for (const id of fauna) {
      const f = this.ecs.getComponent<Fauna>(id, 'fauna');
      if (f && f.category === 'WOLF' && f.health <= 0) {
        stats.wolvesKilled++;
      }
    }

    return stats;
  }
}
