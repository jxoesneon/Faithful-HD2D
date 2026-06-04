import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { WeatherManager } from '../weather';
import { Flora, Fauna, Movement, Position } from '../../../types';

describe('WeatherManager', () => {
  let ecs: ECS;
  let manager: WeatherManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new WeatherManager(ecs);
  });

  it('starts with CLEAR weather', () => {
    const status = manager.getWeatherStatus();
    expect(status.current).toBe('CLEAR');
    expect(status.target).toBe('CLEAR');
  });

  it('sets weather directly', () => {
    manager.setWeather('RAINY', 60, 0.8);
    const status = manager.getWeatherStatus();
    expect(status.target).toBe('RAINY');
    expect(status.timer).toBe(60);
    expect(status.intensity).toBe(0.8);
  });

  it('transitions weather gradually', () => {
    manager.setWeather('RAINY', 60, 0.5);
    expect(manager.getWeatherStatus().current).toBe('CLEAR');
    manager.update(5); // 5 game minutes
    const status = manager.getWeatherStatus();
    expect(status.transitionProgress).toBeGreaterThan(0);
    expect(status.transitionProgress).toBeLessThan(1);
  });

  it('completes transition after duration', () => {
    manager.setWeather('RAINY', 60, 0.5);
    manager.update(15); // exceed 10-min transition
    const status = manager.getWeatherStatus();
    expect(status.current).toBe('RAINY');
    expect(status.transitionProgress).toBe(0);
  });

  it('returns baseline effects for CLEAR', () => {
    manager.setWeather('CLEAR', 10, 0.5);
    manager.update(15);
    const effects = manager.getCurrentEffects();
    expect(effects.cropGrowthModifier).toBe(1.0);
    expect(effects.movementSpeedModifier).toBe(1.0);
  });

  it('returns rainy effects', () => {
    manager.setWeather('RAINY', 10, 1.0);
    manager.update(15);
    const effects = manager.getCurrentEffects();
    expect(effects.cropGrowthModifier).toBeGreaterThan(1.0);
    expect(effects.humidityModifier).toBeGreaterThan(0);
    expect(effects.movementSpeedModifier).toBeLessThan(1.0);
  });

  it('returns drought effects', () => {
    manager.setWeather('DROUGHT', 10, 1.0);
    manager.update(15);
    const effects = manager.getCurrentEffects();
    expect(effects.cropGrowthModifier).toBeLessThan(1.0);
    expect(effects.humidityModifier).toBeLessThan(0);
    expect(effects.fireRiskModifier).toBeGreaterThan(0);
  });

  it('returns tempest damage chance', () => {
    manager.setWeather('TEMPEST', 10, 1.0);
    manager.update(15);
    const effects = manager.getCurrentEffects();
    expect(effects.entityDamageChance).toBeGreaterThan(0);
  });

  it('returns aurora devotion boost', () => {
    manager.setWeather('AURORA', 10, 1.0);
    manager.update(15);
    const effects = manager.getCurrentEffects();
    expect(effects.devotionGenerationModifier).toBeGreaterThan(1.0);
  });

  it('interpolates effects during transition', () => {
    manager.setWeather('RAINY', 60, 0.5);
    manager.update(5); // halfway through 10-min transition
    const effects = manager.getCurrentEffects();
    expect(effects.cropGrowthModifier).toBeGreaterThan(1.0);
    expect(effects.cropGrowthModifier).toBeLessThan(1.2);
  });

  it('predicts next weather from transition matrix', () => {
    manager.setWeather('CLEAR', 60, 0.5);
    manager.update(15);
    const prediction = manager.getWeatherPrediction();
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.timeUntil).toBeGreaterThan(0);
    expect(['CLEAR', 'RAINY', 'DROUGHT', 'TEMPEST', 'AURORA']).toContain(prediction.predictedWeather);
  });

  it('casts weather spells', () => {
    expect(manager.castWeatherSpell('STORM')).toBe(true);
    expect(manager.getWeatherStatus().target).toBe('TEMPEST');

    expect(manager.castWeatherSpell('RAIN_DANCE')).toBe(true);
    expect(manager.getWeatherStatus().target).toBe('RAINY');

    expect(manager.castWeatherSpell('DRY_SPELL')).toBe(true);
    expect(manager.getWeatherStatus().target).toBe('DROUGHT');

    expect(manager.castWeatherSpell('INVOKE_AURORA')).toBe(true);
    expect(manager.getWeatherStatus().target).toBe('AURORA');

    expect(manager.castWeatherSpell('CALM')).toBe(true);
    expect(manager.getWeatherStatus().target).toBe('CLEAR');
  });

  it('returns false for unknown spell', () => {
    expect(manager.castWeatherSpell('UNKNOWN' as any)).toBe(false);
  });

  it('picks new weather when timer expires', () => {
    manager.setWeather('CLEAR', 0.1, 0.5);
    manager.update(1);
    const status = manager.getWeatherStatus();
    // After timer expires, it should have transitioned to something
    expect(status.timer).toBeGreaterThan(0);
  });

  describe('applyWeatherEffectsToEntities', () => {
    it('boosts crop growth in rain', () => {
      const floraId = ecs.createEntity();
      ecs.addComponent(floraId, {
        type: 'flora',
        category: 'CROP',
        subType: 'wheat',
        growth: 50,
        resourcesYield: 10,
        isHarvested: false,
        soilMoisture: 50,
        soilNutrients: 50,
      } as Flora);
      ecs.addComponent(floraId, {
        type: 'position',
        x: 0,
        y: 0,
        z: 0,
      } as Position);

      manager.setWeather('RAINY', 60, 1.0);
      manager.update(15);
      manager.applyWeatherEffectsToEntities();
      const flora = ecs.getComponent<Flora>(floraId, 'flora');
      expect(flora!.soilMoisture).toBeGreaterThan(50);
    });

    it('drains moisture in drought', () => {
      const floraId = ecs.createEntity();
      ecs.addComponent(floraId, {
        type: 'flora',
        category: 'CROP',
        subType: 'wheat',
        growth: 50,
        resourcesYield: 10,
        isHarvested: false,
        soilMoisture: 50,
        soilNutrients: 50,
      } as Flora);
      ecs.addComponent(floraId, {
        type: 'position',
        x: 0,
        y: 0,
        z: 0,
      } as Position);

      manager.setWeather('DROUGHT', 60, 1.0);
      manager.update(15);
      manager.applyWeatherEffectsToEntities();
      const flora = ecs.getComponent<Flora>(floraId, 'flora');
      expect(flora!.soilMoisture).toBeLessThan(50);
    });

    it('slows fauna movement in tempest', () => {
      const faunaId = ecs.createEntity();
      ecs.addComponent(faunaId, {
        type: 'fauna',
        category: 'STAG',
        subType: 'red',
        health: 100,
        hunger: 10,
        aggressiveness: 10,
        actionState: 'WANDERING',
      } as Fauna);
      ecs.addComponent(faunaId, {
        type: 'movement',
        speed: 2.0,
        vx: 0,
        vy: 0,
        targetX: null,
        targetY: null,
        activityState: 'WANDERING',
      } as Movement);

      manager.setWeather('TEMPEST', 60, 1.0);
      manager.update(15);
      manager.applyWeatherEffectsToEntities();
      const movement = ecs.getComponent<Movement>(faunaId, 'movement');
      expect(movement!.speed).toBeLessThan(2.0);
    });
  });
});
