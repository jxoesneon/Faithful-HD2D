import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { FaithFogManager, FAITH_COLORS } from '../fog';
import { Faith, Position } from '../../../types';

describe('FaithFogManager', () => {
  let mgr: FaithFogManager;
  let ecs: ECS;

  beforeEach(() => {
    mgr = new FaithFogManager(16, 16, 4);
    ecs = new ECS();
  });

  it('constructs with correct dimensions', () => {
    expect(mgr.width).toBe(16);
    expect(mgr.height).toBe(16);
    expect(mgr.chunkSize).toBe(4);
    expect(mgr.chunkCountX).toBe(4);
    expect(mgr.chunkCountY).toBe(4);
    expect(mgr.overlays.ANIMISM.length).toBe(256);
    expect(mgr.tensionMap.length).toBe(256);
  });

  it('sets and retrieves dominant faith at a tile', () => {
    mgr.setFaithSource(5, 5, 'ANIMISM', 10);
    expect(mgr.getDominantFaithAt(5, 5)).toBe('ANIMISM');
    mgr.setFaithSource(5, 5, 'NIHILISM', 20);
    expect(mgr.getDominantFaithAt(5, 5)).toBe('NIHILISM');
  });

  it('returns SECULAR for empty tiles', () => {
    expect(mgr.getDominantFaithAt(0, 0)).toBe('SECULAR');
  });

  it('clamps setFaithSource to grid bounds', () => {
    mgr.setFaithSource(-5, -5, 'ELEMENTALISM', 5);
    expect(mgr.getDominantFaithAt(0, 0)).toBe('ELEMENTALISM');
    mgr.setFaithSource(100, 100, 'INTERVENTIONIST', 7);
    expect(mgr.getDominantFaithAt(15, 15)).toBe('INTERVENTIONIST');
  });

  it('computes chunk dominant faith and intensity', () => {
    mgr.setFaithSource(2, 2, 'ANIMISM', 8);
    const chunk = mgr.getChunkDominantFaith(0, 0);
    expect(chunk.dominantSystem).toBe('ANIMISM');
    expect(chunk.intensity).toBeGreaterThan(0);
    expect(chunk.chunkX).toBe(0);
    expect(chunk.chunkY).toBe(0);
  });

  it('returns all chunk data', () => {
    mgr.setFaithSource(0, 0, 'ANIMISM', 5);
    const all = mgr.getAllChunkData();
    expect(all.length).toBe(16); // 4x4 chunks
    expect(all[0].dominantSystem).toBe('ANIMISM');
  });

  it('diffuses faith on tick', () => {
    mgr.setFaithSource(8, 8, 'ELEMENTALISM', 20);
    const before = mgr.overlays.ELEMENTALISM[8 * 16 + 8];
    mgr.tick(1.0, ecs);
    const after = mgr.overlays.ELEMENTALISM[8 * 16 + 8];
    // Centre should decrease due to spread+decay
    expect(after).toBeLessThan(before);
    // Neighbours should have gained some value
    expect(mgr.overlays.ELEMENTALISM[8 * 16 + 9]).toBeGreaterThan(0);
  });

  it('injects ECS faith sources during tick', () => {
    const ent = ecs.createEntity();
    ecs.addComponent(ent, { type: 'position', x: 4, y: 4, z: 0 } as Position);
    ecs.addComponent(ent, { type: 'faith', devotion: 50, dominantSystem: 'INTERVENTIONIST', beliefMatrix: { ANIMISM: 0, ELEMENTALISM: 0, INTERVENTIONIST: 50, SECULAR: 0, NIHILISM: 0 } } as Faith);
    mgr.tick(1.0, ecs);
    expect(mgr.getDominantFaithAt(4, 4)).toBe('INTERVENTIONIST');
    expect(mgr.getTotalIntensity('INTERVENTIONIST')).toBeGreaterThan(0);
  });

  it('accumulates tension on borders', () => {
    mgr.setFaithSource(2, 2, 'ANIMISM', 20);
    mgr.setFaithSource(3, 2, 'NIHILISM', 20);
    mgr.tick(1.0, ecs);
    const tension = mgr.tensionMap[2 * 16 + 2];
    expect(tension).toBeGreaterThan(0);
  });

  it('returns border conflicts when tension is high', () => {
    mgr.setFaithSource(2, 2, 'ANIMISM', 50);
    mgr.setFaithSource(3, 2, 'NIHILISM', 50);
    mgr.tick(1.0, ecs);
    const conflicts = mgr.getBorderConflicts();
    expect(conflicts.length).toBeGreaterThan(0);
    const c = conflicts[0];
    expect(c.faithA).not.toBe(c.faithB);
    expect(c.tension).toBeGreaterThan(0);
  });

  it('produces a visual overlay buffer', () => {
    mgr.setFaithSource(0, 0, 'ANIMISM', 10);
    const visual = mgr.getVisualOverlay();
    expect(visual).toBeInstanceOf(Uint8Array);
    expect(visual.length).toBe(16 * 16 * 4);
    // The first pixel should have some green (ANIMISM colour)
    expect(visual[1]).toBeGreaterThan(0);
  });

  it('clears all data', () => {
    mgr.setFaithSource(5, 5, 'ELEMENTALISM', 10);
    mgr.tensionMap[5] = 3;
    mgr.clear();
    expect(mgr.getTotalIntensity('ELEMENTALISM')).toBe(0);
    expect(mgr.tensionMap[5]).toBe(0);
  });

  it('getTotalIntensity sums correctly', () => {
    mgr.setFaithSource(1, 1, 'SECULAR', 5);
    mgr.setFaithSource(2, 2, 'SECULAR', 3);
    expect(mgr.getTotalIntensity('SECULAR')).toBe(8);
  });

  it('tension decays over time without borders', () => {
    mgr.tensionMap[10] = 5;
    mgr.tick(1.0, ecs);
    expect(mgr.tensionMap[10]).toBeLessThan(5);
  });
});

describe('FAITH_COLORS', () => {
  it('maps every FaithSystemType to an RGBA tuple', () => {
    const keys = Object.keys(FAITH_COLORS) as Array<keyof typeof FAITH_COLORS>;
    expect(keys).toContain('ANIMISM');
    expect(keys).toContain('ELEMENTALISM');
    expect(keys).toContain('INTERVENTIONIST');
    expect(keys).toContain('SECULAR');
    expect(keys).toContain('NIHILISM');
    for (const k of keys) {
      expect(FAITH_COLORS[k].length).toBe(4);
    }
  });
});
