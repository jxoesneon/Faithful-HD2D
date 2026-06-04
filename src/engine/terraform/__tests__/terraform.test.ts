import { describe, it, expect, beforeEach } from 'vitest';
import { TerraformManager } from '../terraform';

function createFlatTerrain(size: number = 64, value: number = 0.5): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(value));
}

describe('TerraformManager', () => {
  let terrain: number[][];
  let manager: TerraformManager;

  beforeEach(() => {
    terrain = createFlatTerrain();
    manager = new TerraformManager(terrain);
  });

  it('raises land and changes height values', () => {
    const before = terrain[32][32];
    manager.raiseLand(32, 32, 0.2);
    expect(terrain[32][32]).toBeGreaterThan(before);
  });

  it('lowers land and changes height values', () => {
    const before = terrain[32][32];
    manager.lowerLand(32, 32, 0.2);
    expect(terrain[32][32]).toBeLessThan(before);
  });

  it('uses smooth Gaussian brush falloff', () => {
    manager.raiseLand(32, 32, 0.5);
    const center = terrain[32][32];
    const near = terrain[31][32];
    const mid = terrain[30][32];
    expect(center).toBeGreaterThan(near);
    expect(near).toBeGreaterThan(mid);
  });

  it('creates water channel depression', () => {
    const before = terrain[32][32];
    manager.createWaterChannel(30, 30, 34, 34, 3);
    const after = terrain[32][32];
    expect(after).toBeLessThan(before);
  });

  it('reduces height variance with erosion', () => {
    terrain[10][10] = 1.0;
    terrain[50][50] = 0.0;
    for (let i = 0; i < 200; i++) {
      manager.naturalErosion(1.0);
    }
    expect(terrain[10][10]).toBeLessThan(1.0);
    expect(terrain[50][50]).toBeGreaterThan(0.0);
  });

  it('creates lake that depresses terrain center', () => {
    const before = terrain[32][32];
    manager.createLake(32, 32, 5);
    const after = terrain[32][32];
    expect(after).toBeLessThan(before);
    expect(manager.getWaterMap()[32][32]).toBeGreaterThan(0);
  });

  it('tracks structure impacts like dams', () => {
    manager.addStructureImpact('dam-1', 32, 32, 'dam', 4);
    expect(manager.getStructureImpacts().has('dam-1')).toBe(true);
    expect(manager.getStructureImpacts().get('dam-1')?.type).toBe('dam');
  });

  it('blocks water flow when dam intersects channel', () => {
    manager.createWaterChannel(10, 10, 50, 50, 4);
    manager.addStructureImpact('dam-1', 30, 30, 'dam', 5);
    expect(manager.isWaterFlowBlocked(0)).toBe(true);
  });

  it('does not block water flow when dam is far from channel', () => {
    manager.createWaterChannel(10, 10, 50, 50, 4);
    manager.addStructureImpact('dam-1', 5, 5, 'dam', 2);
    expect(manager.isWaterFlowBlocked(0)).toBe(false);
  });

  it('keeps terrain values within bounds', () => {
    terrain[32][32] = 0.99;
    manager.raiseLand(32, 32, 0.5);
    expect(terrain[32][32]).toBeLessThanOrEqual(1);

    terrain[32][32] = 0.01;
    manager.lowerLand(32, 32, 0.5);
    expect(terrain[32][32]).toBeGreaterThanOrEqual(0);
  });

  it('flattens area toward target height', () => {
    terrain[30][30] = 0.9;
    terrain[31][31] = 0.1;
    manager.flattenArea(30, 30, 5, 0.5);
    expect(terrain[30][30]).toBeLessThan(0.9);
    expect(terrain[31][31]).toBeGreaterThan(0.1);
  });
});
