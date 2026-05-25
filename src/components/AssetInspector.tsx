import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Layers, 
  ChevronDown, 
  Play, 
  Pause, 
  Activity, 
  Info, 
  Grid3X3, 
  X, 
  Eye, 
  Flame, 
  Zap, 
  Compass, 
  Hammer,
  Plus,
  Save,
  Search,
  ChevronRight,
  Move,
  Maximize,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { AudioEngine } from '../engine/audio';
import { motion, AnimatePresence } from 'motion/react';

interface AssetInspectorProps {
  registry: any;
  onUpdate: (key: string, overrides: any) => void;
  onSave: (fullRegistry: any) => void;
  onAddMapping: (newKey: string, data: any) => void;
  onRemoveMapping: (key: string) => void;
  onGlobalDebugChange: (x: number, y: number, scale: number) => void;
  initialDebug: { x: number, y: number, scale: number };
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Catalog' },
  { id: 'characters', label: 'Characters & Units' },
  { id: 'buildings', label: 'Structures' },
  { id: 'flora', label: 'Flora & Environment' },
  { id: 'vfx', label: 'VFX & Equipment' },
  { id: 'surfaces', label: 'Control Surfaces' }
];

const SHEET_METADATA: Record<string, { label: string; category: string; rows: string[] }> = {
  "char-animist-4k-sheet": { label: "Characters: Animist Faction", category: "characters", rows: ["Gatherer", "Woodsman", "Hunter", "Beastmaster", "Shaman", "Warrior", "Chieftain", "Ent (Giant)"] },
  "char-technocrat-4k-sheet": { label: "Characters: Technocrat Faction", category: "characters", rows: ["Warehouse Driver", "Exo-Miner Mech", "Field Engineer", "Cyber-Soldier Enforcer", "Hover-Biker Raider", "Drone Coordinator", "Chief Director CEO", "Heavy Combat Golem"] },
  "char-interventionist-4k-sheet": { label: "Characters: Divine Theocracy", category: "characters", rows: ["Pious Peasant", "Orderly Acolyte", "Faith Crusader Paladin", "Grand Inquisitor", "High Priest Cleric", "Zealot Fanatic", "Levitating Chant Choir", "Lesser Celestial Angel"] },
  "char-nihilist-4k-sheet": { label: "Characters: Cult of Ruin", category: "characters", rows: ["Rust Scavenger", "Gore Butcher", "Ruin Cultist", "Void Executioner", "Plague Vector Spreader", "Abyssal Doomcaller", "Flesh Graft Mutant", "Abyssal Lord Fiend"] },
  "char-elemental-4k-sheet": { label: "Characters: Elemental Guild", category: "characters", rows: ["Stonemason Architect", "Cinder Ash Gatherer", "Singe Pyromancer", "Tundra Frostguard", "Primal Earth-Shaper", "Magma-Smith Veteran", "Dreadnought Warlord", "Colossal Stone Golem"] },
  "bldg-animist-4k-sheet": { label: "Buildings: Animist Sanctuary", category: "buildings", rows: ["Thatch Shelter Bed", "Communal Firepit", "Arboreal Tree-House", "Sacred Grove", "Heart-Wood Altar", "Biodiverse Eco-Pod", "Synthetic Nutri-Vat", "Ancient World Tree"] },
  "bldg-technocrat-4k-sheet": { label: "Buildings: Secular Industry", category: "buildings", rows: ["Storage Hub Depot", "Rigid Piston Well", "Concrete Hab Block", "Hydroelectric Mill", "Academy of Science", "Sleek Skyscraper", "Heavy Auto-Forge", "Omnipresent AI Godhead"] },
  "bldg-interventionist-4k-sheet": { label: "Buildings: Interventionist Halo", category: "buildings", rows: ["Silk Prayer Tent", "Sanctified Altar", "Imperial Marble Manse", "Purity Bathhouse", "Grand Cathedral Dome", "Steel Citadel Citadel", "Mana Spark Extractor", "Ascension Golden Gate"] },
  "bldg-elemental-4k-sheet": { label: "Buildings: Elemental Forge", category: "buildings", rows: ["Geode Cave Hearth", "Melting Crucible", "Resolute Totem Tower", "Volcanic Ziggurat", "Primal Ore Foundry", "Geothermal Core-Tap", "Geo-Fission Reactor", "Core Tectonic Drill"] },
  "bldg-nihilist-4k-sheet": { label: "Buildings: Ruin Outposts", category: "buildings", rows: ["Slum Junk Shack", "Smoldering Bone Pyre", "Gladiator Combat Pit", "Decay Slaughterhouse", "Brutalist Scrap Fort", "Tower of Iron Scrap", "Cloning Flesh-Vat", "Nihility Engine Core"] },
  "bldg-universal-4k-sheet": { label: "Buildings: Shared Defenses", category: "buildings", rows: ["Reinforced Granary", "Vertical Silo", "Spiked Wood Wall", "Cut Stone Wall", "Cybernetic Barrier", "Vigilant Guard Tower", "Reinforced Keep", "Dual Laser Sentry"] },
  "flora-trees-4k-sheet": { label: "Flora: Standard Forest", category: "flora", rows: ["Oak (Summer Canopy)", "Oak (Autumn Foliage)", "Luminous White Birch", "Ancient Weeping Willow", "Boreal Alpine Pine", "Frost Spruce Needle", "Saguaro Desert Cactus", "Rotting Trunk Log"] },
  "flora-exotic-4k-sheet": { label: "Flora: Faith Superorganisms", category: "flora", rows: ["Mother-Tree Elder", "Bioluminescent Spore", "Primal Obsidian Thorn", "Underground Magma-Root", "Fiberoptic Cyber-Reed", "Pulsating Flesh-Mound", "Ethereal Void Lotus", "Vibrational Crystal Shard"] },
  "flora-crops-4k-sheet": { label: "Flora: Crops & Agriculture", category: "flora", rows: ["Golden Wheat field", "Bumper Cornstalk Rows", "Root tuber (Potato)", "Flooded Paddy Rice", "Luminous Mana-Fruit", "Radiant Sun-Wheat", "Synthesizer Algae Vat", "Nihilist Blood-Vine"] },
  "geo-base-4k-sheet": { label: "Geology: Common Formations", category: "flora", rows: ["Granite Boulder Stack", "Limestone Outcrop", "Weathered Sandstone", "Glassy Obsidian Glass", "Frozen Glacial Ice", "Crystal Stalagmite", "Prehistoric Skeleton", "Crude Oil Sludge Tar"] },
  "geo-minerals-4k-sheet": { label: "Geology: Ores & Crystals", category: "flora", rows: ["Combustible Coal Vein", "Rusted Iron Ore Block", "Verdigris Copper Node", "Dazzling Gold Ore Lobe", "Crystalline Diamond Gem", "Hazardous Uranium Core", "Charged Quartz Crystal", "Void Nullstone Core"] },
  "terrain-standard-4k-sheet": { label: "Terrain: Biome Foundation Tiles", category: "flora", rows: ["Rich Loam Grass", "Packed Dirt Trail", "Dry Dunes Sand", "Compact Alpine Snow", "Aqua Shelf Water", "Abyssal Deep Water", "Crystalline Magma Sea", "Corrupted Acidic Mire"] },
  "vfx-miracles-4k-sheet": { label: "VFX: Miracles Projection", category: "vfx", rows: ["Rejuvenating Herb Circle", "Brilliant Judgement Pillar", "Lush Growth Wave", "Refreshing Storm Rain", "Gravity Pull Beam", "Sphere Barrier Shield", "Aura of Sanctification", "EECS Overcharge Blast"] },
  "vfx-disasters-4k-sheet": { label: "VFX: Disaster Eruptions", category: "vfx", rows: ["Eruptive Meteor Splash", "Fault Slip Earthquake", "Voltage Strike Fork", "Blight Cloud Miasma", "Dark Singularity Pull", "Combat Weapon Sparring", "Viscous Splatter Burst", "Static Grid Glitch"] },
  "equip-weapons-4k-sheet": { label: "Equipment: Core Weapons", category: "vfx", rows: ["Tipped Combat Spear", "Tempered Steel Broadsword", "Utility Felling Axe", "High-Velocity Arc Rifle", "Glowing Priest Scepter", "Jagged Butchering Hook", "Recurved Composite Bow", "EECS Heavy Pickaxe"] },
  "equip-armor-4k-sheet": { label: "Equipment: Combat Shields & Attire", category: "vfx", rows: ["Hardwood Round Shield", "Cohesive Energy Barrier", "Wrought-Iron Great-Helm", "Headlamp Excavator Cap", "Cybernetic Visor Unit", "Luminescent Halo Shimmer", "Thick Bison Hide Cloak", "Jet-Propelled Flight Pack"] },
  "logistics-vehicles-4k-sheet": { label: "Logistics: Transports & Engines", category: "characters", rows: ["Sturdy Pack Mule", "Oxen Supply Wagen", "Humble Cargo Barrow", "Sailing Galleon Hull", "Armored Steam Engine", "Automated Quadcop Drone", "Magnetic Levitation Car", "Siege Weapon Ballista"] },
  "fauna-wild-4k-sheet": { label: "Fauna: Native Beasts", category: "characters", rows: ["Apex Hunter Timberwolf", "Whitefront Forest Stag", "Spotted Milk Cow", "Woolly Horned Sheep", "Vigilant High-Altitude Hawk", "Aquifer School Trout", "Leviathan Deepwater Whale", "Plague Swarm Scourge"] },
  "nano-banana-4k-sheet": { label: "Flora: Nano Banana 2", category: "flora", rows: ["Golden Nano Banana", "Electric Cyber Banana", "Holographic Void Banana", "Holy Divine Banana", "Pyromaniac Fire Banana", "Glacial Frost Banana", "Radioactive Mutated Banana", "Deep Cosmic Elder Banana"] }
};

