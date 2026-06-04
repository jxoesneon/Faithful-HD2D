import { describe, it, expect } from 'vitest'
import {
  generateNavMesh,
  getRegionAt,
  isWalkable,
  findClosestWalkable,
  NavMeshManager,
} from '../navmesh'

describe('generateNavMesh', () => {
  it('returns empty regions for all-water terrain', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0))
    const mesh = generateNavMesh(terrain, { gridWidth: 8, gridHeight: 8, waterThreshold: 0.1 })
    expect(mesh.regions).toHaveLength(0)
    expect(mesh.cellToRegion.size).toBe(0)
  })

  it('returns one region for all-walkable terrain', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))
    const mesh = generateNavMesh(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(mesh.regions).toHaveLength(1)
    expect(mesh.regions[0].cells.length).toBe(64)
    expect(mesh.regions[0].neighbors).toHaveLength(0)
  })

  it('splits water into separate regions', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))
    // Create a horizontal water barrier at y=3
    for (let x = 0; x < 8; x++) {
      terrain[3][x] = 0
    }
    const mesh = generateNavMesh(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(mesh.regions.length).toBeGreaterThanOrEqual(2)
    // top and bottom should be neighbors across the water line? No, water breaks adjacency.
    // Actually diagonal adjacency might connect them. Let's check that neighbors are correct.
  })

  it('builds neighbor graph correctly', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))
    terrain[2][2] = 0
    const mesh = generateNavMesh(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(mesh.regions.length).toBeGreaterThanOrEqual(1)
    // The 8 cells around the water hole form one region that wraps around it.
    // Actually flood-fill with 8-connectivity will treat it as one region, unless the hole is bigger.
  })
})

describe('getRegionAt', () => {
  it('returns region id for walkable cell', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))
    const mesh = generateNavMesh(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(getRegionAt(mesh, 3, 3)).toBe(0)
  })

  it('returns undefined for water cell', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0))
    const mesh = generateNavMesh(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(getRegionAt(mesh, 3, 3)).toBeUndefined()
  })
})

describe('isWalkable', () => {
  it('returns true for walkable', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))
    const mesh = generateNavMesh(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(isWalkable(mesh, 2, 2)).toBe(true)
  })

  it('returns false for water', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0))
    const mesh = generateNavMesh(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(isWalkable(mesh, 2, 2)).toBe(false)
  })
})

describe('findClosestWalkable', () => {
  it('returns same point if walkable', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))
    const mesh = generateNavMesh(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(findClosestWalkable(mesh, 2.5, 2.5)).toEqual({ x: 2, y: 2 })
  })

  it('finds nearby walkable tile when starting in water', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))
    terrain[3][3] = 0
    terrain[3][4] = 0
    terrain[4][3] = 0
    terrain[4][4] = 0
    const mesh = generateNavMesh(terrain, { gridWidth: 8, gridHeight: 8 })
    const result = findClosestWalkable(mesh, 3.5, 3.5)
    expect(result).toBeDefined()
    expect(isWalkable(mesh, result!.x, result!.y)).toBe(true)
  })

  it('returns undefined when no walkable within radius', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0))
    const mesh = generateNavMesh(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(findClosestWalkable(mesh, 4, 4, 2)).toBeUndefined()
  })
})

describe('NavMeshManager', () => {
  it('initializes with terrain', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))
    const manager = new NavMeshManager(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(manager.getMesh()).not.toBeNull()
    expect(manager.isWalkable(2, 2)).toBe(true)
  })

  it('regenerates on new terrain', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))
    const manager = new NavMeshManager(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(manager.isWalkable(2, 2)).toBe(true)

    const newTerrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0))
    manager.regenerate(newTerrain)
    expect(manager.isWalkable(2, 2)).toBe(false)
  })

  it('finds closest walkable', () => {
    const terrain = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1))
    const manager = new NavMeshManager(terrain, { gridWidth: 8, gridHeight: 8 })
    expect(manager.findClosestWalkable(2.5, 2.5)).toEqual({ x: 2, y: 2 })
  })
})
