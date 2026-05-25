import React, { useState } from 'react';
import { 
  Settings, 
  Trash2, 
  Download, 
  Share, 
  RefreshCw,
  Check,
  ChevronDown,
  Zap,
  Camera,
  Layers,
  Clock,
  HardDrive,
} from 'lucide-react';
import { AudioEngine } from '../engine/audio';
import { motion, AnimatePresence } from 'motion/react';
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

function AccordionSection({
  id,
  title,
  subtitle,
  icon: Icon,
  iconColor,
  openId,
  setOpenId,
  children,
  badge,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  children: React.ReactNode;
  badge?: string;
}) {
  const isOpen = openId === id;
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10">
      <button
        onClick={() => { AudioEngine.playClick(); setOpenId(isOpen ? null : id); }}
        onMouseEnter={() => AudioEngine.playHover()}
        className="w-full flex items-center justify-between p-4 text-left group cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isOpen ? 'bg-white/10' : 'bg-white/[0.03]'} border border-white/5 transition-colors`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-white tracking-tight">{title}</span>
            <span className="text-[10px] text-slate-500 font-mono">{subtitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {badge}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`${id}-content`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-white/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToggleSwitch({
  value,
  onChange,
  color = 'bg-indigo-600',
}: {
  value: boolean;
  onChange: () => void;
  color?: string;
}) {
  return (
    <button
      onMouseEnter={() => AudioEngine.playHover()}
      onClick={onChange}
      className={`w-11 h-6 rounded-full p-1 transition-all duration-300 pointer-events-auto cursor-pointer flex items-center shrink-0 ${value ? `${color} justify-end` : 'bg-white/10 justify-start'}`}
    >
      <span className="w-4 h-4 rounded-full bg-white shadow-md transition-all" />
    </button>
  );
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

  const { isMobile } = useDevice();
  const [openSection, setOpenSection] = useState<string | null>('speed');

  const triggerChange = (key: keyof GameSystemSettings, value: any) => {
    AudioEngine.playClick();
    updateSetting(key, value);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 25 }}
      className="w-full max-w-5xl bg-slate-950/75 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] text-white select-none"
    >
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0 pointer-events-auto">
        <div className="flex flex-col">
          <span className="text-amber-500 font-mono text-[9px] uppercase tracking-widest block font-bold">L3 CONFIGURATION ARCHIVE</span>
          <h3 className="text-2xl font-bold tracking-tight capitalize flex items-center gap-3 text-white font-sans">
            <Settings className="text-amber-400 w-7 h-7" />
            System Settings & Calibration
          </h3>
        </div>
        <button 
          onMouseEnter={() => AudioEngine.playHover()}
          onClick={() => { AudioEngine.playClick(); onClose(); }}
          className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer text-lg"
        >
          ✕
        </button>
      </div>

      {/* 2-column grid of accordions */}
      <div className="overflow-y-auto flex-1 pr-1.5 custom-scrollbar pointer-events-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT: Game Config */}
        <div className="md:col-span-6 space-y-3">

          <AccordionSection
            id="speed"
            title="Chronometer Frequency"
            subtitle="Simulation speed multiplier"
            icon={Clock}
            iconColor="text-amber-400"
            openId={openSection}
            setOpenId={setOpenSection}
            badge={settings.gameSpeed === 0 ? 'PAUSED' : `${settings.gameSpeed}x`}
          >
            <div className="pt-3 space-y-3">
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
              <p className="text-[10px] text-slate-400 font-light leading-snug">
                Speed acceleration modifies environmental updates, crop growths, and tribal pathfinder velocity.
              </p>
            </div>
          </AccordionSection>

          <AccordionSection
            id="atmosphere"
            title="Atmospheric Subsystems"
            subtitle="Grid, weather coefficient & visual tickers"
            icon={Layers}
            iconColor="text-purple-400"
            openId={openSection}
            setOpenId={setOpenSection}
          >
            <div className="pt-3 space-y-2.5 text-xs text-slate-300">
              {[
                {
                  label: 'Grid Coordinates Overlay',
                  desc: 'Projects background grid align vectors',
                  key: 'showGridLines' as const,
                },
                {
                  label: 'Visual Ticking Signals',
                  desc: 'Flashes cosmic alignment gauges on heartbeat shifts',
                  key: 'soundTicker' as const,
                },
                {
                  label: 'Battery-Saver Matrix',
                  desc: 'Throttles simulation & bypasses high-spec G-Buffer passes',
                  key: 'batterySaver' as const,
                  color: 'bg-amber-600',
                },
              ].map(item => (
                <div key={item.key} className="flex justify-between items-center py-1">
                  <div className="flex flex-col leading-snug">
                    <span className="font-semibold text-white">{item.label}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{item.desc}</span>
                  </div>
                  <ToggleSwitch
                    value={settings[item.key] as boolean}
                    onChange={() => triggerChange(item.key, !settings[item.key])}
                    color={(item as any).color}
                  />
                </div>
              ))}
              <div className="flex justify-between items-center py-1 border-t border-white/5 pt-2">
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
                      className={`px-2.5 py-1 rounded border capitalize cursor-pointer transition-all ${
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
            </div>
          </AccordionSection>

          <AccordionSection
            id="theme"
            title="Visual Post-Filter Layers"
            subtitle="Color grading & theme presets"
            icon={Camera}
            iconColor="text-indigo-400"
            openId={openSection}
            setOpenId={setOpenSection}
            badge={settings.visualTheme !== 'standard' ? settings.visualTheme : undefined}
          >
            <div className="pt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] font-mono">
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
          </AccordionSection>

          <AccordionSection
            id="lens"
            title="Physical Lens Simulation"
            subtitle="Bloom, DoF, chromatic aberration, vignette"
            icon={Zap}
            iconColor="text-emerald-400"
            openId={openSection}
            setOpenId={setOpenSection}
          >
            <div className="pt-3 space-y-4">
              {[
                {
                  label: '1. Lens Bloom (Light Scattering)',
                  desc: 'Makes extreme neon light points bleed softly',
                  toggle: settings.bloomEnable,
                  onToggle: () => triggerChange('bloomEnable', !settings.bloomEnable),
                  slider: { label: 'Intensity', val: settings.bloomIntensity, key: 'bloomIntensity', min: 0.2, max: 3.0, step: 0.1 },
                },
                {
                  label: '2. Tilt-Shift Depth of Field',
                  desc: 'Blurs distant backgrounds and micro foregrounds',
                  toggle: settings.dofEnable,
                  onToggle: () => triggerChange('dofEnable', !settings.dofEnable),
                  slider: { label: 'Blur', val: settings.dofBlur, key: 'dofBlur', min: 1, max: 12, step: 1 },
                },
                {
                  label: '3. Chromatic Aberration',
                  desc: 'Separates Red/Blue wavelengths towards edges',
                  toggle: settings.chromaticAberrationEnable,
                  onToggle: () => triggerChange('chromaticAberrationEnable', !settings.chromaticAberrationEnable),
                  slider: { label: 'Shift', val: settings.chromaticAberrationOffset, key: 'chromaticAberrationOffset', min: 1, max: 15, step: 1 },
                },
                {
                  label: '4. Screen Dirt & Flare Glare',
                  desc: 'Renders light refraction spikes and glass smudges',
                  toggle: settings.lensFlareEnable,
                  onToggle: () => triggerChange('lensFlareEnable', !settings.lensFlareEnable),
                  slider: { label: 'Smudge', val: settings.lensDirtAlpha, key: 'lensDirtAlpha', min: 0, max: 1, step: 0.05 },
                },
                {
                  label: '5. Outer Border Vignette',
                  desc: 'Darkens screen corners to focus gameplay vision',
                  toggle: settings.vignetteEnable,
                  onToggle: () => triggerChange('vignetteEnable', !settings.vignetteEnable),
                  slider: { label: 'Weight', val: settings.vignetteIntensity, key: 'vignetteIntensity', min: 0.1, max: 1.0, step: 0.05 },
                },
              ].map(item => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{item.label}</span>
                      <span className="text-[9px] text-slate-500">{item.desc}</span>
                    </div>
                    <ToggleSwitch value={item.toggle} onChange={item.onToggle} />
                  </div>
                  {item.toggle && (
                    <div className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-white/5">
                      <span className="text-[9px] font-mono text-slate-400 shrink-0 w-20">{item.slider.label}: {Number(item.slider.val).toFixed(item.slider.step < 1 ? 2 : 0)}</span>
                      <input 
                        type="range"
                        min={item.slider.min} max={item.slider.max} step={item.slider.step}
                        value={item.slider.val}
                        onChange={(e) => triggerChange(item.slider.key as keyof GameSystemSettings, parseFloat(e.target.value))}
                        className="flex-1 accent-indigo-500 cursor-pointer h-1"
                      />
                    </div>
                  )}
                </div>
              ))}
              {/* Color Grading LUT */}
              <div className="space-y-1.5 border-t border-white/5 pt-3">
                <span className="text-[10px] font-mono text-slate-400 block">Color Grading LUT Palette</span>
                <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
                  {['none','vibrant','cold','cinematic','warm','matrix','neon'].map(lut => (
                    <button
                      key={lut}
                      onMouseEnter={() => AudioEngine.playHover()}
                      onClick={() => triggerChange('colorGrading', lut as any)}
                      className={`py-1.5 rounded transition-all text-center cursor-pointer capitalize ${
                        settings.colorGrading === lut
                        ? 'bg-emerald-600/35 border border-emerald-500/50 text-emerald-200 font-bold'
                        : 'bg-white/5 border border-transparent text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {lut}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </AccordionSection>

        </div>

        {/* RIGHT: Save System & Actions */}
        <div className="md:col-span-6 space-y-4">

          <AccordionSection
            id="saves"
            title="Chronite Storage Slots"
            subtitle="Local save state management"
            icon={HardDrive}
            iconColor="text-emerald-400"
            openId={openSection}
            setOpenId={setOpenSection}
            badge="3 Slots"
          >
            <div className="pt-3 space-y-3">
              {[1, 2, 3].map(slot => {
                const save = saveSlots[slot];
                return (
                  <div 
                    key={slot}
                    className={`p-3.5 rounded-xl border flex flex-col gap-3 transition-colors ${
                      save ? 'border-indigo-500/20 bg-indigo-950/15' : 'border-white/5 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 rounded">
                            SLOT {slot}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{save ? save.timestamp : 'Empty'}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white tracking-tight truncate">
                          {save ? save.name : 'Unassigned Archive Matrix'}
                        </h4>
                      </div>
                      {save && (
                        <button
                          onMouseEnter={() => AudioEngine.playHover()}
                          onClick={() => { AudioEngine.playAlert(); onDeleteGameSave(slot); }}
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
                        <div>Dev: <strong className="text-amber-300">{save.devotion}Δ</strong></div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onMouseEnter={() => AudioEngine.playHover()}
                        onClick={() => { AudioEngine.playClick(); onSaveGame(slot); }}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-lg text-[10px] font-bold text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Share className="w-3 h-3 text-slate-400" />
                        Overwrite
                      </button>
                      {save && (
                        <button
                          onMouseEnter={() => AudioEngine.playHover()}
                          onClick={() => { AudioEngine.playClick(); onLoadGame(slot); }}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md"
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
          </AccordionSection>

          {/* Export / Import / Hard Reset */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3.5">
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Dimension Porting Control</span>
            <div className="flex items-center gap-2">
              <button 
                onMouseEnter={() => AudioEngine.playHover()}
                onClick={() => { AudioEngine.playClick(); onExport(); }}
                className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold transition-all border border-white/10 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share className="w-3.5 h-3.5" />
                Export State
              </button>
              <button 
                onMouseEnter={() => AudioEngine.playHover()}
                onClick={() => { AudioEngine.playClick(); onImport(); }}
                className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold transition-all border border-white/10 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Import State
              </button>
            </div>
            <HardResetButton onConfirm={onHardReset} />
          </div>

        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0 select-none">
        <span>Module: localstorage_indexed_vector_v1</span>
        <span>Grid: 64x64 Nodes</span>
      </div>
    </motion.div>
  );
}

function HardResetButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <div className="space-y-1.5">
      {!armed ? (
        <button 
          onMouseEnter={() => AudioEngine.playHover()}
          onClick={() => setArmed(true)}
          className="w-full py-2.5 bg-red-950/20 hover:bg-red-900/40 border border-red-800/25 hover:border-red-600/50 rounded-xl text-xs font-bold transition-all text-red-400 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Biosphere Node (Hard Clear)
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl space-y-2"
        >
          <p className="text-[10px] text-red-300 font-mono text-center font-bold">⚠️ Permanently erase all current simulation data?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setArmed(false)}
              className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => { AudioEngine.playAlert(); onConfirm(); setArmed(false); }}
              className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 border border-red-500 rounded-lg text-[10px] font-bold text-white transition-all cursor-pointer"
            >
              Confirm Reset
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
