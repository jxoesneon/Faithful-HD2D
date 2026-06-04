import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import {
  MissionaryManager,
  BASE_CONVERSION_RATE,
  CONVERSION_RANGE,
  HOLY_WAR_THRESHOLD,
  SCHISM_RISK_ON_CONVERSION,
} from '../missionary';
import {
  Position,
  Faith,
  Society,
  Dogma,
  Missionary,
} from '../../../types';

describe('MissionaryManager', () => {
  let mgr: MissionaryManager;
  let ecs: ECS;

  beforeEach(() => {
    mgr = new MissionaryManager();
    ecs = new ECS();
  });

  function createTribe(
    x: number,
    y: number,
    dominantSystem: string,
    population = 20,
    beliefMatrix?: Record<string, number>
  ) {
    const ent = ecs.createEntity();
    ecs.addComponent(ent, { type: 'position', x, y, z: 0 } as Position);
    ecs.addComponent(ent, {
      type: 'faith',
      devotion: 30,
      dominantSystem: dominantSystem as any,
      beliefMatrix: beliefMatrix ?? {
        ANIMISM: dominantSystem === 'ANIMISM' ? 80 : 0,
        ELEMENTALISM: dominantSystem === 'ELEMENTALISM' ? 80 : 0,
        INTERVENTIONIST: dominantSystem === 'INTERVENTIONIST' ? 80 : 0,
        SECULAR: dominantSystem === 'SECULAR' ? 80 : 0,
        NIHILISM: dominantSystem === 'NIHILISM' ? 80 : 0,
      },
    } as Faith);
    ecs.addComponent(ent, {
      type: 'society',
      name: 'Tribe',
      faction: 'ANIMIST',
      population,
      technologyLevel: 1,
      resources: 100,
      happiness: 60,
    } as Society);
    return ent;
  }

  it('initialises with empty conversion events', () => {
    expect(mgr.conversionEvents).toEqual([]);
    expect(mgr.tickCount).toBe(0);
  });

  it('spawns a missionary component', () => {
    const ent = ecs.createEntity();
    mgr.spawnMissionary(ent, ecs, 'INTERVENTIONIST', 80, null);
    const mis = ecs.getComponent<Missionary>(ent, 'missionary');
    expect(mis).toBeDefined();
    expect(mis!.originFaith).toBe('INTERVENTIONIST');
    expect(mis!.piety).toBe(80);
    expect(mis!.conversionProgress).toBe(0);
  });

  it('spawnMissionary updates an existing missionary', () => {
    const ent = ecs.createEntity();
    mgr.spawnMissionary(ent, ecs, 'ANIMISM', 50, 'target-1');
    mgr.spawnMissionary(ent, ecs, 'NIHILISM', 90, 'target-2');
    const mis = ecs.getComponent<Missionary>(ent, 'missionary')!;
    expect(mis.originFaith).toBe('NIHILISM');
    expect(mis.piety).toBe(90);
    expect(mis.targetEntity).toBe('target-2');
  });

  it('assignTarget updates missionary target', () => {
    const ent = ecs.createEntity();
    mgr.spawnMissionary(ent, ecs, 'ANIMISM', 70, null);
    expect(mgr.assignTarget(ent, 'new-target', ecs)).toBe(true);
    expect(ecs.getComponent<Missionary>(ent, 'missionary')!.targetEntity).toBe('new-target');
  });

  it('assignTarget returns false for non-missionary', () => {
    const ent = ecs.createEntity();
    expect(mgr.assignTarget(ent, 't', ecs)).toBe(false);
  });

  it('calculates resistance based on native faith strength', () => {
    const tribe = createTribe(0, 0, 'ANIMISM', 50, {
      ANIMISM: 100,
      ELEMENTALISM: 0,
      INTERVENTIONIST: 0,
      SECULAR: 0,
      NIHILISM: 0,
    });
    expect(mgr.calculateResistance(tribe, ecs)).toBeGreaterThan(0.4);
  });

  it('calculates lower resistance for doubting populations', () => {
    const tribe = createTribe(0, 0, 'ANIMISM', 10, {
      ANIMISM: 10,
      ELEMENTALISM: 30,
      INTERVENTIONIST: 10,
      SECULAR: 10,
      NIHILISM: 10,
    });
    expect(mgr.calculateResistance(tribe, ecs)).toBeLessThan(0.5);
  });

  it('resistance increases with population (cultural inertia)', () => {
    const small = createTribe(0, 0, 'ANIMISM', 5);
    const large = createTribe(0, 0, 'ANIMISM', 200);
    expect(mgr.calculateResistance(large, ecs)).toBeGreaterThan(
      mgr.calculateResistance(small, ecs)
    );
  });

  it('resistance boosted by meaninglessness tenet', () => {
    const tribe = createTribe(0, 0, 'ANIMISM', 20);
    ecs.addComponent(tribe, { type: 'dogma', tenets: ['meaninglessness'], schismRisk: 0 } as Dogma);
    const base = mgr.calculateResistance(tribe, ecs);

    const tribe2 = createTribe(1, 1, 'ANIMISM', 20);
    const without = mgr.calculateResistance(tribe2, ecs);
    expect(base).toBeGreaterThan(without);
  });

  it('applies conversion pressure when in range', () => {
    const target = createTribe(0, 0, 'ANIMISM', 10);
    const misEnt = ecs.createEntity();
    ecs.addComponent(misEnt, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    mgr.spawnMissionary(misEnt, ecs, 'INTERVENTIONIST', 100, target);

    mgr.applyConversionPressure(misEnt, target, 1.0, ecs);
    const mis = ecs.getComponent<Missionary>(misEnt, 'missionary')!;
    expect(mis.conversionProgress).toBeGreaterThan(0);
  });

  it('does not apply conversion pressure out of range', () => {
    const target = createTribe(0, 0, 'ANIMISM', 10);
    const misEnt = ecs.createEntity();
    ecs.addComponent(misEnt, { type: 'position', x: 100, y: 100, z: 0 } as Position);
    mgr.spawnMissionary(misEnt, ecs, 'INTERVENTIONIST', 100, target);

    mgr.applyConversionPressure(misEnt, target, 1.0, ecs);
    expect(ecs.getComponent<Missionary>(misEnt, 'missionary')!.conversionProgress).toBe(0);
  });

  it('completes conversion and changes dominant faith', () => {
    const target = createTribe(0, 0, 'ANIMISM', 10);
    const misEnt = ecs.createEntity();
    ecs.addComponent(misEnt, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    mgr.spawnMissionary(misEnt, ecs, 'INTERVENTIONIST', 100, target);
    ecs.getComponent<Missionary>(misEnt, 'missionary')!.conversionProgress = 1.0;

    mgr.completeConversion(misEnt, target, ecs);
    const faith = ecs.getComponent<Faith>(target, 'faith')!;
    expect(faith.dominantSystem).toBe('INTERVENTIONIST');
    expect(mgr.conversionEvents.length).toBe(1);
  });

  it('erodes old belief on conversion', () => {
    const target = createTribe(0, 0, 'ANIMISM', 10);
    const misEnt = ecs.createEntity();
    ecs.addComponent(misEnt, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    mgr.spawnMissionary(misEnt, ecs, 'ELEMENTALISM', 100, target);
    ecs.getComponent<Missionary>(misEnt, 'missionary')!.conversionProgress = 1.0;

    mgr.completeConversion(misEnt, target, ecs);
    const faith = ecs.getComponent<Faith>(target, 'faith')!;
    expect(faith.beliefMatrix['ANIMISM']).toBeLessThan(80);
  });

  it('resets missionary after conversion', () => {
    const target = createTribe(0, 0, 'ANIMISM', 10);
    const misEnt = ecs.createEntity();
    ecs.addComponent(misEnt, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    mgr.spawnMissionary(misEnt, ecs, 'INTERVENTIONIST', 100, target);
    ecs.getComponent<Missionary>(misEnt, 'missionary')!.conversionProgress = 1.0;

    mgr.completeConversion(misEnt, target, ecs);
    const mis = ecs.getComponent<Missionary>(misEnt, 'missionary')!;
    expect(mis.conversionProgress).toBe(0);
    expect(mis.targetEntity).toBeNull();
  });

  it('applySchismRisk bumps dogma schismRisk', () => {
    const tribe = createTribe(0, 0, 'ANIMISM', 20);
    ecs.addComponent(tribe, { type: 'dogma', tenets: [], schismRisk: 10 } as Dogma);
    mgr.applySchismRisk(tribe, 15, ecs);
    expect(ecs.getComponent<Dogma>(tribe, 'dogma')!.schismRisk).toBe(25);
  });

  it('forced conversion adds schism risk', () => {
    const target = createTribe(0, 0, 'ANIMISM', 100); // high resistance -> forced
    ecs.addComponent(target, { type: 'dogma', tenets: [], schismRisk: 0 } as Dogma);
    const misEnt = ecs.createEntity();
    ecs.addComponent(misEnt, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    mgr.spawnMissionary(misEnt, ecs, 'INTERVENTIONIST', 100, target);
    ecs.getComponent<Missionary>(misEnt, 'missionary')!.conversionProgress = 1.0;

    mgr.completeConversion(misEnt, target, ecs);
    expect(ecs.getComponent<Dogma>(target, 'dogma')!.schismRisk).toBeGreaterThanOrEqual(
      SCHISM_RISK_ON_CONVERSION
    );
  });

  it('checkHolyWarThreshold triggers after enough conversions', () => {
    expect(mgr.checkHolyWarThreshold()).toBe(false);
    for (let i = 0; i < HOLY_WAR_THRESHOLD; i++) {
      mgr.conversionEvents.push({ entity: `e${i}`, oldFaith: 'ANIMISM', newFaith: 'INTERVENTIONIST', tick: mgr.tickCount, wasForced: true });
    }
    expect(mgr.checkHolyWarThreshold()).toBe(true);
  });

  it('purges old conversion events', () => {
    mgr.conversionEvents.push({ entity: 'old', oldFaith: 'ANIMISM', newFaith: 'INTERVENTIONIST', tick: -9999, wasForced: true });
    mgr.tick(1.0, ecs);
    expect(mgr.conversionEvents.length).toBe(0);
  });

  it('getHolyWarCandidates finds societies sharing the old faith', () => {
    const a = createTribe(0, 0, 'ANIMISM', 20);
    const b = createTribe(1, 1, 'ANIMISM', 20);
    const target = createTribe(2, 2, 'ANIMISM', 10);
    const misEnt = ecs.createEntity();
    ecs.addComponent(misEnt, { type: 'position', x: 2, y: 2, z: 0 } as Position);
    mgr.spawnMissionary(misEnt, ecs, 'INTERVENTIONIST', 100, target);
    ecs.getComponent<Missionary>(misEnt, 'missionary')!.conversionProgress = 1.0;
    mgr.completeConversion(misEnt, target, ecs);

    const candidates = mgr.getHolyWarCandidates(ecs);
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates.some((c) => c.entity === a || c.entity === b)).toBe(true);
  });

  it('tick moves missionary toward target and converts', () => {
    const target = createTribe(10, 0, 'ANIMISM', 10);
    const misEnt = ecs.createEntity();
    ecs.addComponent(misEnt, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    mgr.spawnMissionary(misEnt, ecs, 'INTERVENTIONIST', 100, target);

    // Run enough ticks to close the distance and convert
    for (let i = 0; i < 200; i++) {
      mgr.tick(1.0, ecs);
    }

    const faith = ecs.getComponent<Faith>(target, 'faith')!;
    expect(faith.dominantSystem).toBe('INTERVENTIONIST');
  });

  it('getMissionaries returns only missionary entities', () => {
    const m1 = ecs.createEntity();
    mgr.spawnMissionary(m1, ecs, 'ANIMISM', 50, null);
    const m2 = ecs.createEntity();
    mgr.spawnMissionary(m2, ecs, 'ELEMENTALISM', 60, null);
    ecs.createEntity(); // non-missionary

    expect(mgr.getMissionaries(ecs).length).toBe(2);
  });

  it('getConversionProgress reads from component', () => {
    const ent = ecs.createEntity();
    mgr.spawnMissionary(ent, ecs, 'ANIMISM', 70, null);
    ecs.getComponent<Missionary>(ent, 'missionary')!.conversionProgress = 0.45;
    expect(mgr.getConversionProgress(ent, ecs)).toBe(0.45);
  });
});
