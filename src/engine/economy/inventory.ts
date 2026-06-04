import type { ECS } from '../ecs';
import type {
  Entity,
  Item,
  Inventory,
  Equipment,
  EquipmentSlot,
  ItemRarity,
  ItemType,
  GroundItem,
  Position,
} from '../../types';

/**
 * Loot table entry for a specific biome / creature type.
 */
export interface LootEntry {
  itemName: string;
  itemType: ItemType;
  rarity: ItemRarity;
  weight: number; // relative drop weight
  minDurability: number;
  maxDurability: number;
  baseWeight: number;
  effects?: import('../../types').ItemEffect[];
  setId?: string;
  levelRequirement?: number;
}

export interface LootTable {
  biomeOrCreature: string;
  entries: LootEntry[];
}

/**
 * Default loot tables per biome / creature category.
 */
export const DEFAULT_LOOT_TABLES: LootTable[] = [
  {
    biomeOrCreature: 'FOREST',
    entries: [
      { itemName: 'Wooden Club', itemType: 'Weapon', rarity: 'Common', weight: 40, minDurability: 20, maxDurability: 40, baseWeight: 2.0 },
      { itemName: 'Bark Armor', itemType: 'Armor', rarity: 'Common', weight: 30, minDurability: 15, maxDurability: 30, baseWeight: 3.0 },
      { itemName: 'Forest Relic', itemType: 'Relic', rarity: 'Uncommon', weight: 10, minDurability: 50, maxDurability: 50, baseWeight: 0.5 },
    ],
  },
  {
    biomeOrCreature: 'MOUNTAIN',
    entries: [
      { itemName: 'Stone Axe', itemType: 'Weapon', rarity: 'Common', weight: 35, minDurability: 30, maxDurability: 60, baseWeight: 3.5 },
      { itemName: 'Iron Plate', itemType: 'Armor', rarity: 'Rare', weight: 15, minDurability: 80, maxDurability: 100, baseWeight: 8.0 },
      { itemName: 'Crystal Shard', itemType: 'Material', rarity: 'Uncommon', weight: 20, minDurability: 100, maxDurability: 100, baseWeight: 1.0 },
    ],
  },
  {
    biomeOrCreature: 'WOLF',
    entries: [
      { itemName: 'Wolf Fang', itemType: 'Material', rarity: 'Common', weight: 50, minDurability: 100, maxDurability: 100, baseWeight: 0.2 },
      { itemName: 'Hunter\'s Talisman', itemType: 'Accessory', rarity: 'Uncommon', weight: 10, minDurability: 40, maxDurability: 40, baseWeight: 0.3, effects: [{ stat: 'huntingSkill', value: 5, operation: 'add' }] },
    ],
  },
  {
    biomeOrCreature: 'CELESTIAL',
    entries: [
      { itemName: 'Starlight Blade', itemType: 'Weapon', rarity: 'Legendary', weight: 5, minDurability: 200, maxDurability: 200, baseWeight: 2.0, effects: [{ stat: 'faithDamage', value: 1.5, operation: 'multiply' }] },
      { itemName: 'Divine Halo', itemType: 'Accessory', rarity: 'Mythic', weight: 1, minDurability: 100, maxDurability: 100, baseWeight: 0.1, effects: [{ stat: 'devotionGain', value: 10, operation: 'add' }] },
    ],
  },
];

/**
 * Rarity multiplier for item effects.
 */
export const RARITY_EFFECT_MULTIPLIER: Record<ItemRarity, number> = {
  Common: 1.0,
  Uncommon: 1.25,
  Rare: 1.6,
  Epic: 2.0,
  Legendary: 2.5,
  Mythic: 3.5,
};

/**
 * InventoryManager handles item creation, equipment, loot tables, degradation, and ground items.
 * Standalone manager — takes ECS as a constructor param.
 */
export class InventoryManager {
  private lootTables: Map<string, LootTable> = new Map();

  constructor(private ecs: ECS) {
    for (const table of DEFAULT_LOOT_TABLES) {
      this.lootTables.set(table.biomeOrCreature, table);
    }
  }

  /**
   * Initialize an inventory component on an entity.
   * @param entity The entity to give an inventory.
   * @param maxWeight Maximum carrying weight.
   */
  createInventory(entity: Entity, maxWeight = 50): void {
    const inv: Inventory = {
      type: 'inventory',
      items: [],
      maxWeight,
      currentWeight: 0,
    };
    this.ecs.addComponent(entity, inv);
  }

  /**
   * Initialize an equipment component on an entity.
   */
  createEquipment(entity: Entity): void {
    const eq: Equipment = {
      type: 'equipment',
      slots: {},
      setBonusesActive: [],
    };
    this.ecs.addComponent(entity, eq);
  }

