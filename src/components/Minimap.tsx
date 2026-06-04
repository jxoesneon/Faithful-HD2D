import React, { useRef, useEffect, useCallback } from 'react';
import type { RenderableEntity } from '../types';

interface MinimapProps {
  terrain: number[][] | null;
  entities: RenderableEntity[];
  cameraX: number;
  cameraY: number;
  cameraWidth: number;
  cameraHeight: number;
  worldWidth?: number;
  worldHeight?: number;
  onPanTo: (worldX: number, worldY: number) => void;
  width?: number;
  height?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Tribe: '#22d3ee',
  Flora: '#4ade80',
  Fauna: '#f87171',
  Structure: '#facc15',
};

function heightToColor(h: number): string {
  if (h < 0.12) return '#0a1128';
  if (h < 0.22) return '#1e3a8a';
  if (h < 0.32) return '#60a5fa';
  if (h < 0.38) return '#fef3c7';
  if (h < 0.42) return '#fde047';
  if (h < 0.58) return '#22c55e';
  if (h < 0.70) return '#166534';
  if (h < 0.80) return '#7c2d12';
  if (h < 0.90) return '#475569';
  if (h < 0.96) return '#94a3b8';
  return '#ffffff';
}

/**
 * Minimap widget that renders a simplified terrain overview,
 * entity dots, and a camera viewport overlay.
 */
export const Minimap: React.FC<MinimapProps> = ({
  terrain,
  entities,
  cameraX,
  cameraY,
  cameraWidth,
  cameraHeight,
  worldWidth = 64,
  worldHeight = 64,
  onPanTo,
  width = 200,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale for HiDPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    const tileW = width / worldWidth;
    const tileH = height / worldHeight;

    // Terrain
    if (terrain && terrain.length > 0) {
      for (let y = 0; y < worldHeight; y++) {
        for (let x = 0; x < worldWidth; x++) {
          const row = terrain[y];
          const h = row ? row[x] ?? 0 : 0;
          ctx.fillStyle = heightToColor(h);
          ctx.fillRect(x * tileW, y * tileH, tileW + 0.5, tileH + 0.5);
        }
      }
    }

    // Entities
    for (const ent of entities) {
      const cx = (ent.x / worldWidth) * width;
      const cy = (ent.y / worldHeight) * height;
      const color = CATEGORY_COLORS[ent.category] || '#94a3b8';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1.5, width / 80), 0, Math.PI * 2);
      ctx.fill();
    }

    // Camera viewport rect
    const vx = (cameraX / worldWidth) * width;
    const vy = (cameraY / worldHeight) * height;
    const vw = (cameraWidth / worldWidth) * width;
    const vh = (cameraHeight / worldHeight) * height;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vx, vy, vw, vh);
  }, [terrain, entities, cameraX, cameraY, cameraWidth, cameraHeight, worldWidth, worldHeight, width, height]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldX = (x / width) * worldWidth;
      const worldY = (y / height) * worldHeight;
      onPanTo(worldX, worldY);
    },
    [width, height, worldWidth, worldHeight, onPanTo]
  );

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950/60 backdrop-blur-md"
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ width, height, cursor: 'pointer' }}
        aria-label="Minimap"
      />
      <div className="absolute top-1 left-2 text-[9px] text-slate-500 font-mono uppercase tracking-widest pointer-events-none select-none">
        Overworld
      </div>
    </div>
  );
};
