import { describe, it, expect } from 'vitest';
import { generateQuest, generateChain, QuestEngine, QUEST_EVALUATORS } from '../quests';
import type { WorldStateSnapshot } from '../../../types';

const baseWorld: WorldStateSnapshot = {
  population: 100,
  tribeCount: 3,
  averageHappiness: 50,
  averageTech: 2,
  weather: 'CLEAR',
  devotion: 150,
  totalStructures: 10,
  totalFlora: 40,
  totalFauna: 20,
  conflictsActive: 0,
  timePlayed: 0,
};

describe('generateQuest', () => {
  it('generates a population quest', () => {
    const q = generateQuest('population', baseWorld, 1);
    expect(q.type).toBe('population');
    expect(q.objectives[0].targetType).toBe('population');
    expect(q.rewards.devotion).toBeGreaterThan(0);
  });

  it('scales with difficulty', () => {
    const q1 = generateQuest('build', baseWorld, 1);
    const q2 = generateQuest('build', baseWorld, 2);
    expect(q2.objectives[0].targetValue).toBe(q1.objectives[0].targetValue * 2);
  });

  it('generates defeat quest with spell unlock', () => {
    const q = generateQuest('defeat', baseWorld, 1);
    expect(q.type).toBe('defeat');
    expect(q.rewards.spellUnlock).toBeDefined();
  });
});

describe('generateChain', () => {
  it('returns 3 quests', () => {
    const chain = generateChain('agriculture', baseWorld);
    expect(chain.length).toBe(3);
    expect(chain[0].chainId).toBe(chain[1].chainId);
    expect(chain[0].chainIndex).toBe(0);
    expect(chain[2].chainIndex).toBe(2);
  });

  it('returns divine chain by default', () => {
    const chain = generateChain('unknown', baseWorld);
    expect(chain.length).toBe(3);
    expect(chain[0].type).toBe('faith');
  });
});

describe('QuestEngine', () => {
  it('activates and tracks quests', () => {
    const engine = new QuestEngine();
    const q = generateQuest('population', baseWorld, 1);
    engine.activate(q);
    expect(engine.activeQuests.length).toBe(1);
  });

  it('completes quest when objective met', () => {
    const engine = new QuestEngine();
    const q = generateQuest('population', { ...baseWorld, population: 10 }, 1);
    engine.activate(q);
    const events = engine.update(0, { ...baseWorld, population: 100 });
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('completed');
    expect(engine.completedQuests.length).toBe(1);
  });

  it('fails quest on timeout', () => {
    const engine = new QuestEngine();
    const q = generateQuest('survive', baseWorld, 1);
    engine.activate(q);
    const events = engine.update(200, baseWorld);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('failed');
    expect(engine.failedQuests.length).toBe(1);
  });

  it('tracks chain completion', () => {
    const engine = new QuestEngine();
    const chain = generateChain('war', baseWorld);
    for (const q of chain) {
      engine.activate(q);
      // Manually satisfy objectives to test chain completion logic
      q.objectives.forEach((o) => { o.currentValue = o.targetValue; });
    }
    engine.update(0, baseWorld);
    expect(engine.isChainCompleted(chain[0].chainId!)).toBe(true);
  });

  it('addKill increments defeat objectives', () => {
    const engine = new QuestEngine();
    const q = generateQuest('defeat', baseWorld, 1);
    engine.activate(q);
    engine.addKill(2);
    expect(q.objectives[0].currentValue).toBe(2);
  });
});

describe('QUEST_EVALUATORS', () => {
  it('evaluates population', () => {
    const obj = { targetType: 'population', targetValue: 100, currentValue: 0, description: '' };
    const res = QUEST_EVALUATORS.population(obj, baseWorld);
    expect(res.current).toBe(100);
    expect(res.satisfied).toBe(true);
  });

  it('evaluates build', () => {
    const obj = { targetType: 'build', targetValue: 20, currentValue: 0, description: '' };
    const res = QUEST_EVALUATORS.build(obj, baseWorld);
    expect(res.satisfied).toBe(false);
  });
});
