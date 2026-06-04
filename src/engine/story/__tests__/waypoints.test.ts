import { describe, it, expect, beforeEach } from 'vitest';
import { WaypointManager } from '../waypoints';

describe('WaypointManager', () => {
  let manager: WaypointManager;

  beforeEach(() => {
    manager = new WaypointManager();
  });

  it('adds a waypoint', () => {
    const wp = manager.addWaypoint('Home', 10, 20, '#ff0000');
    expect(wp.x).toBe(10);
    expect(wp.y).toBe(20);
    expect(manager.getAllWaypoints().length).toBe(1);
  });

  it('assigns hotkey to waypoint', () => {
    const wp = manager.addWaypoint('Home', 10, 20);
    expect(manager.setHotkey(wp.id, 1)).toBe(true);
    expect(manager.getByHotkey(1)!.label).toBe('Home');
  });

  it('removes hotkey from previous waypoint when reassigning', () => {
    const wp1 = manager.addWaypoint('A', 0, 0);
    const wp2 = manager.addWaypoint('B', 1, 1);
    manager.setHotkey(wp1.id, 1);
    manager.setHotkey(wp2.id, 1);
    expect(manager.getByHotkey(1)!.label).toBe('B');
  });

  it('removes a waypoint', () => {
    const wp = manager.addWaypoint('Home', 10, 20);
    expect(manager.removeWaypoint(wp.id)).toBe(true);
    expect(manager.getAllWaypoints().length).toBe(0);
  });

  it('moves a waypoint', () => {
    const wp = manager.addWaypoint('Home', 10, 20);
    expect(manager.moveWaypoint(wp.id, 30, 40)).toBe(true);
    expect(manager.getWaypoint(wp.id)!.x).toBe(30);
  });

  it('renames a waypoint', () => {
    const wp = manager.addWaypoint('Home', 10, 20);
    expect(manager.renameWaypoint(wp.id, 'Base')).toBe(true);
    expect(manager.getWaypoint(wp.id)!.label).toBe('Base');
  });

  it('clears all waypoints', () => {
    manager.addWaypoint('A', 0, 0);
    manager.addWaypoint('B', 1, 1);
    manager.clearAll();
    expect(manager.getAllWaypoints().length).toBe(0);
  });
});
