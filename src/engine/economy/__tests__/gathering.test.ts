import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { GatheringManager } from '../gathering';
import type { Flora, Position, Movement, GatheringTask, FloatingText, Structure, ResourceStorage } from '../../../types';

describe('GatheringManager', () => {
  let ecs: ECS;
  let manager: GatheringManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new GatheringManager(ecs);
  });

  it('starts gathering on valid flora', () => {
    const gatherer = ecs.createEntity();
    ecs.addComponent(gatherer, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(gatherer, { type: 'movement', speed: 1, vx: 0, vy: 0, targetX: null, targetY: null, activityState: 'IDLE' } as Movement);

    const flora = ecs.createEntity();
    ecs.addComponent(flora, { type: 'flora', category: 'TREE', subType: 'OAK', growth: 80, resourcesYield: 5, isHarvested: false } as Flora);
    ecs.addComponent(flora, { type: 'position', x: 1, y: 0, z: 0 } as Position);

    const task = manager.startGathering(gatherer, flora);
    expect(task).toBeDefined();
    expect(task!.resourceType).toBe('Wood');
    expect(task!.targetEntity).toBe(flora);

    const movement = ecs.getComponent<Movement>(gatherer, 'movement');
    expect(movement!.activityState).toBe('MOVING_TO_RESOURCE');
    expect(movement!.targetX).toBe(1);
  });

  it('returns null for harvested flora', () => {
    const gatherer = ecs.createEntity();
    ecs.addComponent(gatherer, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(gatherer, { type: 'movement', speed: 1, vx: 0, vy: 0, targetX: null, targetY: null, activityState: 'IDLE' } as Movement);

    const flora = ecs.createEntity();
    ecs.addComponent(flora, { type: 'flora', category: 'TREE', subType: 'OAK', growth: 80, resourcesYield: 0, isHarvested: true } as Flora);
    ecs.addComponent(flora, { type: 'position', x: 1, y: 0, z: 0 } as Position);

    expect(manager.startGathering(gatherer, flora)).toBeNull();
  });

  it('ticks gathering to completion', () => {
    const gatherer = ecs.createEntity();
    ecs.addComponent(gatherer, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(gatherer, { type: 'movement', speed: 1, vx: 0, vy: 0, targetX: null, targetY: null, activityState: 'IDLE' } as Movement);

    const flora = ecs.createEntity();
    ecs.addComponent(flora, { type: 'flora', category: 'TREE', subType: 'OAK', growth: 80, resourcesYield: 3, isHarvested: false } as Flora);
    ecs.addComponent(flora, { type: 'position', x: 0, y: 0, z: 0 } as Position);

    // Add nearby storage for deposited resources
    const storageStruct = ecs.createEntity();
    ecs.addComponent(storageStruct, { type: 'structure', category: 'HABITAT', subType: 'tent', durability: 100, efficiency: 1 } as Structure);
    ecs.addComponent(storageStruct, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(storageStruct, { type: 'resourceStorage', capacity: 100, contents: {}, structureType: 'HABITAT' } as ResourceStorage);

    manager.startGathering(gatherer, flora);

    const result = manager.tickGathering(gatherer, 10);
    expect(result.completed).toBe(true);
    expect(result.amountCollected).toBe(3);

    const updatedFlora = ecs.getComponent<Flora>(flora, 'flora');
    expect(updatedFlora!.isHarvested).toBe(true);
    expect(updatedFlora!.resourcesYield).toBe(0);
  });

  it('cancels gathering', () => {
    const gatherer = ecs.createEntity();
    ecs.addComponent(gatherer, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(gatherer, { type: 'movement', speed: 1, vx: 0, vy: 0, targetX: null, targetY: null, activityState: 'IDLE' } as Movement);

    const flora = ecs.createEntity();
    ecs.addComponent(flora, { type: 'flora', category: 'TREE', subType: 'OAK', growth: 80, resourcesYield: 5, isHarvested: false } as Flora);
    ecs.addComponent(flora, { type: 'position', x: 0, y: 0, z: 0 } as Position);

    manager.startGathering(gatherer, flora);
    manager.cancelGathering(gatherer);

    const movement = ecs.getComponent<Movement>(gatherer, 'movement');
    expect(movement!.activityState).toBe('IDLE');
  });

  it('auto-gather picks nearest unharvested flora', () => {
    const gatherer = ecs.createEntity();
    ecs.addComponent(gatherer, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(gatherer, { type: 'movement', speed: 1, vx: 0, vy: 0, targetX: null, targetY: null, activityState: 'IDLE' } as Movement);

    const flora1 = ecs.createEntity();
    ecs.addComponent(flora1, { type: 'flora', category: 'TREE', subType: 'OAK', growth: 80, resourcesYield: 5, isHarvested: false } as Flora);
    ecs.addComponent(flora1, { type: 'position', x: 5, y: 0, z: 0 } as Position);

    const flora2 = ecs.createEntity();
    ecs.addComponent(flora2, { type: 'flora', category: 'TREE', subType: 'OAK', growth: 80, resourcesYield: 5, isHarvested: false } as Flora);
    ecs.addComponent(flora2, { type: 'position', x: 10, y: 0, z: 0 } as Position);

    const target = manager.autoGather(gatherer);
    expect(target).toBe(flora1);
  });

  it('auto-gather returns null if no flora available', () => {
    const gatherer = ecs.createEntity();
    ecs.addComponent(gatherer, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(gatherer, { type: 'movement', speed: 1, vx: 0, vy: 0, targetX: null, targetY: null, activityState: 'IDLE' } as Movement);

    expect(manager.autoGather(gatherer)).toBeNull();
  });

  it('regrows harvested flora', () => {
    const flora = ecs.createEntity();
    ecs.addComponent(flora, { type: 'flora', category: 'TREE', subType: 'OAK', growth: 100, resourcesYield: 0, isHarvested: true } as Flora);

    manager.regrowFlora(10, 1);
    const updated = ecs.getComponent<Flora>(flora, 'flora');
    expect(updated!.resourcesYield).toBeGreaterThan(0);
    expect(updated!.isHarvested).toBe(false);
  });

  it('spawns and updates floating text', () => {
    const id = manager.spawnFloatingText(5, 5, '+10 Wood', '#8B4513');
    expect(ecs.getEntitiesWith(['floatingText'])).toContain(id);

    manager.updateFloatingText(0.5);
    const ft = ecs.getComponent<FloatingText>(id, 'floatingText');
    expect(ft!.elapsed).toBe(0.5);

    manager.updateFloatingText(2);
    expect(ecs.getEntitiesWith(['floatingText']).includes(id)).toBe(false);
  });

  it('returns active tasks', () => {
    const gatherer = ecs.createEntity();
    ecs.addComponent(gatherer, { type: 'position', x: 0, y: 0, z: 0 } as Position);
    ecs.addComponent(gatherer, { type: 'movement', speed: 1, vx: 0, vy: 0, targetX: null, targetY: null, activityState: 'IDLE' } as Movement);

    const flora = ecs.createEntity();
    ecs.addComponent(flora, { type: 'flora', category: 'TREE', subType: 'OAK', growth: 80, resourcesYield: 5, isHarvested: false } as Flora);
    ecs.addComponent(flora, { type: 'position', x: 0, y: 0, z: 0 } as Position);

    manager.startGathering(gatherer, flora, true);
    const tasks = manager.getActiveTasks();
    expect(tasks.length).toBe(1);
    expect(tasks[0].gatherer).toBe(gatherer);
    expect(tasks[0].task.isAutoGather).toBe(true);
  });
});
