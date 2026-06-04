import { describe, it, expect, beforeEach } from 'vitest'
import { ECS } from '../ecs'
import { Position } from '../../types'
import {
  astar,
  lineOfSight,
  smoothPath,
  PathfindingManager,
  PathfinderConfig,
} from '../pathfinding'

describe('astar', () => {
  const config: Partial<PathfinderConfig> = {
    gridWidth: 8,
    gridHeight: 8,
    waterThreshold: 0.15,
    diagonalMovement: true,
  }

  function flatTerrain(value: number = 1): number[][] {
    return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => value))
  }

  it('finds a straight path on flat terrain', () => {
    const terrain = flatTerrain()
    const result = astar({ x: 0, y: 0 }, { x: 3, y: 0 }, terrain, new Set(), config)
    expect(result.success).toBe(true)
    expect(result.nodes.length).toBeGreaterThanOrEqual(2)
    expect(result.nodes[0]).toEqual({ x: 0, y: 0 })
    expect(result.nodes[result.nodes.length - 1]).toEqual({ x: 3, y: 0 })
  })

  it('finds a diagonal path', () => {
    const terrain = flatTerrain()
    const result = astar({ x: 0, y: 0 }, { x: 3, y: 3 }, terrain, new Set(), config)
    expect(result.success).toBe(true)
    expect(result.nodes[0]).toEqual({ x: 0, y: 0 })
    expect(result.nodes[result.nodes.length - 1]).toEqual({ x: 3, y: 3 })
  })

  it('returns failure for unreachable goals (water)', () => {
    const terrain = flatTerrain()
    terrain[3][3] = 0.0 // water
    const result = astar({ x: 0, y: 0 }, { x: 3, y: 3 }, terrain, new Set(), config)
    expect(result.success).toBe(false)
    expect(result.nodes).toEqual([])
  })

  it('avoids obstacles', () => {
    const terrain = flatTerrain()
    const obstacles = new Set(['2,0', '2,1', '2,2'])
    const result = astar({ x: 0, y: 0 }, { x: 4, y: 0 }, terrain, obstacles, config)
    expect(result.success).toBe(true)
    for (const node of result.nodes) {
      expect(obstacles.has(`${node.x},${node.y}`)).toBe(false)
    }
  })

  it('respects grid bounds for goals', () => {
    const terrain = flatTerrain()
    const result = astar({ x: 0, y: 0 }, { x: 10, y: 0 }, terrain, new Set(), config)
    expect(result.success).toBe(false)
  })

  it('respects elevation cost', () => {
    const terrain = flatTerrain(1)
    terrain[2][2] = 0.8 // high elevation
    const lowCostCfg: Partial<PathfinderConfig> = { ...config, elevationCostFactor: 0 }
    const highCostCfg: Partial<PathfinderConfig> = { ...config, elevationCostFactor: 10 }

    const lowCostResult = astar({ x: 0, y: 0 }, { x: 4, y: 4 }, terrain, new Set(), lowCostCfg)
    const highCostResult = astar({ x: 0, y: 0 }, { x: 4, y: 4 }, terrain, new Set(), highCostCfg)

    expect(lowCostResult.success).toBe(true)
    expect(highCostResult.success).toBe(true)
    expect(highCostResult.cost).toBeGreaterThan(lowCostResult.cost)
  })
})

describe('lineOfSight', () => {
  const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))

  it('returns true for clear line', () => {
    expect(lineOfSight({ x: 0, y: 0 }, { x: 5, y: 0 }, terrain, new Set())).toBe(true)
  })

  it('returns false when obstacle is in the way', () => {
    const obstacles = new Set(['3,0'])
    expect(lineOfSight({ x: 0, y: 0 }, { x: 5, y: 0 }, terrain, obstacles)).toBe(false)
  })

  it('returns false when water tile blocks', () => {
    const t = terrain.map((row) => [...row])
    t[2][2] = 0.0
    expect(lineOfSight({ x: 0, y: 0 }, { x: 5, y: 5 }, t, new Set())).toBe(false)
  })
})

describe('smoothPath', () => {
  const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))

  it('returns short path unchanged', () => {
    const path = [{ x: 0, y: 0 }, { x: 1, y: 1 }]
    expect(smoothPath(path, terrain, new Set())).toEqual(path)
  })

  it('cuts corners when line of sight exists', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]
    const smoothed = smoothPath(path, terrain, new Set())
    expect(smoothed.length).toBeLessThan(path.length)
    expect(smoothed[0]).toEqual({ x: 0, y: 0 })
    expect(smoothed[smoothed.length - 1]).toEqual({ x: 3, y: 0 })
  })
})

describe('PathfindingManager', () => {
  let ecs: ECS
  let terrain: number[][]
  let manager: PathfindingManager

  beforeEach(() => {
    ecs = new ECS()
    terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))
    manager = new PathfindingManager(ecs, terrain, { gridWidth: 8, gridHeight: 8 })
  })

  it('finds path with manager', () => {
    const result = manager.findPath({ x: 0, y: 0 }, { x: 4, y: 4 })
    expect(result.success).toBe(true)
    expect(result.nodes.length).toBeGreaterThanOrEqual(2)
  })

  it('adds obstacles from ECS structures', () => {
    const e1 = ecs.createEntity()
    ecs.addComponent(e1, { type: 'position', x: 2, y: 2, z: 0 } as Position)
    ecs.addComponent(e1, { type: 'structure', category: 'ALTAR', subType: 'stone', durability: 100, efficiency: 1 } as any)
    manager.updateObstacles()
    expect(manager.getObstacles().has('2,2')).toBe(true)
  })

  it('respects obstacles in path', () => {
    const e1 = ecs.createEntity()
    ecs.addComponent(e1, { type: 'position', x: 2, y: 0, z: 0 } as Position)
    ecs.addComponent(e1, { type: 'structure', category: 'ALTAR', subType: 'stone', durability: 100, efficiency: 1 } as any)
    manager.updateObstacles()
    const result = manager.findPath({ x: 0, y: 0 }, { x: 4, y: 0 })
    expect(result.success).toBe(true)
    for (const n of result.nodes) {
      expect(n.x === 2 && n.y === 0).toBe(false)
    }
  })

  it('updates terrain', () => {
    const newTerrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0.5))
    manager.setTerrain(newTerrain)
    const result = manager.findPath({ x: 0, y: 0 }, { x: 3, y: 3 })
    expect(result.success).toBe(true)
  })

  it('clears obstacles', () => {
    manager.addObstacle(2, 2)
    expect(manager.getObstacles().has('2,2')).toBe(true)
    manager.clearObstacles()
    expect(manager.getObstacles().has('2,2')).toBe(false)
  })

  it('smooths paths by default', () => {
    const result = manager.findPath({ x: 0, y: 0 }, { x: 5, y: 5 })
    expect(result.success).toBe(true)
    // smoothing should reduce node count for a straight diagonal
    expect(result.nodes.length).toBeLessThanOrEqual(6)
  })

  it('can disable smoothing', () => {
    const result = manager.findPath({ x: 0, y: 0 }, { x: 5, y: 5 }, false)
    expect(result.success).toBe(true)
  })
})
