import { describe, it, expect, beforeEach } from 'vitest';
import { StructureAnimator, DEFAULT_ANIMATION_CONFIGS } from '../animations';
import type { WorkAnimationConfig } from '../../../types';

describe('StructureAnimator', () => {
  let animator: StructureAnimator;

  beforeEach(() => {
    animator = new StructureAnimator();
  });

  describe('state transitions', () => {
    it('registers a structure in idle state', () => {
      animator.registerStructure('s1', 'ALTAR');
      const state = animator.getState('s1');
      expect(state).toBeDefined();
      expect(state!.state).toBe('idle');
      expect(state!.workProgress).toBe(0);
      expect(state!.animation.type).toBe('glow_pulse');
      expect(state!.isCollapsed).toBe(false);
      expect(state!.efficiencyModifier).toBe(1);
    });

    it('transitions idle -> working -> complete', () => {
      animator.registerStructure('s1', 'ALTAR');
      expect(animator.getState('s1')!.state).toBe('idle');

      animator.setWorking('s1');
      expect(animator.getState('s1')!.state).toBe('working');
      expect(animator.getState('s1')!.animation.type).toBe('glow_pulse');

      animator.setComplete('s1');
      expect(animator.getState('s1')!.state).toBe('complete');
      expect(animator.getState('s1')!.workProgress).toBe(1);
    });

    it('can set working state with explicit progress', () => {
      animator.registerStructure('s1', 'REACTOR');
      animator.setWorking('s1', 0.4);
      expect(animator.getState('s1')!.workProgress).toBe(0.4);
    });
  });

  describe('working animation progress', () => {
    it('increments work progress during update when working', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setWorking('s1', 0);
      const before = animator.getState('s1')!.workProgress;
      animator.update(1);
      const after = animator.getState('s1')!.workProgress;
      expect(after).toBeGreaterThan(before);
    });

    it('caps work progress at 1', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setWorking('s1', 0.95);
      animator.update(10);
      expect(animator.getState('s1')!.workProgress).toBe(1);
    });

    it('does not increment progress when idle', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setIdle('s1');
      const before = animator.getState('s1')!.workProgress;
      animator.update(1);
      expect(animator.getState('s1')!.workProgress).toBe(before);
    });
  });

  describe('glow intensity', () => {
    it('is higher when working than when idle', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setIdle('s1');
      const idleGlow = animator.getState('s1')!.glowIntensity;

      animator.setWorking('s1');
      const workingGlow = animator.getState('s1')!.glowIntensity;

      expect(workingGlow).toBeGreaterThan(idleGlow);
    });

    it('increases as work progress advances', () => {
      animator.registerStructure('s1', 'REACTOR');
      animator.setWorking('s1', 0);
      const glowLow = animator.getState('s1')!.glowIntensity;

      animator.setWorkProgress('s1', 0.5);
      const glowMid = animator.getState('s1')!.glowIntensity;

      animator.setWorkProgress('s1', 1);
      const glowHigh = animator.getState('s1')!.glowIntensity;

      expect(glowMid).toBeGreaterThan(glowLow);
      expect(glowHigh).toBeGreaterThan(glowMid);
    });
  });

  describe('night glow calculation', () => {
    it('is higher when active (working) than idle', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setIdle('s1');
      const idleNight = animator.getState('s1')!.nightGlowIntensity;

      animator.setWorking('s1', 0.5);
      const workingNight = animator.getState('s1')!.nightGlowIntensity;

      expect(workingNight).toBeGreaterThan(idleNight);
    });

    it('reflects activity factor in complete state', () => {
      animator.registerStructure('s1', 'REACTOR');
      animator.setComplete('s1');
      const completeNight = animator.getState('s1')!.nightGlowIntensity;

      animator.setIdle('s1');
      const idleNight = animator.getState('s1')!.nightGlowIntensity;

      // Complete should have higher night glow than idle (0.8 vs 0.5 factor)
      expect(completeNight).toBeGreaterThan(idleNight);
    });

    it('drops to near zero for damaged state', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setDamaged('s1');
      expect(animator.getState('s1')!.nightGlowIntensity).toBeLessThan(
        DEFAULT_ANIMATION_CONFIGS.ALTAR.baseGlowIntensity * 0.5
      );
    });
  });

  describe('damaged state', () => {
    it('reduces efficiency modifier', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setDamaged('s1');
      expect(animator.getState('s1')!.efficiencyModifier).toBe(0.5);
      expect(animator.getEfficiencyModifier('s1')).toBe(0.5);
    });

    it('flickers glow over time', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setDamaged('s1');
      const glow1 = animator.getState('s1')!.glowIntensity;
      animator.update(0.1);
      const glow2 = animator.getState('s1')!.glowIntensity;
      // After enough time the sine wave should have changed the glow
      expect(glow2).not.toBe(glow1);
    });

    it('can recover from damaged to idle', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setDamaged('s1');
      animator.setIdle('s1');
      expect(animator.getState('s1')!.state).toBe('idle');
      expect(animator.getState('s1')!.efficiencyModifier).toBe(1);
    });
  });

  describe('destroyed state', () => {
    it('disables all effects', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setDestroyed('s1');
      const state = animator.getState('s1')!;

      expect(state.state).toBe('destroyed');
      expect(state.glowIntensity).toBe(0);
      expect(state.nightGlowIntensity).toBe(0);
      expect(state.animation.type).toBe('none');
      expect(state.animation.intensity).toBe(0);
      expect(state.isCollapsed).toBe(true);
    });

    it('reduces efficiency to zero', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setDestroyed('s1');
      expect(animator.getState('s1')!.efficiencyModifier).toBe(0);
      expect(animator.getEfficiencyModifier('s1')).toBe(0);
    });

    it('stays at zero glow even after updates', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.setDestroyed('s1');
      animator.update(1);
      animator.update(1);
      expect(animator.getState('s1')!.glowIntensity).toBe(0);
      expect(animator.getState('s1')!.nightGlowIntensity).toBe(0);
    });
  });

  describe('lifecycle', () => {
    it('removes an entity', () => {
      animator.registerStructure('s1', 'ALTAR');
      expect(animator.count).toBe(1);
      animator.removeEntity('s1');
      expect(animator.count).toBe(0);
      expect(animator.getState('s1')).toBeUndefined();
    });

    it('clears all tracked structures', () => {
      animator.registerStructure('s1', 'ALTAR');
      animator.registerStructure('s2', 'REACTOR');
      expect(animator.count).toBe(2);
      animator.clear();
      expect(animator.count).toBe(0);
    });

    it('returns default efficiency for unknown entity', () => {
      expect(animator.getEfficiencyModifier('ghost')).toBe(1);
    });
  });

  describe('custom configs', () => {
    it('accepts a custom work animation config', () => {
      const customConfig: WorkAnimationConfig = {
        category: 'CUSTOM',
        idle: { type: 'glow_pulse', intensity: 0.2, speed: 0.1 },
        working: { type: 'spin', intensity: 1.0, speed: 5 },
        complete: { type: 'none', intensity: 0, speed: 0 },
        baseGlowIntensity: 0.5,
        nightGlowMultiplier: 3.0,
      };
      animator.registerConfig(customConfig);
      animator.registerStructure('s1', 'CUSTOM');
      animator.setWorking('s1');
      expect(animator.getState('s1')!.animation.type).toBe('spin');
    });
  });
});
