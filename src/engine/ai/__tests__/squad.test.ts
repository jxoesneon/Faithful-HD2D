import { describe, it, expect, beforeEach } from 'vitest';
import { ECS } from '../../ecs';
import { SquadManager, getFormationOffset, createSquadComponent } from '../squad';
import type { Position, Squad, FormationType, Movement } from '../../../types';

describe('SquadManager', () => {
  let ecs: ECS;
  let manager: SquadManager;

  beforeEach(() => {
    ecs = new ECS();
    manager = new SquadManager(ecs);
  });

  describe('createSquad', () => {
    it('creates a squad with the entity as leader', () => {
      const leader = ecs.createEntity();
      const id = manager.createSquad(leader, 'Line', 2);
      expect(id).toBeDefined();
      expect(manager.getSquadMembers(id)).toContain(leader);
      expect(manager.isLeader(leader)).toBe(true);
    });

    it('assigns a Squad component to the leader', () => {
      const leader = ecs.createEntity();
      manager.createSquad(leader, 'Wedge', 2);
      const comp = ecs.getComponent<Squad>(leader, 'squad');
      expect(comp).toBeDefined();
      expect(comp!.formation).toBe('Wedge');
      expect(comp!.spacing).toBe(2);
    });
  });

  describe('assignToSquad', () => {
    it('adds a member to an existing squad', () => {
      const leader = ecs.createEntity();
      const member = ecs.createEntity();
      const id = manager.createSquad(leader);
      const ok = manager.assignToSquad(member, id);
      expect(ok).toBe(true);
      expect(manager.getSquadMembers(id)).toContain(member);
    });

    it('returns false when squad is full', () => {
      const leader = ecs.createEntity();
      const id = manager.createSquad(leader, 'Line', 1.5);
      const smallManager = new SquadManager(ecs, { maxSquadSize: 1 });
      smallManager.createSquad = manager.createSquad.bind(manager);
      const m = ecs.createEntity();
      expect(smallManager.assignToSquad(m, id)).toBe(false);
    });
  });

  describe('setLeader', () => {
    it('changes the squad leader', () => {
      const a = ecs.createEntity();
      const b = ecs.createEntity();
      const id = manager.createSquad(a);
      manager.assignToSquad(b, id);
      expect(manager.isLeader(a)).toBe(true);
      manager.setLeader(id, b);
      expect(manager.isLeader(b)).toBe(true);
      expect(manager.isLeader(a)).toBe(false);
    });
  });

  describe('removeFromSquad', () => {
    it('removes a member from the squad', () => {
      const leader = ecs.createEntity();
      const member = ecs.createEntity();
      const id = manager.createSquad(leader);
      manager.assignToSquad(member, id);
      manager.removeFromSquad(member);
      expect(manager.getSquadMembers(id)).not.toContain(member);
    });

    it('promotes next member to leader when leader leaves', () => {
      const a = ecs.createEntity();
      const b = ecs.createEntity();
      const id = manager.createSquad(a);
      manager.assignToSquad(b, id);
      manager.removeFromSquad(a);
      expect(manager.getSquadState(id)!.leaderId).toBe(b);
    });

    it('disbands squad when last member leaves', () => {
      const leader = ecs.createEntity();
      const id = manager.createSquad(leader);
      manager.removeFromSquad(leader);
      expect(manager.getSquadState(id)).toBeUndefined();
    });
  });

  describe('formation offsets', () => {
    it('Line formation places followers along x-axis', () => {
      const o = getFormationOffset('Line', 1, 2);
      expect(o.x).toBe(0);
      expect(o.y).toBe(0);
      const o2 = getFormationOffset('Line', 2, 2);
      expect(o2.x).toBe(2);
      expect(o2.y).toBe(0);
    });

    it('Column formation places followers along y-axis', () => {
      const o = getFormationOffset('Column', 2, 2);
      expect(o.x).toBe(0);
      expect(o.y).toBe(2);
    });

    it('Circle formation uses radial offsets', () => {
      const o = getFormationOffset('Circle', 1, 1);
      expect(Math.abs(o.x)).toBeGreaterThan(0);
      expect(Math.abs(o.y)).toBeGreaterThan(0);
    });

    it('Scatter formation produces pseudo-random offsets', () => {
      const o1 = getFormationOffset('Scatter', 1, 1);
      const o2 = getFormationOffset('Scatter', 2, 1);
      expect(o1.x).not.toBe(o2.x);
    });

    it('Wedge formation produces V-shape', () => {
      const o1 = getFormationOffset('Wedge', 1, 2);
      const o2 = getFormationOffset('Wedge', 2, 2);
      const o3 = getFormationOffset('Wedge', 3, 2);
      expect(o1.x).toBe(0);
      expect(o1.y).toBe(0);
      expect(o2.y).toBeGreaterThan(0);
      expect(o3.y).toBeGreaterThan(0);
    });
  });

  describe('coordinated movement', () => {
    it('sets movement targets for followers based on leader position', () => {
      const leader = ecs.createEntity();
      const m1 = ecs.createEntity();
      const id = manager.createSquad(leader, 'Line', 2);
      manager.assignToSquad(m1, id);

      ecs.addComponent(leader, { type: 'position', x: 10, y: 10, z: 0 } as Position);
      ecs.addComponent(m1, { type: 'movement', targetX: null, targetY: null, speed: 1, vx: 0, vy: 0, activityState: 'IDLE' } as Movement);

      manager.updateCoordinatedMovement();

      const mov = ecs.getComponent<Movement>(m1, 'movement');
      expect(mov!.targetX).toBe(10); // index 1 offset x=0 for Line when spacing=2? Actually Line: (index-1)*spacing, so index=1 -> 0
      expect(mov!.targetY).toBe(10);
    });

    it('sets movement targets for multiple followers', () => {
      const leader = ecs.createEntity();
      const m1 = ecs.createEntity();
      const m2 = ecs.createEntity();
      const id = manager.createSquad(leader, 'Line', 2);
      manager.assignToSquad(m1, id);
      manager.assignToSquad(m2, id);

      ecs.addComponent(leader, { type: 'position', x: 5, y: 5, z: 0 } as Position);
      ecs.addComponent(m1, { type: 'movement', targetX: null, targetY: null, speed: 1, vx: 0, vy: 0, activityState: 'IDLE' } as Movement);
      ecs.addComponent(m2, { type: 'movement', targetX: null, targetY: null, speed: 1, vx: 0, vy: 0, activityState: 'IDLE' } as Movement);

      manager.updateCoordinatedMovement();

      const mov1 = ecs.getComponent<Movement>(m1, 'movement');
      const mov2 = ecs.getComponent<Movement>(m2, 'movement');
      expect(mov1!.targetX).toBe(5);
      expect(mov2!.targetX).toBe(7); // 5 + (2-1)*2 = 7
    });
  });

  describe('leader following', () => {
    it('getDesiredPosition returns undefined for leader', () => {
      const leader = ecs.createEntity();
      manager.createSquad(leader);
      ecs.addComponent(leader, { type: 'position', x: 0, y: 0, z: 0 } as Position);
      expect(manager.getDesiredPosition(leader)).toBeUndefined();
    });

    it('getDesiredPosition returns offset for follower', () => {
      const leader = ecs.createEntity();
      const m1 = ecs.createEntity();
      const id = manager.createSquad(leader, 'Line', 2);
      manager.assignToSquad(m1, id);
      ecs.addComponent(leader, { type: 'position', x: 10, y: 10, z: 0 } as Position);
      const pos = manager.getDesiredPosition(m1);
      expect(pos).toBeDefined();
      expect(pos!.x).toBe(10);
      expect(pos!.y).toBe(10);
    });
  });

  describe('retreat coordination', () => {
    it('coordinateRetreat sets squad retreat flag', () => {
      const leader = ecs.createEntity();
      const id = manager.createSquad(leader);
      manager.coordinateRetreat(id);
      expect(manager.isRetreating(id)).toBe(true);
    });

    it('endRetreat clears retreat flag', () => {
      const leader = ecs.createEntity();
      const id = manager.createSquad(leader);
      manager.coordinateRetreat(id);
      manager.endRetreat(id);
      expect(manager.isRetreating(id)).toBe(false);
    });

    it('coordinateRetreat clears shared target', () => {
      const leader = ecs.createEntity();
      const target = ecs.createEntity();
      const id = manager.createSquad(leader);
      manager.setSharedTarget(id, target);
      manager.coordinateRetreat(id);
      expect(manager.getSharedTarget(id)).toBeUndefined();
    });
  });

  describe('setFormation', () => {
    it('updates formation for all members', () => {
      const leader = ecs.createEntity();
      const m1 = ecs.createEntity();
      const id = manager.createSquad(leader, 'Line');
      manager.assignToSquad(m1, id);
      manager.setFormation(id, 'Circle');
      expect(ecs.getComponent<Squad>(leader, 'squad')!.formation).toBe('Circle');
      expect(ecs.getComponent<Squad>(m1, 'squad')!.formation).toBe('Circle');
    });
  });

  describe('disbandSquad', () => {
    it('removes squad assignments', () => {
      const leader = ecs.createEntity();
      const id = manager.createSquad(leader);
      manager.disbandSquad(id);
      expect(manager.getSquadState(id)).toBeUndefined();
      expect(ecs.getComponent<Squad>(leader, 'squad')!.squadId).toBe('');
    });
  });
});
