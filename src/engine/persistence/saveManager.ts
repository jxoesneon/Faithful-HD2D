import { SaveMetadata, SaveSlot } from '../../types';

export const CURRENT_SCHEMA_VERSION = '1.0.0';
export const AUTOSAVE_INTERVAL_MS = 60_000;
export const QUICKSAVE_SLOT_ID = 'quicksave';
export const MAX_SLOTS = 5;

export interface RawSaveData {
  schemaVersion: string;
  metadata: SaveMetadata;
  ecsState: { entities: string[]; components: { type: string; entity: string; data: any }[] };
  simulationState: Record<string, any>;
}

export interface GameStateProvider {
  getState(): { ecsState: RawSaveData['ecsState']; simulationState: RawSaveData['simulationState'] };
  loadState(state: { ecsState: RawSaveData['ecsState']; simulationState: RawSaveData['simulationState'] }): void;
}

type MigrationFn = (data: any) => any;

const MIGRATIONS: Record<string, MigrationFn> = {
  '0.8.0->0.9.0': (data: any) => {
    if (!data.schemaVersion) {
      data.schemaVersion = '0.9.0';
    }
    if (!data.metadata) {
      data.metadata = {
        version: '0.9.0',
        timestamp: Date.now(),
        playtime: 0,
        worldName: data.saveName || 'Unknown World',
      };
    }
    return data;
  },
  '0.9.0->1.0.0': (data: any) => {
    data.schemaVersion = '1.0.0';
    if (data.metadata) {
      data.metadata.version = '1.0.0';
      if (typeof data.metadata.playtime !== 'number') {
        data.metadata.playtime = 0;
      }
      if (!data.metadata.worldName && data.saveName) {
        data.metadata.worldName = data.saveName;
        delete data.saveName;
      }
    }
    if (!data.simulationState) {
      data.simulationState = {};
    }
    return data;
  },
};

const MIGRATION_PATHS: string[] = ['0.8.0->0.9.0', '0.9.0->1.0.0'];

function applyMigrations(data: any): RawSaveData {
  let current = { ...data };
  for (const path of MIGRATION_PATHS) {
    const [fromVer] = path.split('->');
    if (current.schemaVersion === fromVer) {
      current = MIGRATIONS[path](current);
    }
  }
  return current as RawSaveData;
}

export function validateSaveData(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Save data is not an object' };
  }
  if (typeof data.schemaVersion !== 'string') {
    return { valid: false, error: 'Missing or invalid schemaVersion' };
  }
  if (!data.metadata || typeof data.metadata !== 'object') {
    return { valid: false, error: 'Missing metadata object' };
  }
  if (typeof data.metadata.timestamp !== 'number') {
    return { valid: false, error: 'Missing metadata.timestamp' };
  }
  if (typeof data.metadata.playtime !== 'number') {
    return { valid: false, error: 'Missing metadata.playtime' };
  }
  if (typeof data.metadata.worldName !== 'string') {
    return { valid: false, error: 'Missing metadata.worldName' };
  }
  if (!data.ecsState || typeof data.ecsState !== 'object') {
    return { valid: false, error: 'Missing ecsState' };
  }
  if (!Array.isArray(data.ecsState.entities)) {
    return { valid: false, error: 'ecsState.entities must be an array' };
  }
  if (!Array.isArray(data.ecsState.components)) {
    return { valid: false, error: 'ecsState.components must be an array' };
  }
  if (!data.simulationState || typeof data.simulationState !== 'object') {
    return { valid: false, error: 'Missing simulationState' };
  }
  return { valid: true };
}

