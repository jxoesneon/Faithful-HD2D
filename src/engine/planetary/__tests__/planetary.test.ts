import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlanetaryView } from '../planetary';
import type { SettlementInfo } from '../planetary';

describe('PlanetaryView', () => {
  let view: PlanetaryView;

  beforeEach(() => {
    view = new PlanetaryView(64, 64);
  });

  describe('constructor', () => {
    it('initialises with default 64x64 grid', () => {
      expect(view.width).toBe(64);
      expect(view.height).toBe(64);
      expect(view.zoom).toBe(1.0);
      expect(view.lastClickedRegion).toBeNull();
    });

    it('allows custom dimensions', () => {
      const v = new PlanetaryView(32, 32);
      expect(v.width).toBe(32);
      expect(v.height).toBe(32);
    });
  });

  describe('terrain color based on height', () => {
    it('returns green for low elevations', () => {
      const c = PlanetaryView.getTerrainColor(0);
      expect(c[1]).toBeGreaterThan(c[0]); // more green than red
      expect(c[1]).toBeGreaterThan(c[2]); // more green than blue
    });

    it('returns brown for mid elevations', () => {
      const c = PlanetaryView.getTerrainColor(0.45);
      expect(c[0]).toBeGreaterThan(c[1]); // more red than green (brown)
      expect(c[0]).toBeGreaterThan(c[2]);
    });

    it('returns white for high elevations', () => {
      const c = PlanetaryView.getTerrainColor(1.0);
      expect(c[0]).toBe(255);
      expect(c[1]).toBe(255);
      expect(c[2]).toBe(255);
    });

    it('transitions smoothly between bands', () => {
      const low = PlanetaryView.getTerrainColor(0.0);
      const mid = PlanetaryView.getTerrainColor(0.3);
      const high = PlanetaryView.getTerrainColor(0.6);
      const peak = PlanetaryView.getTerrainColor(1.0);

      expect(low[0]).toBeLessThan(mid[0]);
      expect(mid[0]).toBeLessThan(high[0]);
      expect(high[0]).toBeLessThan(peak[0]);
    });
  });

  describe('temperature band classification', () => {
    it('classifies frozen temperatures', () => {
      const band = PlanetaryView.getTemperatureBand(10);
      expect(band.classification).toBe('frozen');
      expect(band.minTemp).toBe(0);
      expect(band.maxTemp).toBe(20);
    });

    it('classifies cold temperatures', () => {
      const band = PlanetaryView.getTemperatureBand(30);
      expect(band.classification).toBe('cold');
    });

    it('classifies temperate temperatures', () => {
      const band = PlanetaryView.getTemperatureBand(50);
      expect(band.classification).toBe('temperate');
    });

    it('classifies hot temperatures', () => {
      const band = PlanetaryView.getTemperatureBand(70);
      expect(band.classification).toBe('hot');
    });

    it('classifies scorched temperatures', () => {
      const band = PlanetaryView.getTemperatureBand(90);
      expect(band.classification).toBe('scorched');
    });

    it('clamps out-of-range values', () => {
      expect(PlanetaryView.getTemperatureBand(-10).classification).toBe('frozen');
      expect(PlanetaryView.getTemperatureBand(110).classification).toBe('scorched');
    });
  });

  describe('click region storage', () => {
    it('stores the clicked tile', () => {
      view.click(10, 20);
      expect(view.lastClickedRegion).toEqual({ x: 10, y: 20 });
    });

    it('clamps negative coordinates to zero', () => {
      view.click(-5, -10);
      expect(view.lastClickedRegion).toEqual({ x: 0, y: 0 });
    });

    it('clamps overflow coordinates to grid bounds', () => {
      view.click(100, 100);
      expect(view.lastClickedRegion).toEqual({ x: 63, y: 63 });
    });
  });

  describe('settlement dot sizing by population', () => {
    it('gives minimum size for small populations', () => {
      const dots = view.computeSettlementDots([{ x: 0, y: 0, faction: 'ANIMIST', population: 4 }]);
      expect(dots[0].size).toBe(2);
    });

    it('increases dot size with population', () => {
      const small = view.computeSettlementDots([{ x: 0, y: 0, faction: 'ANIMIST', population: 36 }]);
      const medium = view.computeSettlementDots([{ x: 0, y: 0, faction: 'ANIMIST', population: 100 }]);
      const large = view.computeSettlementDots([{ x: 0, y: 0, faction: 'ANIMIST', population: 400 }]);

      expect(small[0].size).toBe(2);
      expect(medium[0].size).toBeGreaterThan(small[0].size);
      expect(large[0].size).toBe(6); // capped
    });

    it('colors dots by faction', () => {
      const dots = view.computeSettlementDots([
        { x: 0, y: 0, faction: 'ANIMIST', population: 100 },
        { x: 1, y: 1, faction: 'TECHNOCRAT', population: 100 },
      ]);
      expect(dots[0].color).toEqual([16, 185, 129, 255]);
      expect(dots[1].color).toEqual([6, 182, 212, 255]);
    });
  });

  describe('city light count proportional to settlement population', () => {
    it('generates one light for tiny populations', () => {
      const lights = view.computeCityLights([{ x: 10, y: 10, faction: 'ANIMIST', population: 5 }]);
      expect(lights.length).toBe(1);
    });

    it('scales light count with population', () => {
      const s1: SettlementInfo = { x: 10, y: 10, faction: 'ANIMIST', population: 50 };
      const s2: SettlementInfo = { x: 20, y: 20, faction: 'ANIMIST', population: 100 };
      const lights1 = view.computeCityLights([s1]);
      const lights2 = view.computeCityLights([s2]);

      expect(lights1.length).toBe(5); // floor(50/10)
      expect(lights2.length).toBe(10); // floor(100/10)
    });

    it('sums across multiple settlements', () => {
      const settlements: SettlementInfo[] = [
        { x: 10, y: 10, faction: 'ANIMIST', population: 30 },
        { x: 20, y: 20, faction: 'TECHNOCRAT', population: 20 },
      ];
      const lights = view.computeCityLights(settlements);
      expect(lights.length).toBe(3 + 2);
    });

    it('assigns intensity proportional to population', () => {
      const lights = view.computeCityLights([{ x: 10, y: 10, faction: 'ANIMIST', population: 50 }]);
      expect(lights[0].intensity).toBe(0.5);
    });
  });

  describe('faith region coloring', () => {
    it('blends faith overlay into the render output', () => {
      const size = 64 * 64;
      const terrain = new Float32Array(size).fill(0.5);
      const temp = new Float32Array(size).fill(50);
      const overlay = new Uint8Array(size * 4).fill(0);

      // Paint a red faith region at (10, 10)
      const i = (10 * 64 + 10) * 4;
      overlay[i + 0] = 255;
      overlay[i + 1] = 0;
      overlay[i + 2] = 0;
      overlay[i + 3] = 128;

      const output = view.render({
        terrainHeight: terrain,
        temperature: temp,
        seaLevel: 0.2,
        faithOverlay: overlay,
      });

      const pixel = view.getPixel(output, 10, 10);
      expect(pixel[0]).toBeGreaterThan(pixel[2]); // red channel boosted
    });

    it('renders without overlay when omitted', () => {
      const size = 64 * 64;
      const terrain = new Float32Array(size).fill(0.5);
      const temp = new Float32Array(size).fill(50);

      const output = view.render({
        terrainHeight: terrain,
        temperature: temp,
      });

      expect(output.length).toBe(size * 4);
      expect(output[3]).toBe(255); // alpha channel
    });
  });

  describe('water rendering', () => {
    it('renders water below sea level', () => {
      const size = 64 * 64;
      const terrain = new Float32Array(size).fill(0.1); // below default seaLevel 0.2
      const temp = new Float32Array(size).fill(50);

      const output = view.render({ terrainHeight: terrain, temperature: temp });
      const pixel = view.getPixel(output, 0, 0);

      // Water should be blue-ish
      expect(pixel[2]).toBeGreaterThan(pixel[0]);
      expect(pixel[2]).toBeGreaterThan(pixel[1]);
    });

    it('renders terrain above sea level', () => {
      const size = 64 * 64;
      const terrain = new Float32Array(size).fill(0.5);
      const temp = new Float32Array(size).fill(50);

      const output = view.render({ terrainHeight: terrain, temperature: temp });
      const pixel = view.getPixel(output, 0, 0);

      // Terrain should be brown-ish, not blue
      expect(pixel[0]).toBeGreaterThan(pixel[2]);
    });
  });

  describe('night mode city lights', () => {
    it('draws city lights only in night mode', () => {
      const size = 64 * 64;
      const terrain = new Float32Array(size).fill(0.5);
      const temp = new Float32Array(size).fill(50);
      const settlements: SettlementInfo[] = [
        { x: 10, y: 10, faction: 'ANIMIST', population: 100 },
      ];

      const dayOutput = view.render({
        terrainHeight: terrain,
        temperature: temp,
        settlements,
        nightMode: false,
      });

      const nightOutput = view.render({
        terrainHeight: terrain,
        temperature: temp,
        settlements,
        nightMode: true,
      });

      const dayPixel = view.getPixel(dayOutput, 10, 10);
      const nightPixel = view.getPixel(nightOutput, 10, 10);

      // Night pixel should be brighter / more yellow
      const daySum = dayPixel[0] + dayPixel[1] + dayPixel[2];
      const nightSum = nightPixel[0] + nightPixel[1] + nightPixel[2];
      expect(nightSum).toBeGreaterThan(daySum);
    });
  });

  describe('camera zoom state', () => {
    it('defaults to planetary zoom', () => {
      expect(view.zoom).toBe(1.0);
    });

    it('can transition toward isometric', () => {
      view.zoom = 0.5;
      expect(view.zoom).toBe(0.5);
    });
  });
});
