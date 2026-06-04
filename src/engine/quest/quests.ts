import type { Quest, QuestType, QuestObjective, QuestReward, WorldStateSnapshot } from '../../types';

/**
 * Evaluate an objective against the current world state.
 * Returns the new currentValue and whether it's satisfied.
 */
export type ObjectiveEvaluator = (obj: QuestObjective, world: WorldStateSnapshot) => { current: number; satisfied: boolean };

export const QUEST_EVALUATORS: Record<string, ObjectiveEvaluator> = {
  population: (obj, world) => {
    const current = world.population;
    return { current, satisfied: current >= obj.targetValue };
  },
  tribeCount: (obj, world) => {
    const current = world.tribeCount;
    return { current, satisfied: current >= obj.targetValue };
  },
  build: (obj, world) => {
    const current = world.totalStructures;
    return { current, satisfied: current >= obj.targetValue };
  },
  survive: (obj, world) => {
    // survival quests are time-based; evaluator just passes through timer
    const current = obj.currentValue + 1; // tick up each check
    return { current, satisfied: current >= obj.targetValue };
  },
  defeat: (obj, world) => {
    // hypothetical combat stat
    const current = obj.currentValue; // driven by external kills counter
    return { current, satisfied: current >= obj.targetValue };
  },
  faith: (obj, world) => {
    const current = world.devotion;
    return { current, satisfied: current >= obj.targetValue };
  },
  explore: (obj, world) => {
    const current = obj.currentValue + 1; // placeholder
    return { current, satisfied: current >= obj.targetValue };
  },
  harvest: (obj, world) => {
    const current = world.totalFlora;
    return { current, satisfied: current >= obj.targetValue };
  },
  diplomacy: (obj, world) => {
    const current = world.conflictsActive === 0 ? obj.targetValue : obj.currentValue;
    return { current, satisfied: current >= obj.targetValue };
  },
};

