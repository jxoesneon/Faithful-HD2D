import type { InputAction, KeyBinding } from '../../types';

export type InputActionHandler = (actionId: string, payload?: { value?: number; pressed?: boolean }) => void;

export const DEFAULT_ACTIONS: InputAction[] = [
  { id: 'camera.panLeft', label: 'Pan Left', defaultBinding: { key: 'a', action: 'camera.panLeft' }, category: 'Camera', repeatable: true },
  { id: 'camera.panRight', label: 'Pan Right', defaultBinding: { key: 'd', action: 'camera.panRight' }, category: 'Camera', repeatable: true },
  { id: 'camera.panUp', label: 'Pan Up', defaultBinding: { key: 'w', action: 'camera.panUp' }, category: 'Camera', repeatable: true },
  { id: 'camera.panDown', label: 'Pan Down', defaultBinding: { key: 's', action: 'camera.panDown' }, category: 'Camera', repeatable: true },
  { id: 'camera.zoomIn', label: 'Zoom In', defaultBinding: { key: '=', action: 'camera.zoomIn' }, category: 'Camera' },
  { id: 'camera.zoomOut', label: 'Zoom Out', defaultBinding: { key: '-', action: 'camera.zoomOut' }, category: 'Camera' },
  { id: 'gameplay.pause', label: 'Pause', defaultBinding: { key: ' ', action: 'gameplay.pause' }, category: 'Gameplay' },
  { id: 'spell.1', label: 'Spell 1', defaultBinding: { key: '1', action: 'spell.1' }, category: 'Spell' },
  { id: 'spell.2', label: 'Spell 2', defaultBinding: { key: '2', action: 'spell.2' }, category: 'Spell' },
  { id: 'spell.3', label: 'Spell 3', defaultBinding: { key: '3', action: 'spell.3' }, category: 'Spell' },
  { id: 'spell.4', label: 'Spell 4', defaultBinding: { key: '4', action: 'spell.4' }, category: 'Spell' },
  { id: 'ui.settings', label: 'Toggle Settings', defaultBinding: { key: 'Escape', action: 'ui.settings' }, category: 'UI' },
];

function bindingToKey(binding: KeyBinding): string {
  const mods: string[] = [];
  if (binding.modifiers?.ctrl) mods.push('ctrl');
  if (binding.modifiers?.shift) mods.push('shift');
  if (binding.modifiers?.alt) mods.push('alt');
  const key = binding.key.toLowerCase();
  return mods.length > 0 ? `${mods.join('+')}+${key}` : key;
}

function matchBinding(event: KeyboardEvent, binding: KeyBinding): boolean {
  if (event.key.toLowerCase() !== binding.key.toLowerCase()) return false;
  if (!!event.ctrlKey !== !!binding.modifiers?.ctrl) return false;
  if (!!event.shiftKey !== !!binding.modifiers?.shift) return false;
  if (!!event.altKey !== !!binding.modifiers?.alt) return false;
  return true;
}

/**
 * Unified input manager handling keyboard, gamepad, and hotkey remapping.
 *
 * @example
 * const input = new InputManager();
 * input.onAction = (id) => console.log(id);
 * input.bindKey({ key: 'q', action: 'ui.quests' });
 */
export class InputManager {
  private actions: Map<string, InputAction> = new Map();
  private bindings: Map<string, KeyBinding[]> = new Map(); // actionId -> bindings
  private pressedKeys = new Set<string>();
  private repeatTimers = new Map<string, ReturnType<typeof setInterval>>();
  private repeatDelay = 500;
  private repeatRate = 50;

  public onAction: InputActionHandler | null = null;
  public enabled = true;

  // Gamepad state
  private gamepadIndex: number | null = null;
  private gamepadThreshold = 0.15;
  private lastGamepadButtons: boolean[] = [];

  constructor(actions: InputAction[] = DEFAULT_ACTIONS) {
    for (const action of actions) {
      this.registerAction(action);
    }

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    window.addEventListener('gamepadconnected', (e: any) => {
      if (this.gamepadIndex === null) this.gamepadIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', (e: any) => {
      if (this.gamepadIndex === e.gamepad.index) this.gamepadIndex = null;
    });
  }

