import { ECS } from '../ecs';
import {
  WeatherType,
  WeatherEffects,
  WeatherPrediction,
  Flora,
  Fauna,
  Movement,
} from '../../types';

const ALL_WEATHER: WeatherType[] = ['CLEAR', 'RAINY', 'DROUGHT', 'TEMPEST', 'AURORA'];

const BASE_EFFECTS: Record<WeatherType, WeatherEffects> = {
  CLEAR: {
    cropGrowthModifier: 1.0,
    humidityModifier: 0.0,
    movementSpeedModifier: 1.0,
    fireRiskModifier: 0.0,
    devotionGenerationModifier: 1.0,
    entityDamageChance: 0.0,
  },
  RAINY: {
    cropGrowthModifier: 1.2,
    humidityModifier: 0.1,
    movementSpeedModifier: 0.9,
    fireRiskModifier: -0.3,
    devotionGenerationModifier: 1.0,
    entityDamageChance: 0.0,
  },
  DROUGHT: {
    cropGrowthModifier: 0.7,
    humidityModifier: -0.5,
    movementSpeedModifier: 1.0,
    fireRiskModifier: 0.3,
    devotionGenerationModifier: 1.0,
    entityDamageChance: 0.0,
  },
  TEMPEST: {
    cropGrowthModifier: 0.7,
    humidityModifier: 0.2,
    movementSpeedModifier: 0.7,
    fireRiskModifier: 0.05,
    devotionGenerationModifier: 1.0,
    entityDamageChance: 0.02,
  },
  AURORA: {
    cropGrowthModifier: 1.0,
    humidityModifier: 0.0,
    movementSpeedModifier: 1.0,
    fireRiskModifier: 0.0,
    devotionGenerationModifier: 1.5,
    entityDamageChance: 0.0,
  },
};

const TRANSITION_DURATION_MINUTES = 10; // game minutes to fully switch weather

