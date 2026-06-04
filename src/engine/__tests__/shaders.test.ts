import { describe, it, expect } from 'vitest';
import * as shaders from '../shaders';
import * as PIXI from 'pixi.js';

describe('Shaders', () => {
  it('exports shaders', () => {
    expect(shaders.spriteVertexShader).toContain('void main');
    expect(shaders.spriteFragmentShader).toContain('void main');
    expect(shaders.lightingVertexShader).toContain('void main');
    expect(shaders.lightingFragmentShader).toContain('void main');
  });

  it('inspects MeshGeometry attributes', () => {
    const geom = new PIXI.MeshGeometry({
      positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    });
    console.log('GEOMETRY ATTRIBUTES:', Object.keys(geom.attributes));
  });
});
