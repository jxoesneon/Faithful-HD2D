import { describe, it, expect, vi } from 'vitest';
import { EntityAnimationController, STATE_FRAME_DURATION } from '../entityAnim';

describe('EntityAnimationController', () => {
  it('registers an entity state', () => {
    const ctrl = new EntityAnimationController();
    ctrl.setState('e1', 'walk', 'e');
    const s = ctrl.getState('e1');
    expect(s).toBeDefined();
    expect(s!.state).toBe('walk');
    expect(s!.direction).toBe('e');
    expect(ctrl.count).toBe(1);
  });

  it('updates frame index over time', () => {
    const ctrl = new EntityAnimationController();
    ctrl.setState('e1', 'walk');
    ctrl.update(0); // init
    expect(ctrl.getState('e1')!.frameIndex).toBe(0);
    // advance past frame duration
    ctrl.update(STATE_FRAME_DURATION.walk * 1000 + 10);
    expect(ctrl.getState('e1')!.frameIndex).toBe(1);
  });

  it('transitions state and resets frame', () => {
    const ctrl = new EntityAnimationController();
    ctrl.setState('e1', 'walk');
    ctrl.update(STATE_FRAME_DURATION.walk * 1000 + 10);
    ctrl.setState('e1', 'idle');
    expect(ctrl.getState('e1')!.frameIndex).toBe(0);
    expect(ctrl.getState('e1')!.state).toBe('idle');
  });

  it('smoothly moves entities', () => {
    const ctrl = new EntityAnimationController();
    ctrl.moveEntity('e1', 0, 0);
    ctrl.moveEntity('e1', 10, 20, 200);
    ctrl.update(100);
    const pos = ctrl.getVisualPosition('e1');
    expect(pos!.x).toBeGreaterThan(0);
    expect(pos!.x).toBeLessThan(10);
    expect(pos!.y).toBeGreaterThan(0);
    expect(pos!.y).toBeLessThan(20);
  });

  it('finishes previous tween when moving again', () => {
    const ctrl = new EntityAnimationController();
    ctrl.moveEntity('e1', 0, 0);
    ctrl.moveEntity('e1', 10, 0, 200);
    const spy = vi.spyOn(ctrl as any, 'moveEntity');
    ctrl.moveEntity('e1', 20, 0, 200);
    const pos = ctrl.getVisualPosition('e1');
    // previous tween should have been finished, position snapped
    expect(pos!.x).toBe(10);
  });

  it('removes entity and its data', () => {
    const ctrl = new EntityAnimationController();
    ctrl.setState('e1', 'idle');
    ctrl.moveEntity('e1', 5, 5);
    ctrl.removeEntity('e1');
    expect(ctrl.count).toBe(0);
    expect(ctrl.getVisualPosition('e1')).toBeUndefined();
  });

  it('clears all data', () => {
    const ctrl = new EntityAnimationController();
    ctrl.setState('e1', 'idle');
    ctrl.setState('e2', 'walk');
    ctrl.clear();
    expect(ctrl.count).toBe(0);
  });

  it('returns undefined for unknown entity', () => {
    const ctrl = new EntityAnimationController();
    expect(ctrl.getState('ghost')).toBeUndefined();
    expect(ctrl.getVisualPosition('ghost')).toBeUndefined();
  });
});
