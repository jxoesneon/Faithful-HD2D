import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { InventoryManager, DEFAULT_LOOT_TABLES, RARITY_EFFECT_MULTIPLIER } from '../inventory';
import type { Inventory, Equipment, Item, GroundItem, Position } from '../../../types';

describe('InventoryManager', () => {
  let ecs: ECS;
  let manager: InventoryManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new InventoryManager(ecs);
  });

  it('creates inventory and equipment', () => {
    const entity = ecs.createEntity();
    manager.createInventory(entity, 100);
    manager.createEquipment(entity);

    const inv = ecs.getComponent<Inventory>(entity, 'inventory');
    expect(inv).toBeDefined();
    expect(inv!.maxWeight).toBe(100);
    expect(inv!.items).toEqual([]);

    const eq = ecs.getComponent<Equipment>(entity, 'equipment');
    expect(eq).toBeDefined();
    expect(eq!.slots).toEqual({});
  });

  it('creates item entities', () => {
    const item = manager.createItem('Iron Sword', 'Weapon', 'Rare', 80, 100, 3.0, [
      { stat: 'damage', value: 10, operation: 'add' }
    ]);
    const data = ecs.getComponent<Item>(item, 'item');
    expect(data).toBeDefined();
    expect(data!.name).toBe('Iron Sword');
    expect(data!.rarity).toBe('Rare');
    expect(data!.quality).toBe('Normal');
  });

  it('scales effects by rarity', () => {
    const itemCommon = manager.createItem('Stick', 'Weapon', 'Common', 10, 10, 1, [
      { stat: 'damage', value: 10, operation: 'add' }
    ]);
    const commonData = ecs.getComponent<Item>(itemCommon, 'item');
    expect(commonData!.effects[0].value).toBe(10);

    const itemRare = manager.createItem('Good Stick', 'Weapon', 'Rare', 10, 10, 1, [
      { stat: 'damage', value: 10, operation: 'add' }
    ]);
    const rareData = ecs.getComponent<Item>(itemRare, 'item');
    expect(rareData!.effects[0].value).toBe(10 * RARITY_EFFECT_MULTIPLIER.Rare);
  });

  it('adds and removes items from inventory', () => {
    const entity = ecs.createEntity();
    manager.createInventory(entity, 10);

    const item = manager.createItem('Rock', 'Material', 'Common', 100, 100, 2.0);
    expect(manager.addItemToInventory(entity, item)).toBe(true);

    const inv = ecs.getComponent<Inventory>(entity, 'inventory');
    expect(inv!.items).toContain(item);
    expect(inv!.currentWeight).toBe(2.0);

    expect(manager.addItemToInventory(entity, item)).toBe(true);
    expect(inv!.currentWeight).toBe(4.0);

    // Exceed capacity
    const heavy = manager.createItem('Anvil', 'Material', 'Common', 100, 100, 20.0);
    expect(manager.addItemToInventory(entity, heavy)).toBe(false);

    expect(manager.removeItemFromInventory(entity, item)).toBe(true);
    const inv2 = ecs.getComponent<Inventory>(entity, 'inventory');
    expect(inv2!.items.length).toBe(1);
    expect(inv2!.currentWeight).toBe(2.0);
  });

  it('equips and unequips items', () => {
    const entity = ecs.createEntity();
    manager.createInventory(entity, 50);
    manager.createEquipment(entity);

    const sword = manager.createItem('Sword', 'Weapon', 'Common', 100, 100, 3.0);
    manager.addItemToInventory(entity, sword);

    expect(manager.equipItem(entity, sword, 'mainHand')).toBe(true);
    const eq = ecs.getComponent<Equipment>(entity, 'equipment');
    expect(eq!.slots.mainHand).toBe(sword);

    // Inventory should no longer contain the equipped item
    const inv = ecs.getComponent<Inventory>(entity, 'inventory');
    expect(inv!.items).not.toContain(sword);

    expect(manager.unequipItem(entity, 'mainHand')).toBe(true);
    const eq2 = ecs.getComponent<Equipment>(entity, 'equipment');
    expect(eq2!.slots.mainHand).toBeUndefined();

    const inv2 = ecs.getComponent<Inventory>(entity, 'inventory');
    expect(inv2!.items).toContain(sword);
  });

  it('does not equip item not in inventory', () => {
    const entity = ecs.createEntity();
    manager.createInventory(entity, 50);
    manager.createEquipment(entity);

    const sword = manager.createItem('Sword', 'Weapon', 'Common', 100, 100, 3.0);
    expect(manager.equipItem(entity, sword, 'mainHand')).toBe(false);
  });

  it('degrades and repairs items', () => {
    const item = manager.createItem('Shield', 'Armor', 'Common', 100, 100, 5.0);
    expect(manager.degradeItem(item, 30)).toBe(false);
    const data = ecs.getComponent<Item>(item, 'item');
    expect(data!.durability).toBe(70);

    expect(manager.degradeItem(item, 80)).toBe(true);
    const data2 = ecs.getComponent<Item>(item, 'item');
    expect(data2!.durability).toBe(0);

    expect(manager.repairItem(item, 50)).toBe(50);
    const data3 = ecs.getComponent<Item>(item, 'item');
    expect(data3!.durability).toBe(50);
  });

  it('calculates equipment bonuses', () => {
    const entity = ecs.createEntity();
    manager.createInventory(entity, 50);
    manager.createEquipment(entity);

    const ring = manager.createItem('Power Ring', 'Accessory', 'Common', 100, 100, 0.5, [
      { stat: 'strength', value: 5, operation: 'add' }
    ]);
    manager.addItemToInventory(entity, ring);
    manager.equipItem(entity, ring, 'accessory1');

    const bonuses = manager.getTotalEquipmentBonuses(entity);
    expect(bonuses.strength).toBe(5);
  });

  it('handles set bonuses', () => {
    const entity = ecs.createEntity();
    manager.createInventory(entity, 50);
    manager.createEquipment(entity);

    const helm = manager.createItem('Dragon Helm', 'Armor', 'Rare', 100, 100, 2.0, [], { setId: 'dragon' });
    const chest = manager.createItem('Dragon Chest', 'Armor', 'Rare', 100, 100, 4.0, [], { setId: 'dragon' });

    manager.addItemToInventory(entity, helm);
    manager.addItemToInventory(entity, chest);
    manager.equipItem(entity, helm, 'head');
    manager.equipItem(entity, chest, 'chest');

    const eq = ecs.getComponent<Equipment>(entity, 'equipment');
    expect(eq!.setBonusesActive).toContain('dragon');

    const bonuses = manager.getTotalEquipmentBonuses(entity);
    expect(bonuses['set_dragon']).toBe(1);
  });

  it('rolls loot from tables', () => {
    const entry = manager.rollLoot('FOREST');
    expect(entry).toBeDefined();
    expect(DEFAULT_LOOT_TABLES.find(t => t.biomeOrCreature === 'FOREST')!.entries.map(e => e.itemName)).toContain(entry!.itemName);
  });

  it('returns null for unknown loot table', () => {
    expect(manager.rollLoot('UNKNOWN_BIOME')).toBeNull();
  });

  it('generates loot items', () => {
    const item = manager.generateLootItem('WOLF');
    expect(item).toBeDefined();
    if (item) {
      const data = ecs.getComponent<Item>(item, 'item');
      expect(data).toBeDefined();
    }
  });

  it('drops and picks up items', () => {
    const picker = ecs.createEntity();
    manager.createInventory(picker, 50);

    const item = manager.createItem('Gem', 'Material', 'Rare', 100, 100, 1.0);
    const ground = manager.dropItem(item, 10, 20, 60);

    const groundData = ecs.getComponent<GroundItem>(ground, 'groundItem');
    expect(groundData).toBeDefined();
    expect(groundData!.positionX).toBe(10);
    expect(groundData!.positionY).toBe(20);

    expect(manager.pickupItem(picker, ground)).toBe(true);
    expect(ecs.getComponent<GroundItem>(ground, 'groundItem')).toBeUndefined();

    const inv = ecs.getComponent<Inventory>(picker, 'inventory');
    expect(inv!.items).toContain(item);
  });

  it('cleans up expired ground items', () => {
    const item = manager.createItem('Old Boot', 'Material', 'Common', 10, 10, 1.0);
    const ground = manager.dropItem(item, 0, 0, 5);

    manager.cleanupGroundItems(Date.now() / 1000 + 10);
    expect(ecs.getEntitiesWith(['groundItem']).includes(ground)).toBe(false);
  });

  it('gets ground items in radius', () => {
    const item1 = manager.createItem('Coin', 'Material', 'Common', 100, 100, 0.1);
    manager.dropItem(item1, 0, 0, 100);

    const item2 = manager.createItem('Far Coin', 'Material', 'Common', 100, 100, 0.1);
    manager.dropItem(item2, 100, 0, 100);

    const nearby = manager.getGroundItemsInRadius(0, 0, 10);
    expect(nearby.length).toBe(1);
    expect(nearby[0].item!.name).toBe('Coin');
  });
});
