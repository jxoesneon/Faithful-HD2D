import { ECS } from '../ecs';
import {
  DayNightState,
  LightingUniforms,
  MoonPhase,
  Position,
  Fauna,
  Society,
  Movement,
} from '../../types';

const MINUTES_PER_DAY = 1440;
const SUNRISE_MINUTE = 360; // 6:00 AM
const SUNSET_MINUTE = 1080; // 6:00 PM
const TWILIGHT_DURATION = 60; // minutes
const MOON_CYCLE_DAYS = 28;

/** Sky color palette in RGB 0-1. */
const SKY_COLORS = {
  midnightTop: [0.02, 0.02, 0.08] as [number, number, number],
  midnightBottom: [0.04, 0.04, 0.12] as [number, number, number],
  dawnTop: [0.2, 0.1, 0.3] as [number, number, number],
  dawnBottom: [1.0, 0.5, 0.3] as [number, number, number],
  dayTop: [0.3, 0.6, 1.0] as [number, number, number],
  dayBottom: [0.53, 0.81, 0.92] as [number, number, number],
  duskTop: [0.15, 0.1, 0.25] as [number, number, number],
  duskBottom: [0.8, 0.4, 0.2] as [number, number, number],
};

const SUN_COLOR_DAY: [number, number, number] = [1.0, 0.95, 0.8];
const SUN_COLOR_DAWN: [number, number, number] = [1.0, 0.7, 0.4];
const SUN_COLOR_DUSK: [number, number, number] = [1.0, 0.5, 0.3];
const SUN_COLOR_NIGHT: [number, number, number] = [0.1, 0.1, 0.2];

