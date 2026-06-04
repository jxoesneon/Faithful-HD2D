import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { DayNightManager } from '../daynight';
import { Fauna, Society, Movement } from '../../../types';

describe('DayNightManager edge cases', () => {
  let ecs: ECS;
  let manager: DayNightManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new DayNightManager(ecs);
  });

  // Midnight & cycle wrapping
  it('wraps timeOfDayMinutes after multiple days', () => {
    manager.setTotalGameMinutes(1440 * 100 + 720);
    const state = manager.getState();
    expect(state.gameDay).toBe(100);
    expect(state.timeOfDayMinutes).toBe(720);
    expect(state.isNight).toBe(false);
  });

  it('handles exactly 1440 minutes as start of next day', () => {
    manager.setTotalGameMinutes(1440);
    const state = manager.getState();
    expect(state.gameDay).toBe(1);
    expect(state.timeOfDayMinutes).toBe(0);
    expect(state.isNight).toBe(true);
  });

  it('handles very large totalGameMinutes without overflow', () => {
    manager.setTotalGameMinutes(Number.MAX_SAFE_INTEGER);
    const state = manager.getState();
    expect(state.timeOfDayMinutes).toBeGreaterThanOrEqual(0);
    expect(state.timeOfDayMinutes).toBeLessThan(1440);
  });

  // Twilight & sunrise/sunset boundaries
  it('marks exact sunrise minute (360) as twilight', () => {
    manager.setTotalGameMinutes(360);
    expect(manager.getState().isTwilight).toBe(true);
  });

  it('marks exact sunset minute (1080) as twilight', () => {
    manager.setTotalGameMinutes(1080);
    expect(manager.getState().isTwilight).toBe(true);
  });

  it('marks sunrise start boundary (300) as twilight', () => {
    manager.setTotalGameMinutes(300);
    expect(manager.getState().isTwilight).toBe(true);
  });

  it('marks sunset end boundary (1140) as twilight', () => {
    manager.setTotalGameMinutes(1140);
    expect(manager.getState().isTwilight).toBe(true);
  });

  it('is not twilight just after sunset end', () => {
    manager.setTotalGameMinutes(1141);
    expect(manager.getState().isTwilight).toBe(false);
    expect(manager.getState().isNight).toBe(true);
  });

  it('is not twilight just before sunrise start', () => {
    manager.setTotalGameMinutes(299);
    expect(manager.getState().isTwilight).toBe(false);
    expect(manager.getState().isNight).toBe(true);
  });

  // Ambient intensity boundaries
  it('returns minimum ambient at deep night', () => {
    manager.setTotalGameMinutes(0);
    expect(manager.getState().ambientIntensity).toBeCloseTo(0.05, 5);
  });

  it('returns maximum ambient during full day', () => {
    manager.setTotalGameMinutes(720);
    expect(manager.getState().ambientIntensity).toBe(1.0);
  });

  it('returns exact 0.05 ambient at sunrise start', () => {
    manager.setTotalGameMinutes(300);
    expect(manager.getState().ambientIntensity).toBeCloseTo(0.05, 5);
  });

  it('returns exact 1.0 ambient at sunrise end', () => {
    manager.setTotalGameMinutes(420);
    expect(manager.getState().ambientIntensity).toBeCloseTo(1.0, 5);
  });

  it('returns exact 1.0 ambient at sunset start', () => {
    manager.setTotalGameMinutes(1020);
    expect(manager.getState().ambientIntensity).toBeCloseTo(1.0, 5);
  });

  it('returns exact 0.05 ambient at sunset end', () => {
    manager.setTotalGameMinutes(1140);
    expect(manager.getState().ambientIntensity).toBeCloseTo(0.05, 5);
  });

  // Sun position boundaries
  it('sun y is near 0 at sunrise', () => {
    manager.setTotalGameMinutes(360);
    const pos = manager.getState().sunPosition;
    expect(pos.y).toBeCloseTo(0, 1);
  });

  it('sun y is near 0 at sunset', () => {
    manager.setTotalGameMinutes(1080);
    const pos = manager.getState().sunPosition;
    expect(pos.y).toBeCloseTo(0, 1);
  });

  // Moon phase boundaries
  it('returns NEW moon at day 0', () => {
    manager.setTotalGameMinutes(0);
    expect(manager.getState().moonPhase).toBe('NEW');
  });

  it('returns NEW moon at day 28 (start of next cycle)', () => {
    manager.setTotalGameMinutes(28 * 1440);
    expect(manager.getState().moonPhase).toBe('NEW');
  });

  it('returns WAXING_CRESCENT at day 4', () => {
    manager.setTotalGameMinutes(4 * 1440);
    expect(manager.getState().moonPhase).toBe('WAXING_CRESCENT');
  });

  it('returns WANING_CRESCENT at day 27', () => {
    manager.setTotalGameMinutes(27 * 1440);
    expect(manager.getState().moonPhase).toBe('WANING_CRESCENT');
  });

  // Entity behavior modifiers edge cases
  it('returns neutral modifier for entity without fauna or society', () => {
    const id = ecs.createEntity();
    const mod = manager.getEntityActivityModifier(id);
    expect(mod.speedMultiplier).toBe(1.0);
    expect(mod.shouldSleep).toBe(false);
    expect(mod.isHunting).toBe(false);
  });

  it('does not make wolf hunt at night if hunger is low', () => {
    const wolfId = ecs.createEntity();
    ecs.addComponent(wolfId, {
      type: 'fauna',
      category: 'WOLF',
      subType: 'timber',
      health: 100,
      hunger: 10,
      aggressiveness: 50,
      actionState: 'WANDERING',
    } as Fauna);

    manager.setTotalGameMinutes(0);
    const mod = manager.getEntityActivityModifier(wolfId);
    expect(mod.isHunting).toBe(false);
  });

  it('keeps nocturnal wolf speed high during twilight if still night', () => {
    const wolfId = ecs.createEntity();
    ecs.addComponent(wolfId, {
      type: 'fauna',
      category: 'WOLF',
      subType: 'timber',
      health: 100,
      hunger: 50,
      aggressiveness: 50,
      actionState: 'WANDERING',
    } as Fauna);

    manager.setTotalGameMinutes(1080); // sunset (twilight, still night)
    const mod = manager.getEntityActivityModifier(wolfId);
    expect(mod.speedMultiplier).toBeGreaterThan(1);
  });

  it('treats villager at exactly 8 PM as sleeping', () => {
    const villagerId = ecs.createEntity();
    ecs.addComponent(villagerId, {
      type: 'society',
      name: 'Test',
      faction: 'ANIMIST',
      population: 10,
      technologyLevel: 1,
      resources: 100,
      happiness: 50,
    } as Society);
    ecs.addComponent(villagerId, {
      type: 'movement',
      speed: 1,
      vx: 0,
      vy: 0,
      targetX: null,
      targetY: null,
      activityState: 'WANDERING',
    } as Movement);

    manager.setTotalGameMinutes(1200); // 8:00 PM
    const mod = manager.getEntityActivityModifier(villagerId);
    expect(mod.shouldSleep).toBe(true);
  });

  it('treats villager at exactly 5 AM as sleeping', () => {
    const villagerId = ecs.createEntity();
    ecs.addComponent(villagerId, {
      type: 'society',
      name: 'Test',
      faction: 'ANIMIST',
      population: 10,
      technologyLevel: 1,
      resources: 100,
      happiness: 50,
    } as Society);
    ecs.addComponent(villagerId, {
      type: 'movement',
      speed: 1,
      vx: 0,
      vy: 0,
      targetX: null,
      targetY: null,
      activityState: 'WANDERING',
    } as Movement);

    manager.setTotalGameMinutes(300); // 5:00 AM
    const mod = manager.getEntityActivityModifier(villagerId);
    expect(mod.shouldSleep).toBe(true);
  });

  it('does not change wolf action state if already WANDERING and shouldSleep', () => {
    const wolfId = ecs.createEntity();
    ecs.addComponent(wolfId, {
      type: 'fauna',
      category: 'WOLF',
      subType: 'timber',
      health: 100,
      hunger: 10,
      aggressiveness: 50,
      actionState: 'WANDERING',
    } as Fauna);

    manager.setTotalGameMinutes(720); // noon
    manager.applyEntityBehaviorChanges();
    const fauna = ecs.getComponent<Fauna>(wolfId, 'fauna');
    expect(fauna!.actionState).toBe('WANDERING');
  });
});
