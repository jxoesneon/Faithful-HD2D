import { describe, it, expect } from 'vitest';
import * as shaders from '../shaders';

describe('Shaders', () => {
  it('exports shaders', () => {
    expect(shaders.spriteVertexShader).toContain('void main');
    expect(shaders.spriteFragmentShader).toContain('void main');
    expect(shaders.lightingFragmentShader).toContain('void main');
  });
});
