import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { SettlementManager, LEVEL_THRESHOLDS, ROAD_MAX_DISTANCE } from '../settlements';
import type { Position, Structure, Society, Settlement } from '../../../types';

describe('SettlementManager', () => {
  let ecs: ECS;
  let manager: SettlementManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new SettlementManager(ecs);
  });

  describe('clustering', () => {
    it('clusters nearby structures of the same faction', () => {
      const society = ecs.createEntity();
      ecs.addComponent(society, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(society, { type: 'position', x: 5, y: 5, z: 0 } as Position);

      const s1 = ecs.createEntity();
      ecs.addComponent(s1, { type: 'structure', category: 'HABITAT', subType: 'tent', durability: 100, efficiency: 1 } as Structure);
      ecs.addComponent(s1, { type: 'position', x: 4, y: 4, z: 0 } as Position);

      const s2 = ecs.createEntity();
      ecs.addComponent(s2, { type: 'structure', category: 'HABITAT', subType: 'tent', durability: 100, efficiency: 1 } as Structure);
      ecs.addComponent(s2, { type: 'position', x: 5, y: 5, z: 0 } as Position);

      const s3 = ecs.createEntity();
      ecs.addComponent(s3, { type: 'structure', category: 'HABITAT', subType: 'tent', durability: 100, efficiency: 1 } as Structure);
      ecs.addComponent(s3, { type: 'position', x: 25, y: 25, z: 0 } as Position);

      const ids = manager.computeClusters();
      // Should create settlement for the society with structures within 15 tiles
      expect(ids.length).toBe(1);
      const sett = ecs.getComponent<Settlement>(ids[0], 'settlement')!;
      // Both nearby structures should be included
      expect(sett.structureIds.length).toBeGreaterThanOrEqual(2);
      // Distant structure is outside 15-tile radius
      expect(sett.structureIds).not.toContain(s3);
    });

    it('assigns correct settlement level by structure count', () => {
      expect(manager.getSettlementLevel(1)).toBe('Hamlet');
      expect(manager.getSettlementLevel(3)).toBe('Hamlet');
      expect(manager.getSettlementLevel(4)).toBe('Village');
      expect(manager.getSettlementLevel(8)).toBe('Village');
      expect(manager.getSettlementLevel(9)).toBe('Town');
      expect(manager.getSettlementLevel(20)).toBe('Town');
      expect(manager.getSettlementLevel(21)).toBe('City');
    });

    it('generates a name for each settlement', () => {
      const society = ecs.createEntity();
      ecs.addComponent(society, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(society, { type: 'position', x: 0, y: 0, z: 0 } as Position);

      const s1 = ecs.createEntity();
      ecs.addComponent(s1, { type: 'structure', category: 'HABITAT', subType: 'tent', durability: 100, efficiency: 1 } as Structure);
      ecs.addComponent(s1, { type: 'position', x: 0, y: 0, z: 0 } as Position);

      manager.computeClusters();
      const sett = manager.getSettlement(society)!;
      expect(sett.name.length).toBeGreaterThan(0);
    });
  });

  describe('level upgrades', () => {
    it('upgrades settlement when structure count crosses threshold', () => {
      const id = ecs.createEntity();
      ecs.addComponent(id, { type: 'settlement', name: 'X', level: 'Hamlet', structureIds: [], connectedSettlements: [], reputation: 0 } as Settlement);
      // manually add enough structures
      const s = ecs.createEntity();
      ecs.addComponent(s, { type: 'structure', category: 'HABITAT', subType: 'tent', durability: 100, efficiency: 1 } as Structure);
      ecs.addComponent(s, { type: 'position', x: 0, y: 0, z: 0 } as Position);

      const sett = ecs.getComponent<Settlement>(id, 'settlement')!;
      sett.structureIds = [s, s, s, s, s, s, s, s]; // 8 structures
      manager.upgradeSettlements();
      expect(ecs.getComponent<Settlement>(id, 'settlement')!.level).toBe('Village');
    });

    it('upgrades to City at 21 structures', () => {
      const id = ecs.createEntity();
      ecs.addComponent(id, { type: 'settlement', name: 'X', level: 'Hamlet', structureIds: new Array(25).fill('e'), connectedSettlements: [], reputation: 0 } as Settlement);
      manager.upgradeSettlements();
      expect(ecs.getComponent<Settlement>(id, 'settlement')!.level).toBe('City');
    });

    it('does not downgrade', () => {
      const id = ecs.createEntity();
      ecs.addComponent(id, { type: 'settlement', name: 'X', level: 'City', structureIds: [], connectedSettlements: [], reputation: 0 } as Settlement);
      manager.upgradeSettlements();
      expect(ecs.getComponent<Settlement>(id, 'settlement')!.level).toBe('Hamlet');
    });
  });

  describe('road connections', () => {
    it('connects nearby settlements of the same faction', () => {
      const s1 = ecs.createEntity();
      ecs.addComponent(s1, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(s1, { type: 'settlement', name: 'A', level: 'Hamlet', structureIds: [], connectedSettlements: [], reputation: 0 } as Settlement);
      ecs.addComponent(s1, { type: 'position', x: 0, y: 0, z: 0 } as Position);

      const s2 = ecs.createEntity();
      ecs.addComponent(s2, { type: 'society', name: 'B', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(s2, { type: 'settlement', name: 'B', level: 'Hamlet', structureIds: [], connectedSettlements: [], reputation: 0 } as Settlement);
      ecs.addComponent(s2, { type: 'position', x: 5, y: 0, z: 0 } as Position);

      const s3 = ecs.createEntity();
      ecs.addComponent(s3, { type: 'society', name: 'C', faction: 'TECHNOCRAT', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(s3, { type: 'settlement', name: 'C', level: 'Hamlet', structureIds: [], connectedSettlements: [], reputation: 0 } as Settlement);
      ecs.addComponent(s3, { type: 'position', x: 6, y: 0, z: 0 } as Position);

      manager.generateRoads(ROAD_MAX_DISTANCE);
      const a = ecs.getComponent<Settlement>(s1, 'settlement')!;
      const b = ecs.getComponent<Settlement>(s2, 'settlement')!;
      const c = ecs.getComponent<Settlement>(s3, 'settlement')!;
      expect(a.connectedSettlements).toContain(s2);
      expect(b.connectedSettlements).toContain(s1);
      expect(c.connectedSettlements).not.toContain(s1);
    });

    it('does not connect distant settlements', () => {
      const s1 = ecs.createEntity();
      ecs.addComponent(s1, { type: 'society', name: 'A', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(s1, { type: 'settlement', name: 'A', level: 'Hamlet', structureIds: [], connectedSettlements: [], reputation: 0 } as Settlement);
      ecs.addComponent(s1, { type: 'position', x: 0, y: 0, z: 0 } as Position);

      const s2 = ecs.createEntity();
      ecs.addComponent(s2, { type: 'society', name: 'B', faction: 'ANIMIST', population: 10, technologyLevel: 1, resources: 100, happiness: 50 } as Society);
      ecs.addComponent(s2, { type: 'settlement', name: 'B', level: 'Hamlet', structureIds: [], connectedSettlements: [], reputation: 0 } as Settlement);
      ecs.addComponent(s2, { type: 'position', x: 20, y: 0, z: 0 } as Position);

      manager.generateRoads(ROAD_MAX_DISTANCE);
      const a = ecs.getComponent<Settlement>(s1, 'settlement')!;
      expect(a.connectedSettlements).not.toContain(s2);
    });
  });

  describe('reputation', () => {
    it('increases reputation within bounds', () => {
      const id = ecs.createEntity();
      ecs.addComponent(id, { type: 'settlement', name: 'X', level: 'Hamlet', structureIds: [], connectedSettlements: [], reputation: 50 } as Settlement);
      manager.updateReputation(id, 60);
      expect(ecs.getComponent<Settlement>(id, 'settlement')!.reputation).toBe(100);
    });

    it('decreases reputation within bounds', () => {
      const id = ecs.createEntity();
      ecs.addComponent(id, { type: 'settlement', name: 'X', level: 'Hamlet', structureIds: [], connectedSettlements: [], reputation: -50 } as Settlement);
      manager.updateReputation(id, -60);
      expect(ecs.getComponent<Settlement>(id, 'settlement')!.reputation).toBe(-100);
    });
  });
});
