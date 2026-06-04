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
  Entity,
  RenderableEntity
} from '../types';

const MAX_ENTITIES = 100000;
const ENTITY_STRIDE = 8; // x, y, vx, vy, age, life, type, state (all f32)
const SHARED_BUFFER_SIZE = MAX_ENTITIES * ENTITY_STRIDE * 4; // in bytes

export class SimulationEngine {
  private worker: Worker;
  private ecs: ECS;
  
  // Shared Memory Buffers
  public sharedBuffer: SharedArrayBuffer | ArrayBuffer;
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

  private cachedTerrain: number[][] = [];
  private isReady: boolean = false;
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  
  private messageIdCounter = 0;
  private pendingRequests = new Map<number, (result: any) => void>();
  private tickCount = 0;

  public static async create(ecs: ECS): Promise<SimulationEngine> {
    const sim = new SimulationEngine(ecs);
    await sim.init();
    return sim;
  }

  constructor(ecs: ECS) {
    // Graceful fallback: use regular ArrayBuffer if SharedArrayBuffer is unavailable
    const BufferClass = typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : ArrayBuffer;
    this.sharedBuffer = new BufferClass(SHARED_BUFFER_SIZE);
    this.entityDataView = new Float32Array(this.sharedBuffer as ArrayBuffer);
    this.ecs = ecs;
    
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });

    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    
    this.worker.onmessage = (e) => {
      const { type, payload, msgId, result } = e.data;
      if (type === 'INIT_DONE') {
        this.cachedTerrain = payload.terrain;
        this.syncToTsEcsFromExport(payload.state);
        this.isReady = true;
        this.readyResolve();
      } else if (type === 'STATE_UPDATE') {
        this.syncToTsEcsFromExport(payload.state);
      } else if (type === 'CMD_RESULT') {
        if (this.pendingRequests.has(msgId)) {
          this.pendingRequests.get(msgId)!(result);
          this.pendingRequests.delete(msgId);
        }
      }
    };
  }

  public async init() {
    this.worker.postMessage({ type: 'INIT', payload: { sharedBuffer: this.sharedBuffer } });
    return this.readyPromise;
  }

  private sendCommand(type: string, payload: any = {}): Promise<any> {
    const msgId = this.messageIdCounter++;
    return new Promise((resolve) => {
      this.pendingRequests.set(msgId, resolve);
      this.worker.postMessage({ type, msgId, payload });
    });
  }

  private syncToTsEcsFromExport(exportedState: any) {
    if (exportedState) {
      console.log('[Sim State Sync] Received state, has ecsState:', !!exportedState.ecsState, 'keys:', Object.keys(exportedState));
      if (exportedState.ecsState) {
        const beforeCount = this.ecs.getEntitiesWith(['position']).length;
        this.ecs.importState(exportedState.ecsState);
        const afterCount = this.ecs.getEntitiesWith(['position']).length;
        console.log('[Sim State Sync] Entities before:', beforeCount, 'after:', afterCount, 'imported entities:', exportedState.ecsState.entities?.length);
      }
      this.totalDevotion = exportedState.totalDevotion ?? this.totalDevotion;
      this.activeGodId = exportedState.activeGodId ?? this.activeGodId;
      this.weather = (exportedState.weather as any) ?? this.weather;
      this.weatherTimer = exportedState.weatherTimer ?? this.weatherTimer;
      this.weatherTimeLeft = exportedState.weatherTimeLeft ?? this.weatherTimeLeft;
      this.weatherIntensity = exportedState.weatherIntensity ?? this.weatherIntensity;
      this.globalTemperature = exportedState.globalTemperature ?? this.globalTemperature;
      this.globalHumidity = exportedState.globalHumidity ?? this.globalHumidity;
      this.eventLogs = exportedState.eventLogs ?? this.eventLogs;
      this.tribalRelations = exportedState.tribalRelations ?? this.tribalRelations;
      this.divineLevel = exportedState.divineLevel ?? this.divineLevel;
      this.divineXP = exportedState.divineXP ?? this.divineXP;
      this.divineXPNeeded = exportedState.divineXPNeeded ?? this.divineXPNeeded;
      this.illuminationPoints = exportedState.illuminationPoints ?? this.illuminationPoints;
      this.unlockedIlluminations = exportedState.unlockedIlluminations ?? this.unlockedIlluminations;
      this.actionsCompleted = exportedState.actionsCompleted ?? this.actionsCompleted;
    }
  }

  public update(dt: number) {
    if (!this.isReady) return;
    this.tickCount++;
    const shouldSync = (this.tickCount % 6 === 0);
    const tsExport = shouldSync ? this.ecs.exportState() : null;
    this.worker.postMessage({ type: 'UPDATE', payload: { dt, importState: tsExport, isSyncTick: shouldSync } });
  }

  public setWeather(newWeather: 'CLEAR' | 'RAINY' | 'DROUGHT' | 'TEMPEST' | 'AURORA', duration: number = 45, intensity: number = 0.5) {
    this.sendCommand('CMD_SET_WEATHER', { newWeather, duration, intensity });
  }

  public triggerLocalizedSpell(type: string, tx: number, ty: number): boolean {
    this.sendCommand('CMD_TRIGGER_SPELL', { type, tx, ty });
    return true; // Optimistic return for the UI
  }

  public execute_skill(skillId: string): string {
    this.sendCommand('CMD_EXECUTE_SKILL', { skillId });
    return "Skill request sent";
  }

  public executeSkill(skillId: string): string {
    return this.execute_skill(skillId);
  }

  public applyStartingBoost(godId: any) {
    const godName = typeof godId === 'string' ? godId : (godId.id || '');
    this.sendCommand('CMD_APPLY_STARTING_BOOST', { godId: godName });
  }

  public spawnTribe(x: number, y: number, faction: 'ANIMIST' | 'TECHNOCRAT' | 'INTERVENTIONIST' | 'NIHILIST' | 'ELEMENTAL') {
    this.sendCommand('CMD_SPAWN_TRIBE', { x, y, faction });
    return "spawn_pending";
  }

  public spawnFlora(x: number, y: number, category: 'CROP' | 'NANO_BANANA' | 'EXOTIC' | 'TREE', subType: string) {
    this.sendCommand('CMD_SPAWN_FLORA', { x, y, category, subType });
    return "spawn_pending";
  }

  public spawnFauna(x: number, y: number, category: 'WOLF' | 'STAG' | 'COW' | 'CELESTIAL', subType: string) {
    this.sendCommand('CMD_SPAWN_FAUNA', { x, y, category, subType });
    return "spawn_pending";
  }

  public spawnStructure(x: number, y: number, category: 'ALTAR' | 'REACTOR' | 'HABITAT' | 'DEFENSE' | 'FARM', subType: string) {
    this.sendCommand('CMD_SPAWN_STRUCTURE', { x, y, category, subType });
    return "spawn_pending";
  }

  public addEventLog(type: 'MIRACLE' | 'SCHISM' | 'EVOLUTION', text: string) {
    this.sendCommand('CMD_ADD_EVENT_LOG', { type, text });
  }

  public gainDivineXP(amount: number, multiplier: number = 1.0) {
    this.sendCommand('CMD_GAIN_DIVINE_XP', { amount, multiplier });
  }

  public exportState(): any {
    return this.ecs.exportState(); // Since state is synced locally
  }

  public importState(state: any) {
    this.sendCommand('CMD_IMPORT_STATE', { state });
  }

  public getTerrain(): number[][] {
    return this.cachedTerrain;
  }

  public getAllEntitiesForRender(): RenderableEntity[] {
    const result: RenderableEntity[] = [];
    const entities = this.ecs.getEntitiesWith(['position']);
    for (const id of entities) {
      const pos = this.ecs.getComponent<Position>(id, 'position');
      if (!pos) continue;
      const society = this.ecs.getComponent<Society>(id, 'society');
      const flora = this.ecs.getComponent<Flora>(id, 'flora');
      const fauna = this.ecs.getComponent<Fauna>(id, 'fauna');
      const structure = this.ecs.getComponent<Structure>(id, 'structure');
      const movement = this.ecs.getComponent<Movement>(id, 'movement');

      let category: 'Tribe' | 'Flora' | 'Fauna' | 'Structure' = 'Tribe';
      if (society) category = 'Tribe';
      else if (flora) category = 'Flora';
      else if (fauna) category = 'Fauna';
      else if (structure) category = 'Structure';
      else continue;

      result.push({
        id,
        x: pos.x,
        y: pos.y,
        category,
        subType: society?.name || flora?.subType || fauna?.subType || structure?.subType || '',
        name: society?.name || structure?.category || flora?.category || fauna?.category || '',
        faction: society?.faction || structure?.category,
        activityState: movement?.activityState || fauna?.actionState,
        population: society?.population,
        resources: society?.resources,
        health: society ? 100 : flora ? (flora.growth) : fauna ? fauna.health : structure ? structure.durability : undefined,
        growth: flora?.growth,
      });
    }
    return result;
  }

  public getEntityAt(tx: number, ty: number) {
    const entities = this.ecs.getEntitiesWith(['position']);
    for (const id of entities) {
      const pos = this.ecs.getComponent<Position>(id, 'position');
      if (pos && Math.floor(pos.x) === Math.floor(tx) && Math.floor(pos.y) === Math.floor(ty)) {
        let category = 'Unknown';
        const society = this.ecs.getComponent(id, 'society');
        const flora = this.ecs.getComponent(id, 'flora');
        const fauna = this.ecs.getComponent(id, 'fauna');
        const structure = this.ecs.getComponent(id, 'structure');
        
        if (society) category = 'Tribe';
        else if (flora) category = 'Flora';
        else if (fauna) category = 'Fauna';
        else if (structure) category = 'Structure';
        
        return {
          id,
          category,
          components: { position: pos, society, flora, fauna, structure }
        };
      }
    }
    return undefined;
  }

  public getPlanetaryMesh(subdivisions: number): any {
    return null;
  }

  public getRegionalFlowField(startX: number, startY: number, size: number, chunkRes: number): any {
    return null;
  }

  public getIsometricTileBuffer(startX: number, startY: number, size: number, resolution: number): any {
    return null;
  }

  public getYSortedActors(actors: any[]): any[] {
    return actors;
  }

  public getParticleEmissionBuffer(emitterX: number, emitterY: number, particleCount: number, seed: number): any {
    return null;
  }

  public getAAAEffects(cameraZoom: number, targetDepth: number, activeDeityId: string | null): any {
    return null;
  }
}
