/**
 * Generic object pool with LRU eviction, pre-warming, and reset callbacks.
 */
export interface ObjectPoolOptions<T> {
  create: () => T;
  reset?: (obj: T) => void;
  maxSize?: number;
}

interface PooledItem<T> {
  value: T;
  lastAccessed: number;
}

export class ObjectPool<T> {
  private available: PooledItem<T>[] = [];
  private active = new Set<T>();
  private totalCreated = 0;
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private maxPoolSize: number;
  private accessCounter = 0;

  constructor(options: ObjectPoolOptions<T>) {
    this.createFn = options.create;
    this.resetFn = options.reset;
    this.maxPoolSize = options.maxSize ?? Infinity;
  }

  /**
   * Acquire an object from the pool or create a new one.
   */
  acquire(): T {
    let item: T;
    if (this.available.length > 0) {
      const pooled = this.available.pop()!;
      item = pooled.value;
      this.resetFn?.(item);
    } else {
      item = this.createFn();
      this.totalCreated++;
    }
    this.active.add(item);
    return item;
  }

  /**
   * Release an object back to the pool.
   * If the pool exceeds max size, the least recently used object is evicted.
   */
  release(item: T): void {
    if (!this.active.has(item)) return;
    this.active.delete(item);

    if (this.available.length >= this.maxPoolSize) {
      // LRU eviction: remove item with lowest lastAccessed counter
      let oldestIdx = 0;
      let oldestAccess = this.available[0].lastAccessed;
      for (let i = 1; i < this.available.length; i++) {
        if (this.available[i].lastAccessed < oldestAccess) {
          oldestAccess = this.available[i].lastAccessed;
          oldestIdx = i;
        }
      }
      this.available.splice(oldestIdx, 1);
    }

    this.available.push({ value: item, lastAccessed: ++this.accessCounter });
  }

  /**
   * Pre-warm the pool by creating N objects upfront.
   */
  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.available.length >= this.maxPoolSize) break;
      const item = this.createFn();
      this.totalCreated++;
      this.available.push({ value: item, lastAccessed: ++this.accessCounter });
    }
  }

  /**
   * Current statistics for the pool.
   */
  get stats(): { active: number; pooled: number; totalCreated: number } {
    return {
      active: this.active.size,
      pooled: this.available.length,
      totalCreated: this.totalCreated,
    };
  }

  /**
   * Clear the pool and reset statistics.
   * Optionally invoke a destroy callback for each pooled and active object.
   */
  clear(destroy?: (obj: T) => void): void {
    if (destroy) {
      for (const { value } of this.available) {
        destroy(value);
      }
      for (const value of this.active) {
        destroy(value);
      }
    }
    this.available = [];
    this.active.clear();
    this.totalCreated = 0;
    this.accessCounter = 0;
  }
}
