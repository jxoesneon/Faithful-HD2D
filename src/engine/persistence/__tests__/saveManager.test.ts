import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SaveManager,
  CURRENT_SCHEMA_VERSION,
  validateSaveData,
  compressSave,
  decompressSave,
  AUTOSAVE_INTERVAL_MS,
  MAX_SLOTS,
  type RawSaveData,
  type GameStateProvider,
} from '../saveManager';
import type { SaveSlot } from '../../../types';

class FakeStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

function makeProvider(stateOverride?: any): GameStateProvider {
  const base = {
    ecsState: { entities: ['e1'], components: [{ type: 'A', entity: 'e1', data: { val: 1 } }] },
    simulationState: { devotion: 100, weather: 'CLEAR' },
  };
  let current = { ...base, ...stateOverride };
  return {
    getState: () => ({ ...current }),
    loadState: (s) => {
      current = { ecsState: s.ecsState, simulationState: s.simulationState };
    },
  };
}

describe('SaveManager', () => {
  let storage: FakeStorage;
  let provider: GameStateProvider;
  let manager: SaveManager;

  beforeEach(() => {
    storage = new FakeStorage();
    provider = makeProvider();
    manager = new SaveManager(provider, { storage, worldName: 'Test World' });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves and loads from a named slot', async () => {
    await manager.saveToSlot('1', 'Alpha');
    const slot = manager.getSlot('1');
    expect(slot).not.toBeNull();
    expect(slot!.name).toBe('Alpha');
    expect(slot!.metadata.worldName).toBe('Test World');

    // Mutate provider state
    provider = makeProvider({ simulationState: { devotion: 999 } });
    manager = new SaveManager(provider, { storage, worldName: 'Test World' });

    await manager.loadFromSlot('1');
    const loaded = provider.getState();
    expect(loaded.simulationState.devotion).toBe(100);
  });

  it('supports quicksave and quickload', async () => {
    await manager.quicksave();
    expect(manager.getQuicksave()).not.toBeNull();

    provider = makeProvider({ simulationState: { devotion: 999 } });
    manager = new SaveManager(provider, { storage, worldName: 'Test World' });

    await manager.quickload();
    expect(provider.getState().simulationState.devotion).toBe(100);
  });

  it('deletes slots and quicksaves', async () => {
    await manager.saveToSlot('2', 'Beta');
    await manager.quicksave();

    manager.deleteSlot('2');
    manager.deleteQuicksave();

    expect(manager.getSlot('2')).toBeNull();
    expect(manager.getQuicksave()).toBeNull();
  });

  it('lists all populated slots', async () => {
    await manager.saveToSlot('1', 'One');
    await manager.saveToSlot('3', 'Three');
    const slots = manager.listSlots();
    expect(slots).toHaveLength(2);
    expect(slots.map((s) => s.name)).toContain('One');
    expect(slots.map((s) => s.name)).toContain('Three');
  });

  it('throws when loading an empty slot', async () => {
    await expect(manager.loadFromSlot('99')).rejects.toThrow('empty');
  });

  it('throws when quickloading without a quicksave', async () => {
    await expect(manager.quickload()).rejects.toThrow('No quicksave');
  });

  it('auto-saves every 60 seconds', async () => {
    const spy = vi.spyOn(manager, 'autosave').mockResolvedValue(undefined);
    manager.startAutoSave();
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(AUTOSAVE_INTERVAL_MS);
    expect(spy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(AUTOSAVE_INTERVAL_MS);
    expect(spy).toHaveBeenCalledTimes(2);

    manager.stopAutoSave();
    spy.mockRestore();
  });

  it('stops auto-save and flushes playtime', async () => {
    manager.startAutoSave();
    vi.advanceTimersByTime(10_000);
    manager.stopAutoSave();
    expect(manager.getPlaytime()).toBeGreaterThanOrEqual(10);
  });

  it('resets playtime', async () => {
    manager.startAutoSave();
    vi.advanceTimersByTime(5000);
    manager.stopAutoSave();
    expect(manager.getPlaytime()).toBeGreaterThan(0);
    manager.resetPlaytime();
    expect(manager.getPlaytime()).toBe(0);
  });
});

describe('Validation', () => {
  it('accepts valid save data', () => {
    const data: RawSaveData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: { version: CURRENT_SCHEMA_VERSION, timestamp: 1, playtime: 0, worldName: 'W' },
      ecsState: { entities: [], components: [] },
      simulationState: {},
    };
    expect(validateSaveData(data).valid).toBe(true);
  });

  it('rejects non-object', () => {
    expect(validateSaveData(null).valid).toBe(false);
    expect(validateSaveData('string').valid).toBe(false);
  });

  it('rejects missing schemaVersion', () => {
    expect(validateSaveData({}).valid).toBe(false);
  });

  it('rejects missing metadata fields', () => {
    expect(validateSaveData({ schemaVersion: '1.0.0', metadata: {} }).valid).toBe(false);
  });

  it('rejects malformed ecsState', () => {
    expect(
      validateSaveData({
        schemaVersion: '1.0.0',
        metadata: { version: '1.0.0', timestamp: 1, playtime: 0, worldName: 'W' },
        ecsState: { entities: 'bad', components: [] },
        simulationState: {},
      }).valid
    ).toBe(false);
  });

  it('rejects missing simulationState', () => {
    expect(
      validateSaveData({
        schemaVersion: '1.0.0',
        metadata: { version: '1.0.0', timestamp: 1, playtime: 0, worldName: 'W' },
        ecsState: { entities: [], components: [] },
      }).valid
    ).toBe(false);
  });
});

