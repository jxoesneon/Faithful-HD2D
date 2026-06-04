import { ECS } from '../ecs'
import type { Entity, Position, Fauna, Movement, Society, PathNode } from '../../types'
import type { BTNode, BTNodeStatus } from './tree'
import { Blackboard } from './blackboard'
import { Sequence, Selector, Parallel, Invert, Repeat, UntilFail, Action, Condition } from './tree'
import { SensationManager } from './sensation'
import { PathfindingManager } from '../pathfinding'

// ===== Utility Actions =====

function getPosition(ecs: ECS, id: Entity): Position | undefined {
  return ecs.getComponent<Position>(id, 'position')
}

function getDistanceSq(ecs: ECS, a: Entity, b: Entity): number {
  const pa = getPosition(ecs, a)
  const pb = getPosition(ecs, b)
  if (!pa || !pb) return Infinity
  const dx = pa.x - pb.x
  const dy = pa.y - pb.y
  return dx * dx + dy * dy
}

function moveTowards(ecs: ECS, id: Entity, target: PathNode, speed: number): BTNodeStatus {
  const pos = getPosition(ecs, id)
  const movement = ecs.getComponent<Movement>(id, 'movement')
  if (!pos || !movement) return 'FAILURE'

  const dx = target.x - pos.x
  const dy = target.y - pos.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist < 0.5) {
    movement.vx = 0
    movement.vy = 0
    movement.targetX = null
    movement.targetY = null
    ecs.addComponent(id, movement)
    return 'SUCCESS'
  }

  movement.vx = (dx / dist) * speed
  movement.vy = (dy / dist) * speed
  movement.targetX = target.x
  movement.targetY = target.y
  ecs.addComponent(id, movement)
  return 'RUNNING'
}

// ===== Wolf Preset =====

export function createWolfTree(
  ecs: ECS,
  pathfinder: PathfindingManager,
  sensation: SensationManager
): BTNode {
  const huntAction = Action('hunt', (agentId, bb) => {
    // Look for prey via sensation memory
    const preyId = bb.get<string>('preyId')
    if (preyId) {
      const dist = getDistanceSq(ecs, agentId, preyId)
      if (dist > 400) {
        bb.delete('preyId')
      } else {
        const preyPos = getPosition(ecs, preyId)
        if (preyPos) {
          const myPos = getPosition(ecs, agentId)
          if (myPos) {
            const path = pathfinder.findPath(
              { x: Math.floor(myPos.x), y: Math.floor(myPos.y) },
              { x: Math.floor(preyPos.x), y: Math.floor(preyPos.y) }
            )
            if (path.success && path.nodes.length > 1) {
              const next = path.nodes[1]
              const fauna = ecs.getComponent<Fauna>(agentId, 'fauna')
              const speed = (fauna ? fauna.aggressiveness / 50 : 1.0)
              return moveTowards(ecs, agentId, next, speed)
            }
          }
        }
      }
    }

    // Sensory scan
    const events = sensation.sensationTick(agentId, { doSmell: false })
    for (const ev of events) {
      if (ev.type === 'SIGHT' && ev.threatLevel < 0.5) {
        bb.set('preyId', ev.sourceId)
        return 'RUNNING'
      }
    }

    // No prey -> wander
    const pos = getPosition(ecs, agentId)
    if (pos) {
      const tx = Math.floor(pos.x + (Math.random() * 10 - 5))
      const ty = Math.floor(pos.y + (Math.random() * 10 - 5))
      bb.set('wanderTarget', { x: tx, y: ty })
    }
    return 'FAILURE'
  })

  const eatAction = Action('eat', (agentId, bb) => {
    const hunger = bb.get<number>('hunger') ?? 50
    if (hunger > 20) {
      bb.set('hunger', Math.max(0, hunger - 10))
      return 'RUNNING'
    }
    return 'SUCCESS'
  })

  const sleepAction = Action('sleep', (agentId, bb) => {
    const fatigue = bb.get<number>('fatigue') ?? 0
    if (fatigue < 80) {
      bb.set('fatigue', fatigue + 1)
      return 'RUNNING'
    }
    return 'SUCCESS'
  })

  const isHungry = Condition('isHungry', (_agentId, bb) => {
    return (bb.get<number>('hunger') ?? 0) > 70
  })

  const isTired = Condition('isTired', (_agentId, bb) => {
    return (bb.get<number>('fatigue') ?? 0) > 60
  })

  const fleeFromThreat = Action('flee', (agentId, bb) => {
    const mem = sensation.getMemories(agentId)
    const threat = mem.find((m) => m.event.threatLevel > 0.7)
    if (threat) {
      const pos = getPosition(ecs, agentId)
      if (pos) {
        const dx = pos.x - threat.event.sourceX
        const dy = pos.y - threat.event.sourceY
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const fleeTarget = {
          x: Math.floor(pos.x + (dx / dist) * 5),
          y: Math.floor(pos.y + (dy / dist) * 5),
        }
        const fauna = ecs.getComponent<Fauna>(agentId, 'fauna')
        const speed = fauna ? fauna.aggressiveness / 50 : 1.0
        return moveTowards(ecs, agentId, fleeTarget, speed)
      }
    }
    return 'FAILURE'
  })

  return Selector('wolf_root', [
    Sequence('flee_if_threatened', [
      Condition('has_high_threat', (agentId) => {
        const mem = sensation.getMemories(agentId)
        return mem.some((m) => m.event.threatLevel > 0.7)
      }),
      fleeFromThreat,
    ]),
    Sequence('hunt_eat', [
      isHungry,
      Selector('hunt_or_eat', [
        Sequence('eat_if_has_food', [
          Condition('has_food', (_agentId, bb) => !!bb.get('preyId')),
          eatAction,
        ]),
        Repeat('hunt_until_catch', huntAction, 0, true),
      ]),
    ]),
    Sequence('sleep_if_tired', [
      isTired,
      sleepAction,
    ]),
    huntAction, // idle wander fallback
  ])
}

