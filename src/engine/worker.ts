import initWasm, { WasmSimulationEngine } from '../../faithful-engine/pkg/faithful_engine.js';

let wasm: WasmSimulationEngine | null = null;
let sharedBuffer: SharedArrayBuffer | null = null;
let entityDataView: Float32Array | null = null;

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
    
    const exportedState = wasm.export_state();
    
    if (exportedState && exportedState.ecsState && exportedState.ecsState.entities && entityDataView) {
        let i = 0;
        for (const [id, entity] of Object.entries(exportedState.ecsState.entities)) {
            if (i >= 100000) break;
            const ent = entity as any;
            const idx = i * 8; // ENTITY_STRIDE
            entityDataView[idx + 0] = ent.position?.x || 0;
            entityDataView[idx + 1] = ent.position?.y || 0;
            entityDataView[idx + 2] = ent.movement?.vx || 0;
            entityDataView[idx + 3] = ent.movement?.vy || 0;
            entityDataView[idx + 4] = ent.biology?.age || 0;
            entityDataView[idx + 5] = ent.biology?.health || 0;
            entityDataView[idx + 6] = 0; // type placeholder
            entityDataView[idx + 7] = 0; // state placeholder
            i++;
        }
    }
    
    self.postMessage({ type: 'STATE_UPDATE', payload: { state: exportedState } });
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
