import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { BorderManager } from '../borders';
import type { Position, Society, Border, Allegiance, Faith } from '../../../types';

describe('BorderManager', () => {
  let ecs: ECS;
  let manager: BorderManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new BorderManager(ecs);
  });

  describe('influence maps', () => {
    it('claims tiles for the nearest society', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(a, { type: 'position', x: 10, y: 10, z: 0 } as Position);

      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'society', name: 'B', faction: 'TECHNOCRAT', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(b, { type: 'position', x: 50, y: 10, z: 0 } as Position);

      manager.computeBorders();

      expect(manager.getTileOwner(5, 10)).toBe(a);
      expect(manager.getTileOwner(55, 10)).toBe(b);
    });

    it('creates border components with claimed tiles', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(a, { type: 'position', x: 20, y: 20, z: 0 } as Position);

      manager.computeBorders();

      const border = ecs.getComponent<Border>(a, 'border')!;
      expect(border.societyId).toBe(a);
      expect(border.territoryTiles.length).toBeGreaterThan(0);
      expect(border.tension).toBe(0);
    });

    it('clears old borders on recompute', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(a, { type: 'position', x: 10, y: 10, z: 0 } as Position);
      manager.computeBorders();
      const first = ecs.getComponent<Border>(a, 'border')!;
      expect(first.territoryTiles.length).toBeGreaterThan(0);

      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'society', name: 'B', faction: 'TECHNOCRAT', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(b, { type: 'position', x: 50, y: 10, z: 0 } as Position);
      manager.computeBorders();
      const second = ecs.getComponent<Border>(a, 'border')!;
      expect(second.territoryTiles.length).toBeGreaterThan(0);
    });
  });

  describe('allegiance changes', () => {
    it('creates an allegiance component', () => {
      const sub = ecs.createEntity();
      const over = ecs.createEntity();
      manager.setAllegiance(sub, over, 'vassal');

      const alleg = ecs.getComponent<Allegiance>(sub, 'allegiance')!;
      expect(alleg.overlordId).toBe(over);
    });

    it('switches relation to ally', () => {
      const sub = ecs.createEntity();
      const over = ecs.createEntity();
      manager.setAllegiance(sub, over, 'vassal');
      manager.setAllegiance(sub, over, 'ally');
      const alleg = ecs.getComponent<Allegiance>(sub, 'allegiance')!;
      expect(alleg.overlordId).toBeNull();
      expect(alleg.allies).toContain(over);
    });

    it('sets allegiance to independent', () => {
      const sub = ecs.createEntity();
      const over = ecs.createEntity();
      manager.setAllegiance(sub, over, 'vassal');
      manager.setAllegiance(sub, null, 'independent');
      const alleg = ecs.getComponent<Allegiance>(sub, 'allegiance')!;
      expect(alleg.overlordId).toBeNull();
    });
  });

  describe('border tension', () => {
    it('is zero between a society and itself', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      expect(manager.calculateTension(a, a)).toBe(0);
    });

    it('rises with different faiths and shared border', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(a, { type: 'position', x: 15, y: 32, z: 0 } as Position);
      ecs.addComponent(a, { type: 'faith', devotion: 50, dominantSystem: 'ANIMISM', beliefMatrix: { ANIMISM: 1, ELEMENTALISM: 0, INTERVENTIONIST: 0, SECULAR: 0, NIHILISM: 0 } } as Faith);

      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'society', name: 'B', faction: 'TECHNOCRAT', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(b, { type: 'position', x: 45, y: 32, z: 0 } as Position);
      ecs.addComponent(b, { type: 'faith', devotion: 50, dominantSystem: 'SECULAR', beliefMatrix: { ANIMISM: 0, ELEMENTALISM: 0, INTERVENTIONIST: 0, SECULAR: 1, NIHILISM: 0 } } as Faith);

      manager.computeBorders();
      const t = manager.calculateTension(a, b);
      expect(t).toBeGreaterThan(0);
    });

    it('drops for allies', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(a, { type: 'position', x: 15, y: 32, z: 0 } as Position);
      ecs.addComponent(a, { type: 'faith', devotion: 50, dominantSystem: 'ANIMISM', beliefMatrix: { ANIMISM: 1, ELEMENTALISM: 0, INTERVENTIONIST: 0, SECULAR: 0, NIHILISM: 0 } } as Faith);

      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'society', name: 'B', faction: 'TECHNOCRAT', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(b, { type: 'position', x: 20, y: 32, z: 0 } as Position);
      ecs.addComponent(b, { type: 'faith', devotion: 50, dominantSystem: 'SECULAR', beliefMatrix: { ANIMISM: 0, ELEMENTALISM: 0, INTERVENTIONIST: 0, SECULAR: 1, NIHILISM: 0 } } as Faith);

      manager.computeBorders();
      const tensionNoAllegiance = manager.calculateTension(a, b);

      manager.setAllegiance(a, b, 'ally');
      const tensionAlly = manager.calculateTension(a, b);
      expect(tensionAlly).toBeLessThan(tensionNoAllegiance);
    });

    it('updates tension on border components', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(a, { type: 'position', x: 15, y: 32, z: 0 } as Position);
      ecs.addComponent(a, { type: 'faith', devotion: 50, dominantSystem: 'ANIMISM', beliefMatrix: { ANIMISM: 1, ELEMENTALISM: 0, INTERVENTIONIST: 0, SECULAR: 0, NIHILISM: 0 } } as Faith);

      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'society', name: 'B', faction: 'TECHNOCRAT', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(b, { type: 'position', x: 45, y: 32, z: 0 } as Position);
      ecs.addComponent(b, { type: 'faith', devotion: 50, dominantSystem: 'SECULAR', beliefMatrix: { ANIMISM: 0, ELEMENTALISM: 0, INTERVENTIONIST: 0, SECULAR: 1, NIHILISM: 0 } } as Faith);

      manager.computeBorders();
      manager.updateBorderTension();

      const borderA = ecs.getComponent<Border>(a, 'border')!;
      const borderB = ecs.getComponent<Border>(b, 'border')!;
      expect(borderA.tension).toBeGreaterThanOrEqual(0);
      expect(borderA.tension).toBeLessThanOrEqual(100);
      expect(borderB.tension).toBeGreaterThanOrEqual(0);
      expect(borderB.tension).toBeLessThanOrEqual(100);
    });

    it('increases tension with enemies', () => {
      const a = ecs.createEntity();
      ecs.addComponent(a, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(a, { type: 'position', x: 15, y: 32, z: 0 } as Position);

      const b = ecs.createEntity();
      ecs.addComponent(b, { type: 'society', name: 'B', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(b, { type: 'position', x: 45, y: 32, z: 0 } as Position);

      manager.computeBorders();
      const base = manager.calculateTension(a, b);

      manager.setAllegiance(a, b, 'enemy');
      const enemy = manager.calculateTension(a, b);
      expect(enemy).toBeGreaterThan(base);
    });
  });
});
