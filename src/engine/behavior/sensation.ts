import { ECS } from '../ecs'
import { Entity, Position, ScentMarker, SensationEvent, AgentMemoryEntry } from '../../types'

export interface SensationConfig {
  sightRange: number
  sightAngle: number
  hearingRange: number
  smellRange: number
  scentDecayRate: number
  memoryDecayRate: number
  memoryDuration: number
}

const DEFAULT_SENSATION_CONFIG: SensationConfig = {
  sightRange: 10,
  sightAngle: Math.PI / 3, // 60 degrees
  hearingRange: 8,
  smellRange: 6,
  scentDecayRate: 0.5,
  memoryDecayRate: 0.2,
  memoryDuration: 30,
}

/** Distance squared between two points */
function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

/** Normalize an angle to [-PI, PI] */
function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

/** Test if target is inside the forward-facing sight cone */
export function isInSightCone(
  observerX: number,
  observerY: number,
  facingX: number,
  facingY: number,
  targetX: number,
  targetY: number,
  range: number,
  angle: number
): boolean {
  const dSq = distSq(observerX, observerY, targetX, targetY)
  if (dSq > range * range) return false

  const dx = targetX - observerX
  const dy = targetY - observerY
  const toTarget = Math.atan2(dy, dx)
  const facing = Math.atan2(facingY - observerY, facingX - observerX)
  const diff = Math.abs(normalizeAngle(toTarget - facing))

  return diff <= angle / 2
}

/** Test if target is within hearing radius */
export function isInHearingRange(
  observerX: number,
  observerY: number,
  targetX: number,
  targetY: number,
  range: number
): boolean {
  return distSq(observerX, observerY, targetX, targetY) <= range * range
}

/** Test if target scent is within smell radius */
export function isInSmellRange(
  observerX: number,
  observerY: number,
  scentX: number,
  scentY: number,
  range: number
): boolean {
  return distSq(observerX, observerY, scentX, scentY) <= range * range
}

/**
 * SensationManager handles sight, hearing, smell, and memory for all agents.
 * It operates as a standalone system and reads entity positions from the ECS.
 */
export class SensationManager {
  private ecs: ECS
  private config: SensationConfig
  private scentMarkers: ScentMarker[] = []
  private memories = new Map<Entity, AgentMemoryEntry[]>()

  constructor(ecs: ECS, config: Partial<SensationConfig> = {}) {
    this.ecs = ecs
    this.config = { ...DEFAULT_SENSATION_CONFIG, ...config }
  }

  public setConfig(config: Partial<SensationConfig>) {
    this.config = { ...this.config, ...config }
  }

  /** Update all systems: decay scents, decay memories */
  public update(dt: number) {
    this.decayScents(dt)
    this.decayMemories(dt)
  }

  // === Scent / Smell ===

  /** Drop a scent marker at the given tile */
  public dropScent(x: number, y: number, type: ScentMarker['type'], intensity: number = 1.0, ownerId?: string) {
    this.scentMarkers.push({
      x: Math.floor(x),
      y: Math.floor(y),
      intensity,
      type,
      ownerId,
    })
  }

  public getScentMarkers(): ScentMarker[] {
    return this.scentMarkers
  }

  public clearScents() {
    this.scentMarkers = []
  }

  private decayScents(dt: number) {
    const rate = this.config.scentDecayRate * dt
    this.scentMarkers = this.scentMarkers.filter((s) => {
      s.intensity -= rate
      return s.intensity > 0
    })
  }

  /** Get scents that an entity can smell at its current position */
  public getSmelledScents(entityId: Entity): ScentMarker[] {
    const pos = this.ecs.getComponent<Position>(entityId, 'position')
    if (!pos) return []
    return this.scentMarkers.filter((s) =>
      isInSmellRange(pos.x, pos.y, s.x, s.y, this.config.smellRange)
    )
  }

  // === Sight ===

  /**
   * Perform a sight cone check for an observer entity.
   * Returns a list of sensed entities with SIGHT type events.
   * facingX/facingY default to the observer's position + velocity if not provided.
   */
  public sightCheck(
    observerId: Entity,
    facingX?: number,
    facingY?: number
  ): SensationEvent[] {
    const observerPos = this.ecs.getComponent<Position>(observerId, 'position')
    if (!observerPos) return []

    const fx = facingX ?? observerPos.x + 1
    const fy = facingY ?? observerPos.y

    const results: SensationEvent[] = []
    const all = this.ecs.getEntitiesWith(['position'])

    for (const targetId of all) {
      if (targetId === observerId) continue
      const tpos = this.ecs.getComponent<Position>(targetId, 'position')
      if (!tpos) continue

      if (
        isInSightCone(
          observerPos.x,
          observerPos.y,
          fx,
          fy,
          tpos.x,
          tpos.y,
          this.config.sightRange,
          this.config.sightAngle
        )
      ) {
        const threatLevel = this.computeThreatLevel(observerId, targetId)
        results.push({
          type: 'SIGHT',
          sourceId: targetId,
          sourceX: tpos.x,
          sourceY: tpos.y,
          threatLevel,
          timestamp: performance.now(),
        })
      }
    }

    return results
  }

