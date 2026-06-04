import initWasm, { WasmSimulationEngine } from '../../faithful-engine/pkg/faithful_engine.js';

let wasm: WasmSimulationEngine | null = null;
let sharedBuffer: SharedArrayBuffer | null = null;
let entityDataView: Float32Array | null = null;
let prevLength = 0;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

self.onmessage = async (e) => {
  const { type, payload, msgId } = e.data;

  if (type === 'INIT') {
    sharedBuffer = payload.sharedBuffer;
    entityDataView = new Float32Array(sharedBuffer);
    
    await initWasm();
    wasm = new WasmSimulationEngine();
    
    const terrain = wasm.get_terrain();
    const state = wasm.export_state();
    
    self.postMessage({ type: 'INIT_DONE', payload: { state, terrain } });
  }
  else if (type === 'UPDATE') {
    if (!wasm) return;
    
    if (payload.importState) {
        wasm.import_state(payload.importState);
    }
    
    wasm.update(payload.dt);
    
    if (entityDataView) {
        const entityData = wasm.get_entity_data_flat();
        entityDataView.set(entityData);
        if (prevLength > entityData.length) {
            entityDataView.fill(0, entityData.length, prevLength);
        }
        prevLength = entityData.length;
    }
    
    if (payload.isSyncTick) {
        const exportedState = wasm.export_state();
        self.postMessage({ type: 'STATE_UPDATE', payload: { state: exportedState } });
    } else {
        self.postMessage({ type: 'STATE_UPDATE', payload: { state: null } });
    }
  }
  else if (type.startsWith('CMD_')) {
    let result = undefined;
    if (!wasm) {
        self.postMessage({ type: 'CMD_RESULT', msgId, result });
        return;
    }
    
    switch (type) {
      case 'CMD_SET_WEATHER':
        result = wasm.set_weather(payload.newWeather, payload.duration, payload.intensity);
        break;
      case 'CMD_TRIGGER_SPELL':
        result = wasm.trigger_localized_spell(payload.type, payload.tx, payload.ty);
        break;
      case 'CMD_EXECUTE_SKILL':
        result = wasm.execute_skill(payload.skillId);
        break;
      case 'CMD_APPLY_STARTING_BOOST':
        result = wasm.apply_starting_boost(payload.godId);
        break;
      case 'CMD_SPAWN_TRIBE':
        result = wasm.spawn_tribe(payload.x, payload.y, payload.faction);
        break;
      case 'CMD_SPAWN_FLORA':
        result = wasm.spawn_flora(payload.x, payload.y, payload.category, payload.subType);
        break;
      case 'CMD_SPAWN_FAUNA':
        result = wasm.spawn_fauna(payload.x, payload.y, payload.category, payload.subType);
        break;
      case 'CMD_SPAWN_STRUCTURE':
        result = wasm.spawn_structure(payload.x, payload.y, payload.category, payload.subType);
        break;
      case 'CMD_ADD_EVENT_LOG':
        result = wasm.add_event_log(payload.type, payload.text);
        break;
      case 'CMD_GAIN_DIVINE_XP':
        result = wasm.gain_divine_xp(payload.amount, payload.multiplier !== undefined ? payload.multiplier : 1.0);
        break;
      case 'CMD_IMPORT_STATE':
        result = wasm.import_state(payload.state);
        break;
    }

    const exportedState = wasm.export_state();
    self.postMessage({ type: 'STATE_UPDATE', payload: { state: exportedState } });
    self.postMessage({ type: 'CMD_RESULT', msgId, result });
  }
};
