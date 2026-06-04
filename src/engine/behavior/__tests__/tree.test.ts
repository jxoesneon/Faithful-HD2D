import { describe, it, expect } from 'vitest'
import {
  BehaviorTree,
  Sequence,
  Selector,
  Parallel,
  Invert,
  Repeat,
  UntilFail,
  Always,
  Action,
  Condition,
} from '../tree'
import { Blackboard } from '../blackboard'

describe('Sequence', () => {
  it('returns SUCCESS when all children succeed', () => {
    const tree = Sequence('seq', [
      Always('a', 'SUCCESS'),
      Always('b', 'SUCCESS'),
    ])
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('SUCCESS')
  })

  it('returns FAILURE on first failure', () => {
    const tree = Sequence('seq', [
      Always('a', 'SUCCESS'),
      Always('b', 'FAILURE'),
      Always('c', 'SUCCESS'),
    ])
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('FAILURE')
  })

  it('returns RUNNING and stops there', () => {
    const tree = Sequence('seq', [
      Always('a', 'SUCCESS'),
      Always('b', 'RUNNING'),
      Always('c', 'FAILURE'),
    ])
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('RUNNING')
  })
})

describe('Selector', () => {
  it('returns SUCCESS on first success', () => {
    const tree = Selector('sel', [
      Always('a', 'FAILURE'),
      Always('b', 'SUCCESS'),
      Always('c', 'FAILURE'),
    ])
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('SUCCESS')
  })

  it('returns FAILURE when all children fail', () => {
    const tree = Selector('sel', [
      Always('a', 'FAILURE'),
      Always('b', 'FAILURE'),
    ])
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('FAILURE')
  })

  it('returns RUNNING and stops there', () => {
    const tree = Selector('sel', [
      Always('a', 'FAILURE'),
      Always('b', 'RUNNING'),
      Always('c', 'SUCCESS'),
    ])
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('RUNNING')
  })
})

describe('Parallel', () => {
  it('requireAll returns SUCCESS when all succeed', () => {
    const tree = Parallel('par', [
      Always('a', 'SUCCESS'),
      Always('b', 'SUCCESS'),
    ], 'requireAll')
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('SUCCESS')
  })

  it('requireAll returns RUNNING if any still running', () => {
    const tree = Parallel('par', [
      Always('a', 'SUCCESS'),
      Always('b', 'RUNNING'),
    ], 'requireAll')
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('RUNNING')
  })

  it('requireAll returns FAILURE if any fails', () => {
    const tree = Parallel('par', [
      Always('a', 'SUCCESS'),
      Always('b', 'FAILURE'),
    ], 'requireAll')
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('FAILURE')
  })

  it('requireOne returns SUCCESS on first success', () => {
    const tree = Parallel('par', [
      Always('a', 'FAILURE'),
      Always('b', 'SUCCESS'),
      Always('c', 'RUNNING'),
    ], 'requireOne')
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('SUCCESS')
  })
})

describe('Invert', () => {
  it('inverts SUCCESS to FAILURE', () => {
    const tree = Invert('inv', Always('a', 'SUCCESS'))
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('FAILURE')
  })

  it('inverts FAILURE to SUCCESS', () => {
    const tree = Invert('inv', Always('a', 'FAILURE'))
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('SUCCESS')
  })

  it('passes RUNNING through', () => {
    const tree = Invert('inv', Always('a', 'RUNNING'))
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('RUNNING')
  })
})

describe('Repeat', () => {
  it('repeats fixed times and returns SUCCESS', () => {
    let calls = 0
    const tree = Repeat('rep', Action('inc', () => {
      calls++
      return 'SUCCESS'
    }), 3)
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('RUNNING')
    expect(tree.tick('e1', bb)).toBe('RUNNING')
    expect(tree.tick('e1', bb)).toBe('SUCCESS')
    expect(calls).toBe(3)
  })

  it('stops on failure when stopOnFailure is true', () => {
    const tree = Repeat('rep', Always('fail', 'FAILURE'), 5, true)
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('FAILURE')
  })

  it('continues on failure when stopOnFailure is false', () => {
    let calls = 0
    const tree = Repeat('rep', Action('inc', () => {
      calls++
      return 'FAILURE'
    }), 2, false)
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('RUNNING')
    expect(tree.tick('e1', bb)).toBe('SUCCESS')
    expect(calls).toBe(2)
  })
})

describe('UntilFail', () => {
  it('returns RUNNING while child succeeds', () => {
    const tree = UntilFail('uf', Always('ok', 'SUCCESS'))
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('RUNNING')
  })

  it('returns SUCCESS when child fails', () => {
    const tree = UntilFail('uf', Always('fail', 'FAILURE'))
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('SUCCESS')
  })
})

describe('Action', () => {
  it('executes the callback', () => {
    let called = false
    const tree = Action('act', () => {
      called = true
      return 'SUCCESS'
    })
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('SUCCESS')
    expect(called).toBe(true)
  })
})

describe('Condition', () => {
  it('returns SUCCESS when predicate is true', () => {
    const tree = Condition('cond', () => true)
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('SUCCESS')
  })

  it('returns FAILURE when predicate is false', () => {
    const tree = Condition('cond', () => false)
    const bb = new Blackboard('e1')
    expect(tree.tick('e1', bb)).toBe('FAILURE')
  })
})

describe('BehaviorTree', () => {
  it('ticks the root and returns status', () => {
    const bt = new BehaviorTree('e1', Always('ok', 'SUCCESS'))
    expect(bt.tick()).toBe('SUCCESS')
  })

  it('exposes the blackboard', () => {
    const bt = new BehaviorTree('e1', Always('ok', 'SUCCESS'))
    expect(bt.getBlackboard().getAgentId()).toBe('e1')
  })

  it('allows root replacement', () => {
    const bt = new BehaviorTree('e1', Always('a', 'FAILURE'))
    expect(bt.tick()).toBe('FAILURE')
    bt.setRoot(Always('b', 'SUCCESS'))
    expect(bt.tick()).toBe('SUCCESS')
  })
})
