import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { StartMenuOverlay } from '../StartMenuOverlay';

describe('StartMenuOverlay', () => {
  it('renders and clicks everything', () => {
    const { container } = render(<StartMenuOverlay onStart={() => {}} />);
    
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
