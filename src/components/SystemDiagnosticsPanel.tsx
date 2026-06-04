import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EngineCoordinator } from '../engine/engineCoordinator';
import { Activity, ChevronDown, ChevronUp, Heart, Cpu, Globe, Shield, Zap, TrendingUp, Layers, Wind, Crosshair } from 'lucide-react';

interface SystemDiagnosticsPanelProps {
  coordinator: EngineCoordinator | null;
  simulationSpeed?: number;
  onClose?: () => void;
}

type SystemCategory = 'world' | 'combat' | 'faith' | 'economy' | 'macro' | 'physics' | 'vfx' | 'quest' | 'input';

interface SystemGroup {
  category: SystemCategory;
  label: string;
  icon: React.ReactNode;
  systems: string[];
}

const SYSTEM_GROUPS: SystemGroup[] = [
  {
    category: 'world',
    label: 'World',
    icon: <Globe size={14} />,
    systems: ['dayNight', 'season', 'weather', 'ecology', 'disease', 'wind'],
  },
  {
    category: 'combat',
    label: 'Combat',
    icon: <Shield size={14} />,
    systems: ['combat'],
  },
  {
    category: 'faith',
    label: 'Faith',
    icon: <Heart size={14} />,
    systems: ['faithFog', 'shrines'],
  },
  {
    category: 'economy',
    label: 'Economy',
    icon: <TrendingUp size={14} />,
    systems: ['resources', 'gathering', 'crafting', 'techTree', 'population', 'trade', 'settlements', 'borders'],
  },
  {
    category: 'macro',
    label: 'Macro',
    icon: <Layers size={14} />,
    systems: ['quests', 'achievements'],
  },
  {
    category: 'physics',
    label: 'Physics',
    icon: <Wind size={14} />,
    systems: ['collision', 'rigidBody'],
  },
  {
    category: 'vfx',
    label: 'VFX',
    icon: <Zap size={14} />,
    systems: ['particles', 'water', 'structures'],
  },
  {
    category: 'input',
    label: 'Input',
    icon: <Crosshair size={14} />,
    systems: ['input'],
  },
];

function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'idle':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'error':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    default:
      return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case 'running':
      return 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]';
    case 'idle':
      return 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]';
    case 'error':
      return 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]';
    default:
      return 'bg-slate-500';
  }
}

export function SystemDiagnosticsPanel({ coordinator, simulationSpeed = 1.0, onClose }: SystemDiagnosticsPanelProps) {
  const [diagnostics, setDiagnostics] = useState<Record<string, { active: number; status: string }>>({});
  const [fps, setFps] = useState(0);
  const [totalEntities, setTotalEntities] = useState(0);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<SystemCategory>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);

  const toggleCategory = useCallback((category: SystemCategory) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Poll diagnostics
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (coordinator) {
        setDiagnostics(coordinator.getDiagnostics());
        setTotalEntities(coordinator.ecs.getEntitiesWith([]).length);
      }
    }, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [coordinator]);

  // FPS counter using requestAnimationFrame
  useEffect(() => {
    const tick = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsUpdateRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const totalActive = Object.values(diagnostics).reduce(
    (sum: number, d: unknown) => sum + ((d as { active?: number })?.active ?? 0),
    0 as number
  );

  return (
    <div
      className="fixed top-16 right-4 z-[9999] w-80 rounded-xl border border-white/10 bg-[#080c18]/95 backdrop-blur-md shadow-2xl overflow-hidden font-mono text-xs text-slate-300 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/10">
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-sky-400" />
          <span className="text-sm font-bold tracking-wider text-sky-300">SYSTEM DIAGNOSTICS</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized((v) => !v)}
            className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <span className="text-sm leading-none">&times;</span>
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-white/5">
            <div className="flex flex-col items-center rounded-lg bg-white/[0.02] border border-white/5 p-2">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Entities</span>
              <span className="text-sm font-bold text-white">{totalEntities}</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-white/[0.02] border border-white/5 p-2">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">FPS</span>
              <span className="text-sm font-bold text-white">{fps}</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-white/[0.02] border border-white/5 p-2">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Speed</span>
              <span className="text-sm font-bold text-white">{simulationSpeed.toFixed(1)}x</span>
            </div>
          </div>

          {/* Total Active */}
          <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Total Active</span>
            <span className="text-sm font-bold text-emerald-400">{totalActive}</span>
          </div>

          {/* System Categories */}
          <div className="max-h-96 overflow-y-auto px-2 py-2 space-y-1">
            {SYSTEM_GROUPS.map((group) => {
              const isCollapsed = collapsedCategories.has(group.category);
              const groupDiagnostics = group.systems
                .map((sys) => ({ name: sys, data: diagnostics[sys] }))
                .filter((d) => d.data !== undefined);

              if (groupDiagnostics.length === 0 && !coordinator) return null;

              return (
                <div key={group.category} className="rounded-lg border border-white/5 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(group.category)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{group.icon}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                        {group.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">
                        {groupDiagnostics.reduce((sum, d) => sum + (d.data?.active ?? 0), 0)}
                      </span>
                      {isCollapsed ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronUp size={12} className="text-slate-500" />}
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="px-3 py-2 space-y-1.5">
                      {groupDiagnostics.map((sys) => (
                        <div
                          key={sys.name}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 bg-white/[0.015]"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(sys.data?.status ?? 'unknown')}`} />
                            <span className="text-[11px] text-slate-400 capitalize">
                              {sys.name.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(sys.data?.status ?? 'unknown')}`}>
                              {sys.data?.status ?? 'unknown'}
                            </span>
                            <span className="text-[11px] font-semibold text-white w-8 text-right">
                              {sys.data?.active ?? 0}
                            </span>
                          </div>
                        </div>
                      ))}
                      {groupDiagnostics.length === 0 && (
                        <div className="text-[10px] text-slate-600 px-2 py-1">No data</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Fallback: show any diagnostics not in groups */}
            {(() => {
              const groupedSystems = new Set(SYSTEM_GROUPS.flatMap((g) => g.systems));
              const ungrouped = Object.entries(diagnostics).filter(([name]) => !groupedSystems.has(name)) as [string, { active: number; status: string }][];
              if (ungrouped.length === 0) return null;
              return (
                <div className="rounded-lg border border-white/5 overflow-hidden">
                  <div className="px-3 py-2 bg-white/[0.02]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Other</span>
                  </div>
                  <div className="px-3 py-2 space-y-1.5">
                    {ungrouped.map(([name, data]) => {
                      const entry = data as { active: number; status: string };
                      return (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 bg-white/[0.015]"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(entry.status)}`} />
                            <span className="text-[11px] text-slate-400 capitalize">
                              {name.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(entry.status)}`}>
                              {entry.status}
                            </span>
                            <span className="text-[11px] font-semibold text-white w-8 text-right">{entry.active}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
