import * as PIXI from 'pixi.js';
import spriteMappings from '../../docs/sprite-mappings.json';
import { spriteVertexShader, spriteFragmentShader, lightingFragmentShader } from './shaders';

export interface PointLight {
  id: string;
  x: number;
  y: number;
  color: [number, number, number];
  radius: number;
  intensity: number;
}

export interface RenderableEntity {
  id: string;
  x: number;
  y: number;
  category: 'Tribe' | 'Flora' | 'Fauna' | 'Structure';
  subType: string;
  name: string;
  faction?: string;
  activityState?: string;
  population?: number;
  resources?: number;
  health?: number;
  growth?: number;
}

// Global ECS access for heatmap sampling (Architecture Note: Should be injected)
import { ECS } from './ecs';
import { Position } from '../types';
declare const ecsRef: { current: ECS };

export class GameRenderer {
  private app: PIXI.Application | null = null;
  private container: HTMLElement;
  private tiles: PIXI.Container;
  private gridLayer: PIXI.Graphics;
  private interactions: PIXI.Container;
  private entities: PIXI.Container;
  private labelLayer: PIXI.Container;
  private overlaysLayer: PIXI.Graphics;
  private isoWidth = 64;
  private isoHeight = 32;
  private initialized = false;
  private wasDestroyed = false;
  public zoom = 1.0;
  private isDragging = false;
  private lastPos = { x: 0, y: 0 };
  private lodLevel = 1;

  // Active hover and selection trackers
  public hoveredTile: { x: number; y: number } | null = null;
  public selectedEntityId: string | null = null;
  public debugOffsetX = 0;
  public debugOffsetY = 0;
  public debugScale = 1.1;

  // Granular Asset Registry Overrides
  public registryOverrides: Record<string, { 
    offsetX?: number, 
    offsetY?: number, 
    scale?: number,
    opacity?: number,
    uOffset?: number,
    vOffset?: number,
    isAnimated?: boolean,
    lodLocked?: boolean,
    isInteractive?: boolean
  }> = {};

  // Interactive Heatmap parameters
  public heatmapMode: 'none' | 'devotion' | 'resource' | 'moisture' | 'tension' = 'none';
  public godsEyeMode: boolean = false;
  public lastTerrainMap: number[][] | null = null;
  public lastEntities: RenderableEntity[] = [];
  private animFrame = 0;

  // Interaction delegation callbacks
  public onTileClick?: (x: number, y: number) => void;
  public onTileHover?: (x: number, y: number) => void;
  public onZoomChange?: (zoom: number) => void;

  // Slicing caches
  private loadedSheets = new Map<string, PIXI.Texture>();
  private textureCache = new Map<string, PIXI.Texture>();
  private tileSpritesMap = new Map<string, PIXI.Sprite>();
  private entitySprites = new Map<string, PIXI.Container>();
  private pivotCache = new Map<string, { x: number, y: number }>();

  // Deferred Rendering / G-Buffer elements
  private gBufferAlbedo: PIXI.RenderTexture | null = null;
  private gBufferNormal: PIXI.RenderTexture | null = null;
  private customShader: PIXI.Shader | null = null;
  private lightingShader: PIXI.Shader | null = null;
  private lightingQuad: PIXI.Mesh | null = null;

  // Lighting Uniforms
  public sunDirection = new Float32Array([1.0, 1.0, -1.0]);
  public sunColor = new Float32Array([1.0, 0.95, 0.8]);
  public ambientColor = new Float32Array([0.2, 0.2, 0.25]);
  public godRayIntensity = 0.35;
  public sunScreenPos = new Float32Array([0.5, 0.1]);
  public batterySaver = false;

  // Dynamic Lights
  public pointLights: PointLight[] = [];
  private maxPointLights = 16;

