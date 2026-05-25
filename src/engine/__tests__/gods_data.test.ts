import { describe, it, expect } from 'vitest';
import { GODS_PANTHEON } from '../gods_data';

describe('Gods Data', () => {
  it('runs all functions without errors', () => {
    let mockEntities = ['e1'];
    const ecsMock = { 
      getEntitiesWith: () => mockEntities, 
      getComponent: () => ({ 
        name: 'test', 
        type: 'society', 
        state: 'peace',
        subType: 'TIGER',
        category: 'WOLF',
        beliefMatrix: { ANIMISM: 0, TECHNOCRACY: 0, INTERVENTIONISM: 0, NIHILISM: 0, ELEMENTALISM: 0 },
        dominantBelief: 'ANIMISM',
        population: 10,
        resources: 100,
        health: 100,
        growthRate: 1,
        maxPopulation: 100,
        stage: 'adult',
        x: 0,
        y: 0
      }),
      addComponent: () => {},
      removeEntity: () => {}
    };
    const simMock = { 
      totalDevotion: 1000,
      setWeather: () => {},
      triggerLocalizedSpell: () => true,
      spawnFauna: () => {},
      spawnFlora: () => {},
      spawnStructure: () => {},
      spawnTribe: () => {},
      addEventLog: () => {}
    };
    const statsMock = { population: 100, religions: { 'ANIMISM': 100, 'TECHNOCRACY': 0, 'INTERVENTIONISM': 0, 'NIHILISM': 0, 'ELEMENTALISM': 0 }, techAverage: 10 };
    
    GODS_PANTHEON.forEach(god => {
      god.startingBoost(ecsMock as any, simMock as any);
      god.skills.forEach(skill => {
        skill.action(ecsMock as any, simMock as any);
        skill.checkUnlocked(statsMock as any, 1000, ecsMock as any, simMock as any);
      });
    });
  });
});
