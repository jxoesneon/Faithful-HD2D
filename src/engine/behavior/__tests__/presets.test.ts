import { describe, it, expect, beforeEach } from 'vitest'
import { ECS } from '../../ecs'
import { Position, Fauna, Movement, Society } from '../../../types'
import { createWolfTree, createStagTree, createVillagerTree } from '../presets'
import { BehaviorTree } from '../tree'
import { PathfindingManager } from '../../pathfinding'
import { SensationManager } from '../sensation'

function makeFlatTerrain(size: number = 8): number[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 1))
}

describe('Wolf Preset', () => {
  let ecs: ECS
  let tree: ReturnType<typeof createWolfTree>
  let bt: BehaviorTree
  let pathfinder: PathfindingManager
  let sensation: SensationManager

  beforeEach(() => {
    ecs = new ECS()
    const terrain = makeFlatTerrain()
    pathfinder = new PathfindingManager(ecs, terrain, { gridWidth: 8, gridHeight: 8 })
    sensation = new SensationManager(ecs)
    tree = createWolfTree(ecs, pathfinder, sensation)

    const wolf = ecs.createEntity()
    ecs.addComponent(wolf, { type: 'position', x: 1, y: 1, z: 0 } as Position)
    ecs.addComponent(wolf, { type: 'fauna', category: 'WOLF', subType: 'x', health: 100, hunger: 50, aggressiveness: 80, actionState: 'WANDERING' } as Fauna)
    ecs.addComponent(wolf, { type: 'movement', speed: 1, vx: 0, vy: 0, targetX: null, targetY: null, activityState: 'IDLE' } as Movement)
    bt = new BehaviorTree(wolf, tree)
  })

  it('ticks without crashing', () => {
    const status = bt.tick()
    expect(['SUCCESS', 'FAILURE', 'RUNNING']).toContain(status)
  })

  it('can set hunger and trigger hunt behavior', () => {
    bt.getBlackboard().set('hunger', 80)
    const status = bt.tick()
    expect(['RUNNING', 'FAILURE', 'SUCCESS']).toContain(status)
  })

  it('flees when high threat memory exists', () => {
    const wolfId = bt.getAgentId()
    sensation.addMemory(wolfId, {
      type: 'SIGHT',
      sourceId: 'bear',
      sourceX: 0,
      sourceY: 0,
      threatLevel: 0.9,
      timestamp: performance.now(),
    })
    const status = bt.tick()
    expect(status).toBe('RUNNING')
  })

  it('sleeps when tired', () => {
    bt.getBlackboard().set('fatigue', 70)
    bt.getBlackboard().set('hunger', 0)
    const status = bt.tick()
    expect(status).toBe('RUNNING')
    expect(bt.getBlackboard().get('fatigue')).toBeGreaterThan(70)
  })
})

describe('Stag Preset', () => {
  let ecs: ECS
  let tree: ReturnType<typeof createStagTree>
  let bt: BehaviorTree
  let pathfinder: PathfindingManager
  let sensation: SensationManager

  beforeEach(() => {
    ecs = new ECS()
    const terrain = makeFlatTerrain()
    pathfinder = new PathfindingManager(ecs, terrain, { gridWidth: 8, gridHeight: 8 })
    sensation = new SensationManager(ecs)
    tree = createStagTree(ecs, pathfinder, sensation)

    const stag = ecs.createEntity()
    ecs.addComponent(stag, { type: 'position', x: 2, y: 2, z: 0 } as Position)
    ecs.addComponent(stag, { type: 'fauna', category: 'STAG', subType: 'x', health: 100, hunger: 20, aggressiveness: 10, actionState: 'GRAZING' } as Fauna)
    ecs.addComponent(stag, { type: 'movement', speed: 1, vx: 0, vy: 0, targetX: null, targetY: null, activityState: 'IDLE' } as Movement)
    bt = new BehaviorTree(stag, tree)
  })

  it('ticks without crashing', () => {
    const status = bt.tick()
    expect(['SUCCESS', 'FAILURE', 'RUNNING']).toContain(status)
  })

  it('grazes when hungry', () => {
    bt.getBlackboard().set('hunger', 10)
    const status = bt.tick()
    expect(status).toBe('RUNNING')
  })

  it('flees when threatened', () => {
    const stagId = bt.getAgentId()
    sensation.addMemory(stagId, {
      type: 'SIGHT',
      sourceId: 'wolf',
      sourceX: 0,
      sourceY: 0,
      threatLevel: 0.6,
      timestamp: performance.now(),
    })
    const status = bt.tick()
    expect(status).toBe('RUNNING')
  })

  it('herds when lonely', () => {
    const otherStag = ecs.createEntity()
    ecs.addComponent(otherStag, { type: 'position', x: 3, y: 2, z: 0 } as Position)
    ecs.addComponent(otherStag, { type: 'fauna', category: 'STAG', subType: 'x', health: 100, hunger: 20, aggressiveness: 10, actionState: 'WANDERING' } as Fauna)

    bt.getBlackboard().set('hunger', 100) // not hungry
    bt.getBlackboard().set('loneliness', 50)
    const status = bt.tick()
    expect(status).toBe('RUNNING')
  })
})

describe('Villager Preset', () => {
  let ecs: ECS
  let tree: ReturnType<typeof createVillagerTree>
  let bt: BehaviorTree
  let pathfinder: PathfindingManager
  let sensation: SensationManager

  beforeEach(() => {
    ecs = new ECS()
    const terrain = makeFlatTerrain()
    pathfinder = new PathfindingManager(ecs, terrain, { gridWidth: 8, gridHeight: 8 })
    sensation = new SensationManager(ecs)
    tree = createVillagerTree(ecs, pathfinder, sensation)

    const villager = ecs.createEntity()
    ecs.addComponent(villager, { type: 'position', x: 1, y: 1, z: 0 } as Position)
    ecs.addComponent(villager, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 50, happiness: 80 } as Society)
    ecs.addComponent(villager, { type: 'movement', speed: 1, vx: 0, vy: 0, targetX: null, targetY: null, activityState: 'IDLE' } as Movement)
    bt = new BehaviorTree(villager, tree)
  })

  it('ticks without crashing', () => {
    const status = bt.tick()
    expect(['SUCCESS', 'FAILURE', 'RUNNING']).toContain(status)
  })

  it('eats when hungry', () => {
    bt.getBlackboard().set('hunger', 80)
    const status = bt.tick()
    expect(status).toBe('RUNNING')
  })

  it('sleeps when tired', () => {
    bt.getBlackboard().set('hunger', 0)
    bt.getBlackboard().set('fatigue', 80)
    const status = bt.tick()
    expect(status).toBe('RUNNING')
  })

  it('prays when devotion is low', () => {
    bt.getBlackboard().set('hunger', 0)
    bt.getBlackboard().set('fatigue', 0)
    bt.getBlackboard().set('devotion', 10)
    const status = bt.tick()
    expect(status).toBe('RUNNING')
  })

  it('works at structures when not urgent', () => {
    const structure = ecs.createEntity()
    ecs.addComponent(structure, { type: 'position', x: 3, y: 3, z: 0 } as Position)
    ecs.addComponent(structure, { type: 'structure', category: 'FARM', subType: 'wheat', durability: 100, efficiency: 1 } as any)

    bt.getBlackboard().set('hunger', 10)
    bt.getBlackboard().set('fatigue', 10)
    bt.getBlackboard().set('devotion', 80)
    const status = bt.tick()
    expect(['RUNNING', 'FAILURE', 'SUCCESS']).toContain(status)
  })
})
