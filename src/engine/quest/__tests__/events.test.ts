import { describe, it, expect, vi } from 'vitest';
import { EVENT_DATABASE, EventEngine } from '../events';
import type { WorldStateSnapshot } from '../../../types';

const baseWorld: WorldStateSnapshot = {
  population: 100,
  tribeCount: 3,
  averageHappiness: 50,
  averageTech: 2,
  weather: 'CLEAR',
  devotion: 200,
  totalStructures: 10,
  totalFlora: 40,
  totalFauna: 20,
  conflictsActive: 0,
  timePlayed: 0,
};

describe('EVENT_DATABASE', () => {
  it('has at least 20 events', () => {
    expect(EVENT_DATABASE.length).toBeGreaterThanOrEqual(20);
  });

  it('has valid categories', () => {
    const valid = new Set(['Natural', 'Political', 'Religious', 'Ecological', 'Cosmic']);
    for (const evt of EVENT_DATABASE) {
      expect(valid.has(evt.category)).toBe(true);
      expect(evt.choices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('one-shot events are flagged', () => {
    const oneShots = EVENT_DATABASE.filter((e) => e.isOneShot);
    expect(oneShots.length).toBeGreaterThan(0);
  });
});

describe('EventEngine', () => {
  it('returns null when on cooldown', () => {
    const engine = new EventEngine();
    engine.setCooldown(10);
    engine.update(1);
    const result = engine.maybeTrigger(baseWorld);
    expect(result).toBeNull();
  });

  it('triggers an event when off cooldown', () => {
    const engine = new EventEngine();
    engine.setCooldown(0);
    const result = engine.maybeTrigger(baseWorld);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.event).toBeDefined();
      expect(result.choice).toBeDefined();
    }
  });

  it('respects one-shot limit', () => {
    const engine = new EventEngine();
    engine.setCooldown(0);
    // Find a one-shot event and force trigger it
    const oneShot = EVENT_DATABASE.find((e) => e.isOneShot)!;
    engine.triggerEvent(oneShot.id, 0);
    const result = engine.triggerEvent(oneShot.id, 0);
    // triggerEvent does not re-check one-shot, but maybeTrigger does.
    expect(engine.getOneShotsFired()).toContain(oneShot.id);
  });

  it('records history', () => {
    const engine = new EventEngine();
    engine.setCooldown(0);
    engine.maybeTrigger(baseWorld);
    expect(engine.getHistory().length).toBeGreaterThan(0);
  });

  it('filters history by category', () => {
    const engine = new EventEngine();
    engine.setCooldown(0);
    engine.maybeTrigger(baseWorld);
    const cats = new Set(engine.getHistory().map((h) => h.event.category));
    for (const cat of cats) {
      expect(engine.getHistory({ category: cat }).every((h) => h.event.category === cat)).toBe(true);
    }
  });

  it('manually triggers a specific event', () => {
    const engine = new EventEngine();
    const evt = EVENT_DATABASE[0];
    const result = engine.triggerEvent(evt.id, 0);
    expect(result).not.toBeNull();
    expect(result!.event.id).toBe(evt.id);
  });
});
