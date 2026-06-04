import { describe, it, expect, beforeEach } from 'vitest';
import { MoraleManager, BREAK_THRESHOLD, MORALE_MODIFIERS } from '../morale';
import { ECS } from '../../ecs';
import type { Position } from '../../../types';

describe('MoraleManager', () => {
  let ecs: ECS;
  let manager: MoraleManager;
  let entity: string;

  beforeEach(() => {
    ecs = new ECS();
    manager = new MoraleManager(ecs);
    entity = ecs.createEntity();
    manager.registerMorale(entity, 75);
  });

  describe('registration', () => {
    it('registers morale with default 75', () => {
      const m = manager.getMorale(entity);
      expect(m).toBeDefined();
      expect(m!.value).toBe(75);
      expect(m!.isFleeing).toBe(false);
    });

    it('registers morale with custom initial value', () => {
      const e2 = ecs.createEntity();
      manager.registerMorale(e2, 20);
      expect(manager.getMoraleValue(e2)).toBe(20);
      expect(manager.isFleeing(e2)).toBe(true);
    });

    it('clamps initial value to max 100', () => {
      const e2 = ecs.createEntity();
      manager.registerMorale(e2, 150);
      expect(manager.getMoraleValue(e2)).toBe(100);
    });

    it('clamps initial value to min 0', () => {
      const e2 = ecs.createEntity();
      manager.registerMorale(e2, -50);
      expect(manager.getMoraleValue(e2)).toBe(0);
    });

    it('returns undefined for unregistered entity', () => {
      expect(manager.getMorale('unknown')).toBeUndefined();
      expect(manager.getMoraleValue('unknown')).toBeUndefined();
      expect(manager.isFleeing('unknown')).toBe(false);
    });

    it('unregisters morale', () => {
      manager.unregisterMorale(entity);
      expect(manager.getMorale(entity)).toBeUndefined();
    });

    it('lists tracked entities', () => {
      expect(manager.getTrackedEntities()).toContain(entity);
    });
  });

  describe('modifyMorale', () => {
    it('increases morale', () => {
      manager.modifyMorale(entity, 10);
      expect(manager.getMoraleValue(entity)).toBe(85);
    });

    it('decreases morale', () => {
      manager.modifyMorale(entity, -20);
      expect(manager.getMoraleValue(entity)).toBe(55);
    });

    it('clamps at maximum 100', () => {
      manager.modifyMorale(entity, 100);
      expect(manager.getMoraleValue(entity)).toBe(100);
    });

    it('clamps at minimum 0', () => {
      manager.modifyMorale(entity, -200);
      expect(manager.getMoraleValue(entity)).toBe(0);
    });

    it('sets fleeing when below threshold', () => {
      manager.modifyMorale(entity, -55);
      expect(manager.isFleeing(entity)).toBe(true);
    });

    it('stops fleeing when rallied above threshold', () => {
      manager.setMorale(entity, 10);
      expect(manager.isFleeing(entity)).toBe(true);
      manager.modifyMorale(entity, 20);
      expect(manager.isFleeing(entity)).toBe(false);
    });
  });

  describe('setMorale', () => {
    it('sets exact value', () => {
      manager.setMorale(entity, 42);
      expect(manager.getMoraleValue(entity)).toBe(42);
    });

    it('returns undefined for unregistered entity', () => {
      expect(manager.setMorale('unknown', 50)).toBeUndefined();
    });
  });

  describe('situational modifiers', () => {
    it('applies outnumbered penalty', () => {
      manager.applyOutnumberedModifier(entity, 3, 5);
      expect(manager.getMoraleValue(entity)).toBe(75 + MORALE_MODIFIERS.outnumbered);
    });

    it('does not apply outnumbered when not outnumbered', () => {
      manager.applyOutnumberedModifier(entity, 5, 3);
      expect(manager.getMoraleValue(entity)).toBe(75);
    });

    it('applies commander presence', () => {
      manager.applyCommanderPresence(entity);
      expect(manager.getMoraleValue(entity)).toBe(75 + MORALE_MODIFIERS.commanderPresent);
    });

    it('applies casualty penalty per dead ally', () => {
      manager.applyCasualtyModifier(entity, 3);
      expect(manager.getMoraleValue(entity)).toBe(75 + 3 * MORALE_MODIFIERS.allyCasualty);
    });

    it('applies victory bonus', () => {
      manager.applyVictoryModifier(entity);
      expect(manager.getMoraleValue(entity)).toBe(75 + MORALE_MODIFIERS.victory);
    });
  });

  describe('rally', () => {
    it('boosts morale of nearby allies', () => {
      const ally = ecs.createEntity();
      manager.registerMorale(ally, 50);
      manager.rally(entity, [ally], 0);
      expect(manager.getMoraleValue(ally)).toBe(50 + MORALE_MODIFIERS.rallyAbility);
      expect(manager.isFleeing(ally)).toBe(false);
    });

    it('does not affect self', () => {
      manager.rally(entity, [entity], 0);
      expect(manager.getMoraleValue(entity)).toBe(75);
    });

    it('respects distance when positions exist', () => {
      const source = ecs.createEntity();
      const ally = ecs.createEntity();
      ecs.addComponent(source, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      ecs.addComponent(ally, { type: 'position', x: 100, y: 0, z: 0 } as Position);
      manager.registerMorale(source, 75);
      manager.registerMorale(ally, 50);
      manager.rally(source, [ally], 0);
      expect(manager.getMoraleValue(ally)).toBe(50); // too far
    });

    it('includes ally within radius', () => {
      const source = ecs.createEntity();
      const ally = ecs.createEntity();
      ecs.addComponent(source, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      ecs.addComponent(ally, { type: 'position', x: 3, y: 0, z: 0 } as Position);
      manager.registerMorale(source, 75);
      manager.registerMorale(ally, 50);
      const rallied = manager.rally(source, [ally], 0);
      expect(rallied).toContain(ally);
      expect(manager.getMoraleValue(ally)).toBe(50 + MORALE_MODIFIERS.rallyAbility);
    });

    it('updates lastRallyTime', () => {
      const ally = ecs.createEntity();
      manager.registerMorale(ally, 50);
      manager.rally(entity, [ally], 12345);
      expect(manager.getMorale(ally)!.lastRallyTime).toBe(12345);
    });
  });

  describe('rout propagation', () => {
    it('spreads morale penalty to nearby allies', () => {
      const fleePos = ecs.createEntity();
      const ally = ecs.createEntity();
      ecs.addComponent(fleePos, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      ecs.addComponent(ally, { type: 'position', x: 1, y: 0, z: 0 } as Position);
      manager.registerMorale(fleePos, 75);
      manager.registerMorale(ally, 75);
      manager.triggerFlee(fleePos);
      expect(manager.getMoraleValue(ally)).toBe(75 + MORALE_MODIFIERS.nearbyFleeing);
    });

    it('does not affect self', () => {
      const affected = manager.triggerFlee(entity);
      expect(affected).not.toContain(entity);
    });

    it('marks entity as fleeing', () => {
      manager.triggerFlee(entity);
      expect(manager.isFleeing(entity)).toBe(true);
    });
  });

  describe('tick', () => {
    it('accumulates delta and does nothing before interval', () => {
      manager.tick(0.5);
      expect(manager.getMoraleValue(entity)).toBe(75);
    });
  });

  describe('queries', () => {
    it('returns all morale snapshots', () => {
      const e2 = ecs.createEntity();
      manager.registerMorale(e2, 60);
      const all = manager.getAllMorale();
      expect(all).toHaveLength(2);
      expect(all.map((s) => s.entity)).toContain(entity);
      expect(all.map((s) => s.entity)).toContain(e2);
    });

    it('returns fleeing entities', () => {
      const e2 = ecs.createEntity();
      manager.registerMorale(e2, 20);
      const fleeing = manager.getFleeingEntities();
      expect(fleeing).toContain(e2);
      expect(fleeing).not.toContain(entity);
    });

    it('returns broken but not fleeing entities', () => {
      manager.setMorale(entity, 20);
      // setMorale automatically sets isFleeing; reset to test broken-but-not-fleeing detection
      manager.getMorale(entity)!.isFleeing = false;
      expect(manager.getBrokenEntities()).toContain(entity);
      manager.triggerFlee(entity);
      expect(manager.getBrokenEntities()).not.toContain(entity);
    });

    it('resolves breaks and triggers flee chain', () => {
      const e2 = ecs.createEntity();
      manager.registerMorale(e2, 75);
      manager.modifyMorale(e2, -55); // drop to 20, isFleeing becomes true in modifyMorale
      // Reset flee so it appears as broken but not fleeing
      const morale = manager.getMorale(e2)!;
      morale.isFleeing = false;
      const results = manager.resolveBreaks();
      expect(results.has(e2)).toBe(true);
      expect(manager.isFleeing(e2)).toBe(true);
    });
  });
});
