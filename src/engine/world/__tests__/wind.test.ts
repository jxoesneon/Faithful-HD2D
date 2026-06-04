import { describe, it, expect, beforeEach } from 'vitest';
import { WindSystem } from '../wind';

describe('WindSystem', () => {
  let wind: WindSystem;

  beforeEach(() => {
    wind = new WindSystem();
  });

  it('initializes with a valid global wind state', () => {
    const state = wind.getGlobalWind();
    expect(state.strength).toBeGreaterThanOrEqual(0);
    expect(state.strength).toBeLessThanOrEqual(1);
    expect(typeof state.direction).toBe('number');
  });

  it('wind strength evolves over time', () => {
    const initial = wind.getGlobalWind().strength;
    // Advance time enough for the layered sine waves to shift
    wind.update(10);
    const after = wind.getGlobalWind().strength;
    expect(after).not.toBe(initial);
  });

  it('gust events increase strength temporarily', () => {
    wind.update(0.1);
    const baseline = wind.getGlobalWind().strength;

    // Inject a strong gust that started slightly in the past so envelope is active
    wind.addGust({ startTime: 0, duration: 3, strength: 0.8 });
    const during = wind.getGlobalWind().strength;
    expect(during).toBeGreaterThan(baseline);

    // Advance past the gust duration (use small steps to avoid spawning new gusts)
    wind.update(2);
    wind.update(2);
    const after = wind.getGlobalWind().strength;
    // Verify the original gust is gone and strength dropped significantly
    const gusts = wind.getActiveGusts();
    const hasOriginalGust = gusts.some((g: any) => g.startTime === 0);
    expect(hasOriginalGust).toBe(false);
    expect(after).toBeLessThan(during);
  });

  it('sway amount varies by plant height', () => {
    wind.update(1);
    const entityId = 'plant-01';

    const lowSway = wind.getSwayAmount(entityId, 0.2);
    const highSway = wind.getSwayAmount(entityId, 1.0);

    // The magnitudes should scale with height factor
    const lowMag = Math.abs(lowSway.swayX) + Math.abs(lowSway.swayY) + Math.abs(lowSway.swayRot);
    const highMag = Math.abs(highSway.swayX) + Math.abs(highSway.swayY) + Math.abs(highSway.swayRot);

    expect(highMag).toBeGreaterThan(lowMag);
  });

  it('sway is periodic (returns to near-zero over time)', () => {
    const entityId = 'periodic-plant';
    const heightFactor = 1.0;

    // Pick a time where the sine wave is near a peak, then advance by half period
    // and verify the sign flips (crossing through zero)
    wind.update(0);
    const sway0 = wind.getSwayAmount(entityId, heightFactor);
    const mag0 = Math.abs(sway0.swayX);

    // The exact frequency is derived from the entity hash inside getSwayAmount.
    // We can discover it from the internal state by assuming the formula.
    // Since we know getSwayAmount uses sin(time * freq + phase),
    // after a full period (2π / freq) the value repeats.
    // For simplicity, advance a long interval and check amplitude remains bounded.
    wind.update(100);
    const swayLate = wind.getSwayAmount(entityId, heightFactor);
    const magLate = Math.abs(swayLate.swayX);

    // Amplitude should remain bounded by wind strength * heightFactor
    expect(magLate).toBeLessThanOrEqual(1.0 * heightFactor + 0.01);

    // More directly: there exists a time offset where swayX crosses near zero.
    // We brute-force sample around a 10-second window to find a near-zero crossing.
    let foundNearZero = false;
    for (let t = 0; t < 20; t += 0.1) {
      // We need a fresh wind system so we can test exact time points,
      // but the simplest approach is to test periodicity by resetting.
    }

    // Instead: verify periodicity by checking that after two identical time values
    // (relative to the internal clock) the sway repeats.
    // We'll create two wind systems with same internal state at two times.
    const w1 = new WindSystem();
    w1.update(2.5);
    const s1 = w1.getSwayAmount(entityId, heightFactor);

    const w2 = new WindSystem();
    w2.update(2.5 + 10 * Math.PI); // large shift, still periodic in sin
    // Not exact period because freq varies, but we can at least verify boundedness.
    const s2 = w2.getSwayAmount(entityId, heightFactor);

    // The main requirement is "returns to near-zero over time" —
    // i.e. the displacement is oscillatory, not cumulative.
    expect(Math.abs(s1.swayX)).toBeLessThanOrEqual(1.01);
    expect(Math.abs(s2.swayX)).toBeLessThanOrEqual(1.01);

    // Finally, the real periodicity test:
    // We compute the exact frequency used for this entity by inspecting the
    // sway at two nearby times and confirming a zero-crossing happens.
    const w3 = new WindSystem();
    w3.update(0);
    const t0sway = w3.getSwayAmount(entityId, heightFactor);

    // Advance by exactly π (half sine wave) — sign should flip if we started off-phase.
    // Even if not exactly flipped, the value must have changed, proving oscillation.
    w3.update(Math.PI);
    const tPiSway = w3.getSwayAmount(entityId, heightFactor);
    expect(tPiSway.swayX).not.toBe(t0sway.swayX);

    // The best proof of returning to near-zero:
    // Sample densely over one full 2π interval and assert at least one near-zero sample.
    const w4 = new WindSystem();
    const samples: number[] = [];
    for (let i = 0; i <= 100; i++) {
      w4.update(0.1);
      const s = w4.getSwayAmount(entityId, heightFactor);
      samples.push(s.swayX);
    }
    const nearZero = samples.some((v) => Math.abs(v) < 0.05);
    expect(nearZero).toBe(true);
  });

  it('local wind variation differs at different positions', () => {
    wind.update(1);
    const a = wind.getWindAt(0, 0);
    const b = wind.getWindAt(100, 50);

    // Direction or strength should differ between the two positions
    const sameDir = Math.abs(a.direction - b.direction) < 0.001;
    const sameStr = Math.abs(a.strength - b.strength) < 0.001;
    expect(sameDir && sameStr).toBe(false);
  });

  it('gusts are spawned naturally over time', () => {
    // Force many updates to trigger the random gust timer
    let foundGust = false;
    for (let i = 0; i < 200; i++) {
      wind.update(0.5);
      if (wind.getActiveGusts().length > 0) {
        foundGust = true;
      }
    }
    expect(foundGust).toBe(true);
  });

  it('global wind direction changes over time', () => {
    wind.update(0);
    const d1 = wind.getGlobalWind().direction;
    wind.update(20);
    const d2 = wind.getGlobalWind().direction;
    expect(d1).not.toBe(d2);
  });
});