// ===== Stag Preset =====

export function createStagTree(
  ecs: ECS,
  pathfinder: PathfindingManager,
  sensation: SensationManager
): BTNode {
  const grazeAction = Action('graze', (agentId, bb) => {
    const hunger = bb.get<number>('hunger') ?? 50
    if (hunger < 90) {
      bb.set('hunger', hunger + 2)
      return 'RUNNING'
    }
    return 'SUCCESS'
  })

  const fleeAction = Action('flee', (agentId, bb) => {
    const mem = sensation.getMemories(agentId)
    const threat = mem.find((m) => m.event.threatLevel > 0.4)
    if (threat) {
      const pos = getPosition(ecs, agentId)
      if (pos) {
        const dx = pos.x - threat.event.sourceX
        const dy = pos.y - threat.event.sourceY
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const fleeTarget = {
          x: Math.floor(pos.x + (dx / dist) * 8),
          y: Math.floor(pos.y + (dy / dist) * 8),
        }
        return moveTowards(ecs, agentId, fleeTarget, 2.0)
      }
    }
    return 'FAILURE'
  })

  const herdAction = Action('herd', (agentId, bb) => {
    const herdId = bb.get<string>('herdId')
    if (herdId) {
      const herdPos = getPosition(ecs, herdId)
      if (herdPos) {
        return moveTowards(ecs, agentId, { x: Math.floor(herdPos.x), y: Math.floor(herdPos.y) }, 1.0)
      }
    }

    // Look for nearby stag
    const pos = getPosition(ecs, agentId)
    if (!pos) return 'FAILURE'
    const all = ecs.getEntitiesWith(['fauna'])
    let closest: string | null = null
    let closestDist = Infinity
    for (const id of all) {
      if (id === agentId) continue
      const fauna = ecs.getComponent<Fauna>(id, 'fauna')
      if (fauna && fauna.category === 'STAG') {
        const d = getDistanceSq(ecs, agentId, id)
        if (d < closestDist) {
          closestDist = d
          closest = id
        }
      }
    }
    if (closest) {
      bb.set('herdId', closest)
      return 'RUNNING'
    }
    return 'FAILURE'
  })

  const isThreatened = Condition('isThreatened', (agentId) => {
    const mem = sensation.getMemories(agentId)
    return mem.some((m) => m.event.threatLevel > 0.4)
  })

  const isHungry = Condition('isHungry', (_agentId, bb) => {
    return (bb.get<number>('hunger') ?? 0) < 30
  })

  return Selector('stag_root', [
    Sequence('flee_priority', [
      isThreatened,
      fleeAction,
    ]),
    Sequence('graze_priority', [
      isHungry,
      grazeAction,
    ]),
    Sequence('herd_priority', [
      Condition('wants_company', (_agentId, bb) => (bb.get<number>('loneliness') ?? 0) > 20),
      herdAction,
    ]),
    grazeAction, // idle fallback
  ])
}