describe('Compression', () => {
  it('round-trips a JSON payload with RLE fallback', async () => {
    const payload = JSON.stringify({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: { version: CURRENT_SCHEMA_VERSION, timestamp: 123, playtime: 0, worldName: 'Realm' },
      ecsState: { entities: ['a', 'b'], components: [{ type: 'pos', entity: 'a', data: { x: 1, y: 2 } }] },
      simulationState: {},
    });
    const compressed = await compressSave(payload);
    expect(compressed).toBeTruthy();
    const decompressed = await decompressSave(compressed);
    expect(decompressed).toBe(payload);
  });

  it('handles highly repetitive JSON via RLE', async () => {
    // lots of repeated chars to exercise RLE path
    const obj = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: { version: CURRENT_SCHEMA_VERSION, timestamp: 1, playtime: 0, worldName: 'W' },
      ecsState: {
        entities: Array.from({ length: 100 }, (_, i) => `entity_${i}`),
        components: Array.from({ length: 100 }, (_, i) => ({
          type: 'position',
          entity: `entity_${i}`,
          data: { x: 0, y: 0, z: 0 },
        })),
      },
      simulationState: {},
    };
    const payload = JSON.stringify(obj);
    const compressed = await compressSave(payload);
    const decompressed = await decompressSave(compressed);
    expect(JSON.parse(decompressed)).toEqual(obj);
  });
});

describe('Migration', () => {
  it('migrates 0.8.0 to 1.0.0', async () => {
    const oldSave = {
      schemaVersion: '0.8.0',
      saveName: 'Old World',
      ecsState: { entities: ['e1'], components: [] },
      simulationState: {},
    };
    const provider = makeProvider();
    const storage = new FakeStorage();
    const mgr = new SaveManager(provider, { storage });

    // Store old save manually
    const compressed = await compressSave(JSON.stringify(oldSave));
    const slot: SaveSlot = {
      id: '1',
      name: 'Old',
      metadata: { version: '0.8.0', timestamp: 1, playtime: 0, worldName: 'Old World' },
      data: compressed,
    };
    storage.setItem('faithful_save_slot_1', JSON.stringify(slot));

    await mgr.loadFromSlot('1');
    const loaded = provider.getState();
    expect(loaded.ecsState.entities).toContain('e1');
  });

  it('migrates 0.9.0 to 1.0.0', async () => {
    const oldSave = {
      schemaVersion: '0.9.0',
      metadata: { version: '0.9.0', timestamp: 1, playtime: 0, worldName: 'Mid World' },
      ecsState: { entities: ['e1'], components: [] },
      simulationState: {},
    };
    const provider = makeProvider();
    const storage = new FakeStorage();
    const mgr = new SaveManager(provider, { storage });

    const compressed = await compressSave(JSON.stringify(oldSave));
    const slot: SaveSlot = {
      id: '1',
      name: 'Mid',
      metadata: oldSave.metadata,
      data: compressed,
    };
    storage.setItem('faithful_save_slot_1', JSON.stringify(slot));

    await mgr.loadFromSlot('1');
    const loaded = provider.getState();
    expect(loaded.ecsState.entities).toContain('e1');
  });
});
