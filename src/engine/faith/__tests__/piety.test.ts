import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ECS } from '../../ecs';
import {
  PietyManager,
  PRAYER_TYPE_BONUS,
  DEFAULT_PRAYER_COOLDOWN,
  CRISIS_OF_FAITH_PENALTY,
  ANSWERED_PRAYER_BOOST,
  MASS_PRAYER_COOLDOWN,
} from '../piety';
import { Faith, Society, Prayer, Piety } from '../../../types';

describe('PietyManager', () => {
  let mgr: PietyManager;
  let ecs: ECS;

  beforeEach(() => {
    mgr = new PietyManager();
    ecs = new ECS();
    vi.spyOn(Math, 'random').mockRestore();
  });

  function createEntityWithFaith(name = 'Tribe', initialDevotion = 50) {
    const ent = ecs.createEntity();
    ecs.addComponent(ent, {
      type: 'faith',
      devotion: initialDevotion,
      dominantSystem: 'ANIMISM',
      beliefMatrix: { ANIMISM: 50, ELEMENTALISM: 0, INTERVENTIONIST: 0, SECULAR: 0, NIHILISM: 0 },
    } as Faith);
    ecs.addComponent(ent, {
      type: 'society',
      name,
      faction: 'ANIMIST',
      population: 10,
      technologyLevel: 1,
      resources: 100,
      happiness: 60,
    } as Society);
    return ent;
  }

  it('initialises with zero devotion pool and no prayers', () => {
    expect(mgr.globalDevotionPool).toBe(0);
    expect(mgr.activePrayers).toEqual([]);
    expect(mgr.tickCount).toBe(0);
  });

  it('ensurePiety attaches a Piety component if missing', () => {
    const ent = createEntityWithFaith();
    const piety = mgr.ensurePiety(ent, ecs, 42);
    expect(piety.type).toBe('piety');
    expect(piety.score).toBe(42);
    expect(ecs.getEntitiesWith(['piety']).length).toBe(1);
  });

  it('ensurePiety returns existing Piety component', () => {
    const ent = createEntityWithFaith();
    mgr.ensurePiety(ent, ecs, 30);
    const again = mgr.ensurePiety(ent, ecs, 99);
    expect(again.score).toBe(30);
  });

  it('getPiety and setPiety work', () => {
    const ent = createEntityWithFaith();
    expect(mgr.getPiety(ent, ecs)).toBe(0);
    mgr.setPiety(ent, ecs, 77);
    expect(mgr.getPiety(ent, ecs)).toBe(77);
  });

  it('setPiety clamps to [0,100]', () => {
    const ent = createEntityWithFaith();
    mgr.setPiety(ent, ecs, -10);
    expect(mgr.getPiety(ent, ecs)).toBe(0);
    mgr.setPiety(ent, ecs, 200);
    expect(mgr.getPiety(ent, ecs)).toBe(100);
  });

  it('starts a prayer when not on cooldown', () => {
    const ent = createEntityWithFaith();
    mgr.ensurePiety(ent, ecs, 50);
    const ok = mgr.startPrayer(ent, 'petition', 'rain', 5, ecs);
    expect(ok).toBe(true);
    expect(mgr.activePrayers.length).toBe(1);
    const rec = mgr.activePrayers[0];
    expect(rec.prayerType).toBe('petition');
    expect(rec.targetValue).toBe('rain');
    expect(rec.entity).toBe(ent);
  });

  it('creates a Prayer component on the entity', () => {
    const ent = createEntityWithFaith();
    mgr.startPrayer(ent, 'thanksgiving', 'harvest', 3, ecs);
    const prayer = ecs.getComponent<Prayer>(ent, 'prayer');
    expect(prayer).toBeDefined();
    expect(prayer!.questType).toBe('thanksgiving');
    expect(prayer!.durationLeft).toBe(3);
    expect(prayer!.isFulfilled).toBe(false);
  });

  it('rejects prayer while on cooldown', () => {
    const ent = createEntityWithFaith();
    mgr.ensurePiety(ent, ecs, 50);
    mgr.startPrayer(ent, 'petition', 'rain', 5, ecs);
    const ok2 = mgr.startPrayer(ent, 'penance', 'sin', 5, ecs);
    expect(ok2).toBe(false);
  });

  it('advances prayer cooldowns on tick', () => {
    const ent = createEntityWithFaith();
    mgr.ensurePiety(ent, ecs, 50);
    mgr.startPrayer(ent, 'petition', 'rain', 5, ecs);
    mgr.tick(1.0, ecs);
    const piety = ecs.getComponent<Piety>(ent, 'piety');
    expect(piety!.prayerCooldown).toBeLessThan(DEFAULT_PRAYER_COOLDOWN);
  });

  it('computes global devotion pool from ECS', () => {
    createEntityWithFaith('A', 30);
    createEntityWithFaith('B', 70);
    mgr.tick(1.0, ecs);
    expect(mgr.globalDevotionPool).toBe(100);
  });

  it('answer probability depends on piety and devotion pool', () => {
    mgr.globalDevotionPool = 500;
    expect(mgr.calculateAnswerProbability(0)).toBeGreaterThan(0);
    expect(mgr.calculateAnswerProbability(100)).toBeGreaterThan(
      mgr.calculateAnswerProbability(0)
    );
    expect(mgr.calculateAnswerProbability(50)).toBeLessThanOrEqual(0.95);
    expect(mgr.calculateAnswerProbability(50)).toBeGreaterThanOrEqual(0.05);
  });

  it('answers a prayer and boosts piety + devotion', () => {
    const ent = createEntityWithFaith('Tribe', 20);
    mgr.ensurePiety(ent, ecs, 80);
    mgr.startPrayer(ent, 'thanksgiving', 'harvest', 10, ecs);
    vi.spyOn(Math, 'random').mockReturnValue(0.01); // guaranteed success

    const rec = mgr.activePrayers[0];
    const ok = mgr.answerPrayer(rec.id, ecs);
    expect(ok).toBe(true);

    const piety = ecs.getComponent<Piety>(ent, 'piety');
    expect(piety!.score).toBe(80 + ANSWERED_PRAYER_BOOST);

    const faith = ecs.getComponent<Faith>(ent, 'faith');
    expect(faith!.devotion).toBeGreaterThan(20);
  });

  it('fails to answer a prayer when roll is above probability', () => {
    const ent = createEntityWithFaith('Tribe', 20);
    mgr.ensurePiety(ent, ecs, 10);
    mgr.startPrayer(ent, 'intercession', 'war', 10, ecs);
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // guaranteed fail

    const rec = mgr.activePrayers[0];
    const ok = mgr.answerPrayer(rec.id, ecs);
    expect(ok).toBe(false);
    expect(rec.answered).toBe(false);
  });

  it('unanswered prayers trigger crisis of faith when duration expires', () => {
    const ent = createEntityWithFaith('Tribe', 20);
    mgr.ensurePiety(ent, ecs, 60);
    mgr.startPrayer(ent, 'petition', 'rain', 1, ecs);

    // Tick past expiration
    mgr.tick(2.0, ecs);
    expect(mgr.activePrayers.length).toBe(0);
    const piety = ecs.getComponent<Piety>(ent, 'piety');
    expect(piety!.score).toBe(60 - CRISIS_OF_FAITH_PENALTY);
  });

  it('auto-answers fulfilled quests on tick', () => {
    const ent = createEntityWithFaith('Tribe', 20);
    mgr.ensurePiety(ent, ecs, 50);
    mgr.startPrayer(ent, 'thanksgiving', 'harvest', 5, ecs);
    const prayer = ecs.getComponent<Prayer>(ent, 'prayer');
    prayer!.isFulfilled = true;

    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    mgr.tick(1.0, ecs);
    expect(mgr.activePrayers.length).toBe(0);
    expect(ecs.getComponent<Prayer>(ent, 'prayer')!.isFulfilled).toBe(true);
  });

  it('answerAllPossiblePrayers answers eligible prayers', () => {
    const ent1 = createEntityWithFaith('A', 20);
    const ent2 = createEntityWithFaith('B', 20);
    mgr.ensurePiety(ent1, ecs, 100);
    mgr.ensurePiety(ent2, ecs, 100);
    mgr.startPrayer(ent1, 'thanksgiving', 'a', 10, ecs);
    mgr.startPrayer(ent2, 'thanksgiving', 'b', 10, ecs);
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    const count = mgr.answerAllPossiblePrayers(ecs);
    expect(count).toBe(2);
    expect(mgr.activePrayers.length).toBe(0);
  });

  it('getActivePrayersForEntity filters by entity', () => {
    const a = createEntityWithFaith('A', 20);
    const b = createEntityWithFaith('B', 20);
    mgr.ensurePiety(a, ecs, 50);
    mgr.ensurePiety(b, ecs, 50);
    mgr.startPrayer(a, 'petition', 'x', 10, ecs);
    mgr.startPrayer(b, 'petition', 'y', 10, ecs);

    const activeA = mgr.getActivePrayersForEntity(a);
    expect(activeA.length).toBe(1);
    expect(activeA[0].targetValue).toBe('x');
  });

  it('triggerMassPrayer boosts piety and resets cooldowns', () => {
    const ent = createEntityWithFaith('Tribe', 20);
    mgr.ensurePiety(ent, ecs, 40);
    mgr.startPrayer(ent, 'petition', 'rain', 10, ecs);
    mgr.tick(1.0, ecs); // establish cooldown

    const before = mgr.getPiety(ent, ecs);
    const affected = mgr.triggerMassPrayer(ecs);
    expect(affected).toBe(1);
    expect(mgr.getPiety(ent, ecs)).toBeGreaterThan(before);
    const piety = ecs.getComponent<Piety>(ent, 'piety');
    expect(piety!.prayerCooldown).toBe(0);
  });

  it('mass prayer obeys cooldown', () => {
    const ent = createEntityWithFaith('Tribe', 20);
    mgr.ensurePiety(ent, ecs, 50);
    mgr.triggerMassPrayer(ecs);
    const again = mgr.triggerMassPrayer(ecs);
    expect(again).toBe(0);
  });

  it('resetAllCooldowns clears every entity', () => {
    const a = createEntityWithFaith('A', 20);
    const b = createEntityWithFaith('B', 20);
    mgr.ensurePiety(a, ecs, 50);
    mgr.ensurePiety(b, ecs, 50);
    mgr.startPrayer(a, 'petition', 'x', 10, ecs);
    mgr.startPrayer(b, 'petition', 'y', 10, ecs);
    mgr.tick(1.0, ecs);

    mgr.resetAllCooldowns(ecs);
    expect(ecs.getComponent<Piety>(a, 'piety')!.prayerCooldown).toBe(0);
    expect(ecs.getComponent<Piety>(b, 'piety')!.prayerCooldown).toBe(0);
  });

  it('PRAYER_TYPE_BONUS covers all four types', () => {
    expect(Object.keys(PRAYER_TYPE_BONUS).sort()).toEqual([
      'intercession',
      'penance',
      'petition',
      'thanksgiving',
    ]);
  });
});
