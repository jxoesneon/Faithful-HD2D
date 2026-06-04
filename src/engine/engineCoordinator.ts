import type { ECS } from './ecs';
import { SimulationEngine } from './simulation';

// World
import { DayNightManager } from './world/daynight';
import { SeasonManager } from './world/seasons';
import { WeatherManager } from './world/weather';
import { EcologyManager } from './world/ecology';
import { DiseaseManager } from './world/disease';
import { WindSystem } from './world/wind';
import { VegetationAnimator } from './world/vegetation';

// Combat
import { CombatManager } from './combat/resolution';
import { MoraleManager } from './combat/morale';

// Status
import { StatusEffectManager } from './status/effects';
import { TraitManager } from './status/traits';

// Faith
import { FaithFogManager } from './faith/fog';
import { ShrineManager } from './faith/shrines';
import { PietyManager } from './faith/piety';
import { DogmaManager } from './faith/dogma';
import { MissionaryManager } from './faith/missionary';

// Economy
import { ResourceManager } from './economy/resources';
import { GatheringManager } from './economy/gathering';
import { CraftingManager } from './economy/crafting';
import { TechTreeManager } from './economy/techTree';
import { PopulationManager } from './economy/population';
import { InventoryManager } from './economy/inventory';

// Macro
import { TradeManager } from './macro/trade';
import { SettlementManager } from './macro/settlements';
import { BorderManager } from './macro/borders';

// AI / Behavior
import { PathfindingManager } from './pathfinding';
import { Blackboard } from './behavior/blackboard';
import { CombatAIManager } from './ai/combatAI';
import { SquadManager } from './ai/squad';
import { BehaviorTree } from './behavior/tree';
import { createWolfTree, createStagTree, createVillagerTree } from './behavior/presets';
import { GOAPPlanner } from './behavior/goap';
import { SensationManager } from './behavior/sensation';
import type { PathNode } from '../types';

// Quest & Story
import { QuestEngine } from './quest/quests';
import { EventEngine } from './quest/events';
import { AchievementEngine } from './achievements';
import { DialogueManager } from './story/dialogue';
import { WaypointManager } from './story/waypoints';
import { TitleManager } from './story/titles';

// Persistence
import { SaveManager } from './persistence/saveManager';
import { ReplayManager } from './persistence/replaySystem';

// Physics
import { CollisionManager } from './physics/collision';
import { RigidBodyManager } from './physics/rigidbody';

// Input
import { InputManager, DEFAULT_ACTIONS } from './input/keyboard';

// VFX & Rendering Support
import { ParticleEngine } from './vfx/particles';
import { PostProcessManager } from './postprocessing/postProcess';
import { ShadowMapManager } from './shadows/shadows';
import { WaterRenderer } from './water/water';
import { PlanetaryView } from './planetary/planetary';
import { StructureAnimator } from './structures/animations';
import { TerraformManager } from './terraform/terraform';

import type { WorldStateSnapshot } from '../types';

export class EngineCoordinator {
  public ecs: ECS;
  public sim: SimulationEngine | null = null;

  // World
  public dayNight: DayNightManager;
  public season: SeasonManager;
  public weather: WeatherManager;
  public ecology: EcologyManager;
  public disease: DiseaseManager;
  public wind: WindSystem;
  public vegetation: VegetationAnimator;

  // Combat
  public combat: CombatManager;
  public morale: MoraleManager;

  // Status
  public statusEffects: StatusEffectManager;
  public traits: TraitManager;

  // Faith
  public faithFog: FaithFogManager;
  public shrines: ShrineManager;
  public piety: PietyManager;
  public dogma: DogmaManager;
  public missionary: MissionaryManager;

  // Economy
  public resources: ResourceManager;
  public gathering: GatheringManager;
  public crafting: CraftingManager;
  public techTree: TechTreeManager;
  public population: PopulationManager;
  public inventory: InventoryManager;

  // Macro
  public trade: TradeManager;
  public settlements: SettlementManager;
  public borders: BorderManager;

  // AI
  public pathfinding: PathfindingManager | null = null;
  public blackboard: Blackboard;
  public combatAI: CombatAIManager;
  public squadManager: SquadManager;
  public goapPlanner: GOAPPlanner;
  public sensation: SensationManager;

  // Quest & Story
  public quests: QuestEngine;
  public events: EventEngine;
  public achievements: AchievementEngine;
  public dialogue: DialogueManager;
  public waypoints: WaypointManager;
  public titles: TitleManager;

  // Persistence
  public saves: SaveManager;
  public replay: ReplayManager;

  // Physics
  public collision: CollisionManager;
  public rigidBody: RigidBodyManager;

  // Input
  public input: InputManager;

