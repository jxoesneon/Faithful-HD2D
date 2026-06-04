import { describe, it, expect } from 'vitest'
import { satisfies, applyEffects, plan, GOAPPlanner, GOAPAction } from '../goap'
import type { GOAPWorldState } from '../../../types'

describe('satisfies', () => {
  it('returns true when all requirements met', () => {
    const state: GOAPWorldState = { hasAxe: true, hasWood: false }
    expect(satisfies(state, { hasAxe: true })).toBe(true)
  })

  it('returns false when any requirement mismatched', () => {
    const state: GOAPWorldState = { hasAxe: false }
    expect(satisfies(state, { hasAxe: true })).toBe(false)
  })

  it('returns true for empty requirements', () => {
    const state: GOAPWorldState = { a: 1 }
    expect(satisfies(state, {})).toBe(true)
  })
})

describe('applyEffects', () => {
  it('merges effects into state', () => {
    const state: GOAPWorldState = { hasAxe: false, wood: 0 }
    const next = applyEffects(state, { hasAxe: true, wood: 5 })
    expect(next.hasAxe).toBe(true)
    expect(next.wood).toBe(5)
  })

  it('does not mutate original state', () => {
    const state: GOAPWorldState = { a: 1 }
    const next = applyEffects(state, { a: 2 })
    expect(state.a).toBe(1)
    expect(next.a).toBe(2)
  })
})

describe('plan', () => {
  const actions: GOAPAction[] = [
    {
      name: 'getAxe',
      cost: 1,
      preconditions: { atShop: true },
      effects: { hasAxe: true },
    },
    {
      name: 'chopWood',
      cost: 2,
      preconditions: { hasAxe: true },
      effects: { hasWood: true },
    },
    {
      name: 'buildFire',
      cost: 1,
      preconditions: { hasWood: true },
      effects: { hasFire: true },
    },
  ]

  it('returns empty plan when goal already satisfied', () => {
    const state: GOAPWorldState = { hasFire: true }
    const result = plan(state, { hasFire: true }, actions)
    expect(result.success).toBe(true)
    expect(result.actions).toEqual([])
    expect(result.cost).toBe(0)
  })

  it('finds a single-step plan', () => {
    const state: GOAPWorldState = { atShop: true }
    const result = plan(state, { hasAxe: true }, actions)
    expect(result.success).toBe(true)
    expect(result.actions).toHaveLength(1)
    expect(result.actions[0].name).toBe('getAxe')
  })

  it('finds a multi-step plan', () => {
    const state: GOAPWorldState = { atShop: true }
    const result = plan(state, { hasFire: true }, actions)
    expect(result.success).toBe(true)
    expect(result.actions.map((a) => a.name)).toEqual([
      'getAxe',
      'chopWood',
      'buildFire',
    ])
    expect(result.cost).toBe(4)
  })

  it('returns failure for unsolvable goals', () => {
    const state: GOAPWorldState = { atShop: false }
    const result = plan(state, { hasFire: true }, actions)
    expect(result.success).toBe(false)
    expect(result.actions).toEqual([])
  })

  it('respects procedural preconditions', () => {
    const conditionalAction: GOAPAction = {
      name: 'specialCraft',
      cost: 1,
      preconditions: { hasWood: true },
      effects: { hasArtifact: true },
      checkProceduralPrecondition: (state) => state['level'] >= 5,
    }
    const lowState: GOAPWorldState = { hasWood: true, level: 1 }
    const highState: GOAPWorldState = { hasWood: true, level: 5 }

    expect(plan(lowState, { hasArtifact: true }, [conditionalAction]).success).toBe(false)
    expect(plan(highState, { hasArtifact: true }, [conditionalAction]).success).toBe(true)
  })

  it('aborts when maxNodes exceeded', () => {
    const state: GOAPWorldState = { a: 0 }
    const manyActions: GOAPAction[] = []
    for (let i = 0; i < 20; i++) {
      manyActions.push({
        name: 'inc' + i,
        cost: 1,
        preconditions: { a: i },
        effects: { a: i + 1 },
      })
    }
    const result = plan(state, { a: 20 }, manyActions, 5)
    expect(result.success).toBe(false)
  })
})

describe('GOAPPlanner', () => {
  it('plans using registered actions', () => {
    const planner = new GOAPPlanner([
      {
        name: 'eat',
        cost: 1,
        preconditions: { hasFood: true },
        effects: { notHungry: true },
      },
    ])
    const result = planner.plan({ hasFood: true }, { notHungry: true })
    expect(result.success).toBe(true)
    expect(result.actions[0].name).toBe('eat')
  })

  it('allows adding and removing actions', () => {
    const planner = new GOAPPlanner()
    planner.addAction({
      name: 'cook',
      cost: 2,
      preconditions: {},
      effects: { hasFood: true },
    })
    expect(planner.getActions()).toHaveLength(1)
    planner.removeAction('cook')
    expect(planner.getActions()).toHaveLength(0)
  })
})
