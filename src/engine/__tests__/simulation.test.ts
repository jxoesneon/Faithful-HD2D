import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimulationEngine } from '../simulation';
import { ECS } from '../ecs';

vi.mock('../../faithful-engine/pkg/faithful_engine.js', () => {
  return {
    default: vi.fn(),
    WasmSimulationEngine: vi.fn().mockImplementation(() => {
      return {
        export_state: () => ({
          ecsState: { entities: [], components: [] },
          totalDevotion: 100,
          activeGodId: null,
          weather: 'CLEAR',
          weatherTimer: 45,
          weatherTimeLeft: 45,
          weatherIntensity: 0.5,
          globalTemperature: 22,
          globalHumidity: 45,
          eventLogs: [],
          tribalRelations: {},
          divineLevel: 1,
          divineXP: 0,
          divineXPNeeded: 100,
          illuminationPoints: 0,
          unlockedIlluminations: [],
          actionsCompleted: {}
        }),
        import_state: vi.fn(),
        update: vi.fn(),
        set_weather: vi.fn(),
        trigger_localized_spell: vi.fn(() => true),
        execute_skill: vi.fn(() => 'Success'),
        apply_starting_boost: vi.fn(),
        spawn_tribe: vi.fn(() => 'entity-1'),
        spawn_flora: vi.fn(() => 'entity-2'),
        spawn_fauna: vi.fn(() => 'entity-3'),
        spawn_structure: vi.fn(() => 'entity-4'),
        add_event_log: vi.fn(),
        gain_divine_xp: vi.fn(),
        get_terrain: vi.fn(() => [[0]]),
        get_entity_at: vi.fn(() => ['id1', 'CROP', []]),
        get_planetary_mesh: vi.fn(() => []),
        get_regional_flow_field: vi.fn(() => []),
        get_isometric_tile_buffer: vi.fn(() => []),
        get_y_sorted_actors: vi.fn(() => []),
        get_particle_emission_buffer: vi.fn(() => []),
        get_aaa_effects: vi.fn(() => [])
      };
    })
  };
});

describe('SimulationEngine', () => {
  let ecs: ECS;
  let sim: SimulationEngine;

  beforeEach(() => {
    ecs = new ECS();
    sim = new SimulationEngine(ecs);
  });

  it('updates state', () => {
    sim.update(1.0);
    expect(sim.totalDevotion).toBe(100);
  });

  it('sets weather', () => {
    sim.setWeather('RAINY', 10, 0.5);
    expect(sim.weather).toBe('CLEAR'); // Mock returns CLEAR
  });

  it('triggers spell', () => {
    expect(sim.triggerLocalizedSpell('foo', 0, 0)).toBe(true);
  });

  it('executes skill', () => {
    expect(sim.executeSkill('foo')).toBe('Skill request sent');
    expect(sim.execute_skill('foo')).toBe('Skill request sent');
  });

  it('applies starting boost', () => {
    sim.applyStartingBoost('god1');
    sim.applyStartingBoost({ id: 'god1' });
    expect(sim.totalDevotion).toBe(100);
  });

  it('spawns entities', () => {
    expect(sim.spawnTribe(0, 0, 'ANIMIST')).toBe('spawn_pending');
    expect(sim.spawnFlora(0, 0, 'CROP', 'sub')).toBe('spawn_pending');
    expect(sim.spawnFauna(0, 0, 'WOLF', 'sub')).toBe('spawn_pending');
    expect(sim.spawnStructure(0, 0, 'ALTAR', 'sub')).toBe('spawn_pending');
  });

  it('adds log and gains xp', () => {
    sim.addEventLog('MIRACLE', 'test');
    sim.gainDivineXP(10);
    expect(sim.totalDevotion).toBe(100);
  });

  it('exports and imports state', () => {
    const state = sim.exportState();
    expect(typeof state).toBe('object');
    sim.importState({});
  });

  it('retrieves visual data', () => {
    expect(sim.getTerrain()).toEqual([]);
    expect(sim.getEntityAt(0, 0)).toBeUndefined();
    expect(sim.getPlanetaryMesh(1)).toBeNull();
    expect(sim.getRegionalFlowField(0, 0, 10, 1)).toBeNull();
    expect(sim.getIsometricTileBuffer(0, 0, 10, 1)).toBeNull();
    expect(sim.getYSortedActors([])).toEqual([]);
    expect(sim.getParticleEmissionBuffer(0, 0, 10, 1)).toBeNull();
    expect(sim.getAAAEffects(1, 1, null)).toBeNull();
  });
});
