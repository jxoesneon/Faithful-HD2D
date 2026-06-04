export interface PrefetchZone {
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number;
  assets: string[];
}

export class Prefetcher {
  private zones: PrefetchZone[] = [];
  private cameraVelocityX = 0;
  private cameraVelocityY = 0;
  private predictionTime = 2.0; // seconds ahead to predict

  /** Record camera movement to derive velocity. */
  updateCamera(oldX: number, oldY: number, newX: number, newY: number, dt: number): void {
    if (dt > 0) {
      this.cameraVelocityX = (newX - oldX) / dt;
      this.cameraVelocityY = (newY - oldY) / dt;
    }
  }

  /** Predict camera position in the future based on velocity. */
  predictCameraPosition(currentX: number, currentY: number): { x: number; y: number } {
    return {
      x: currentX + this.cameraVelocityX * this.predictionTime,
      y: currentY + this.cameraVelocityY * this.predictionTime,
    };
  }

  /** Register a prefetch zone. */
  addZone(zone: PrefetchZone): void {
    this.zones.push(zone);
  }

  /** Clear all zones. */
  clearZones(): void {
    this.zones = [];
  }

  /** Get zones that overlap with a predicted camera view. */
  getRelevantZones(
    cameraX: number,
    cameraY: number,
    viewWidth: number,
    viewHeight: number
  ): PrefetchZone[] {
    const predicted = this.predictCameraPosition(cameraX, cameraY);
    const halfW = viewWidth / 2;
    const halfH = viewHeight / 2;
    const viewLeft = predicted.x - halfW;
    const viewRight = predicted.x + halfW;
    const viewTop = predicted.y - halfH;
    const viewBottom = predicted.y + halfH;

    return this.zones
      .filter((zone) => {
        const zoneLeft = zone.x;
        const zoneRight = zone.x + zone.width;
        const zoneTop = zone.y;
        const zoneBottom = zone.y + zone.height;
        return (
          zoneLeft < viewRight &&
          zoneRight > viewLeft &&
          zoneTop < viewBottom &&
          zoneBottom > viewTop
        );
      })
      .sort((a, b) => b.priority - a.priority);
  }

  /** Get all assets from relevant zones. */
  getAssetsToPrefetch(
    cameraX: number,
    cameraY: number,
    viewWidth: number,
    viewHeight: number
  ): string[] {
    const relevant = this.getRelevantZones(cameraX, cameraY, viewWidth, viewHeight);
    const assetSet = new Set<string>();
    for (const zone of relevant) {
      for (const asset of zone.assets) {
        assetSet.add(asset);
      }
    }
    return Array.from(assetSet);
  }

  getVelocity(): { vx: number; vy: number } {
    return { vx: this.cameraVelocityX, vy: this.cameraVelocityY };
  }
}
