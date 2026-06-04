import { ECS } from '../ecs';
import {
  Season,
  SeasonState,
  Flora,
  Fauna,
} from '../../types';

const SEASONS: Season[] = ['SPRING', 'SUMMER', 'FALL', 'WINTER'];
const SEASON_DURATION_DAYS = 5;
const DAYS_PER_YEAR = SEASONS.length * SEASON_DURATION_DAYS; // 20

/** Seasonal foliage colors in RGB 0-1. */
const FOLIAGE_COLORS: Record<Season, [number, number, number]> = {
  SPRING: [0.35, 0.85, 0.35],
  SUMMER: [0.2, 0.7, 0.1],
  FALL: [0.85, 0.55, 0.2],
  WINTER: [0.9, 0.9, 0.95],
};

const SNOW_COVER: Record<Season, number> = {
  SPRING: 0.1,
  SUMMER: 0.0,
  FALL: 0.15,
  WINTER: 0.8,
};

const DRY_GRASS: Record<Season, number> = {
  SPRING: 0.1,
  SUMMER: 0.6,
  FALL: 0.3,
  WINTER: 0.0,
};

const CROP_GROWTH: Record<Season, number> = {
  SPRING: 1.2,
  SUMMER: 1.0,
  FALL: 0.8,
  WINTER: 0.3,
};

const FOOD_SCARCITY: Record<Season, number> = {
  SPRING: 0.8,
  SUMMER: 1.0,
  FALL: 0.7,
  WINTER: 1.5,
};

const MIGRATION: Record<Season, number> = {
  SPRING: 0.3,
  SUMMER: 0.05,
  FALL: 0.4,
  WINTER: 0.1,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

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

/**
 * Manages the seasonal cycle.
 * Each season lasts ~5 game days. Produces visual and gameplay modifiers.
 */
export class SeasonManager {
  constructor(private ecs: ECS) {}

  /** Build a state snapshot from the current game day. */
  getState(gameDay: number): SeasonState {
    const dayInYear = gameDay % DAYS_PER_YEAR;
    const seasonIndex = Math.floor(dayInYear / SEASON_DURATION_DAYS);
    const currentSeason = SEASONS[clamp(seasonIndex, 0, SEASONS.length - 1)];
    const daysIntoSeason = dayInYear % SEASON_DURATION_DAYS;
    const seasonProgress = daysIntoSeason / SEASON_DURATION_DAYS;

    // Smoothly interpolate foliage color toward next season
    const nextSeason = SEASONS[(seasonIndex + 1) % SEASONS.length];
    const foliageColor = lerpColor(
      FOLIAGE_COLORS[currentSeason],
      FOLIAGE_COLORS[nextSeason],
      seasonProgress
    );

    return {
      currentSeason,
      seasonProgress,
      daysIntoSeason,
      foliageColor,
      snowCoverProbability: SNOW_COVER[currentSeason],
      dryGrassProbability: DRY_GRASS[currentSeason],
      cropGrowthMultiplier: CROP_GROWTH[currentSeason],
      foodScarcityMultiplier: FOOD_SCARCITY[currentSeason],
      animalMigrationProbability: MIGRATION[currentSeason],
    };
  }

  /** Update flora and fauna ECS components with seasonal modifiers. */
  applySeasonalEffects(gameDay: number): void {
    const state = this.getState(gameDay);

    const floraIds = this.ecs.getEntitiesWith(['flora']);
    for (const id of floraIds) {
      const flora = this.ecs.getComponent<Flora>(id, 'flora');
      if (!flora) continue;
      // Winter slows growth; Spring accelerates it
      if (state.currentSeason === 'WINTER') {
        flora.growth = Math.max(0, flora.growth - 0.02);
      } else if (state.currentSeason === 'SPRING') {
        flora.growth = Math.min(100, flora.growth + 0.05);
      }
    }

    const faunaIds = this.ecs.getEntitiesWith(['fauna']);
    for (const id of faunaIds) {
      const fauna = this.ecs.getComponent<Fauna>(id, 'fauna');
      if (!fauna) continue;
      // Winter increases hunger; Fall increases aggression (preparation)
      if (state.currentSeason === 'WINTER') {
        fauna.hunger = Math.min(100, fauna.hunger + 0.03);
      } else if (state.currentSeason === 'FALL') {
        fauna.aggressiveness = Math.min(100, fauna.aggressiveness + 0.02);
      }
    }
  }

  /** Predict the season for a given future game day. */
  predictSeason(futureGameDay: number): SeasonState {
    return this.getState(futureGameDay);
  }

  /** Get the number of game days remaining in the current season. */
  getDaysRemainingInSeason(gameDay: number): number {
    const dayInYear = gameDay % DAYS_PER_YEAR;
    const daysIntoSeason = dayInYear % SEASON_DURATION_DAYS;
    return SEASON_DURATION_DAYS - daysIntoSeason;
  }
}
