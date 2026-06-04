import { ECS } from './ecs'
import { Entity, PathNode, PathResult, Position } from '../types'

export interface PathfinderConfig {
  gridWidth: number
  gridHeight: number
  waterThreshold: number
  elevationCostFactor: number
  diagonalMovement: boolean
  maxSearchNodes: number
}

const DEFAULT_CONFIG: PathfinderConfig = {
  gridWidth: 64,
  gridHeight: 64,
  waterThreshold: 0.15,
  elevationCostFactor: 2.0,
  diagonalMovement: true,
  maxSearchNodes: 4096,
}

/** Simple binary heap priority queue for A* open set */
class MinHeap<T> {
  private data: { item: T; key: number }[] = []

  push(item: T, key: number) {
    this.data.push({ item, key })
    this.siftUp(this.data.length - 1)
  }

  pop(): { item: T; key: number } | undefined {
    if (this.data.length === 0) return undefined
    const top = this.data[0]
    const end = this.data.pop()!
    if (this.data.length > 0) {
      this.data[0] = end
      this.siftDown(0)
    }
    return top
  }

  isEmpty(): boolean {
    return this.data.length === 0
  }

  private siftUp(i: number) {
    const item = this.data[i]
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.data[parent].key <= item.key) break
      this.data[i] = this.data[parent]
      i = parent
    }
    this.data[i] = item
  }

  private siftDown(i: number) {
    const item = this.data[i]
    const n = this.data.length
    const half = n >> 1
    while (i < half) {
      let child = (i << 1) + 1
      let right = child + 1
      if (right < n && this.data[right].key < this.data[child].key) {
        child = right
      }
      if (this.data[child].key >= item.key) break
      this.data[i] = this.data[child]
      i = child
    }
    this.data[i] = item
  }
}

/** Compute octile distance heuristic (consistent for grids with diagonal movement) */
function heuristic(a: PathNode, b: PathNode): number {
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  if (dx > dy) {
    return dx - dy + dy * 1.414
  }
  return dy - dx + dx * 1.414
}

function nodeKey(n: PathNode): string {
  return n.x + ',' + n.y
}

/**
 * Pure A* pathfinding on a terrain grid.
 * @param start Start tile
 * @param goal Goal tile
 * @param terrain 2D array of height values 0-1
 * @param obstacles Set of "x,y" strings blocked by dynamic obstacles
 * @param config Pathfinding parameters
 * @returns PathResult with node list and cost
 */
