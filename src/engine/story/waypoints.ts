import type { ECS } from '../ecs';
import type { Entity, Position, Waypoint } from '../../types';

export class WaypointManager {
  private waypoints: Waypoint[] = [];
  private hotkeySlots = new Map<number, string>(); // hotkey number -> waypoint id

  /** Create a new waypoint at a position */
  addWaypoint(label: string, x: number, y: number, color: string = '#ffffff', hotkey?: number): Waypoint {
    const waypoint: Waypoint = {
      id: `wp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label,
      x,
      y,
      color,
      hotkey,
    };
    this.waypoints.push(waypoint);
    if (hotkey !== undefined) {
      this.hotkeySlots.set(hotkey, waypoint.id);
    }
    return waypoint;
  }

  /** Remove a waypoint by ID */
  removeWaypoint(id: string): boolean {
    const index = this.waypoints.findIndex((w) => w.id === id);
    if (index === -1) return false;
    const wp = this.waypoints[index];
    if (wp.hotkey !== undefined) {
      this.hotkeySlots.delete(wp.hotkey);
    }
    this.waypoints.splice(index, 1);
    return true;
  }

  /** Get waypoint by ID */
  getWaypoint(id: string): Waypoint | undefined {
    return this.waypoints.find((w) => w.id === id);
  }

  /** Get all waypoints */
  getAllWaypoints(): Waypoint[] {
    return [...this.waypoints];
  }

  /** Get waypoint assigned to a hotkey */
  getByHotkey(hotkey: number): Waypoint | undefined {
    const id = this.hotkeySlots.get(hotkey);
    if (!id) return undefined;
    return this.getWaypoint(id);
  }

  /** Update hotkey assignment */
  setHotkey(waypointId: string, hotkey: number): boolean {
    const wp = this.getWaypoint(waypointId);
    if (!wp) return false;

    // Remove old hotkey from this waypoint
    if (wp.hotkey !== undefined) {
      this.hotkeySlots.delete(wp.hotkey);
    }

    // Remove this hotkey from any other waypoint
    const existingId = this.hotkeySlots.get(hotkey);
    if (existingId) {
      const existing = this.getWaypoint(existingId);
      if (existing) existing.hotkey = undefined;
    }

    wp.hotkey = hotkey;
    this.hotkeySlots.set(hotkey, waypointId);
    return true;
  }

  /** Clear all waypoints */
  clearAll(): void {
    this.waypoints = [];
    this.hotkeySlots.clear();
  }

  /** Update waypoint position */
  moveWaypoint(id: string, x: number, y: number): boolean {
    const wp = this.getWaypoint(id);
    if (!wp) return false;
    wp.x = x;
    wp.y = y;
    return true;
  }

  /** Rename waypoint */
  renameWaypoint(id: string, label: string): boolean {
    const wp = this.getWaypoint(id);
    if (!wp) return false;
    wp.label = label;
    return true;
  }
}
