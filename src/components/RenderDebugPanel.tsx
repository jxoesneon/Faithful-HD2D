import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameRenderer } from '../engine/renderer';

type PipelineMode = 'composite' | 'albedo' | 'normal' | 'direct';

interface RenderDebugPanelProps {
  renderer: GameRenderer | null;
  onClose: () => void;
}

const MODES: { key: PipelineMode; label: string; color: string; desc: string }[] = [
  {
    key: 'composite',
    label: 'Composite',
    color: '#22d3ee',
    desc: 'Full deferred lighting pipeline. Albedo + Normals → Shader → Final image.',
  },
  {
    key: 'albedo',
    label: 'Albedo G-Buffer',
    color: '#a3e635',
    desc: 'Raw rendered scene colors captured before lighting is applied.',
  },
  {
    key: 'normal',
    label: 'Normal G-Buffer',
    color: '#818cf8',
    desc: 'Encoded surface normals (flat blue = (0.5, 0.5, 1.0) pointing up).',
  },
  {
    key: 'direct',
    label: 'Direct (No Shader)',
    color: '#fb923c',
    desc: 'Bypass deferred pipeline entirely. WorldContainer → Screen with no lighting.',
  },
];

export function RenderDebugPanel({ renderer, onClose }: RenderDebugPanelProps) {
  const [activeMode, setActiveMode] = useState<PipelineMode>('composite');
  const [diagnostics, setDiagnostics] = useState<Record<string, any>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll diagnostics every 500ms
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (renderer) {
        setDiagnostics(renderer.getDiagnostics());
        setActiveMode(renderer.debugPipelineMode);
      }
    }, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [renderer]);

  const setMode = useCallback(
    (mode: PipelineMode) => {
      if (!renderer) return;
      renderer.debugPipelineMode = mode;
      setActiveMode(mode);
    },
    [renderer]
  );

  const statusDot = (ok: boolean) => (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: ok ? '#22d3ee' : '#ef4444',
        marginRight: 6,
        flexShrink: 0,
        boxShadow: ok ? '0 0 6px #22d3ee88' : '0 0 6px #ef444488',
      }}
    />
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 72,
        right: 16,
        width: 300,
        background: 'rgba(8, 12, 24, 0.97)',
        border: '1px solid rgba(34, 211, 238, 0.25)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 11,
        color: '#94a3b8',
        zIndex: 9999,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(34, 211, 238, 0.06)',
          borderBottom: '1px solid rgba(34, 211, 238, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#22d3ee', fontWeight: 700, letterSpacing: 1 }}>
            ⬡ RENDER DEBUG
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 14,
            padding: '2px 6px',
            borderRadius: 4,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Pipeline Mode Selector */}
      <div style={{ padding: '12px 14px 8px' }}>
        <div style={{ color: '#475569', fontSize: 9, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
          Pipeline Stage
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {MODES.map((m) => {
            const isActive = activeMode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 7,
                  border: isActive
                    ? `1px solid ${m.color}55`
                    : '1px solid rgba(255,255,255,0.05)',
                  background: isActive
                    ? `${m.color}14`
                    : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: isActive ? m.color : '#334155',
                    marginTop: 2,
                    flexShrink: 0,
                    boxShadow: isActive ? `0 0 8px ${m.color}88` : 'none',
                    transition: 'all 0.15s',
                  }}
                />
                <div>
                  <div
                    style={{
                      color: isActive ? m.color : '#64748b',
                      fontWeight: isActive ? 700 : 400,
                      fontSize: 11,
                      transition: 'color 0.15s',
                    }}
                  >
                    {m.label}
                  </div>
                  <div style={{ color: '#475569', fontSize: 9, lineHeight: 1.4, marginTop: 2 }}>
                    {m.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Diagnostics */}
      <div
        style={{
          margin: '4px 14px 12px',
          padding: '10px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 7,
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div style={{ color: '#475569', fontSize: 9, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
          Pipeline Status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { label: 'Shader Compiled', value: diagnostics.shaderCompiled },
            { label: 'G-Buffers Ready', value: diagnostics.gBufferAlive },
            { label: 'Deferred Active', value: diagnostics.deferredActive },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center' }}>
              {statusDot(!!row.value)}
              <span style={{ color: row.value ? '#94a3b8' : '#64748b' }}>{row.label}</span>
              <span
                style={{
                  marginLeft: 'auto',
                  color: row.value ? '#22d3ee' : '#ef4444',
                  fontWeight: 700,
                }}
              >
                {row.value ? 'OK' : 'FAIL'}
              </span>
            </div>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '4px 0' }} />
          {[
            { label: 'Frame', value: diagnostics.frameCount },
            { label: 'Zoom', value: typeof diagnostics.zoom === 'number' ? diagnostics.zoom.toFixed(2) : '—' },
            { label: 'Last Frame Mode', value: diagnostics.lastFrameMode || '—' },
            { label: 'Battery Saver', value: diagnostics.batterySaver ? 'ON' : 'off' },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex' }}>
              <span>{row.label}</span>
              <span
                style={{
                  marginLeft: 'auto',
                  color: '#e2e8f0',
                  fontWeight: 600,
                }}
              >
                {String(row.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Console hint */}
      <div
        style={{
          padding: '6px 14px 10px',
          color: '#334155',
          fontSize: 9,
          lineHeight: 1.6,
          borderTop: '1px solid rgba(255,255,255,0.03)',
        }}
      >
        {'> window.__renderer.debugPipelineMode = "albedo"'}
        <br />
        {'> window.__renderer.getDiagnostics()'}
      </div>
    </div>
  );
}
