import type { TerrainBrush, TerraformOperation, WaterChannel } from '../../types';

export class TerraformManager {
  private terrain: number[][];
  private width: number;
  private height: number;
  private waterMap: number[][];
  private channels: WaterChannel[];
  private structureImpacts: Map<string, { x: number; y: number; type: string; radius: number }>;
  private defaultBrushRadius: number;

  constructor(terrain: number[][], defaultBrushRadius: number = 3) {
    this.terrain = terrain;
    this.height = terrain.length;
    this.width = this.height > 0 ? terrain[0].length : 0;
    this.waterMap = Array.from({ length: this.height }, () => Array(this.width).fill(0));
    this.channels = [];
    this.structureImpacts = new Map();
    this.defaultBrushRadius = defaultBrushRadius;
  }

  getTerrain(): number[][] {
    return this.terrain;
  }

  getWaterMap(): number[][] {
    return this.waterMap;
  }

  getChannels(): WaterChannel[] {
    return this.channels;
  }

  getStructureImpacts(): Map<string, { x: number; y: number; type: string; radius: number }> {
    return this.structureImpacts;
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private gaussianFalloff(distance: number, radius: number): number {
    const sigma = radius / 2;
    return Math.exp(-(distance * distance) / (2 * sigma * sigma));
  }

  private applyBrush(cx: number, cy: number, radius: number, delta: number): void {
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist <= radius) {
          const falloff = this.gaussianFalloff(dist, radius);
          const newValue = this.terrain[y][x] + delta * falloff;
          this.terrain[y][x] = Math.max(0, Math.min(1, newValue));
        }
      }
    }
  }

  raiseLand(x: number, y: number, amount: number): void {
    this.applyBrush(x, y, this.defaultBrushRadius, amount);
  }

  lowerLand(x: number, y: number, amount: number): void {
    this.applyBrush(x, y, this.defaultBrushRadius, -amount);
  }

  createWaterChannel(x1: number, y1: number, x2: number, y2: number, width: number): void {
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const steps = Math.max(Math.ceil(dist * 2), 1);
    const radius = width / 2;
    const carveDepth = 0.15;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;
      this.applyBrush(cx, cy, radius, -carveDepth);
    }

    // Fill with water along the channel
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;
      this.applyWaterBrush(cx, cy, radius, 0.5);
    }

    this.channels.push({ x1, y1, x2, y2, width, waterLevel: 0.5 });
  }

  private applyWaterBrush(cx: number, cy: number, radius: number, amount: number): void {
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist <= radius) {
          const falloff = this.gaussianFalloff(dist, radius);
          const newValue = this.waterMap[y][x] + amount * falloff;
          this.waterMap[y][x] = Math.max(0, Math.min(1, newValue));
        }
      }
    }
  }

  flattenArea(centerX: number, centerY: number, radius: number, targetHeight: number): void {
    const minX = Math.max(0, Math.floor(centerX - radius));
    const maxX = Math.min(this.width - 1, Math.ceil(centerX + radius));
    const minY = Math.max(0, Math.floor(centerY - radius));
    const maxY = Math.min(this.height - 1, Math.ceil(centerY + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (dist <= radius) {
          const falloff = this.gaussianFalloff(dist, radius);
          const current = this.terrain[y][x];
          const diff = targetHeight - current;
          const newValue = current + diff * falloff;
          this.terrain[y][x] = Math.max(0, Math.min(1, newValue));
        }
      }
    }
  }

  naturalErosion(dt: number): void {
    const erosionRate = 0.001 * dt;
    const fillRate = 0.0005 * dt;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const h = this.terrain[y][x];
        let neighborSum = 0;
        let count = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (this.inBounds(nx, ny)) {
              neighborSum += this.terrain[ny][nx];
              count++;
            }
          }
        }

        if (count > 0) {
          const avg = neighborSum / count;
          if (h > avg + 0.05) {
            this.terrain[y][x] = Math.max(0, h - erosionRate);
          } else if (h < avg - 0.05) {
            this.terrain[y][x] = Math.min(1, h + fillRate);
          }
        }
      }
    }
  }

  createLake(centerX: number, centerY: number, radius: number): void {
    const depressionDepth = 0.3;
    this.applyBrush(centerX, centerY, radius, -depressionDepth);

    // Fill depressed area with water
    const minX = Math.max(0, Math.floor(centerX - radius));
    const maxX = Math.min(this.width - 1, Math.ceil(centerX + radius));
    const minY = Math.max(0, Math.floor(centerY - radius));
    const maxY = Math.min(this.height - 1, Math.ceil(centerY + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (dist <= radius) {
          const falloff = this.gaussianFalloff(dist, radius);
          this.waterMap[y][x] = Math.max(this.waterMap[y][x], falloff * 0.6);
        }
      }
    }
  }

  addStructureImpact(id: string, x: number, y: number, type: string, radius: number = 3): void {
    this.structureImpacts.set(id, { x, y, type, radius });
  }

  removeStructureImpact(id: string): void {
    this.structureImpacts.delete(id);
  }

  isWaterFlowBlocked(channelIndex: number): boolean {
    const channel = this.channels[channelIndex];
    if (!channel) return false;

    for (const [id, impact] of this.structureImpacts) {
      if (impact.type === 'dam') {
        const dx = channel.x2 - channel.x1;
        const dy = channel.y2 - channel.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) continue;

        const ux = dx / len;
        const uy = dy / len;
        const px = impact.x - channel.x1;
        const py = impact.y - channel.y1;
        const proj = px * ux + py * uy;
        const clamped = Math.max(0, Math.min(len, proj));
        const closestX = channel.x1 + ux * clamped;
        const closestY = channel.y1 + uy * clamped;
        const dist = Math.sqrt((impact.x - closestX) ** 2 + (impact.y - closestY) ** 2);

        if (dist < impact.radius + channel.width / 2) {
          return true;
        }
      }
    }
    return false;
  }
}