export function AssetInspector({ registry, onUpdate, onSave, onAddMapping, onRemoveMapping, onGlobalDebugChange, initialDebug, onClose }: AssetInspectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const sheetKeys = useMemo(() => {
    return Object.keys(registry.sheets).filter(sk => {
      const meta = SHEET_METADATA[sk];
      if (!meta) return false;
      if (selectedCategory === 'all') return true;
      return meta.category === selectedCategory;
    });
  }, [selectedCategory, registry]);

  const [activeSheet, setActiveSheet] = useState<string>(sheetKeys[0] || 'char-animist-4k-sheet');
  const [activeRow, setActiveRow] = useState<number>(0);
  const [activeCol, setActiveCol] = useState<number>(0);
  
  // Tuning state
  const [uOffset, setUOffset] = useState(0);
  const [vOffset, setVOffset] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [opacity, setOpacity] = useState(1.0);
  const [isAnimated, setIsAnimated] = useState(true);
  const [isInteractive, setIsInteractive] = useState(true);

  // Global state
  const [globalX, setGlobalX] = useState(initialDebug.x);
  const [globalY, setGlobalY] = useState(initialDebug.y);
  const [globalScale, setGlobalScale] = useState(initialDebug.scale);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(8);
  const [bgStyle, setBgStyle] = useState<'checker' | 'slate' | 'black' | 'green'>('checker');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentMappingKey = useMemo(() => {
    return Object.keys(registry.mappings).find(key => {
      const val = registry.mappings[key as keyof typeof registry.mappings];
      return val.sheet === activeSheet && val.row === activeRow && val.col === activeCol;
    }) || '';
  }, [activeSheet, activeRow, activeCol, registry]);

  // Reactive Sync to App State
  useEffect(() => {
    if (currentMappingKey) {
      onUpdate(currentMappingKey, { uOffset, vOffset, scale, opacity, isAnimated, isInteractive });
    }
  }, [uOffset, vOffset, scale, opacity, isAnimated, isInteractive, currentMappingKey]);

  useEffect(() => {
    onGlobalDebugChange(globalX, globalY, globalScale);
  }, [globalX, globalY, globalScale]);

  // Load selection metadata
  useEffect(() => {
    if (currentMappingKey) {
      const existing = registry.mappings[currentMappingKey];
      setUOffset(existing?.uOffset || 0);
      setVOffset(existing?.vOffset || 0);
      setScale(existing?.scale || 1.0);
      setOpacity(existing?.opacity || 1.0);
      setIsAnimated(existing?.isAnimated !== false);
      setIsInteractive(existing?.isInteractive !== false);
    }
  }, [currentMappingKey]);

  // Preview Loop
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setActiveCol(prev => (prev + 1) % 4);
      }, 1000 / fps);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, fps]);

  const activeSheetMeta = useMemo(() => SHEET_METADATA[activeSheet] || { label: "System Assets", category: "System", rows: Array(8).fill("System Entity") }, [activeSheet]);
  const activeRowLabel = useMemo(() => activeSheetMeta.rows[activeRow] || `Row #${activeRow + 1}`, [activeSheetMeta, activeRow]);
  const sheetUrl = useMemo(() => registry.sheets[activeSheet] || '', [activeSheet, registry]);

  const bgClassMap = {
    checker: "bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:16px_16px] bg-[#0c0d0f] border-slate-700/50",
    slate: "bg-slate-800 border-slate-700/60",
    black: "bg-black border-neutral-900",
    green: "bg-emerald-950/40 border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-7xl h-[90vh] bg-slate-950/90 border border-white/15 rounded-[2rem] flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden text-slate-300 font-sans backdrop-blur-3xl">
      {/* HEADER */}
      <div className="p-6 border-b border-white/5 bg-slate-900/40 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-sky-500/20 border border-sky-400/30 rounded-2xl text-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.2)]"><Layers className="w-7 h-7" /></div>
          <div><h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">Registry Architect<span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-1 px-3 rounded-full not-italic tracking-widest">v4.7 // SYNCED</span></h2><p className="text-[11px] text-slate-500 mt-1 font-mono uppercase tracking-wide">High-Fidelity Sprite Orchestration & Matrix Debugger</p></div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => { const name = prompt("Unique Mapping ID:"); if(name) onAddMapping(name, { sheet: activeSheet, row: activeRow, col: activeCol }); }} className="flex items-center gap-2 px-5 py-2.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-xl text-[11px] font-black uppercase hover:bg-sky-500 hover:text-black transition-all cursor-pointer"><Plus className="w-4 h-4" /> Add Mapping</button>
          <button onClick={() => onSave(registry)} className="flex items-center gap-2 px-7 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all cursor-pointer shadow-lg shadow-emerald-500/10"><Save className="w-4 h-4" /> Persist Registry</button>
          <div className="w-px h-10 bg-white/10 mx-2" /><button onClick={onClose} className="p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 rounded-2xl transition-all cursor-pointer group"><X className="w-5 h-5 group-hover:rotate-90 transition-transform" /></button>
        </div>
      </div>

      {/* TABS */}
      <div className="px-6 py-3.5 bg-black/40 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
        {CATEGORIES.map(category => (
          <button key={category.id} onClick={() => { AudioEngine.playClick(); setSelectedCategory(category.id); }} className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${selectedCategory === category.id ? 'bg-sky-500 text-white shadow-[0_8px_20px_rgba(14,165,233,0.4)]' : 'text-slate-500 hover:bg-white/5 border border-transparent'}`}>{category.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex divide-x divide-white/5 min-h-0 bg-black/20">
        {/* COL A */}
        <div className="w-80 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 custom-scrollbar">
          <div className="space-y-3"><label className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">Active Atlas</label><div className="relative group"><Search className="absolute left-3.5 top-3.5 text-slate-600" size={14} /><select value={activeSheet} onChange={e => { AudioEngine.playClick(); setActiveSheet(e.target.value); }} className="w-full bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 pl-10 text-xs text-white appearance-none outline-none focus:border-sky-500/50 transition-all font-bold cursor-pointer">{sheetKeys.map(sheetId => (<option key={sheetId} value={sheetId}>{SHEET_METADATA[sheetId]?.label || sheetId.toUpperCase()}</option>))}</select></div></div>
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col"><label className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">Row Subject Matrix</label><div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">{activeSheetMeta.rows.map((rowName, idx) => (<button key={idx} onClick={() => { AudioEngine.playClick(); setActiveRow(idx); setActiveCol(0); }} className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${activeRow === idx ? 'bg-sky-500/10 text-sky-300 border-sky-500/40 shadow-inner' : 'bg-white/[0.02] text-slate-500 border-white/5 hover:bg-white/[0.04]'}`}><span className="font-bold truncate text-left">{rowName}</span><ChevronRight size={14} className={activeRow === idx ? 'opacity-100' : 'opacity-0'} /></button>))}</div></div>
        </div>

        {/* COL B: GRID */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6 items-center bg-[#050608]/40 custom-scrollbar">
           <div className="w-full max-w-[500px] aspect-square relative p-5 rounded-[2.5rem] bg-slate-950/80 border border-white/10 grid grid-cols-4 gap-4 shadow-2xl">
            {Array.from({ length: 16 }).map((_, totalIdx) => {
              const r = Math.floor(totalIdx / 4);
              const c = totalIdx % 4;
              const isSelected = r === activeRow && c === activeCol;
              return (
                <div key={totalIdx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 bg-black/30">
                  <div
                    style={{
                      position: 'absolute', inset: 0, backgroundImage: `url(${sheetUrl})`, backgroundSize: '400% 400%',
                      backgroundPosition: `${(c / 3) * 100}% ${(r / 3) * 100}%`,
                      transform: isSelected ? `translate(${uOffset/4}px, ${vOffset/4}px) scale(${scale})` : 'none',
                      imageRendering: 'pixelated',
                      opacity: isSelected ? 1 : 0.3
                    }}
                    className={`transition-all duration-100`}
                  />
                  <button onClick={() => { AudioEngine.playClick(); setActiveRow(r); setActiveCol(c); }} className="absolute inset-0 z-20 cursor-pointer" />
                  {isSelected && <div className="absolute inset-0 border-2 border-sky-400 rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(56,189,248,0.5)] z-10" />}
                </div>
              );
            })}
          </div>
          <div className="p-4 bg-slate-900/30 border border-white/5 rounded-2xl text-[10px] font-mono text-slate-500 flex justify-between w-full max-w-[500px]"><span>// ADDRESS: R{activeRow} : C{activeCol}</span><span>RESOLVED_PATH: {activeSheet}.png</span></div>
        </div>

        {/* COL C: FOCAL & TUNING */}
        <div className="w-[420px] p-8 flex flex-col gap-8 overflow-y-auto shrink-0 bg-slate-900/10 custom-scrollbar">
          <div className="space-y-4">
            <div className="flex items-center justify-between"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Focal Node</label><div className="flex gap-2">{(['checker', 'slate', 'black', 'green'] as const).map(style => (<button key={style} onClick={() => setBgStyle(style)} className={`w-3.5 h-3.5 rounded-full border border-white/20 cursor-pointer ${bgStyle === style ? 'ring-2 ring-sky-500' : ''}`} style={{ backgroundColor: style === 'checker' ? '#111317' : style === 'slate' ? '#334155' : style === 'black' ? '#000000' : '#064e3b' }} />))}</div></div>
            <div className={`aspect-[4/3] rounded-3xl border flex items-center justify-center relative overflow-hidden shadow-2xl ${bgClassMap[bgStyle]}`}>
               {sheetUrl ? (
                <div style={{
                  width: '256px', height: '256px', backgroundImage: `url(${sheetUrl})`, backgroundSize: '1024px 1024px',
                  backgroundPosition: `-${activeCol * 256}px -${activeRow * 256}px`,
                  transform: `translate(${uOffset}px, ${vOffset}px) scale(${scale})`,
                  imageRendering: 'pixelated',
                  opacity: opacity
                }} className="drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] transition-all duration-100" />
              ) : <span className="text-xs font-mono opacity-20">AWAITING SOURCE</span>}
              <div className="absolute top-4 left-4 flex gap-2"><div className="px-2 py-1 bg-black/60 rounded-lg text-[9px] font-black text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Live Cycle</div></div>
            </div>
            {/* ANIMATION CONTROLS */}
            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between shadow-inner">
               <div className="flex gap-2">
                  <button onClick={() => { AudioEngine.playClick(); setActiveCol(prev => (prev === 0 ? 3 : prev - 1)); }} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"><ArrowLeft size={16} /></button>
                  <button onClick={() => { AudioEngine.playClick(); setIsPlaying(!isPlaying); }} className={`p-2.5 px-5 rounded-xl flex items-center gap-2 text-[10px] font-black transition-all cursor-pointer ${isPlaying ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>{isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? "PAUSE" : "PLAY"}</button>
                  <button onClick={() => { AudioEngine.playClick(); setActiveCol(prev => (prev + 1) % 4); }} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"><ArrowRight size={16} /></button>
               </div>
               <div className="flex flex-col items-end gap-1"><span className="text-[10px] font-mono text-sky-400 font-bold">{fps} FPS</span><input type="range" min="1" max="24" value={fps} onChange={e => setFps(parseInt(e.target.value))} className="w-24 h-1 accent-sky-500 bg-slate-800 rounded-full appearance-none cursor-pointer" /></div>
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/5">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Activity size={14} className="text-emerald-400" /> Tactical Cell Tuning</label>
             <div className="p-5 bg-black/40 border border-white/5 rounded-3xl space-y-5 shadow-inner">
                <TuningSlider label="U-Offset (X)" value={uOffset} min={-128} max={128} onChange={setUOffset} unit="px" />
                <TuningSlider label="V-Offset (Y)" value={vOffset} min={-128} max={128} onChange={setVOffset} unit="px" />
                <TuningSlider label="Entity Scale" value={scale} min={0.2} max={4.0} step={0.01} onChange={setScale} unit="x" />
                <TuningSlider label="Alpha Gain" value={opacity} min={0} max={1.0} step={0.05} onChange={setOpacity} unit="%" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                   <AttrToggle label="Animated" active={isAnimated} onClick={() => setIsAnimated(!isAnimated)} />
                   <AttrToggle label="Collision" active={isInteractive} onClick={() => setIsInteractive(!isInteractive)} />
                </div>
             </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/5">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Compass size={14} className="text-sky-400" /> Global Matrix Debug</label>
             <div className="p-5 bg-slate-950/40 border border-white/10 rounded-3xl space-y-5">
                <TuningSlider label="Matrix X-Offset" value={globalX} min={-256} max={256} onChange={setGlobalX} unit="px" />
                <TuningSlider label="Matrix Y-Offset" value={globalY} min={-256} max={256} onChange={setGlobalY} unit="px" />
                <TuningSlider label="Tile Overlap" value={globalScale} min={0.5} max={3.0} step={0.01} onChange={setGlobalScale} unit="x" />
             </div>
          </div>
          <div className="p-5 rounded-3xl bg-slate-900/40 border border-white/5 font-mono space-y-2 mb-10"><div className="flex justify-between text-[10px]"><span className="text-slate-500 uppercase">RESOLVED ID</span> <span className="text-white font-bold">{currentMappingKey || "UNMAPPED"}</span></div></div>
        </div>
      </div>
    </motion.div>
  );
}

function TuningSlider({ label, value, min, max, step = 1, onChange, unit }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-mono uppercase font-bold tracking-tighter"><span className="text-slate-500">{label}</span><span className="text-amber-400">{typeof value === 'number' ? (unit === 'x' ? value.toFixed(2) : value.toFixed(0)) : value}{unit === '%' ? '%' : unit}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 shadow-md" />
    </div>
  );
}

function AttrToggle({ label, active, onClick }: { label: string, active: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center justify-between p-3 rounded-2xl border text-[10px] font-black uppercase transition-all cursor-pointer ${active ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-lg' : 'bg-black/40 border-white/10 text-slate-600 hover:border-white/20'}`}>
      <span>{label}</span>
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]' : 'bg-slate-800'}`} />
    </button>
  );
}
