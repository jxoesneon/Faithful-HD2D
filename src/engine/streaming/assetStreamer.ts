export interface LoadedAsset {
  url: string;
  data: any;
  timestamp: number;
  refCount: number;
}

export class AssetLoader {
  private cache = new Map<string, LoadedAsset>();
  private loading = new Map<string, Promise<LoadedAsset>>();
  private maxCacheSize = 100;

  /** Load an asset asynchronously with caching. */
  async load(url: string, priority = 1, retries = 3): Promise<LoadedAsset> {
    const cached = this.cache.get(url);
    if (cached) {
      cached.refCount++;
      cached.timestamp = Date.now();
      return cached;
    }

    const inFlight = this.loading.get(url);
    if (inFlight) return inFlight;

    const promise = this.fetchWithRetry(url, retries);
    this.loading.set(url, promise);

    try {
      const asset = await promise;
      this.cache.set(url, asset);
      this.loading.delete(url);
      this.evictIfNeeded();
      return asset;
    } catch (e) {
      this.loading.delete(url);
      throw e;
    }
  }

  /** Mark an asset as no longer needed. */
  release(url: string): void {
    const asset = this.cache.get(url);
    if (asset) {
      asset.refCount = Math.max(0, asset.refCount - 1);
      if (asset.refCount === 0) {
        // Keep in cache for potential reuse; LRU eviction handles overflow
      }
    }
  }

  /** Check if asset is cached. */
  isCached(url: string): boolean {
    return this.cache.has(url);
  }

  /** Get cache statistics. */
  getStats(): { size: number; maxSize: number; inFlight: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      inFlight: this.loading.size,
    };
  }

  /** Clear all cached assets. */
  clear(): void {
    this.cache.clear();
    this.loading.clear();
  }

  private async fetchWithRetry(url: string, retries: number): Promise<LoadedAsset> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.blob();
        return { url, data, timestamp: Date.now(), refCount: 1 };
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 100;
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }
    throw lastError;
  }

  private evictIfNeeded(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    // LRU eviction: remove oldest timestamp among zero-ref-count items, or oldest overall if all have refs
    let oldest: LoadedAsset | null = null;
    let oldestKey = '';
    for (const [key, asset] of this.cache.entries()) {
      if (asset.refCount === 0) {
        if (!oldest || asset.timestamp < oldest.timestamp) {
          oldest = asset;
          oldestKey = key;
        }
      }
    }

    if (!oldest) {
      // All have refs; evict oldest overall
      for (const [key, asset] of this.cache.entries()) {
        if (!oldest || asset.timestamp < oldest.timestamp) {
          oldest = asset;
          oldestKey = key;
        }
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