  // VFX / Rendering Support
  public particles: ParticleEngine;
  public postProcess: PostProcessManager;
  public shadows: ShadowMapManager;
  public water: WaterRenderer;
  public planetary: PlanetaryView;
  public structures: StructureAnimator;
  public terraform: TerraformManager | null = null;

  private initialized = false;
  private totalTime = 0;
  private behaviorTrees = new Map<string, BehaviorTree>();

  constructor(ecs: ECS) {
    this.ecs = ecs;

    // World
    this.dayNight = new DayNightManager(ecs);
    this.season = new SeasonManager(ecs);
    this.weather = new WeatherManager(ecs);
    this.ecology = new EcologyManager(ecs);
    this.disease = new DiseaseManager(ecs);
    this.wind = new WindSystem();
    this.vegetation = new VegetationAnimator(ecs, this.wind);

    // Combat
    this.combat = new CombatManager(ecs);
    this.morale = new MoraleManager(ecs);

    // Status
    this.statusEffects = new StatusEffectManager(ecs);
    this.traits = new TraitManager();

    // Faith
    this.faithFog = new FaithFogManager();
    this.shrines = new ShrineManager();
    this.piety = new PietyManager();
    this.dogma = new DogmaManager();
    this.missionary = new MissionaryManager();

    // Economy
    this.resources = new ResourceManager(ecs);
    this.gathering = new GatheringManager(ecs);
    this.crafting = new CraftingManager(ecs);
    this.techTree = new TechTreeManager(ecs);
    this.population = new PopulationManager(ecs);
    this.inventory = new InventoryManager(ecs);

    // Macro
    this.trade = new TradeManager(ecs);
    this.settlements = new SettlementManager(ecs);
    this.borders = new BorderManager(ecs);

    // AI
    this.blackboard = new Blackboard('coordinator');
    this.combatAI = new CombatAIManager(ecs);
    this.squadManager = new SquadManager(ecs);
    this.goapPlanner = new GOAPPlanner();
    this.sensation = new SensationManager(ecs);

    // Quest & Story
    this.quests = new QuestEngine();
    this.events = new EventEngine();
    this.achievements = new AchievementEngine();
    this.dialogue = new DialogueManager(ecs);
    this.waypoints = new WaypointManager();
    this.titles = new TitleManager(ecs);

    // Persistence
    this.saves = new SaveManager({
      getState: () => ({ ecsState: this.ecs.exportState(), simulationState: {} as any }),
      loadState: (state) => { if (state.ecsState) this.ecs.importState(state.ecsState); },
    });
    this.replay = new ReplayManager({
      getState: () => this.exportSnapshot(),
      setState: (s: any) => this.importSnapshot(s),
      getRngSeed: () => 42,
      setRngSeed: () => {},
    });

    // Physics
    this.collision = new CollisionManager(ecs);
    this.rigidBody = new RigidBodyManager(ecs);

    // Input
    this.input = new InputManager(DEFAULT_ACTIONS);

    // VFX / Rendering
    this.particles = new ParticleEngine();
    this.postProcess = new PostProcessManager();
    this.shadows = new ShadowMapManager();
    this.water = new WaterRenderer();
    this.planetary = new PlanetaryView();
    this.structures = new StructureAnimator();
  }

  /** Initialize all systems that need terrain data (call after SimulationEngine is ready). */
  async init(sim: SimulationEngine): Promise<void> {
    this.sim = sim;
    const terrain = sim.getTerrain();

    // Initialize pathfinding and terraform with terrain
    this.pathfinding = new PathfindingManager(this.ecs, terrain);
    this.terraform = new TerraformManager(terrain);

    this.initialized = true;
    console.log('[EngineCoordinator] All systems initialized. Terrain size:', terrain.length);
  }

  /** Main update loop — tick all systems. */
  update(dt: number): void {
    if (!this.initialized) return;
    this.totalTime += dt;

    const worldState = this.buildWorldState();

    // World simulation
    this.dayNight.update(dt);
    // SeasonManager has no update() — state is derived from dayNight
    this.weather.update(dt);
    this.ecology.update(dt);
    this.disease.update(dt);
    this.wind.update(dt);
    this.vegetation.update(dt);

    // Combat & status (combat manager uses updatePhases/updateCooldowns)
    this.combat.updatePhases(dt);
    this.combat.updateCooldowns(dt);
    (this.morale as any).tick?.(dt);

    // Faith (shrines/piety/missionary use tick, not update)
    (this.shrines as any).tick?.(dt, this.ecs);
    (this.piety as any).tick?.(dt, this.ecs);
    (this.missionary as any).tick?.(dt, this.ecs);

    // Economy
    this.crafting.update(dt);
    this.population.update(dt);
    this.trade.update(dt);
    this.settlements.update();
    this.borders.update();

    // AI Systems
    this.updateCombatAI(dt);
    this.squadManager.updateCoordinatedMovement();
    this.updatePathfinding();
    this.updateBehaviorTrees();
    this.updateGOAP();
    this.updateSensation(dt);

    // Quest & story
    this.quests.update(dt, worldState);
    this.events.update(dt);
    this.achievements.update(worldState);

    // Physics
    this.collision.update();
    this.rigidBody.update(dt);

    // Input
    this.input.pollGamepad?.(dt);

    // VFX
    this.particles.update(dt);
    this.water.update(dt);
    this.structures.update(dt);
    // TerraformManager has no update() — it's tool-driven

    // Auto-save every 60 seconds of game time
    if (Math.floor(this.totalTime) % 60 === 0 && Math.floor(this.totalTime) > 0) {
      this.saves.autosave?.();
    }
  }