  /**
   * Create an item entity.
   * @returns The created item entity ID.
   */
  createItem(
    name: string,
    itemType: ItemType,
    rarity: ItemRarity,
    durability: number,
    maxDurability: number,
    weight: number,
    effects: import('../../types').ItemEffect[] = [],
    options: { setId?: string; activeAbility?: import('../../types').ActiveAbility; levelRequirement?: number; quality?: 'Normal' | 'Refined' | 'Masterwork' } = {}
  ): Entity {
    const id = this.ecs.createEntity();
    const scaledEffects = effects.map((ef) => ({
      ...ef,
      value: ef.operation === 'multiply' ? ef.value : ef.value * RARITY_EFFECT_MULTIPLIER[rarity],
    }));

    const item: Item = {
      type: 'item',
      name,
      itemType,
      rarity,
      durability,
      maxDurability,
      weight,
      effects: scaledEffects,
      setId: options.setId,
      activeAbility: options.activeAbility,
      quality: options.quality ?? 'Normal',
      levelRequirement: options.levelRequirement,
    };
    this.ecs.addComponent(id, item);
    return id;
  }

  /**
   * Pick a random loot entry from a table weighted by drop weight.
   */
  rollLoot(biomeOrCreature: string): LootEntry | null {
    const table = this.lootTables.get(biomeOrCreature);
    if (!table || table.entries.length === 0) return null;

    const totalWeight = table.entries.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of table.entries) {
      roll -= entry.weight;
      if (roll <= 0) return entry;
    }
    return table.entries[table.entries.length - 1];
  }

  /**
   * Generate a complete item entity from a loot table roll.
   */
  generateLootItem(biomeOrCreature: string): Entity | null {
    const entry = this.rollLoot(biomeOrCreature);
    if (!entry) return null;

    const durability = entry.minDurability + Math.random() * (entry.maxDurability - entry.minDurability);
    const maxDurability = entry.maxDurability;
    return this.createItem(
      entry.itemName,
      entry.itemType,
      entry.rarity,
      Math.floor(durability),
      maxDurability,
      entry.baseWeight,
      entry.effects,
      { setId: entry.setId, levelRequirement: entry.levelRequirement }
    );
  }

  /**
   * Add an item entity to an entity's inventory.
   * @returns true if successfully added, false if over capacity.
   */
  addItemToInventory(entity: Entity, itemEntity: Entity): boolean {
    const inv = this.ecs.getComponent<Inventory>(entity, 'inventory');
    const item = this.ecs.getComponent<Item>(itemEntity, 'item');
    if (!inv || !item) return false;

    if (inv.currentWeight + item.weight > inv.maxWeight) return false;

    inv.items.push(itemEntity);
    inv.currentWeight += item.weight;
    this.ecs.addComponent(entity, inv);
    return true;
  }

  /**
   * Remove an item entity from an entity's inventory.
   * @returns true if removed.
   */
  removeItemFromInventory(entity: Entity, itemEntity: Entity): boolean {
    const inv = this.ecs.getComponent<Inventory>(entity, 'inventory');
    if (!inv) return false;

    const idx = inv.items.indexOf(itemEntity);
    if (idx === -1) return false;

    const item = this.ecs.getComponent<Item>(itemEntity, 'item');
    inv.items.splice(idx, 1);
    if (item) {
      inv.currentWeight = Math.max(0, inv.currentWeight - item.weight);
    }
    this.ecs.addComponent(entity, inv);
    return true;
  }

  /**
   * Equip an item from inventory into a slot.
   * Unequips existing item in that slot (if any) back to inventory.
   * @returns true if equipped.
   */
  equipItem(entity: Entity, itemEntity: Entity, slot: EquipmentSlot): boolean {
    const eq = this.ecs.getComponent<Equipment>(entity, 'equipment');
    const inv = this.ecs.getComponent<Inventory>(entity, 'inventory');
    const item = this.ecs.getComponent<Item>(itemEntity, 'item');
    if (!eq || !inv || !item) return false;

    // Item must be in inventory
    if (!inv.items.includes(itemEntity)) return false;

    // Unequip current if present
    const current = eq.slots[slot];
    if (current) {
      this.unequipItem(entity, slot);
    }

    // Remove from inventory and place in slot
    this.removeItemFromInventory(entity, itemEntity);
    eq.slots[slot] = itemEntity;
    this.updateSetBonuses(eq);
    this.ecs.addComponent(entity, eq);
    return true;
  }

  /**
   * Unequip an item from a slot back into inventory.
   * @returns true if unequipped.
   */
  unequipItem(entity: Entity, slot: EquipmentSlot): boolean {
    const eq = this.ecs.getComponent<Equipment>(entity, 'equipment');
    const inv = this.ecs.getComponent<Inventory>(entity, 'inventory');
    if (!eq || !inv) return false;

    const itemEntity = eq.slots[slot];
    if (!itemEntity) return false;

    if (!this.addItemToInventory(entity, itemEntity)) return false;

    delete eq.slots[slot];
    this.updateSetBonuses(eq);
    this.ecs.addComponent(entity, eq);
    return true;
  }

  /**
   * Apply durability loss to an equipped item or an item in inventory.
   * @returns true if the item broke (durability <= 0).
   */
  degradeItem(itemEntity: Entity, amount: number): boolean {
    const item = this.ecs.getComponent<Item>(itemEntity, 'item');
    if (!item) return false;

    item.durability = Math.max(0, item.durability - amount);
    this.ecs.addComponent(itemEntity, item);
    return item.durability <= 0;
  }

  /**
   * Repair an item by restoring durability up to max.
   * @param amount Amount of durability to restore.
   * @returns Actual amount restored.
   */
  repairItem(itemEntity: Entity, amount: number): number {
    const item = this.ecs.getComponent<Item>(itemEntity, 'item');
    if (!item) return 0;

    const before = item.durability;
    item.durability = Math.min(item.maxDurability, item.durability + amount);
    this.ecs.addComponent(itemEntity, item);
    return item.durability - before;
  }

  /**
   * Calculate total passive bonuses from all equipped items.
   */
  getTotalEquipmentBonuses(entity: Entity): Record<string, number> {
    const eq = this.ecs.getComponent<Equipment>(entity, 'equipment');
    if (!eq) return {};

    const bonuses: Record<string, number> = {};
    for (const slot of Object.values(eq.slots)) {
      if (!slot) continue;
      const item = this.ecs.getComponent<Item>(slot, 'item');
      if (!item) continue;
      for (const effect of item.effects) {
        if (effect.condition && !this.checkCondition(entity, effect.condition)) continue;
        if (effect.operation === 'add' || effect.operation === 'flat') {
          bonuses[effect.stat] = (bonuses[effect.stat] ?? 0) + effect.value;
        } else if (effect.operation === 'multiply') {
          bonuses[effect.stat] = (bonuses[effect.stat] ?? 1) * effect.value;
        }
      }
    }

    // Apply set bonuses
    for (const setId of eq.setBonusesActive) {
      bonuses[`set_${setId}`] = (bonuses[`set_${setId}`] ?? 0) + 1;
    }

    return bonuses;
  }

  /**
   * Drop an item onto the ground at a position.
   * @param itemEntity The item to drop.
   * @param x World x.
   * @param y World y.
   * @param despawnTime Seconds until item vanishes from ground.
   * @returns The ground item entity ID.
   */
  dropItem(itemEntity: Entity, x: number, y: number, despawnTime = 120): Entity {
    const id = this.ecs.createEntity();
    const ground: GroundItem = {
      type: 'groundItem',
      itemEntity,
      dropTime: Date.now() / 1000,
      despawnTime,
      positionX: x,
      positionY: y,
    };
    this.ecs.addComponent(id, ground);
    this.ecs.addComponent(id, { type: 'position', x, y, z: 0 } as Position);
    return id;
  }

  /**
   * Pick up a ground item into an entity's inventory.
   * @param picker The entity picking up.
   * @param groundItemEntity The ground item entity.
   * @returns true if picked up.
   */
  pickupItem(picker: Entity, groundItemEntity: Entity): boolean {
    const ground = this.ecs.getComponent<GroundItem>(groundItemEntity, 'groundItem');
    if (!ground) return false;

    const success = this.addItemToInventory(picker, ground.itemEntity);
    if (success) {
      this.ecs.removeEntity(groundItemEntity);
    }
    return success;
  }

  /**
   * Remove expired ground items.
   * @param currentTime Current time in seconds (e.g. Date.now()/1000).
   */
  cleanupGroundItems(currentTime: number): void {
    const grounds = this.ecs.getEntitiesWith(['groundItem']);
    for (const entity of grounds) {
      const ground = this.ecs.getComponent<GroundItem>(entity, 'groundItem');
      if (!ground) continue;
      if (currentTime - ground.dropTime >= ground.despawnTime) {
        this.ecs.removeEntity(entity);
        // Optionally also remove the item entity itself
        this.ecs.removeEntity(ground.itemEntity);
      }
    }
  }

  /**
   * Get all ground items within a radius.
   */
  getGroundItemsInRadius(x: number, y: number, radius: number): Array<{ entity: Entity; ground: GroundItem; item: Item | undefined }> {
    const result: Array<{ entity: Entity; ground: GroundItem; item: Item | undefined }> = [];
    const grounds = this.ecs.getEntitiesWith(['groundItem']);
    const r2 = radius * radius;
    for (const entity of grounds) {
      const ground = this.ecs.getComponent<GroundItem>(entity, 'groundItem');
      if (!ground) continue;
      const dx = ground.positionX - x;
      const dy = ground.positionY - y;
      if (dx * dx + dy * dy <= r2) {
        const item = this.ecs.getComponent<Item>(ground.itemEntity, 'item');
        result.push({ entity, ground, item });
      }
    }
    return result;
  }

  private updateSetBonuses(eq: Equipment): void {
    const setCounts: Record<string, number> = {};
    for (const slot of Object.values(eq.slots)) {
      if (!slot) continue;
      const item = this.ecs.getComponent<Item>(slot, 'item');
      if (item?.setId) {
        setCounts[item.setId] = (setCounts[item.setId] ?? 0) + 1;
      }
    }
    eq.setBonusesActive = Object.entries(setCounts)
      .filter(([, count]) => count >= 2)
      .map(([setId]) => setId);
  }

  private checkCondition(_entity: Entity, _condition: string): boolean {
    // Placeholder for condition evaluation (e.g. 'night', 'combat', etc.)
    return true;
  }
}
