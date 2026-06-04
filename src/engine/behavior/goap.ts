import { GOAPWorldState, GOAPActionDef } from '../../types'

export interface GOAPAction extends GOAPActionDef {
  /** Optional check for dynamic validity (e.g. item still exists) */
  checkProceduralPrecondition?: (state: GOAPWorldState) => boolean
}

export interface GOAPPlan {
  actions: GOAPAction[]
  cost: number
  success: boolean
}

export interface GOAPNode {
  state: GOAPWorldState
  g: number
  h: number
  parent: GOAPNode | null
  action: GOAPAction | null
}

/** Deep equality for world-state values */
function stateValueEquals(a: any, b: any): boolean {
  return a === b
}

/** Check whether `state` satisfies all key-value pairs in `requirements` */
export function satisfies(state: GOAPWorldState, requirements: GOAPWorldState): boolean {
  for (const key of Object.keys(requirements)) {
    if (!stateValueEquals(state[key], requirements[key])) {
      return false
    }
  }
  return true
}

/** Apply action effects to a state, returning a new state object */
export function applyEffects(state: GOAPWorldState, effects: GOAPWorldState): GOAPWorldState {
  return { ...state, ...effects }
}

/** Hash a world state into a primitive string for closed-set deduplication */
function hashState(state: GOAPWorldState): string {
  const keys = Object.keys(state).sort()
  return keys.map((k) => k + '=' + state[k]).join('|')
}

/**
 * Count how many keys in `goal` differ between `state` and `goal`.
 * Used as an admissible heuristic (unit cost per unsatisfied condition).
 */
function heuristic(state: GOAPWorldState, goal: GOAPWorldState): number {
  let mismatch = 0
  for (const key of Object.keys(goal)) {
    if (!stateValueEquals(state[key], goal[key])) {
      mismatch++
    }
  }
  return mismatch
}

/**
 * Run the GOAP planner using A* search through the state space.
 *
 * @param startState The agent's current world state
 * @param goalState The desired world state
 * @param availableActions All actions the agent can consider
 * @param maxNodes Maximum search nodes to prevent exponential blow-up
 * @returns GOAPPlan with ordered action list, or success=false if unsolvable
 */
export function plan(
  startState: GOAPWorldState,
  goalState: GOAPWorldState,
  availableActions: GOAPAction[],
  maxNodes: number = 1024
): GOAPPlan {
  if (satisfies(startState, goalState)) {
    return { actions: [], cost: 0, success: true }
  }

  const open: GOAPNode[] = []
  const closed = new Set<string>()

  const startNode: GOAPNode = {
    state: startState,
    g: 0,
    h: heuristic(startState, goalState),
    parent: null,
    action: null,
  }

  open.push(startNode)

  let iterations = 0

  while (open.length > 0 && iterations < maxNodes) {
    // Find lowest f = g + h
    let bestIdx = 0
    let bestF = open[0].g + open[0].h
    for (let i = 1; i < open.length; i++) {
      const f = open[i].g + open[i].h
      if (f < bestF) {
        bestF = f
        bestIdx = i
      }
    }

    const current = open.splice(bestIdx, 1)[0]
    const hash = hashState(current.state)

    if (closed.has(hash)) continue
    closed.add(hash)
    iterations++

    if (satisfies(current.state, goalState)) {
      const actions: GOAPAction[] = []
      let node: GOAPNode | null = current
      while (node?.action) {
        actions.unshift(node.action)
        node = node.parent
      }
      return { actions, cost: current.g, success: true }
    }

    for (const action of availableActions) {
      if (action.checkProceduralPrecondition && !action.checkProceduralPrecondition(current.state)) {
        continue
      }
      if (!satisfies(current.state, action.preconditions)) continue

      const nextState = applyEffects(current.state, action.effects)
      const nextHash = hashState(nextState)
      if (closed.has(nextHash)) continue

      const g = current.g + action.cost
      const h = heuristic(nextState, goalState)

      // Simple duplicate check in open list
      const existing = open.find((n) => hashState(n.state) === nextHash)
      if (existing && existing.g <= g) continue

      const child: GOAPNode = {
        state: nextState,
        g,
        h,
        parent: current,
        action,
      }

      if (existing) {
        existing.g = g
        existing.h = h
        existing.parent = current
        existing.action = action
      } else {
        open.push(child)
      }
    }
  }

  return { actions: [], cost: 0, success: false }
}

/** Manager that caches actions and can quickly replan for agents */
export class GOAPPlanner {
  private actions: GOAPAction[] = []

  constructor(actions?: GOAPAction[]) {
    if (actions) this.actions = actions
  }

  public addAction(action: GOAPAction) {
    this.actions.push(action)
  }

  public removeAction(name: string) {
    this.actions = this.actions.filter((a) => a.name !== name)
  }

  public setActions(actions: GOAPAction[]) {
    this.actions = actions
  }

  public getActions(): GOAPAction[] {
    return [...this.actions]
  }

  /**
   * Plan from start to goal using the registered actions.
   */
  public plan(
    startState: GOAPWorldState,
    goalState: GOAPWorldState,
    maxNodes: number = 1024
  ): GOAPPlan {
    return plan(startState, goalState, this.actions, maxNodes)
  }
}