/** Probabilistic weather transition matrix (current -> next weights). */
const WEATHER_TRANSITION_WEIGHTS: Record<WeatherType, Partial<Record<WeatherType, number>>> = {
  CLEAR: { RAINY: 0.4, DROUGHT: 0.2, TEMPEST: 0.1, AURORA: 0.1 },
  RAINY: { CLEAR: 0.5, TEMPEST: 0.3, DROUGHT: 0.1 },
  DROUGHT: { CLEAR: 0.5, RAINY: 0.3, TEMPEST: 0.1 },
  TEMPEST: { CLEAR: 0.6, RAINY: 0.3, DROUGHT: 0.1 },
  AURORA: { CLEAR: 0.8, RAINY: 0.1, TEMPEST: 0.1 },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Manages weather transitions, gameplay effects, and predictions.
 * Weather changes gradually rather than instantly.
 */
export class WeatherManager {
  private currentWeather: WeatherType = 'CLEAR';
  private targetWeather: WeatherType = 'CLEAR';
  private transitionProgress = 0; // 0-1, how far into the current transition
  private weatherTimer = 45; // game minutes remaining in current/target weather
  private weatherIntensity = 0.5; // 0-1

  constructor(private ecs: ECS) {}

  /** Advance weather state by `dt` game minutes. */
  update(dt: number): void {
    if (this.currentWeather !== this.targetWeather) {
      this.transitionProgress += dt / TRANSITION_DURATION_MINUTES;
      if (this.transitionProgress >= 1) {
        this.currentWeather = this.targetWeather;
        this.transitionProgress = 0;
      }
    }

    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.pickNewWeather();
      this.weatherTimer = 30 + Math.random() * 60; // 30-90 minutes
    }
  }

  /** Force a weather change with optional duration and intensity. */
  setWeather(weather: WeatherType, durationMinutes = 45, intensity = 0.5): void {
    if (weather !== this.currentWeather) {
      this.targetWeather = weather;
      this.transitionProgress = 0;
    } else {
      this.targetWeather = weather;
      this.transitionProgress = 1;
    }
    this.weatherTimer = durationMinutes;
    this.weatherIntensity = clamp(intensity, 0, 1);
  }

  /** Apply weather manipulation spell (player intervention hook). */
  castWeatherSpell(spellType: 'CALM' | 'STORM' | 'RAIN_DANCE' | 'DRY_SPELL' | 'INVOKE_AURORA'): boolean {
    switch (spellType) {
      case 'CALM':
        this.setWeather('CLEAR', 60, 0.3);
        return true;
      case 'STORM':
        this.setWeather('TEMPEST', 30, 0.8);
        return true;
      case 'RAIN_DANCE':
        this.setWeather('RAINY', 60, 0.6);
        return true;
      case 'DRY_SPELL':
        this.setWeather('DROUGHT', 45, 0.7);
        return true;
      case 'INVOKE_AURORA':
        this.setWeather('AURORA', 20, 1.0);
        return true;
      default:
        return false;
    }
  }

  /** Get interpolated gameplay effects for the current transition state. */
  getCurrentEffects(): WeatherEffects {
    const from = BASE_EFFECTS[this.currentWeather];
    const to = BASE_EFFECTS[this.targetWeather];
    const t = this.transitionProgress;

    const intensityMultiplier = 0.5 + this.weatherIntensity * 0.5;

    return {
      cropGrowthModifier: lerp(from.cropGrowthModifier, to.cropGrowthModifier, t),
      humidityModifier: lerp(from.humidityModifier, to.humidityModifier, t) * intensityMultiplier,
      movementSpeedModifier: lerp(from.movementSpeedModifier, to.movementSpeedModifier, t),
      fireRiskModifier: lerp(from.fireRiskModifier, to.fireRiskModifier, t) * intensityMultiplier,
      devotionGenerationModifier: lerp(from.devotionGenerationModifier, to.devotionGenerationModifier, t),
      entityDamageChance: lerp(from.entityDamageChance, to.entityDamageChance, t) * this.weatherIntensity,
    };
  }

  /** Predict upcoming weather based on transition tendencies. */
  getWeatherPrediction(lookaheadMinutes = 30): WeatherPrediction {
    const weights = WEATHER_TRANSITION_WEIGHTS[this.targetWeather];
    let bestWeather: WeatherType = this.targetWeather;
    let bestWeight = -1;

    for (const [w, weight] of Object.entries(weights || {})) {
      if ((weight as number) > bestWeight) {
        bestWeight = weight as number;
        bestWeather = w as WeatherType;
      }
    }

    return {
      predictedWeather: bestWeather,
      confidence: bestWeight,
      timeUntil: this.weatherTimer + TRANSITION_DURATION_MINUTES,
    };
  }

  /** Get the raw current/target weather values (for UI/debug). */
  getWeatherStatus(): {
    current: WeatherType;
    target: WeatherType;
    transitionProgress: number;
    timer: number;
    intensity: number;
  } {
    return {
      current: this.currentWeather,
      target: this.targetWeather,
      transitionProgress: this.transitionProgress,
      timer: this.weatherTimer,
      intensity: this.weatherIntensity,
    };
  }

  /** Apply weather effects directly to ECS entities (movement speed, crop growth). */
  applyWeatherEffectsToEntities(): void {
    const effects = this.getCurrentEffects();

    // Flora crop growth modifier
    const floraIds = this.ecs.getEntitiesWith(['flora']);
    for (const id of floraIds) {
      const flora = this.ecs.getComponent<Flora>(id, 'flora');
      if (!flora) continue;
      if (flora.category === 'CROP' && !flora.isHarvested) {
        flora.growth = clamp(flora.growth + (effects.cropGrowthModifier - 1) * 0.1, 0, 100);
      }
      // Drought drains moisture
      if (this.currentWeather === 'DROUGHT' || this.targetWeather === 'DROUGHT') {
        flora.soilMoisture = clamp((flora.soilMoisture ?? 50) - 0.1, 0, 100);
      }
      // Rain restores moisture
      if (this.currentWeather === 'RAINY' || this.targetWeather === 'RAINY') {
        flora.soilMoisture = clamp((flora.soilMoisture ?? 50) + 0.05, 0, 100);
      }
    }

    // Fauna movement speed modifier
    const faunaIds = this.ecs.getEntitiesWith(['fauna', 'movement']);
    for (const id of faunaIds) {
      const movement = this.ecs.getComponent<Movement>(id, 'movement');
      if (!movement) continue;
      movement.speed = clamp(movement.speed * effects.movementSpeedModifier, 0.1, 10);
    }

    // Entity damage from TEMPEST
    if (effects.entityDamageChance > 0) {
      const allFauna = this.ecs.getEntitiesWith(['fauna']);
      for (const id of allFauna) {
        const fauna = this.ecs.getComponent<Fauna>(id, 'fauna');
        if (!fauna) continue;
        if (Math.random() < effects.entityDamageChance) {
          fauna.health = clamp(fauna.health - 1, 0, 100);
        }
      }
    }
  }

  private pickNewWeather(): void {
    const weights = WEATHER_TRANSITION_WEIGHTS[this.currentWeather];
    const entries = Object.entries(weights || {});
    const total = entries.reduce((sum, [, w]) => sum + (w as number), 0);
    let roll = Math.random() * total;

    for (const [w, weight] of entries) {
      roll -= weight as number;
      if (roll <= 0) {
        this.setWeather(w as WeatherType, 30 + Math.random() * 60, 0.3 + Math.random() * 0.7);
        return;
      }
    }

    // Fallback
    this.setWeather('CLEAR', 45, 0.5);
  }
}