  private registerAction(action: InputAction): void {
    this.actions.set(action.id, action);
    const list = this.bindings.get(action.id) || [];
    list.push(action.defaultBinding);
    this.bindings.set(action.id, list);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;
    const key = event.key.toLowerCase();
    if (this.pressedKeys.has(key)) return;
    this.pressedKeys.add(key);

    for (const [actionId, bindings] of this.bindings) {
      for (const binding of bindings) {
        if (matchBinding(event, binding)) {
          event.preventDefault();
          this.fire(actionId, { pressed: true });
          this.startRepeat(actionId, event);
          return;
        }
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.pressedKeys.delete(key);
    for (const [actionId, bindings] of this.bindings) {
      for (const binding of bindings) {
        if (binding.key.toLowerCase() === key) {
          this.stopRepeat(actionId);
        }
      }
    }
  }

  private startRepeat(actionId: string, event: KeyboardEvent): void {
    const action = this.actions.get(actionId);
    if (!action?.repeatable) return;
    this.stopRepeat(actionId);
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (!this.pressedKeys.has(event.key.toLowerCase())) {
          clearInterval(interval);
          return;
        }
        this.fire(actionId, { pressed: true });
      }, this.repeatRate);
      this.repeatTimers.set(actionId, interval);
    }, this.repeatDelay);
    this.repeatTimers.set(actionId, timer);
  }

  private stopRepeat(actionId: string): void {
    const existing = this.repeatTimers.get(actionId);
    if (existing) {
      clearTimeout(existing);
      clearInterval(existing);
      this.repeatTimers.delete(actionId);
    }
  }

  private fire(actionId: string, payload?: { value?: number; pressed?: boolean }): void {
    if (this.onAction) {
      this.onAction(actionId, payload);
    }
  }

  /**
   * Add an additional key binding for an existing action.
   */
  bindKey(binding: KeyBinding): void {
    const list = this.bindings.get(binding.action) || [];
    list.push(binding);
    this.bindings.set(binding.action, list);
  }

  /**
   * Remove all custom bindings for an action (resets to defaults).
   */
  resetBindings(actionId: string): void {
    const action = this.actions.get(actionId);
    if (!action) return;
    this.bindings.set(actionId, [action.defaultBinding]);
  }

  /**
   * Get all current bindings for an action.
   */
  getBindings(actionId: string): KeyBinding[] {
    return [...(this.bindings.get(actionId) || [])];
  }

  /**
   * Poll gamepad state. Call this inside your game loop.
   * @param dt Delta time in ms (unused but reserved)
   */
  pollGamepad(_dt?: number): void {
    if (this.gamepadIndex === null) return;
    const gamepad = navigator.getGamepads()[this.gamepadIndex];
    if (!gamepad) return;

    // Left stick panning
    const lx = gamepad.axes[0];
    const ly = gamepad.axes[1];
    if (Math.abs(lx) > this.gamepadThreshold) {
      this.fire('camera.panRight', { value: lx });
    }
    if (Math.abs(ly) > this.gamepadThreshold) {
      this.fire('camera.panDown', { value: ly });
    }

    // Buttons
    for (let i = 0; i < gamepad.buttons.length; i++) {
      const pressed = gamepad.buttons[i].pressed;
      const wasPressed = this.lastGamepadButtons[i] || false;
      if (pressed && !wasPressed) {
        if (i === 0) this.fire('gameplay.pause'); // A
        if (i === 1) this.fire('camera.zoomIn'); // B
        if (i === 2) this.fire('camera.zoomOut'); // X
        if (i === 3) this.fire('ui.settings'); // Y
      }
    }
    this.lastGamepadButtons = gamepad.buttons.map((b) => b.pressed);
  }

  /**
   * Release all listeners and timers.
   */
  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    for (const timer of this.repeatTimers.values()) {
      clearTimeout(timer);
      clearInterval(timer);
    }
    this.repeatTimers.clear();
    this.pressedKeys.clear();
  }
}
