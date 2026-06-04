import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { TitleManager } from '../titles';
import type { Society } from '../../../types';

describe('TitleManager', () => {
  let ecs: ECS;
  let manager: TitleManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new TitleManager(ecs);
  });

  it('evaluates titles and unlocks qualifying ones', () => {
    // Create a tribe to satisfy "first_tribe"
    const s = ecs.createEntity();
    ecs.addComponent(s, { type: 'society', name: 'T', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 0, happiness: 50 } as Society);

    const unlocked = manager.evaluateTitles();
    expect(unlocked).toContain('first_tribe');
  });

  it('returns unlocked titles', () => {
    const s = ecs.createEntity();
    ecs.addComponent(s, { type: 'society', name: 'T', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 0, happiness: 50 } as Society);

    manager.evaluateTitles();
    expect(manager.getUnlockedTitles().length).toBeGreaterThan(0);
  });

  it('sets current title when unlocked', () => {
    const s = ecs.createEntity();
    ecs.addComponent(s, { type: 'society', name: 'T', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 0, happiness: 50 } as Society);

    manager.evaluateTitles();
    expect(manager.setCurrentTitle('first_tribe')).toBe(true);
    expect(manager.getCurrentTitle()!.id).toBe('first_tribe');
  });

  it('refuses to set locked title', () => {
    expect(manager.setCurrentTitle('city_builder')).toBe(false);
  });

  it('calculates current rank', () => {
    const s = ecs.createEntity();
    ecs.addComponent(s, { type: 'society', name: 'T', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 0, happiness: 50 } as Society);

    manager.evaluateTitles();
    expect(manager.getCurrentRank()).toBe('Novice');
  });

  it('returns Novice when no titles unlocked', () => {
    expect(manager.getCurrentRank()).toBe('Novice');
  });
});
