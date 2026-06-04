import type { Entity, Position, Squad, FormationType } from '../../types';
import type { ECS as ECSType } from '../ecs';

export type { Squad, FormationType };

/** Offset from leader for a given formation slot index */
export interface FormationOffset {
  x: number;
  y: number;
}

const FORMATION_TEMPLATES: Record<FormationType, (index: number, spacing: number) => FormationOffset> = {
  Line: (index, spacing) => ({ x: (index - 1) * spacing, y: 0 }),
  Wedge: (index, spacing) => {
    if (index <= 1) return { x: 0, y: 0 };
    const row = Math.floor(index / 2);
    const side = index % 2 === 0 ? -1 : 1;
    return { x: side * row * spacing, y: row * spacing };
  },
  Circle: (index, spacing) => {
    const angle = (index * Math.PI * 2) / 8;
    return { x: Math.cos(angle) * spacing * 2, y: Math.sin(angle) * spacing * 2 };
  },
  Column: (index, spacing) => ({ x: 0, y: (index - 1) * spacing }),
  Scatter: (index, spacing) => {
    const pseudoRandom = Math.sin(index * 12.9898) * 43758.5453;
    const rand = pseudoRandom - Math.floor(pseudoRandom);
    const angle = rand * Math.PI * 2;
    const radius = spacing * (1 + (index % 3));
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  },
};

export function getFormationOffset(formation: FormationType, index: number, spacing: number): FormationOffset {
  return FORMATION_TEMPLATES[formation](index, spacing);
}

export function createSquadComponent(
  squadId: string,
  leaderId: Entity,
  members: Entity[],
  formation: FormationType = 'Line',
  spacing: number = 1.5
): Squad {
  return {
    type: 'squad',
    squadId,
    leaderId,
    members,
    formation,
    spacing,
  };
}

export interface SquadState {
  squadId: string;
  leaderId: Entity;
  members: Entity[];
  spacing: number;
  sharedTarget?: Entity;
  isRetreating: boolean;
}

export interface SquadManagerOptions {
  defaultSpacing?: number;
  maxSquadSize?: number;
}

export class SquadManager {
  private ecs: ECSType;
  private squads = new Map<string, SquadState>();
  private options: Required<SquadManagerOptions>;

  constructor(ecs: ECSType, options: SquadManagerOptions = {}) {
    this.ecs = ecs;
    this.options = {
      defaultSpacing: 1.5,
      maxSquadSize: 12,
      ...options,
    };
  }

  createSquad(leaderId: Entity, formation: FormationType = 'Line', spacing?: number): string {
    const squadId = `squad_${Math.random().toString(36).substring(2, 9)}`;
    const sp = spacing ?? this.options.defaultSpacing;
    const comp = createSquadComponent(squadId, leaderId, [leaderId], formation, sp);
    this.ecs.addComponent(leaderId, comp);
    this.squads.set(squadId, {
      squadId,
      leaderId,
      members: [leaderId],
      spacing: sp,
      isRetreating: false,
    });
    return squadId;
  }

  assignToSquad(entity: Entity, squadId: string): boolean {
    const squad = this.squads.get(squadId);
    if (!squad || squad.members.length >= this.options.maxSquadSize) return false;

    const existing = this.ecs.getComponent<Squad>(entity, 'squad');
    if (existing && existing.squadId) {
      this.removeFromSquad(entity);
    }

    squad.members.push(entity);
    const comp = createSquadComponent(squadId, squad.leaderId, squad.members, 'Line', squad.spacing);
    this.ecs.addComponent(entity, comp);
    // Sync members on all existing members
    for (const m of squad.members) {
      const c = createSquadComponent(squadId, squad.leaderId, squad.members, 'Line', squad.spacing);
      this.ecs.addComponent(m, c);
    }
    return true;
  }

  removeFromSquad(entity: Entity): void {
    const comp = this.ecs.getComponent<Squad>(entity, 'squad');
    if (!comp || !comp.squadId) return;

    const squad = this.squads.get(comp.squadId);
    if (squad) {
      squad.members = squad.members.filter((m) => m !== entity);
      if (squad.leaderId === entity && squad.members.length > 0) {
        squad.leaderId = squad.members[0];
      }
      if (squad.members.length === 0) {
        this.squads.delete(comp.squadId);
      } else {
        for (const m of squad.members) {
          const c = createSquadComponent(comp.squadId, squad.leaderId, squad.members, 'Line', squad.spacing);
          this.ecs.addComponent(m, c);
        }
      }
    }

    this.ecs.addComponent(entity, { type: 'squad', squadId: '', leaderId: '', members: [], formation: 'Line', spacing: 0 });
  }

