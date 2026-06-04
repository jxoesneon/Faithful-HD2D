import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ReplayManager,
  SNAPSHOT_INTERVAL_MS,
  MAX_SNAPSHOTS,
  type ReplayStateProvider,
} from '../replaySystem';

function makeProvider(initial?: any): ReplayStateProvider {
  let state = JSON.parse(JSON.stringify(initial ?? { entities: ['e1'], components: [{ type: 'A', entity: 'e1', data: { val: 1 } }] }));
  let seed = 42;
  return {
    getState: () => JSON.parse(JSON.stringify(state)),
    setState: (s) => { state = JSON.parse(JSON.stringify(s)); },
    getRngSeed: () => seed,
    setRngSeed: (s) => { seed = s; },
  };
}

describe('ReplayManager', () => {
  let provider: ReplayStateProvider;
  let manager: ReplayManager;

  beforeEach(() => {
    vi.useFakeTimers();
    provider = makeProvider();
    manager = new ReplayManager(provider, { snapshotIntervalMs: SNAPSHOT_INTERVAL_MS, worldName: 'Test Replay' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts and stops recording', () => {
    expect(manager.isRunning()).toBe(false);
    manager.start();
    expect(manager.isRunning()).toBe(true);
    expect(manager.getSnapshots()).toHaveLength(1);
    manager.stop();
    expect(manager.isRunning()).toBe(false);
  });

  it('takes periodic snapshots', () => {
    manager.start();
    vi.advanceTimersByTime(SNAPSHOT_INTERVAL_MS);
    expect(manager.getSnapshots().length).toBeGreaterThanOrEqual(2);
  });

  it('records player inputs', () => {
    manager.start();
    manager.recordInput('SPAWN_TRIBE', { x: 10, y: 20, faction: 'ANIMIST' });
    manager.recordInput('SET_WEATHER', { weather: 'RAINY' });
    const inputs = manager.getInputs();
    expect(inputs).toHaveLength(2);
    expect(inputs[0].type).toBe('SPAWN_TRIBE');
    expect(inputs[1].payload.weather).toBe('RAINY');
  });

  it('does not record inputs when stopped', () => {
    manager.recordInput('SHOULD_NOT_APPEAR', {});
    expect(manager.getInputs()).toHaveLength(0);
  });

  it('prunes snapshots beyond max', () => {
    const smallMax = 3;
    const mgr = new ReplayManager(provider, { snapshotIntervalMs: 1000, maxSnapshots: smallMax });
    mgr.start();
    vi.advanceTimersByTime(5000);
    mgr.stop();
    expect(mgr.getSnapshots().length).toBeLessThanOrEqual(smallMax);
  });

  it('rewinds to a snapshot at or before a target time', () => {
    manager.start();
    // seed snapshot at t=0
    const t0 = Date.now();

    vi.advanceTimersByTime(SNAPSHOT_INTERVAL_MS);
    const t1 = Date.now();

    // mutate state and seed
    provider.setState({ entities: ['e2'], components: [] });
    provider.setRngSeed(99);

    vi.advanceTimersByTime(SNAPSHOT_INTERVAL_MS);
    const t2 = Date.now();

    expect(provider.getState().entities).toContain('e2');
    expect(provider.getRngSeed()).toBe(99);

    // rewind to t1
    const restored = manager.rewindTo(t1);
    expect(restored).not.toBeNull();
    expect(restored!.timestamp).toBeLessThanOrEqual(t1);
    expect(provider.getState().entities).toContain('e1');
    expect(provider.getRngSeed()).toBe(42);
  });

  it('rewindBy rewinds relative to current time', () => {
    manager.start();
    vi.advanceTimersByTime(SNAPSHOT_INTERVAL_MS * 2);
    provider.setState({ entities: ['e3'], components: [] });
    const restored = manager.rewindBy(SNAPSHOT_INTERVAL_MS / 2);
    expect(restored).not.toBeNull();
  });

  it('rewindTo returns null when no snapshots exist', () => {
    const result = manager.rewindTo(Date.now());
    expect(result).toBeNull();
  });

  it('exports and encodes a replay', () => {
    manager.start();
    manager.recordInput('MIRACLE', { type: 'GROWTH' });
    manager.stop();

    const replay = manager.exportReplay();
    expect(replay.version).toBe('1.0.0');
    expect(replay.worldName).toBe('Test Replay');
    expect(replay.snapshots.length).toBeGreaterThanOrEqual(1);
    expect(replay.inputs.length).toBe(1);

    const encoded = manager.encodeReplayCompact();
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = ReplayManager.decodeReplayCompact(encoded);
    expect(decoded.worldName).toBe('Test Replay');
    expect(decoded.inputs).toEqual(replay.inputs);
  });

  it('loads a replay and restores initial state', () => {
    manager.start();
    manager.recordInput('MIRACLE', { type: 'GROWTH' });
    manager.stop();

    const replay = manager.exportReplay();
    const newProvider = makeProvider({ entities: ['z'], components: [] });
    const newMgr = new ReplayManager(newProvider);
    newMgr.loadReplay(replay);

    expect(newProvider.getState().entities).toContain('e1');
    expect(newProvider.getRngSeed()).toBe(42);
  });

  it('produces a Blob', () => {
    manager.start();
    manager.stop();
    const blob = manager.toBlob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/json');
  });

  it('reports duration after stop', () => {
    manager.start();
    vi.advanceTimersByTime(5000);
    manager.stop();
    expect(manager.getDurationMs()).toBeGreaterThanOrEqual(5000);
  });
});
