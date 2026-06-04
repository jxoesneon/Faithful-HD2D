import * as PIXI from 'pixi.js';
import {
  ShadowCaster,
  ShadowMap,
  ShadowSettings,
  Entity,
} from '../../types';

/**
 * A ShadowCaster combined with its world-space position and entity id.
 * This is what the ShadowMapManager consumes each frame.
 */
export interface ShadowCasterState extends ShadowCaster {
  entityId: Entity;
  x: number;
  y: number;
}

// PCF kernel offsets for deterministic soft-shadow sampling.
const PCF_KERNEL_4: [number, number][] = [
  [0, 0],
  [0.6, 0.6],
  [-0.6, 0.6],
  [0.6, -0.6],
  [-0.6, -0.6],
];

const PCF_KERNEL_8: [number, number][] = [
  ...PCF_KERNEL_4,
  [1.2, 0],
  [-1.2, 0],
  [0, 1.2],
  [0, -1.2],
];

export const DEFAULT_SHADOW_SETTINGS: ShadowSettings = {
  maxShadowDistance: 800,
  pcfKernelSize: 4,
  contactHardeningFactor: 0.6,
  baseIntensity: 0.45,
  staticCacheEnabled: true,
  shadowLengthMultiplier: 80,
};

/**
 * Create a ShadowCaster component suitable for attachment to an ECS entity.
 */
export function createShadowCaster(
  options: Partial<Omit<ShadowCaster, 'type'>> = {}
): ShadowCaster {
  return {
    type: 'shadowCaster',
    width: options.width ?? 24,
    height: options.height ?? 12,
    castHeight: options.castHeight ?? 16,
    isStatic: options.isStatic ?? false,
    category: options.category ?? 'Structure',
  };
}

/**
 * Build a ShadowCasterState from a raw ECS component + world position.
 */
export function buildShadowCasterState(
  entityId: Entity,
  component: ShadowCaster,
  x: number,
  y: number
): ShadowCasterState {
  return {
    ...component,
    entityId,
    x,
    y,
  };
}

/**
 * Manages dynamic directional shadows for entities using PIXI.Graphics.
 *
 * Features:
 * - Directional-light shadow maps driven by the sun position from DayNightManager.
 * - PCF (Percentage Closer Filtering) soft-shadow approximation via multi-sample
 *   jittered polygon fills.
 * - Contact hardening: shorter shadows (high sun) are rendered sharper.
 * - Distance-based culling so only casters near the camera receive shadows.
 * - Caching for static objects (e.g. structures) to avoid redundant geometry rebuilds.
 *
 * The manager owns a pool of {@link PIXI.Graphics} objects — callers retrieve them
 * with {@link getShadowGraphics} and add them to entity containers.
 */
export class ShadowMapManager {
  /** Internal atlas of active shadow maps keyed by entity id. */
  private shadowAtlas = new Map<Entity, ShadowMap>();
  private settings: ShadowSettings;
  private graphicsPool: PIXI.Graphics[] = [];

  constructor(settings: Partial<ShadowSettings> = {}) {
    this.settings = { ...DEFAULT_SHADOW_SETTINGS, ...settings };
  }

  /**
   * Compute shadow intensity from sun position and time of day.
   *
   * Returns 0 at night, scales with sun altitude during the day,
   * and is damped during twilight windows.
   */
  computeIntensity(
    sunPosition: { x: number; y: number; z: number },
    timeOfDayMinutes: number
  ): number {
    if (sunPosition.y <= 0) return 0;

    const heightFactor = Math.min(1.0, sunPosition.y);
    let intensity = this.settings.baseIntensity * heightFactor;

    const SUNRISE_MINUTE = 360;
    const SUNSET_MINUTE = 1080;
    const TWILIGHT_DURATION = 60;

    if (
      timeOfDayMinutes < SUNRISE_MINUTE ||
      timeOfDayMinutes >= SUNSET_MINUTE
    ) {
      intensity = 0;
    } else if (timeOfDayMinutes < SUNRISE_MINUTE + TWILIGHT_DURATION) {
      const t =
        (timeOfDayMinutes - SUNRISE_MINUTE) / TWILIGHT_DURATION;
      intensity *= t;
    } else if (timeOfDayMinutes > SUNSET_MINUTE - TWILIGHT_DURATION) {
      const t =
        (SUNSET_MINUTE - timeOfDayMinutes) / TWILIGHT_DURATION;
      intensity *= t;
    }

    return Math.max(0, Math.min(1, intensity));
  }

