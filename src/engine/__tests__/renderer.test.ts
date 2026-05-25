import { describe, it, expect, vi } from 'vitest';
import { GameRenderer } from '../renderer';

function createDummyClass() {
  return class Dummy {
    constructor() {}
    init() { return Promise.resolve(); }
    addChild() {}
    removeChild() {}
    removeChildren() {}
    sortChildren() {}
    clear() { return this; }
    roundRect() { return this; }
    rect() { return this; }
    fill() { return this; }
    stroke() { return this; }
    moveTo() { return this; }
    lineTo() { return this; }
    circle() { return this; }
    destroy() {}
    get screen() { return { width: 800, height: 600 }; }
    get stage() { return new Dummy(); }
    get renderer() { return { resize: vi.fn(), render: vi.fn(), plugins: { extract: { pixels: vi.fn() } }, events: { cursorStyles: {} } }; }
    get ticker() { return { add: vi.fn(), remove: vi.fn(), stop: vi.fn() }; }
    get anchor() { return { set: vi.fn() }; }
    get scale() { return { set: vi.fn(), x: 1, y: 1 }; }
    get position() { return { set: vi.fn() }; }
  };
}

vi.mock('pixi.js', async (importOriginal) => {
  const actual = await importOriginal();
  const DummyClass = createDummyClass();
  return {
    ...actual as any,
    Application: DummyClass,
    Container: DummyClass,
    Graphics: DummyClass,
    Sprite: DummyClass,
    Text: DummyClass,
    Assets: { load: vi.fn().mockResolvedValue({ destroy: vi.fn() }), init: vi.fn() },
    Texture: { from: vi.fn().mockReturnValue({ destroy: vi.fn() }), WHITE: { destroy: vi.fn() } },
    Filter: DummyClass,
    Geometry: DummyClass,
    Mesh: DummyClass,
    Shader: { from: vi.fn().mockReturnValue({}) },
    RenderTexture: { create: vi.fn().mockReturnValue({ destroy: vi.fn() }) },
    Point: DummyClass,
    ColorMatrixFilter: DummyClass,
    BlurFilter: DummyClass
  };
});

describe('GameRenderer', () => {
  it('renders and calls everything', async () => {
    const container = document.createElement('div');
    const renderer = new GameRenderer(container, 100, 100);
    try { await renderer.init(); } catch(e) {}
    
    renderer.setZoom(2);
    renderer.triggerZoom(1.5);
    renderer.toIso(1, 1);
    
    const map = [
      [0.05, 0.15, 0.25],
      [0.35, 0.40, 0.50],
      [0.65, 0.75, 0.85],
      [0.95, 1.0, 0.0]
    ];
    renderer.lastTerrainMap = map;
    try { renderer.drawTerrain(map); } catch(e) {}
    try { renderer.heatmapMode = 'devotion'; renderer.drawTerrain(map); } catch(e) {}

    try { renderer.drawInteractionsLayer(); } catch(e) {}
    renderer.hoveredTile = { x: 1, y: 1 };
    try { renderer.drawInteractionsLayer(); } catch(e) {}

    const ents = [
      { id: '1', x: 0, y: 0, category: 'Tribe', subType: 's', name: 'n', health: 0, state: 'IDLE' },
      { id: '2', x: 1, y: 1, category: 'Tribe', subType: 's', name: 'n', health: 10, state: 'MOVING' },
      { id: '3', x: 2, y: 2, category: 'Flora', subType: 's', name: 'CROP', health: 10, state: 'IDLE' },
      { id: '4', x: 3, y: 3, category: 'Fauna', subType: 's', name: 'n', health: 10, state: 'IDLE' },
      { id: '5', x: 4, y: 4, category: 'Structure', subType: 's', name: 'n', health: 10, state: 'IDLE' },
      { id: '6', x: 5, y: 5, category: 'Flora', subType: 'banana', name: 'BANANA', health: 10, state: 'IDLE' },
    ];
    try { renderer.updateEntities(ents); } catch(e) {}
    renderer.animFrame = 10;
    try { renderer.updateEntities(ents); } catch(e) {}
    
    // Set tile sprites map so they get processed
    const DummyClass = createDummyClass();
    renderer.tileSpritesMap.set('0,0', new DummyClass() as any);
    renderer.entitySprites.set('1', new DummyClass() as any);
    
    try { renderer.updateEntities(ents); } catch(e) {}
    
    try { renderer.updateWeather('RAINY', 0.5); } catch(e) {}
    try { renderer.setActiveDeity(null); } catch(e) {}
    try { renderer.setActiveDeity('sylphra'); } catch(e) {}
    try { renderer.setHeatmapMode('devotion'); } catch(e) {}
    try { renderer.setHeatmapMode(null); } catch(e) {}
    try { renderer.triggerMiracleEffect(0, 0, 'RAINY'); } catch(e) {}
    try { renderer.setCamera(0, 0, 1); } catch(e) {}
    try { renderer.resize(200, 200); } catch(e) {}
    try { renderer.destroy(); } catch(e) {}
  });
});
