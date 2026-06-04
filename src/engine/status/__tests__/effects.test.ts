import { describe, it, expect, beforeEach } from 'vitest';
import { StatusEffectManager, STATUS_EFFECT_DEFS } from '../effects';
import { ECS } from '../../ecs';
import type { Biology, Fauna } from '../../../types';

describe('StatusEffectManager', () => {
  let ecs: ECS;
  let manager: StatusEffectManager;
  let entity: string;
  let source: string;

  beforeEach(() => {
    ecs = new ECS();
    manager = new StatusEffectManager(ecs);
    entity = ecs.createEntity();
    source = ecs.createEntity();
    ecs.addComponent(entity, { type: 'biology', biomass: 1, health: 100, dna: '' } as Biology);
  });

  describe('applyEffect', () => {
    it('applies a new buff effect', () => {
      const effect = manager.applyEffect(entity, 'Blessed', source);
      expect(effect.effectType).toBe('Blessed');
      expect(effect.category).toBe('buff');
      expect(effect.source).toBe(source);
    });

    it('applies a debuff with default intensity', () => {
      const effect = manager.applyEffectDefault(entity, 'Poisoned', source);
      expect(effect.intensity).toBe(STATUS_EFFECT_DEFS.Poisoned.defaultIntensity);
    });

    it('allows intensity override', () => {
      const effect = manager.applyEffect(entity, 'Hasted', source, { intensity: 7 });
      expect(effect.intensity).toBe(7);
    });

    it('allows duration override', () => {
      const effect = manager.applyEffect(entity, 'Hasted', source, { duration: 5 });
      expect(effect.duration).toBe(5);
    });

    it('stacks intensity when stackMode is stackIntensity', () => {
      manager.applyEffect(entity, 'Hasted', source, { intensity: 3 });
      manager.applyEffect(entity, 'Hasted', source, { intensity: 4 });
      const effect = manager.getEffect(entity, 'Hasted');
      expect(effect!.intensity).toBe(7);
    });

    it('clamps intensity stacking to maxIntensity', () => {
      manager.applyEffect(entity, 'Blessed', source, { intensity: 15 });
      manager.applyEffect(entity, 'Blessed', source, { intensity: 15 });
      const effect = manager.getEffect(entity, 'Blessed');
      expect(effect!.intensity).toBe(STATUS_EFFECT_DEFS.Blessed.maxIntensity);
    });

    it('refreshes duration when stackMode is refresh', () => {
      manager.applyEffect(entity, 'Inspired', source, { duration: 10 });
      manager.applyEffect(entity, 'Inspired', source, { duration: 20 });
      const effect = manager.getEffect(entity, 'Inspired');
      expect(effect!.duration).toBe(20);
    });

    it('stacks duration when stackMode is stackDuration', () => {
      manager.applyEffect(entity, 'Stunned', source, { duration: 2 });
      manager.applyEffect(entity, 'Stunned', source, { duration: 2 });
      const effect = manager.getEffect(entity, 'Stunned');
      expect(effect!.duration).toBe(4);
    });

    it('caps stacked duration to maxDuration', () => {
      manager.applyEffect(entity, 'Stunned', source, { duration: 5 });
      manager.applyEffect(entity, 'Stunned', source, { duration: 5 });
      const effect = manager.getEffect(entity, 'Stunned');
      expect(effect!.duration).toBe(STATUS_EFFECT_DEFS.Stunned.maxDuration);
    });
  });

  describe('removeEffect', () => {
    it('removes an effect by type', () => {
      manager.applyEffect(entity, 'Blessed', source);
      manager.removeEffect(entity, 'Blessed');
      expect(manager.hasEffect(entity, 'Blessed')).toBe(false);
    });

    it('does nothing if effect not present', () => {
      manager.removeEffect(entity, 'Blessed');
      expect(manager.getEffects(entity)).toHaveLength(0);
    });
  });

  describe('clearEffects', () => {
    it('removes all effects from entity', () => {
      manager.applyEffect(entity, 'Blessed', source);
      manager.applyEffect(entity, 'Poisoned', source);
      manager.clearEffects(entity);
      expect(manager.getEffects(entity)).toHaveLength(0);
    });
  });

  describe('getEffects', () => {
    it('returns copies so mutations do not leak', () => {
      manager.applyEffect(entity, 'Blessed', source, { intensity: 5 });
      const effects = manager.getEffects(entity);
      effects[0].intensity = 999;
      expect(manager.getEffect(entity, 'Blessed')!.intensity).toBe(5);
    });
  });

  describe('tick', () => {
    it('decreases duration', () => {
      manager.applyEffect(entity, 'Blessed', source, { duration: 5 });
      manager.tick(2);
      const effect = manager.getEffect(entity, 'Blessed');
      expect(effect!.duration).toBe(3);
    });

    it('expires effects when duration reaches 0', () => {
      manager.applyEffect(entity, 'Blessed', source, { duration: 2 });
      const results = manager.tick(3);
      expect(manager.hasEffect(entity, 'Blessed')).toBe(false);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].expired).toBe(true);
    });

    it('processes DOT ticks (Poisoned)', () => {
      manager.applyEffect(entity, 'Poisoned', source, { intensity: 5, duration: 10 });
      const results = manager.tick(2);
      expect(results.some((r) => r.healthDelta === -5)).toBe(true);
    });

    it('processes multiple DOT ticks when delta exceeds interval', () => {
      manager.applyEffect(entity, 'Poisoned', source, { intensity: 5, duration: 20 });
      const results = manager.tick(5);
      // 2 ticks at interval 2: 5s delta -> 2 ticks aggregated into one result
      const poisonResults = results.filter((r) => r.effectType === 'Poisoned');
      expect(poisonResults.length).toBe(1);
      expect(poisonResults[0].healthDelta).toBe(-10);
    });

    it('stops ticking once expired', () => {
      manager.applyEffect(entity, 'Poisoned', source, { intensity: 5, duration: 3 });
      const results = manager.tick(5);
      // Should tick once then expire
      const poisonResults = results.filter((r) => r.effectType === 'Poisoned');
      expect(poisonResults.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('applyHealthDeltas', () => {
    it('applies damage from tick results to biology health', () => {
      manager.applyEffect(entity, 'Poisoned', source, { intensity: 10, duration: 10 });
      const results = manager.tick(2);
      manager.applyHealthDeltas(results);
      const biology = ecs.getComponent<Biology>(entity, 'biology');
      expect(biology!.health).toBe(90);
    });

    it('applies damage to fauna health when biology absent', () => {
      const faunaEntity = ecs.createEntity();
      ecs.addComponent(faunaEntity, {
        type: 'fauna',
        category: 'WOLF',
        subType: 'test',
        health: 50,
        hunger: 0,
        aggressiveness: 0,
        actionState: 'WANDERING',
      } as Fauna);
      manager.applyEffect(faunaEntity, 'Diseased', source, { intensity: 2, duration: 10 });
      const results = manager.tick(5);
      manager.applyHealthDeltas(results);
      const fauna = ecs.getComponent<Fauna>(faunaEntity, 'fauna');
      expect(fauna!.health).toBe(48);
    });

    it('does not reduce health below 0', () => {
      manager.applyEffect(entity, 'Poisoned', source, { intensity: 999, duration: 10 });
      const results = manager.tick(2);
      manager.applyHealthDeltas(results);
      const biology = ecs.getComponent<Biology>(entity, 'biology');
      expect(biology!.health).toBe(0);
    });
  });

  describe('queries', () => {
    it('returns all affected entities', () => {
      const e2 = ecs.createEntity();
      manager.applyEffect(entity, 'Blessed', source);
      manager.applyEffect(e2, 'Poisoned', source);
      expect(manager.getAffectedEntities()).toHaveLength(2);
    });

    it('returns entities with specific effect', () => {
      const e2 = ecs.createEntity();
      manager.applyEffect(entity, 'Blessed', source);
      manager.applyEffect(e2, 'Poisoned', source);
      expect(manager.getEntitiesWithEffect('Blessed')).toEqual([entity]);
    });

    it('returns CCd entities', () => {
      const e2 = ecs.createEntity();
      manager.applyEffect(entity, 'Stunned', source);
      manager.applyEffect(e2, 'Blessed', source);
      expect(manager.getCCdEntities()).toEqual([entity]);
    });

    it('counts total active effects', () => {
      manager.applyEffect(entity, 'Blessed', source);
      manager.applyEffect(entity, 'Poisoned', source);
      expect(manager.getTotalActiveEffectCount()).toBe(2);
    });
  });

  describe('modifier helpers', () => {
    it('calculates net speed modifier', () => {
      manager.applyEffect(entity, 'Hasted', source, { intensity: 5 });
      manager.applyEffect(entity, 'Slowed', source, { intensity: -2 });
      expect(manager.getNetSpeedModifier(entity)).toBe(3);
    });

    it('calculates net attack modifier', () => {
      manager.applyEffect(entity, 'Inspired', source, { intensity: 8 });
      manager.applyEffect(entity, 'Starving', source, { intensity: -4 });
      expect(manager.getNetAttackModifier(entity)).toBe(4);
    });

    it('detects stunned', () => {
      expect(manager.isStunned(entity)).toBe(false);
      manager.applyEffect(entity, 'Stunned', source);
      expect(manager.isStunned(entity)).toBe(true);
    });

    it('detects rooted', () => {
      expect(manager.isRooted(entity)).toBe(false);
      manager.applyEffect(entity, 'Rooted', source);
      expect(manager.isRooted(entity)).toBe(true);
    });
  });
});