// ===== Villager Preset =====

export function createVillagerTree(
  ecs: ECS,
  pathfinder: PathfindingManager,
  sensation: SensationManager
): BTNode {
  const workAction = Action('work', (agentId, bb) => {
    const pos = getPosition(ecs, agentId)
    if (!pos) return 'FAILURE'
    const workTarget = bb.get<PathNode>('workTarget')
    if (workTarget) {
      const result = moveTowards(ecs, agentId, workTarget, 0.8)
      if (result === 'SUCCESS') {
        bb.set('workProgress', (bb.get<number>('workProgress') ?? 0) + 10)
        if ((bb.get<number>('workProgress') ?? 0) >= 100) {
          bb.delete('workTarget')
          bb.set('workProgress', 0)
          const society = ecs.getComponent<Society>(agentId, 'society')
          if (society) {
            society.resources += 5
            ecs.addComponent(agentId, society)
          }
          return 'SUCCESS'
        }
        return 'RUNNING'
      }
      return result
    }

    // Pick a nearby structure to work at
    const structures = ecs.getEntitiesWith(['structure', 'position'])
    let best: string | null = null
    let bestDist = Infinity
    for (const sid of structures) {
      const d = getDistanceSq(ecs, agentId, sid)
      if (d < bestDist) {
        bestDist = d
        best = sid
      }
    }
    if (best) {
      const spos = getPosition(ecs, best)
      if (spos) {
        bb.set('workTarget', { x: Math.floor(spos.x), y: Math.floor(spos.y) })
      }
    }
    return 'RUNNING'
  })

  const eatAction = Action('eat', (agentId, bb) => {
    const hunger = bb.get<number>('hunger') ?? 50
    if (hunger > 20) {
      bb.set('hunger', Math.max(0, hunger - 15))
      const society = ecs.getComponent<Society>(agentId, 'society')
      if (society) {
        society.resources = Math.max(0, society.resources - 1)
        ecs.addComponent(agentId, society)
      }
      return 'RUNNING'
    }
    return 'SUCCESS'
  })

  const sleepAction = Action('sleep', (agentId, bb) => {
    const fatigue = bb.get<number>('fatigue') ?? 0
    if (fatigue < 90) {
      bb.set('fatigue', fatigue + 2)
      return 'RUNNING'
    }
    return 'SUCCESS'
  })

  const prayAction = Action('pray', (agentId, bb) => {
    const devotion = bb.get<number>('devotion') ?? 0
    if (devotion < 80) {
      bb.set('devotion', devotion + 5)
      const society = ecs.getComponent<Society>(agentId, 'society')
      if (society) {
        // praying slightly boosts happiness
        society.happiness = Math.min(100, society.happiness + 0.5)
        ecs.addComponent(agentId, society)
      }
      return 'RUNNING'
    }
    return 'SUCCESS'
  })

  const isHungry = Condition('isHungry', (_agentId, bb) => {
    return (bb.get<number>('hunger') ?? 0) > 60
  })

  const isTired = Condition('isTired', (_agentId, bb) => {
    return (bb.get<number>('fatigue') ?? 0) > 70
  })

  const wantsPray = Condition('wantsPray', (_agentId, bb) => {
    return (bb.get<number>('devotion') ?? 0) < 40
  })

  return Selector('villager_root', [
    Sequence('eat_priority', [
      isHungry,
      eatAction,
    ]),
    Sequence('sleep_priority', [
      isTired,
      sleepAction,
    ]),
    Sequence('pray_priority', [
      wantsPray,
      prayAction,
    ]),
    Sequence('work_default', [
      Condition('has_energy', (_agentId, bb) => (bb.get<number>('fatigue') ?? 0) < 50),
      workAction,
    ]),
    workAction, // idle fallback
  ])
}
