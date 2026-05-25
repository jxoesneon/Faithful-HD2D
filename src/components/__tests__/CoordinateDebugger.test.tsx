import React from 'react';
import { render } from '@testing-library/react';
import { CoordinateDebugger } from '../CoordinateDebugger';

describe('CoordinateDebugger', () => {
  it('renders', () => {
    const { container } = render(<CoordinateDebugger renderer={{} as any} sim={{ getEntityAt: () => null } as any} onOffsetChange={() => {}} />);
    expect(container).toBeDefined();
  });
});
