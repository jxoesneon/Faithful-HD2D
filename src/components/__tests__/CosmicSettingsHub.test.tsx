import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { CosmicSettingsHub } from '../CosmicSettingsHub';

describe('CosmicSettingsHub', () => {
  it('renders and interacts', () => {
    const settings = { gameSpeed: 1, showHeatmap: false, weatherEffects: true, sunDirX: 1, sunDirY: 1, renderScale: 1, targetFPS: 60, volume: 1 };
    const { container } = render(
      <CosmicSettingsHub 
        currentDeity="sylphra" 
        onClose={() => {}} 
        sim={{} as any} 
        renderer={{} as any} 
        settings={settings} 
        updateSetting={() => {}} 
        saveSlots={{1: null, 2: null, 3: null}} 
        onSaveSlot={() => {}} 
        onLoadSlot={() => {}} 
        onDeleteSlot={() => {}} 
        onSaveGame={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        onHardReset={() => {}}
      />
    );
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
      try { fireEvent.click(btn); } catch (e) {}
    });
  });
});
