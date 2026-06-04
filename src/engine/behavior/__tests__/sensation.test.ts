import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ECS } from '../../ecs'
import { Position } from '../../../types'
import {
  SensationManager,
  isInSightCone,
  isInHearingRange,
  isInSmellRange,
} from '../sensation'

describe('isInSightCone', () => {
  it('detects target directly ahead', () => {
    expect(isInSightCone(0, 0, 5, 0, 3, 0, 10, Math.PI / 2)).toBe(true)
  })

  it('rejects target behind observer', () => {
    expect(isInSightCone(0, 0, 5, 0, -3, 0, 10, Math.PI / 2)).toBe(false)
  })

  it('rejects target outside range', () => {
    expect(isInSightCone(0, 0, 5, 0, 20, 0, 10, Math.PI / 2)).toBe(false)
  })

  it('accepts target at edge of cone', () => {
    const angle = Math.PI / 4
    // target at 45 degrees should be inside 90-degree cone
    expect(isInSightCone(0, 0, 1, 0, Math.cos(angle), Math.sin(angle), 10, Math.PI / 2)).toBe(true)
  })
})

describe('isInHearingRange', () => {
  it('detects within radius', () => {
    expect(isInHearingRange(0, 0, 3, 4, 5)).toBe(true)
  })

  it('rejects outside radius', () => {
    expect(isInHearingRange(0, 0, 6, 8, 5)).toBe(false)
  })

  it('accepts exactly on radius', () => {
    expect(isInHearingRange(0, 0, 3, 4, 5)).toBe(true)
  })
})

describe('isInSmellRange', () => {
  it('detects within smell radius', () => {
    expect(isInSmellRange(0, 0, 2, 2, 5)).toBe(true)
  })

  it('rejects outside smell radius', () => {
    expect(isInSmellRange(0, 0, 10, 10, 5)).toBe(false)
  })
})

describe('SensationManager', () => {
  let ecs: ECS
  let manager: SensationManager

  beforeEach(() => {
    ecs = new ECS()
    manager = new SensationManager(ecs, { sightRange: 10, hearingRange: 8, smellRange: 6 })
  })

  it('drops and retrieves scent markers', () => {
    manager.dropScent(5, 5, 'FOOD', 1.0, 'wolf1')
    expect(manager.getScentMarkers()).toHaveLength(1)
    expect(manager.getScentMarkers()[0].type).toBe('FOOD')
  })

  it('decays scents over time', () => {
    manager.dropScent(5, 5, 'FOOD', 0.6, 'wolf1')
    manager.update(1)
    const markers = manager.getScentMarkers()
    expect(markers[0].intensity).toBeLessThan(0.6)
  })

  it('removes fully decayed scents', () => {
    manager.dropScent(5, 5, 'FOOD', 0.1, 'wolf1')
    manager.update(1)
    expect(manager.getScentMarkers()).toHaveLength(0)
  })

  it('performs sight check', () => {
    const observer = ecs.createEntity()
    ecs.addComponent(observer, { type: 'position', x: 0, y: 0, z: 0 } as Position)
    const target = ecs.createEntity()
    ecs.addComponent(target, { type: 'position', x: 3, y: 0, z: 0 } as Position)

    const events = manager.sightCheck(observer, 5, 0)
    expect(events.length).toBeGreaterThan(0)
    expect(events[0].type).toBe('SIGHT')
    expect(events[0].sourceId).toBe(target)
  })

  it('sight check respects range', () => {
    const observer = ecs.createEntity()
    ecs.addComponent(observer, { type: 'position', x: 0, y: 0, z: 0 } as Position)
    const target = ecs.createEntity()
    ecs.addComponent(target, { type: 'position', x: 20, y: 0, z: 0 } as Position)

    const events = manager.sightCheck(observer)
    const match = events.find((e) => e.sourceId === target)
    expect(match).toBeUndefined()
  })

  it('performs hearing check', () => {
    const observer = ecs.createEntity()
    ecs.addComponent(observer, { type: 'position', x: 0, y: 0, z: 0 } as Position)
    const target = ecs.createEntity()
    ecs.addComponent(target, { type: 'position', x: 3, y: 0, z: 0 } as Position)

    const events = manager.hearingCheck(observer)
    expect(events.length).toBeGreaterThan(0)
    expect(events[0].type).toBe('HEARING')
  })

  it('hearing check filters by source types', () => {
    const observer = ecs.createEntity()
    ecs.addComponent(observer, { type: 'position', x: 0, y: 0, z: 0 } as Position)
    const fauna = ecs.createEntity()
    ecs.addComponent(fauna, { type: 'position', x: 3, y: 0, z: 0 } as Position)
    ecs.addComponent(fauna, { type: 'fauna', category: 'WOLF', subType: 'x', health: 10, hunger: 0, aggressiveness: 0, actionState: 'WANDERING' } as any)

    const events = manager.hearingCheck(observer, ['fauna'])
    expect(events.length).toBe(1)
    expect(events[0].sourceId).toBe(fauna)
  })

  it('performs smell check', () => {
    const observer = ecs.createEntity()
    ecs.addComponent(observer, { type: 'position', x: 0, y: 0, z: 0 } as Position)
    manager.dropScent(1, 1, 'PREY', 1.0, 'deer1')

    const events = manager.smellCheck(observer)
    expect(events.length).toBe(1)
    expect(events[0].type).toBe('SMELL')
  })

  it('stores memories during sensation tick', () => {
    const observer = ecs.createEntity()
    ecs.addComponent(observer, { type: 'position', x: 0, y: 0, z: 0 } as Position)
    const target = ecs.createEntity()
    ecs.addComponent(target, { type: 'position', x: 2, y: 0, z: 0 } as Position)

    manager.sensationTick(observer, { doHearing: false, doSmell: false })
    const mem = manager.getMemories(observer)
    expect(mem.length).toBeGreaterThan(0)
  })

  it('decays memories over time', () => {
    const observer = ecs.createEntity()
    manager.addMemory(observer, {
      type: 'SIGHT',
      sourceId: 'a',
      sourceX: 1,
      sourceY: 1,
      threatLevel: 0,
      timestamp: performance.now(),
    })
    manager.update(1)
    const mem = manager.getMemories(observer)
    expect(mem.length).toBeGreaterThan(0)
    expect(mem[0].confidence).toBeLessThan(1)
  })

  it('clears memories for an agent', () => {
    const observer = ecs.createEntity()
    manager.addMemory(observer, {
      type: 'SIGHT',
      sourceId: 'a',
      sourceX: 1,
      sourceY: 1,
      threatLevel: 0,
      timestamp: performance.now(),
    })
    manager.clearMemories(observer)
    expect(manager.getMemories(observer)).toHaveLength(0)
  })

  it('clears all memories', () => {
    const a = ecs.createEntity()
    const b = ecs.createEntity()
    manager.addMemory(a, { type: 'SIGHT', sourceId: 'x', sourceX: 0, sourceY: 0, threatLevel: 0, timestamp: performance.now() })
    manager.addMemory(b, { type: 'SIGHT', sourceId: 'y', sourceX: 0, sourceY: 0, threatLevel: 0, timestamp: performance.now() })
    manager.clearAllMemories()
    expect(manager.getMemories(a)).toHaveLength(0)
    expect(manager.getMemories(b)).toHaveLength(0)
  })
})
