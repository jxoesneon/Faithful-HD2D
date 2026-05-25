import { ECS } from './ecs';
import { 
  Position, 
  Society, 
  Faith, 
  Flora, 
  Fauna, 
  Structure, 
  Movement, 
  Physics, 
  Biology, 
  FaithSystemType, 
  Entity 
} from '../types';
import initWasm, { WasmSimulationEngine } from '../../faithful-engine/pkg/faithful_engine.js';

// --- Shared Memory Architecture (Phase 1, Step 3) ---
const MAX_ENTITIES = 100000;
const ENTITY_STRIDE = 8; // x, y, vx, vy, age, life, type, state (all f32)
const SHARED_BUFFER_SIZE = MAX_ENTITIES * ENTITY_STRIDE * 4; // in bytes

export class SimulationEngine {
  private wasm: WasmSimulationEngine;
  private ecs: ECS;
  
  // Shared Memory Buffers
  public sharedBuffer: SharedArrayBuffer;
  public entityDataView: Float32Array;

  public width: number = 64;
  public height: number = 64;
  
  // Normal properties to allow direct reads/mutations by the React UI
  public totalDevotion: number = 100;
  public activeGodId: string | null = null;
  public weather: 'CLEAR' | 'RAINY' | 'DROUGHT' | 'TEMPEST' | 'AURORA' = 'CLEAR';
  public weatherTimer: number = 45; 
  public weatherTimeLeft: number = 45;
  public weatherIntensity: number = 0.5; 
  public globalTemperature: number = 22; 
  public globalHumidity: number = 45;    
  
  public eventLogs: {id: number, time: string, type: 'MIRACLE' | 'SCHISM' | 'EVOLUTION', text: string}[] = [];
  public tribalRelations: Record<string, Record<string, number>> = {};
  
  public divineLevel: number = 1;
  public divineXP: number = 0;
  public divineXPNeeded: number = 100;
  public illuminationPoints: number = 0;
  public unlockedIlluminations: string[] = [];
  
  public actionsCompleted = {
    miraclesCast: 0,
    floraHarvested: 0,
    faunaHunted: 0,
    structuresErected: 0,
    weatherInterventions: 0,
    tithesCompleted: 0,
    devotionAccumulated: 0
  };

  constructor(ecs: ECS) {
    this.sharedBuffer = new SharedArrayBuffer(SHARED_BUFFER_SIZE);
    this.entityDataView = new Float32Array(this.sharedBuffer);
    this.ecs = ecs;
    this.wasm = new WasmSimulationEngine();
    this.syncToTsEcs();
  }

  // Synchronizes full simulation and ECS state from the Rust WASM module into this JS class
  private syncToTsEcs() {
    const exportedState = this.wasm.export_state();
    if (exportedState) {
      if (exportedState.ecsState) {
        this.ecs.importState(exportedState.ecsState);
      }
      this.totalDevotion = exportedState.totalDevotion ?? 100;
      this.activeGodId = exportedState.activeGodId ?? null;
      this.weather = (exportedState.weather as any) ?? 'CLEAR';
      this.weatherTimer = exportedState.weatherTimer ?? 45;
      this.weatherTimeLeft = exportedState.weatherTimeLeft ?? 45;
      this.weatherIntensity = exportedState.weatherIntensity ?? 0.5;
      this.globalTemperature = exportedState.globalTemperature ?? 22;
      this.globalHumidity = exportedState.globalHumidity ?? 45;
      this.eventLogs = exportedState.eventLogs ?? [];
      this.tribalRelations = exportedState.tribalRelations ?? {};
      this.divineLevel = exportedState.divineLevel ?? 1;
      this.divineXP = exportedState.divineXP ?? 0;
      this.divineXPNeeded = exportedState.divineXPNeeded ?? 100;
      this.illuminationPoints = exportedState.illuminationPoints ?? 0;
      this.unlockedIlluminations = exportedState.unlockedIlluminations ?? [];
      this.actionsCompleted = exportedState.actionsCompleted ?? this.actionsCompleted;
    }
  }

  // Synchronizes full simulation and ECS state from this JS class back into the Rust WASM module
  private syncToRustEcs() {
    const tsExport = this.ecs.exportState();
    this.wasm.import_state({
      terrain: this.getTerrain(),
      totalDevotion: this.totalDevotion,
      activeGodId: this.activeGodId,
      weather: this.weather,
      weatherTimer: this.weatherTimer,
      weatherTimeLeft: this.weatherTimeLeft,
      weatherIntensity: this.weatherIntensity,
      globalTemperature: this.globalTemperature,
      globalHumidity: this.globalHumidity,
      eventLogs: this.eventLogs,
      divineLevel: this.divineLevel,
      divineXP: this.divineXP,
      divineXPNeeded: this.divineXPNeeded,
      illuminationPoints: this.illuminationPoints,
      unlockedIlluminations: this.unlockedIlluminations,
      actionsCompleted: this.actionsCompleted,
      tribalRelations: this.tribalRelations,
      ecsState: tsExport
    });
  }