function generateQuestId(): string {
  return `q-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function makeObjective(type: string, targetValue: number, description: string): QuestObjective {
  return { targetType: type, targetValue, currentValue: 0, description };
}

/**
 * Generate a single quest based on type and optional difficulty multiplier.
 */
export function generateQuest(type: QuestType, world: WorldStateSnapshot, difficulty = 1): Quest {
  const id = generateQuestId();
  const mult = Math.max(1, difficulty);

  switch (type) {
    case 'population':
      return {
        id,
        title: 'Populace Expansion',
        description: 'Guide your tribe to grow its numbers.',
        type,
        objectives: [makeObjective('population', Math.floor(50 * mult), `Reach ${Math.floor(50 * mult)} total population`)],
        rewards: { devotion: 20 * mult, divineXP: 10 * mult },
        isActive: false,
        isCompleted: false,
        isFailed: false,
      };
    case 'build':
      return {
        id,
        title: 'Architectural Mandate',
        description: 'Erect structures to solidify your domain.',
        type,
        objectives: [makeObjective('build', Math.floor(5 * mult), `Construct ${Math.floor(5 * mult)} structures`)],
        rewards: { devotion: 15 * mult, illuminationPoints: 1 },
        isActive: false,
        isCompleted: false,
        isFailed: false,
      };
    case 'survive':
      return {
        id,
        title: 'Trial of Endurance',
        description: 'Survive the coming hardship for the allotted time.',
        type,
        objectives: [makeObjective('survive', Math.floor(120 * mult), `Survive for ${Math.floor(120 * mult)} seconds`)],
        rewards: { devotion: 30 * mult, divineXP: 15 * mult },
        isActive: false,
        isCompleted: false,
        isFailed: false,
        timeLimit: Math.floor(180 * mult),
        timeRemaining: Math.floor(180 * mult),
        onFailConsequence: 'Population happiness drops by 20% and devotion halved for 60s.',
      };
    case 'defeat':
      return {
        id,
        title: 'Hunter\'s Call',
        description: 'Defeat the encroaching threat.',
        type,
        objectives: [makeObjective('defeat', Math.floor(3 * mult), `Defeat ${Math.floor(3 * mult)} wolf packs`)],
        rewards: { devotion: 25 * mult, spellUnlock: 'lightning_arc' },
        isActive: false,
        isCompleted: false,
        isFailed: false,
      };
    case 'faith':
      return {
        id,
        title: 'Beacon of Belief',
        description: 'Amass devotion to prove your divine mandate.',
        type,
        objectives: [makeObjective('faith', Math.floor(200 * mult), `Accumulate ${Math.floor(200 * mult)} devotion`)],
        rewards: { divineXP: 25 * mult, illuminationPoints: 2 },
        isActive: false,
        isCompleted: false,
        isFailed: false,
      };
    case 'explore':
      return {
        id,
        title: 'Frontier Scout',
        description: 'Push the boundaries of the known world.',
        type,
        objectives: [makeObjective('explore', Math.floor(10 * mult), `Explore ${Math.floor(10 * mult)} new sectors`)],
        rewards: { devotion: 10 * mult, divineXP: 5 * mult },
        isActive: false,
        isCompleted: false,
        isFailed: false,
      };
    case 'harvest':
      return {
        id,
        title: 'Bountiful Harvest',
        description: 'Cultivate the land and reap its rewards.',
        type,
        objectives: [makeObjective('harvest', Math.floor(20 * mult), `Harvest ${Math.floor(20 * mult)} flora`)],
        rewards: { devotion: 12 * mult, illuminationPoints: 1 },
        isActive: false,
        isCompleted: false,
        isFailed: false,
      };
    case 'diplomacy':
      return {
        id,
        title: 'Pact of Peace',
        description: 'Ensure no conflicts exist among your tribes.',
        type,
        objectives: [makeObjective('diplomacy', 1, 'Resolve all active conflicts')],
        rewards: { devotion: 40 * mult, divineXP: 20 * mult },
        isActive: false,
        isCompleted: false,
        isFailed: false,
      };
    default:
      return generateQuest('population', world, difficulty);
  }
}

/**
 * Generate a 3-part quest chain with a cohesive narrative theme.
 */
export function generateChain(theme: string, world: WorldStateSnapshot): Quest[] {
  const chainId = `chain-${Date.now()}`;
  if (theme === 'agriculture') {
    return [
      { ...generateQuest('harvest', world, 1), id: generateQuestId(), chainId, chainIndex: 0, chainLength: 3, title: 'Sow the Seeds', description: 'Begin your agricultural legacy.' },
      { ...generateQuest('population', world, 1.2), id: generateQuestId(), chainId, chainIndex: 1, chainLength: 3, title: 'Feed the Masses', description: 'Grow enough food to support a larger tribe.' },
      { ...generateQuest('build', world, 1.5), id: generateQuestId(), chainId, chainIndex: 2, chainLength: 3, title: 'Granary of the Gods', description: 'Construct mighty storehouses to endure any famine.' },
    ];
  }
  if (theme === 'war') {
    return [
      { ...generateQuest('defeat', world, 1), id: generateQuestId(), chainId, chainIndex: 0, chainLength: 3, title: 'First Blood', description: 'Repel the initial scouting party.' },
      { ...generateQuest('survive', world, 1.2), id: generateQuestId(), chainId, chainIndex: 1, chainLength: 3, title: 'Siege Mentality', description: 'Withstand the onslaught.' },
      { ...generateQuest('diplomacy', world, 1.5), id: generateQuestId(), chainId, chainIndex: 2, chainLength: 3, title: 'Treaty or Triumph', description: 'End the war through force or diplomacy.' },
    ];
  }
  if (theme === 'pilgrimage') {
    return [
      { ...generateQuest('faith', world, 1), id: generateQuestId(), chainId, chainIndex: 0, chainLength: 3, title: 'First Steps', description: 'A humble traveler feels the call to walk a sacred road.' },
      { ...generateQuest('explore', world, 1.2), id: generateQuestId(), chainId, chainIndex: 1, chainLength: 3, title: 'Road of Dust', description: 'Cross uncharted lands to reach the holy mountain.' },
      { ...generateQuest('build', world, 1.5), id: generateQuestId(), chainId, chainIndex: 2, chainLength: 3, title: 'Shrine at the Summit', description: 'Erect a monument where heaven and earth converge.' },
    ];
  }
  if (theme === 'holy_war') {
    return [
      { ...generateQuest('defeat', world, 1), id: generateQuestId(), chainId, chainIndex: 0, chainLength: 4, title: 'Crusader\'s Oath', description: 'Rally the faithful for a war of conversion.' },
      { ...generateQuest('survive', world, 1.2), id: generateQuestId(), chainId, chainIndex: 1, chainLength: 4, title: 'Siege of the Unbelievers', description: 'Withstand the counter-assault of the besieged.' },
      { ...generateQuest('faith', world, 1.5), id: generateQuestId(), chainId, chainIndex: 2, chainLength: 4, title: 'Banner of the One True God', description: 'Amass enough devotion to sanctify the campaign.' },
      { ...generateQuest('diplomacy', world, 2), id: generateQuestId(), chainId, chainIndex: 3, chainLength: 4, title: 'Edict of Submission', description: 'Force every tribe to kneel or perish.' },
    ];
  }
  if (theme === 'economic_boom') {
    return [
      { ...generateQuest('harvest', world, 1), id: generateQuestId(), chainId, chainIndex: 0, chainLength: 3, title: 'Seed Capital', description: 'Prove the land can yield more than it takes.' },
      { ...generateQuest('build', world, 1.3), id: generateQuestId(), chainId, chainIndex: 1, chainLength: 3, title: 'Guild Founding', description: 'Construct market halls and trade depots.' },
      { ...generateQuest('population', world, 1.6), id: generateQuestId(), chainId, chainIndex: 2, chainLength: 3, title: 'Merchant Prince', description: 'Grow a metropolis funded by commerce alone.' },
    ];
  }
  if (theme === 'plague_survival') {
    return [
      { ...generateQuest('survive', world, 1), id: generateQuestId(), chainId, chainIndex: 0, chainLength: 4, title: 'Patient Zero', description: 'The sickness arrives. Keep the tribe alive.' },
      { ...generateQuest('harvest', world, 1.2), id: generateQuestId(), chainId, chainIndex: 1, chainLength: 4, title: 'Bitter Medicine', description: 'Forage rare herbs to brew a cure.' },
      { ...generateQuest('population', world, 1.4), id: generateQuestId(), chainId, chainIndex: 2, chainLength: 4, title: 'Repopulation', description: 'Rebuild numbers after the dying time.' },
      { ...generateQuest('faith', world, 1.8), id: generateQuestId(), chainId, chainIndex: 3, chainLength: 4, title: 'Thanksgiving', description: 'Dedicate surviving lives to the divine.' },
    ];
  }
  if (theme === 'technological_revolution') {
    return [
      { ...generateQuest('build', world, 1), id: generateQuestId(), chainId, chainIndex: 0, chainLength: 3, title: 'First Principles', description: 'Construct a workshop to test new ideas.' },
      { ...generateQuest('explore', world, 1.2), id: generateQuestId(), chainId, chainIndex: 1, chainLength: 3, title: 'Empirical Survey', description: 'Map the world with scientific precision.' },
      { ...generateQuest('population', world, 1.5), id: generateQuestId(), chainId, chainIndex: 2, chainLength: 3, title: 'Enlightened Society', description: 'Lead a people who have replaced faith with reason.' },
    ];
  }
  // default divine chain
  return [
    { ...generateQuest('faith', world, 1), id: generateQuestId(), chainId, chainIndex: 0, chainLength: 3, title: 'Whispers of the Divine', description: 'The first signs of your presence are felt.' },
    { ...generateQuest('build', world, 1.2), id: generateQuestId(), chainId, chainIndex: 1, chainLength: 3, title: 'Sanctified Ground', description: 'Raise altars to channel your power.' },
    { ...generateQuest('population', world, 1.5), id: generateQuestId(), chainId, chainIndex: 2, chainLength: 3, title: 'Divine Empire', description: 'Lead a civilization under your eternal gaze.' },
  ];
}

/**
 * Active quest engine that tracks progress, timers, and completion.
 */
export class QuestEngine {
  private quests: Quest[] = [];
  private completedChains = new Set<string>();
  private evaluators = QUEST_EVALUATORS;

  get activeQuests(): Quest[] {
    return this.quests.filter((q) => q.isActive && !q.isCompleted && !q.isFailed);
  }

  get completedQuests(): Quest[] {
    return this.quests.filter((q) => q.isCompleted);
  }

  get failedQuests(): Quest[] {
    return this.quests.filter((q) => q.isFailed);
  }

  /**
   * Activate a generated or loaded quest.
   */
  activate(quest: Quest): void {
    quest.isActive = true;
    quest.isCompleted = false;
    quest.isFailed = false;
    if (quest.timeLimit !== undefined) {
      quest.timeRemaining = quest.timeLimit;
    }
    this.quests.push(quest);
  }

  /**
   * Update all active quests.
   * @param dt Seconds elapsed.
   * @param world Current world snapshot.
   * @returns Array of quest events: `{ type: 'completed' | 'failed', quest: Quest }[]`
   */
  update(dt: number, world: WorldStateSnapshot): { type: 'completed' | 'failed'; quest: Quest }[] {
    const events: { type: 'completed' | 'failed'; quest: Quest }[] = [];
    for (const quest of this.quests) {
      if (!quest.isActive || quest.isCompleted || quest.isFailed) continue;

      // Time limit countdown
      if (quest.timeRemaining !== undefined) {
        quest.timeRemaining -= dt;
        if (quest.timeRemaining <= 0) {
          this.failQuest(quest);
          events.push({ type: 'failed', quest });
          continue;
        }
      }

      // Evaluate objectives
      let allSatisfied = true;
      for (const obj of quest.objectives) {
        const evaluator = this.evaluators[obj.targetType];
        if (!evaluator) continue;
        const result = evaluator(obj, world);
        obj.currentValue = result.current;
        if (!result.satisfied) allSatisfied = false;
      }

      if (allSatisfied) {
        this.completeQuest(quest);
        events.push({ type: 'completed', quest });
      }
    }
    return events;
  }

  /**
   * Manually advance a defeat/kill counter for defeat quests.
   */
  addKill(count = 1): void {
    for (const quest of this.quests) {
      if (!quest.isActive || quest.isCompleted || quest.isFailed) continue;
      for (const obj of quest.objectives) {
        if (obj.targetType === 'defeat') {
          obj.currentValue += count;
        }
      }
    }
  }

  /**
   * Manually advance an explore counter.
   */
  addExplore(count = 1): void {
    for (const quest of this.quests) {
      if (!quest.isActive || quest.isCompleted || quest.isFailed) continue;
      for (const obj of quest.objectives) {
        if (obj.targetType === 'explore') {
          obj.currentValue += count;
        }
      }
    }
  }

  private completeQuest(quest: Quest): void {
    quest.isCompleted = true;
    quest.isActive = false;
    if (quest.chainId && quest.chainIndex !== undefined) {
      this.checkChainCompletion(quest.chainId);
    }
  }

  private failQuest(quest: Quest): void {
    quest.isFailed = true;
    quest.isActive = false;
  }

  private checkChainCompletion(chainId: string): void {
    const chain = this.quests.filter((q) => q.chainId === chainId);
    if (chain.length > 0 && chain.every((q) => q.isCompleted)) {
      this.completedChains.add(chainId);
    }
  }

  isChainCompleted(chainId: string): boolean {
    return this.completedChains.has(chainId);
  }

  getQuestById(id: string): Quest | undefined {
    return this.quests.find((q) => q.id === id);
  }

  clear(): void {
    this.quests = [];
    this.completedChains.clear();
  }
}
