import React, { useState, useEffect } from 'react';
import { Layers, MousePointer2, Move, Maximize, Save, Search, ChevronRight, ChevronDown, Package, Layout, Crosshair, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssetRegistryEditorProps {
  registry: any;
  onUpdate: (mappingKey: string, overrides: any) => void;
  onSave: (fullRegistry: any) => void;
  onAddMapping: (newKey: string, data: any) => void;
  onRemoveMapping: (key: string) => void;
}

export function AssetRegistryEditor({ registry, onUpdate, onSave, onAddMapping, onRemoveMapping }: AssetRegistryEditorProps) {
  const [activeTab, setActiveTab] = useState<'sheets' | 'mappings' | 'surfaces'>('mappings');
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);
  
  // High-fidelity local state for live-tuning
  const [uOffset, setUOffset] = useState(0);
  const [vOffset, setVOffset] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isAnimated, setIsAnimated] = useState(true);
  const [lodLocked, setLodLocked] = useState(false);
  const [isInteractive, setIsInteractive] = useState(true);

  // Auto-sync local state with renderer Ref on every change
  useEffect(() => {
    if (selectedMapping) {
      onUpdate(selectedMapping, { uOffset, vOffset, scale, isAnimated, lodLocked, isInteractive });
    }
  }, [uOffset, vOffset, scale, isAnimated, lodLocked, isInteractive]);

  const handleSelectMapping = (id: string) => {
    const existing = registry.mappings[id];
    setSelectedMapping(id);
    setUOffset(existing?.uOffset || 0);
    setVOffset(existing?.vOffset || 0);
    setScale(existing?.scale || 1.0);
    setIsAnimated(existing?.isAnimated !== false);
    setLodLocked(!!existing?.lodLocked);
    setIsInteractive(existing?.isInteractive !== false);
  };

  const handleCreateMapping = () => {
    const name = prompt("Enter new mapping ID (e.g. bldg_custom_shrine):");
    if (name) {
      onAddMapping(name, { sheet: Object.keys(registry.sheets)[0], row: 0, col: 0 });
      handleSelectMapping(name);
    }
  };

  return (
    <div className="fixed top-24 left-6 z-[9998] pointer-events-auto h-[75vh] flex shadow-[0_0_100px_rgba(0,0,0,0.8)]">
      {/* TACTICAL SIDE NAV */}
      <div className="w-14 bg-slate-950/95 border border-white/10 rounded-l-2xl flex flex-col items-center py-6 gap-6 backdrop-blur-3xl relative">
        <NavBtn active={activeTab === 'sheets'} onClick={() => setActiveTab('sheets')} title="Slices"><Layout size={20} /></NavBtn>
        <NavBtn active={activeTab === 'mappings'} onClick={() => setActiveTab('mappings')} title="Registry"><Package size={20} /></NavBtn>
        <NavBtn active={activeTab === 'surfaces'} onClick={() => setActiveTab('surfaces')} title="Surfaces"><Crosshair size={20} /></NavBtn>
        <div className="mt-auto flex flex-col gap-4">
           <button 
            onClick={handleCreateMapping}
            className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-black transition-all flex items-center justify-center border border-sky-500/30"
          >
            <Plus size={20} />
          </button>
          <button 
            onClick={() => onSave(registry)}
            className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center border border-emerald-500/30"
          >
            <Save size={18} />
          </button>
        </div>
      </div>

      {/* CORE CONTROL ARCHITECT PANEL */}
      <div className="w-80 bg-slate-900/90 border-y border-r border-white/10 rounded-r-2xl backdrop-blur-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/[0.03] flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-300">Registry Architect</span>
            <span className="text-[8px] font-mono text-slate-500 uppercase">Synchronized with GPU Matrix</span>
          </div>
          <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">v4.0 // FINAL</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
          
          {activeTab === 'mappings' && (
            <>
              <div className="space-y-3">
                <label className="text-[9px] font-mono uppercase text-slate-500 block tracking-widest">Active Asset Selection</label>
                <div className="relative group">
                  <Search className="absolute left-2.5 top-2.5 text-slate-600 group-hover:text-slate-400 transition-colors" size={12} />
                  <select 
                    value={selectedMapping || ''}
                    onChange={(e) => handleSelectMapping(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-8 pr-3 text-xs font-mono text-slate-300 outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">-- Master Registry --</option>
                    {Object.keys(registry.mappings).map(key => (
                      <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {selectedMapping ? (
                  <motion.div 
                    key={selectedMapping}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* PROGRESSIVE DISCLOSURE: UV TUNING */}
                    <DisclosureSection title="Tactical UV Offsets" defaultOpen={true}>
                       <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-4 shadow-inner">
                        <TuningSlider label="U Offset (X)" value={uOffset} min={-128} max={128} onChange={setUOffset} unit="px" />
                        <TuningSlider label="V Offset (Y)" value={vOffset} min={-128} max={128} onChange={setVOffset} unit="px" />
                        <TuningSlider label="Global Scale" value={scale} min={0.2} max={4.0} step={0.01} onChange={setScale} unit="x" />
                      </div>
                    </DisclosureSection>

                    {/* PROGRESSIVE DISCLOSURE: CELL ATTRIBUTES */}
                    <DisclosureSection title="Interaction & LOD" defaultOpen={false}>
                      <div className="grid grid-cols-2 gap-2">
                         <AttrToggle label="Animated" active={isAnimated} onClick={() => setIsAnimated(!isAnimated)} />
                         <AttrToggle label="LOD Locked" active={lodLocked} onClick={() => setLodLocked(!lodLocked)} />
                         <AttrToggle label="Collision" active={isInteractive} onClick={() => setIsInteractive(!isInteractive)} />
                         <AttrToggle label="Shadows" active={true} />
                      </div>
                    </DisclosureSection>

                    {/* DANGER ZONE */}
                    <div className="pt-4 border-t border-white/5">
                      <button 
                        onClick={() => { if(confirm('Delete mapping?')) onRemoveMapping(selectedMapping!); setSelectedMapping(null); }}
                        className="w-full py-2 rounded-lg border border-rose-500/30 text-rose-500 text-[10px] font-mono uppercase hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                      >
                        Purge from Registry
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-slate-700 space-y-3 opacity-40">
                    <MousePointer2 size={32} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-center">Architect Idle // <br/>Select Asset to Begin Tuning</span>
                  </div>
                )}
              </AnimatePresence>
            </>
          )}

          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <label className="text-[9px] font-mono uppercase text-slate-500 block">GPU Slices (1024px)</label>
              {Object.keys(registry.sheets).map(key => (
                <div key={key} className="p-3 bg-black/40 border border-white/10 rounded-xl flex justify-between items-center group hover:border-white/30 transition-all cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-200 truncate w-40 font-bold">{key}</span>
                    <span className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">Native Cell: 256px // 4x4 Grid</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-700 group-hover:text-amber-500 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'surfaces' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                <label className="text-[9px] font-mono uppercase text-slate-500 block tracking-widest">Control Surfaces</label>
                <button 
                  onClick={() => {
                    const id = prompt("New Surface ID:");
                    if(id) onAddMapping(`SURFACE_${id}`, { type: 'ISOMETRIC', active: true });
                  }}
                  className="text-[8px] font-mono bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded hover:bg-sky-500 hover:text-black transition-all"
                >
                  NEW
                </button>
              </div>
              <div className="space-y-2 pb-10">
                {(registry.config.controlSurfaces || []).map((surf: any, i: number) => (
                  <SurfaceItem 
                    key={surf.id || i}
                    label={surf.id} 
                    type={surf.type} 
                    active={surf.active} 
                  />
                ))}
                {/* Fallback if no surfaces in config yet */}
                {(!registry.config.controlSurfaces || registry.config.controlSurfaces.length === 0) && (
                   <div className="p-4 border border-dashed border-white/5 rounded-xl text-center text-[9px] font-mono text-slate-600">
                      No active control surfaces found in master registry.
                   </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function DisclosureSection({ title, children, defaultOpen }: { title: string, children: React.ReactNode, defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-2">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-[9px] font-mono uppercase text-slate-400 tracking-tighter hover:text-white transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{children}</motion.div>}
    </div>
  );
}

function NavBtn({ children, active, onClick, title }: { children: React.ReactNode, active: boolean, onClick: () => void, title: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        active 
          ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)]' 
          : 'text-slate-500 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function TuningSlider({ label, value, min, max, step = 1, onChange, unit }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-mono uppercase tracking-tighter">
        <span className="text-slate-500">{label}</span>
        <span className="text-amber-400">{typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}{unit}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 shadow-lg"
      />
    </div>
  );
}

function AttrToggle({ label, active, onClick }: { label: string, active: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between p-2.5 rounded-xl border text-[9px] font-mono uppercase transition-all cursor-pointer ${active ? 'bg-amber-500/15 border-amber-500/40 text-amber-500' : 'bg-black/30 border-white/5 text-slate-600 hover:border-white/20'}`}
    >
      <span>{label}</span>
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-slate-800'}`} />
    </button>
  );
}

function SurfaceItem({ label, type, active = false }: any) {
  return (
    <div className={`p-3.5 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer ${active ? 'bg-sky-500/10 border-sky-500/40' : 'bg-black/30 border-white/5 opacity-40 hover:opacity-100 hover:border-white/20'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-mono font-black ${active ? 'text-sky-300' : 'text-slate-400'}`}>{label}</span>
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,1)] animate-pulse' : 'bg-slate-800'}`} />
      </div>
      <span className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">{type} // ACTIVE_CONTROL_SURFACE</span>
    </div>
  );
}
