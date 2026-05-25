import React, { useState, useEffect } from 'react';
import { Settings, Move, Maximize, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CoordinateDebuggerProps {
  onOffsetChange: (x: number, y: number, scale: number) => void;
  initialX?: number;
  initialY?: number;
  initialScale?: number;
}

export function CoordinateDebugger({ onOffsetChange, initialX = 0, initialY = 0, initialScale = 1.1 }: CoordinateDebuggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [offsetX, setOffsetX] = useState(initialX);
  const [offsetY, setOffsetY] = useState(initialY);
  const [scale, setScale] = useState(initialScale);

  useEffect(() => {
    onOffsetChange(offsetX, offsetY, scale);
  }, [offsetX, offsetY, scale]);

  return (
    <div className="fixed top-1/4 left-0 z-[9999] pointer-events-auto flex items-start">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-64 bg-slate-950/90 border-r border-y border-white/10 rounded-r-2xl p-4 shadow-2xl backdrop-blur-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Tactical Debugger</span>
              <button 
                onClick={() => { setOffsetX(0); setOffsetY(0); setScale(1.1); }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {/* X OFFSET */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500 flex items-center gap-1"><Move size={10} /> Offset X</span>
                <span className="text-amber-400">{offsetX}px</span>
              </div>
              <input 
                type="range" min="-128" max="128" step="1"
                value={offsetX}
                onChange={(e) => setOffsetX(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Y OFFSET */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500 flex items-center gap-1"><Move size={10} /> Offset Y</span>
                <span className="text-amber-400">{offsetY}px</span>
              </div>
              <input 
                type="range" min="-128" max="128" step="1"
                value={offsetY}
                onChange={(e) => setOffsetY(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* OVERLAP SCALE */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500 flex items-center gap-1"><Maximize size={10} /> Sprite Scale</span>
                <span className="text-sky-400">{scale.toFixed(2)}x</span>
              </div>
              <input 
                type="range" min="0.5" max="3.0" step="0.01"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <p className="text-[9px] text-slate-600 font-mono italic pt-2 border-t border-white/5">
              // Direct matrix injection. Changes apply instantly to GPU buffer.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-slate-900/80 border-y border-r border-white/10 rounded-r-xl flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-black transition-all shadow-lg backdrop-blur-md active:translate-y-[2px]"
        title="Coordinate Debugger"
      >
        {isOpen ? <X size={20} /> : <Settings size={20} />}
      </button>
    </div>
  );
}
