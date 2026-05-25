import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Download, 
  HelpCircle, 
  FileCode, 
  Globe, 
  Award, 
  Sparkles, 
  Flame, 
  Snowflake, 
  Compass, 
  Shield, 
  Wind, 
  RotateCcw,
  Volume2,
  VolumeX,
  Database,
  Sliders,
  Terminal,
  Layers,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GODS_PANTHEON, God } from '../engine/gods_data';
import { AudioEngine } from '../engine/audio';

interface SaveSlotInfo {
  exists: boolean;
  name: string;
  timestamp: string;
  population: number;
  divineLevel: number;
  weather: string;
  devotion: number;
}

interface StartMenuOverlayProps {
  saveSlots: Record<number, SaveSlotInfo | null>;
  onLoadGame: (slot: number) => void;
  onResume: () => void;
  onImport: () => void;
  onLaunchNewGame?: (config: {
    temperature: number;
    humidity: number;
    startingDevotion: number;
    deityId: string;
  }) => void;
}

export function StartMenuOverlay({ 
  saveSlots, 
  onLoadGame, 
  onResume, 
  onImport,
  onLaunchNewGame
}: StartMenuOverlayProps) {
  
  const [activeTab, setActiveTab] = useState<'hub' | 'genesis' | 'timelines' | 'codex' | 'import'>('hub');
  const [soundEnabled, setSoundEnabled] = useState(AudioEngine.isEnabled());

  // Calibration settings state values (Planetary generation parameters)
  const [selectedClimate, setSelectedClimate] = useState<'temperate' | 'scorched' | 'tundra' | 'swamp'>('temperate');
  const [devotionTier, setDevotionTier] = useState<'acolyte' | 'scholar' | 'sovereign'>('scholar');
  const [selectedDeityId, setSelectedDeityId] = useState<string>('sylphra');

  // Space particles effect canvas for background drift
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const stars: { x: number; y: number; size: number; alpha: number; speed: number; angle: number }[] = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.3 + 0.05,
        angle: Math.random() * Math.PI * 2
      });
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(2, 4, 12, 0.45)';
      ctx.fillRect(0, 0, width, height);

      // Star drift
      for (const s of stars) {
        s.y += Math.sin(s.angle) * s.speed;
        s.x += Math.cos(s.angle) * s.speed;
        
        // Boundaries reset
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        // Pulsing light
        s.alpha += (Math.random() * 0.1 - 0.05);
        if (s.alpha < 0.1) s.alpha = 0.1;
        if (s.alpha > 0.95) s.alpha = 0.95;

        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw random ambient neon rings
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, 300, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const menuHoverSound = () => AudioEngine.playHover();
  const selectConfirmSound = () => AudioEngine.playClick();
  const modeSwitchSound = () => AudioEngine.playHover();
  const deleteSound = () => AudioEngine.playAlert();

  // Calculate customized parameters based on selectors
  const getSelectedClimateConfig = () => {
    switch (selectedClimate) {
      case 'scorched':
        return { name: 'Scorched Sandstone Dune', temp: 39, hum: 9, maxVegMultiplier: 0.45, icon: <Flame className="w-5 h-5 text-amber-400" /> };
      case 'tundra':
        return { name: 'Frozen Sub-Zero Glacier', temp: 3, hum: 68, maxVegMultiplier: 0.6, icon: <Snowflake className="w-5 h-5 text-sky-400" /> };
      case 'swamp':
        return { name: 'Sultry Monsoon Reservoir', temp: 29, hum: 91, maxVegMultiplier: 0.95, icon: <Wind className="w-5 h-5 text-teal-400" /> };
      case 'temperate':
      default:
        return { name: 'Balanced Silvan Basin', temp: 22, hum: 45, maxVegMultiplier: 1.0, icon: <Compass className="w-5 h-5 text-emerald-400" /> };
    }
  };

  const getDevotionTierConfig = () => {
    switch (devotionTier) {
      case 'acolyte':
        return { name: 'Devout Acolytes', multiplier: 'Easy', startDevotion: 250 };
      case 'sovereign':
        return { name: 'Heretic Herds', multiplier: 'Hard Core', startDevotion: 50 };
      case 'scholar':
      default:
        return { name: 'Seeking Philosophers', multiplier: 'Standard', startDevotion: 100 };
    }
  };

  const handleLaunchCustomCampaign = () => {
    selectConfirmSound();
    const clim = getSelectedClimateConfig();
    const dev = getDevotionTierConfig();
    
    if (onLaunchNewGame) {
      onLaunchNewGame({
        temperature: clim.temp,
        humidity: clim.hum,
        startingDevotion: dev.startDevotion,
        deityId: selectedDeityId
      });
    } else {
      onResume();
    }
  };

  const activeClimateDetails = getSelectedClimateConfig();
  const activeDevotionDetails = getDevotionTierConfig();
  
  // Dynamic glow color matching the active deity selection
  const selectedDeity = GODS_PANTHEON.find(g => g.id === selectedDeityId);
  const activeColor = selectedDeity?.colorHex || '#6366f1';

  return (
    <div 
      id="cosmogenesis-arcadle-overlay"
      className="absolute inset-0 z-[120] flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden text-slate-100 select-none bg-[#02040c]"
    >
      {/* Background Star drifting canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Cyber Screen Scanline Simulation Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[length:100%_4px,_6px_100%] z-[130]" />

      {/* Extreme Neon subtle borders and framing for arcade machine feel */}
      <div 
        className="absolute top-6 left-6 right-6 bottom-6 pointer-events-none border rounded-3xl z-[125] transition-colors duration-1000" 
        style={{ borderColor: `${activeColor}15` }}
      />
      <div className="absolute top-10 left-10 pointer-events-none font-mono text-[9px] text-slate-500 tracking-widest hidden lg:block z-[125]">
        SYSTEM MATRIX ID: CORE_6902
      </div>
      <div className="absolute top-10 right-10 pointer-events-none flex items-center gap-3 font-mono text-[9px] text-slate-500 tracking-widest hidden lg:block z-[125]">
        <span>CHRONOMETER STABILIZER: OK</span>
        <span>|</span>
        <span>LAT: LOCALSTORAGE_DRIVE</span>
      </div>

      {/* Dynamic Sound Action Switcher */}
      <div className="absolute bottom-10 left-10 z-[140] pointer-events-auto">
        <button
          onMouseEnter={menuHoverSound}
          onClick={() => {
            const nextSoundState = !soundEnabled;
            setSoundEnabled(nextSoundState);
            AudioEngine.setEnabled(nextSoundState);
            AudioEngine.playClick();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-white transition-all text-xs font-mono cursor-pointer backdrop-blur-md"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>FEEDBACK SOUNDS: ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              <span>FEEDBACK SOUNDS: OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Main Console Container Grid */}
      <motion.div 
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="relative w-full max-w-5xl bg-slate-950/75 border rounded-3xl overflow-hidden shadow-[0_35px_80px_rgba(0,0,0,0.95)] backdrop-blur-md flex flex-col md:flex-row min-h-[500px] max-h-[85vh] z-[135] transition-all duration-1000 ease-out"
        style={{ 
          borderColor: `${activeColor}33`,
          boxShadow: `0 35px 80px rgba(0, 0, 0, 0.95), 0 0 50px ${activeColor}15`
        }}
      >
        
        {/* SIDE BAR CONTROL RAIL & ART BRAND - 1/3 COLUMN */}
        <div className="md:w-1/3 bg-slate-950/90 border-b md:border-b-0 md:border-r border-indigo-500/20 p-8 flex flex-col justify-between select-none">
          
          {/* Logo & Subtitles */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] cursor-pointer"
                onClick={() => {}}
              >
                <Database className="w-5 h-5 text-indigo-100 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-mono font-black text-indigo-400 tracking-[0.25em] block uppercase leading-none">FAITH ENGINE</span>
                <span className="text-[12px] font-bold text-white tracking-tight">COSMOGENESIS v2</span>
              </div>
            </div>

            {/* Glowing Retro Title Card */}
            <div className="space-y-1 pt-4 relative">
              <div className="absolute -top-1 -left-2 text-[8px] font-mono text-indigo-400/40 tracking-normal">GENESIS MODULE LIVE</div>
              <h1 className="text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-indigo-400 select-none">
                FAITHFUL
              </h1>
              <p className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest font-black">
                Atmospheric God Simulator
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-light mt-4">
              Shape temperature biases, trigger lightning bolts, harvest Divine Bio-Bananas, dictates tribal parameters, and ascent your deity alignment to unlock planetary illumination nodes.
            </p>
          </div>

          {/* Interactive Navigation Control Column (Game Menu options) */}
          <div className="space-y-1.5 py-6">
            <div className="text-[9px] font-mono text-slate-500 font-bold tracking-wider uppercase mb-1">PROGRAM FUNCTIONS</div>
            
            <button
              onMouseEnter={menuHoverSound}
              onClick={() => { modeSwitchSound(); setActiveTab('hub'); }}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-mono font-semibold transition-all flex items-center gap-3 border cursor-pointer ${
                activeTab === 'hub'
                ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-300 shadow-[inset_0_1px_10px_rgba(99,102,241,0.2)]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'hub' ? 'bg-indigo-400 animate-ping' : 'bg-slate-600'}`} />
              [01] SECTOR COMMAND HUB
            </button>

            <button
              onMouseEnter={menuHoverSound}
              onClick={() => { modeSwitchSound(); setActiveTab('genesis'); }}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-mono font-semibold transition-all flex items-center gap-3 border cursor-pointer ${
                activeTab === 'genesis'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-[inset_0_1px_10px_rgba(245,158,11,0.15)]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'genesis' ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
              [02] CALIBRATE COGNITION
            </button>

            <button
              onMouseEnter={menuHoverSound}
              onClick={() => { modeSwitchSound(); setActiveTab('timelines'); }}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-mono font-semibold transition-all flex items-center gap-3 border cursor-pointer ${
                activeTab === 'timelines'
                ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-300 shadow-[inset_0_1px_10px_rgba(99,102,241,0.2)]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'timelines' ? 'bg-indigo-400 animate-ping' : 'bg-slate-600'}`} />
              [03] MEMORY CHRONOLOGY
            </button>

            <button
              onMouseEnter={menuHoverSound}
              onClick={() => { modeSwitchSound(); setActiveTab('codex'); }}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-mono font-semibold transition-all flex items-center gap-3 border cursor-pointer ${
                activeTab === 'codex'
                ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-300 shadow-[inset_0_1px_10px_rgba(99,102,241,0.2)]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'codex' ? 'bg-indigo-400 animate-ping' : 'bg-slate-600'}`} />
              [04] SACRED SCROLL CODEX
            </button>
          </div>

          {/* Underfooter credentials */}
          <div className="text-[10px] font-mono text-slate-600 space-y-1 block hidden sm:block">
            <div>PERSISTENCE REGISTRY: SECURE</div>
            <div>STATUS: STANDBY GRID ACTIVE</div>
            <div>© CREATIVE BIOSPHERE PLATFORM</div>
          </div>

        </div>

        {/* RIGHT DISPLAY VIEWPORTS - 2/3 COLUMN */}
        <div className="flex-1 display-panel bg-slate-900/40 p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh]">
          
          <AnimatePresence mode="wait">

            {/* TAB 1: MAIN LAUNCH HUB CONTROLLER */}
            {activeTab === 'hub' && (
              <motion.div
                key="tab-hub"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">GRID LEVEL MATRIX</span>
                    <h2 className="text-xl font-bold text-white tracking-tight">Operational Command Center</h2>
                    <p className="text-xs text-slate-400 font-light leading-snug">Synchronize simulation vectors or load archived temporal matrices stored directly in client browser partitions.</p>
                  </div>

                  {/* Main Action Large Grid Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    
                    {/* Standard Resume Resume */}
                    <button
                      onMouseEnter={menuHoverSound}
                      onClick={() => { selectConfirmSound(); onResume(); }}
                      className="group p-5 bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/25 hover:to-teal-600/25 border border-emerald-500/25 hover:border-emerald-400/50 rounded-2xl text-left transition-all duration-300 cursor-pointer pointer-events-auto shadow-[0_4px_20px_rgba(16,185,129,0.05)]"
                    >
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                        <Play className="w-5 h-5 fill-current" />
                      </div>
                      <h3 className="text-sm font-bold text-emerald-300 tracking-tight flex items-center gap-1.5 uppercase font-mono">
                        Launch Biosphere
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-2 font-light leading-relaxed">
                        Immediately materialize inside the running sector. Authorize rainfall triggers, direct hunter task forces, and harvest resources.
                      </p>
                    </button>

                    {/* Go to World Generator Wizard */}
                    <button
                      onMouseEnter={menuHoverSound}
                      onClick={() => { selectConfirmSound(); setActiveTab('genesis'); }}
                      className="group p-5 bg-gradient-to-tr from-amber-600/15 to-orange-600/15 hover:from-amber-600/20 hover:to-orange-600/20 border border-amber-500/25 hover:border-amber-400/50 rounded-2xl text-left transition-all duration-300 cursor-pointer pointer-events-auto"
                    >
                      <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-amber-300 tracking-tight flex items-center gap-1.5 uppercase font-mono">
                        Calibrate Universe
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-2 font-light leading-relaxed">
                        Initiate complete world-seeding protocols. Customize temperature biases, starting devotion level multipliers, and select deities before entry.
                      </p>
                    </button>

                    {/* Timeline backups */}
                    <button
                      onMouseEnter={menuHoverSound}
                      onClick={() => { selectConfirmSound(); setActiveTab('timelines'); }}
                      className="group p-5 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-white/15 rounded-2xl text-left transition-all duration-300 cursor-pointer pointer-events-auto"
                    >
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                        <Download className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-indigo-300 tracking-style flex items-center gap-1.5 uppercase font-mono">
                        Memory Chronology
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-2 font-light leading-relaxed">
                        Sync with state databanks. Restore recorded timeline matrices or clear unneeded convergence history files.
                      </p>
                    </button>

                    {/* JSON Quantum string */}
                    <button
                      onMouseEnter={menuHoverSound}
                      onClick={() => { selectConfirmSound(); onImport(); }}
                      className="group p-5 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-white/15 rounded-2xl text-left transition-all duration-300 cursor-pointer pointer-events-auto"
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-800/20 border border-white/10 flex items-center justify-center text-slate-300 mb-4 group-hover:scale-105 transition-transform">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-300 tracking-tight flex items-center gap-1.5 uppercase font-mono">
                        Quantum Data Portal
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 font-light leading-relaxed">
                    Directly paste deep space matrix files or JSON states to materialize customized outer core sectors instantly.
                  </p>
                </button>

                  </div>
                </div>

                {/* Ambient dynamic system activity tick logs mock line */}
                <div className="p-3 bg-slate-950/80 border border-indigo-500/15 rounded-xl flex items-center justify-between text-[10px] font-mono mt-6">
                  <span className="text-slate-500 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-indigo-400" /> SYSTEM HEARTBEAT: STABLE</span>
                  <span className="text-indigo-400/80 animate-pulse font-bold">READY TO COMMENCE</span>
                </div>
              </motion.div>
            )}

            {/* TAB 2: CALIBRATE COGNITION (PLANETARY GENERATOR WIZARD) */}
            {activeTab === 'genesis' && (
              <motion.div
                key="tab-genesis"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5 flex-1 overflow-y-auto pr-1 select-text pointer-events-auto"
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-bold block">PLANETARY CONVERGENCE CONSOLE</span>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-400 animate-pulse" />
                    Genesis Environmental Calibration
                  </h2>
                  <p className="text-xs text-slate-400 font-light">Fine-tune thermodynamic coefficients, initialize initial worship devotion buffers, and select a deity to guide human souls.</p>
                </div>

                {/* Wizard parameters selectors */}
                <div className="space-y-4 pt-3 border-t border-white/5">
                  
                  {/* Option Block A: Climate System Preset */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">A. Environmental Thermodynamic Profile</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {[
                        { id: 'temperate', name: 'Continental Silvan', desc: 'Balanced (22°C/45%)', icon: <Compass className="w-4 h-4 text-emerald-400" /> },
                        { id: 'scorched', name: 'Scorched Desert', desc: 'Arid Heat (39°C/9%)', icon: <Flame className="w-4 h-4 text-amber-400" /> },
                        { id: 'tundra', name: 'Glacial Tundra', desc: 'Sube-zero (3°C/68%)', icon: <Snowflake className="w-4 h-4 text-sky-400" /> },
                        { id: 'swamp', name: 'Sultry Swamps', desc: 'Monsoons (29°C/91%)', icon: <Wind className="w-4 h-4 text-teal-400" /> }
                      ].map(item => (
                        <button
                          key={item.id}
                          onMouseEnter={menuHoverSound}
                          onClick={() => { modeSwitchSound(); setSelectedClimate(item.id as any); }}
                          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                            selectedClimate === item.id
                            ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-[0_4px_12px_rgba(245,158,11,0.1)]'
                            : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            {item.icon}
                            {selectedClimate === item.id && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold mt-2 truncate text-slate-100">{item.name}</div>
                            <div className="text-[9px] font-mono text-slate-400 mt-0.5">{item.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option Block B: Difficulty Starting Devotion */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">B. Initial Devotional Devoutness Catalyst</label>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      {[
                        { id: 'acolyte', label: 'Spiritual Acolytes', bonus: '250 starting devotion points, fast progress', text: 'Spoken' },
                        { id: 'scholar', label: 'Seeking Scholars', bonus: '100 starting devotion points, moderate path', text: 'Classic' },
                        { id: 'sovereign', label: 'Heretic Herds', bonus: '50 devotion points, dry skies, high resistance', text: 'Survival' }
                      ].map(item => (
                        <button
                          key={item.id}
                          onMouseEnter={menuHoverSound}
                          onClick={() => { modeSwitchSound(); setDevotionTier(item.id as any); }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            devotionTier === item.id
                            ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 shadow-md'
                            : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between text-slate-200">
                            <span>{item.label}</span>
                            {devotionTier === item.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1 font-sans font-light leading-snug">{item.bonus}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option Block C: Choose Starter Deity */}
                  <div className="space-y-2 pb-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">C. Prime Deity Affinity</label>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar">
                      {GODS_PANTHEON.map(god => (
                        <button
                          key={god.id}
                          onMouseEnter={menuHoverSound}
                          onClick={() => { modeSwitchSound(); setSelectedDeityId(god.id); }}
                          className={`w-full p-2.5 rounded-xl border transition-all text-left flex items-start justify-between cursor-pointer ${
                            selectedDeityId === god.id
                            ? 'bg-gradient-to-r from-indigo-950/20 to-transparent border-indigo-500 text-slate-100'
                            : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span 
                                className="h-5 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-black tracking-widest flex items-center border"
                                style={{ backgroundColor: `${god.colorHex}20`, borderColor: god.colorHex, color: god.colorHex }}
                              >
                                {god.element}
                              </span>
                              <h4 className="text-xs font-bold text-slate-100">{god.name} — <span className="font-light text-[11px] text-slate-400">{god.title}</span></h4>
                            </div>
                            <p className="text-[10px] text-slate-400 font-light pr-8 leading-snug truncate lg:max-w-xl">{god.boostsDesc}</p>
                          </div>
                          {selectedDeityId === god.id && (
                            <span className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-400 font-bold shrink-0 text-xs">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Form Launch Button Trigger */}
                <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="text-[11px] font-mono text-slate-400 leading-snug">
                    Deploying profile: <strong className="text-amber-400">{activeClimateDetails.name}</strong>, with starting devotion set at <strong className="text-indigo-400">{activeDevotionDetails.startDevotion} Δ</strong>.
                  </div>
                  <button
                    onClick={handleLaunchCustomCampaign}
                    className="py-3 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 hover:scale-[1.02] transform-all font-bold tracking-tight rounded-xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(245,158,11,0.25)] transition-all"
                  >
                    <Sparkles className="w-4 h-4 animate-spin animate-duration-5000" />
                    Materialize Seeding Matrix
                  </button>
                </div>

              </motion.div>
            )}

            {/* TAB 3: RESTORE MEMORY CHRONOLOGY (SAVE SLOTS OVERVIEW) */}
            {activeTab === 'timelines' && (
              <motion.div
                key="tab-timelines"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 flex-1 overflow-y-auto pr-1 pointer-events-auto select-text"
              >
                <div className="flex justify-between items-center pb-2 border-b border-indigo-500/10">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">TIMELINES DATABASE</span>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Download className="w-5 h-5 text-indigo-400 animate-pulse" />
                      Restore Chronology Segments
                    </h2>
                    <p className="text-xs text-slate-400 font-light">Restore previously saved cosmic coordinate configurations directly into your active viewing deck.</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {[1, 2, 3].map(slot => {
                    const save = saveSlots[slot];
                    return (
                      <div 
                        key={slot}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-all duration-300 ${
                          save 
                          ? 'border-indigo-500/35 bg-indigo-950/25 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.02)]' 
                          : 'border-white/5 bg-slate-900/30'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase leading-none">
                              Slot {slot}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{save ? save.timestamp : 'Archive empty'}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white tracking-tight">
                            {save ? save.name : 'Standby Core Allocation Slot'}
                          </h4>
                          
                          {save && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-mono text-slate-400 mt-1">
                              <span className="flex items-center gap-1">👥 Hunters & Tribes: <strong className="text-sky-300">{save.population}</strong></span>
                              <span className="flex items-center gap-1">🏆 Divine Tier: <strong className="text-emerald-300">{save.divineLevel}</strong></span>
                              <span className="flex items-center gap-1">⚡ Devotion: <strong className="text-purple-300">{save.devotion} Δ</strong></span>
                              <span className="text-amber-300/90 block">Climate weather: {save.weather}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrinks-0 justify-end pt-2 sm:pt-0">
                          {save ? (
                            <button
                              onMouseEnter={menuHoverSound}
                              onClick={() => { selectConfirmSound(); onLoadGame(slot); }}
                              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-[0_3px_10px_rgba(99,102,241,0.2)] hover:scale-[1.02]"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Materialize Sector
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono italic text-slate-500 mr-2">Initiate simulation to write save data here</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 bg-slate-950/60 border border-white/5 rounded-xl flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <p className="text-[11px] text-slate-400 leading-snug">To write a simulation coordinate block, launch the game, select the Settings button on the left panel menu, and assign a slot to write the spacetime coordinates.</p>
                </div>
              </motion.div>
            )}

            {/* TAB 4: SACRED SCROLL CODEX ARCHIVE */}
            {activeTab === 'codex' && (
              <motion.div
                key="tab-codex"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 flex-1 overflow-y-auto pr-1 select-text pointer-events-auto"
              >
                <div className="border-b border-indigo-500/10 pb-2">
                  <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">SACRED SCROLL ARCHIVES</span>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-400" />
                    Cosmo-Physics Scroll Codex
                  </h2>
                  <p className="text-xs text-slate-400 font-light">Examine the underlying thermodynamic rules, societal castes, and lightning-bolt properties governing Faith.</p>
                </div>

                {/* Lore descriptions scroll list */}
                <div className="space-y-4 text-xs font-light text-slate-300 leading-relaxed pr-2 max-h-[46vh] overflow-y-auto custom-scrollbar">
                  
                  <div className="space-y-2 p-3.5 bg-slate-900/50 border border-white/5 rounded-2xl">
                    <h4 className="font-bold text-white tracking-tight flex items-center gap-2 uppercase font-mono text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      1. Continuous Thermodynamic Fields
                    </h4>
                    <p>
                      Every sector on the 64x64 coordinate map contains discrete temperature (°C) and soil humidity (%) attributes. Vegetation, banana trees, and crops multiply rapidly under warm, humid coordinates. Extreme droughts parch soils, causing plants to undergo decay, and wildlife to migrate away. Rainy seasons recharge humidity arrays dynamically.
                    </p>
                  </div>

                  <div className="space-y-2 p-3.5 bg-slate-900/50 border border-white/5 rounded-2xl">
                    <h4 className="font-bold text-white tracking-tight flex items-center gap-2 uppercase font-mono text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      2. Tribals, Hunters, & Devout Acolytes
                    </h4>
                    <p>
                      Mortal tribes thrive by dividing labor percentages. <strong>Gatherers</strong> bring in wild grain crops. <strong>Hunters</strong> chase dynamic stags to secure dense hide resources. <strong>Scholars</strong> develop structures and altar monuments. <strong>Acolytes</strong> meditate around sacred altars to accumulate Divine Devotion (Δ). Balance labor carefully; high worker fatigue declines tribal happiness!
                    </p>
                  </div>

                  <div className="space-y-2 p-3.5 bg-slate-900/50 border border-white/5 rounded-2xl">
                    <h4 className="font-bold text-white tracking-tight flex items-center gap-2 uppercase font-mono text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                      3. Interventions, Miracles, & Lightning Spikes
                    </h4>
                    <p>
                      Use accumulated Divine Devotion (Δ) to call powerful physical events: Holy Rain to quench scorched regions, ablaze devastating Meteors to incinerate obstacles, or Spatial Rifts to swap physical coordinate points. Elevating Deity Levels awards you <strong>Sparks of Illumination</strong>, which can unlock incredible passives to shield your mortal tribes from tempest weather anomalies.
                    </p>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* QUICK START / CANCEL BUTTON CONTROLS - FOOTER LAYER */}
          <div className="mt-6 border-t border-white/10 pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between font-mono text-[10px] text-slate-500 select-none">
            <span className="flex items-center gap-1">GRID INITIALIZATION CHRONOS LAYER: PASSIVE</span>
            {activeTab !== 'hub' && (
              <button 
                onMouseEnter={menuHoverSound}
                onClick={() => { modeSwitchSound(); setActiveTab('hub'); }}
                className="text-indigo-400 hover:text-indigo-300 font-mono tracking-tight font-black uppercase flex items-center gap-1 cursor-pointer"
              >
                ← BACK TO CORE INTERFACES
              </button>
            )}
            {activeTab === 'hub' && (
              <button 
                onMouseEnter={menuHoverSound}
                onClick={() => { selectConfirmSound(); onResume(); }}
                className="px-4 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-350 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                CLOSE UTILITY LAUNCHER [ESC]
              </button>
            )}
          </div>

        </div>

      </motion.div>
    </div>
  );
}