  /**
   * Derive the 2D screen-space shadow direction from the sun position.
   *
   * The returned vector points from the caster base toward the shadow tip.
   */
  computeShadowDirection(
    sunPosition: { x: number; y: number; z: number }
  ): { dx: number; dy: number } {
    const dx = -sunPosition.x * 1.2 + sunPosition.z * 0.3;
    const dy = sunPosition.x * 0.2 + sunPosition.z * 0.5;
    return { dx, dy };
  }

  /**
   Compute how far the shadow stretches from caster base to tip.
   */
  computeShadowLength(
    sunPosition: { x: number; y: number; z: number },
    castHeight: number
  ): number {
    if (sunPosition.y <= 0.05) {
      return this.settings.shadowLengthMultiplier * 3;
    }
    const length = (castHeight / Math.max(0.1, sunPosition.y)) * 0.5;
    return Math.min(length, this.settings.shadowLengthMultiplier * 3);
  }

  /**
   * Calculate effective PCF kernel size using contact hardening.
   *
   * Shorter shadows (sun high, caster close to ground) produce a smaller
   * kernel → sharper edges. Longer shadows (sun low) use a larger kernel
   * → softer edges.
   */
  calculatePCFKernel(shadowLength: number): number {
    const normalizedLength = Math.min(
      1,
      shadowLength / this.settings.shadowLengthMultiplier
    );
    const contactFactor =
      1.0 -
      this.settings.contactHardeningFactor * (1.0 - normalizedLength);
    return Math.max(
      1,
      Math.round(this.settings.pcfKernelSize * contactFactor)
    );
  }

  /**
   * Build a shadow polygon for a caster in local screen-space coordinates.
   *
   * The polygon is an extruded ellipse that stretches from the caster's
   * base toward the shadow tip.
   */
  buildShadowVertices(
    caster: ShadowCasterState,
    sunPosition: { x: number; y: number; z: number }
  ): { vertices: number[]; length: number } {
    const direction = this.computeShadowDirection(sunPosition);
    const length = this.computeShadowLength(
      sunPosition,
      caster.castHeight ?? 16
    );
    const w = caster.width * 0.5;
    const h = caster.height * 0.5;
    const baseY = 16; // iso ground-line offset

    const tipX = direction.dx * length;
    const tipY = baseY + direction.dy * length;

    // Extruded ellipse: base arc + tip point
    const vertices = [
      -w,
      baseY - h,
      w,
      baseY - h,
      w + tipX * 0.4,
      tipY,
      tipX,
      tipY + h * 0.5,
      -w + tipX * 0.4,
      tipY,
    ];

    return { vertices, length };
  }

  /**
   * Draw a shadow polygon onto a PIXI.Graphics using PCF approximation.
   *
   * The shape is rendered `kernelSize` times with deterministic sub-pixel
   * offsets and divided alpha to simulate a soft penumbra.
   */
  drawShadowGraphic(
    graphics: PIXI.Graphics,
    vertices: number[],
    intensity: number,
    kernelSize: number
  ): void {
    graphics.clear();

    if (intensity <= 0.001 || kernelSize <= 0) {
      graphics.visible = false;
      return;
    }

    graphics.visible = true;

    const offsets = kernelSize <= 4 ? PCF_KERNEL_4 : PCF_KERNEL_8;
    const sampleCount = Math.min(kernelSize + 1, offsets.length);
    const alphaPerSample = intensity / sampleCount;

    for (let i = 0; i < sampleCount; i++) {
      const [ox, oy] = offsets[i];
      const jittered = vertices.map((v, idx) =>
        idx % 2 === 0 ? v + ox * 1.5 : v + oy * 1.5
      );
      graphics.poly(jittered);
      graphics.fill({ color: 0x000000, alpha: alphaPerSample });
    }
  }

  /**
   * Distance-based culling. Only casters within `cameraViewRadius`
   * of `cameraPosition` are eligible for shadows.
   */
  isNearCamera(
    caster: ShadowCasterState,
    cameraPosition: { x: number; y: number },
    cameraViewRadius: number
  ): boolean {
    const dx = caster.x - cameraPosition.x;
    const dy = caster.y - cameraPosition.y;
    return Math.sqrt(dx * dx + dy * dy) <= cameraViewRadius;
  }

  /** Acquire a {@link PIXI.Graphics} from the internal object pool. */
  private acquireGraphics(): PIXI.Graphics {
    return this.graphicsPool.pop() ?? new PIXI.Graphics();
  }

