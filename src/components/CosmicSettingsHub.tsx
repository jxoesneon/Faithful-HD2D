import React from 'react';
import { 
  Settings, 
  Sliders, 
  HelpCircle, 
  Play, 
  Trash2, 
  Download, 
  Share, 
  RefreshCw,
  Eye,
  Activity,
  Award,
  Globe,
  FileCode,
  Check
} from 'lucide-react';
import { AudioEngine } from '../engine/audio';
import { motion } from 'motion/react';
import { useDevice } from './AdaptiveUI';

interface GameSystemSettings {
  gameSpeed: number;
  weatherChaos: 'mild' | 'standard' | 'extreme';
  visualTheme: 'standard' | 'cyberpunk' | 'monochrome' | 'amber' | 'sepia';
  soundTicker: boolean;
  showGridLines: boolean;
  tooltipAssist: boolean;
  bloomEnable: boolean;
  bloomIntensity: number;
  dofEnable: boolean;
  dofBlur: number;
  colorGrading: 'none' | 'vibrant' | 'cold' | 'cinematic' | 'warm' | 'matrix' | 'neon';
  chromaticAberrationEnable: boolean;
  chromaticAberrationOffset: number;
  lensFlareEnable: boolean;
  lensDirtAlpha: number;
  vignetteEnable: boolean;
  vignetteIntensity: number;
  sunDirX: number;
  sunDirY: number;
  godRayIntensity: number;
  ambientLevel: number;
  batterySaver: boolean;
}

interface SaveSlotInfo {
  exists: boolean;
  name: string;
  timestamp: string;
  population: number;
  divineLevel: number;
  weather: string;
  devotion: number;
}

interface CosmicSettingsHubProps {
  settings: GameSystemSettings;
  updateSetting: (key: keyof GameSystemSettings, value: any) => void;
  saveSlots: Record<number, SaveSlotInfo | null>;
  onSaveGame: (slot: number) => void;
  onLoadGame: (slot: number) => void;
  onDeleteGameSave: (slot: number) => void;
  onHardReset: () => void;
  onExport: () => void;
  onImport: () => void;
  onClose: () => void;
}

