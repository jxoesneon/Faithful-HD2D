
import { Entity, Component } from '../types';

export class ECS {
  private components: Map<string, Map<Entity, any>> = new Map();
  private entities: Set<Entity> = new Set();

  createEntity(): Entity {
    const id = Math.random().toString(36).substring(2, 9);
    this.entities.add(id);
    return id;
  }

  addComponent<T extends Component>(entity: Entity, component: T) {
    if (!this.components.has(component.type)) {
      this.components.set(component.type, new Map());
    }
    this.components.get(component.type)!.set(entity, component);
  }

  getComponent<T extends Component>(entity: Entity, type: string): T | undefined {
    return this.components.get(type)?.get(entity);
  }

  getEntitiesWith(types: string[]): Entity[] {
    if (types.length === 0) return Array.from(this.entities);
    
    // Start with the smallest set
    let smallestSet: Map<Entity, any> | undefined;
    let minSize = Infinity;
    
    for (const type of types) {
      const set = this.components.get(type);
      if (!set) return [];
      if (set.size < minSize) {
        minSize = set.size;
        smallestSet = set;
      }
    }

    if (!smallestSet) return [];

    return Array.from(smallestSet.keys()).filter(entity => 
      types.every(type => this.components.get(type)?.has(entity))
    );
  }

  removeEntity(entity: Entity) {
    this.entities.delete(entity);
    for (const map of this.components.values()) {
      map.delete(entity);
    }
  }

  clear() {
    this.entities.clear();
    this.components.clear();
  }

  exportState(): { entities: string[]; components: { type: string; entity: string; data: any }[] } {
    const list: { type: string; entity: string; data: any }[] = [];
    for (const [type, map] of this.components.entries()) {
      for (const [entity, data] of map.entries()) {
        list.push({ type, entity, data });
      }
    }
    return {
      entities: Array.from(this.entities),
      components: list
    };
  }

  importState(state: { entities: string[]; components: { type: string; entity: string; data: any }[] }) {
    this.clear();
    for (const ent of state.entities) {
      this.entities.add(ent);
    }
    for (const comp of state.components) {
      this.addComponent(comp.entity, comp.data);
    }
  }
}