  constructor(container: HTMLElement) {
    this.container = container;
    this.tiles = new PIXI.Container();
    this.gridLayer = new PIXI.Graphics();
    this.interactions = new PIXI.Container();
    this.entities = new PIXI.Container();
    this.labelLayer = new PIXI.Container();
    this.overlaysLayer = new PIXI.Graphics();

    this.container.addEventListener('contextmenu', (e) => e.preventDefault());

    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 1.12;
      if (e.deltaY < 0) this.setZoom(this.zoom * zoomFactor);
      else this.setZoom(this.zoom / zoomFactor);
    }, { passive: false });

    let totalMove = 0;
    this.container.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastPos = { x: e.clientX, y: e.clientY };
      totalMove = 0;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.wasDestroyed) return;
      if (this.isDragging) {
        if (!this.app) return;
        const dx = e.clientX - this.lastPos.x;
        const dy = e.clientY - this.lastPos.y;
        totalMove += Math.sqrt(dx * dx + dy * dy);
        this.app.stage.x += dx;
        this.app.stage.y += dy;
        this.lastPos = { x: e.clientX, y: e.clientY };
      } else {
        if (this.app && this.initialized) {
          const bounds = this.container.getBoundingClientRect();
          const mouseX = e.clientX - bounds.left;
          const mouseY = e.clientY - bounds.top;

          if (mouseX >= 0 && mouseX <= bounds.width && mouseY >= 0 && mouseY <= bounds.height) {
            // --- 3D-Aware Hitbox Detection (Phase 2, Step 4) ---
            let entityFound = false;
            const entitiesList = [...this.entitySprites.entries()].sort((a, b) => b[1].y - a[1].y);
            
            for (const [id, container] of entitiesList) {
               if (!container.visible) continue;
               // Simple AABB check in stage-space
               const bounds = container.getBounds();
               if (mouseX >= bounds.x && mouseX <= bounds.x + bounds.width && 
                   mouseY >= bounds.y && mouseY <= bounds.y + bounds.height) {
                  const ent = this.lastEntities.find(e => e.id === id);
                  if (ent) {
                     this.hoveredTile = { x: ent.x, y: ent.y };
                     entityFound = true;
                     break;
                  }
               }
            }

            if (!entityFound) {
              const worldX = (mouseX - this.app.stage.x) / this.zoom;
              const worldY = (mouseY - this.app.stage.y) / this.zoom;

              const gx = Math.floor(worldX / this.isoWidth + worldY / this.isoHeight);
              const gy = Math.floor(worldY / this.isoHeight - worldX / this.isoWidth);
              this.hoveredTile = { x: gx, y: gy };
            }

            if (this.onTileHover && this.hoveredTile) {
              this.onTileHover(this.hoveredTile.x, this.hoveredTile.y);
              this.drawInteractionsLayer();
            }
          }
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.wasDestroyed) return;
      this.isDragging = false;
      if (totalMove < 5 && this.onTileClick && this.hoveredTile) {
        this.onTileClick(this.hoveredTile.x, this.hoveredTile.y);
      }
    });

    // --- Mobile Touch Interaction Support ---
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        totalMove = 0;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.wasDestroyed || !this.isDragging || e.touches.length !== 1) return;
      if (!this.app) return;
      
      const touch = e.touches[0];
      const dx = touch.clientX - this.lastPos.x;
      const dy = touch.clientY - this.lastPos.y;
      totalMove += Math.sqrt(dx * dx + dy * dy);
      
      this.app.stage.x += dx;
      this.app.stage.y += dy;
      this.lastPos = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.wasDestroyed) return;
      if (this.isDragging) {
        this.isDragging = false;
        if (totalMove < 15 && this.onTileClick && this.hoveredTile) {
          this.onTileClick(this.hoveredTile.x, this.hoveredTile.y);
        }
      }
    });
  }

  // Draw tactical world-space grid
  private drawGrid() {
    this.gridLayer.clear();
    const size = 64; // 64x64 grid
    
    this.gridLayer.setStrokeStyle({ width: 1, color: 0xFFFFFF, alpha: 0.05 });
    
    // Draw lines along X axis
    for (let i = 0; i <= size; i++) {
      const p1 = this.toIso(i, 0);
      const p2 = this.toIso(i, size);
      this.gridLayer.moveTo(p1.x, p1.y);
      this.gridLayer.lineTo(p2.x, p2.y);
    }
    
    // Draw lines along Y axis
    for (let j = 0; j <= size; j++) {
      const p1 = this.toIso(0, j);
      const p2 = this.toIso(size, j);
      this.gridLayer.moveTo(p1.x, p1.y);
      this.gridLayer.lineTo(p2.x, p2.y);
    }
    
    this.gridLayer.stroke();
  }

  setZoom(val: number) {
    if (this.wasDestroyed || !this.app) return;
    this.zoom = Math.max(0.15, Math.min(5, val));
    this.app.stage.scale.set(this.zoom);

    if (this.zoom < 0.35) this.lodLevel = 4;
    else if (this.zoom < 0.65) this.lodLevel = 2;
    else this.lodLevel = 1;

    if (this.onZoomChange) this.onZoomChange(this.zoom);
  }

  public triggerZoom(factor: number) {
    this.setZoom(this.zoom * factor);
  }

  private async loadAssets() {
    if (this.wasDestroyed) return;
    const sheets = spriteMappings.sheets;
    const cellSize = spriteMappings.config.cellSize;

    for (const [sheetKey, sheetPath] of Object.entries(sheets)) {
      if (this.wasDestroyed) return;
      try {
        const texture = await PIXI.Assets.load<PIXI.Texture>(sheetPath);
        if (this.wasDestroyed) return;
        if (texture && texture.source) {
          texture.source.style.scaleMode = 'nearest';
        }
        this.loadedSheets.set(sheetKey, texture);
      } catch (err) {
        console.error(`[WebGL Renderer] Failed to load sheet: ${sheetKey}`, err);
      }
    }
  }

  getSheetCellTexture(sheetKey: string, row: number, col: number): PIXI.Texture | null {
    if (this.wasDestroyed) return null;
    const baseTex = this.loadedSheets.get(sheetKey);
    if (!baseTex) return null;

    const clampedRow = Math.max(0, Math.min(7, row));
    const clampedCol = Math.max(0, Math.min(7, col));
    
    const cacheKey = `${sheetKey}_r${clampedRow}_c${clampedCol}`;
    let cached = this.textureCache.get(cacheKey);
    
    const override = this.registryOverrides[cacheKey] || this.registryOverrides[sheetKey];

    if (!cached || override) {
      const baseCellSize = spriteMappings.config.cellSize;
      const uOffset = override?.uOffset || 0;
      const vOffset = override?.vOffset || 0;

      const rect = new PIXI.Rectangle(
        clampedCol * baseCellSize + uOffset,
        clampedRow * baseCellSize + vOffset,
        baseCellSize,
        baseCellSize
      );
      
      cached = new PIXI.Texture({
        source: baseTex.source,
        frame: rect
      });
      
      if (!override) {
        this.textureCache.set(cacheKey, cached);
      }
    }
    return cached;
  }

  async init() {
    if (this.initialized || this.app || this.wasDestroyed) return;

    this.app = new PIXI.Application();

    try {
      await this.app.init({
        background: '#040608',
        antialias: true,
        width: this.container.clientWidth,
        height: this.container.clientHeight,
      });

      if (this.wasDestroyed || !this.app) {
        this.destroy();
        return;
      }

      if (this.app.canvas) {
        this.app.canvas.style.imageRendering = 'pixelated';
        this.container.appendChild(this.app.canvas);
      }

      await this.loadAssets();

      if (this.wasDestroyed || !this.app) {
        this.destroy();
        return;
      }

      // --- Initialize Deferred G-Buffer (Phase 1, Step 1) ---
      this.gBufferAlbedo = PIXI.RenderTexture.create({
        width: this.app.screen.width,
        height: this.app.screen.height,
        scaleMode: 'nearest',
        resolution: window.devicePixelRatio || 1,
      });

      this.gBufferNormal = PIXI.RenderTexture.create({
        width: this.app.screen.width,
        height: this.app.screen.height,
        scaleMode: 'nearest',
        resolution: window.devicePixelRatio || 1,
      });

      this.app.stage.addChild(this.tiles);
      this.app.stage.addChild(this.interactions);
      this.app.stage.addChild(this.entities);
      this.app.stage.addChild(this.labelLayer);
      this.app.stage.addChild(this.overlaysLayer);

      // NOTE: Deferred lighting pipeline disabled for PIXI v8 compatibility.
      // The custom Shader/Mesh resources API changed in v8 and the lighting
      // quad shader throws "Cannot create property 'name' on number".
      // Falling back to direct stage rendering until deferred pipeline is ported.
      try {
        this.lightingShader = new PIXI.Shader({
          glProgram: PIXI.GlProgram.from({
            vertex: spriteVertexShader,
            fragment: lightingFragmentShader,
          }),
          resources: {
            uAlbedoBuffer: this.gBufferAlbedo.source,
            uNormalBuffer: this.gBufferNormal.source,
            uSunDirection: this.sunDirection,
            uSunColor: this.sunColor,
            uAmbientColor: this.ambientColor,
            uGodRayIntensity: this.godRayIntensity,
            uSunScreenPos: this.sunScreenPos,
            uResolution: new Float32Array([this.app.screen.width, this.app.screen.height]),
            uPointLightCount: 0,
            uPointLightPositions: new Float32Array(this.maxPointLights * 3),
            uPointLightColors: new Float32Array(this.maxPointLights * 3),
            uPointLightRadii: new Float32Array(this.maxPointLights),
            uPointLightIntensities: new Float32Array(this.maxPointLights),
            uGodsEyeMode: this.godsEyeMode ? 1.0 : 0.0,
          }
        }) as any;

        this.lightingQuad = new PIXI.Mesh({
          geometry: new PIXI.MeshGeometry({
            positions: new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]),
            uvs: new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]),
            indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
          }),
          shader: this.lightingShader as any,
        }) as any;
      } catch (deferredErr) {
        console.warn('[Renderer] Deferred lighting pipeline disabled:', deferredErr);
        this.lightingShader = null;
        this.lightingQuad = null;
      }

      this.app.stage.x = this.app.screen.width / 2;
      this.app.stage.y = this.app.screen.height / 5;

      window.addEventListener('resize', this.handleResize);
      this.initialized = true;
    } catch (e) {
      console.error("PIXI Initialization failed:", e);
      this.destroy();
    }
  }

  private handleResize = () => {
    if (this.wasDestroyed || !this.app || !this.app.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.app.renderer.resize(width, height);
    this.app.stage.x = width / 2;
    this.app.stage.y = height / 5;

    if (this.gBufferAlbedo) this.gBufferAlbedo.resize(width, height);
    if (this.gBufferNormal) this.gBufferNormal.resize(width, height);
  };

  toIso(x: number, y: number) {
    return {
      x: (x - y) * (this.isoWidth / 2),
      y: (x + y) * (this.isoHeight / 2)
    };
  }

  // Draw 2.5D Isometric Terrain with High-Fidelity Color Gradients (Advanced Geology Mode)
  drawTerrain(map: number[][]) {
    this.lastTerrainMap = map;
    if (this.wasDestroyed || !this.app || !this.initialized) return;

    const activeCoords = new Set<string>();
    const step = this.lodLevel;
    const listTribes = this.lastEntities.filter(e => e.category === 'Tribe');

    for (let x = 0; x < map.length; x += step) {
      if (!map[x]) continue;
      for (let y = 0; y < map[x].length; y += step) {
        const height = map[x][y];
        const coordKey = `${x}_${y}`;
        activeCoords.add(coordKey);

        const iso = this.toIso(x, y);

        let sprite = this.tileSpritesMap.get(coordKey);
        if (!sprite) {
          sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
          sprite.anchor.set(0.5, 0.5);
          this.tiles.addChild(sprite);
          this.tileSpritesMap.set(coordKey, sprite);
        } else {
          sprite.texture = PIXI.Texture.WHITE;
        }

        // --- Naturalistic Material Color Ramp (Advanced Geology) ---
        let color = 0x334455;
        if (height < 0.12) {
          color = 0x0a1128; // Abyssal Trench (Deep Obsidian)
        } else if (height < 0.22) {
          color = 0x1e3a8a; // Deep Ocean (Royal Blue)
        } else if (height < 0.32) {
          color = 0x60a5fa; // Continental Shelf (Sky Azure)
        } else if (height < 0.38) {
          color = 0xfef3c7; // Wet Silt / Pearl Sand
        } else if (height < 0.42) {
          color = 0xfde047; // Warm Beach Sand (Gold)
        } else if (height < 0.58) {
          color = 0x22c55e; // Verdant Plains (Meadow Green)
        } else if (height < 0.70) {
          color = 0x166534; // Highland Canopy (Deep Forest)
        } else if (height < 0.80) {
          color = 0x7c2d12; // Eroded Earth (Sienna/Clay)
        } else if (height < 0.90) {
          color = 0x475569; // Tectonic Ridge (Basalt Slate)
        } else if (height < 0.96) {
          color = 0x94a3b8; // Alpine Scree (Stone Gray)
        } else {
          color = 0xffffff; // Glacial Peak (Pure White)
        }

        // Blend in heatmaps if active
        if (this.heatmapMode === 'devotion') {
           let maxIntensity = 0;
           listTribes.forEach(t => {
              const dx = t.x - x;
              const dy = t.y - y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < 15) {
                 const intensity = (15 - dist) / 15;
                 if (intensity > maxIntensity) maxIntensity = intensity;
              }
           });
           if (maxIntensity > 0) {
              const factor = maxIntensity * 0.7;
              const r = ((color >> 16) & 0xFF);
              const g = ((color >> 8) & 0xFF);
              const b = (color & 0xFF);
              const rB = Math.round((1-factor)*r + factor*245);
              const gB = Math.round((1-factor)*g + factor*158);
              const bB = Math.round((1-factor)*b + factor*11);
              color = (rB << 16) | (gB << 8) | bB;
           }
        }

        sprite.tint = color;
        sprite.x = iso.x + this.debugOffsetX;
        sprite.y = iso.y + this.debugOffsetY;

        sprite.width = this.isoWidth * this.debugScale * step;
        sprite.height = (this.isoWidth * this.debugScale * step) * 0.5; 
        sprite.visible = true;
      }
    }

    for (const [key, sprite] of this.tileSpritesMap.entries()) {
      if (!activeCoords.has(key)) {
        sprite.visible = false;
      }
    }
  }

  public drawInteractionsLayer() {
    if (this.wasDestroyed || !this.app || !this.initialized) return;

    const oldChildren = [...this.interactions.children];
    this.interactions.removeChildren();
    oldChildren.forEach(child => child.destroy({ children: true }));

    const graphics = new PIXI.Graphics();
    this.interactions.addChild(graphics);

    if (this.hoveredTile) {
      const iso = this.toIso(this.hoveredTile.x, this.hoveredTile.y);
      // Center the selector on the sprite coordinate (iso.x, iso.y)
      // Vertices offset to create a 2:1 diamond centered at origin
      const hX = this.isoWidth / 2;
      const hY = this.isoHeight / 2;
      
      const offsetX = iso.x + this.debugOffsetX;
      const offsetY = iso.y + this.debugOffsetY;

      graphics.poly([
        offsetX, offsetY - hY,      // Top
        offsetX + hX, offsetY,      // Right
        offsetX, offsetY + hY,      // Bottom
        offsetX - hX, offsetY       // Left
      ]);
      graphics.stroke({ width: 2, color: 0x38bdf8, alpha: 0.85 });
      graphics.fill({ color: 0x38bdf8, alpha: 0.15 });
    }
  }

  private detectPivot(texture: PIXI.Texture, cacheKey: string): { x: number, y: number } {
    if (this.pivotCache.has(cacheKey)) return this.pivotCache.get(cacheKey)!;

    // Default pivot is bottom-center
    const pivot = { x: 0.5, y: 1.0 };
    
    try {
      if (this.app?.renderer) {
         // Perform pixel analysis for grounding point
         // We extract pixels from the bottom 20% of the sprite
         const pixelData = this.app.renderer.extract.pixels(texture);
         const pixelsArray = (pixelData as any).pixels || (pixelData as any).data || pixelData;
         const { width, height } = texture.frame;
         
         // Scan from bottom up to find the base-most non-transparent pixel
         let foundY = height - 1;
         let foundX = width / 2;
         let breakout = false;

         for (let y = height - 1; y > height * 0.5; y--) {
            for (let x = 0; x < width; x++) {
               const alpha = pixelsArray[(y * width + x) * 4 + 3];
               if (alpha > 10) {
                  foundY = y;
                  foundX = x;
                  breakout = true;
                  break;
               }
            }
            if (breakout) break;
         }
         pivot.x = foundX / width;
         pivot.y = foundY / height;
      }
    } catch (e) {
      console.warn("Pivot detection failed for", cacheKey);
    }

    this.pivotCache.set(cacheKey, pivot);
    return pivot;
  }

  updateEntities(renderEntities: RenderableEntity[]) {
    this.lastEntities = renderEntities;
    if (this.wasDestroyed || !this.app || !this.initialized) return;

    this.animFrame++;

    if (this.lastTerrainMap && this.animFrame % 10 === 0) {
      this.drawTerrain(this.lastTerrainMap);
    }

    const activeIds = new Set<string>();
    this.overlaysLayer.clear();

    // View Rect Culling (Phase 1, Step 3)
    const viewPadding = 128;
    const viewRect = {
        minX: -this.app.stage.x / this.zoom - viewPadding,
        maxX: (this.app.screen.width - this.app.stage.x) / this.zoom + viewPadding,
        minY: -this.app.stage.y / this.zoom - viewPadding,
        maxY: (this.app.screen.height - this.app.stage.y) / this.zoom + viewPadding,
    };

    renderEntities.forEach(ent => {
      const iso = this.toIso(ent.x, ent.y);
      const isSelected = ent.id === this.selectedEntityId;

      // Simple Frustum Culling
      const existing = this.entitySprites.get(ent.id);
      if (iso.x + this.debugOffsetX < viewRect.minX || iso.x + this.debugOffsetX > viewRect.maxX || 
          iso.y + this.debugOffsetY < viewRect.minY || iso.y + this.debugOffsetY > viewRect.maxY) {
          if (existing) existing.visible = false;
          return;
      }

      activeIds.add(ent.id);

      let container = existing;
      let actorSprite: PIXI.Sprite;
      let selectionRing: PIXI.Graphics;
      let shadow: PIXI.Graphics;
      let labelsContainer: PIXI.Container;
      let nameText: PIXI.Text;
      let subLabel: PIXI.Text;

      if (!container) {
        container = new PIXI.Container();
        this.entities.addChild(container);
        this.entitySprites.set(ent.id, container);

        selectionRing = new PIXI.Graphics();
        container.addChild(selectionRing);

        shadow = new PIXI.Graphics();
        container.addChild(shadow);

        actorSprite = new PIXI.Sprite();
        container.addChild(actorSprite);

        labelsContainer = new PIXI.Container();
        container.addChild(labelsContainer);

        nameText = new PIXI.Text({
          text: '',
          style: {
            fontFamily: 'monospace', fontSize: 10, fill: '#ffffff', fontWeight: 'bold', stroke: { color: '#000000', width: 2 }
          }
        });
        labelsContainer.addChild(nameText);

        subLabel = new PIXI.Text({
          text: '',
          style: {
            fontFamily: 'monospace', fontSize: 8, fill: '#94a3b8', stroke: { color: '#000000', width: 1 }
          }
        });
        labelsContainer.addChild(subLabel);
      } else {
        container.visible = true;
        selectionRing = container.children[0] as PIXI.Graphics;
        shadow = container.children[1] as PIXI.Graphics;
        actorSprite = container.children[2] as PIXI.Sprite;
        labelsContainer = container.children[3] as PIXI.Container;
        nameText = labelsContainer.children[0] as PIXI.Text;
        subLabel = labelsContainer.children[1] as PIXI.Text;
      }

      container.x = iso.x + this.debugOffsetX;
      container.y = iso.y + this.debugOffsetY;

      let baseScale = 1.0;

      selectionRing.clear();
      if (isSelected) {
        selectionRing.ellipse(0, this.isoHeight / 2, 22, 11);
        selectionRing.stroke({ width: 2, color: 0xfacc15, alpha: 0.9 });
        selectionRing.fill({ color: 0xfacc15, alpha: 0.22 });
      }

      shadow.clear();
      shadow.ellipse(0, this.isoHeight / 2, 12, 6);
      shadow.fill({ color: 0x000000, alpha: 0.4 });

      let texture: PIXI.Texture | null = null;
      let sheetKey = '';
      let row = 0;
      let col = 0;

      if (ent.category === 'Tribe') {
        const faction = ent.faction || 'ANIMIST';
        const sheetMap = {
          ANIMIST: 'char-animist-4k-sheet',
          TECHNOCRAT: 'char-technocrat-4k-sheet',
          INTERVENTIONIST: 'char-interventionist-4k-sheet',
          NIHILIST: 'char-nihilist-4k-sheet',
          ELEMENTAL: 'char-elemental-4k-sheet'
        };
        sheetKey = sheetMap[faction as keyof typeof sheetMap] || 'char-animist-4k-sheet';

        const state = ent.activityState || 'IDLE';
        const isWalking = state === 'MOVING_TO_RESOURCE' || state === 'WANDERING' || state === 'FLEEING';
        
        if (ent.health !== undefined && ent.health <= 0) {
          row = 3; col = 3;
        } else if (isWalking) {
          row = 1; col = Math.floor(this.animFrame / 10) % 4; 
        } else if (state === 'PRAYING' || state === 'HUNTING') {
          row = 2; col = Math.floor(this.animFrame / 12) % 4;
        } else {
          row = 0; col = Math.floor(this.animFrame / 30) % 4;
        }

        texture = this.getSheetCellTexture(sheetKey, row, col);

        const factionColors = { ANIMIST: 0x10b981, TECHNOCRAT: 0x06b6d4, INTERVENTIONIST: 0xf59e0b, NIHILIST: 0x8b5cf6, ELEMENTAL: 0xef4444 };
        const facC = factionColors[faction as keyof typeof factionColors] || 0x94a3b8;

        nameText.text = ent.name.split('[')[0].trim();
        subLabel.text = `${faction} // PO: ${ent.population || 0}`;
        subLabel.style.fill = facC;
        labelsContainer.visible = true;
        baseScale = 0.85;
        if (ent.subType === 'ENT') baseScale = 1.8;
      }
      else if (ent.category === 'Flora') {
        const isBanana = ent.subType && ['GOLD', 'CYBER', 'VOID', 'DIVINE', 'FIRE', 'FROST', 'TOXIC', 'COSMIC'].includes(ent.subType);
        if (isBanana) {
          sheetKey = 'nano-banana-4k-sheet';
          row = ['GOLD', 'CYBER', 'VOID', 'DIVINE', 'FIRE', 'FROST', 'TOXIC', 'COSMIC'].indexOf(ent.subType);
        } else if (ent.name === 'CROP') {
          sheetKey = 'flora-crops-4k-sheet';
          row = ['WHEAT', 'CORN', 'RICE', 'COTTON', 'POTATO', 'TOMATO', 'BERRY', 'GLOWSHROOM'].indexOf(ent.subType.toUpperCase());
        } else {
          sheetKey = 'flora-trees-4k-sheet';
          row = ['OAK', 'PINE', 'BIRCH', 'WILLOW', 'REDWOOD', 'PALM', 'CACTUS', 'BAMBOO'].indexOf(ent.subType.toUpperCase());
        }

        const growth = ent.growth !== undefined ? ent.growth : 100;
        if (growth <= 10) col = 3;
        else if (growth < 40) col = 0;
        else if (growth < 70) col = 1;
        else col = (Math.floor(this.animFrame / 24) % 2);

        texture = this.getSheetCellTexture(sheetKey, row, col);
        baseScale = 0.3 + 0.7 * (growth / 100);
        nameText.text = isBanana ? `🍌 ${ent.subType}` : ent.subType;
        nameText.style.fill = isBanana ? '#facc15' : '#4ade80';
        subLabel.text = `GROWTH: ${growth}%`;
        labelsContainer.visible = true;
      }
      else if (ent.category === 'Fauna') {
        sheetKey = 'fauna-wild-4k-sheet';
        const isWolf = ent.subType.toLowerCase().includes('wolf');
        row = isWolf ? 0 : 1;
        col = Math.floor(this.animFrame / 15) % 4;
        texture = this.getSheetCellTexture(sheetKey, row, col);
        nameText.text = ent.subType;
        nameText.style.fill = isWolf ? '#f87171' : '#a7f3d0';
        subLabel.text = `WILDLIFE`;
        labelsContainer.visible = true;
      }
      else if (ent.category === 'Structure') {
        const faction = ent.faction || 'UNIVERSAL';
        const sheetMap = { ANIMIST: 'bldg-animist-4k-sheet', TECHNOCRAT: 'bldg-technocrat-4k-sheet', INTERVENTIONIST: 'bldg-interventionist-4k-sheet', ELEMENTAL: 'bldg-elemental-4k-sheet', NIHILIST: 'bldg-nihilist-4k-sheet', UNIVERSAL: 'bldg-universal-4k-sheet' };
        sheetKey = sheetMap[faction as keyof typeof sheetMap] || 'bldg-universal-4k-sheet';
        const bldgRows = { ALTAR: 0, REACTOR: 1, HABITAT: 2, DEFENSE: 3, FARM: 0 };
        row = bldgRows[ent.name as keyof typeof bldgRows] || 0;

        const durability = ent.health !== undefined ? ent.health : 100;
        if (durability <= 0) col = 3;
        else if (durability < 35) col = 2;
        else if (durability >= 35 && durability < 65) col = 1;
        else col = (Math.floor(this.animFrame / 30) % 2);

        texture = this.getSheetCellTexture(sheetKey, row, col);
        nameText.text = ent.subType || ent.name;
        nameText.style.fill = '#facc15';
        subLabel.text = `DURABILITY: ${durability}%`;
        labelsContainer.visible = true;
      }

      if (texture) {
        const cacheKey = `${sheetKey}_r${row}_c${col}`;
        actorSprite.texture = texture;
        const pivot = this.detectPivot(texture, cacheKey);
        actorSprite.anchor.set(pivot.x, pivot.y);

        const override = this.registryOverrides[cacheKey] || this.registryOverrides[sheetKey];
        if (override) {
          if (override.scale !== undefined) baseScale *= override.scale;
          if (override.opacity !== undefined) actorSprite.alpha = override.opacity;
        } else {
          actorSprite.alpha = 1.0;
        }
      }

      const scale = this.isoWidth * this.debugScale * baseScale;
      actorSprite.width = scale;
      actorSprite.height = scale;
      labelsContainer.y = -actorSprite.height / 2 - 12;
      nameText.x = -nameText.width / 2;
      subLabel.x = -subLabel.width / 2;
      subLabel.y = -actorSprite.height / 2 - 9;

      // God's Eye: Threat Alerts & Tribal Tension
      if (this.godsEyeMode || this.heatmapMode === 'tension') {
        if (ent.health !== undefined && ent.health < 40) {
          // Draw threat alert triangle
          this.overlaysLayer.moveTo(iso.x + this.debugOffsetX, iso.y + this.debugOffsetY - 60);
          this.overlaysLayer.lineTo(iso.x + this.debugOffsetX - 10, iso.y + this.debugOffsetY - 80);
          this.overlaysLayer.lineTo(iso.x + this.debugOffsetX + 10, iso.y + this.debugOffsetY - 80);
          this.overlaysLayer.lineTo(iso.x + this.debugOffsetX, iso.y + this.debugOffsetY - 60);
          this.overlaysLayer.fill({ color: 0xff0000, alpha: 0.8 });
          this.overlaysLayer.stroke({ width: 2, color: 0x000000 });
        }
        if (ent.category === 'Tribe') {
          renderEntities.forEach(other => {
            if (other.category === 'Tribe' && other.id > ent.id) {
               if (ent.faction !== other.faction) {
                  const otherIso = this.toIso(other.x, other.y);
                  this.overlaysLayer.moveTo(iso.x + this.debugOffsetX, iso.y + this.debugOffsetY);
                  this.overlaysLayer.lineTo(otherIso.x + this.debugOffsetX, otherIso.y + this.debugOffsetY);
                  this.overlaysLayer.stroke({ width: 2, color: 0xff4444, alpha: 0.4 });
               }
            }
          });
        }
      }
    });

    for (const [id, container] of this.entitySprites.entries()) {
      if (!activeIds.has(id)) {
        container.destroy({ children: true });
        this.entitySprites.delete(id);
      }
    }
    this.entities.children.sort((a, b) => a.y - b.y);
  }

  destroy() {
    this.wasDestroyed = true;
    this.initialized = false;
    window.removeEventListener('resize', this.handleResize);
    if (this.app?.ticker) { this.app.ticker.stop(); }
    this.textureCache.forEach(t => t.destroy(true));
    this.textureCache.clear();
    this.loadedSheets.forEach(t => t.destroy(true));
    this.loadedSheets.clear();
    this.tileSpritesMap.forEach(s => s.destroy({ children: true }));
    this.tileSpritesMap.clear();
    this.entitySprites.forEach(s => s.destroy({ children: true }));
    this.entitySprites.clear();
    if (this.app) {
      try {
        if (this.app.canvas && this.app.canvas.parentNode === this.container) {
          this.container.removeChild(this.app.canvas);
        }
        if (this.app.stage) {
          if (typeof (this.app as any)._cancelResize !== 'function') { (this.app as any)._cancelResize = () => {}; }
          this.app.destroy(true, { children: true, texture: true });
        }
      } catch (e) {}
    }
    this.app = null;
  }
}