export function CosmicSettingsHub({
  settings,
  updateSetting,
  saveSlots,
  onSaveGame,
  onLoadGame,
  onDeleteGameSave,
  onHardReset,
  onExport,
  onImport,
  onClose
}: CosmicSettingsHubProps) {
  const { isMobile, isLandscape } = useDevice();

  const triggerChange = (key: keyof GameSystemSettings, value: any) => {
    AudioEngine.playClick();
    updateSetting(key, value);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 25 }}
      className={`w-full max-w-5xl bg-slate-950/75 backdrop-blur-md border border-white/10 rounded-3xl ${isMobile ? 'p-5' : 'p-8'} shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh] text-white select-none`}
    >
      
      {/* Header Bar */}
      <div className={`flex justify-between items-center ${isMobile ? 'mb-4' : 'mb-6'} border-b border-white/10 pb-4 shrink-0 pointer-events-auto`}>
        <div className="flex flex-col">
          <span className="text-amber-500 font-mono text-[9px] uppercase tracking-widest block font-bold">L3 CONFIGURATION ARCHIVE</span>
          <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight capitalize flex items-center gap-3 text-white font-sans`}>
            <Settings className={`text-amber-400 ${isMobile ? 'w-5 h-5' : 'w-7 h-7'} animate-spin animate-duration-10000`} />
            {!isMobile ? 'System Settings & Calibration' : 'Calibration'}
          </h3>
        </div>
        <button 
          onMouseEnter={() => AudioEngine.playHover()}
          onClick={() => {
            AudioEngine.playClick();
            onClose();
          }} 
          className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer text-lg"
        >
          ✕
        </button>
      </div>

      {/* Main Panel Content */}
      <div className={`overflow-y-auto flex-1 pr-1.5 grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-12'} gap-6 custom-scrollbar select-text pointer-events-auto`}>
        
        {/* Left Column: Realtime Tuning parameters */}
        <div className={`${isMobile ? '' : 'md:col-span-6'} space-y-6`}>
          
          {/* Section 1: Chronos Temporal Engine (Game Speed) */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-amber-500 uppercase tracking-wider font-semibold">Chronometer Frequency</span>
              <span className="text-[10px] font-mono text-slate-400">Simulation Speed</span>
            </div>
            
            <div className="grid grid-cols-5 gap-1 text-[10px] font-mono font-bold">
              {[
                { label: 'Pause', val: 0.0 },
                { label: '0.5x', val: 0.5 },
                { label: '1.0x', val: 1.0 },
                { label: '2.0x', val: 2.0 },
                { label: '4.0x', val: 4.0 }
              ].map(item => (
                <button
                  key={item.label}
                  onMouseEnter={() => AudioEngine.playHover()}
                  onClick={() => triggerChange('gameSpeed', item.val)}
                  className={`py-2 rounded-lg border transition-all text-center cursor-pointer ${
                    settings.gameSpeed === item.val
                    ? 'bg-amber-600 border-amber-500 text-white shadow-[0_3px_8px_rgba(245,158,11,0.25)]'
                    : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-light leading-snug">Speed acceleration directly modifies environmental updates, crop growths, and tribal pathfinders velocity without compromising coordinate precision physics.</p>
          </div>

          {/* Section 2: Visual Filters (Color Grading) */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3.5">
            <div>
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider font-semibold block">Visual Post-Filter Layers</span>
              <p className="text-[9px] text-slate-400 leading-none mt-1">Direct layout color grading filters applied live to the Pixi dynamic core.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] font-mono">
              {[
                { name: 'Standard Slate', id: 'standard' },
                { name: 'Cyberpunk Neon', id: 'cyberpunk' },
                { name: 'Retro Monochrome', id: 'monochrome' },
                { name: 'Radioactive Amber', id: 'amber' },
                { name: 'Vintage Sepia', id: 'sepia' }
              ].map(t => (
                <button
                  key={t.id}
                  onMouseEnter={() => AudioEngine.playHover()}
                  onClick={() => triggerChange('visualTheme', t.id as any)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    settings.visualTheme === t.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <span>{t.name}</span>
                  {settings.visualTheme === t.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Extra Toggles */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
            <span className="text-xs font-mono text-purple-400 uppercase tracking-wider font-semibold block">Atmospheric Subsystems</span>
            
            <div className="space-y-2.5 text-xs text-slate-300">
              
              {/* Show Coordinates gridlines */}
              <div className="flex justify-between items-center py-1">
                <div className="flex flex-col leading-snug">
                  <span className="font-semibold text-white">Grid Coordinates Overlay</span>
                  <span className="text-[9px] text-slate-500 font-mono">Projects background grid align vectors</span>
                </div>
                <button 
                  onMouseEnter={() => AudioEngine.playHover()}
                  onClick={() => triggerChange('showGridLines', !settings.showGridLines)}
                  className={`w-11 h-6 rounded-full p-1 transition-all duration-300 pointer-events-auto cursor-pointer flex items-center ${settings.showGridLines ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md transition-all" />
                </button>
              </div>

              {/* Weather intensity coefficient */}
              <div className="flex justify-between items-center py-1">
                <div className="flex flex-col leading-snug">
                  <span className="font-semibold text-white">Weather Disaster Coefficient</span>
                  <span className="text-[9px] text-slate-500 font-mono">Governs catastrophic tempest spikes</span>
                </div>
                <div className="flex gap-1 text-[10px] font-mono">
                  {['mild', 'standard', 'extreme'].map(level => (
                    <button
                      key={level}
                      onMouseEnter={() => AudioEngine.playHover()}
                      onClick={() => triggerChange('weatherChaos', level as any)}
                      className={`px-2.5 py-1 rounded border capitalize ${
                        settings.weatherChaos === level
                        ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                        : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticking alerts */}
              <div className="flex justify-between items-center py-1">
                <div className="flex flex-col leading-snug">
                  <span className="font-semibold text-white">Visual Ticking Signals</span>
                  <span className="text-[9px] text-slate-500 font-mono">Flashes cosmic alignment gauges on heartbeat shifts</span>
                </div>
                <button 
                  onMouseEnter={() => AudioEngine.playHover()}
                  onClick={() => triggerChange('soundTicker', !settings.soundTicker)}
                  className={`w-11 h-6 rounded-full p-1 transition-all duration-300 pointer-events-auto cursor-pointer flex items-center ${settings.soundTicker ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md transition-all" />
                </button>
              </div>

              {/* Battery Saver Mode */}
              <div className="flex justify-between items-center py-1">
                <div className="flex flex-col leading-snug">
                  <span className="font-semibold text-amber-400">Battery-Saver Matrix</span>
                  <span className="text-[9px] text-slate-500 font-mono">Throttles simulation & bypasses high-spec G-Buffer passes</span>
                </div>
                <button 
                  onMouseEnter={() => AudioEngine.playHover()}
                  onClick={() => triggerChange('batterySaver', !settings.batterySaver)}
                  className={`w-11 h-6 rounded-full p-1 transition-all duration-300 pointer-events-auto cursor-pointer flex items-center ${settings.batterySaver ? 'bg-amber-600 justify-end' : 'bg-white/10 justify-start'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md transition-all" />
                </button>
              </div>

            </div>
          </div>

          {/* Section 4: Physical Camera & Lens Simulation Panel */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold block">📷 Physical Camera & Lens Simulation</span>
              <p className="text-[9px] text-slate-400 leading-none mt-1">Simulate optical camera structures, focus depth of field, and light bleeds.</p>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              {/* Color Grading LUT Mode Selection */}
              <div className="space-y-1.5 border-b border-white/5 pb-3">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Color Grading LUT Palette</span>
                  <span className="text-[9px] text-green-400 capitalize">{settings.colorGrading || 'standard'}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
                  {[
                    { label: 'None', val: 'none' },
                    { label: 'Vibrant', val: 'vibrant' },
                    { label: 'Cold LUT', val: 'cold' },
                    { label: 'Cinema', val: 'cinematic' },
                    { label: 'Warm', val: 'warm' },
                    { label: 'Matrix', val: 'matrix' },
                    { label: 'Neon Glow', val: 'neon' }
                  ].map(lut => (
                    <button
                      key={lut.val}
                      onMouseEnter={() => AudioEngine.playHover()}
                      onClick={() => triggerChange('colorGrading', lut.val as any)}
                      className={`py-1.5 rounded transition-all text-center cursor-pointer ${
                        settings.colorGrading === lut.val
                        ? 'bg-emerald-600/35 border border-emerald-500/50 text-emerald-250 font-bold'
                        : 'bg-white/5 border border-transparent text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {lut.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bloom Toggling and Intensity */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">1. Lens Bloom (Light Scattering)</span>
                    <span className="text-[9px] text-slate-500">Makes extreme neon light points bleed softly</span>
                  </div>
                  <button 
                    onMouseEnter={() => AudioEngine.playHover()}
                    onClick={() => triggerChange('bloomEnable', !settings.bloomEnable)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 cursor-pointer flex items-center ${settings.bloomEnable ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white shadow" />
                  </button>
                </div>
                {settings.bloomEnable && (
                  <div className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-white/5 border-box">
                    <span className="text-[9px] font-mono text-slate-400 shrink-0 w-24">Intensity: {settings.bloomIntensity}x</span>
                    <input 
                      type="range" 
                      min="0.2" 
                      max="3.0" 
                      step="0.1"
                      value={settings.bloomIntensity}
                      onChange={(e) => triggerChange('bloomIntensity', parseFloat(e.target.value))}
                      className="flex-1 accent-indigo-500 cursor-pointer h-1"
                    />
                  </div>
                )}
              </div>

              {/* Depth of Field Toggling and Blur */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">2. Tilt-Shift Depth of Field (DoF)</span>
                    <span className="text-[9px] text-slate-500">Blurs distant backgrounds and micro foregrounds</span>
                  </div>
                  <button 
                    onMouseEnter={() => AudioEngine.playHover()}
                    onClick={() => triggerChange('dofEnable', !settings.dofEnable)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 cursor-pointer flex items-center ${settings.dofEnable ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white shadow" />
                  </button>
                </div>
                {settings.dofEnable && (
                  <div className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] font-mono text-slate-400 shrink-0 w-24">Blur factor: {settings.dofBlur}px</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="12" 
                      step="1"
                      value={settings.dofBlur}
                      onChange={(e) => triggerChange('dofBlur', parseInt(e.target.value))}
                      className="flex-1 accent-indigo-500 cursor-pointer h-1"
                    />
                  </div>
                )}
              </div>

              {/* Chromatic Aberration Toggle and Offset */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">3. Chromatic Aberration (Lens Imperfection)</span>
                    <span className="text-[9px] text-slate-500">Separates Red/Blue wavelengths towards edges</span>
                  </div>
                  <button 
                    onMouseEnter={() => AudioEngine.playHover()}
                    onClick={() => triggerChange('chromaticAberrationEnable', !settings.chromaticAberrationEnable)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 cursor-pointer flex items-center ${settings.chromaticAberrationEnable ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white shadow" />
                  </button>
                </div>
                {settings.chromaticAberrationEnable && (
                  <div className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] font-mono text-slate-400 shrink-0 w-24">Shift offset: {settings.chromaticAberrationOffset}px</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="15" 
                      step="1"
                      value={settings.chromaticAberrationOffset}
                      onChange={(e) => triggerChange('chromaticAberrationOffset', parseInt(e.target.value))}
                      className="flex-1 accent-indigo-500 cursor-pointer h-1"
                    />
                  </div>
                )}
              </div>

              {/* Lens Flare and Screen Dirt */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">4. Screen Dirt & Dynamic Flare Glare</span>
                    <span className="text-[9px] text-slate-500">Renders light refraction spikes and visible glass smudges</span>
                  </div>
                  <button 
                    onMouseEnter={() => AudioEngine.playHover()}
                    onClick={() => triggerChange('lensFlareEnable', !settings.lensFlareEnable)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 pointer-events-auto cursor-pointer flex items-center ${settings.lensFlareEnable ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white shadow" />
                  </button>
                </div>
                {settings.lensFlareEnable && (
                  <div className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] font-mono text-slate-400 shrink-0 w-24">Glass Smudge: {Math.round(settings.lensDirtAlpha * 100)}%</span>
                    <input 
                      type="range" 
                      min="0.0" 
                      max="1.0" 
                      step="0.05"
                      value={settings.lensDirtAlpha}
                      onChange={(e) => triggerChange('lensDirtAlpha', parseFloat(e.target.value))}
                      className="flex-1 accent-indigo-500 cursor-pointer h-1"
                    />
                  </div>
                )}
              </div>

              {/* Vignette Toggle and Intensity */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">5. Outer Border Vignette</span>
                    <span className="text-[9px] text-slate-500">Darkens screen corners to focus gameplay vision</span>
                  </div>
                  <button 
                    onMouseEnter={() => AudioEngine.playHover()}
                    onClick={() => triggerChange('vignetteEnable', !settings.vignetteEnable)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 pointer-events-auto cursor-pointer flex items-center ${settings.vignetteEnable ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white shadow" />
                  </button>
                </div>
                {settings.vignetteEnable && (
                  <div className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] font-mono text-slate-400 shrink-0 w-24">Shadow Weight: {Math.round(settings.vignetteIntensity * 100)}%</span>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.05"
                      value={settings.vignetteIntensity}
                      onChange={(e) => triggerChange('vignetteIntensity', parseFloat(e.target.value))}
                      className="flex-1 accent-indigo-500 cursor-pointer h-1"
                    />
                  </div>
                )}
              </div>
              </div>
              </div>

              {/* Section 5: Visual Matrix & Atmospheric Calibration (HD-2D+) */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
              <div>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold block">✨ Visual Matrix & Atmospheric Calibration</span>
              <p className="text-[9px] text-slate-400 leading-none mt-1">Direct control over the deferred lighting pass and volumetric ray synthesis.</p>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
              {/* Sun Direction Controls */}
              <div className="space-y-2">
                <span className="font-semibold text-white block">1. Solar Directional Vectors (Sun Position)</span>
                <div className="grid grid-cols-2 gap-4 bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>Vector X</span>
                      <span>{settings.sunDirX.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="-2" max="2" step="0.01"
                      value={settings.sunDirX}
                      onChange={(e) => triggerChange('sunDirX', parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>Vector Y</span>
                      <span>{settings.sunDirY.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="-2" max="2" step="0.01"
                      value={settings.sunDirY}
                      onChange={(e) => triggerChange('sunDirY', parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1"
                    />
                  </div>
                </div>
              </div>

              {/* God Ray Intensity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">2. Volumetric God Ray Intensity</span>
                  <span className="text-[10px] font-mono text-amber-400">{Math.round(settings.godRayIntensity * 100)}%</span>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <input 
                    type="range" min="0" max="1" step="0.01"
                    value={settings.godRayIntensity}
                    onChange={(e) => triggerChange('godRayIntensity', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1"
                  />
                </div>
              </div>

              {/* Ambient Illumination */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">3. Ambient Global Sensation</span>
                  <span className="text-[10px] font-mono text-amber-400">{Math.round(settings.ambientLevel * 100)}%</span>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <input 
                    type="range" min="0" max="0.5" step="0.01"
                    value={settings.ambientLevel}
                    onChange={(e) => triggerChange('ambientLevel', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Right Column: Timelines Save/Load Matrix */}
        <div className={`${isMobile ? '' : 'md:col-span-6'} space-y-4`}>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold block">Chronite Storage Slots (Local Saves)</span>
          
          <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
            {[1, 2, 3].map(slot => {
              const save = saveSlots[slot];
              return (
                <div 
                  key={slot}
                  className={`p-3.5 rounded-xl border flex flex-col items-stretch gap-3 transition-colors ${
                    save 
                    ? 'border-indigo-500/20 bg-indigo-950/15'
                    : 'border-white/5 bg-slate-900/40'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 rounded">
                          SLOT {slot}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{save ? save.timestamp : 'Standby Chronogenesis Slot'}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white tracking-tight truncate">
                        {save ? save.name : 'Unassigned Archive Matrix'}
                      </h4>
                    </div>

                    {save && (
                      <button
                        onMouseEnter={() => AudioEngine.playHover()}
                        onClick={() => {
                          AudioEngine.playAlert();
                          onDeleteGameSave(slot);
                        }}
                        title="Delete Save slot data"
                        className="p-1.5 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-400 rounded-md text-red-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {save && (
                    <div className="grid grid-cols-3 gap-1.5 p-2 bg-black/45 border border-white/5 rounded-lg text-[9px] font-mono text-slate-400">
                      <div>Pop: <strong className="text-sky-300">{save.population}</strong></div>
                      <div>Lvl: <strong className="text-emerald-300">{save.divineLevel}</strong></div>
                      <div>Devotion: <strong className="text-amber-300">{save.devotion} Δ</strong></div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onMouseEnter={() => AudioEngine.playHover()}
                      onClick={() => {
                        AudioEngine.playClick();
                        onSaveGame(slot);
                      }}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-lg text-[10px] font-bold tracking-tight text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Share className="w-3 h-3 text-slate-400" />
                      Overwrite Slot
                    </button>

                    {save && (
                      <button
                        onMouseEnter={() => AudioEngine.playHover()}
                        onClick={() => {
                          AudioEngine.playClick();
                          onLoadGame(slot);
                        }}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-indigo-550/15"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Load Wave
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Backup portals (Custom import export strings) & hard resetting */}
          <div className="pt-4 border-t border-white/5 space-y-3.5">
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Dimension Porting Control (Export / Import)</span>
            
            <div className="flex items-center gap-2">
              <button 
                onMouseEnter={() => AudioEngine.playHover()}
                onClick={() => {
                  AudioEngine.playClick();
                  onExport();
                }}
                className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold transition-all border border-white/10 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share className="w-3.5 h-3.5" />
                Export State
              </button>
              <button 
                onMouseEnter={() => AudioEngine.playHover()}
                onClick={() => {
                  AudioEngine.playClick();
                  onImport();
                }}
                className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold transition-all border border-white/10 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                Import State
              </button>
            </div>

            {/* Hard Reset Button */}
            <button 
              onMouseEnter={() => AudioEngine.playHover()}
              onClick={() => {
                AudioEngine.playAlert();
                onHardReset();
              }}
              className="w-full py-2.5 bg-red-950/20 hover:bg-red-900 border border-red-800/25 hover:border-red-600 rounded-xl text-xs font-bold transition-all text-red-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin animate-duration-5000" />
              Reset Biosphere Node (Hard Clear)
            </button>
          </div>

        </div>

      </div>

      {/* Underfooter info overlay */}
      <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0 select-none">
        <span>Persistent Module: localstorage_indexed_vector_v1</span>
        <span>Space-Time Grid: 64x64 Nodes</span>
      </div>

    </motion.div>
  );
}