  /** Build a world state snapshot for achievements and external systems. */
  private buildWorldState(): WorldStateSnapshot {
    const societies = this.ecs.getEntitiesWith(['society']);
    const structures = this.ecs.getEntitiesWith(['structure']);
    const floras = this.ecs.getEntitiesWith(['flora']);
    const faunas = this.ecs.getEntitiesWith(['fauna']);
    return {
      population: societies.length,
      tribeCount: societies.length,
      averageHappiness: 50,
      averageTech: 1.0,
      weather: this.sim?.weather ?? 'CLEAR',
      devotion: this.sim?.totalDevotion ?? 0,
      totalStructures: structures.length,
      totalFlora: floras.length,
      totalFauna: faunas.length,
      conflictsActive: 0,
      timePlayed: this.totalTime,
    };
  }

  /** Export a full snapshot for save/replay. */
  exportSnapshot(): any {
    return {
      ecs: this.ecs.exportState(),
      timestamp: Date.now(),
    };
  }

  /** Import a full snapshot. */
  importSnapshot(snapshot: any): void {
    if (snapshot.ecs) this.ecs.importState(snapshot.ecs);
  }

  /** Get a diagnostic report of all systems. */
  getDiagnostics(): Record<string, { active: number; status: string }> {
    return {
      dayNight: { active: 1, status: 'running' },
      season: { active: 1, status: 'running' },
      weather: { active: 1, status: 'running' },
      ecology: { active: this.ecs.getEntitiesWith(['flora']).length, status: 'running' },
      disease: { active: this.ecs.getEntitiesWith(['disease']).length, status: 'running' },
      wind: { active: this.wind.getActiveGusts?.().length ?? 0, status: 'running' },
      combat: { active: this.ecs.getEntitiesWith(['combatStats']).length, status: 'running' },
      faithFog: { active: 1, status: 'running' },
      shrines: { active: this.ecs.getEntitiesWith(['shrineStatus']).length, status: 'running' },
      resources: { active: this.ecs.getEntitiesWith(['resourceStorage']).length, status: 'running' },
      gathering: { active: this.ecs.getEntitiesWith(['gatheringTask']).length, status: 'running' },
      crafting: { active: this.ecs.getEntitiesWith(['craftingQueue']).length, status: 'running' },
      techTree: { active: this.ecs.getEntitiesWith(['techProgress']).length, status: 'running' },
      population: { active: this.ecs.getEntitiesWith(['populationData']).length, status: 'running' },
      trade: { active: this.ecs.getEntitiesWith(['market']).length, status: 'running' },
      settlements: { active: this.ecs.getEntitiesWith(['settlement']).length, status: 'running' },
      borders: { active: this.ecs.getEntitiesWith(['border']).length, status: 'running' },
      quests: { active: (this.quests as any).activeQuests?.length ?? 0, status: 'running' },
      achievements: { active: (this.achievements as any).unlocked?.size ?? 0, status: 'running' },
      collision: { active: this.ecs.getEntitiesWith(['aabb']).length, status: 'running' },
      rigidBody: { active: this.ecs.getEntitiesWith(['rigidBody']).length, status: 'running' },
      particles: { active: (this.particles as any).emitters?.length ?? 0, status: 'running' },
      water: { active: 1, status: 'running' },
      structures: { active: 1, status: 'running' },
      input: { active: 1, status: 'running' },
    };
  }

  // ============================================================================
  // AI Update Helpers
  // ============================================================================

  /** Auto-register combat entities and tick CombatAIManager */
  private updateCombatAI(dt: number): void {
    const combatEntities = this.ecs.getEntitiesWith(['combatStats']);
    for (const entity of combatEntities) {
      if (!this.combatAI.getEntityState(entity)) {
        this.combatAI.registerEntity(entity);
      }
    }

    const enemiesByEntity = this.buildEnemiesMap(combatEntities);
    this.combatAI.tick(dt, this.totalTime, enemiesByEntity);
  }

