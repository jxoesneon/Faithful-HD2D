import { Entity } from '../../types'

/**
 * Shared key-value store for a single agent.
 * Multiple trees / systems can read and write to this map.
 */
export class Blackboard {
  private data = new Map<string, any>()
  private agentId: Entity

  constructor(agentId: Entity) {
    this.agentId = agentId
  }

  get<T = any>(key: string, defaultValue?: T): T | undefined {
    if (this.data.has(key)) return this.data.get(key)
    return defaultValue
  }

  set<T = any>(key: string, value: T) {
    this.data.set(key, value)
  }

  has(key: string): boolean {
    return this.data.has(key)
  }

  delete(key: string): boolean {
    return this.data.delete(key)
  }

  clear() {
    this.data.clear()
  }

  getAgentId(): Entity {
    return this.agentId
  }

  /** Access the raw map for advanced use (e.g. serialization) */
  entries(): IterableIterator<[string, any]> {
    return this.data.entries()
  }
}
