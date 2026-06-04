import { describe, it, expect, beforeEach } from 'vitest';
import { CombatManager } from '../resolution';
import { ECS } from '../../ecs';
import type { Biology, Position, CombatStats } from '../../../types';

describe('CombatManager', () => {
  let ecs: ECS;
  let manager: CombatManager;
  let attacker: string;
  let target: string;

  beforeEach(() => {
    ecs = new ECS();
    manager = new CombatManager(ecs);

    attacker = ecs.createEntity();
    target = ecs.createEntity();

    ecs.addComponent(attacker, { type: 'biology', biomass: 10, health: 100, dna: '' } as Biology);
    ecs.addComponent(target, { type: 'biology', biomass: 10, health: 100, dna: '' } as Biology);

    const aStats: CombatStats = {
      type: 'combatStats',
      attack: 20,
      defense: 5,
      speed: 5,
      range: 1,
      elementalType: 'Fire',
      resistances: { Fire: 0, Frost: 0, Lightning: 0, Earth: 0, Divine: 0 },
      unitClass: 'Infantry',
    };

    const tStats: CombatStats = {
      type: 'combatStats',
      attack: 10,
      defense: 5,
      speed: 5,
      range: 1,
      elementalType: 'Earth',
      resistances: { Fire: 0, Frost: 0, Lightning: 0, Earth: 0, Divine: 0 },
      unitClass: 'Infantry',
    };

    manager.registerCombatStats(attacker, aStats);
    manager.registerCombatStats(target, tStats);
  });

  describe('registration', () => {
    it('registers and retrieves combat stats', () => {
      const stats = manager.getCombatStats(attacker);
      expect(stats).toBeDefined();
      expect(stats!.attack).toBe(20);
    });

    it('returns undefined for unregistered entity', () => {
      expect(manager.getCombatStats('nonexistent')).toBeUndefined();
    });

    it('unregisters combat stats', () => {
      manager.unregisterCombatStats(attacker);
      expect(manager.getCombatStats(attacker)).toBeUndefined();
    });

    it('lists tracked entities', () => {
      expect(manager.getTrackedEntities()).toContain(attacker);
      expect(manager.getTrackedEntities()).toContain(target);
    });
  });

  describe('executeAttack', () => {
    it('deals damage and logs event', () => {
      const rng = () => 0.99; // no crit, high variance
      const event = manager.executeAttack(attacker, target, 10, rng);
      expect(event).toBeDefined();
      expect(event!.damage).toBeGreaterThanOrEqual(1);
      expect(event!.attacker).toBe(attacker);
      expect(event!.target).toBe(target);

      const biology = ecs.getComponent<Biology>(target, 'biology');
      expect(biology!.health).toBeLessThan(100);
    });

    it('returns undefined if attacker lacks stats', () => {
      const unknown = ecs.createEntity();
      expect(manager.executeAttack(unknown, target)).toBeUndefined();
    });

    it('returns undefined if target lacks stats', () => {
      const unknown = ecs.createEntity();
      expect(manager.executeAttack(attacker, unknown)).toBeUndefined();
    });

    it('uses default base damage when not specified', () => {
      const event = manager.executeAttack(attacker, target, undefined, () => 0.99);
      expect(event).toBeDefined();
      expect(event!.baseDamage).toBe(10);
    });

    it('marks fatal when health reaches 0', () => {
      // Make target very weak
      ecs.addComponent(target, { type: 'biology', biomass: 1, health: 1, dna: '' } as Biology);
      const event = manager.executeAttack(attacker, target, 50, () => 0.5);
      expect(event!.fatal).toBe(true);
    });

    it('creates damage numbers and hit sparks', () => {
      manager.executeAttack(attacker, target, 10, () => 0.5);
      expect(manager.getDamageNumbers().length).toBeGreaterThan(0);
      expect(manager.getHitSparks().length).toBeGreaterThan(0);
    });
  });

  describe('combat log', () => {
    it('prunes old entries when max size exceeded', () => {
      const smallManager = new CombatManager(ecs, { maxLogSize: 3 });
      const stats: CombatStats = {
        type: 'combatStats',
        attack: 10,
        defense: 5,
        speed: 5,
        range: 1,
        elementalType: 'Fire',
        resistances: { Fire: 0, Frost: 0, Lightning: 0, Earth: 0, Divine: 0 },
        unitClass: 'Infantry',
      };
      const e1 = ecs.createEntity();
      const e2 = ecs.createEntity();
      ecs.addComponent(e1, { type: 'biology', biomass: 1, health: 100, dna: '' } as Biology);
      ecs.addComponent(e2, { type: 'biology', biomass: 1, health: 100, dna: '' } as Biology);
      smallManager.registerCombatStats(attacker, stats);
      smallManager.registerCombatStats(e1, stats);
      smallManager.registerCombatStats(e2, stats);

      smallManager.executeAttack(attacker, e1, 5, () => 0.5);
      smallManager.executeAttack(attacker, e2, 5, () => 0.5);
      smallManager.executeAttack(attacker, target, 5, () => 0.5);
      smallManager.executeAttack(attacker, e1, 5, () => 0.5);

      expect(smallManager.getCombatLog().length).toBe(3);
    });

    it('clears log on demand', () => {
      manager.executeAttack(attacker, target, 10, () => 0.5);
      manager.clearLog();
      expect(manager.getCombatLog().length).toBe(0);
    });
  });

  describe('visual feedback cleanup', () => {
    it('removes expired damage numbers and sparks', () => {
      manager.executeAttack(attacker, target, 10, () => 0.5);
      expect(manager.getDamageNumbers().length).toBe(1);
      manager.cleanupVisualFeedback(Date.now() + 5000);
      expect(manager.getDamageNumbers().length).toBe(0);
      expect(manager.getHitSparks().length).toBe(0);
    });
  });

  describe('range check', () => {
    it('allows attack when in range', () => {
      ecs.addComponent(attacker, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      ecs.addComponent(target, { type: 'position', x: 0, y: 0.5, z: 0 } as Position);
      expect(manager.canAttackInRange(attacker, target)).toBe(true);
    });

    it('denies attack when out of range', () => {
      ecs.addComponent(attacker, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      ecs.addComponent(target, { type: 'position', x: 100, y: 0, z: 0 } as Position);
      expect(manager.canAttackInRange(attacker, target)).toBe(false);
    });

    it('denies attack when position missing', () => {
      expect(manager.canAttackInRange(attacker, target)).toBe(false);
    });
  });

  describe('phase management', () => {
    it('initiates combat and sets phases', () => {
      manager.initiateCombat(attacker, target);
      expect(manager.getEntityPhase(attacker)).toBe('Initiation');
      expect(manager.getEntityPhase(target)).toBe('Initiation');
    });

    it('advances phases on update', () => {
      manager.initiateCombat(attacker, target);
      manager.updatePhases(1); // beyond Initiation (0.5s)
      expect(manager.getEntityPhase(attacker)).not.toBe('Initiation');
    });

    it('executes attack when entering Attack phase', () => {
      manager.initiateCombat(attacker, target);
      manager.updatePhases(0.6); // Initiation -> Approach
      manager.updatePhases(1.1); // Approach -> Attack -> Resolution
      const log = manager.getCombatLog();
      expect(log.length).toBeGreaterThan(0);
    });
  });

  describe('cooldowns', () => {
    it('reduces cooldown timers', () => {
      manager.executeAttack(attacker, target, 10, () => 0.5);
      const stats = manager.getCombatStats(attacker);
      expect(stats!.cooldownTimer).toBeGreaterThan(0);
      manager.updateCooldowns(0.5);
      expect(manager.getCombatStats(attacker)!.cooldownTimer).toBeLessThanOrEqual(stats!.cooldownTimer!);
    });
  });

  describe('removeFromCombat', () => {
    it('removes entity and clears targeting', () => {
      manager.initiateCombat(attacker, target);
      manager.removeFromCombat(target);
      expect(manager.getCombatStats(target)).toBeUndefined();
      expect(manager.getCombatStats(attacker)?.target).toBeUndefined();
    });
  });

  describe('getEngagementRatio', () => {
    it('returns attack/defense ratio for valid pair', () => {
      expect(manager.getEngagementRatio(attacker, target)).toBe(4);
    });

    it('returns undefined for unknown entities', () => {
      expect(manager.getEngagementRatio('unknown', target)).toBeUndefined();
    });
  });
});
