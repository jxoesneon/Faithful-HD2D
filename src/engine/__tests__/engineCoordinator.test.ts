import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ECS } from '../ecs';
import { EngineCoordinator } from '../engineCoordinator';

vi.mock('pixi.js', () => ({
  Container: vi.fn(function () {
    return {
      addChild: vi.fn(),
      removeChild: vi.fn(),
      destroy: vi.fn(),
      children: [] as any[],
    };
  }),
  Graphics: vi.fn(function () {
    return {
      clear: vi.fn(),
      circle: vi.fn(),
      fill: vi.fn(),
      x: 0,
      y: 0,
      rotation: 0,
      visible: false,
      blendMode: 'normal',
      destroy: vi.fn(),
    };
  }),
  Application: vi.fn(function () { return {}; }),
  Mesh: vi.fn(function () { return {}; }),
  MeshGeometry: vi.fn(function () { return {}; }),
  Shader: vi.fn(function () { return {}; }),
  UniformGroup: vi.fn(function () {
    return { uniforms: {}, update: vi.fn() };
  }),
}));

describe('EngineCoordinator', () => {
  let ecs: ECS;
  let coordinator: EngineCoordinator;

  const mockTerrain = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => 1)
  );

  function createMockSim() {
    return {
      getTerrain: vi.fn(() => mockTerrain),
      totalDevotion: 100,
      weather: 'CLEAR' as const,
    };
  }

  beforeEach(() => {
    ecs = new ECS();
    coordinator = new EngineCoordinator(ecs);
  });

  describe('Initialization', () => {
    it('creates all manager properties without errors', () => {
      const c = new EngineCoordinator(ecs);
      expect(c).toBeDefined();

      const managerKeys = [
        // World
        'dayNight',
        'season',
        'weather',
        'ecology',
        'disease',
        'wind',
        'vegetation',
        // Combat
        'combat',
        'morale',
        // Status
        'statusEffects',
        'traits',
        // Faith
        'faithFog',
        'shrines',
        'piety',
        'dogma',
        'missionary',
        // Economy
        'resources',
        'gathering',
        'crafting',
        'techTree',
        'population',
        'inventory',
        // Macro
        'trade',
        'settlements',
        'borders',
        // AI
        'blackboard',
        // Quest & Story
        'quests',
        'events',
        'achievements',
        'dialogue',
        'waypoints',
        'titles',
        // Persistence
        'saves',
        'replay',
        // Physics
        'collision',
        'rigidBody',
        // Input
        'input',
        // VFX / Rendering
        'particles',
        'postProcess',
        'shadows',
        'water',
        'planetary',
        'structures',
      ];

      for (const key of managerKeys) {
        expect((c as any)[key]).toBeDefined();
      }

      expect(managerKeys.length).toBeGreaterThanOrEqual(39);
    });

    it('has null pathfinding and terraform before init', () => {
      expect(coordinator.pathfinding).toBeNull();
      expect(coordinator.terraform).toBeNull();
      expect(coordinator.sim).toBeNull();
    });
  });

  describe('init()', () => {
    it('initializes with a mock SimulationEngine', async () => {
      const mockSim = createMockSim();
      await coordinator.init(mockSim as any);
      expect(coordinator.sim).toBe(mockSim as any);
      expect(coordinator.pathfinding).not.toBeNull();
      expect(coordinator.terraform).not.toBeNull();
      expect(mockSim.getTerrain).toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('ticks all systems without throwing after init', async () => {
      const mockSim = createMockSim();
      await coordinator.init(mockSim as any);
      expect(() => coordinator.update(1.0)).not.toThrow();
    });

    it('does nothing when not initialized', () => {
      expect(() => coordinator.update(1.0)).not.toThrow();
      expect(coordinator.sim).toBeNull();
    });
  });

  describe('WorldState', () => {
    it('buildWorldState returns a valid snapshot after init', async () => {
      const mockSim = createMockSim();
      await coordinator.init(mockSim as any);

      // Add some entities so counts are non-zero
      const societyId = ecs.createEntity();
      ecs.addComponent(societyId, {
        type: 'society',
        name: 'Test Tribe',
        faction: 'ANIMIST',
        population: 10,
        technologyLevel: 1,
        resources: 100,
        happiness: 50,
      } as any);

      const structureId = ecs.createEntity();
      ecs.addComponent(structureId, {
        type: 'structure',
        category: 'ALTAR',
        subType: 'stone',
        durability: 100,
        efficiency: 1,
      } as any);

      const floraId = ecs.createEntity();
      ecs.addComponent(floraId, {
        type: 'flora',
        category: 'CROP',
        subType: 'wheat',
        growth: 50,
        resourcesYield: 10,
        isHarvested: false,
      } as any);

      const faunaId = ecs.createEntity();
      ecs.addComponent(faunaId, {
        type: 'fauna',
        category: 'WOLF',
        subType: 'gray',
        health: 100,
        hunger: 50,
        aggressiveness: 30,
        actionState: 'WANDERING',
      } as any);

      // Trigger update so buildWorldState is called internally
      coordinator.update(1.0);

      const snapshot = (coordinator as any).buildWorldState();
      expect(snapshot).toBeDefined();
      expect(snapshot.population).toBe(1);
      expect(snapshot.tribeCount).toBe(1);
      expect(snapshot.totalStructures).toBe(1);
      expect(snapshot.totalFlora).toBe(1);
      expect(snapshot.totalFauna).toBe(1);
      expect(snapshot.averageHappiness).toBe(50);
      expect(snapshot.averageTech).toBe(1.0);
      expect(snapshot.weather).toBe('CLEAR');
      expect(snapshot.devotion).toBe(100);
      expect(snapshot.conflictsActive).toBe(0);
      expect(typeof snapshot.timePlayed).toBe('number');
    });
  });

  describe('Export/Import', () => {
    it('round-trips snapshot correctly', async () => {
      const mockSim = createMockSim();
      await coordinator.init(mockSim as any);

      const entityId = ecs.createEntity();
      ecs.addComponent(entityId, {
        type: 'society',
        name: 'Tribe A',
        faction: 'ANIMIST',
        population: 5,
        technologyLevel: 1,
        resources: 50,
        happiness: 60,
      } as any);

      const exported = coordinator.exportSnapshot();
      expect(exported).toBeDefined();
      expect(exported.ecs).toBeDefined();
      expect(exported.timestamp).toBeDefined();
      expect(typeof exported.timestamp).toBe('number');

      // Clear ECS and import
      ecs.clear();
      expect(ecs.getEntitiesWith(['society'])).toHaveLength(0);

      coordinator.importSnapshot(exported);
      expect(ecs.getEntitiesWith(['society'])).toHaveLength(1);
    });
  });

  describe('Diagnostics', () => {
    it('returns all 25 system entries', async () => {
      const mockSim = createMockSim();
      await coordinator.init(mockSim as any);
      const diagnostics = coordinator.getDiagnostics();
      expect(Object.keys(diagnostics).length).toBe(25);
      for (const key of Object.keys(diagnostics)) {
        expect(diagnostics[key]).toHaveProperty('active');
        expect(diagnostics[key]).toHaveProperty('status');
        expect(diagnostics[key].status).toBe('running');
      }
    });

    it('reflects correct entity counts after adding entities', async () => {
      const mockSim = createMockSim();
      await coordinator.init(mockSim as any);

      const floraId = ecs.createEntity();
      ecs.addComponent(floraId, {
        type: 'flora',
        category: 'CROP',
        subType: 'wheat',
        growth: 50,
        resourcesYield: 10,
        isHarvested: false,
      } as any);

      const combatId = ecs.createEntity();
      ecs.addComponent(combatId, {
        type: 'combatStats',
        attack: 10,
        defense: 5,
      } as any);

      const diagnostics = coordinator.getDiagnostics();
      expect(diagnostics.ecology.active).toBe(1);
      expect(diagnostics.combat.active).toBe(1);
    });
  });

  describe('Auto-save', () => {
    it('triggers save manager interaction when total time exceeds 60s', async () => {
      const mockSim = createMockSim();
      await coordinator.init(mockSim as any);

      const autosaveSpy = vi
        .spyOn(coordinator.saves, 'autosave')
        .mockResolvedValue(undefined);

      // Advance 59 seconds — should NOT trigger
      coordinator.update(59.0);
      expect(autosaveSpy).not.toHaveBeenCalled();

      // Advance 1 more second to hit 60s
      coordinator.update(1.0);
      expect(autosaveSpy).toHaveBeenCalledTimes(1);

      autosaveSpy.mockRestore();
    });
  });
});
