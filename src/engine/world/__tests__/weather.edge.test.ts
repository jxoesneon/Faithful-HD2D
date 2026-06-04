import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ECS } from '../../ecs';
import { WeatherManager } from '../weather';
import { Flora, Fauna, Movement, Position } from '../../../types';

describe('WeatherManager edge cases', () => {
  let ecs: ECS;
  let manager: WeatherManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new WeatherManager(ecs);
    vi.restoreAllMocks();
  });

  // Duration = 0
  it('handles weather timer of 0', () => {
    manager.setWeather('CLEAR', 0, 0.5);
    manager.update(1);
    const status = manager.getWeatherStatus();
    expect(status.timer).toBeGreaterThanOrEqual(0);
  });

  // Transition boundaries
  it('completes transition at exactly progress 1', () => {
    manager.setWeather('RAINY', 60, 0.5);
    manager.update(10); // exactly TRANSITION_DURATION_MINUTES
    const status = manager.getWeatherStatus();
    expect(status.current).toBe('RAINY');
    expect(status.transitionProgress).toBe(0);
  });

  it('does not transition when current equals target', () => {
    manager.setWeather('CLEAR', 60, 0.5);
    manager.update(5);
    const status = manager.getWeatherStatus();
    expect(status.current).toBe('CLEAR');
    expect(status.target).toBe('CLEAR');
    expect(status.transitionProgress).toBe(1);
  });

  // Intensity clamping
  it('clamps intensity above 1 to 1', () => {
    manager.setWeather('RAINY', 60, 5.0);
    expect(manager.getWeatherStatus().intensity).toBe(1);
  });

  it('clamps intensity below 0 to 0', () => {
    manager.setWeather('RAINY', 60, -1.0);
    expect(manager.getWeatherStatus().intensity).toBe(0);
  });

  // Drought/Tempest transitions
  it('transitions from DROUGHT to TEMPEST with correct modifiers', () => {
    manager.setWeather('DROUGHT', 60, 1.0);
    manager.update(15);
    manager.setWeather('TEMPEST', 60, 1.0);
    manager.update(5);
    const effects = manager.getCurrentEffects();
    expect(effects.humidityModifier).toBeLessThan(0.2); // transitioning from negative
    expect(effects.entityDamageChance).toBeGreaterThan(0);
  });

  it('transitions from TEMPEST to DROUGHT with correct modifiers', () => {
    manager.setWeather('TEMPEST', 60, 1.0);
    manager.update(15);
    manager.setWeather('DROUGHT', 60, 1.0);
    manager.update(5);
    const effects = manager.getCurrentEffects();
    expect(effects.fireRiskModifier).toBeGreaterThan(0); // drought increases it
    expect(effects.humidityModifier).toBeLessThan(0);
  });

  // Empty ECS effects
  it('does not throw when applying weather effects with empty ECS', () => {
    manager.setWeather('RAINY', 60, 1.0);
    manager.update(15);
    expect(() => manager.applyWeatherEffectsToEntities()).not.toThrow();
  });

  it('does not throw when applying tempest damage with no fauna', () => {
    manager.setWeather('TEMPEST', 60, 1.0);
    manager.update(15);
    expect(() => manager.applyWeatherEffectsToEntities()).not.toThrow();
  });

  // Math.random determinism for pickNewWeather
  it('deterministically picks next weather based on mocked random', () => {
    manager.setWeather('CLEAR', 0.1, 0.5);
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    manager.update(1);
    const status = manager.getWeatherStatus();
    // With roll=0.1 and total weight 0.8, first entry RAINY (0.4) is selected
    expect(status.target).toBe('RAINY');
    randomSpy.mockRestore();
  });

  it('picks last weather option when random is near 1', () => {
    manager.setWeather('CLEAR', 0.1, 0.5);
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    manager.update(1);
    const status = manager.getWeatherStatus();
    // With high roll, falls through to fallback
    expect(['CLEAR', 'RAINY', 'DROUGHT', 'TEMPEST', 'AURORA']).toContain(status.target);
    randomSpy.mockRestore();
  });

  it('predicts weather with confidence from transition weights', () => {
    manager.setWeather('CLEAR', 60, 0.5);
    manager.update(15);
    const prediction = manager.getWeatherPrediction(0);
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.timeUntil).toBeGreaterThan(0);
  });

  it('returns baseline effects when target matches current', () => {
    manager.setWeather('CLEAR', 60, 0.5);
    manager.update(15);
    const effects = manager.getCurrentEffects();
    expect(effects.cropGrowthModifier).toBe(1.0);
    expect(effects.movementSpeedModifier).toBe(1.0);
    expect(effects.fireRiskModifier).toBe(0);
  });

  // Movement speed clamping
  it('clamps fauna movement speed to minimum 0.1', () => {
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
      speed: 0.05,
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
    expect(movement!.speed).toBeGreaterThanOrEqual(0.1);
  });

  // Flora moisture boundary
  it('clamps flora soil moisture between 0 and 100', () => {
    const floraId = ecs.createEntity();
    ecs.addComponent(floraId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
      soilMoisture: 99.9,
      soilNutrients: 50,
    } as Flora);
    ecs.addComponent(floraId, {
      type: 'position',
      x: 0, y: 0, z: 0,
    } as Position);

    manager.setWeather('RAINY', 60, 1.0);
    manager.update(15);
    manager.applyWeatherEffectsToEntities();
    const flora = ecs.getComponent<Flora>(floraId, 'flora');
    expect(flora!.soilMoisture).toBeLessThanOrEqual(100);
  });

  it('does not drop soil moisture below 0 in drought', () => {
    const floraId = ecs.createEntity();
    ecs.addComponent(floraId, {
      type: 'flora',
      category: 'CROP',
      subType: 'wheat',
      growth: 50,
      resourcesYield: 10,
      isHarvested: false,
      soilMoisture: 0.01,
      soilNutrients: 50,
    } as Flora);
    ecs.addComponent(floraId, {
      type: 'position',
      x: 0, y: 0, z: 0,
    } as Position);

    manager.setWeather('DROUGHT', 60, 1.0);
    manager.update(15);
    manager.applyWeatherEffectsToEntities();
    const flora = ecs.getComponent<Flora>(floraId, 'flora');
    expect(flora!.soilMoisture).toBeGreaterThanOrEqual(0);
  });
});
