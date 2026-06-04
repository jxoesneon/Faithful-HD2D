import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { DayNightManager } from '../daynight';
import { Position, Fauna, Society, Movement } from '../../../types';

describe('DayNightManager', () => {
  let ecs: ECS;
  let manager: DayNightManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new DayNightManager(ecs);
  });

  it('initializes with zero game time', () => {
    expect(manager.getTotalGameMinutes()).toBe(0);
  });

  it('advances game time by dt seconds (1 sec = 1 min)', () => {
    manager.update(10);
    expect(manager.getTotalGameMinutes()).toBe(10);
  });

  it('computes midnight state', () => {
    manager.setTotalGameMinutes(0);
    const state = manager.getState();
    expect(state.timeOfDayMinutes).toBe(0);
    expect(state.isNight).toBe(true);
    expect(state.ambientIntensity).toBeCloseTo(0.05, 1);
  });

  it('computes noon state', () => {
    manager.setTotalGameMinutes(720);
    const state = manager.getState();
    expect(state.timeOfDayMinutes).toBe(720);
    expect(state.isNight).toBe(false);
    expect(state.ambientIntensity).toBe(1.0);
    expect(state.sunPosition.y).toBeCloseTo(1, 5);
  });

  it('computes sunset state', () => {
    manager.setTotalGameMinutes(1080);
    const state = manager.getState();
    expect(state.timeOfDayMinutes).toBe(1080);
    expect(state.isTwilight).toBe(true);
  });

  it('increments game day after 1440 minutes', () => {
    manager.setTotalGameMinutes(1440);
    const state = manager.getState();
    expect(state.gameDay).toBe(1);
    expect(state.timeOfDayMinutes).toBe(0);
  });

  it('produces lighting uniforms', () => {
    manager.setTotalGameMinutes(360);
    const uniforms = manager.getLightingUniforms();
    expect(uniforms.uTimeOfDay).toBe(360 / 1440);
    expect(uniforms.uAmbientIntensity).toBeGreaterThan(0);
    expect(uniforms.uSunPosition.length).toBe(3);
  });

  it('cycles through moon phases', () => {
    const phases = new Set<string>();
    for (let day = 0; day < 28; day++) {
      manager.setTotalGameMinutes(day * 1440);
      phases.add(manager.getState().moonPhase);
    }
    expect(phases.size).toBeGreaterThan(1);
  });

  it('returns full moon at specific day', () => {
    manager.setTotalGameMinutes(14 * 1440);
    const state = manager.getState();
    expect(state.moonPhase).toBe('FULL');
  });

  it('changes sky colors throughout the day', () => {
    const midnight = manager.getState();
    manager.setTotalGameMinutes(720);
    const noon = manager.getState();
    expect(noon.skyColorTop[0]).toBeGreaterThan(midnight.skyColorTop[0]);
    expect(noon.ambientIntensity).toBeGreaterThan(midnight.ambientIntensity);
  });

  describe('entity behavior modifiers', () => {
    it('makes wolves hunt at night', () => {
      const wolfId = ecs.createEntity();
      ecs.addComponent(wolfId, {
        type: 'fauna',
        category: 'WOLF',
        subType: ' timber',
        health: 100,
        hunger: 50,
        aggressiveness: 50,
        actionState: 'WANDERING',
      } as Fauna);

      manager.setTotalGameMinutes(0); // midnight
      const mod = manager.getEntityActivityModifier(wolfId);
      expect(mod.isHunting).toBe(true);
      expect(mod.speedMultiplier).toBeGreaterThan(1);
    });

    it('makes wolves sleep during day', () => {
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
      const mod = manager.getEntityActivityModifier(wolfId);
      expect(mod.shouldSleep).toBe(true);
      expect(mod.speedMultiplier).toBeLessThan(1);
    });

    it('makes villagers sleep at night', () => {
      const villagerId = ecs.createEntity();
      ecs.addComponent(villagerId, {
        type: 'society',
        name: 'Test Village',
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

      manager.setTotalGameMinutes(0); // midnight
      const mod = manager.getEntityActivityModifier(villagerId);
      expect(mod.shouldSleep).toBe(true);
      expect(mod.speedMultiplier).toBeLessThan(1);
    });

    it('keeps villagers active during day', () => {
      const villagerId = ecs.createEntity();
      ecs.addComponent(villagerId, {
        type: 'society',
        name: 'Test Village',
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

      manager.setTotalGameMinutes(720); // noon
      const mod = manager.getEntityActivityModifier(villagerId);
      expect(mod.shouldSleep).toBe(false);
      expect(mod.speedMultiplier).toBe(1.0);
    });
  });

  describe('applyEntityBehaviorChanges', () => {
    it('updates wolf action state to HUNTING at night', () => {
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

      manager.setTotalGameMinutes(0);
      manager.applyEntityBehaviorChanges();
      const fauna = ecs.getComponent<Fauna>(wolfId, 'fauna');
      expect(fauna!.actionState).toBe('HUNTING');
    });

    it('sets villager movement to IDLE at night', () => {
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

      manager.setTotalGameMinutes(0);
      manager.applyEntityBehaviorChanges();
      const movement = ecs.getComponent<Movement>(villagerId, 'movement');
      expect(movement!.activityState).toBe('IDLE');
    });
  });
});
