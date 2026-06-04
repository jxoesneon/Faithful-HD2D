import type { Entity } from '../../types'
import { Blackboard } from './blackboard'

export type BTNodeStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING'

export type TickFunction = (agentId: Entity, blackboard: Blackboard) => BTNodeStatus

export interface BTNode {
  name: string
  tick: TickFunction
}

/** Executes child nodes in order until one fails. Returns SUCCESS if all succeed. */
export function Sequence(name: string, children: BTNode[]): BTNode {
  return {
    name,
    tick: (agentId, blackboard) => {
      for (const child of children) {
        const status = child.tick(agentId, blackboard)
        if (status === 'FAILURE' || status === 'RUNNING') {
          return status
        }
      }
      return 'SUCCESS'
    },
  }
}

/** Executes child nodes in order until one succeeds. Returns FAILURE if all fail. */
export function Selector(name: string, children: BTNode[]): BTNode {
  return {
    name,
    tick: (agentId, blackboard) => {
      for (const child of children) {
        const status = child.tick(agentId, blackboard)
        if (status === 'SUCCESS' || status === 'RUNNING') {
          return status
        }
      }
      return 'FAILURE'
    },
  }
}

/**
 * Parallel composite.
 * mode: 'requireAll' (default) means all children must succeed.
 * mode: 'requireOne' means first success wins.
 * Returns RUNNING until the condition is met.
 */
export function Parallel(
  name: string,
  children: BTNode[],
  mode: 'requireAll' | 'requireOne' = 'requireAll'
): BTNode {
  return {
    name,
    tick: (agentId, blackboard) => {
      let anyRunning = false
      let successCount = 0

      for (const child of children) {
        const status = child.tick(agentId, blackboard)
        if (status === 'RUNNING') {
          anyRunning = true
        } else if (status === 'SUCCESS') {
          successCount++
          if (mode === 'requireOne') {
            return 'SUCCESS'
          }
        }
      }

      if (mode === 'requireAll') {
        if (successCount === children.length) return 'SUCCESS'
        if (anyRunning) return 'RUNNING'
        return 'FAILURE'
      }

      // requireOne mode
      if (anyRunning) return 'RUNNING'
      return 'FAILURE'
    },
  }
}

/** Inverts the child's result: SUCCESS becomes FAILURE and vice-versa. RUNNING passes through. */
export function Invert(name: string, child: BTNode): BTNode {
  return {
    name,
    tick: (agentId, blackboard) => {
      const status = child.tick(agentId, blackboard)
      if (status === 'SUCCESS') return 'FAILURE'
      if (status === 'FAILURE') return 'SUCCESS'
      return status
    },
  }
}

/**
 * Repeats the child up to `times` iterations.
 * If times <= 0, repeats indefinitely until FAILURE.
 * Returns SUCCESS when the repeat count is exhausted.
 * Returns FAILURE immediately if the child ever fails (unless configured otherwise).
 */
export function Repeat(
  name: string,
  child: BTNode,
  times: number = 0,
  stopOnFailure: boolean = true
): BTNode {
  return {
    name,
    tick: (agentId, blackboard) => {
      const key = '__repeat_count_' + name
      let count = (blackboard.get<number>(key) ?? 0)
      const status = child.tick(agentId, blackboard)

      if (status === 'RUNNING') return 'RUNNING'

      if (status === 'FAILURE') {
        if (stopOnFailure) {
          blackboard.set(key, 0)
          return 'FAILURE'
        }
        count++
      } else if (status === 'SUCCESS') {
        count++
      }

      if (times > 0 && count >= times) {
        blackboard.set(key, 0)
        return 'SUCCESS'
      }

      blackboard.set(key, count)
      return 'RUNNING'
    },
  }
}

/**
 * Repeats the child until it returns FAILURE, then returns SUCCESS.
 * Useful for "keep doing X while it works".
 */
export function UntilFail(name: string, child: BTNode): BTNode {
  return {
    name,
    tick: (agentId, blackboard) => {
      const status = child.tick(agentId, blackboard)
      if (status === 'FAILURE') return 'SUCCESS'
      return 'RUNNING'
    },
  }
}

/** Utility leaf that always returns the given status */
export function Always(name: string, status: BTNodeStatus): BTNode {
  return {
    name,
    tick: () => status,
  }
}

/** Utility leaf that runs a callback and returns the provided status */
export function Action(
  name: string,
  fn: (agentId: Entity, blackboard: Blackboard) => BTNodeStatus
): BTNode {
  return {
    name,
    tick: fn,
  }
}

/** Condition leaf that runs a predicate and returns SUCCESS if true, else FAILURE */
export function Condition(
  name: string,
  predicate: (agentId: Entity, blackboard: Blackboard) => boolean
): BTNode {
  return {
    name,
    tick: (agentId, blackboard) => {
      return predicate(agentId, blackboard) ? 'SUCCESS' : 'FAILURE'
    },
  }
}

/**
 * A behavior tree instance bound to a specific agent.
 * Manages the agent's blackboard and executes the root node.
 */
export class BehaviorTree {
  private agentId: Entity
  private root: BTNode
  private blackboard: Blackboard

  constructor(agentId: Entity, root: BTNode) {
    this.agentId = agentId
    this.root = root
    this.blackboard = new Blackboard(agentId)
  }

  /** Execute one tick of the tree */
  public tick(): BTNodeStatus {
    return this.root.tick(this.agentId, this.blackboard)
  }

  public getBlackboard(): Blackboard {
    return this.blackboard
  }

  public getAgentId(): Entity {
    return this.agentId
  }

  public setRoot(root: BTNode) {
    this.root = root
  }
}
