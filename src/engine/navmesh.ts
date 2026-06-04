import { PathNode } from '../types'

export interface NavMeshRegion {
  id: number
  cells: PathNode[]
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
  center: PathNode
  neighbors: number[]
}

export interface NavMesh {
  regions: NavMeshRegion[]
  cellToRegion: Map<string, number>
  gridWidth: number
  gridHeight: number
}

export interface NavMeshConfig {
  waterThreshold: number
  gridWidth: number
  gridHeight: number
}

const DEFAULT_NAV_CONFIG: NavMeshConfig = {
  waterThreshold: 0.15,
  gridWidth: 64,
  gridHeight: 64,
}

function cellKey(x: number, y: number): string {
  return x + ',' + y
}

/**
 * Generate a grid-based NavMesh from a terrain heightmap.
 *
 * Walkable tiles (height > waterThreshold) are grouped into connected
 * regions via flood-fill. Each region tracks its cells, bounding box,
 * centroid, and neighboring region IDs.
 *
 * @param terrain 2D array of height values in the range [0, 1]
 * @param config Optional overrides for grid size / water threshold
 * @returns NavMesh containing regions and a cell->region lookup map
 */
export function generateNavMesh(
  terrain: number[][],
  config: Partial<NavMeshConfig> = {}
): NavMesh {
  const cfg = { ...DEFAULT_NAV_CONFIG, ...config }
  const visited = new Set<string>()
  const regions: NavMeshRegion[] = []
  const cellToRegion = new Map<string, number>()

  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]

  for (let y = 0; y < cfg.gridHeight; y++) {
    for (let x = 0; x < cfg.gridWidth; x++) {
      const key = cellKey(x, y)
      if (visited.has(key)) continue

      const height = terrain[y]?.[x] ?? 0
      if (height <= cfg.waterThreshold) {
        visited.add(key)
        continue
      }

      // Flood-fill a new region
      const regionId = regions.length
      const cells: PathNode[] = []
      let minX = x, minY = y, maxX = x, maxY = y
      let sumX = 0, sumY = 0
      const queue: PathNode[] = [{ x, y }]
      visited.add(key)

      while (queue.length > 0) {
        const node = queue.shift()!
        cells.push(node)
        sumX += node.x
        sumY += node.y
        if (node.x < minX) minX = node.x
        if (node.x > maxX) maxX = node.x
        if (node.y < minY) minY = node.y
        if (node.y > maxY) maxY = node.y

        for (const [dx, dy] of dirs) {
          const nx = node.x + dx
          const ny = node.y + dy
          if (nx < 0 || nx >= cfg.gridWidth || ny < 0 || ny >= cfg.gridHeight) continue
          const nKey = cellKey(nx, ny)
          if (visited.has(nKey)) continue
          const nh = terrain[ny][nx]
          if (nh <= cfg.waterThreshold) {
            visited.add(nKey)
            continue
          }
          visited.add(nKey)
          queue.push({ x: nx, y: ny })
        }
      }

      const center: PathNode = {
        x: Math.round(sumX / cells.length),
        y: Math.round(sumY / cells.length),
      }

      regions.push({
        id: regionId,
        cells,
        bounds: { minX, minY, maxX, maxY },
        center,
        neighbors: [],
      })

      for (const c of cells) {
        cellToRegion.set(cellKey(c.x, c.y), regionId)
      }
    }
  }

  // Build neighbor graph
  const regionDirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]

  for (const region of regions) {
    const neighborSet = new Set<number>()
    for (const cell of region.cells) {
      for (const [dx, dy] of regionDirs) {
        const nx = cell.x + dx
        const ny = cell.y + dy
        const otherId = cellToRegion.get(cellKey(nx, ny))
        if (otherId !== undefined && otherId !== region.id) {
          neighborSet.add(otherId)
        }
      }
    }
    region.neighbors = Array.from(neighborSet)
  }

  return { regions, cellToRegion, gridWidth: cfg.gridWidth, gridHeight: cfg.gridHeight }
}

/** Get the region ID for a given tile, or undefined if unwalkable / out of bounds */
export function getRegionAt(mesh: NavMesh, x: number, y: number): number | undefined {
  return mesh.cellToRegion.get(cellKey(Math.floor(x), Math.floor(y)))
}

/** Test whether a tile is walkable according to the NavMesh */
export function isWalkable(mesh: NavMesh, x: number, y: number): boolean {
  return mesh.cellToRegion.has(cellKey(Math.floor(x), Math.floor(y)))
}

/** Find the closest walkable cell to the given coordinates */
export function findClosestWalkable(
  mesh: NavMesh,
  x: number,
  y: number,
  maxRadius: number = 5
): PathNode | undefined {
  const fx = Math.floor(x)
  const fy = Math.floor(y)
  if (isWalkable(mesh, fx, fy)) return { x: fx, y: fy }

  for (let r = 1; r <= maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
        const nx = fx + dx
        const ny = fy + dy
        if (isWalkable(mesh, nx, ny)) return { x: nx, y: ny }
      }
    }
  }
  return undefined
}

/** Manager that owns a NavMesh and can regenerate it when terrain changes */
export class NavMeshManager {
  private terrain: number[][]
  private config: NavMeshConfig
  private mesh: NavMesh | null = null

  constructor(terrain: number[][], config: Partial<NavMeshConfig> = {}) {
    this.terrain = terrain
    this.config = { ...DEFAULT_NAV_CONFIG, ...config }
    this.mesh = generateNavMesh(terrain, this.config)
  }

  /** Regenerate the mesh from new or updated terrain */
  public regenerate(terrain?: number[][]) {
    if (terrain) this.terrain = terrain
    this.mesh = generateNavMesh(this.terrain, this.config)
  }

  public getMesh(): NavMesh | null {
    return this.mesh
  }

  public getRegionAt(x: number, y: number): number | undefined {
    return this.mesh ? getRegionAt(this.mesh, x, y) : undefined
  }

  public isWalkable(x: number, y: number): boolean {
    return this.mesh ? isWalkable(this.mesh, x, y) : false
  }

  public findClosestWalkable(x: number, y: number, maxRadius: number = 5): PathNode | undefined {
    return this.mesh ? findClosestWalkable(this.mesh, x, y, maxRadius) : undefined
  }
}
