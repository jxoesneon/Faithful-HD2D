import type { ECS } from '../ecs';
import type { Entity, Position, Society, Market, Caravan, TradeRoute, ResourceValue } from '../../types';

export const BASE_PRICES: Record<ResourceValue, number> = {
  Wood: 5,
  Stone: 8,
  Food: 3,
  Metal: 15,
  Crystal: 40,
  DivineEssence: 100,
};

export const BARTER_BASE_RATES: Record<ResourceValue, Record<ResourceValue, number>> = {
  Wood: { Wood: 1, Stone: 0.625, Food: 1.66, Metal: 0.33, Crystal: 0.125, DivineEssence: 0.05 },
  Stone: { Wood: 1.6, Stone: 1, Food: 2.66, Metal: 0.53, Crystal: 0.2, DivineEssence: 0.08 },
  Food: { Wood: 0.6, Stone: 0.375, Food: 1, Metal: 0.2, Crystal: 0.075, DivineEssence: 0.03 },
  Metal: { Wood: 3, Stone: 1.875, Food: 5, Metal: 1, Crystal: 0.375, DivineEssence: 0.15 },
  Crystal: { Wood: 8, Stone: 5, Food: 13.33, Metal: 2.66, Crystal: 1, DivineEssence: 0.4 },
  DivineEssence: { Wood: 20, Stone: 12.5, Food: 33.33, Metal: 6.66, Crystal: 2.5, DivineEssence: 1 },
};

/**
 * TradeManager handles markets, caravans, trade routes, and barter exchange.
 * Operates on ECS directly.
 */
export class TradeManager {
  private priceHistory = new Map<Entity, Array<Record<ResourceValue, number>>>();

  constructor(private ecs: ECS) {}

  /** Create a Market component attached to a society entity. */
  createMarket(societyId: Entity): void {
    const society = this.ecs.getComponent<Society>(societyId, 'society');
    if (!society) return;

    const prices: Record<ResourceValue, number> = { ...BASE_PRICES };
    const market: Market = {
      type: 'market',
      prices,
      supply: {
        Wood: 100,
        Stone: 100,
        Food: 100,
        Metal: 50,
        Crystal: 20,
        DivineEssence: 5,
      },
      demand: {
        Wood: 80,
        Stone: 80,
        Food: 120,
        Metal: 60,
        Crystal: 30,
        DivineEssence: 10,
      },
    };
    this.ecs.addComponent(societyId, market);
  }

  /** Spawn a caravan between two societies. */
  spawnCaravan(
    originSociety: Entity,
    targetSociety: Entity,
    cargo: Partial<Record<ResourceValue, number>>
  ): Entity | null {
    const originPos = this.ecs.getComponent<Position>(originSociety, 'position');
    const targetPos = this.ecs.getComponent<Position>(targetSociety, 'position');
    if (!originPos || !targetPos) return null;

    const dx = targetPos.x - originPos.x;
    const dy = targetPos.y - originPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const caravan: Caravan = {
      type: 'caravan',
      originSociety,
      targetSociety,
      cargo: { ...cargo },
      progress: 0,
      riskLevel: Math.min(distance * 0.02, 0.5),
    };

    const id = this.ecs.createEntity();
    this.ecs.addComponent(id, caravan);
    this.ecs.addComponent(id, { type: 'position', x: originPos.x, y: originPos.y, z: 0 } as Position);
    return id;
  }

  /** Alias for spawnCaravan matching task spec. */
  createCaravan(
    ownerSociety: Entity,
    origin: Entity,
    destination: Entity,
    cargo: Partial<Record<ResourceValue, number>>
  ): Entity {
    return this.spawnCaravan(origin, destination, cargo) ?? this.ecs.createEntity();
  }

  /** Update caravan travel and optionally market prices. */
  update(dt: number): void {
    this.updateCaravans(dt);
    this.updatePrices();
  }

  /** Advance caravans along their routes. */
  updateCaravans(dt: number): void {
    const caravans = this.ecs.getEntitiesWith(['caravan']);
    for (const id of caravans) {
      const caravan = this.ecs.getComponent<Caravan>(id, 'caravan');
      const pos = this.ecs.getComponent<Position>(id, 'position');
      if (!caravan || !pos) continue;

      caravan.progress += dt * 0.1;
      if (caravan.progress >= 1) {
        this.completeCaravanTrade(caravan);
        this.ecs.removeEntity(id);
        continue;
      }

      const originPos = this.ecs.getComponent<Position>(caravan.originSociety, 'position');
      const targetPos = this.ecs.getComponent<Position>(caravan.targetSociety, 'position');
      if (originPos && targetPos) {
        pos.x = originPos.x + (targetPos.x - originPos.x) * caravan.progress;
        pos.y = originPos.y + (targetPos.y - originPos.y) * caravan.progress;
        this.ecs.addComponent(id, pos);
      }

      this.ecs.addComponent(id, caravan);
    }
  }

  /** Get current price of a resource at a market. */
  getPrice(societyId: Entity, resource: ResourceValue): number {
    const market = this.ecs.getComponent<Market>(societyId, 'market');
    return market?.prices[resource] ?? BASE_PRICES[resource];
  }

