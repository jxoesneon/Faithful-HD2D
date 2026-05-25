import React from 'react';
import { render } from '@testing-library/react';
import { AssetInspector } from '../AssetInspector';

describe('AssetInspector', () => {
  it('renders correctly', () => {
    const registry = { sheets: {}, mappings: {} };
    const { container } = render(<AssetInspector currentDeity="sylphra" onClose={() => {}} registry={registry} onUpdate={() => {}} initialDebug={{x:0, y:0, scale:1}} onGlobalDebugChange={() => {}} />);
    expect(container).toBeDefined();
  });
});
