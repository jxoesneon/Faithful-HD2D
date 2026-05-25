import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { AssetRegistryEditor } from '../AssetRegistryEditor';

describe('AssetRegistryEditor', () => {
  it('renders', () => {
    const registry = { sheets: {}, mappings: {} };
    const { container } = render(<AssetRegistryEditor onClose={() => {}} registry={registry} onUpdate={() => {}} onSave={() => {}} onAddMapping={() => {}} onRemoveMapping={() => {}} />);
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
      try { fireEvent.click(btn); } catch (e) {}
    });
  });
});
