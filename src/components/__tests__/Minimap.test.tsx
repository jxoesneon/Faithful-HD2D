import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Minimap } from '../Minimap';
import type { RenderableEntity } from '../../types';

describe('Minimap', () => {
  const terrain = Array.from({ length: 64 }, (_, y) =>
    Array.from({ length: 64 }, (_, x) => (x + y) / 128)
  );

  const entities: RenderableEntity[] = [
    { id: '1', x: 10, y: 20, category: 'Tribe', subType: 'HUMAN', name: 'Tribe A', faction: 'ANIMIST' },
    { id: '2', x: 30, y: 40, category: 'Flora', subType: 'OAK', name: 'Tree' },
  ];

  it('renders canvas element', () => {
    render(
      <Minimap
        terrain={terrain}
        entities={entities}
        cameraX={0}
        cameraY={0}
        cameraWidth={16}
        cameraHeight={16}
        onPanTo={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Minimap')).toBeInTheDocument();
  });

  it('calls onPanTo with world coordinates on click', () => {
    const onPanTo = vi.fn();
    render(
      <Minimap
        terrain={terrain}
        entities={entities}
        cameraX={0}
        cameraY={0}
        cameraWidth={16}
        cameraHeight={16}
        onPanTo={onPanTo}
        width={200}
        height={200}
      />
    );
    const canvas = screen.getByLabelText('Minimap');
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    expect(onPanTo).toHaveBeenCalledOnce();
    const [wx, wy] = onPanTo.mock.calls[0];
    expect(wx).toBeGreaterThan(0);
    expect(wy).toBeGreaterThan(0);
  });

  it('renders without terrain gracefully', () => {
    const onPanTo = vi.fn();
    render(
      <Minimap
        terrain={null}
        entities={[]}
        cameraX={0}
        cameraY={0}
        cameraWidth={16}
        cameraHeight={16}
        onPanTo={onPanTo}
      />
    );
    expect(screen.getByLabelText('Minimap')).toBeInTheDocument();
  });
});
