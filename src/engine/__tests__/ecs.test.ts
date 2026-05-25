import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../ecs';

describe('ECS', () => {
  let ecs: ECS;

  beforeEach(() => {
    ecs = new ECS();
  });

  it('creates an entity', () => {
    const id = ecs.createEntity();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  it('adds and gets a component', () => {
    const id = ecs.createEntity();
    const position = { type: 'Position', x: 10, y: 20 };
    ecs.addComponent(id, position as any);
    
    const retrieved = ecs.getComponent(id, 'Position');
    expect(retrieved).toEqual(position);
  });

  it('gets entities with components', () => {
    const e1 = ecs.createEntity();
    const e2 = ecs.createEntity();
    ecs.addComponent(e1, { type: 'A', value: 1 } as any);
    ecs.addComponent(e1, { type: 'B', value: 1 } as any);
    ecs.addComponent(e2, { type: 'A', value: 2 } as any);

    expect(ecs.getEntitiesWith([])).toContain(e1);
    expect(ecs.getEntitiesWith([])).toContain(e2);
    expect(ecs.getEntitiesWith(['A'])).toContain(e1);
    expect(ecs.getEntitiesWith(['A'])).toContain(e2);
    expect(ecs.getEntitiesWith(['B'])).toEqual([e1]);
    expect(ecs.getEntitiesWith(['A', 'B'])).toEqual([e1]);
    expect(ecs.getEntitiesWith(['C'])).toEqual([]);
  });

  it('removes an entity', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, { type: 'A' } as any);
    ecs.removeEntity(id);
    expect(ecs.getEntitiesWith(['A'])).toEqual([]);
    expect(ecs.getComponent(id, 'A')).toBeUndefined();
  });

  it('clears all', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, { type: 'A' } as any);
    ecs.clear();
    expect(ecs.getEntitiesWith([])).toEqual([]);
    expect(ecs.getComponent(id, 'A')).toBeUndefined();
  });

  it('exports and imports state', () => {
    const id = ecs.createEntity();
    ecs.addComponent(id, { type: 'A', val: 5 } as any);
    const state = ecs.exportState();
    expect(state.entities).toContain(id);
    
    const newEcs = new ECS();
    newEcs.importState(state);
    expect(newEcs.getEntitiesWith(['A'])).toContain(id);
    expect(newEcs.getComponent(id, 'A')).toEqual({ type: 'A', val: 5 });
  });
});
