import { Snapshot, PlayerInput, ReplayData } from '../../types';

export const SNAPSHOT_INTERVAL_MS = 30_000;
export const MAX_SNAPSHOTS = 50; // ~25 minutes of history

export interface ReplayStateProvider {
  getState(): Snapshot['ecsState'];
  setState(state: Snapshot['ecsState']): void;
  getRngSeed(): number;
  setRngSeed(seed: number): void;
}

function currentTime(): number {
  return Date.now();
}

export class ReplayManager {
  private snapshots: Snapshot[] = [];
  private inputs: PlayerInput[] = [];
  private rngSeeds: { timestamp: number; seed: number }[] = [];
  private startTime = 0;
  private endTime = 0;
  private snapshotIntervalMs: number;
  private maxSnapshots: number;
  private provider: ReplayStateProvider;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private worldName: string;

  constructor(
    provider: ReplayStateProvider,
    options: { snapshotIntervalMs?: number; maxSnapshots?: number; worldName?: string } = {}
  ) {
    this.provider = provider;
    this.snapshotIntervalMs = options.snapshotIntervalMs ?? SNAPSHOT_INTERVAL_MS;
    this.maxSnapshots = options.maxSnapshots ?? MAX_SNAPSHOTS;
    this.worldName = options.worldName ?? 'Replay';
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startTime = currentTime();
    this.endTime = 0;
    this.snapshots = [];
    this.inputs = [];
    this.rngSeeds = [];

    // Capture initial snapshot and RNG seed
    this.takeSnapshot();
    this.recordRngSeed();

    this.timer = setInterval(() => {
      this.takeSnapshot();
      this.recordRngSeed();
    }, this.snapshotIntervalMs);
  }

  stop(): void {
    this.running = false;
    this.endTime = currentTime();
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private takeSnapshot(): void {
    const snapshot: Snapshot = {
      timestamp: currentTime(),
      ecsState: this.provider.getState(),
      rngSeed: this.provider.getRngSeed(),
    };
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  private recordRngSeed(): void {
    this.rngSeeds.push({
      timestamp: currentTime(),
      seed: this.provider.getRngSeed(),
    });
  }

  recordInput(type: string, payload: Record<string, any>): void {
    if (!this.running) return;
    this.inputs.push({
      timestamp: currentTime(),
      type,
      payload,
    });
  }

  getSnapshots(): Snapshot[] {
    return [...this.snapshots];
  }

  getInputs(): PlayerInput[] {
    return [...this.inputs];
  }

  getRngSeeds(): { timestamp: number; seed: number }[] {
    return [...this.rngSeeds];
  }

  /**
   * Rewind to the latest snapshot at or before the target timestamp.
   * Returns the snapshot that was restored, or null if none exists.
   */
  rewindTo(targetTime: number): Snapshot | null {
    if (this.snapshots.length === 0) return null;

    // Find the latest snapshot at or before targetTime
    let bestIndex = -1;
    for (let i = 0; i < this.snapshots.length; i++) {
      if (this.snapshots[i].timestamp <= targetTime) {
        bestIndex = i;
      } else {
        break;
      }
    }

    if (bestIndex < 0) return null;

    const snapshot = this.snapshots[bestIndex];
    this.provider.setState(JSON.parse(JSON.stringify(snapshot.ecsState)));
    this.provider.setRngSeed(snapshot.rngSeed);

    // Trim future inputs so they can be replayed
    this.inputs = this.inputs.filter((inp) => inp.timestamp <= targetTime);
    this.rngSeeds = this.rngSeeds.filter((s) => s.timestamp <= targetTime);

    // Rebuild snapshots to only keep up to this point
    this.snapshots = this.snapshots.slice(0, bestIndex + 1);

    return snapshot;
  }

  rewindBy(ms: number): Snapshot | null {
    const target = currentTime() - ms;
    return this.rewindTo(target);
  }

  exportReplay(): ReplayData {
    return {
      version: '1.0.0',
      startSeed: this.snapshots[0]?.rngSeed ?? 0,
      worldName: this.worldName,
      snapshots: [...this.snapshots],
      inputs: [...this.inputs],
      startTime: this.startTime,
      endTime: this.endTime || currentTime(),
    };
  }

  encodeReplayCompact(): string {
    const data = this.exportReplay();
    // Compact: strip whitespace and base64 encode
    const json = JSON.stringify(data);
    let binary = '';
    for (let i = 0; i < json.length; i++) {
      binary += String.fromCharCode(json.charCodeAt(i) & 0xff);
    }
    return btoa(binary);
  }

  static decodeReplayCompact(encoded: string): ReplayData {
    const binary = atob(encoded);
    let json = '';
    for (let i = 0; i < binary.length; i++) {
      json += String.fromCharCode(binary.charCodeAt(i) & 0xff);
    }
    return JSON.parse(json) as ReplayData;
  }

  toBlob(): Blob {
    const data = this.exportReplay();
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  loadReplay(data: ReplayData): void {
    this.snapshots = [...data.snapshots];
    this.inputs = [...data.inputs];
    this.startTime = data.startTime;
    this.endTime = data.endTime ?? currentTime();
    this.worldName = data.worldName;
    this.rngSeeds = data.snapshots.map((s) => ({ timestamp: s.timestamp, seed: s.rngSeed }));

    if (this.snapshots.length > 0) {
      const first = this.snapshots[0];
      this.provider.setState(JSON.parse(JSON.stringify(first.ecsState)));
      this.provider.setRngSeed(first.rngSeed);
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  getDurationMs(): number {
    return (this.endTime || currentTime()) - this.startTime;
  }
}