  // === Hearing ===

  /**
   * Perform a hearing radius check for an observer entity.
   * Optionally filtered by `sourceTypes` component types (e.g. ['fauna']).
   */
  public hearingCheck(observerId: Entity, sourceTypes?: string[]): SensationEvent[] {
    const observerPos = this.ecs.getComponent<Position>(observerId, 'position')
    if (!observerPos) return []

    let candidates: Entity[]
    if (sourceTypes && sourceTypes.length > 0) {
      candidates = this.ecs.getEntitiesWith(sourceTypes)
    } else {
      candidates = this.ecs.getEntitiesWith(['position'])
    }

    const results: SensationEvent[] = []
    for (const targetId of candidates) {
      if (targetId === observerId) continue
      const tpos = this.ecs.getComponent<Position>(targetId, 'position')
      if (!tpos) continue
      if (
        isInHearingRange(
          observerPos.x,
          observerPos.y,
          tpos.x,
          tpos.y,
          this.config.hearingRange
        )
      ) {
        results.push({
          type: 'HEARING',
          sourceId: targetId,
          sourceX: tpos.x,
          sourceY: tpos.y,
          threatLevel: this.computeThreatLevel(observerId, targetId),
          timestamp: performance.now(),
        })
      }
    }
    return results
  }

  // === Smell ===

  /** Perform smell check combining scent markers within range */
  public smellCheck(observerId: Entity): SensationEvent[] {
    const pos = this.ecs.getComponent<Position>(observerId, 'position')
    if (!pos) return []

    const smelled = this.getSmelledScents(observerId)
    return smelled.map((s) => ({
      type: 'SMELL' as const,
      sourceId: s.ownerId ?? 'unknown',
      sourceX: s.x,
      sourceY: s.y,
      threatLevel: s.type === 'PREDATOR' ? 1.0 : 0.2,
      timestamp: performance.now(),
      data: { intensity: s.intensity, scentType: s.type },
    }))
  }

  // === Memory ===

  /** Store a memory for an entity, replacing an older memory of the same source if present */
  public addMemory(agentId: Entity, event: SensationEvent) {
    let list = this.memories.get(agentId)
    if (!list) {
      list = []
      this.memories.set(agentId, list)
    }

    const idx = list.findIndex((m) => m.event.sourceId === event.sourceId && m.event.type === event.type)
    const entry: AgentMemoryEntry = {
      event,
      confidence: 1.0,
      lastUpdated: performance.now(),
    }
    if (idx >= 0) {
      list[idx] = entry
    } else {
      list.push(entry)
    }
  }

  public getMemories(agentId: Entity): AgentMemoryEntry[] {
    return this.memories.get(agentId) ?? []
  }

  public clearMemories(agentId: Entity) {
    this.memories.delete(agentId)
  }

  public clearAllMemories() {
    this.memories.clear()
  }

  private decayMemories(dt: number) {
    const now = performance.now()
    for (const [agentId, list] of this.memories) {
      for (const entry of list) {
        entry.confidence -= this.config.memoryDecayRate * dt
        const age = (now - entry.lastUpdated) / 1000
        if (age > this.config.memoryDuration) {
          entry.confidence = 0
        }
      }
      const filtered = list.filter((m) => m.confidence > 0)
      if (filtered.length === 0) {
        this.memories.delete(agentId)
      } else {
        this.memories.set(agentId, filtered)
      }
    }
  }

  /** Run a full sensation tick: sight, hearing, smell, and auto-store into memory */
  public sensationTick(
    agentId: Entity,
    options: { doSight?: boolean; doHearing?: boolean; doSmell?: boolean; facingX?: number; facingY?: number } = {}
  ): SensationEvent[] {
    const all: SensationEvent[] = []
    if (options.doSight !== false) {
      all.push(...this.sightCheck(agentId, options.facingX, options.facingY))
    }
    if (options.doHearing !== false) {
      all.push(...this.hearingCheck(agentId))
    }
    if (options.doSmell !== false) {
      all.push(...this.smellCheck(agentId))
    }
    for (const ev of all) {
      this.addMemory(agentId, ev)
    }
    return all
  }

  /** Rough threat estimation based on component differences */
  private computeThreatLevel(observerId: Entity, targetId: Entity): number {
    const fauna = this.ecs.getComponent(targetId, 'fauna')
    if (fauna) {
      return (fauna as any).aggressiveness / 100
    }
    const structure = this.ecs.getComponent(targetId, 'structure')
    if (structure) {
      return 0.1
    }
    return 0.0
  }
}
