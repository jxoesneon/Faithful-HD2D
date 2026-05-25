import { describe, it, expect } from 'vitest';
import { FractalDetailEngine } from '../fractal';

describe('FractalDetailEngine', () => {
  it('samples correctly', () => {
    const engine = new FractalDetailEngine('test-seed');
    const value = engine.sample(10, 20);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });

  it('gets a grid', () => {
    const engine = new FractalDetailEngine();
    const grid = engine.getGrid(0, 0, 10, 2);
    expect(grid.length).toBe(5);
    expect(grid[0].length).toBe(5);
    expect(typeof grid[0][0]).toBe('number');
  });
});