const MOON_PHASES: MoonPhase[] = [
  'NEW',
  'WAXING_CRESCENT',
  'FIRST_QUARTER',
  'WAXING_GIBBOUS',
  'FULL',
  'WANING_GIBBOUS',
  'LAST_QUARTER',
  'WANING_CRESCENT',
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Manages the accelerated day/night cycle (1 real second = 1 game minute).
 * Computes sun/moon positions, dynamic lighting, sky gradients, and moon phases.
 * Also provides entity behavior modifiers based on time of day.
 */
export class DayNightManager {
  private totalGameMinutes = 0;

  constructor(private ecs: ECS) {}

  /** Advance the cycle by `dt` real seconds (each second = 1 game minute). */
  update(dt: number): DayNightState {
    this.totalGameMinutes += dt;
    return this.getState();
  }

  /** Set the total elapsed game time (for save/load). */
  setTotalGameMinutes(minutes: number) {
    this.totalGameMinutes = minutes;
  }

  /** Get the current total elapsed game time in minutes. */
  getTotalGameMinutes(): number {
    return this.totalGameMinutes;
  }

  /** Produce a full state snapshot. */
  getState(): DayNightState {
    const timeOfDayMinutes = this.totalGameMinutes % MINUTES_PER_DAY;
    const gameDay = Math.floor(this.totalGameMinutes / MINUTES_PER_DAY);

    const sunPos = this.computeSunPosition(timeOfDayMinutes);
    const moonPos = this.computeMoonPosition(timeOfDayMinutes);
    const ambient = this.computeAmbientIntensity(timeOfDayMinutes);
    const sky = this.computeSkyGradient(timeOfDayMinutes);
    const sunColor = this.computeSunColor(timeOfDayMinutes);
    const moonPhase = this.computeMoonPhase(gameDay);
    const isNight = timeOfDayMinutes < SUNRISE_MINUTE || timeOfDayMinutes >= SUNSET_MINUTE;
    const isTwilight = this.isTwilight(timeOfDayMinutes);

    return {
      totalGameMinutes: this.totalGameMinutes,
      gameDay,
      timeOfDayMinutes,
      sunPosition: sunPos,
      moonPosition: moonPos,
      ambientIntensity: ambient,
      skyColorTop: sky.top,
      skyColorBottom: sky.bottom,
      sunColor,
      moonPhase,
      isNight,
      isTwilight,
    };
  }

  /** Produce shader-compatible lighting uniforms. */
  getLightingUniforms(): LightingUniforms {
    const state = this.getState();
    return {
      uTimeOfDay: state.timeOfDayMinutes / MINUTES_PER_DAY,
      uSunPosition: [state.sunPosition.x, state.sunPosition.y, state.sunPosition.z],
      uAmbientIntensity: state.ambientIntensity,
    };
  }

  /** Compute sun position as a normalized direction vector. */
  private computeSunPosition(timeOfDay: number): { x: number; y: number; z: number } {
    if (timeOfDay < SUNRISE_MINUTE || timeOfDay > SUNSET_MINUTE) {
      // Sun is below horizon at night
      const nearSunset = timeOfDay > SUNSET_MINUTE;
      const angle = nearSunset ? Math.PI / 2 + 0.1 : -Math.PI / 2 - 0.1;
      return { x: Math.sin(angle), y: Math.cos(angle) * 0.3, z: -0.5 };
    }

    const dayProgress = (timeOfDay - SUNRISE_MINUTE) / (SUNSET_MINUTE - SUNRISE_MINUTE);
    const angle = (dayProgress - 0.5) * Math.PI; // -PI/2 at sunrise to +PI/2 at sunset
    return {
      x: Math.sin(angle),
      y: Math.cos(angle),
      z: 0.3,
    };
  }

  /** Moon is roughly opposite the sun with a slight offset. */
  private computeMoonPosition(timeOfDay: number): { x: number; y: number; z: number } {
    const sun = this.computeSunPosition(timeOfDay);
    return {
      x: -sun.x * 0.9,
      y: Math.max(0.15, -sun.y * 0.5 + 0.4),
      z: 0.2,
    };
  }

  private computeAmbientIntensity(timeOfDay: number): number {
    if (timeOfDay >= SUNRISE_MINUTE + TWILIGHT_DURATION && timeOfDay <= SUNSET_MINUTE - TWILIGHT_DURATION) {
      return 1.0;
    }

    const sunriseStart = SUNRISE_MINUTE - TWILIGHT_DURATION;
    const sunriseEnd = SUNRISE_MINUTE + TWILIGHT_DURATION;
    const sunsetStart = SUNSET_MINUTE - TWILIGHT_DURATION;
    const sunsetEnd = SUNSET_MINUTE + TWILIGHT_DURATION;

    if (timeOfDay >= sunriseStart && timeOfDay <= sunriseEnd) {
      const t = (timeOfDay - sunriseStart) / (sunriseEnd - sunriseStart);
      return lerp(0.05, 1.0, t);
    }

    if (timeOfDay >= sunsetStart && timeOfDay <= sunsetEnd) {
      const t = (timeOfDay - sunsetStart) / (sunsetEnd - sunsetStart);
      return lerp(1.0, 0.05, t);
    }

    return 0.05;
  }

  private isTwilight(timeOfDay: number): boolean {
    const sunriseWindow = timeOfDay >= SUNRISE_MINUTE - TWILIGHT_DURATION && timeOfDay <= SUNRISE_MINUTE + TWILIGHT_DURATION;
    const sunsetWindow = timeOfDay >= SUNSET_MINUTE - TWILIGHT_DURATION && timeOfDay <= SUNSET_MINUTE + TWILIGHT_DURATION;
    return sunriseWindow || sunsetWindow;
  }

  private computeSkyGradient(timeOfDay: number): { top: [number, number, number]; bottom: [number, number, number] } {
    const sunriseStart = SUNRISE_MINUTE - TWILIGHT_DURATION;
    const sunriseEnd = SUNRISE_MINUTE + TWILIGHT_DURATION;
    const sunsetStart = SUNSET_MINUTE - TWILIGHT_DURATION;
    const sunsetEnd = SUNSET_MINUTE + TWILIGHT_DURATION;

    if (timeOfDay >= sunriseStart && timeOfDay <= sunriseEnd) {
      const t = (timeOfDay - sunriseStart) / (sunriseEnd - sunriseStart);
      return {
        top: lerpColor(SKY_COLORS.midnightTop, SKY_COLORS.dayTop, t),
        bottom: lerpColor(SKY_COLORS.midnightBottom, SKY_COLORS.dayBottom, t),
      };
    }

    if (timeOfDay >= sunriseEnd && timeOfDay <= sunsetStart) {
      return { top: SKY_COLORS.dayTop, bottom: SKY_COLORS.dayBottom };
    }

    if (timeOfDay >= sunsetStart && timeOfDay <= sunsetEnd) {
      const t = (timeOfDay - sunsetStart) / (sunsetEnd - sunsetStart);
      return {
        top: lerpColor(SKY_COLORS.dayTop, SKY_COLORS.midnightTop, t),
        bottom: lerpColor(SKY_COLORS.dayBottom, SKY_COLORS.midnightBottom, t),
      };
    }

    return { top: SKY_COLORS.midnightTop, bottom: SKY_COLORS.midnightBottom };
  }

  private computeSunColor(timeOfDay: number): [number, number, number] {
    const sunriseStart = SUNRISE_MINUTE - TWILIGHT_DURATION;
    const sunriseEnd = SUNRISE_MINUTE + TWILIGHT_DURATION;
    const sunsetStart = SUNSET_MINUTE - TWILIGHT_DURATION;
    const sunsetEnd = SUNSET_MINUTE + TWILIGHT_DURATION;

    if (timeOfDay >= sunriseStart && timeOfDay <= sunriseEnd) {
      const t = (timeOfDay - sunriseStart) / (sunriseEnd - sunriseStart);
      return lerpColor(SUN_COLOR_DAWN, SUN_COLOR_DAY, t);
    }
    if (timeOfDay >= sunriseEnd && timeOfDay <= sunsetStart) {
      return SUN_COLOR_DAY;
    }
    if (timeOfDay >= sunsetStart && timeOfDay <= sunsetEnd) {
      const t = (timeOfDay - sunsetStart) / (sunsetEnd - sunsetStart);
      return lerpColor(SUN_COLOR_DAY, SUN_COLOR_DUSK, t);
    }
    return SUN_COLOR_NIGHT;
  }

  private computeMoonPhase(gameDay: number): MoonPhase {
    const phaseIndex = Math.floor((gameDay % MOON_CYCLE_DAYS) / (MOON_CYCLE_DAYS / MOON_PHASES.length));
    return MOON_PHASES[clamp(phaseIndex, 0, MOON_PHASES.length - 1)];
  }

  /**
   * Returns activity modifiers for an entity based on time of day.
   * Nocturnal predators (WOLF) become active at night.
   * Villagers (Society + Movement) should sleep during night.
   */
  getEntityActivityModifier(entityId: string): {
    speedMultiplier: number;
    shouldSleep: boolean;
    isHunting: boolean;
  } {
    const state = this.getState();
    const fauna = this.ecs.getComponent<Fauna>(entityId, 'fauna');
    const society = this.ecs.getComponent<Society>(entityId, 'society');
    const movement = this.ecs.getComponent<Movement>(entityId, 'movement');

    if (fauna) {
      const isNocturnal = fauna.category === 'WOLF';
      if (state.isNight) {
        return {
          speedMultiplier: isNocturnal ? 1.3 : 0.6,
          shouldSleep: !isNocturnal,
          isHunting: isNocturnal && fauna.hunger > 30,
        };
      }
      return {
        speedMultiplier: isNocturnal ? 0.7 : 1.0,
        shouldSleep: isNocturnal,
        isHunting: false,
      };
    }

    if (society && movement) {
      const sleepStart = 1200; // 8 PM
      const sleepEnd = 300; // 5 AM
      const shouldSleep = state.timeOfDayMinutes >= sleepStart || state.timeOfDayMinutes <= sleepEnd;
      return {
        speedMultiplier: shouldSleep ? 0.2 : 1.0,
        shouldSleep,
        isHunting: false,
      };
    }

    return { speedMultiplier: 1.0, shouldSleep: false, isHunting: false };
  }

  /** Apply time-of-day behavior changes to all applicable ECS entities. */
  applyEntityBehaviorChanges(): void {
    const faunaIds = this.ecs.getEntitiesWith(['fauna']);
    for (const id of faunaIds) {
      const mod = this.getEntityActivityModifier(id);
      const fauna = this.ecs.getComponent<Fauna>(id, 'fauna');
      if (!fauna) continue;
      // Update action state based on time-of-day rules
      if (mod.shouldSleep && fauna.actionState !== 'WANDERING') {
        fauna.actionState = 'WANDERING';
      }
      if (mod.isHunting) {
        fauna.actionState = 'HUNTING';
      }
    }

    const societyIds = this.ecs.getEntitiesWith(['society', 'movement']);
    for (const id of societyIds) {
      const mod = this.getEntityActivityModifier(id);
      const movement = this.ecs.getComponent<Movement>(id, 'movement');
      if (!movement) continue;
      movement.speed = Math.max(0.1, movement.speed * mod.speedMultiplier);
      if (mod.shouldSleep) {
        movement.activityState = 'IDLE';
      }
    }
  }
}
