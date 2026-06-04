import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ECS } from '../../ecs';
import { TradeManager, BASE_PRICES, BARTER_BASE_RATES } from '../trade';
import type { Position, Society, Market, Caravan, TradeRoute, ResourceValue } from '../../../types';

describe('TradeManager', () => {
  let ecs: ECS;
  let manager: TradeManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new TradeManager(ecs);
  });

  describe('market pricing', () => {
    it('creates a market linked to a society', () => {
      const soc = ecs.createEntity();
      ecs.addComponent(soc, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      manager.createMarket(soc);
      const market = ecs.getComponent<Market>(soc, 'market');
      expect(market).toBeDefined();
      expect(market!.prices.Food).toBe(BASE_PRICES.Food);
    });

    it('returns base price when no market exists', () => {
      expect(manager.getPrice('missing', 'Wood')).toBe(BASE_PRICES.Wood);
    });

    it('increases price when demand exceeds supply', () => {
      const soc = ecs.createEntity();
      ecs.addComponent(soc, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      manager.createMarket(soc);
      const market = ecs.getComponent<Market>(soc, 'market')!;
      market.supply.Food = 1;
      market.demand.Food = 10;
      manager.updatePrices();
      expect(ecs.getComponent<Market>(soc, 'market')!.prices.Food).toBeGreaterThan(BASE_PRICES.Food);
    });

    it('decreases price when supply exceeds demand', () => {
      const soc = ecs.createEntity();
      ecs.addComponent(soc, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      manager.createMarket(soc);
      const market = ecs.getComponent<Market>(soc, 'market')!;
      market.supply.Food = 200;
      market.demand.Food = 10;
      manager.updatePrices();
      expect(ecs.getComponent<Market>(soc, 'market')!.prices.Food).toBeLessThan(BASE_PRICES.Food);
    });
  });

  describe('caravan travel', () => {
    it('creates a caravan with zero progress', () => {
      const socA = ecs.createEntity();
      ecs.addComponent(socA, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(socA, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      const socB = ecs.createEntity();
      ecs.addComponent(socB, { type: 'society', name: 'B', faction: 'TECHNOCRAT', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(socB, { type: 'position', x: 10, y: 0, z: 0 } as Position);
      const cId = manager.createCaravan(socA, socA, socB, { Wood: 10 });
      const caravan = ecs.getComponent<Caravan>(cId, 'caravan');
      expect(caravan).toBeDefined();
      expect(caravan!.progress).toBe(0);
      expect(caravan!.cargo.Wood).toBe(10);
    });

    it('advances caravan progress toward destination', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(a, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'society', name: 'B', faction: 'TECHNOCRAT', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(b, { type: 'position', x: 10, y: 0, z: 0 } as Position);
      const cId = manager.createCaravan(a, a, b, { Wood: 5 });
      manager.updateCaravans(1);
      const caravan = ecs.getComponent<Caravan>(cId, 'caravan')!;
      expect(caravan.progress).toBeGreaterThan(0);
      expect(caravan.progress).toBeLessThan(1);
    });

    it('arrives, trades, and removes caravan', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(a, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'society', name: 'B', faction: 'TECHNOCRAT', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(b, { type: 'position', x: 10, y: 0, z: 0 } as Position);
      manager.createMarket(b);
      const cId = manager.createCaravan(a, a, b, { Wood: 5 });
      // 10 seconds at 0.1 progress/sec => arrives
      manager.updateCaravans(10);
      expect(ecs.getComponent<Caravan>(cId, 'caravan')).toBeUndefined();
    });
  });

  describe('route risk', () => {
    it('creates route with distance and base risk', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'position', x: 20, y: 0, z: 0 } as Position);
      const rId = manager.createTradeRoute(a, b);
      const route = ecs.getComponent<TradeRoute>(rId, 'tradeRoute')!;
      expect(route.distance).toBe(20);
      expect(route.ambushRisk).toBeGreaterThan(0);
    });

    it('calculates route risk bounded by 0.6', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'position', x: 200, y: 0, z: 0 } as Position);
      const rId = manager.createTradeRoute(a, b);
      expect(manager.calculateRouteRisk(rId)).toBeLessThanOrEqual(0.6);
    });
  });

  describe('ambush', () => {
    it('resolves ambush and clears cargo', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'position', x: 50, y: 0, z: 0 } as Position);
      manager.createTradeRoute(a, b);
      const cId = manager.createCaravan(a, a, b, { Wood: 5, Food: 3 });
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const ambushed = manager.resolveAmbush(cId);
      expect(ambushed).toBe(true);
      const caravan = ecs.getComponent<Caravan>(cId, 'caravan')!;
      expect(caravan.cargo.Wood).toBe(0);
      expect(caravan.cargo.Food).toBe(0);
      vi.restoreAllMocks();
    });

    it('does not ambush when random exceeds risk', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'position', x: 10, y: 0, z: 0 } as Position);
      manager.createTradeRoute(a, b);
      const cId = manager.createCaravan(a, a, b, { Wood: 5 });
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const ambushed = manager.resolveAmbush(cId);
      expect(ambushed).toBe(false);
      vi.restoreAllMocks();
    });
  });

  describe('barter exchange', () => {
    it('returns base barter rate without market', () => {
      expect(manager.barterRate('Wood', 'Stone')).toBe(BARTER_BASE_RATES.Wood.Stone);
    });

    it('adjusts barter rate by market prices', () => {
      const soc = ecs.createEntity();
      ecs.addComponent(soc, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      manager.createMarket(soc);
      const market = ecs.getComponent<Market>(soc, 'market')!;
      market.prices.Wood = 10;
      market.prices.Stone = 5;
      expect(manager.barterRate('Wood', 'Stone', soc)).toBe(2);
    });

    it('returns zero when target price is zero', () => {
      const soc = ecs.createEntity();
      ecs.addComponent(soc, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      manager.createMarket(soc);
      const market = ecs.getComponent<Market>(soc, 'market')!;
      market.prices.Wood = 5;
      market.prices.Stone = 0;
      expect(manager.barterRate('Wood', 'Stone', soc)).toBe(0);
    });
  });
});
