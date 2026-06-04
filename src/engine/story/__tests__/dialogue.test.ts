import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { DialogueManager } from '../dialogue';

describe('DialogueManager', () => {
  let ecs: ECS;
  let manager: DialogueManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new DialogueManager(ecs);
  });

  it('evaluates dialogue node with choices', () => {
    const node = {
      id: 'node1',
      speaker: 'Elder',
      text: 'Welcome, god.',
      choices: [
        { id: 'c1', label: 'Bless them', nextNodeId: 'node2' },
        { id: 'c2', label: 'Smite them', nextNodeId: null },
      ],
    };
    const choices = manager.evaluateNode(node);
    expect(choices.length).toBe(2);
  });

  it('unlocks lore entry', () => {
    expect(manager.unlockLore('lore_1')).toBe(true);
    expect(manager.getUnlockedLore().length).toBe(1);
  });

  it('returns false for unknown lore', () => {
    expect(manager.unlockLore('unknown')).toBe(false);
  });

  it('discovers creatures in bestiary', () => {
    manager.discoverCreature('WOLF', 'Wolf', 'A fierce predator');
    const entry = manager.getBestiaryEntry('WOLF');
    expect(entry!.discovered).toBe(true);
  });

  it('records kills in bestiary', () => {
    manager.discoverCreature('WOLF', 'Wolf', 'A fierce predator');
    manager.recordKill('WOLF');
    manager.recordKill('WOLF');
    expect(manager.getBestiaryEntry('WOLF')!.killCount).toBe(2);
  });

  it('discovers flora in herbarium', () => {
    manager.discoverFlora('CROP', 'Wheat', 'A staple grain');
    const entry = manager.getHerbariumEntry('CROP');
    expect(entry!.discovered).toBe(true);
  });

  it('records harvests in herbarium', () => {
    manager.discoverFlora('CROP', 'Wheat', 'A staple grain');
    manager.recordHarvest('CROP');
    expect(manager.getHerbariumEntry('CROP')!.harvestCount).toBe(1);
  });

  it('adds and retrieves timeline events', () => {
    const event = manager.addTimelineEvent({
      timestamp: 100,
      title: 'First Miracle',
      description: 'A divine blessing was cast.',
      category: 'Religious',
    });
    expect(event.id).toBeDefined();
    expect(manager.getTimeline().length).toBe(1);
  });

  it('filters timeline by category', () => {
    manager.addTimelineEvent({ timestamp: 1, title: 'A', description: 'D', category: 'Religious' });
    manager.addTimelineEvent({ timestamp: 2, title: 'B', description: 'D', category: 'Military' });
    expect(manager.getTimelineByCategory('Religious').length).toBe(1);
  });
});