  /** Build enemy map based on allegiance or default to all others */
  private buildEnemiesMap(entities: string[]): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const entity of entities) {
      const allegiance = this.ecs.getComponent<{ type: 'allegiance'; enemies: string[] }>(entity, 'allegiance');
      if (allegiance && allegiance.enemies.length > 0) {
        const validEnemies = allegiance.enemies.filter((e) => entities.includes(e));
        map.set(entity, validEnemies.length > 0 ? validEnemies : entities.filter((e) => e !== entity));
      } else {
        map.set(entity, entities.filter((e) => e !== entity));
      }
    }
    return map;
  }

  /** Update path components for entities with movement + targetPosition */
  private updatePathfinding(): void {
    if (!this.pathfinding) return;
    this.pathfinding.updateObstacles();

    const entities = this.ecs.getEntitiesWith(['movement', 'targetPosition']);
    for (const entity of entities) {
      const pos = this.ecs.getComponent<{ type: 'position'; x: number; y: number }>(entity, 'position');
      const target = this.ecs.getComponent<{ type: 'targetPosition'; x: number; y: number }>(entity, 'targetPosition');
      if (!pos || !target) continue;

      const result = this.pathfinding.findPath(
        { x: Math.floor(pos.x), y: Math.floor(pos.y) },
        { x: Math.floor(target.x), y: Math.floor(target.y) }
      );

      this.ecs.addComponent(entity, {
        type: 'path',
        nodes: result.nodes,
        cost: result.cost,
        success: result.success,
      });
    }
  }

  /** Tick behavior trees for entities with behaviorType component */
  private updateBehaviorTrees(): void {
    if (!this.pathfinding || !this.sensation) return;

    const entities = this.ecs.getEntitiesWith(['behaviorType']);
    const activeSet = new Set(entities);

    // Clean up trees for removed entities
    for (const [entity] of this.behaviorTrees) {
      if (!activeSet.has(entity)) {
        this.behaviorTrees.delete(entity);
      }
    }

    for (const entity of entities) {
      const btComp = this.ecs.getComponent<{ type: 'behaviorType'; behaviorType: 'wolf' | 'stag' | 'villager' }>(entity, 'behaviorType');
      if (!btComp) continue;

      let tree = this.behaviorTrees.get(entity);
      if (!tree) {
        const root =
          btComp.behaviorType === 'wolf'
            ? createWolfTree(this.ecs, this.pathfinding, this.sensation)
            : btComp.behaviorType === 'stag'
            ? createStagTree(this.ecs, this.pathfinding, this.sensation)
            : createVillagerTree(this.ecs, this.pathfinding, this.sensation);
        tree = new BehaviorTree(entity, root);
        this.behaviorTrees.set(entity, tree);
      }
      tree.tick();
    }
  }

  /** Plan and execute GOAP for entities with goapGoal component */
  private updateGOAP(): void {
    const entities = this.ecs.getEntitiesWith(['goapGoal']);
    for (const entity of entities) {
      const goalComp = this.ecs.getComponent<{ type: 'goapGoal'; goalState: Record<string, any>; actionNames: string[]; currentPlan?: { actions: string[]; cost: number; success: boolean }; actionIndex: number }>(entity, 'goapGoal');
      if (!goalComp) continue;

      // Derive a simple start state from entity components
      const startState: Record<string, any> = { entity };
      const pos = this.ecs.getComponent(entity, 'position');
      if (pos) {
        startState.posX = (pos as any).x;
        startState.posY = (pos as any).y;
      }
      const healthComp = this.ecs.getComponent(entity, 'biology') ?? this.ecs.getComponent(entity, 'fauna');
      if (healthComp) {
        startState.health = (healthComp as any).health ?? 100;
      }

      // Filter planner actions by the entity's allowed action names
      const allActions = this.goapPlanner.getActions();
      const available = allActions.filter((a) => goalComp.actionNames.includes(a.name));

      const plan = this.goapPlanner.plan(startState, goalComp.goalState, 256);

      if (plan.success && plan.actions.length > 0) {
        const actionIndex = goalComp.actionIndex ?? 0;
        if (actionIndex < plan.actions.length) {
          // Advance action execution
          this.ecs.addComponent(entity, {
            ...goalComp,
            currentPlan: { actions: plan.actions.map((a) => a.name), cost: plan.cost, success: plan.success },
            actionIndex: actionIndex + 1,
          });
        } else {
          // Plan finished — reset
          this.ecs.addComponent(entity, {
            ...goalComp,
            currentPlan: undefined,
            actionIndex: 0,
          });
        }
      } else {
        this.ecs.addComponent(entity, {
          ...goalComp,
          currentPlan: undefined,
          actionIndex: 0,
        });
      }
    }
  }

  /** Update sensation system and run sensation ticks for entities with sensation component */
  private updateSensation(dt: number): void {
    this.sensation.update(dt);
    const entities = this.ecs.getEntitiesWith(['sensation']);
    for (const entity of entities) {
      this.sensation.sensationTick(entity);
    }
  }
}