  /** Return a {@link PIXI.Graphics} to the internal object pool. */
  private releaseGraphics(graphics: PIXI.Graphics): void {
    graphics.clear();
    graphics.visible = false;
    graphics.removeFromParent();
    this.graphicsPool.push(graphics);
  }

  /** Retrieve the shadow {@link PIXI.Graphics} for an entity, or `null`. */
  getShadowGraphics(entityId: Entity): PIXI.Graphics | null {
    return this.shadowAtlas.get(entityId)?.graphics ?? null;
  }

  /** Returns `true` if the entity currently has a visible shadow. */
  isEntityShadowed(entityId: Entity): boolean {
    const entry = this.shadowAtlas.get(entityId);
    return entry !== undefined && entry.graphics.visible;
  }

  /** Quantize sun direction so small changes do not invalidate the cache. */
  private getSunAngleKey(
    sunPosition: { x: number; y: number; z: number }
  ): number {
    return Math.round(Math.atan2(sunPosition.x, sunPosition.y) * 10) / 10;
  }

  /**
   * Main per-frame update.
   *
   * Rebuilds shadow geometry, applies culling, and re-uses cached static
   * entries when the sun angle and intensity have not shifted meaningfully.
   */
  update(params: {
    sunPosition: { x: number; y: number; z: number };
    casters: ShadowCasterState[];
    cameraPosition: { x: number; y: number };
    cameraViewRadius: number;
    timeOfDayMinutes: number;
  }): void {
    const {
      sunPosition,
      casters,
      cameraPosition,
      cameraViewRadius,
      timeOfDayMinutes,
    } = params;

    const intensity = this.computeIntensity(sunPosition, timeOfDayMinutes);
    const sunAngleKey = this.getSunAngleKey(sunPosition);
    const activeIds = new Set<Entity>();

    for (const caster of casters) {
      if (!this.isNearCamera(caster, cameraPosition, cameraViewRadius)) {
        continue;
      }

      activeIds.add(caster.entityId);

      const existing = this.shadowAtlas.get(caster.entityId);
      const isStatic =
        caster.isStatic && this.settings.staticCacheEnabled;

      // Static cache hit: sun angle & intensity unchanged enough
      if (
        existing &&
        isStatic &&
        Math.abs(existing.lastSunAngle - sunAngleKey) < 0.2 &&
        Math.abs(existing.lastIntensity - intensity) < 0.05
      ) {
        existing.graphics.visible = intensity > 0.001;
        continue;
      }

      const { vertices, length } = this.buildShadowVertices(
        caster,
        sunPosition
      );
      const kernelSize = this.calculatePCFKernel(length);

      let entry = existing;
      if (!entry) {
        entry = {
          entityId: caster.entityId,
          graphics: this.acquireGraphics(),
          cached: false,
          lastSunAngle: sunAngleKey,
          lastIntensity: intensity,
        };
        this.shadowAtlas.set(caster.entityId, entry);
      }

      this.drawShadowGraphic(
        entry.graphics,
        vertices,
        intensity,
        kernelSize
      );
      entry.lastSunAngle = sunAngleKey;
      entry.lastIntensity = intensity;
      entry.cached = isStatic;
    }

    // Reclaim graphics for entities that left the camera frustum or were destroyed.
    for (const [id, entry] of this.shadowAtlas.entries()) {
      if (!activeIds.has(id)) {
        this.releaseGraphics(entry.graphics);
        this.shadowAtlas.delete(id);
      }
    }
  }

  /** Convenience helper: attach a managed shadow graphic to a container. */
  attachShadow(entityId: Entity, container: PIXI.Container): boolean {
    const graphics = this.getShadowGraphics(entityId);
    if (!graphics) return false;
    if (!container.children.includes(graphics as any)) {
      container.addChild(graphics);
    }
    return true;
  }

  /** Destroy every shadow graphic and clear internal state. */
  dispose(): void {
    for (const entry of this.shadowAtlas.values()) {
      entry.graphics.destroy({ children: true });
    }
    this.shadowAtlas.clear();
    for (const g of this.graphicsPool) {
      g.destroy({ children: true });
    }
    this.graphicsPool.length = 0;
  }

  /** Runtime diagnostics. */
  getStats(): { activeShadows: number; pooledGraphics: number } {
    return {
      activeShadows: this.shadowAtlas.size,
      pooledGraphics: this.graphicsPool.length,
    };
  }
}