// Simple run-length encoding fallback for environments without CompressionStream
function rleEncode(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    let count = 1;
    while (i + count < input.length && input[i + count] === ch && count < 255) {
      count++;
    }
    if (count >= 4) {
      out += '\x00' + String.fromCharCode(count) + ch;
      i += count;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

function rleDecode(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    if (input[i] === '\x00' && i + 2 < input.length) {
      const count = input.charCodeAt(i + 1);
      const ch = input[i + 2];
      out += ch.repeat(count);
      i += 3;
    } else {
      out += input[i];
      i++;
    }
  }
  return out;
}

async function nativeCompress(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(encoder.encode(input));
  writer.close();
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const { value, done: d } = await reader.read();
    if (value) chunks.push(value);
    done = d;
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  // Convert to base64 string for storage
  let binary = '';
  for (let i = 0; i < merged.length; i++) {
    binary += String.fromCharCode(merged[i]);
  }
  return btoa(binary);
}

async function nativeDecompress(input: string): Promise<string> {
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const { value, done: d } = await reader.read();
    if (value) chunks.push(value);
    done = d;
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder().decode(merged);
}

function hasNativeCompression(): boolean {
  try {
    return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
  } catch {
    return false;
  }
}

export async function compressSave(rawJson: string): Promise<string> {
  if (hasNativeCompression()) {
    try {
      return 'gz:' + (await nativeCompress(rawJson));
    } catch {
      // fallthrough to RLE
    }
  }
  const rle = rleEncode(rawJson);
  let binary = '';
  for (let i = 0; i < rle.length; i++) {
    binary += String.fromCharCode(rle.charCodeAt(i) & 0xff);
  }
  return 'rle:' + btoa(binary);
}

export async function decompressSave(compressed: string): Promise<string> {
  if (compressed.startsWith('gz:')) {
    if (hasNativeCompression()) {
      return nativeDecompress(compressed.slice(3));
    }
    throw new Error('Native gzip decompression not available in this environment');
  }
  if (compressed.startsWith('rle:')) {
    const base64 = compressed.slice(4);
    const binary = atob(base64);
    let rle = '';
    for (let i = 0; i < binary.length; i++) {
      rle += String.fromCharCode(binary.charCodeAt(i) & 0xff);
    }
    return rleDecode(rle);
  }
  throw new Error('Unknown compression format');
}

export class SaveManager {
  private storage: Storage;
  private provider: GameStateProvider;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private playtimeStart = 0;
  private accumulatedPlaytime = 0;
  private worldName: string;

  constructor(
    provider: GameStateProvider,
    options: { storage?: Storage; worldName?: string } = {}
  ) {
    this.provider = provider;
    this.storage = options.storage ?? (typeof localStorage !== 'undefined' ? localStorage : new MockStorage());
    this.worldName = options.worldName ?? 'New World';
  }

  private slotKey(slotId: string): string {
    return `faithful_save_slot_${slotId}`;
  }

  private quicksaveKey(): string {
    return `faithful_save_${QUICKSAVE_SLOT_ID}`;
  }

  private autosaveKey(): string {
    return `faithful_save_autosave`;
  }

  private createMetadata(playtime: number): SaveMetadata {
    return {
      version: CURRENT_SCHEMA_VERSION,
      timestamp: Date.now(),
      playtime,
      worldName: this.worldName,
    };
  }

  private async serializeSave(): Promise<string> {
    const { ecsState, simulationState } = this.provider.getState();
    const raw: RawSaveData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: this.createMetadata(this.accumulatedPlaytime + (Date.now() - this.playtimeStart) / 1000),
      ecsState,
      simulationState,
    };
    return compressSave(JSON.stringify(raw));
  }

  private async deserializeSave(compressed: string): Promise<RawSaveData> {
    const json = await decompressSave(compressed);
    let data = JSON.parse(json);
    data = applyMigrations(data);
    const validation = validateSaveData(data);
    if (!validation.valid) {
      throw new Error(`Save validation failed: ${validation.error}`);
    }
    return data as RawSaveData;
  }

  private async writeSave(key: string, name: string, compressed: string, metadata: SaveMetadata): Promise<void> {
    const slot: SaveSlot = {
      id: key.replace(/^faithful_save_/, '').replace(/^slot_/, ''),
      name,
      metadata,
      data: compressed,
    };
    this.storage.setItem(key, JSON.stringify(slot));
  }

  private readSlot(key: string): SaveSlot | null {
    const raw = this.storage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SaveSlot;
    } catch {
      return null;
    }
  }

  async saveToSlot(slotId: string, name: string): Promise<void> {
    const compressed = await this.serializeSave();
    const metadata = this.createMetadata(
      this.accumulatedPlaytime + (Date.now() - this.playtimeStart) / 1000
    );
    this.writeSave(this.slotKey(slotId), name, compressed, metadata);
  }

  async quicksave(): Promise<void> {
    const compressed = await this.serializeSave();
    const metadata = this.createMetadata(
      this.accumulatedPlaytime + (Date.now() - this.playtimeStart) / 1000
    );
    this.writeSave(this.quicksaveKey(), 'Quicksave', compressed, metadata);
  }

  async quickload(): Promise<void> {
    const slot = this.readSlot(this.quicksaveKey());
    if (!slot) throw new Error('No quicksave found');
    const raw = await this.deserializeSave(slot.data);
    this.provider.loadState({ ecsState: raw.ecsState, simulationState: raw.simulationState });
    this.accumulatedPlaytime = raw.metadata.playtime;
    this.playtimeStart = Date.now();
  }

  async loadFromSlot(slotId: string): Promise<void> {
    const slot = this.readSlot(this.slotKey(slotId));
    if (!slot) throw new Error(`Save slot ${slotId} is empty`);
    const raw = await this.deserializeSave(slot.data);
    this.provider.loadState({ ecsState: raw.ecsState, simulationState: raw.simulationState });
    this.accumulatedPlaytime = raw.metadata.playtime;
    this.playtimeStart = Date.now();
  }

  async autosave(): Promise<void> {
    const compressed = await this.serializeSave();
    const metadata = this.createMetadata(
      this.accumulatedPlaytime + (Date.now() - this.playtimeStart) / 1000
    );
    this.writeSave(this.autosaveKey(), 'Autosave', compressed, metadata);
  }

  async loadAutosave(): Promise<void> {
    const slot = this.readSlot(this.autosaveKey());
    if (!slot) throw new Error('No autosave found');
    const raw = await this.deserializeSave(slot.data);
    this.provider.loadState({ ecsState: raw.ecsState, simulationState: raw.simulationState });
    this.accumulatedPlaytime = raw.metadata.playtime;
    this.playtimeStart = Date.now();
  }

  deleteSlot(slotId: string): void {
    this.storage.removeItem(this.slotKey(slotId));
  }

  deleteQuicksave(): void {
    this.storage.removeItem(this.quicksaveKey());
  }

  listSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];
    for (let i = 1; i <= MAX_SLOTS; i++) {
      const slot = this.readSlot(this.slotKey(String(i)));
      if (slot) slots.push(slot);
    }
    return slots;
  }

  getSlot(slotId: string): SaveSlot | null {
    return this.readSlot(this.slotKey(slotId));
  }

  getQuicksave(): SaveSlot | null {
    return this.readSlot(this.quicksaveKey());
  }

  getAutosave(): SaveSlot | null {
    return this.readSlot(this.autosaveKey());
  }

  startAutoSave(): void {
    this.stopAutoSave();
    this.playtimeStart = Date.now();
    this.autoSaveTimer = setInterval(() => {
      this.autosave();
    }, AUTOSAVE_INTERVAL_MS);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    if (this.playtimeStart > 0) {
      this.accumulatedPlaytime += (Date.now() - this.playtimeStart) / 1000;
      this.playtimeStart = 0;
    }
  }

  getPlaytime(): number {
    if (this.playtimeStart > 0) {
      return this.accumulatedPlaytime + (Date.now() - this.playtimeStart) / 1000;
    }
    return this.accumulatedPlaytime;
  }

  resetPlaytime(): void {
    this.accumulatedPlaytime = 0;
    this.playtimeStart = Date.now();
  }
}

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
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
