import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import {
  ShrineManager,
  DEFAULT_SHRINE_RADIUS,
  DEFAULT_SHRINE_STRENGTH,
  SACRED_GROUND_MULTIPLIER,
} from '../shrines';
import {
  Position,
  Structure,
  ShrineStatus,
  Faith,
  Society,
  Biology,
  Fauna,
  Flora,
} from '../../../types';

describe('ShrineManager', () => {
  let mgr: ShrineManager;
  let ecs: ECS;

  beforeEach(() => {
    mgr = new ShrineManager();
    ecs = new ECS();
  });

  function createAltar(x: number, y: number, faith: string = 'SECULAR', desecrated = false, radius?: number, strength?: number) {
    const ent = ecs.createEntity();
    ecs.addComponent(ent, { type: 'position', x, y, z: 0 } as Position);
    ecs.addComponent(ent, { type: 'structure', category: 'ALTAR', subType: 'shrine', durability: 100, efficiency: 1 } as Structure);
    if (radius !== undefined) {
      ecs.addComponent(ent, {
        type: 'shrineStatus',
        isDesecrated: desecrated,
        radius: radius,
        strength: strength ?? DEFAULT_SHRINE_STRENGTH,
        faithSystem: faith as any,
      } as ShrineStatus);
    }
    return ent;
  }

  it('finds ALTAR entities as shrines', () => {
    createAltar(5, 5);
    const shrines = mgr.getShrines(ecs);
    expect(shrines.length).toBe(1);
    expect(shrines[0].x).toBe(5);
    expect(shrines[0].radius).toBe(DEFAULT_SHRINE_RADIUS);
  });

  it('returns empty array when no altars exist', () => {
    expect(mgr.getShrines(ecs)).toEqual([]);
  });

  it('calculates influence at a point with distance falloff', () => {
    createAltar(0, 0, 'ANIMISM', false, 10, 2);
    const centre = mgr.getInfluenceAt(0, 0, 'ANIMISM', ecs);
    expect(centre.totalStrength).toBeGreaterThan(0);
    expect(centre.devotionBoost).toBeGreaterThan(0);

    const edge = mgr.getInfluenceAt(9, 0, 'ANIMISM', ecs);
    expect(edge.totalStrength).toBeLessThan(centre.totalStrength);
  });

  it('returns zero influence outside radius', () => {
    createAltar(0, 0, 'ANIMISM', false, 3, 1);
    const out = mgr.getInfluenceAt(10, 0, 'ANIMISM', ecs);
    expect(out.totalStrength).toBe(0);
    expect(out.devotionBoost).toBe(0);
  });

  it('identifies sacred ground from overlapping shrines', () => {
    createAltar(0, 0, 'ANIMISM', false, 6, 1);
    createAltar(2, 0, 'ANIMISM', false, 6, 1);
    const snap = mgr.getInfluenceAt(1, 0, 'ANIMISM', ecs);
    expect(snap.isSacredGround).toBe(true);
    expect(snap.isCursedGround).toBe(false);
  });

  it('identifies cursed ground when any shrine is desecrated', () => {
    createAltar(0, 0, 'ANIMISM', false, 6, 1);
    createAltar(2, 0, 'ANIMISM', true, 6, 1);
    const snap = mgr.getInfluenceAt(1, 0, 'ANIMISM', ecs);
    expect(snap.isCursedGround).toBe(true);
  });

  it('desecrates a shrine without an existing ShrineStatus', () => {
    const ent = createAltar(0, 0);
    mgr.desecrateShrine(ent, ecs);
    const shrines = mgr.getShrines(ecs);
    expect(shrines[0].isDesecrated).toBe(true);
  });

  it('consecrates a desecrated shrine', () => {
    const ent = createAltar(0, 0, 'ANIMISM', true, 5, 1);
    mgr.consecrateShrine(ent, ecs);
    expect(mgr.getShrines(ecs)[0].isDesecrated).toBe(false);
  });

  it('installs ShrineStatus on an ALTAR', () => {
    const ent = createAltar(3, 3);
    mgr.installShrineStatus(ent, ecs, 'ELEMENTALISM', 8, 2.5);
    const s = mgr.getShrines(ecs)[0];
    expect(s.faithSystem).toBe('ELEMENTALISM');
    expect(s.radius).toBe(8);
    expect(s.strength).toBe(2.5);
  });

  it('applies devotion boost to faithful entities inside radius', () => {
    const altar = createAltar(0, 0, 'ANIMISM', false, 5, 2);
    const follower = ecs.createEntity();
    ecs.addComponent(follower, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(follower, { type: 'faith', devotion: 10, dominantSystem: 'ANIMISM', beliefMatrix: { ANIMISM: 10, ELEMENTALISM: 0, INTERVENTIONIST: 0, SECULAR: 0, NIHILISM: 0 } } as Faith);

    mgr.tick(1.0, ecs);
    const f = ecs.getComponent<Faith>(follower, 'faith');
    expect(f!.devotion).toBeGreaterThan(10);
  });

  it('applies happiness and healing to society entities', () => {
    const altar = createAltar(0, 0, 'ANIMISM', false, 5, 2);
    const tribe = ecs.createEntity();
    ecs.addComponent(tribe, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(tribe, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
    ecs.addComponent(tribe, { type: 'biology', biomass: 10, health: 80, dna: '' } as Biology);

    mgr.tick(1.0, ecs);
    const soc = ecs.getComponent<Society>(tribe, 'society');
    expect(soc!.happiness).toBeGreaterThan(50);
    const bio = ecs.getComponent<Biology>(tribe, 'biology');
    expect(bio!.health).toBeGreaterThan(80);
  });

  it('applies enemy debuff to entities of different faith', () => {
    const altar = createAltar(0, 0, 'ANIMISM', false, 5, 3);
    const enemy = ecs.createEntity();
    ecs.addComponent(enemy, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(enemy, { type: 'faith', devotion: 10, dominantSystem: 'NIHILISM', beliefMatrix: { ANIMISM: 0, ELEMENTALISM: 0, INTERVENTIONIST: 0, SECULAR: 0, NIHILISM: 10 } } as Faith);
    ecs.addComponent(enemy, { type: 'society', name: 'Enemy', faction: 'NIHILIST', population: 5, technologyLevel: 1, resources: 50, happiness: 50 } as Society);

    mgr.tick(1.0, ecs);
    const soc = ecs.getComponent<Society>(enemy, 'society');
    expect(soc!.happiness).toBeLessThan(50);
  });

  it('inverts effects on cursed ground', () => {
    const altar = createAltar(0, 0, 'ANIMISM', true, 5, 2);
    const tribe = ecs.createEntity();
    ecs.addComponent(tribe, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(tribe, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);

    mgr.tick(1.0, ecs);
    const soc = ecs.getComponent<Society>(tribe, 'society');
    expect(soc!.happiness).toBeLessThan(50);
  });

  it('amplifies effects on sacred ground', () => {
    createAltar(0, 0, 'ANIMISM', false, 6, 1);
    createAltar(1, 0, 'ANIMISM', false, 6, 1);
    const tribe = ecs.createEntity();
    ecs.addComponent(tribe, { type: 'position', x: 0.5, y: 0, z: 0 } as Position);
    ecs.addComponent(tribe, { type: 'society', name: 'Test', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);

    mgr.tick(1.0, ecs);
    const soc = ecs.getComponent<Society>(tribe, 'society');
    expect(soc!.happiness).toBeGreaterThan(50);
    // Amplification should exceed a single shrine
    expect(soc!.happiness).toBeGreaterThan(50 + mgr.happinessRate * 1 * 1.5);
  });

  it('heals fauna and flora inside shrine radius', () => {
    const altar = createAltar(0, 0, 'ANIMISM', false, 5, 2);
    const tree = ecs.createEntity();
    ecs.addComponent(tree, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(tree, { type: 'flora', category: 'TREE', subType: 'oak', growth: 30, resourcesYield: 5, isHarvested: false } as Flora);

    const wolf = ecs.createEntity();
    ecs.addComponent(wolf, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(wolf, { type: 'fauna', category: 'WOLF', subType: 'gray', health: 40, hunger: 10, aggressiveness: 50, actionState: 'WANDERING' } as Fauna);

    mgr.tick(1.0, ecs);
    expect(ecs.getComponent<Flora>(tree, 'flora')!.growth).toBeGreaterThan(30);
    expect(ecs.getComponent<Fauna>(wolf, 'fauna')!.health).toBeGreaterThan(40);
  });
});