  /** Set up a trade route between two societies. */
  establishTradeRoute(societyA: Entity, societyB: Entity): Entity | null {
    const posA = this.ecs.getComponent<Position>(societyA, 'position');
    const posB = this.ecs.getComponent<Position>(societyB, 'position');
    if (!posA || !posB) return null;

    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const route: TradeRoute = {
      type: 'tradeRoute',
      societyA,
      societyB,
      distance,
      ambushRisk: Math.min(distance * 0.015, 0.4),
      active: true,
    };

    const id = this.ecs.createEntity();
    this.ecs.addComponent(id, route);
    return id;
  }

  /** Alias for establishTradeRoute matching task spec. */
  createTradeRoute(from: Entity, to: Entity): Entity {
    return this.establishTradeRoute(from, to) ?? this.ecs.createEntity();
  }

  /** Calculate ambush risk for a route (distance + base bandit probability). */
  calculateRouteRisk(routeId: Entity): number {
    const route = this.ecs.getComponent<TradeRoute>(routeId, 'tradeRoute');
    if (!route) return 0;
    return Math.min(route.ambushRisk + route.distance * 0.003, 0.6);
  }

  /** Resolve whether a specific caravan gets ambushed on its current leg. */
  resolveAmbush(caravanId: Entity): boolean {
    const caravan = this.ecs.getComponent<Caravan>(caravanId, 'caravan');
    if (!caravan) return false;

    // Find active route for this caravan
    const routes = this.ecs.getEntitiesWith(['tradeRoute']);
    let routeRisk = caravan.riskLevel;
    for (const rId of routes) {
      const r = this.ecs.getComponent<TradeRoute>(rId, 'tradeRoute');
      if (!r || !r.active) continue;
      if (
        (r.societyA === caravan.originSociety && r.societyB === caravan.targetSociety) ||
        (r.societyA === caravan.targetSociety && r.societyB === caravan.originSociety)
      ) {
        routeRisk = this.calculateRouteRisk(rId);
        break;
      }
    }

    const ambushed = Math.random() < routeRisk;
    if (ambushed) {
      for (const key of Object.keys(caravan.cargo) as ResourceValue[]) {
        caravan.cargo[key] = 0;
      }
      this.ecs.addComponent(caravanId, caravan);
    }
    return ambushed;
  }

  /** Return the barter exchange rate: how many units of `to` you get for 1 unit of `from`. */
  barterRate(from: ResourceValue, to: ResourceValue, marketId?: Entity): number {
    const base = BARTER_BASE_RATES[from]?.[to] ?? 0;
    if (!marketId) return base;
    const market = this.ecs.getComponent<Market>(marketId, 'market');
    if (!market) return base;
    const fromPrice = this.getPrice(marketId, from);
    const toPrice = this.getPrice(marketId, to);
    return toPrice > 0 ? fromPrice / toPrice : 0;
  }

  /** Barter resources between two societies on a route. */
  barter(routeId: Entity, offered: ResourceValue, requested: ResourceValue, amount: number): boolean {
    const route = this.ecs.getComponent<TradeRoute>(routeId, 'tradeRoute');
    if (!route || !route.active) return false;

    const priceA = this.getPrice(route.societyA, offered);
    const priceB = this.getPrice(route.societyB, requested);
    if (priceA === 0 || priceB === 0) return false;

    const valueOffered = amount * priceA;
    const amountReceived = Math.floor(valueOffered / priceB);
    if (amountReceived <= 0) return false;

    const marketA = this.ecs.getComponent<Market>(route.societyA, 'market');
    const marketB = this.ecs.getComponent<Market>(route.societyB, 'market');
    if (marketA && marketB) {
      marketA.supply[offered] = Math.max(0, (marketA.supply[offered] ?? 0) - amount);
      marketA.supply[requested] = (marketA.supply[requested] ?? 0) + amountReceived;
      marketB.supply[offered] = (marketB.supply[offered] ?? 0) + amount;
      marketB.supply[requested] = Math.max(0, (marketB.supply[requested] ?? 0) - amountReceived);
      this.ecs.addComponent(route.societyA, marketA);
      this.ecs.addComponent(route.societyB, marketB);
    }

    return true;
  }

  private completeCaravanTrade(caravan: Caravan): void {
    const targetMarket = this.ecs.getComponent<Market>(caravan.targetSociety, 'market');
    if (targetMarket) {
      for (const [resource, amount] of Object.entries(caravan.cargo)) {
        const res = resource as ResourceValue;
        targetMarket.supply[res] = (targetMarket.supply[res] ?? 0) + (amount ?? 0);
      }
      this.ecs.addComponent(caravan.targetSociety, targetMarket);
    }
  }

  /** Update all market prices based on supply/demand scarcity. */
  updatePrices(): void {
    const markets = this.ecs.getEntitiesWith(['market']);
    for (const societyId of markets) {
      const market = this.ecs.getComponent<Market>(societyId, 'market');
      if (!market) continue;

      for (const resource of Object.keys(BASE_PRICES) as ResourceValue[]) {
        const supply = Math.max(1, market.supply[resource] ?? 100);
        const demand = Math.max(1, market.demand[resource] ?? 100);
        const ratio = demand / supply;
        market.prices[resource] = Math.round(BASE_PRICES[resource] * ratio * 10) / 10;
      }

      this.ecs.addComponent(societyId, market);
    }
  }
}
