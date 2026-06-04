import { describe, it, expect } from 'vitest';
import {
  FaithFogManager,
  FAITH_COLORS,
  ShrineManager,
  DEFAULT_SHRINE_RADIUS,
  DEFAULT_SHRINE_STRENGTH,
  SACRED_GROUND_MULTIPLIER,
  PietyManager,
  PRAYER_TYPE_BONUS,
  DEFAULT_PRAYER_COOLDOWN,
  MASS_PRAYER_COOLDOWN,
  CRISIS_OF_FAITH_PENALTY,
  ANSWERED_PRAYER_BOOST,
  DogmaManager,
  TENETS,
  TENET_MAP,
  MissionaryManager,
  BASE_CONVERSION_RATE,
  CONVERSION_RANGE,
  MISSIONARY_SPEED,
  HOLY_WAR_THRESHOLD,
  HOLY_WAR_WINDOW,
  SCHISM_RISK_ON_CONVERSION,
} from '../index';

describe('faith/index exports', () => {
  it('exports FaithFogManager and constants', () => {
    expect(typeof FaithFogManager).toBe('function');
    expect(FAITH_COLORS.ANIMISM).toBeDefined();
  });

  it('exports ShrineManager and constants', () => {
    expect(typeof ShrineManager).toBe('function');
    expect(typeof DEFAULT_SHRINE_RADIUS).toBe('number');
    expect(typeof DEFAULT_SHRINE_STRENGTH).toBe('number');
    expect(typeof SACRED_GROUND_MULTIPLIER).toBe('number');
  });

  it('exports PietyManager and constants', () => {
    expect(typeof PietyManager).toBe('function');
    expect(PRAYER_TYPE_BONUS.petition).toBeDefined();
    expect(typeof DEFAULT_PRAYER_COOLDOWN).toBe('number');
    expect(typeof MASS_PRAYER_COOLDOWN).toBe('number');
    expect(typeof CRISIS_OF_FAITH_PENALTY).toBe('number');
    expect(typeof ANSWERED_PRAYER_BOOST).toBe('number');
  });

  it('exports DogmaManager and tenet database', () => {
    expect(typeof DogmaManager).toBe('function');
    expect(Array.isArray(TENETS)).toBe(true);
    expect(TENET_MAP.nature_reverence).toBeDefined();
  });

  it('exports MissionaryManager and constants', () => {
    expect(typeof MissionaryManager).toBe('function');
    expect(typeof BASE_CONVERSION_RATE).toBe('number');
    expect(typeof CONVERSION_RANGE).toBe('number');
    expect(typeof MISSIONARY_SPEED).toBe('number');
    expect(typeof HOLY_WAR_THRESHOLD).toBe('number');
    expect(typeof HOLY_WAR_WINDOW).toBe('number');
    expect(typeof SCHISM_RISK_ON_CONVERSION).toBe('number');
  });
});
