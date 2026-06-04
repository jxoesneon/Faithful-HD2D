import { describe, it, expect, vi } from 'vitest';
import { Tween, TweenManager, Easing, countTo, CameraShake, slideIn } from '../tween';

describe('Easing', () => {
  it('linear maps 0->0 and 1->1', () => {
    expect(Easing.linear(0)).toBe(0);
    expect(Easing.linear(1)).toBe(1);
    expect(Easing.linear(0.5)).toBe(0.5);
  });

  it('easeInQuad is quadratic', () => {
    expect(Easing.easeInQuad(0)).toBe(0);
    expect(Easing.easeInQuad(1)).toBe(1);
    expect(Easing.easeInQuad(0.5)).toBe(0.25);
  });

  it('easeOutQuad ends at 1', () => {
    expect(Easing.easeOutQuad(1)).toBe(1);
    expect(Easing.easeOutQuad(0)).toBe(0);
  });

  it('easeInOutCubic is symmetric-ish', () => {
    expect(Easing.easeInOutCubic(0)).toBe(0);
    expect(Easing.easeInOutCubic(1)).toBe(1);
  });

  it('bounce ends at 1', () => {
    expect(Easing.bounce(0)).toBe(0);
    expect(Easing.bounce(1)).toBe(1);
  });

  it('back overshoots', () => {
    expect(Easing.back(0)).toBe(0);
    expect(Easing.back(1)).toBe(1);
    expect(Easing.back(0.5)).toBeLessThan(0);
  });

  it('elastic overshoots', () => {
    expect(Easing.elastic(0)).toBe(0);
    expect(Easing.elastic(1)).toBe(1);
  });
});

describe('Tween', () => {
  it('interpolates value over time', () => {
    const obj = { x: 0 };
    const tween = new Tween({ target: obj, to: { x: 100 }, duration: 1000 });
    tween.update(500);
    expect(obj.x).toBe(50);
    expect(tween.isAlive).toBe(true);
  });

  it('completes when duration exceeded', () => {
    const obj = { x: 0 };
    const onComplete = vi.fn();
    const tween = new Tween({ target: obj, to: { x: 100 }, duration: 100, onComplete });
    tween.update(150);
    expect(obj.x).toBe(100);
    expect(tween.isAlive).toBe(false);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('honors delay', () => {
    const obj = { x: 0 };
    const tween = new Tween({ target: obj, to: { x: 100 }, duration: 100, delay: 50 });
    tween.update(30);
    expect(obj.x).toBe(0);
    tween.update(30);
    expect(obj.x).toBeGreaterThan(0);
  });

  it('calls onUpdate', () => {
    const obj = { x: 0 };
    const onUpdate = vi.fn();
    const tween = new Tween({ target: obj, to: { x: 100 }, duration: 100, onUpdate });
    tween.update(50);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('finish snaps to end', () => {
    const obj = { x: 0 };
    const tween = new Tween({ target: obj, to: { x: 100 }, duration: 1000 });
    tween.finish();
    expect(obj.x).toBe(100);
    expect(tween.isAlive).toBe(false);
  });
});

describe('TweenManager', () => {
  it('adds and removes tweens', () => {
    const mgr = new TweenManager();
    mgr.add({ target: { x: 0 }, to: { x: 10 }, duration: 100 });
    expect(mgr.count).toBe(1);
    mgr.update(200);
    expect(mgr.count).toBe(0);
  });

  it('clears all tweens', () => {
    const mgr = new TweenManager();
    mgr.add({ target: { x: 0 }, to: { x: 10 }, duration: 100 });
    mgr.clear();
    expect(mgr.count).toBe(0);
  });
});

describe('countTo', () => {
  it('counts a number from A to B', () => {
    const onUpdate = vi.fn();
    const tween = countTo(0, 100, 100, onUpdate);
    tween.update(50);
    expect(onUpdate).toHaveBeenCalledWith(50);
    tween.update(60);
    expect(tween.isAlive).toBe(false);
  });
});

describe('CameraShake', () => {
  it('produces non-zero offsets during shake', () => {
    const shake = new CameraShake(100, 10, 60);
    shake.update(16);
    expect(Math.abs(shake.offsetX) + Math.abs(shake.offsetY)).toBeGreaterThan(0);
  });

  it('returns false after duration', () => {
    const shake = new CameraShake(50, 10, 60);
    shake.update(60);
    const alive = shake.update(0);
    expect(alive).toBe(false);
    expect(shake.offsetX).toBe(0);
    expect(shake.offsetY).toBe(0);
  });
});

describe('slideIn', () => {
  it('slides target to zero', () => {
    const panel = { x: 200, y: 0 };
    const tween = slideIn(panel, 200, 0, 100);
    expect(panel.x).toBe(200);
    tween.update(100);
    expect(panel.x).toBe(0);
    expect(panel.y).toBe(0);
  });
});
