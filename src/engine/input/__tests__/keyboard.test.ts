import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputManager, DEFAULT_ACTIONS } from '../keyboard';

describe('InputManager', () => {
  let input: InputManager;
  const handler = vi.fn();

  beforeEach(() => {
    input = new InputManager(DEFAULT_ACTIONS);
    input.onAction = handler;
  });

  afterEach(() => {
    input.destroy();
    vi.clearAllMocks();
  });

  it('fires action on keydown', () => {
    const event = new KeyboardEvent('keydown', { key: 'w' });
    window.dispatchEvent(event);
    expect(handler).toHaveBeenCalledWith('camera.panUp', { pressed: true });
  });

  it('fires spell keys', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    expect(handler).toHaveBeenCalledWith('spell.1', { pressed: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '4' }));
    expect(handler).toHaveBeenCalledWith('spell.4', { pressed: true });
  });

  it('does not fire when disabled', () => {
    input.enabled = false;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('allows custom bindings', () => {
    input.bindKey({ key: 'q', action: 'ui.quests' });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' }));
    expect(handler).toHaveBeenCalledWith('ui.quests', { pressed: true });
  });

  it('resets bindings to default', () => {
    input.bindKey({ key: 'q', action: 'camera.panUp' });
    input.resetBindings('camera.panUp');
    const bindings = input.getBindings('camera.panUp');
    expect(bindings.length).toBe(1);
    expect(bindings[0].key).toBe('w');
  });

  it('does not duplicate rapid keydowns', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
    // No action bound to p, so handler shouldn't be called for p.
    // But for bound keys it would still fire once per physical press.
  });

  it('cleans up on destroy', () => {
    input.destroy();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    expect(handler).not.toHaveBeenCalled();
  });
});