  public update(dt: number) {
    this.syncToRustEcs();
    this.wasm.update(dt);
    this.syncToTsEcs();
  }

  public setWeather(newWeather: 'CLEAR' | 'RAINY' | 'DROUGHT' | 'TEMPEST' | 'AURORA', duration: number = 45, intensity: number = 0.5) {
    this.syncToRustEcs();
    this.wasm.set_weather(newWeather, duration, intensity);
    this.syncToTsEcs();
  }

  public triggerLocalizedSpell(type: string, tx: number, ty: number): boolean {
    this.syncToRustEcs();
    const result = this.wasm.trigger_localized_spell(type, tx, ty);
    this.syncToTsEcs();
    return result;
  }

  public execute_skill(skillId: string): string {
    this.syncToRustEcs();
    const logResult = this.wasm.execute_skill(skillId);
    this.syncToTsEcs();
    return logResult;
  }

  // Expose camelCase version to support legacy calls in the UI
  public executeSkill(skillId: string): string {
    return this.execute_skill(skillId);
  }

  public applyStartingBoost(godId: any) {
    this.syncToRustEcs();
    const godName = typeof godId === 'string' ? godId : (godId.id || '');
    this.wasm.apply_starting_boost(godName);
    this.syncToTsEcs();
  }

  public spawnTribe(x: number, y: number, faction: 'ANIMIST' | 'TECHNOCRAT' | 'INTERVENTIONIST' | 'NIHILIST' | 'ELEMENTAL') {
    this.syncToRustEcs();
    const entityId = this.wasm.spawn_tribe(x, y, faction);
    this.syncToTsEcs();
    return entityId;
  }

  public spawnFlora(x: number, y: number, category: 'CROP' | 'NANO_BANANA' | 'EXOTIC' | 'TREE', subType: string) {
    this.syncToRustEcs();
    const entityId = this.wasm.spawn_flora(x, y, category, subType);
    this.syncToTsEcs();
    return entityId;
  }

  public spawnFauna(x: number, y: number, category: 'WOLF' | 'STAG' | 'COW' | 'CELESTIAL', subType: string) {
    this.syncToRustEcs();
    const entityId = this.wasm.spawn_fauna(x, y, category, subType);
    this.syncToTsEcs();
    return entityId;
  }

  public spawnStructure(x: number, y: number, category: 'ALTAR' | 'REACTOR' | 'HABITAT' | 'DEFENSE' | 'FARM', subType: string) {
    this.syncToRustEcs();
    const entityId = this.wasm.spawn_structure(x, y, category, subType);
    this.syncToTsEcs();
    return entityId;
  }

  public addEventLog(type: 'MIRACLE' | 'SCHISM' | 'EVOLUTION', text: string) {
    this.syncToRustEcs();
    this.wasm.add_event_log(type, text);
    this.syncToTsEcs();
  }

  public gainDivineXP(amount: number) {
    this.syncToRustEcs();
    this.wasm.gain_divine_xp(amount);
    this.syncToTsEcs();
  }

  public exportState(): any {
    this.syncToRustEcs();
    return this.wasm.export_state();
  }

  public importState(state: any) {
    this.wasm.import_state(state);
    this.syncToTsEcs();
  }

  public getTerrain(): number[][] {
    return this.wasm.get_terrain();
  }

  public getEntityAt(tx: number, ty: number) {
    this.syncToRustEcs();
    const entityInfo = this.wasm.get_entity_at(tx, ty);
    if (!entityInfo || !Array.isArray(entityInfo) || entityInfo.length < 3) {
      return undefined;
    }
    return {
      id: entityInfo[0],
      category: entityInfo[1],
      components: entityInfo[2]
    };
  }

  public getPlanetaryMesh(subdivisions: number): any {
    return this.wasm.get_planetary_mesh(subdivisions);
  }

  public getRegionalFlowField(startX: number, startY: number, size: number, chunkRes: number): any {
    return this.wasm.get_regional_flow_field(startX, startY, size, chunkRes);
  }

  public getIsometricTileBuffer(startX: number, startY: number, size: number, resolution: number): any {
    return this.wasm.get_isometric_tile_buffer(startX, startY, size, resolution);
  }

  public getYSortedActors(actors: any[]): any[] {
    return this.wasm.get_y_sorted_actors(actors);
  }

  public getParticleEmissionBuffer(emitterX: number, emitterY: number, particleCount: number, seed: number): any {
    return this.wasm.get_particle_emission_buffer(emitterX, emitterY, particleCount, seed);
  }

  public getAAAEffects(cameraZoom: number, targetDepth: number, activeDeityId: string | null): any {
    return this.wasm.get_aaa_effects(cameraZoom, targetDepth, activeDeityId || undefined);
  }
}