export function astar(
  start: PathNode,
  goal: PathNode,
  terrain: number[][],
  obstacles: Set<string>,
  config: Partial<PathfinderConfig> = {}
): PathResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // Bounds check
  if (
    goal.x < 0 || goal.x >= cfg.gridWidth ||
    goal.y < 0 || goal.y >= cfg.gridHeight
  ) {
    return { nodes: [], cost: 0, success: false }
  }

  const goalHeight = terrain[goal.y]?.[goal.x] ?? 0
  if (goalHeight <= cfg.waterThreshold) {
    return { nodes: [], cost: 0, success: false }
  }

  const open = new MinHeap<PathNode>()
  const closed = new Set<string>()
  const gScore = new Map<string, number>()
  const fScore = new Map<string, number>()
  const cameFrom = new Map<string, PathNode>()

  const sKey = nodeKey(start)
  open.push(start, heuristic(start, goal))
  gScore.set(sKey, 0)
  fScore.set(sKey, heuristic(start, goal))

  let nodesExplored = 0
  const dirs = cfg.diagonalMovement
    ? [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
    : [[0, 1], [0, -1], [1, 0], [-1, 0]]

  while (!open.isEmpty() && nodesExplored < cfg.maxSearchNodes) {
    const current = open.pop()!
    const cKey = nodeKey(current.item)

    if (closed.has(cKey)) continue
    closed.add(cKey)
    nodesExplored++

    if (cKey === nodeKey(goal)) {
      const path: PathNode[] = []
      let walk: PathNode | undefined = current.item
      while (walk) {
        path.unshift({ x: walk.x, y: walk.y })
        walk = cameFrom.get(nodeKey(walk))
      }
      return { nodes: path, cost: gScore.get(cKey) ?? 0, success: true }
    }

    for (const [dx, dy] of dirs) {
      const nx = current.item.x + dx
      const ny = current.item.y + dy
      if (nx < 0 || nx >= cfg.gridWidth || ny < 0 || ny >= cfg.gridHeight) continue

      const nKey = nx + ',' + ny
      if (closed.has(nKey)) continue

      const height = terrain[ny][nx]
      if (height <= cfg.waterThreshold) continue
      if (obstacles.has(nKey)) continue

      const isDiag = Math.abs(dx) === 1 && Math.abs(dy) === 1
      // Check corner cutting for diagonals
      if (isDiag) {
        const h1 = terrain[ny][current.item.x]
        const h2 = terrain[current.item.y][nx]
        if (h1 <= cfg.waterThreshold || h2 <= cfg.waterThreshold) continue
        const o1 = obstacles.has(current.item.x + ',' + ny)
        const o2 = obstacles.has(nx + ',' + current.item.y)
        if (o1 || o2) continue
      }

      const baseCost = isDiag ? 1.414 : 1.0
      const elevDiff = Math.abs(terrain[current.item.y][current.item.x] - height)
      const moveCost = baseCost + elevDiff * cfg.elevationCostFactor
      const tentativeG = (gScore.get(cKey) ?? Infinity) + moveCost
      const existingG = gScore.get(nKey) ?? Infinity

      if (tentativeG < existingG) {
        cameFrom.set(nKey, current.item)
        gScore.set(nKey, tentativeG)
        const f = tentativeG + heuristic({ x: nx, y: ny }, goal)
        fScore.set(nKey, f)
        open.push({ x: nx, y: ny }, f)
      }
    }
  }

  return { nodes: [], cost: 0, success: false }
}

/**
 * Line-of-sight test on the terrain grid using Bresenham-inspired sampling.
 * Returns true if the straight line from a to b is walkable.
 */
export function lineOfSight(
  a: PathNode,
  b: PathNode,
  terrain: number[][],
  obstacles: Set<string>,
  waterThreshold: number = DEFAULT_CONFIG.waterThreshold
): boolean {
  let x0 = a.x
  let y0 = a.y
  const x1 = b.x
  const y1 = b.y
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  while (true) {
    const key = x0 + ',' + y0
    if (obstacles.has(key)) return false
    if (terrain[y0]?.[x0] <= waterThreshold) return false

    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }

  return true
}

/**
 * Smooth a grid path by cutting corners where line-of-sight exists.
 * Uses the "string-pulling" / Funnel algorithm simplified to corner-cutting.
 */
export function smoothPath(
  path: PathNode[],
  terrain: number[][],
  obstacles: Set<string>,
  waterThreshold: number = DEFAULT_CONFIG.waterThreshold
): PathNode[] {
  if (path.length <= 2) return path

  const smoothed: PathNode[] = [path[0]]
  let current = 0

  while (current < path.length - 1) {
    let furthest = current + 1
    for (let i = current + 2; i < path.length; i++) {
      if (lineOfSight(path[current], path[i], terrain, obstacles, waterThreshold)) {
        furthest = i
      } else {
        break
      }
    }
    smoothed.push(path[furthest])
    current = furthest
  }

  return smoothed
}

/** Message format for pathfinding worker jobs */
interface PathJob {
  jobId: number
  start: PathNode
  goal: PathNode
  terrain: number[][]
  obstacles: string[]
  config: PathfinderConfig
}

/** Manager class that wraps pathfinding with obstacle awareness and optional worker offloading */
export class PathfindingManager {
  private ecs: ECS
  private terrain: number[][]
  private config: PathfinderConfig
  private obstacles: Set<string> = new Set()
  private worker: Worker | null = null
  private pendingJobs = new Map<number, (result: PathResult) => void>()
  private jobIdCounter = 0

  constructor(ecs: ECS, terrain: number[][], config: Partial<PathfinderConfig> = {}) {
    this.ecs = ecs
    this.terrain = terrain
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initWorker()
  }

