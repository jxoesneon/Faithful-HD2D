import React, { useState } from 'react';
import { GODS_PANTHEON, God } from '../engine/gods_data';
import { Sparkles, ChevronDown, Award, Sun, Zap, Moon, Heart, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioEngine } from '../engine/audio';

interface SelectedProps {
  onSelect: (god: God) => void;
}

export function DeitySelectionOverlay({ onSelect }: SelectedProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Return specific lucide icon depending on element
  const getElementIcon = (element: string) => {
    switch (element.toLowerCase()) {
      case 'stellar': return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'temporal': return <Zap className="w-3.5 h-3.5 text-rose-400 animate-pulse" />;
      case 'void': return <Moon className="w-3.5 h-3.5 text-purple-400" />;
      case 'cybernetic': return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      case 'primal': return <Heart className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <Eye className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4 md:p-8 select-none overflow-y-auto pointer-events-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="w-full max-w-7xl bg-slate-950/80 border border-white/10 rounded-3xl p-6 md:p-10 flex flex-col gap-6 shadow-[0_32px_96px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-y-auto custom-scrollbar backdrop-blur-md"
      >
        
        {/* Main Header Descriptor */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-[0.2em] bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
            ⚡ Transcendental Sanctum Seeding
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
            Select Your Patron Deity
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-light leading-relaxed">
            Your choice constructs your civilization's starting genetic properties, applies immediate demographic boosts, and unlocks their massive custom skill system.
          </p>
        </div>

        {/* 10 Gods Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 items-stretch mt-4">
          {GODS_PANTHEON.map((god: God) => {
            const isHovered = hoveredId === god.id;
            const isExpanded = expandedId === god.id;

            return (
              <motion.div
                key={god.id}
                onMouseEnter={() => {
                  setHoveredId(god.id);
                  AudioEngine.playHover();
                }}
                onMouseLeave={() => setHoveredId(null)}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group flex flex-col justify-between bg-slate-950/45 border hover:bg-slate-900/30 rounded-2xl p-5 transition-all duration-300 relative flex-1"
                style={{
                  borderColor: isHovered ? `${god.colorHex}66` : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: isHovered ? `0 12px 36px -6px ${god.colorHex}25` : 'none'
                }}
              >
                {/* Micro Ambient Glow Line */}
                <div 
                  className="absolute top-0 left-12 right-12 h-[2px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: god.colorHex }}
                />

                <div className="space-y-4">
                  {/* Card Element & Dot */}
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-wider">
                    <span 
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5"
                      style={{ color: god.colorHex }}
                    >
                      {getElementIcon(god.element)}
                      {god.element}
                    </span>
                    <span className="opacity-50 text-slate-400">PATRON {god.id.substring(3).toUpperCase()}</span>
                  </div>

                  {/* Icon or Avatar Visual Descriptor */}
                  <div className="h-28 rounded-xl bg-black/45 border border-white/5 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                    {/* Abstract Grid background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:10px_10px] opacity-40" />
                    <span className="text-4xl relative z-10 select-none filter drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]">
                      {god.id.includes('shiva') ? '🔥' :
                       god.id.includes('athena') ? '🦉' :
                       god.id.includes('amaterasu') ? '☀️' :
                       god.id.includes('horus') ? '🦅' :
                       god.id.includes('quetzalcoatl') ? '🐍' :
                       god.id.includes('thor') ? '⚡' :
                       god.id.includes('huitzilopochtli') ? '⚔️' :
                       god.id.includes('anubis') ? '⚖️' :
                       god.id.includes('freya') ? '🐱' : '🐉'}
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase mt-3 relative z-10">ALIGNED COGNITION</span>
                  </div>

                  {/* Deity Info */}
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                      {god.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block mt-0.5 min-h-[1.5rem]">
                      {god.title}
                    </span>
                  </div>

                  {/* Boost Details Toggle */}
                  <div className="space-y-2">
                    <button
                      onMouseEnter={() => AudioEngine.playHover()}
                      onClick={() => {
                        AudioEngine.playHover();
                        setExpandedId(isExpanded ? null : god.id);
                      }}
                      className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-white transition-colors bg-white/5 py-1.5 px-2 rounded-lg border border-white/5 font-sans"
                    >
                      <span className="flex items-center gap-1.5 font-bold">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        Starting Boost
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                      <p className="p-3 rounded-lg bg-black/55 text-[10px] font-mono text-slate-300 border border-white/5 leading-relaxed">
                        {god.boostsDesc}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-light line-clamp-3">
                    {god.description}
                  </p>
                </div>

                {/* Ultimate Ascendancy Strike Button */}
                <button
                  onMouseEnter={() => AudioEngine.playHover()}
                  onClick={() => {
                    AudioEngine.playClick();
                    onSelect(god);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-widest text-black transition-all cursor-pointer mt-5 pointer-events-auto shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: god.colorHex,
                    boxShadow: isHovered ? `0 6px 20px ${god.colorHex}55` : `0 4px 12px ${god.colorHex}22`
                  }}
                >
                  Pledge Pact
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Small footer guidelines */}
        <div className="text-center text-[10px] font-mono text-slate-500 tracking-wider border-t border-white/5 pt-4">
          PATRON MUTATION SEED MATRIX // CLICK "PLEDGE PACT" TO TRANSMUTATE // RE-SWAPPABLE AT ANY TIME INSIDE THE SANCTUM LAYER
        </div>

      </motion.div>
    </div>
  );
}
