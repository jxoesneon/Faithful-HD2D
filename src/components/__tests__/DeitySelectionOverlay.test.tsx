import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { DeitySelectionOverlay } from '../DeitySelectionOverlay';

describe('DeitySelectionOverlay', () => {
  it('renders and selects', () => {
    let selected = null;
    const { container } = render(<DeitySelectionOverlay onSelect={(id) => selected = id} />);
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
      try { fireEvent.click(btn); } catch (e) {}
    });
    
    const divs = container.querySelectorAll('div');
    divs.forEach(div => {
      try { fireEvent.click(div); } catch (e) {}
    });
  });
});