  setLeader(squadId: string, leaderId: Entity): boolean {
    const squad = this.squads.get(squadId);
    if (!squad || !squad.members.includes(leaderId)) return false;

    squad.leaderId = leaderId;
    for (const m of squad.members) {
      const comp = this.ecs.getComponent<Squad>(m, 'squad');
      if (comp) {
        this.ecs.addComponent(m, { ...comp, leaderId: squad.leaderId });
      }
    }
    // Also resync members array and spacing on all components
    for (const m of squad.members) {
      const c = createSquadComponent(squadId, squad.leaderId, squad.members, 'Line', squad.spacing);
      this.ecs.addComponent(m, c);
    }
    return true;
  }

  setFormation(squadId: string, formation: FormationType): boolean {
    const squad = this.squads.get(squadId);
    if (!squad) return false;

    for (const m of squad.members) {
      const comp = this.ecs.getComponent<Squad>(m, 'squad');
      if (comp) {
        this.ecs.addComponent(m, { ...comp, formation });
      }
    }
    return true;
  }

  disbandSquad(squadId: string): void {
    const squad = this.squads.get(squadId);
    if (!squad) return;

    for (const m of squad.members) {
      this.ecs.addComponent(m, { type: 'squad', squadId: '', leaderId: '', members: [], formation: 'Line', spacing: 0 });
    }
    this.squads.delete(squadId);
  }

  getSquadMembers(squadId: string): Entity[] {
    return [...(this.squads.get(squadId)?.members ?? [])];
  }

  getSquadState(squadId: string): SquadState | undefined {
    return this.squads.get(squadId);
  }

  getAllSquads(): SquadState[] {
    return Array.from(this.squads.values());
  }

  getSquadForEntity(entity: Entity): SquadState | undefined {
    const comp = this.ecs.getComponent<Squad>(entity, 'squad');
    if (!comp || !comp.squadId) return undefined;
    return this.squads.get(comp.squadId);
  }

  isLeader(entity: Entity): boolean {
    const squad = this.getSquadForEntity(entity);
    return squad ? squad.leaderId === entity : false;
  }

  getDesiredPosition(entity: Entity): { x: number; y: number } | undefined {
    const comp = this.ecs.getComponent<Squad>(entity, 'squad');
    if (!comp || !comp.squadId || this.isLeader(entity)) return undefined;

    const squad = this.squads.get(comp.squadId);
    if (!squad) return undefined;

    const leaderPos = this.ecs.getComponent<Position>(squad.leaderId, 'position');
    if (!leaderPos) return undefined;

    const index = squad.members.indexOf(entity);
    if (index < 0) return undefined;

    const spacing = this.ecs.getComponent<Squad>(squad.leaderId, 'squad')?.spacing ?? this.options.defaultSpacing;
    const offset = getFormationOffset(comp.formation, index, spacing);
    return {
      x: leaderPos.x + offset.x,
      y: leaderPos.y + offset.y,
    };
  }

  updateCoordinatedMovement(): void {
    for (const squad of this.squads.values()) {
      const leaderPos = this.ecs.getComponent<Position>(squad.leaderId, 'position');
      if (!leaderPos) continue;

      for (let i = 0; i < squad.members.length; i++) {
        const member = squad.members[i];
        if (member === squad.leaderId) continue;

        const comp = this.ecs.getComponent<Squad>(member, 'squad');
        const movement = this.ecs.getComponent<{ type: 'movement'; targetX: number | null; targetY: number | null; speed: number; vx: number; vy: number }>(member, 'movement');
        if (!comp || !movement) continue;

        const offset = getFormationOffset(comp.formation, i, comp.spacing);
        movement.targetX = leaderPos.x + offset.x;
        movement.targetY = leaderPos.y + offset.y;
        this.ecs.addComponent(member, movement);
      }
    }
  }

  setSharedTarget(squadId: string, target: Entity): boolean {
    const squad = this.squads.get(squadId);
    if (!squad) return false;
    squad.sharedTarget = target;
    return true;
  }

  getSharedTarget(squadId: string): Entity | undefined {
    return this.squads.get(squadId)?.sharedTarget;
  }

  coordinateRetreat(squadId: string): boolean {
    const squad = this.squads.get(squadId);
    if (!squad) return false;
    squad.isRetreating = true;
    squad.sharedTarget = undefined;
    return true;
  }

  endRetreat(squadId: string): boolean {
    const squad = this.squads.get(squadId);
    if (!squad) return false;
    squad.isRetreating = false;
    return true;
  }

  isRetreating(squadId: string): boolean {
    return this.squads.get(squadId)?.isRetreating ?? false;
  }
}
