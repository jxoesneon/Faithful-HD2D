import { describe, it, expect } from 'vitest'
import { Blackboard } from '../blackboard'

describe('Blackboard', () => {
  it('stores and retrieves values', () => {
    const bb = new Blackboard('agent1')
    bb.set('health', 100)
    expect(bb.get('health')).toBe(100)
  })

  it('returns default value when key missing', () => {
    const bb = new Blackboard('agent1')
    expect(bb.get('missing', 42)).toBe(42)
  })

  it('checks key existence', () => {
    const bb = new Blackboard('agent1')
    bb.set('flag', true)
    expect(bb.has('flag')).toBe(true)
    expect(bb.has('nope')).toBe(false)
  })

  it('deletes keys', () => {
    const bb = new Blackboard('agent1')
    bb.set('tmp', 1)
    expect(bb.delete('tmp')).toBe(true)
    expect(bb.has('tmp')).toBe(false)
  })

  it('clears all data', () => {
    const bb = new Blackboard('agent1')
    bb.set('a', 1)
    bb.set('b', 2)
    bb.clear()
    expect(bb.has('a')).toBe(false)
    expect(bb.has('b')).toBe(false)
  })

  it('exposes agent id', () => {
    const bb = new Blackboard('wolf_01')
    expect(bb.getAgentId()).toBe('wolf_01')
  })

  it('iterates entries', () => {
    const bb = new Blackboard('agent1')
    bb.set('x', 1)
    bb.set('y', 2)
    const entries = Array.from(bb.entries())
    expect(entries).toHaveLength(2)
  })
})