  private initWorker() {
    try {
      const script = `
        ${MinHeap.toString()}
        ${heuristic.toString()}
        ${nodeKey.toString()}
        ${astar.toString()}

        self.onmessage = function(e) {
          const { jobId, start, goal, terrain, obstacles, config } = e.data
          const obs = new Set(obstacles)
          const result = astar(start, goal, terrain, obs, config)
          self.postMessage({ jobId, result })
        }
      `
      const blob = new Blob([script], { type: 'application/javascript' })
      this.worker = new Worker(URL.createObjectURL(blob), { type: 'module' })
      this.worker.onmessage = (e: MessageEvent) => {
        const { jobId, result } = e.data as { jobId: number; result: PathResult }
        const resolve = this.pendingJobs.get(jobId)
        if (resolve) {
          resolve(result)
          this.pendingJobs.delete(jobId)
        }
      }
    } catch {
      this.worker = null
    }
  }

  /** Update the internal terrain reference (e.g. after world modification) */
  public setTerrain(terrain: number[][]) {
    this.terrain = terrain
  }

  /**
   * Rebuild the dynamic obstacle set from ECS.
   * Structures are hard obstacles; other entities can be optionally included.
   * @param includeEntities If true, all entities with position become obstacles.
   */
  public updateObstacles(includeEntities: boolean = false) {
    this.obstacles.clear()
    const structures = this.ecs.getEntitiesWith(['structure', 'position'])
    for (const id of structures) {
      const pos = this.ecs.getComponent<Position>(id, 'position')
      if (pos) {
        this.obstacles.add(Math.floor(pos.x) + ',' + Math.floor(pos.y))
      }
    }
    if (includeEntities) {
      const all = this.ecs.getEntitiesWith(['position'])
      for (const id of all) {
        const pos = this.ecs.getComponent<Position>(id, 'position')
        if (pos) {
          this.obstacles.add(Math.floor(pos.x) + ',' + Math.floor(pos.y))
        }
      }
    }
  }

  /** Direct obstacle manipulation for fine-grained control */
  public addObstacle(x: number, y: number) {
    this.obstacles.add(Math.floor(x) + ',' + Math.floor(y))
  }

  public removeObstacle(x: number, y: number) {
    this.obstacles.delete(Math.floor(x) + ',' + Math.floor(y))
  }

  public clearObstacles() {
    this.obstacles.clear()
  }

  /** Get current obstacle set (defensive copy) */
  public getObstacles(): Set<string> {
    return new Set(this.obstacles)
  }

  /**
   * Find a path synchronously on the main thread.
   * Automatically applies smoothing if a path is found.
   */
  public findPath(start: PathNode, goal: PathNode, doSmooth: boolean = true): PathResult {
    const result = astar(start, goal, this.terrain, this.obstacles, this.config)
    if (result.success && doSmooth) {
      return {
        ...result,
        nodes: smoothPath(result.nodes, this.terrain, this.obstacles, this.config.waterThreshold),
      }
    }
    return result
  }

  /**
   * Find a path asynchronously via Web Worker.
   * Falls back to synchronous findPath if worker is unavailable.
   */
  public async findPathAsync(start: PathNode, goal: PathNode, doSmooth: boolean = true): Promise<PathResult> {
    if (!this.worker) {
      return this.findPath(start, goal, doSmooth)
    }

    const jobId = ++this.jobIdCounter
    return new Promise((resolve) => {
      this.pendingJobs.set(jobId, resolve)
      const payload: PathJob = {
        jobId,
        start,
        goal,
        terrain: this.terrain,
        obstacles: Array.from(this.obstacles),
        config: this.config,
      }
      this.worker!.postMessage(payload)
    }).then((result: PathResult) => {
      if (result.success && doSmooth) {
        return {
          ...result,
          nodes: smoothPath(result.nodes, this.terrain, this.obstacles, this.config.waterThreshold),
        }
      }
      return result
    })
  }

  /** Clean up the worker */
  public destroy() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingJobs.clear()
  }
}
