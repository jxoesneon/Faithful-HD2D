import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { DogmaManager, TENETS, TENET_MAP } from '../dogma';
import { Society, Faith, Dogma, Flora } from '../../../types';

describe('DogmaManager', () => {
  let mgr: DogmaManager;
  let ecs: ECS;

  beforeEach(() => {
    mgr = new DogmaManager();
    ecs = new ECS();
  });

  function createSociety(pop = 10, faithSystem: string = 'ANIMISM') {
    const ent = ecs.createEntity();
    ecs.addComponent(ent, {
      type: 'society',
      name: 'TestTribe',
      faction: 'ANIMIST',
      population: pop,
      technologyLevel: 1,
      resources: 100,
      happiness: 50,
      gathererRatio: 0.35,
      hunterRatio: 0.15,
      researcherRatio: 0.20,
      acolyteRatio: 0.30,
    } as Society);
    ecs.addComponent(ent, {
      type: 'faith',
      devotion: 20,
      dominantSystem: faithSystem as any,
      beliefMatrix: { ANIMISM: 20, ELEMENTALISM: 0, INTERVENTIONIST: 0, SECULAR: 0, NIHILISM: 0 },
    } as Faith);
    mgr.ensureDogma(ent, ecs);
    return ent;
  }

  it('has at least 20 tenets', () => {
    expect(TENETS.length).toBeGreaterThanOrEqual(20);
  });

  it('TENET_MAP indexes every tenet by id', () => {
    for (const t of TENETS) {
      expect(TENET_MAP[t.id]).toBeDefined();
      expect(TENET_MAP[t.id].id).toBe(t.id);
    }
  });

  it('getUnlockedTenets filters by divineLevel', () => {
    const ent = createSociety(10, 'ANIMISM');
    const low = mgr.getUnlockedTenets(ent, ecs, 1, []);
    const high = mgr.getUnlockedTenets(ent, ecs, 5, []);
    expect(low.length).toBeLessThanOrEqual(high.length);
  });

  it('getUnlockedTenets filters by tribeSize', () => {
    const small = createSociety(5, 'ANIMISM');
    const big = createSociety(200, 'ANIMISM');
    const smallUnlocks = mgr.getUnlockedTenets(small, ecs, 5, []);
    const bigUnlocks = mgr.getUnlockedTenets(big, ecs, 5, []);
    expect(bigUnlocks.length).toBeGreaterThanOrEqual(smallUnlocks.length);
  });

  it('getUnlockedTenets filters by required events', () => {
    const ent = createSociety(50, 'INTERVENTIONIST');
    const withoutEvent = mgr.getUnlockedTenets(ent, ecs, 3, []);
    const withEvent = mgr.getUnlockedTenets(ent, ecs, 3, ['MIRACLE']);
    expect(withEvent.length).toBeGreaterThanOrEqual(withoutEvent.length);
  });

  it('addTenet appends a tenet id', () => {
    const ent = createSociety(10, 'ANIMISM');
    const ok = mgr.addTenet(ent, 'nature_reverence', ecs);
    expect(ok).toBe(true);
    const dogma = ecs.getComponent<Dogma>(ent, 'dogma');
    expect(dogma!.tenets).toContain('nature_reverence');
  });

  it('addTenet rejects unknown tenet ids', () => {
    const ent = createSociety(10, 'ANIMISM');
    expect(mgr.addTenet(ent, 'nonexistent', ecs)).toBe(false);
  });

  it('addTenet rejects duplicates', () => {
    const ent = createSociety(10, 'ANIMISM');
    mgr.addTenet(ent, 'nature_reverence', ecs);
    expect(mgr.addTenet(ent, 'nature_reverence', ecs)).toBe(false);
  });

  it('removeTenet deletes an active tenet', () => {
    const ent = createSociety(10, 'ANIMISM');
    mgr.addTenet(ent, 'nature_reverence', ecs);
    expect(mgr.removeTenet(ent, 'nature_reverence', ecs)).toBe(true);
    const dogma = ecs.getComponent<Dogma>(ent, 'dogma');
    expect(dogma!.tenets).not.toContain('nature_reverence');
  });

  it('removeTenet returns false for missing tenet', () => {
    const ent = createSociety(10, 'ANIMISM');
    expect(mgr.removeTenet(ent, 'nature_reverence', ecs)).toBe(false);
  });

  it('calculateSchismRisk is zero with no conflicts', () => {
    const ent = createSociety(10, 'ANIMISM');
    mgr.addTenet(ent, 'nature_reverence', ecs);
    const dogma = ecs.getComponent<Dogma>(ent, 'dogma')!;
    expect(mgr.calculateSchismRisk(dogma)).toBe(0);
  });

  it('calculateSchismRisk rises with conflicting tenets', () => {
    const ent = createSociety(10, 'ANIMISM');
    mgr.addTenet(ent, 'nature_reverence', ecs);
    mgr.addTenet(ent, 'industrial_progress', ecs); // conflicts with nature_reverence
    const dogma = ecs.getComponent<Dogma>(ent, 'dogma')!;
    expect(mgr.calculateSchismRisk(dogma)).toBeGreaterThan(0);
    expect(mgr.calculateSchismRisk(dogma)).toBeLessThanOrEqual(100);
  });

  it('updateSchismRisk mutates the component', () => {
    const ent = createSociety(10, 'ANIMISM');
    mgr.addTenet(ent, 'nature_reverence', ecs);
    mgr.addTenet(ent, 'industrial_progress', ecs);
    const dogma = ecs.getComponent<Dogma>(ent, 'dogma')!;
    mgr.updateSchismRisk(dogma);
    expect(dogma.schismRisk).toBe(mgr.calculateSchismRisk(dogma));
  });

  it('isSchismImminent respects threshold', () => {
    const ent = createSociety(10, 'ANIMISM');
    mgr.addTenet(ent, 'nature_reverence', ecs);
    mgr.addTenet(ent, 'industrial_progress', ecs);
    expect(mgr.isSchismImminent(ent, ecs, 5)).toBe(true);
    expect(mgr.isSchismImminent(ent, ecs, 100)).toBe(false);
  });

  it('applyEffects modifies society happiness', () => {
    const ent = createSociety(10, 'ANIMISM');
    mgr.addTenet(ent, 'nature_reverence', ecs);
    mgr.applyEffects(ent, ecs, 1.0);
    const soc = ecs.getComponent<Society>(ent, 'society')!;
    expect(soc.happiness).not.toBe(50);
  });

  it('applyEffects modifies technology level via techModifier', () => {
    const ent = createSociety(10, 'SECULAR');
    mgr.addTenet(ent, 'rational_governance', ecs);
    mgr.applyEffects(ent, ecs, 1.0);
    const soc = ecs.getComponent<Society>(ent, 'society')!;
    expect(soc.technologyLevel).toBeGreaterThan(1);
  });

  it('applyEffects modifies resources', () => {
    const ent = createSociety(10, 'INTERVENTIONIST');
    mgr.addTenet(ent, 'sacred_tithe', ecs);
    const before = ecs.getComponent<Society>(ent, 'society')!.resources;
    mgr.applyEffects(ent, ecs, 1.0);
    const after = ecs.getComponent<Society>(ent, 'society')!.resources;
    expect(after).toBeLessThan(before);
  });

  it('applyEffects modifies devotion via devotionDelta', () => {
    const ent = createSociety(10, 'ANIMISM');
    mgr.addTenet(ent, 'ancestor_worship', ecs);
    mgr.applyEffects(ent, ecs, 1.0);
    const faith = ecs.getComponent<Faith>(ent, 'faith')!;
    expect(faith.devotion).toBeGreaterThan(20);
  });

  it('applyEffects penalises strip mining when tenet is active', () => {
    const ent = createSociety(10, 'ANIMISM');
    ecs.getComponent<Society>(ent, 'society')!.stripMineMode = true;
    mgr.addTenet(ent, 'nature_reverence', ecs);
    mgr.applyEffects(ent, ecs, 1.0);
    const soc = ecs.getComponent<Society>(ent, 'society')!;
    expect(soc.happiness).toBeLessThan(50);
  });

  it('applyEffects modifies flora growth when tenet active and entity has flora', () => {
    const ent = createSociety(10, 'ANIMISM');
    ecs.addComponent(ent, { type: 'flora', category: 'CROP', subType: 'wheat', growth: 40, resourcesYield: 5, isHarvested: false } as Flora);
    mgr.addTenet(ent, 'nature_reverence', ecs);
    mgr.applyEffects(ent, ecs, 1.0);
    expect(ecs.getComponent<Flora>(ent, 'flora')!.growth).toBeGreaterThan(40);
  });

  it('applyEffects modifies researcher ratio', () => {
    const ent = createSociety(10, 'SECULAR');
    mgr.addTenet(ent, 'education_first', ecs);
    mgr.applyEffects(ent, ecs, 1.0);
    const soc = ecs.getComponent<Society>(ent, 'society')!;
    expect(soc.researcherRatio).toBeGreaterThan(0.20);
  });

  it('checkAndAutoUnlock adds newly-eligible tenets', () => {
    const ent = createSociety(200, 'ANIMISM');
    mgr.checkAndAutoUnlock(ent, ecs, 5, ['MIRACLE', 'SCHISM']);
    const dogma = ecs.getComponent<Dogma>(ent, 'dogma')!;
    expect(dogma.tenets.length).toBeGreaterThan(0);
  });

  it('tick auto-unlocks and applies effects', () => {
    const ent = createSociety(200, 'ANIMISM');
    mgr.tick(60, ecs, 5, ['MIRACLE']);
    const dogma = ecs.getComponent<Dogma>(ent, 'dogma')!;
    expect(dogma.tenets.length).toBeGreaterThan(0);
  });

  it('ensureDogma attaches component if missing', () => {
    const ent = ecs.createEntity();
    const dogma = mgr.ensureDogma(ent, ecs);
    expect(dogma.type).toBe('dogma');
    expect(dogma.tenets).toEqual([]);
  });

  it('ensureDogma returns existing component', () => {
    const ent = ecs.createEntity();
    const first = mgr.ensureDogma(ent, ecs);
    first.tenets.push('nature_reverence');
    const second = mgr.ensureDogma(ent, ecs);
    expect(second.tenets).toContain('nature_reverence');
  });
});
