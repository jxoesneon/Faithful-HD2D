import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { ECS } from './engine/ecs';
import { GameRenderer } from './engine/renderer';
import { SimulationEngine } from './engine/simulation';
import { EngineCoordinator } from './engine/engineCoordinator';
import { Position, Society, Faith, Flora, Fauna, Structure, Movement, FaithSystemType } from './types';
import { 
  Zap, 
  Activity, 
  Globe, 
  Users, 
  CloudRain, 
  Flame, 
  Settings,
  Heart,
  Shield,
  TrendingUp,
  Cpu,
  Layers,
  ChevronDown,
  Eye,
  Sparkles,
  Home,
  Compass,
  Search,
  Crosshair,
  ChevronLeft,
  ChevronRight,
  Plus,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssetInspector } from './components/AssetInspector';
import { SystemDiagnosticsPanel } from './components/SystemDiagnosticsPanel';
import { GODS_PANTHEON, God, Skill } from './engine/gods_data';
import { DeitySelectionOverlay } from './components/DeitySelectionOverlay';
import { StartMenuOverlay } from './components/StartMenuOverlay';
import { CosmicSettingsHub } from './components/CosmicSettingsHub';
import { AudioEngine } from './engine/audio';
import { CoordinateDebugger } from './components/CoordinateDebugger';
import { AssetRegistryEditor } from './components/AssetRegistryEditor';
import { useDevice, GlassPanel, AdaptiveContainer } from './components/AdaptiveUI';
import { RenderDebugPanel } from './components/RenderDebugPanel';
import spriteMappings from '../docs/sprite-mappings.json';

const ILLUMINATION_BOOSTS = [
  {
    id: 'growth_catalyst',
    name: 'Celestial Dew',
    description: 'Imbues global soils with microscopic celestial moisture, accelerating plant cell division.',
    effectDesc: '+35% vegetation & wild crop growth speed',
    icon: 'Ã°Å¸Å’Â±',
    colorBg: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-300'
  },
  {
    id: 'feline_grace',
    name: 'Astral Velocity',
    description: 'Deploys a localized quantum acceleration pulse, giving mortals celestial light steps across terrain.',
    effectDesc: '+30% mortal movement velocity globally',
    icon: 'Ã¢Å“Â¨',
    colorBg: 'from-sky-500/10 to-indigo-500/10 border-sky-500/20 text-sky-300'
  },
  {
    id: 'fertile_mind',
    name: 'Cognitive Spark',
    description: 'Aligns micro-synaptic transmitters. Enlightened scholars receive major mental processing breakthroughs.',
    effectDesc: '+40% technology advancement rate in all tribes',
    icon: 'Ã°Å¸Â§Âª',
    colorBg: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20 text-cyan-300'
  },
  {
    id: 'infinite_joy',
    name: 'Aerosol of Serenity',
    description: 'Floods the atmospheric envelope with relaxing ozone, assuring minimum standard of living contentments.',
    effectDesc: 'Locks collective happiness feedback floor strictly at 45%',
    icon: 'Ã°Å¸â€™â€“',
    colorBg: 'from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-300'
  },
  {
    id: 'tithe_transmutation',
    name: 'Acolyte Resonance',
    description: 'Calibrates faith core frequency, allowing prayer structures to absorb extra spiritual energy.',
    effectDesc: '+25% global devotion generation from worship & tithes',
    icon: 'Ã°Å¸â€Â®',
    colorBg: 'from-violet-500/10 to-purple-500/10 border-violet-500/20 text-violet-300'
  },
  {
    id: 'tempest_insulation',
    name: 'Kinetic Shielder',
    description: 'Projects defensive field layers, guarding tribal domains from storms and converting strikes to resources.',
    effectDesc: 'Shields mortals from lightning casualty; +3x Technocrat returns; reducing decay, 3x structure armor',
    icon: 'Ã°Å¸â€ºÂ¡Ã¯Â¸Â',
    colorBg: 'from-amber-500/10 to-red-500/10 border-amber-500/20 text-amber-300'
  },
  {
    id: 'mortal_abundance',
    name: 'Generative Bliss',
    description: 'Warms climate sectors with bios-favorable frequencies, provoking immediate family expansions.',
    effectDesc: '+40% natural birth rate & demographic increase speed',
    icon: 'Ã°Å¸â€˜Â¥',
    colorBg: 'from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-300'
  }
];

export const getTribeTierInfo = (pop: number) => {
  if (pop >= 4000) {
    return {
      level: 8,
      name: "Sovereign Cosmic Empire",
      icon: "Ã°Å¸â€˜â€˜",
      color: "from-purple-500 to-indigo-600 shadow-purple-500/20",
      description: "Ultimate peak of mortal evolution. An apex civilization wrapping entire biomes with weather immunity and double devotion output.",
      benefits: ["Double Devotion Output (+100%)", "Complete Weather Storm Immunity", "Happiness locked above 50% permanently"],
      nextThreshold: null
    };
  }
  if (pop >= 1500) {
    return {
      level: 7,
      name: "Sprawling Metropolis",
      icon: "Ã°Å¸Å’Å’",
      color: "from-blue-600 to-cyan-500 shadow-blue-500/10",
      description: "A monumental city attracting global attention. Passively generates resources and devotion automatically.",
      benefits: ["Auto yield: +3 Raw Materials/sec", "Auto yield: +1 Devotion/sec", "All natural hazards cushioned"],
      nextThreshold: 4000,
      nextName: "Sovereign Cosmic Empire"
    };
  }
  if (pop >= 500) {
    return {
      level: 6,
      name: "Capital City",
      icon: "Ã¢â€ºÂª",
      color: "from-teal-600 to-emerald-500",
      description: "Centralized power house with division of labor and complex trade systems.",
      benefits: ["Devotion accumulation speed boosted by +50%", "Unlocks Tithe Offering toggle"],
      nextThreshold: 1500,
      nextName: "Sprawling Metropolis"
    };
  }
  if (pop >= 150) {
    return {
      level: 5,
      name: "Sovereign Town",
      icon: "Ã°Å¸Ââ€ºÃ¯Â¸Â",
      color: "from-amber-600 to-orange-500",
      description: "Stonemason structures, central square, and organized craftsmen guilds.",
      benefits: ["+35% gathering speed", "+15% hunting speed", "Unlocks Strip mining options"],
      nextThreshold: 500,
      nextName: "Capital City"
    };
  }
  if (pop >= 50) {
    return {
      level: 4,
      name: "Cohesive Village",
      icon: "Ã°Å¸ÂÂ°",
      color: "from-lime-600 to-green-500",
      description: "Thriving permanent settlement with automated defensive cross-bolt guard towers to repel wild wolves.",
      benefits: ["Automated perimeter defenses against wolves", "+25% Scholarly speed boost"],
      nextThreshold: 150,
      nextName: "Sovereign Town"
    };
  }
  if (pop >= 25) {
    return {
      level: 3,
      name: "Settled Hamlet",
      icon: "Ã°Å¸ÂÂ¡",
      color: "from-sky-700 to-indigo-500",
      description: "A solid permanent cluster with shared storage pits. Unlocks emergency Rationing commands.",
      benefits: ["+25% Hunting yield ", "Unlocks Rationing Mode to cut hunger"],
      nextThreshold: 50,
      nextName: "Cohesive Village"
    };
  }
  if (pop >= 10) {
    return {
      level: 2,
      name: "Pioneer Clan",
      icon: "Ã¢â€ºÂº",
      color: "from-yellow-700 to-amber-600",
      description: "Small family network establishing initial campsites and storage facilities.",
      benefits: ["+15% Forage gathering speed", "Acolytes begin prayers for Devotion"],
      nextThreshold: 25,
      nextName: "Settled Hamlet"
    };
  }
  return {
    level: 1,
    name: "Sentinel Outpost",
    icon: "Ã°Å¸â€ºâ€“",
    color: "from-slate-700 to-slate-600",
    description: "A solitary villager or small scouting party seeking a foothold in the wild biome. Highly fragile.",
    benefits: ["Fleeing speed boosted to escape wildlife", "Zero base resource consumption"],
    nextThreshold: 10,
    nextName: "Pioneer Clan"
  };
}

export default function App() {
  const { isMobile, isLandscape } = useDevice();
  const containerRef = useRef<HTMLDivElement>(null);
  const appRootRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const ecsRef = useRef(new ECS());
  const simulationRef = useRef<SimulationEngine | null>(null);
  const coordinatorRef = useRef<EngineCoordinator | null>(null);
  
  const [devotion, setDevotion] = useState(100);
  const [stats, setStats] = useState({ population: 0, religions: {} as Record<string, number>, techAverage: 1.0 });
  const [activeTab, setActiveTab] = useState<'simulation' | 'societies' | 'faith' | 'deity' | 'inspector' | 'progression' | 'settings'>('simulation');
  const [selectedGod, setSelectedGod] = useState<God | null>(null);

  // Live start menu and simulation speed controls
  const [showStartMenu, setShowStartMenu] = useState(true);
  const [showRenderDebug, setShowRenderDebug] = useState(false);
  const [showSystemDiagnostics, setShowSystemDiagnostics] = useState(false);
  const [gameSpeed, setGameSpeed] = useState<number>(1.0);
  const [settings, setSettings] = useState({
    gameSpeed: 1.0,
    weatherChaos: 'standard' as 'mild' | 'standard' | 'extreme',
    visualTheme: 'standard' as 'standard' | 'cyberpunk' | 'monochrome' | 'amber' | 'sepia',
    soundTicker: true,
    showGridLines: true,
    tooltipAssist: true,
    bloomEnable: true,
    bloomIntensity: 1.0,  // Calibrated: was 1.5, now 2.8px blur for subtler glow
    dofEnable: true,
    dofBlur: 3,  // Calibrated: was 6, now 3px for natural depth transition
    colorGrading: 'vibrant' as 'none' | 'vibrant' | 'cold' | 'cinematic' | 'warm' | 'matrix' | 'neon',
    chromaticAberrationEnable: true,
    chromaticAberrationOffset: 2,  // Calibrated: was 4, now 2px for subtle lens distortion
    lensFlareEnable: true,
    lensDirtAlpha: 0.15,  // Calibrated: was 0.35, now 15% for cleaner lens effect
    vignetteEnable: true,
    vignetteIntensity: 0.45,  // Calibrated: was 0.65, now 45% for subtle edge darkening
    sunDirX: 1.0,
    sunDirY: 1.0,
    godRayIntensity: 0.35,
    ambientLevel: 0.28,  // Calibrated: was 0.2, now 28% for better visibility
    batterySaver: false
  });

  const [saveSlots, setSaveSlots] = useState<Record<number, {
    exists: boolean;
    name: string;
    timestamp: string;
    population: number;
    divineLevel: number;
    weather: string;
    devotion: number;
  } | null>>({ 1: null, 2: null, 3: null });

  const speedRef = useRef(1.0);
  const showStartMenuRef = useRef(true);
  const settingsRef = useRef(settings);

  // Realtime progression states tracking (keeps React in fast-sync with main loop ticks)
  const [progression, setProgression] = useState({
    level: 1,
    xp: 0,
    xpNeeded: 100,
    illuminationPoints: 0,
    unlockedIlluminations: [] as string[],
    actionsCompleted: {
      miraclesCast: 0,
      floraHarvested: 0,
      faunaHunted: 0,
      structuresErected: 0,
      weatherInterventions: 0,
      tithesCompleted: 0,
      devotionAccumulated: 0
    }
  });
  const [unlockedSkills, setUnlockedSkills] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<{id: number, time: string, type: 'MIRACLE' | 'SCHISM' | 'EVOLUTION', text: string}[]>([]);
  const [weatherInfo, setWeatherInfo] = useState({
    weather: 'CLEAR',
    timeLeft: 45,
    timer: 45,
    temperature: 22,
    humidity: 45
  });

  // Spawning tools and cursor brush states
  const [activeBrush, setActiveBrush] = useState<{ 
    category: 'INSPECT' | 'SPAWN_BANANA' | 'SPAWN_FAUNA' | 'SPAWN_STRUCTURE' | 'SPAWN_TRIBE' | 'LOCALISED_SPELL'; 
    subType: string;
  }>({ category: 'INSPECT', subType: '' });
  const brushRef = useRef(activeBrush);

  // Floating selection detail state
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [hoveredCoordinate, setHoveredCoordinate] = useState<{ x: number, y: number } | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<any | null>(null);
  const [heatmap, setHeatmap] = useState<'none' | 'devotion' | 'resource'>('none');

  // Progressive Disclosure controls
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [faithGridOpen, setFaithGridOpen] = useState(false);
  const [inspectAdvanced, setInspectAdvanced] = useState(false);
  const [toolMode, setToolMode] = useState<'inspect' | 'spawn' | 'spell'>('inspect');
  const [spawnCategory, setSpawnCategory] = useState<'banana' | 'fauna' | 'structure' | 'tribe'>('banana');

  // Asset Registry state for real-time architectural editing
  const [registry, setRegistry] = useState(spriteMappings);

  const getBiomeName = (coord: { x: number, y: number } | null) => {
    if (!coord || !simulationRef.current) return 'VERDANT RIFT';
    const map = simulationRef.current.getTerrain();
    const h = map[coord.x]?.[coord.y];
    if (h === undefined) return 'VERDANT RIFT';
    if (h < 0.18) return 'ABYSSAL OCEAN CORE';
    if (h < 0.32) return 'BIO-LUMINESCENT TRENCH';
    if (h < 0.40) return 'CYBER-COAST BASE';
    if (h < 0.60) return 'TOXIC EMERALD CANOPY';
    if (h < 0.72) return 'DENSE RAINFOREST SHIELD';
    if (h < 0.85) return 'BASALT MOUNTAIN RIDGE';
    return 'GLACIAL STELLAR PEAK';
  };

  useEffect(() => {
    speedRef.current = gameSpeed;
  }, [gameSpeed]);

  useEffect(() => {
    showStartMenuRef.current = showStartMenu;
  }, [showStartMenu]);

  useEffect(() => {
    settingsRef.current = settings;
    if (rendererRef.current && rendererRef.current.onZoomChange) {
      rendererRef.current.onZoomChange(rendererRef.current.zoom);
    }
  }, [settings]);

  // Audio Engine user gesture activator
  useEffect(() => {
    const initAudio = () => {
      AudioEngine.init();
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Live Panning, Zooming, Tile Inspection, and Deity Miracle Casting Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Zoom shortcuts: '+' / '=' to zoom in, '-' / '_' to zoom out
      if (e.key === '=' || e.key === '+') {
        rendererRef.current?.triggerZoom(1.15);
        AudioEngine.playHover();
      } else if (e.key === '-' || e.key === '_') {
        rendererRef.current?.triggerZoom(0.85);
        AudioEngine.playHover();
      }

      // 2. Pan shortcuts: W / ArrowUp, A / ArrowLeft, S / ArrowDown, D / ArrowRight
      let panX = 0;
      let panY = 0;
      const panAmount = 1; // grid cells relative movement
      
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') {
        panX = -panAmount;
        panY = -panAmount;
      } else if (k === 's' || e.key === 'ArrowDown') {
        panX = panAmount;
        panY = panAmount;
      } else if (k === 'a' || e.key === 'ArrowLeft') {
        panX = -panAmount;
        panY = panAmount;
      } else if (k === 'd' || e.key === 'ArrowRight') {
        panX = panAmount;
        panY = -panAmount;
      }

      if (panX !== 0 || panY !== 0) {
        if (rendererRef.current && rendererRef.current.app) {
          const currentZoom = rendererRef.current.zoom;
          rendererRef.current.app.stage.x -= (panX * 32 - panY * 32) * currentZoom;
          rendererRef.current.app.stage.y -= (panX * 16 + panY * 16) * currentZoom;
          AudioEngine.playHover();
        }
      }

      // 3. Inspect target coordinate under hover cursor: 'i'
      if (k === 'i') {
        if (hoveredCoordinate && simulationRef.current) {
          const ent = simulationRef.current.getEntityAt(hoveredCoordinate.x, hoveredCoordinate.y);
          if (ent) {
            if (rendererRef.current) {
              rendererRef.current.selectedEntityId = ent.id;
            }
            setSelectedEntity(ent);
            AudioEngine.playClick();
            if (ent.components?.society?.faction) {
              AudioEngine.playVocalization(ent.components.society.faction);
            }
          } else {
            // Select empty space terrain inspector
            if (rendererRef.current) {
              rendererRef.current.selectedEntityId = null;
            }
            setSelectedEntity({
              id: `terrain_${hoveredCoordinate.x}_${hoveredCoordinate.y}`,
              category: 'Terrain',
              x: hoveredCoordinate.x,
              y: hoveredCoordinate.y,
              height: simulationRef.current.getTerrain()[hoveredCoordinate.x]?.[hoveredCoordinate.y] ?? 0.5,
              name: getBiomeName(hoveredCoordinate)
            });
            AudioEngine.playClick();
          }
        }
      }

      // 4. System Diagnostics toggle: F3
      if (e.key === 'F3') {
        e.preventDefault();
        setShowSystemDiagnostics((v) => !v);
      }

      // 5. Deity Miracle Interventions: '1'-'5'
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (selectedGod && selectedGod.skills) {
          const skill = selectedGod.skills[index];
          if (skill) {
            if (hoveredCoordinate && simulationRef.current) {
              const sim = simulationRef.current;
              if (sim.totalDevotion >= skill.devotionCost) {
                // If it is unlocked (either specifically or checking unlocked skills map)
                if (unlockedSkills[skill.id]) {
                  sim.totalDevotion -= skill.devotionCost;
                  const succeeded = sim.triggerLocalizedSpell(skill.spellType, hoveredCoordinate.x, hoveredCoordinate.y);
                  if (succeeded) {
                    sim.addEventLog('MIRACLE', `Ã°Å¸â€Â¥ Intervened with miracle [${skill.name}] at (${hoveredCoordinate.x}, ${hoveredCoordinate.y})`);
                    if (skill.spellType.toLowerCase().includes('rain')) {
                      AudioEngine.playMiracleRain();
                    } else if (skill.spellType.toLowerCase().includes('meteor')) {
                      AudioEngine.playMiracleMeteor();
                    } else {
                      AudioEngine.playMiracleRift();
                    }
                  } else {
                    AudioEngine.playAlert();
                  }
                } else {
                  sim.addEventLog('SCHISM', `Cannot intervene: Miracle [${skill.name}] is locked. Unlock it in the progression path!`);
                  AudioEngine.playAlert();
                }
              } else {
                sim.addEventLog('SCHISM', `Insufficient devotion to invoke [${skill.name}]! (Need ${skill.devotionCost} ÃŽâ€)`);
                AudioEngine.playAlert();
              }
            } else {
              AudioEngine.playAlert();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedGod, hoveredCoordinate, unlockedSkills]);

  
  const getHoveredEntityThought = (ent: any) => {
    if (!ent) return '';
    const name = ent.components.society?.name?.split('[')[0]?.trim() || ent.components.fauna?.subType || ent.category;
    
    if (ent.components.society) {
      const state = ent.components.movement?.activityState;
      if (state === 'MOVING_TO_RESOURCE') return `${name} Gatherer: "Seeking rich bio-materials."`;
      if (state === 'PRAYING') return `${name} Worshipper: "Entreating the Sky Deity at the Altar."`;
      if (state === 'WANDERING') return `${name} Citizen: "Expanding our local perimeter."`;
      return `${name}: Observing dimensional ripples.`;
    }
    if (ent.components.fauna) {
      const state = ent.components.fauna.actionState;
      if (state === 'HUNTING') return `Dire Wolf: "Stalking the scent of nearby prey."`;
      if (state === 'GRAZING') return `Forest Stag: "Nibbling on nutrient crops."`;
      return `Wild Animal: Curiously exploring the sector.`;
    }
    if (ent.components.flora) {
      if (ent.components.flora.isHarvested) return `Harvested Stump: Nutrients slowly regenerating.`;
      return `Flora Reserve: Fully grown and harvestable.`;
    }
    if (ent.components.structure) {
      return `Ancient Altar: Emits cosmic focal energy (+${ent.components.structure.efficiency * 100}% Conversion).`;
    }
    return `Interactive Matrix Point.`;
  };

  const getSimulatedSocieties = () => {
    if (!ecsRef.current) return [];
    const list = ecsRef.current.getEntitiesWith(['society', 'faith', 'position', 'movement']);
    return list.map(e => {
      const soc = ecsRef.current.getComponent<Society>(e, 'society')!;
      const faith = ecsRef.current.getComponent<Faith>(e, 'faith')!;
      const pos = ecsRef.current.getComponent<Position>(e, 'position')!;
      const mv = ecsRef.current.getComponent<Movement>(e, 'movement')!;
      return { id: e, soc, faith, pos, mv };
    });
  };

  const changeRatio = (tId: string, role: 'gatherer' | 'hunter' | 'researcher' | 'acolyte', val: number) => {
    if (!ecsRef.current) return;
    const soc = ecsRef.current.getComponent<Society>(tId, 'society');
    if (!soc) return;
    
    const clamped = Math.max(0, Math.min(1.0, val));
    
    let rGatherer = soc.gathererRatio ?? 0.35;
    let rHunter = soc.hunterRatio ?? 0.15;
    let rResearcher = soc.researcherRatio ?? 0.20;
    let rAcolyte = soc.acolyteRatio ?? 0.30;
    
    if (role === 'gatherer') rGatherer = clamped;
    else if (role === 'hunter') rHunter = clamped;
    else if (role === 'researcher') rResearcher = clamped;
    else if (role === 'acolyte') rAcolyte = clamped;
    
    const otherSum = (role === 'gatherer' ? 0 : rGatherer) + 
                     (role === 'hunter' ? 0 : rHunter) + 
                     (role === 'researcher' ? 0 : rResearcher) + 
                     (role === 'acolyte' ? 0 : rAcolyte);
                      
    const targetRemainder = 1.0 - clamped;
    if (otherSum > 0) {
      const scale = targetRemainder / otherSum;
      if (role !== 'gatherer') rGatherer = Math.max(0, rGatherer * scale);
      if (role !== 'hunter') rHunter = Math.max(0, rHunter * scale);
      if (role !== 'researcher') rResearcher = Math.max(0, rResearcher * scale);
      if (role !== 'acolyte') rAcolyte = Math.max(0, rAcolyte * scale);
    } else {
      const count = 3;
      const splitObj = targetRemainder / count;
      if (role !== 'gatherer') rGatherer = splitObj;
      if (role !== 'hunter') rHunter = splitObj;
      if (role !== 'researcher') rResearcher = splitObj;
      if (role !== 'acolyte') rAcolyte = splitObj;
    }
    
    // Ensure precise sum of 1.0
    const finalSum = rGatherer + rHunter + rResearcher + rAcolyte;
    if (Math.abs(1.0 - finalSum) > 0.0001) {
      const diff = 1.0 - finalSum;
      if (role !== 'gatherer') rGatherer += diff;
      else rHunter += diff;
    }
    
    soc.gathererRatio = rGatherer;
    soc.hunterRatio = rHunter;
    soc.researcherRatio = rResearcher;
    soc.acolyteRatio = rAcolyte;
    
    // Force a React re-render of components
    setDevotion(Math.floor(simulationRef.current?.totalDevotion ?? 0));
  };

  const toggleRationMode = (tId: string) => {
    if (!ecsRef.current) return;
    const soc = ecsRef.current.getComponent<Society>(tId, 'society');
    if (soc) {
      soc.rationMode = !soc.rationMode;
      if (soc.rationMode && simulationRef.current) {
        simulationRef.current.addEventLog('EVOLUTION', `Rationing orders deployed in ${soc.name}. Food consumption decreased by 50%.`);
      }
      setDevotion(Math.floor(simulationRef.current?.totalDevotion ?? 0));
    }
  };

  const toggleStripMineMode = (tId: string) => {
    if (!ecsRef.current) return;
    const soc = ecsRef.current.getComponent<Society>(tId, 'society');
    if (soc) {
      soc.stripMineMode = !soc.stripMineMode;
      if (soc.stripMineMode && simulationRef.current) {
        simulationRef.current.addEventLog('SCHISM', `Intensive strip-mining ordered in ${soc.name}. Harvesting speed doubled, physical land decaying!`);
      }
      setDevotion(Math.floor(simulationRef.current?.totalDevotion ?? 0));
    }
  };

  const toggleTitheMode = (tId: string) => {
    if (!ecsRef.current) return;
    const soc = ecsRef.current.getComponent<Society>(tId, 'society');
    if (soc) {
      soc.titheMode = !soc.titheMode;
      if (soc.titheMode && simulationRef.current) {
        simulationRef.current.addEventLog('MIRACLE', `Ritual Tithes enabled in ${soc.name}. Excess resources converting down into raw Devotion.`);
      }
      setDevotion(Math.floor(simulationRef.current?.totalDevotion ?? 0));
    }
  };

  // Avoid closure stale states in PIXI listeners
  useEffect(() => {
    brushRef.current = activeBrush;
  }, [activeBrush]);

  // Load settings and save slots metadata upon initial mount
  useEffect(() => {
    // 1. Local Settings
    const savedSetStr = localStorage.getItem('cosmogenesis_settings_v1');
    if (savedSetStr) {
      try {
        const parsed = JSON.parse(savedSetStr);
        setSettings(prev => ({
          ...prev,
          ...parsed
        }));
        speedRef.current = parsed.gameSpeed ?? 1.0;
        setGameSpeed(parsed.gameSpeed ?? 1.0);
      } catch (e) {
        console.error("Failed to load settings from storage", e);
      }
    }

    // 2. Save slots metadata
    const loadedSlots: Record<number, any> = { 1: null, 2: null, 3: null };
    for (let slot = 1; slot <= 3; slot++) {
      const dataStr = localStorage.getItem(`cosmogenesis_save_slot_${slot}`);
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr);
          loadedSlots[slot] = {
            exists: true,
            name: parsed.name || `Cosmic Era Slot ${slot}`,
            timestamp: parsed.timestamp || new Date().toLocaleString(),
            population: parsed.population ?? 0,
            divineLevel: parsed.divineLevel ?? 1,
            weather: parsed.weather ?? 'CLEAR',
            devotion: Math.floor(parsed.devotion ?? parsed.totalDevotion ?? 100),
          };
        } catch (e) {
          console.error("Failed to load metadata for slot " + slot, e);
        }
      }
    }
    setSaveSlots(loadedSlots);
  }, []);

  useEffect(() => {
    console.log('[App Init] useEffect triggered, containerRef:', !!containerRef.current);
    if (!containerRef.current) {
      console.log('[App Init] No containerRef, returning early');
      return;
    }
    
    // Prevent double initialization in React StrictMode
    if ((containerRef.current as any).__initialized) {
      console.log('[App Init] Already initialized, skipping');
      return;
    }
    (containerRef.current as any).__initialized = true;

    const renderer = new GameRenderer(containerRef.current);
    rendererRef.current = renderer;
    (window as any).__renderer = renderer;
    let requestId: number;
    
    SimulationEngine.create(ecsRef.current).then(simulation => {
        simulationRef.current = simulation;
        coordinatorRef.current = new EngineCoordinator(ecsRef.current);
        coordinatorRef.current.init(simulation);
        coordinatorRef.current = new EngineCoordinator(ecsRef.current);
        coordinatorRef.current.init(simulation);

        // Load terrain maps upon startup
        renderer.init().then(async () => {
          const terrain = simulation.getTerrain();
          console.log('[World Gen] Starting... terrain size:', terrain?.length);
          renderer.drawTerrain(terrain);
          
          // Wait for simulation worker to finish initializing (prevents ECS overwrite)
          await new Promise(r => setTimeout(r, 500));
          
          // --- Populate Immersive Starter World ---
          // Creates a living, breathing world from the start
          const worldSize = terrain.length;
          
          // Helper: Get biome from height
          const getBiome = (h: number) => {
            if (h < 0.4) return 'COASTAL';
            if (h < 0.58) return 'PLAINS';
            if (h < 0.75) return 'FOREST';
            return 'HIGHLAND';
          };

          // Helper: Find tile in specific biome(s) with optional clustering
          const findTileInBiome = (biomes: string[], near?: { x: number, y: number, radius?: number }) => {
            let attempts = 0;
            while (attempts < 200) {
              let x: number, y: number;
              if (near && Math.random() < 0.7) {
                // 70% chance to spawn near reference point for clustering
                const r = (near.radius || 3) * Math.sqrt(Math.random());
                const theta = Math.random() * 2 * Math.PI;
                x = Math.round(near.x + r * Math.cos(theta));
                y = Math.round(near.y + r * Math.sin(theta));
              } else {
                x = Math.floor(Math.random() * worldSize);
                y = Math.floor(Math.random() * worldSize);
              }
              // Clamp to world bounds
              x = Math.max(0, Math.min(worldSize - 1, x));
              y = Math.max(0, Math.min(worldSize - 1, y));
              
              const height = terrain[y]?.[x] || 0;
              const biome = getBiome(height);
              if (biomes.includes(biome) && height >= 0.35 && height <= 0.85) {
                return { x, y, height, biome };
              }
              attempts++;
            }
            return null;
          };

          // Helper: Find any valid land tile (fallback)
          const findLandTile = () => {
            let attempts = 0;
            while (attempts < 100) {
              const x = Math.floor(Math.random() * worldSize);
              const y = Math.floor(Math.random() * worldSize);
              const height = terrain[y]?.[x] || 0;
              if (height >= 0.35 && height <= 0.85) {
                return { x, y, height, biome: getBiome(height) };
              }
              attempts++;
            }
            return null;
          };
          
          // 1. Spawn Diverse Tribes (4 different factions)
          const factions = ['ANIMIST', 'TECHNOCRAT', 'INTERVENTIONIST', 'NIHILIST'] as const;
          factions.forEach((faction) => {
            const tile = findLandTile();
            if (tile) {
              simulation.spawnTribe(tile.x, tile.y, faction);
              console.log(`[World Gen] Spawned ${faction} tribe at (${tile.x}, ${tile.y}) - ${getBiome(tile.height)}`);
            }
          });
          
          // 2. Spawn Flora - Biome-aware density
          // FOREST: Dense trees (40), some exotic, mushrooms
          // PLAINS: Sparse trees (10), crops, grasslands
          // COASTAL: Palm trees, sparse vegetation
          // HIGHLAND: Pine trees, sparse, rugged

          const forestTiles: Array<{ x: number, y: number }> = [];
          
          // FOREST biome - dense trees clustered together
          for (let i = 0; i < 40; i++) {
            const clusterCenter = i % 5 === 0 ? undefined : forestTiles[Math.floor(Math.random() * forestTiles.length)];
            const tile = findTileInBiome(['FOREST'], clusterCenter ? { x: clusterCenter.x, y: clusterCenter.y, radius: 4 } : undefined);
            if (tile) {
              const forestTypes = ['OAK', 'BIRCH', 'REDWOOD', 'WILLOW'];
              const type = forestTypes[Math.floor(Math.random() * forestTypes.length)];
              simulation.spawnFlora(tile.x, tile.y, 'TREE', type);
              if (i % 5 === 0) forestTiles.push(tile);
            }
          }
          // FOREST - mushrooms and glowshrooms
          for (let i = 0; i < 8; i++) {
            const tile = findTileInBiome(['FOREST']);
            if (tile) {
              simulation.spawnFlora(tile.x, tile.y, 'EXOTIC', 'GLOWSHROOM');
            }
          }

          // PLAINS biome - sparse trees, crops, open grass
          for (let i = 0; i < 12; i++) {
            const tile = findTileInBiome(['PLAINS']);
            if (tile) {
              const plainsTrees = ['OAK', 'WILLOW'];
              const type = plainsTrees[Math.floor(Math.random() * plainsTrees.length)];
              simulation.spawnFlora(tile.x, tile.y, 'TREE', type);
            }
          }
          // PLAINS - crops in fertile areas
          for (let i = 0; i < 15; i++) {
            const tile = findTileInBiome(['PLAINS']);
            if (tile) {
              const cropTypes = ['WHEAT', 'CORN', 'RICE', 'BERRY'];
              const type = cropTypes[Math.floor(Math.random() * cropTypes.length)];
              simulation.spawnFlora(tile.x, tile.y, 'CROP', type);
            }
          }

          // COASTAL biome - palm trees, sparse
          for (let i = 0; i < 8; i++) {
            const tile = findTileInBiome(['COASTAL']);
            if (tile) {
              simulation.spawnFlora(tile.x, tile.y, 'TREE', 'PALM');
            }
          }

          // HIGHLAND biome - rugged pines, cacti on edges
          for (let i = 0; i < 10; i++) {
            const tile = findTileInBiome(['HIGHLAND']);
            if (tile) {
              const highlandTypes = ['PINE', 'CACTUS'];
              const type = highlandTypes[Math.floor(Math.random() * highlandTypes.length)];
              simulation.spawnFlora(tile.x, tile.y, type === 'CACTUS' ? 'EXOTIC' : 'TREE', type);
            }
          }

          // Rare exotic plants scattered anywhere suitable
          for (let i = 0; i < 6; i++) {
            const tile = findLandTile();
            if (tile) {
              const exoticTypes = ['BAMBOO', 'GLOWSHROOM'];
              const type = exoticTypes[Math.floor(Math.random() * exoticTypes.length)];
              simulation.spawnFlora(tile.x, tile.y, 'EXOTIC', type);
            }
          }
          
          // 3. Spawn Wildlife - Biome-aware
          // FOREST: Stags, wolves (predator-prey)
          // PLAINS: Stags, occasional wolves
          // COASTAL: Sparse wildlife
          // HIGHLAND: Wolves (territorial)

          // Forest wildlife - dense populations
          for (let i = 0; i < 12; i++) {
            const tile = findTileInBiome(['FOREST']);
            if (tile) {
              const isWolf = Math.random() < 0.25;
              const type = isWolf ? 'DIRE_WOLF' : 'FOREST_STAG';
              simulation.spawnFauna(tile.x, tile.y, isWolf ? 'WOLF' : 'STAG', type);
            }
          }
          // Plains wildlife - moderate
          for (let i = 0; i < 8; i++) {
            const tile = findTileInBiome(['PLAINS']);
            if (tile) {
              const isWolf = Math.random() < 0.15;
              const type = isWolf ? 'DIRE_WOLF' : 'FOREST_STAG';
              simulation.spawnFauna(tile.x, tile.y, isWolf ? 'WOLF' : 'STAG', type);
            }
          }
          // Coastal wildlife - sparse
          for (let i = 0; i < 3; i++) {
            const tile = findTileInBiome(['COASTAL']);
            if (tile) {
              simulation.spawnFauna(tile.x, tile.y, 'STAG', 'FOREST_STAG');
            }
          }
          // Highland wildlife - wolves dominant
          for (let i = 0; i < 5; i++) {
            const tile = findTileInBiome(['HIGHLAND']);
            if (tile) {
              const isWolf = Math.random() < 0.6;
              const type = isWolf ? 'DIRE_WOLF' : 'FOREST_STAG';
              simulation.spawnFauna(tile.x, tile.y, isWolf ? 'WOLF' : 'STAG', type);
            }
          }
          
          // 4. Spawn Key Structures (6 landmarks)
          const structureTypes = [
            { name: 'CELESTIAL_OBSERVATORY', faction: 'TECHNOCRAT' },
            { name: 'NATURE_SHRINE', faction: 'ANIMIST' },
            { name: 'MEDITATION_TEMPLE', faction: 'INTERVENTIONIST' },
            { name: 'VOID_ALTAR', faction: 'NIHILIST' },
            { name: 'ELEMENTAL_FORGE', faction: 'ELEMENTAL' },
            { name: 'UNIVERSAL_HUB', faction: 'UNIVERSAL' }
          ];
          
          structureTypes.forEach(({ name, faction }) => {
            const tile = findLandTile();
            if (tile) {
              simulation.spawnStructure(tile.x, tile.y, 'ALTAR', name);
              console.log(`[World Gen] Placed ${name} at (${tile.x}, ${tile.y})`);
            }
          });
          
          // 5. Spawn Rare Nano-Bananas (8 mystical fruits)
          const bananaTypes = ['GOLD', 'CYBER', 'VOID', 'DIVINE', 'FIRE', 'FROST'];
          for (let i = 0; i < 8; i++) {
            const tile = findLandTile();
            if (tile && tile.height >= 0.5) {
              const type = bananaTypes[Math.floor(Math.random() * bananaTypes.length)];
              simulation.spawnFlora(tile.x, tile.y, 'NANO_BANANA', type);
            }
          }
          
          console.log('[World Gen] Immersive starter world populated! Ã°Å¸Å’ÂÃ¢Å“Â¨');
          
          // Wait for WASM worker to process all spawn commands
          await new Promise(r => setTimeout(r, 1000));
          console.log('[World Gen] Entities should now be in ECS');
        });

        // Wire up map interactions with the simulation engine
        renderer.onTileHover = (gx, gy) => {
            setHoveredCoordinate({ x: gx, y: gy });
            const sim = simulationRef.current;
            if (sim) {
                setHoveredEntity(sim.getEntityAt(gx, gy));
            } else {
                setHoveredEntity(null);
            }
        };

        renderer.onTileClick = (gx, gy) => {
          const sim = simulationRef.current;
          if (!sim) return;
          const brush = brushRef.current;

          if (brush.category === 'INSPECT') {
            const ent = sim.getEntityAt(gx, gy);
            if (ent) {
              renderer.selectedEntityId = ent.id;
              setSelectedEntity(ent);
            } else {
              renderer.selectedEntityId = null;
              setSelectedEntity(null);
            }
          } else if (brush.category === 'SPAWN_BANANA') {
            const id = sim.spawnFlora(gx, gy, 'NANO_BANANA', brush.subType);
            sim.addEventLog('EVOLUTION', `Deity manifested a new [${brush.subType} Nano Banana] at (${gx}, ${gy})`);
            const ent = sim.getEntityAt(gx, gy);
            if (ent) {
              renderer.selectedEntityId = ent.id;
              setSelectedEntity(ent);
            }
          } else if (brush.category === 'SPAWN_FAUNA') {
            const isWolf = brush.subType.toLowerCase().includes('wolf');
            const id = sim.spawnFauna(gx, gy, isWolf ? 'WOLF' : 'STAG', brush.subType);
            sim.addEventLog('EVOLUTION', `Deity materialised a wild [${brush.subType}] at coordinate (${gx}, ${gy})`);
            const ent = sim.getEntityAt(gx, gy);
            if (ent) {
              renderer.selectedEntityId = ent.id;
              setSelectedEntity(ent);
            }
          } else if (brush.category === 'SPAWN_STRUCTURE') {
            const id = sim.spawnStructure(gx, gy, 'ALTAR', brush.subType);
            sim.addEventLog('EVOLUTION', `Deity erected a historical [${brush.subType}] at coordinate (${gx}, ${gy})`);
            const ent = sim.getEntityAt(gx, gy);
            if (ent) {
              renderer.selectedEntityId = ent.id;
              setSelectedEntity(ent);
            }
          } else if (brush.category === 'SPAWN_TRIBE') {
            const id = sim.spawnTribe(gx, gy, brush.subType as any);
            const ent = sim.getEntityAt(gx, gy);
            if (ent) {
              renderer.selectedEntityId = ent.id;
              setSelectedEntity(ent);
            }
          } else if (brush.category === 'LOCALISED_SPELL') {
            const succeeded = sim.triggerLocalizedSpell(brush.subType, gx, gy);
            if (succeeded) {
              const ent = sim.getEntityAt(gx, gy);
              if (ent) {
                setSelectedEntity(ent);
              } else {
                setSelectedEntity(null);
                renderer.selectedEntityId = null;
              }
            }
          }
        };

        // --- Double-click to Zoom and Focus ---
        // Double-clicking any terrain cell zooms in and centers the camera on it
        renderer.onTileDoubleClick = (gx: number, gy: number) => {
          // Use the renderer's built-in animation method
          // Zooms to 2.5x and centers on tile over 400ms with cubic easing
          renderer.animateToTile(gx, gy, 2.5, 400);
          
          // After animation completes, update UI state
          const sim = simulationRef.current;
          if (sim) {
            const ent = sim.getEntityAt(gx, gy);
            if (ent) {
              renderer.selectedEntityId = ent.id;
              setSelectedEntity(ent);
            }
            setHoveredCoordinate({ x: gx, y: gy });
            setHoveredEntity(ent);
          }
        };

    // --- Context-Aware Dynamic Effects Calibration ---
    // Effects adapt to: zoom level, visible entity density, weather intensity, time of day
    renderer.onZoomChange = (z: number) => {
      if (!appRootRef.current) return;
      
      const currentSettings = settingsRef.current;
      const sim = simulationRef.current;
      
      // Gather view context
      const entityDensity = sim ? Math.min(1.0, sim.getAllEntitiesForRender().length / 50) : 0;
      const weatherIntensity = sim ? (sim.weatherIntensity || 0.5) : 0.5;
      const isStormy = sim ? ['Tempest', 'Meteor', 'Drought'].includes(sim.weather) : false;
      const timeOfDay = sim ? (sim.timeOfDay || 0.5) : 0.5; // 0=dawn, 0.5=noon, 1=midnight
      const isNight = timeOfDay < 0.2 || timeOfDay > 0.8;
      
      // Zoom factors (log2 scale: -2.7 to +2.3 typical range)
      const zoomLog = Math.abs(Math.log2(z));
      const zoomFactor = 0.6 + zoomLog * 0.9;
      
      // Context multipliers
      const weatherFactor = isStormy ? 1.3 : (1.0 + weatherIntensity * 0.2);
      const nightFactor = isNight ? 1.25 : 1.0;
      const densityFactor = 1.0 - entityDensity * 0.3; // Reduce effects when crowded
      
      // --- Cinematic Focal-Plane DoF ---
      // Based on: Circle of Confusion increases with distance from focal plane
      // Near blur (foreground): increases faster than far blur (NVIDIA GPU Gems approach)
      // Far blur (background): increases more gradually
      const baseDof = currentSettings.dofBlur;
      
      // Calculate blur based on zoom and context
      // At zoom=1 (normal): moderate blur
      // At zoom extremes: stronger blur for cinematic effect
      const nearBlur = currentSettings.dofEnable 
        ? Math.max(0, baseDof * zoomFactor * weatherFactor * densityFactor * 0.6) // Near blur is 60% of base
        : 0;
      const farBlur = currentSettings.dofEnable
        ? Math.max(0, baseDof * zoomFactor * weatherFactor * densityFactor * 1.0) // Far blur is 100% of base
        : 0;
      
      // Focal plane shifts with zoom (when zoomed in, focus closer; zoomed out, focus farther)
      const focalShift = Math.max(-15, Math.min(15, (z - 1) * 10)); // +/- 15% shift
      const focalStart = `${40 + focalShift}%`;
      const focalCenter = `${50 + focalShift}%`;
      const focalEnd = `${60 + focalShift}%`;

      // --- Dynamic Chromatic Aberration: increases at zoom extremes, during storms ---
      const baseChromatic = currentSettings.chromaticAberrationOffset;
      const chromVal = currentSettings.chromaticAberrationEnable
        ? Math.max(0, baseChromatic * (0.5 + zoomLog * 1.1) * weatherFactor * nightFactor)
        : 0;

      // --- Dynamic Vignette: stronger at night, darker in storms ---
      const baseVignette = currentSettings.vignetteIntensity;
      const vigVal = currentSettings.vignetteEnable
        ? Math.min(0.95, baseVignette * (0.7 + zoomLog * 0.15) * nightFactor * weatherFactor)
        : 0;

      // --- Dynamic Lens Dirt: more visible in bright conditions, zoomed in ---
      const baseDirt = currentSettings.lensDirtAlpha;
      const dirtVal = currentSettings.lensFlareEnable
        ? Math.min(1.0, baseDirt * (0.6 + zoomLog * 0.25) * (isNight ? 0.6 : 1.0))
        : 0;

      // --- Dynamic Ambient/Bloom: brighter during day, blooms more at night ---
      const baseAmbient = currentSettings.ambientLevel;
      const ambientVal = isNight 
        ? baseAmbient * 0.7 // Darker at night
        : baseAmbient * (1.0 + (1 - weatherIntensity) * 0.2); // Brighter in clear weather

      appRootRef.current.style.setProperty('--dof-near-blur', `${nearBlur}px`);
      appRootRef.current.style.setProperty('--dof-far-blur', `${farBlur}px`);
      appRootRef.current.style.setProperty('--focal-start', focalStart);
      appRootRef.current.style.setProperty('--focal-center', focalCenter);
      appRootRef.current.style.setProperty('--focal-end', focalEnd);
      appRootRef.current.style.setProperty('--vignette-intensity-dynamic', vigVal.toString());
      appRootRef.current.style.setProperty('--dirt-alpha-dynamic', dirtVal.toString());
      appRootRef.current.style.setProperty('--camera-zoom-level', z.toString());
      appRootRef.current.style.setProperty('--ambient-dynamic', ambientVal.toString());

      const feOffsetRed = document.getElementById('ca-offset-red');
      const feOffsetBlue = document.getElementById('ca-offset-blue');
      if (feOffsetRed) feOffsetRed.setAttribute('dx', chromVal.toFixed(2));
      if (feOffsetBlue) feOffsetBlue.setAttribute('dx', (-chromVal).toFixed(2));

      const feBlur = document.getElementById('bloom-blur-node');
      if (feBlur) {
        const bloomVal = currentSettings.bloomEnable
          ? Math.max(0.4, currentSettings.bloomIntensity * (0.6 + zoomLog * 0.45) * nightFactor)
          : 0;
        feBlur.setAttribute('stdDeviation', (bloomVal * 2.8).toFixed(2));
      }
      
      // Sync dynamic ambient to renderer
      if (renderer) {
        renderer.ambientColor[0] = ambientVal;
        renderer.ambientColor[1] = ambientVal;
        renderer.ambientColor[2] = ambientVal + 0.05;
      }
    };

    // Trigger initial calculation
    renderer.onZoomChange(renderer.zoom);

    let lastTime = performance.now();
    const frame = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Adaptive background drone synthesis updates
      if (selectedGod) {
        AudioEngine.updateAdaptiveDrone(selectedGod.faction.toLowerCase() as any, renderer.zoom);
      } else {
        AudioEngine.updateAdaptiveDrone('space', renderer.zoom);
      }

      setDevotion(Math.floor(simulation.totalDevotion));
      setWeatherInfo({
        weather: simulation.weather,
        timeLeft: simulation.weatherTimeLeft,
        timer: simulation.weatherTimer,
        temperature: simulation.globalTemperature,
        humidity: simulation.globalHumidity
      });

      // Gather ECS components data in high real-time sync with renderer elements
      const entityDataForRenderer: any[] = [];
      let totalPop = 0;
      let sumTech = 0;
      let scCount = 0;
      const faithCounts: Record<string, number> = {};

      // 1. Fetch Tribes
      const societies = ecsRef.current.getEntitiesWith(['society', 'faith', 'position', 'movement']);
      const floras = ecsRef.current.getEntitiesWith(['flora', 'position']);
      const faunas = ecsRef.current.getEntitiesWith(['fauna', 'position']);
      const structures = ecsRef.current.getEntitiesWith(['structure', 'position']);
      
      societies.forEach(e => {
        const soc = ecsRef.current.getComponent<Society>(e, 'society')!;
        const faith = ecsRef.current.getComponent<Faith>(e, 'faith')!;
        const pos = ecsRef.current.getComponent<Position>(e, 'position')!;
        const mv = ecsRef.current.getComponent<Movement>(e, 'movement')!;

        totalPop += Math.floor(soc.population);
        sumTech += soc.technologyLevel;
        scCount++;
        faithCounts[faith.dominantSystem] = (faithCounts[faith.dominantSystem] || 0) + 1;
        entityDataForRenderer.push({
          id: e,
          x: pos.x,
          y: pos.y,
          category: 'Tribe',
          subType: soc.faction,
          name: soc.name,
          faction: soc.faction,
          activityState: mv?.activityState,
          population: Math.floor(soc.population),
          resources: Math.floor(soc.resources)
        });
      });

      // 2. Process Floras
      floras.forEach(e => {
        const flo = ecsRef.current.getComponent<Flora>(e, 'flora')!;
        const pos = ecsRef.current.getComponent<Position>(e, 'position')!;
        entityDataForRenderer.push({
          id: e,
          x: pos.x,
          y: pos.y,
          category: 'Flora',
          subType: flo.subType,
          name: flo.category,
          growth: flo.growth
        });
      });

      // 3. Process Faunas (Beasts)
      faunas.forEach(e => {
        const fau = ecsRef.current.getComponent<Fauna>(e, 'fauna')!;
        const pos = ecsRef.current.getComponent<Position>(e, 'position')!;
        entityDataForRenderer.push({
          id: e,
          x: pos.x,
          y: pos.y,
          category: 'Fauna',
          subType: fau.subType,
          name: fau.category
        });
      });

      // 4. Process Structures
      structures.forEach(e => {
        const str = ecsRef.current.getComponent<Structure>(e, 'structure')!;
        const pos = ecsRef.current.getComponent<Position>(e, 'position')!;
        entityDataForRenderer.push({
          id: e,
          x: pos.x,
          y: pos.y,
          category: 'Structure',
          subType: str.subType,
          name: str.category
        });
      });

      setStats({ 
        population: totalPop, 
        religions: faithCounts, 
        techAverage: scCount > 0 ? (sumTech / scCount) : 1.0 
      });

      // Sync Visual Matrix (Phase 1, Step 1)
      if (renderer) {
        renderer.sunDirection[0] = settingsRef.current.sunDirX;
        renderer.sunDirection[1] = settingsRef.current.sunDirY;
        renderer.godRayIntensity = settingsRef.current.godRayIntensity;
        renderer.batterySaver = settingsRef.current.batterySaver;
      }
      
      // Periodic context-aware effect update (every ~1 second at 60fps)
      // Adapts effects to weather changes, time of day, entity density
      if (renderer && Math.floor(time / 16) % 60 === 0) {
        renderer.onZoomChange(renderer.zoom);
      }

      const activeSpeed = showStartMenuRef.current ? 0.0 : speedRef.current;
      // Throttling logic (Phase 2, Step 5)
      if (!settingsRef.current.batterySaver || (Math.floor(time / 16) % 2 === 0)) {
        simulation.update(dt * activeSpeed);
      if (coordinatorRef.current) {
        coordinatorRef.current.update(dt * activeSpeed);
      }
      if (coordinatorRef.current) {
        coordinatorRef.current.update(dt * activeSpeed, time);
      }
      }

      // Sync entities to renderer every frame
      const currentRenderer = rendererRef.current;
      if (currentRenderer) {
        if (Math.floor(time / 16) % 60 === 0) {
          const ecsDebug = {
            societies: societies.length, 
            floras: floras.length, 
            faunas: faunas.length, 
            structures: structures.length,
            totalInArray: entityDataForRenderer.length
          };
          console.log('[App Entity Debug]', JSON.stringify(ecsDebug));
        }
        currentRenderer.updateEntities(entityDataForRenderer, simulation.entityDataView);
      }

      // Synchronize progression levels & statistics
      setProgression({
        level: simulation.divineLevel,
        xp: simulation.divineXP,
        xpNeeded: simulation.divineXPNeeded,
        illuminationPoints: simulation.illuminationPoints,
        unlockedIlluminations: [...simulation.unlockedIlluminations],
        actionsCompleted: { ...simulation.actionsCompleted }
      });

      // Synchronize state event logs array (realtime engine feeds)
      setLogs([...simulation.eventLogs]);

      requestAnimationFrame(frame);
    };

    // Start game loop only after renderer is fully initialized
    console.log('[App Init] Starting game loop');
    requestId = requestAnimationFrame(frame);

    }); // closes renderer.init().then()

    return () => {
      console.log('[App Init] Cleanup running, canceling animation frame:', requestId);
      cancelAnimationFrame(requestId);
      // Only destroy if this is the same initialization (not a React StrictMode double-mount)
      if (containerRef.current && (containerRef.current as any).__initialized && rendererRef.current === renderer) {
        console.log('[App Init] Destroying renderer');
        renderer.destroy();
        (containerRef.current as any).__initialized = false;
      }
    };
  }, []);

  const handleIntervention = (type: string) => {
    // Triggers localized divine magic at a random active tribe coordinates!
    const sim = simulationRef.current;
    if (!sim) return;

    const tribes = ecsRef.current.getEntitiesWith(['society', 'position']);
    let tx = 32;
    let ty = 32;
    if (tribes.length > 0) {
      const idx = Math.floor(Math.random() * tribes.length);
      const pos = ecsRef.current.getComponent<Position>(tribes[idx], 'position')!;
      tx = Math.round(pos.x);
      ty = Math.round(pos.y);
    }

    const castType = type === 'Rainfall' ? 'Rainfall' : 'Meteor';
    sim.triggerLocalizedSpell(castType, tx, ty);
    setLogs([...sim.eventLogs]);
  };

  const unlockIllumination = (boostId: string) => {
    const sim = simulationRef.current;
    if (!sim) return;
    if (sim.illuminationPoints <= 0) return;
    if (sim.unlockedIlluminations.includes(boostId)) return;

    sim.illuminationPoints -= 1;
    sim.unlockedIlluminations.push(boostId);
    sim.addEventLog('MIRACLE', `Ã°Å¸Å’Å¸ DIVINE ILLUMINATION: Mastered cosmic passive boost "${boostId.replace('_',' ')}"!`);

    // Force synchronize immediate states
    setDevotion(Math.floor(sim.totalDevotion));
    setProgression({
      level: sim.divineLevel,
      xp: sim.divineXP,
      xpNeeded: sim.divineXPNeeded,
      illuminationPoints: sim.illuminationPoints,
      unlockedIlluminations: [...sim.unlockedIlluminations],
      actionsCompleted: { ...sim.actionsCompleted }
    });
    setLogs([...sim.eventLogs]);
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('cosmogenesis_settings_v1', JSON.stringify(updated));

    if (key === 'gameSpeed') {
      speedRef.current = value;
      setGameSpeed(value);
      simulationRef.current?.addEventLog('EVOLUTION', `Ã¢Å¡â„¢Ã¯Â¸Â CHRONOMETER SYSTEM: Local target operational speed set to ${value}x.`);
    }
  };

  const saveGame = (slot: number) => {
    const sim = simulationRef.current;
    if (!sim) return;

    const slotName = prompt(`Enter a timeline name for Slot ${slot}:`, saveSlots[slot]?.name || `Alpha Convergence Node ${slot}`);
    if (slotName === null) return; // cancel prompt

    const engineState = sim.exportState();
    const saveData = {
      name: slotName || `Alpha Convergence Node ${slot}`,
      timestamp: new Date().toLocaleString(),
      population: stats.population,
      divineLevel: sim.divineLevel,
      weather: sim.weather,
      devotion: Math.floor(sim.totalDevotion),
      engineState
    };

    localStorage.setItem(`cosmogenesis_save_slot_${slot}`, JSON.stringify(saveData));

    // Refresh state slots info
    setSaveSlots(prev => ({
      ...prev,
      [slot]: {
        exists: true,
        name: saveData.name,
        timestamp: saveData.timestamp,
        population: saveData.population,
        divineLevel: saveData.divineLevel,
        weather: saveData.weather,
        devotion: saveData.devotion
      }
    }));

    sim.addEventLog('MIRACLE', `Ã°Å¸â€™Â¾ TIMELINE COMMITTED: Captured current quantum sector state into Chronite Slot ${slot}.`);
  };

  const loadGame = (slot: number) => {
    const sim = simulationRef.current;
    if (!sim) return;

    const dataStr = localStorage.getItem(`cosmogenesis_save_slot_${slot}`);
    if (!dataStr) return;

    try {
      const parsed = JSON.parse(dataStr);
      if (parsed.engineState) {
        sim.importState(parsed.engineState);

        // Force react update
        setDevotion(Math.floor(sim.totalDevotion));
        setProgression({
          level: sim.divineLevel,
          xp: sim.divineXP,
          xpNeeded: sim.divineXPNeeded,
          illuminationPoints: sim.illuminationPoints,
          unlockedIlluminations: [...sim.unlockedIlluminations],
          actionsCompleted: { ...sim.actionsCompleted }
        });
        setWeatherInfo({
          weather: sim.weather,
          timeLeft: sim.weatherTimeLeft,
          timer: sim.weatherTimer,
          temperature: sim.globalTemperature,
          humidity: sim.globalHumidity
        });
        setLogs([...sim.eventLogs]);

        const selectedGodObject = GODS_PANTHEON.find(g => g.id === sim.activeGodId);
        if (selectedGodObject) {
          setSelectedGod(selectedGodObject);
        }

        if (rendererRef.current) {
          rendererRef.current.drawTerrain(sim.getTerrain());
        }

        sim.addEventLog('MIRACLE', `Ã°Å¸Å’Å’ TIMELINE RESTORED: Slipped local workspace into Chronite Slot ${slot} ["${parsed.name}"].`);
        
        setShowStartMenu(false);
        setActiveTab('simulation');
      }
    } catch (e) {
      alert("Failed to load timeline: " + e);
    }
  };

  const deleteGameSave = (slot: number) => {
    if (!confirm(`Are you sure you want to clean slot ${slot}? This action is irreversible.`)) return;
    localStorage.removeItem(`cosmogenesis_save_slot_${slot}`);
    setSaveSlots(prev => ({
      ...prev,
      [slot]: null
    }));
    simulationRef.current?.addEventLog('SCHISM', `Ã°Å¸â€”â€˜Ã¯Â¸Â CHRONITE EXPUNGED: Purged timeline data for Slot ${slot}.`);
  };

  const exportStateToJSON = () => {
    const sim = simulationRef.current;
    if (!sim) return;
    const engineState = sim.exportState();
    const rawData = {
      name: `External Portal Snapshot`,
      timestamp: new Date().toLocaleString(),
      population: stats.population,
      divineLevel: sim.divineLevel,
      weather: sim.weather,
      devotion: Math.floor(sim.totalDevotion),
      engineState
    };
    const str = JSON.stringify(rawData);
    navigator.clipboard.writeText(str).then(() => {
      alert("Space-time state copied directly to operating system clipboard!");
    }).catch(err => {
      console.log(err);
      prompt("Clipboard access blocked. Please manually copy the universe data below:", str);
    });
  };

  const importStateFromJSON = () => {
    const jsonStr = prompt("Paste your exported Chronogenesis JSON data string below:");
    if (!jsonStr) return;
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.engineState && simulationRef.current) {
        simulationRef.current.importState(parsed.engineState);
        const sim = simulationRef.current;
        setDevotion(Math.floor(sim.totalDevotion));
        setProgression({
          level: sim.divineLevel,
          xp: sim.divineXP,
          xpNeeded: sim.divineXPNeeded,
          illuminationPoints: sim.illuminationPoints,
          unlockedIlluminations: [...sim.unlockedIlluminations],
          actionsCompleted: { ...sim.actionsCompleted }
        });
        setWeatherInfo({
          weather: sim.weather,
          timeLeft: sim.weatherTimeLeft,
          timer: sim.weatherTimer,
          temperature: sim.globalTemperature,
          humidity: sim.globalHumidity
        });
        setLogs([...sim.eventLogs]);
        
        const selectedGodObject = GODS_PANTHEON.find(g => g.id === sim.activeGodId);
        if (selectedGodObject) {
          setSelectedGod(selectedGodObject);
        }

        if (rendererRef.current) {
          rendererRef.current.drawTerrain(sim.getTerrain());
        }

        sim.addEventLog('MIRACLE', `Ã°Å¸â€ºÂ¸ QUANTUM PORTAL IMPORT: Loaded universe snapshot.`);
        setShowStartMenu(false);
        setActiveTab('simulation');
      } else {
        alert("Invalid snapshot format! Verify file components.");
      }
    } catch (e) {
      alert("Failed to parse timeline string alignment levels: " + e);
    }
  };

  const resetSimulation = () => {
    if (!confirm("Are you absolutely sure you want to reset the entire biosphere sector? This wipes all simulated societies, stags, and crops.")) return;
    const sim = simulationRef.current;
    if (sim) {
      ecsRef.current.clear();
      const newSim = new SimulationEngine(ecsRef.current);
      simulationRef.current = newSim;

      setDevotion(Math.floor(newSim.totalDevotion));
      setProgression({
        level: newSim.divineLevel,
        xp: newSim.divineXP,
        xpNeeded: newSim.divineXPNeeded,
        illuminationPoints: newSim.illuminationPoints,
        unlockedIlluminations: [...newSim.unlockedIlluminations],
        actionsCompleted: { ...newSim.actionsCompleted }
      });
      setWeatherInfo({
        weather: newSim.weather,
        timeLeft: newSim.weatherTimeLeft,
        timer: newSim.weatherTimer,
        temperature: newSim.globalTemperature,
        humidity: newSim.globalHumidity
      });
      setLogs([...newSim.eventLogs]);
      setSelectedGod(null);

      if (rendererRef.current) {
        rendererRef.current.drawTerrain(newSim.getTerrain());
      }

      setShowStartMenu(false);
      setActiveTab('simulation');
      
      newSim.addEventLog('MIRACLE', 'Ã°Å¸Â§Â¬ SECTOR HARD-RESET COMPLETE: Thermodynamic properties and biological spores re-generated.');
    }
  };

  // Render calculated CSS & SVG post-process camera filters
  const getCameraStyleFilters = () => {
    const filterTokens: string[] = [];

    // Part A: Game Themes
    if (settings.visualTheme === 'monochrome') filterTokens.push('grayscale(100%) contrast(110%) brightness(90%)');
    else if (settings.visualTheme === 'cyberpunk') filterTokens.push('hue-rotate(140deg) saturate(165%) contrast(115%)');
    else if (settings.visualTheme === 'amber') filterTokens.push('sepia(100%) hue-rotate(340deg) saturate(300%) contrast(105%) brightness(90%)');
    else if (settings.visualTheme === 'sepia') filterTokens.push('sepia(100%) saturate(85%) contrast(95%)');

    // Part B: Physical Color Grading LUTs
    if (settings.colorGrading === 'vibrant') filterTokens.push('saturate(1.4) contrast(1.1) brightness(1.02)');
    else if (settings.colorGrading === 'cold') filterTokens.push('hue-rotate(185deg) saturate(0.8) contrast(1.05) brightness(0.95) sepia(0.08)');
    else if (settings.colorGrading === 'cinematic') filterTokens.push('contrast(1.18) brightness(0.95) saturate(1.1) sepia(0.12)');
    else if (settings.colorGrading === 'warm') filterTokens.push('sepia(0.32) saturate(1.23) contrast(1.04)');
    else if (settings.colorGrading === 'matrix') filterTokens.push('hue-rotate(85deg) saturate(1.1) contrast(1.25) brightness(0.83)');
    else if (settings.colorGrading === 'neon') filterTokens.push('saturate(1.7) contrast(1.25) hue-rotate(15deg) brightness(1.03)');

    // Part C: SVG filters chain
    if (settings.chromaticAberrationEnable) filterTokens.push('url(#chromatic-aberration-filter)');
    if (settings.bloomEnable) filterTokens.push('url(#bloom-filter)');

    return filterTokens.join(' ');
  };

  return (
    <div 
      ref={appRootRef}
      className="relative w-screen h-screen bg-[#020305] text-slate-300 font-sans overflow-hidden select-none flex flex-col"
      style={{
        '--dof-near-blur': `${settings.dofEnable ? settings.dofBlur * 0.8 : 0}px`,
        '--dof-far-blur': `${settings.dofEnable ? settings.dofBlur : 0}px`,
        '--focal-start': '40%',
        '--focal-center': '50%',
        '--focal-end': '60%',
        '--vignette-intensity-dynamic': `${settings.vignetteEnable ? settings.vignetteIntensity : 0}`,
        '--dirt-alpha-dynamic': `${settings.lensFlareEnable ? settings.lensDirtAlpha : 0}`,
        '--camera-zoom-level': '1.0'
      } as React.CSSProperties}
    >
      {/* Dynamic Advanced Hardware-Accelerated SVG Filters definitions for camera effects */}
      <svg className="absolute w-0 h-0 pointer-events-none select-none overflow-hidden">
        <defs>
          {settings.chromaticAberrationEnable && (
            <filter id="chromatic-aberration-filter">
              <feOffset id="ca-offset-red" in="SourceGraphic" dx={settings.chromaticAberrationOffset} dy="0" result="redChannel" />
              <feOffset id="ca-offset-blue" in="SourceGraphic" dx={-settings.chromaticAberrationOffset} dy="0" result="blueChannel" />
              <feColorMatrix in="redChannel" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="redMatrix" />
              <feColorMatrix in="blueChannel" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blueGreenMatrix" />
              <feBlend mode="screen" in="redMatrix" in2="blueGreenMatrix" result="colored" />
              <feBlend mode="normal" in="colored" in2="SourceGraphic" />
            </filter>
          )}
          {settings.bloomEnable && (
            <filter id="bloom-filter">
              <feColorMatrix type="matrix" values="
                1.5 0 0 0 -0.55
                0 1.5 0 0 -0.55
                0 0 1.5 0 -0.55
                0 0 0 1 0" in="SourceGraphic" result="brights" />
              <feGaussianBlur id="bloom-blur-node" stdDeviation={settings.bloomIntensity * 2.8} in="brights" result="blurred" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="blurred" />
              </feMerge>
            </filter>
          )}
        </defs>
      </svg>
 
      {/* Full screen PIXI Canvas container background */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0 transition-all duration-500"
        style={{ /* filter: getCameraStyleFilters() */ }}
      />
 
      {/* Layer 1: Cinematic Focal-Plane Depth of Field */}
      {/* 
        Proper cinematic DoF with:
        - Focal plane: Sharp focus region at configurable Y position
        - Near blur: Foreground blur increases with distance from focal plane
        - Far blur: Background blur increases with distance from focal plane
        - Circle of Confusion: Non-linear blur falloff for realistic lens behavior
      */}
      {/* DoF temporarily disabled for debugging
      {settings.dofEnable && (
        <>
          <div className="absolute inset-0 pointer-events-none z-[1]" style={{ backdropFilter: 'blur(calc(var(--dof-near-blur, 0px) * 0.5))', WebkitBackdropFilter: 'blur(calc(var(--dof-near-blur, 0px) * 0.5))', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) var(--focal-start, 45%), rgba(0,0,0,1) var(--focal-center, 55%), rgba(0,0,0,1) 100%)', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) var(--focal-start, 45%), rgba(0,0,0,1) var(--focal-center, 55%), rgba(0,0,0,1) 100%)' }} />
          <div className="absolute inset-0 pointer-events-none z-[1]" style={{ backdropFilter: 'blur(var(--dof-far-blur, 0px))', WebkitBackdropFilter: 'blur(var(--dof-far-blur, 0px))', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) var(--focal-center, 45%), rgba(0,0,0,0) var(--focal-end, 55%), rgba(0,0,0,0) 100%)', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) var(--focal-center, 45%), rgba(0,0,0,0) var(--focal-end, 55%), rgba(0,0,0,0) 100%)' }} />
          <div className="absolute inset-0 pointer-events-none z-[1]" style={{ backdropFilter: 'blur(calc(var(--dof-near-blur, 0px) * 1.5))', WebkitBackdropFilter: 'blur(calc(var(--dof-near-blur, 0px) * 1.5))', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 65%, rgba(0,0,0,1) 85%, rgba(0,0,0,1) 100%)', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 65%, rgba(0,0,0,1) 85%, rgba(0,0,0,1) 100%)' }} />
        </>
      )} */}
 
      {/* Layer 2: Outer Border Vignette shadow - DISABLED for debugging
      {settings.vignetteEnable && (
        <div className="absolute inset-0 pointer-events-none z-[2]" style={{ background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,var(--vignette-intensity-dynamic, 0.65)) 100%)', mixBlendMode: 'multiply' }} />
      )} */}
 
      {/* Layer 3: Screen Dirt & Glass Smudges */}
      {settings.lensFlareEnable && (
        <div 
          className="absolute inset-0 pointer-events-none z-[3] overflow-hidden"
          style={{ opacity: 'var(--dirt-alpha-dynamic, 0.35)' }}
        >
          <svg className="w-full h-full text-white/[0.04]" fill="currentColor">
            <ellipse cx="22%" cy="28%" rx="95" ry="50" className="blur-2xl opacity-10" />
            <ellipse cx="80%" cy="72%" rx="145" ry="70" className="blur-3xl opacity-15 text-sky-200/5" />
            <circle cx="12%" cy="63%" r="1.5" className="opacity-55 text-yellow-100/25 blur-[0.5px]" />
            <circle cx="48%" cy="18%" r="2" className="opacity-45 text-white/35 blur-[0.5px]" />
            <circle cx="73%" cy="42%" r="1" className="opacity-60 text-slate-100/40" />
            <circle cx="85%" cy="15%" r="2.8" className="opacity-35 text-rose-100/25 blur-[1px]" />
            <circle cx="31%" cy="81%" r="1.2" className="opacity-45 text-emerald-100/35" />
          </svg>
        </div>
      )}

      {/* Layer 4: Solar Diagonal Lens Flare Refraction Orbs */}
      {settings.lensFlareEnable && (
        <div className="absolute inset-0 pointer-events-none z-[4] overflow-hidden">
          <div 
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-60"
            style={{
              background: 'radial-gradient(circle, rgba(253, 224, 71, 0.45) 0%, rgba(244, 63, 94, 0.15) 30%, rgba(99, 102, 241, 0.05) 55%, transparent 80%)',
              mixBlendMode: 'screen'
            }} 
          />
          <div 
            className="absolute top-[28%] right-[32%] w-16 h-16 rounded-full opacity-40 blur-[1px]"
            style={{
              background: 'radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, rgba(14, 165, 233, 0.05) 60%, transparent 100%)',
              mixBlendMode: 'screen'
            }}
          />
          <div 
            className="absolute top-[42%] right-[48%] w-10 h-10 rounded-full opacity-35 blur-[2px]"
            style={{
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.02) 70%, transparent 100%)',
              mixBlendMode: 'screen'
            }}
          />
          <div 
            className="absolute top-[58%] right-[62%] w-24 h-24 rounded-full opacity-45 blur-[0.5px]"
            style={{
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0) 80%)',
              mixBlendMode: 'screen'
            }}
          />
          <div 
            className="absolute top-[72%] right-[76%] w-32 h-32 rounded-full opacity-50 blur-[1.5px] border border-fuchsia-500/5"
            style={{
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0) 90%)'
            }}
          />
          <div 
            className="absolute top-[35%] left-[-15%] w-[130%] h-[2px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent rotate-[-12deg]"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* Primary Floating Deity UI Overlay Layer (clicks stream through empty gaps) */}
      <div className={`absolute inset-0 z-10 pointer-events-none flex ${isMobile ? 'flex-col-reverse' : 'flex-col'} h-full overflow-hidden`}>
        
        {/* Navigation Layer (Rail on Desktop, Bar on Mobile) */}
        {!isMobile ? (
          /* Top Status Bar (Desktop) */
          <GlassPanel 
            intensity="medium"
            className="h-16 m-4 px-6 flex items-center justify-between pointer-events-auto shrink-0 z-30"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-amber-500 rounded-lg rotate-45 flex items-center justify-center border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <div className="w-4 h-4 bg-black rounded-full"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-amber-500/80 tracking-[0.2em] uppercase">Deity Interface</span>
                <span className="text-sm font-bold tracking-tight text-white leading-none">FAITHFUL // SECTOR_804</span>
              </div>
            </div>
            
            <div className="flex items-center gap-8 font-mono">
              <TopStat label="Divine Devotion" value={devotion} unit="ÃŽâ€" color="text-amber-400" />
              <TopStat label="Sect Density" value="64x64 Grid" unit="LOD" color="text-emerald-400" />
              <TopStat label="Population" value={stats.population.toLocaleString()} unit="SENTIENT" color="text-sky-400" />
            </div>
          </GlassPanel>
        ) : (
          /* Bottom Navigation Bar (Mobile) */
          <GlassPanel 
            intensity="high"
            className="m-2 p-3 flex items-center justify-around pointer-events-auto shrink-0 z-30 rounded-3xl"
          >
            <NavIcon active={activeTab === 'simulation'} onClick={() => setActiveTab('simulation')} isMobile>
               <Globe className="w-6 h-6" />
            </NavIcon>
            <NavIcon active={activeTab === 'societies'} onClick={() => setActiveTab('societies')} isMobile>
               <Users className="w-6 h-6" />
            </NavIcon>
            <NavIcon active={activeTab === 'faith'} onClick={() => setActiveTab('faith')} isMobile>
               <TrendingUp className="w-6 h-6" />
            </NavIcon>
            <NavIcon active={activeTab === 'deity'} onClick={() => setActiveTab('deity')} isMobile>
               <Sparkles className="w-6 h-6 text-amber-400" />
            </NavIcon>
            <NavIcon active={activeTab === 'progression'} onClick={() => setActiveTab('progression')} isMobile>
               <Award className="w-6 h-6 text-indigo-400" />
            </NavIcon>
            <NavIcon active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isMobile>
              <Settings className={`w-6 h-6 ${activeTab === 'settings' ? 'rotate-90 text-amber-400' : ''}`} />
            </NavIcon>
          </GlassPanel>
        )}

        {/* Global Floating Layout Columns */}
        <div className="flex-1 flex gap-4 px-4 pb-4 overflow-hidden min-h-0">
          
          {/* Left Hand Navigation Rail (Desktop Only) */}
          {!isMobile && (
            <GlassPanel 
              intensity="medium"
              className="w-16 py-6 flex flex-col items-center gap-6 pointer-events-auto shrink-0 z-20"
            >
              <NavIcon active={activeTab === 'simulation'} onClick={() => setActiveTab('simulation')}>
                <Globe className="w-5 h-5" />
              </NavIcon>
              <NavIcon active={activeTab === 'societies'} onClick={() => setActiveTab('societies')}>
                <Users className="w-5 h-5" />
              </NavIcon>
              <NavIcon active={activeTab === 'faith'} onClick={() => setActiveTab('faith')}>
                <TrendingUp className="w-5 h-5" />
              </NavIcon>
              <NavIcon active={activeTab === 'deity'} onClick={() => setActiveTab('deity')} title="Divine Pantheon & Skill Tree">
                <Sparkles className="w-5 h-5 animate-pulse text-amber-400" />
              </NavIcon>
              <NavIcon active={activeTab === 'progression'} onClick={() => setActiveTab('progression')} title="Divine Illumination & Achievements">
                <Award className="w-5 h-5 text-indigo-400" />
              </NavIcon>
              <NavIcon active={activeTab === 'inspector'} onClick={() => setActiveTab('inspector')}>
                <Layers className="w-5 h-5" />
              </NavIcon>
              <div className="mt-auto">
                <NavIcon active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} title="Calibration & Timelines (Saves/Sectors)">
                  <Settings className={`w-5 h-5 transition-all duration-500 ${activeTab === 'settings' ? 'rotate-90 text-amber-400' : 'text-slate-400 hover:text-white'}`} />
                </NavIcon>
              </div>
            </GlassPanel>
          )}

          {/* Central Command Column */}
          <div className="flex-1 flex flex-col gap-4 relative min-h-0">
            
            {/* Mobile Stats Bar (Floats Top) */}
            {isMobile && (
              <GlassPanel intensity="low" className="w-full p-2 flex items-center justify-between pointer-events-auto z-20 rounded-xl">
                 <div className="flex gap-4 px-2">
                    <TopStat label="DEVO" value={devotion} unit="ÃŽâ€" color="text-amber-400" isMobile />
                    <TopStat label="POP" value={stats.population} unit="S" color="text-sky-400" isMobile />
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-tighter">
                      {weatherInfo.weather} // {weatherInfo.temperature.toFixed(0)}Ã‚Â°C
                    </span>
                 </div>
              </GlassPanel>
            )}

            {/* Realtime coordinates & Tactical Map Filters HUD (Adaptive Width) */}
            <div className={`${isMobile ? 'w-full' : 'w-80'} p-4 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl pointer-events-auto z-20 font-sans transition-all duration-300 hover:border-white/15 flex flex-col gap-3.5`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 font-mono tracking-widest font-bold block mb-1 uppercase">BIOME // {getBiomeName(hoveredCoordinate)}</span>
                  <div className="flex items-center gap-2 text-xs text-slate-200 font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {hoveredCoordinate ? `GRID: (${hoveredCoordinate.x}, ${hoveredCoordinate.y})` : 'TARGET CELL TO COMMAND'}
                  </div>
                </div>
                {isMobile && (
                   <button 
                     onClick={() => setActiveBrush({ category: 'INSPECT', subType: '' })}
                     className="p-2 bg-white/5 rounded-lg text-slate-400"
                   >
                     <Crosshair className="w-4 h-4" />
                   </button>
                )}
              </div>

              {/* Context-aware Divine Cursor Tooltip */}
              {hoveredEntity && (
                <div className="border-t border-white/5 pt-2 flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">TACTICAL CURSOR SENSE</span>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>{getHoveredEntityThought(hoveredEntity)}</span>
                  </div>
                </div>
              )}

              {/* Map Heatmap Mode Controls */}
              <div className="border-t border-white/5 pt-2.5 flex flex-col gap-1.5">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider font-bold">Divine Heatmap Overlays</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => {
                      setHeatmap('none');
                      rendererRef.current?.toggleHeatmap('none');
                    }}
                    className={`py-1 px-1.5 rounded border text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                      heatmap === 'none'
                        ? 'bg-slate-800 border-white/25 text-white'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Off
                  </button>
                  <button
                    onClick={() => {
                      setHeatmap('devotion');
                      rendererRef.current?.toggleHeatmap('devotion');
                    }}
                    className={`py-1 px-1.5 rounded border text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                      heatmap === 'devotion'
                        ? 'bg-purple-500/25 border-purple-400/40 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Devotion
                  </button>
                  <button
                    onClick={() => {
                      setHeatmap('resource');
                      rendererRef.current?.toggleHeatmap('resource');
                    }}
                    className={`py-1 px-1.5 rounded border text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                      heatmap === 'resource'
                        ? 'bg-emerald-500/25 border-emerald-400/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Resource
                  </button>
                </div>
              </div>

              {/* Zoom & Viewport Controls */}
              <div className="border-t border-white/5 pt-2 flex items-center justify-between">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">Camera Matrix</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => rendererRef.current?.triggerZoom(0.8)}
                    className="w-6 h-6 bg-white/[0.02] border border-white/10 hover:bg-white/15 text-white text-xs rounded-md flex items-center justify-center font-bold cursor-pointer"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <button
                    onClick={() => rendererRef.current?.triggerZoom(1.2)}
                    className="w-6 h-6 bg-white/[0.02] border border-white/10 hover:bg-white/15 text-white text-xs rounded-md flex items-center justify-center font-bold cursor-pointer"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    onClick={() => rendererRef.current?.resetCamera()}
                    className="px-2 h-6 bg-white/[0.02] border border-white/10 hover:bg-white/15 text-white text-[9px] rounded-md flex items-center justify-center font-mono font-bold cursor-pointer"
                    title="Home Viewport"
                  >
                    HOME
                  </button>
                </div>
              </div>
            </div>

            {/* Realtime Weather & Climate Cycles HUD */}
            <div className={`absolute ${isMobile ? 'bottom-0 left-0 right-0 w-full rounded-t-3xl rounded-b-none border-b-0' : 'top-[280px] left-0 w-80 rounded-2xl'} p-4 bg-slate-950/80 backdrop-blur-md border border-white/10 shadow-2xl pointer-events-auto z-20 font-sans transition-all duration-300 hover:border-white/15 flex flex-col gap-3`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-sky-400 font-mono tracking-widest font-bold block uppercase">ATMOSPHERE & PHYSICS</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                    {weatherInfo.weather === 'CLEAR' && 'Ã¢Ëœâ‚¬Ã¯Â¸Â SUNNY CLEAR'}
                    {weatherInfo.weather === 'RAINY' && 'Ã°Å¸Å’Â§Ã¯Â¸Â REJUVENATING RAIN'}
                    {weatherInfo.weather === 'DROUGHT' && 'Ã°Å¸ÂÅ“Ã¯Â¸Â SEVERE DROUGHT'}
                    {weatherInfo.weather === 'TEMPEST' && 'Ã¢Å¡Â¡ ION STORM TEMPEST'}
                    {weatherInfo.weather === 'AURORA' && 'Ã°Å¸Å’Å’ COSMIC AURORA'}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  TIME LEFT: {Math.round(weatherInfo.timeLeft)}s
                </div>
              </div>

              {/* Weather Progress Bar */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full transition-all duration-300 ${
                    weatherInfo.weather === 'CLEAR' ? 'bg-amber-400' :
                    weatherInfo.weather === 'RAINY' ? 'bg-sky-400' :
                    weatherInfo.weather === 'DROUGHT' ? 'bg-orange-600' :
                    weatherInfo.weather === 'TEMPEST' ? 'bg-purple-500' : 'bg-pink-500'
                  }`}
                  style={{ width: `${Math.min(100, (weatherInfo.timeLeft / weatherInfo.timer) * 100)}%` }}
                />
              </div>

              {/* Climate readouts linking to the physical and biological pillars */}
              <div className="grid grid-cols-2 gap-2 mt-0.5 border-t border-b border-white/5 py-2">
                <div className="flex flex-col">
                  <span className="text-[8px] tracking-wider text-slate-500 uppercase font-bold font-mono">Temperature</span>
                  <span className={`text-sm font-semibold font-mono flex items-center gap-1 ${
                    weatherInfo.temperature > 30 ? 'text-red-400' : weatherInfo.temperature < 12 ? 'text-blue-300' : 'text-slate-200'
                  }`}>
                    Ã°Å¸Å’Â¡Ã¯Â¸Â {weatherInfo.temperature.toFixed(1)}Ã‚Â°C
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] tracking-wider text-slate-500 uppercase font-bold font-mono">Bio Humidity</span>
                  <span className={`text-sm font-semibold font-mono flex items-center gap-1 ${
                    weatherInfo.humidity > 70 ? 'text-sky-300' : weatherInfo.humidity < 15 ? 'text-orange-400' : 'text-slate-200'
                  }`}>
                    Ã°Å¸â€™Â§ {weatherInfo.humidity.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Weather description/impact overview directly referencing system interactions */}
              <div className="text-[10px] leading-relaxed text-slate-400 pr-1">
                {weatherInfo.weather === 'CLEAR' && (
                  <span>Optimal operations. standard physics values are active. Biological growth operates at 100% capacity.</span>
                )}
                {weatherInfo.weather === 'RAINY' && (
                  <span>
                    Ã°Å¸Å’Â§Ã¯Â¸Â <strong className="text-sky-300 font-bold">Biomass Catalyst:</strong> Crop growth is boosted by <strong className="text-emerald-400 font-bold">+100%</strong>. <span className="text-emerald-400">Animist zones</span> generate <strong className="text-white font-bold">+1.2 happiness/s</strong>, <strong className="text-white font-bold">additional devotion</strong>, and spawn rare <strong className="text-amber-300 font-bold">Golden Bananas</strong>.
                  </span>
                )}
                {weatherInfo.weather === 'DROUGHT' && (
                  <span>
                    Ã°Å¸ÂÅ“Ã¯Â¸Â <strong className="text-orange-400 font-bold">Biological Extinction:</strong> Flora biomass decays. Fauna hunger speeds up. Societies lose <strong className="text-white font-bold">-2.5 happiness/s</strong>, and raw resource production drops by <strong className="text-red-400 font-bold">-50%</strong>.
                  </span>
                )}
                {weatherInfo.weather === 'TEMPEST' && (
                  <span>
                    Ã¢Å¡Â¡ <strong className="text-purple-400 font-bold">Lightning Hazards:</strong> High tension atmosphere with random strikes damaging societies and structures. <span className="text-emerald-400 font-bold">Technocrats</span> absorb strikes to boost resources!
                  </span>
                )}
                {weatherInfo.weather === 'AURORA' && (
                  <span>
                    Ã°Å¸Å’Å’ <strong className="text-pink-400 font-bold">Cosmic Super-Conductor:</strong> Spiritual affinity increases. Global devotion speed boosted by <strong className="text-white font-bold">+180%</strong>. Mortal beliefs drift towards elementalism.
                  </span>
                )}
              </div>

              {/* Deity Divine Climate Control buttons (Interventions) */}
              <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
                <span className="text-[8px] text-slate-500 font-mono tracking-wider uppercase font-bold">Divine Weather Intervention</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      if (simulationRef.current && devotion >= 30) {
                        simulationRef.current.setWeather('RAINY', 45, 1.0);
                        simulationRef.current.totalDevotion -= 30; // deduct cost
                        simulationRef.current.actionsCompleted.weatherInterventions += 1;
                        simulationRef.current.gainDivineXP(25);
                        simulationRef.current.addEventLog('MIRACLE', 'Mortal prayers heard. Deity intervened to manifest holy downpour.');
                        setDevotion(Math.floor(simulationRef.current.totalDevotion));
                      }
                    }}
                    disabled={devotion < 30}
                    className="py-1 px-1.5 rounded border border-sky-500/30 hover:bg-sky-500/20 text-[9px] text-sky-300 font-bold uppercase transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    title="Manifest Rain (Cost: 30 Devotion)"
                  >
                    Ã°Å¸Å’Â§Ã¯Â¸Â CALL RAIN
                  </button>
                  <button
                    onClick={() => {
                      if (simulationRef.current && devotion >= 30) {
                        simulationRef.current.setWeather('CLEAR', 45, 0.8);
                        simulationRef.current.totalDevotion -= 30; // deduct cost
                        simulationRef.current.actionsCompleted.weatherInterventions += 1;
                        simulationRef.current.gainDivineXP(20);
                        simulationRef.current.addEventLog('MIRACLE', 'Searing radiation dispersed. Deity cleared the global forecast.');
                        setDevotion(Math.floor(simulationRef.current.totalDevotion));
                      }
                    }}
                    disabled={devotion < 30}
                    className="py-1 px-1.5 rounded border border-amber-500/30 hover:bg-amber-500/20 text-[9px] text-amber-300 font-bold uppercase transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    title="Disperse Weather (Cost: 30 Devotion)"
                  >
                    Ã¢Ëœâ‚¬Ã¯Â¸Â CLEAR SKY
                  </button>
                </div>
              </div>
            </div>

            {/* Entity details popup balloon panels (Floats Top Right inside viewport region) */}
            {selectedEntity && (
              <div className={`absolute ${isMobile ? 'inset-0 w-full h-full rounded-none z-[100] bg-slate-950' : 'top-0 right-0 w-80 max-h-[80%] rounded-2xl'} bg-slate-950/75 backdrop-blur-lg border border-white/15 p-5 z-20 shadow-2xl flex flex-col gap-3 font-sans overflow-y-auto pointer-events-auto transition-all duration-300 hover:border-white/20`}>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold font-mono">Entity Inspector</span>
                  <button 
                    className="text-slate-400 hover:text-white text-xs w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" 
                    onClick={() => {
                      setSelectedEntity(null);
                      if (rendererRef.current) rendererRef.current.selectedEntityId = null;
                    }}
                  >
                    Ã¢Å“â€¢
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight leading-tight">
                    {selectedEntity.components.society?.name || (selectedEntity.category.includes('Flora') ? `${selectedEntity.components.flora?.subType} Banana` : selectedEntity.components.fauna?.subType) || selectedEntity.category}
                  </h4>
                  <span className="text-[9px] text-slate-450 font-mono uppercase tracking-wider">GUID: {selectedEntity.id} // TYPE: {selectedEntity.category}</span>
                </div>

                <div className="space-y-2 border-t border-white/5 pt-2 text-xs">
                  {selectedEntity.components.society && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Faction Creed:</span>
                        <span className="font-bold text-sky-450">{selectedEntity.components.society.faction}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Population:</span>
                        <span className="font-bold text-emerald-400">{Math.floor(selectedEntity.components.society.population)} Sentient</span>
                      </div>
                    </>
                  )}

                  {selectedEntity.components.flora && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vegetation Type:</span>
                        <span className="font-bold text-emerald-400">{selectedEntity.components.flora.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Growth Stage:</span>
                        <span className="font-bold text-white">{Math.round(selectedEntity.components.flora.growth)}%</span>
                      </div>
                    </>
                  )}

                  {selectedEntity.components.fauna && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fauna Breed:</span>
                        <span className="font-bold text-emerald-400">{selectedEntity.components.fauna.subType} ({selectedEntity.components.fauna.category})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Behavioral State:</span>
                        <span className="font-bold text-white font-mono uppercase">{selectedEntity.components.fauna.actionState}</span>
                      </div>
                    </>
                  )}

                  {selectedEntity.components.structure && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Structure Base:</span>
                        <span className="font-bold text-white">{selectedEntity.components.structure.subType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Durability Integrity:</span>
                        <span className="font-bold text-emerald-400">{selectedEntity.components.structure.durability}%</span>
                      </div>
                    </>
                  )}

                  {/* Physics & Biology Environmental Pillars */}
                  {selectedEntity.components.physics && (
                    <div className="border-t border-white/5 pt-2 flex flex-col gap-1">
                      <span className="text-[9px] font-mono text-sky-450 uppercase tracking-wider font-bold">ENVIRONMENTAL PHYSICS</span>
                      <div className="grid grid-cols-2 gap-1.5 bg-white/[0.02] p-2 rounded-xl border border-white/5 text-[11px]">
                        <div>
                          <span className="text-slate-500 block text-[9px]">LOCAL TEMP:</span>
                          <span className="font-bold font-mono text-slate-200">Ã°Å¸Å’Â¡Ã¯Â¸Â {selectedEntity.components.physics.temperature.toFixed(1)}Ã‚Â°C</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">HUMIDITY:</span>
                          <span className="font-bold font-mono text-slate-200">Ã°Å¸â€™Â§ {selectedEntity.components.physics.humidity.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedEntity.components.biology && (
                    <div className="border-t border-white/5 pt-2 flex flex-col gap-1">
                      <span className="text-[9px] font-mono text-emerald-450 uppercase tracking-wider font-bold">ORGANIC BIOLOGY</span>
                      <div className="grid grid-cols-2 gap-1.5 bg-white/[0.02] p-2 rounded-xl border border-white/5 text-[11px]">
                        <div>
                          <span className="text-slate-500 block text-[9px]">ACTIVE BIOMASS:</span>
                          <span className="font-bold font-mono text-emerald-400">Ã°Å¸Å’Â± {Math.round(selectedEntity.components.biology.biomass)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">DNA SEQUENCE:</span>
                          <span className="font-semibold font-mono text-amber-300 truncate block text-[10px]" title={selectedEntity.components.biology.dna}>Ã°Å¸Â§Â¬ {selectedEntity.components.biology.dna}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Collapsible advanced properties using progressive disclosure principles */}
                  <div className="border-t border-white/5 pt-2">
                    <button 
                      onClick={() => setInspectAdvanced(!inspectAdvanced)}
                      className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 hover:text-white transition-colors bg-white/[0.01] hover:bg-white/[0.03] py-1 px-1.5 rounded-md border border-white/5"
                    >
                      <span className="flex items-center gap-1">
                        <ChevronDown className={`w-3 h-3 transition-transform ${inspectAdvanced ? 'rotate-180' : ''}`} />
                        {inspectAdvanced ? 'Hide diagnostics' : 'Advanced attributes'}
                      </span>
                      <span className="text-[8px] opacity-65">progressive scan</span>
                    </button>

                    <AnimatePresence initial={false}>
                      {inspectAdvanced && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-2.5 mt-2.5 pt-2.5 border-t border-white/5"
                        >
                          {selectedEntity.components.position && (
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-slate-500">Grid Coordinates:</span>
                              <span className="text-amber-400 font-bold">X: {Math.round(selectedEntity.components.position.x)}, Y: {Math.round(selectedEntity.components.position.y)}</span>
                            </div>
                          )}

                          {selectedEntity.components.society && (
                            <>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Resource Stockpile:</span>
                                <span className="font-bold text-amber-400">{Math.floor(selectedEntity.components.society.resources)} Units</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Welfare Happiness:</span>
                                <span className="font-bold text-white">{Math.round(selectedEntity.components.society.happiness)}%</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Dominant Faith System:</span>
                                <span className="font-mono text-xs text-purple-400">{selectedEntity.components.faith?.dominantSystem}</span>
                              </div>
                              {/* Workforce fractions summary */}
                              <div className="flex flex-col gap-0.5 mt-1 border-t border-white/5 pt-1 text-[9px] font-mono text-slate-400">
                                <div className="flex justify-between">
                                  <span>Ã°Å¸Å’Â¾ Gatherers:</span>
                                  <span className="text-sky-300 font-bold">{Math.round((selectedEntity.components.society.gathererRatio ?? 0.35) * 100)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Ã°Å¸ÂÂ¹ Hunters:</span>
                                  <span className="text-amber-500 font-bold">{Math.round((selectedEntity.components.society.hunterRatio ?? 0.15) * 100)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Ã°Å¸Â§Âª Scholars:</span>
                                  <span className="text-cyan-400 font-bold">{Math.round((selectedEntity.components.society.researcherRatio ?? 0.20) * 100)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Ã°Å¸â€Â® Acolytes:</span>
                                  <span className="text-purple-400 font-bold">{Math.round((selectedEntity.components.society.acolyteRatio ?? 0.30) * 100)}%</span>
                                </div>
                              </div>
                              {/* Active mandates summary */}
                              <div className="flex flex-wrap gap-1 mt-1.5 border-t border-white/5 pt-1.5">
                                {selectedEntity.components.society.rationMode && (
                                  <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 text-[8px] font-mono rounded font-medium border border-rose-500/20">Ã°Å¸ÂÂ² RATIONING</span>
                                )}
                                {selectedEntity.components.society.stripMineMode && (
                                  <span className="px-1.5 py-0.5 bg-amber-600/20 text-amber-300 text-[8px] font-mono rounded font-medium border border-amber-500/20">Ã¢â€ºÂÃ¯Â¸Â STRIP-MINING</span>
                                )}
                                {selectedEntity.components.society.titheMode && (
                                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[8px] font-mono rounded font-medium border border-emerald-500/20">Ã°Å¸Â©Â¸ TITHE OFFERS</span>
                                )}
                                {!selectedEntity.components.society.rationMode && !selectedEntity.components.society.stripMineMode && !selectedEntity.components.society.titheMode && (
                                  <span className="text-[8px] text-slate-500 italic font-mono uppercase">No active mandates</span>
                                )}
                              </div>
                            </>
                          )}

                          {selectedEntity.components.flora && (
                            <>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500 font-sans">Subtype variant:</span>
                                <span className="font-bold text-yellow-500">{selectedEntity.components.flora.subType}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Yield Capacity:</span>
                                <span className="font-bold text-slate-300">{selectedEntity.components.flora.resourcesYield} RES</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Is Harvested (Depleted):</span>
                                <span className="font-bold text-rose-450">{selectedEntity.components.flora.isHarvested ? 'YES' : 'NO'}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500 font-sans">Cultivar Grade:</span>
                                <span className="font-bold text-indigo-400">
                                  {(() => {
                                    const cultLabels = [
                                      "Ã°Å¸Å’Â± Wild Cultivar",
                                      "Ã°Å¸Å’Â¾ Selected Seedline",
                                      "Ã°Å¸Â§Âª Bio-Grafted",
                                      "Ã¢Å“Â¨ Quantum Crop",
                                      "Ã°Å¸Â¤â€“ Cyber-Apex"
                                    ];
                                    return cultLabels[(selectedEntity.components.flora.cultivarTier || 1) - 1] || cultLabels[0];
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500 font-sans">Soil Moisture:</span>
                                <span className={`font-bold ${selectedEntity.components.flora.soilMoisture < 20 ? 'text-rose-450 animate-pulse' : 'text-sky-400'}`}>
                                  {Math.round(selectedEntity.components.flora.soilMoisture ?? 60)}%
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500 font-sans">Soil Nutrients (NPK):</span>
                                <span className={`font-bold ${selectedEntity.components.flora.soilNutrients < 30 ? 'text-amber-450' : 'text-emerald-400'}`}>
                                  {Math.round(selectedEntity.components.flora.soilNutrients ?? 70)}%
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500 font-sans">Pest Infestation:</span>
                                <span className={`font-bold ${selectedEntity.components.flora.pestLevel > 30 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`}>
                                  {Math.round(selectedEntity.components.flora.pestLevel ?? 0)}%
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500 font-sans">Diseases / Rust blights:</span>
                                <span className={`font-bold uppercase ${selectedEntity.components.flora.diseaseActive ? 'text-red-500 font-extrabold animate-pulse' : 'text-slate-400'}`}>
                                  {selectedEntity.components.flora.diseaseActive ? 'Ã¢Å¡Â Ã¯Â¸Â Rust Blight' : 'Ã¢Å“â€¦ Healthy'}
                                </span>
                              </div>
                            </>
                          )}

                          {selectedEntity.components.fauna && (
                            <>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Biological Health Index:</span>
                                <span className="font-bold text-rose-400">{selectedEntity.components.fauna.health}/100</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Metabolic Hunger State:</span>
                                <span className="font-bold text-orange-400">{Math.round(selectedEntity.components.fauna.hunger)}%</span>
                              </div>
                            </>
                          )}

                          {selectedEntity.components.structure && (
                            <div className="flex justify-between text-[11px] text-amber-500">
                              <span className="text-slate-500 font-sans">Direct Conversion Mod:</span>
                              <span className="font-bold">+{Math.round((selectedEntity.components.structure.efficiency - 1) * 100)}% Bonus</span>
                            </div>
                          )}

                          <div className="flex justify-between text-[8px] font-mono text-slate-500 border-t border-white/5 pt-1">
                            <span>ENTITY ENVELOPE:</span>
                            <span className="truncate max-w-[120px]" title={selectedEntity.id}>{selectedEntity.id}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const sim = simulationRef.current;
                    if (sim && selectedEntity) {
                      sim.triggerLocalizedSpell('Meteor', selectedEntity.components.position.x, selectedEntity.components.position.y);
                      setSelectedEntity(null);
                      if (rendererRef.current) rendererRef.current.selectedEntityId = null;
                    }
                  }}
                  className="w-full mt-2 py-2 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 font-mono text-[9px] font-bold uppercase tracking-widest rounded-md transition-all duration-300"
                >
                  Ã¢Ëœâ€žÃ¯Â¸Â localized meteor disintegration (Cost 65)
                </button>
              </div>
            )}

            {/* Spacer pushing control docks to screen bottom */}
            <div className="flex-1 min-h-0" />

            {/* Interactive Deity Spawning Toolset (Floating Glass Panel) with Progressive Disclosure Mode selections */}
            <div className="p-4 bg-slate-950/45 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col gap-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)] pointer-events-auto z-20 transition-all duration-300 hover:border-white/15">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-2">
                  <Zap className="w-4 h-4 animate-pulse text-amber-500" /> Deity Core Workspace
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  BRUSH TYPE: <span className="text-emerald-400 font-bold font-mono">{activeBrush.category} {activeBrush.subType && `// ${activeBrush.subType}`}</span>
                </span>
              </div>
              
              {/* mode control bar (Primary progressive disclosure gate) */}
              <div className="grid grid-cols-3 gap-2 flex-wrap sm:flex-nowrap">
                <button 
                  onClick={() => {
                    setToolMode('inspect');
                    setActiveBrush({ category: 'INSPECT', subType: '' });
                    if (rendererRef.current) rendererRef.current.selectedEntityId = null;
                    setSelectedEntity(null);
                  }}
                  className={`py-2 px-3 border rounded-xl text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                    toolMode === 'inspect'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4" /> Observation
                </button>
                <button 
                  onClick={() => {
                    setToolMode('spawn');
                    if (spawnCategory === 'banana') {
                      setActiveBrush({ category: 'SPAWN_BANANA', subType: 'GOLD' });
                    } else if (spawnCategory === 'fauna') {
                      setActiveBrush({ category: 'SPAWN_FAUNA', subType: 'Forest Stag' });
                    } else if (spawnCategory === 'structure') {
                      setActiveBrush({ category: 'SPAWN_STRUCTURE', subType: 'Sacred Altar' });
                    } else if (spawnCategory === 'tribe') {
                      setActiveBrush({ category: 'SPAWN_TRIBE', subType: 'ANIMIST' });
                    }
                  }}
                  className={`py-2 px-3 border rounded-xl text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                    toolMode === 'spawn'
                      ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Manifest Species
                </button>
                <button 
                  onClick={() => {
                    setToolMode('spell');
                    setActiveBrush({ category: 'LOCALISED_SPELL', subType: 'Rainfall' });
                  }}
                  className={`py-2 px-3 border rounded-xl text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                    toolMode === 'spell'
                      ? 'bg-purple-500/20 border-purple-500/45 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> Spells & Rifts
                </button>
              </div>

              {/* Sub-categories of spawning: secondary progressive disclosure tier */}
              <AnimatePresence mode="wait">
                {toolMode === 'spawn' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden flex items-center gap-1.5 border-t border-white/5 pt-2 flex-wrap"
                  >
                    <span className="text-[9px] uppercase font-mono text-slate-500 mr-2">Spawn Sector:</span>
                    <button
                      onClick={() => {
                        setSpawnCategory('banana');
                        setActiveBrush({ category: 'SPAWN_BANANA', subType: 'GOLD' });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono tracking-wider transition-colors border ${
                        spawnCategory === 'banana' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-450' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Ã°Å¸ÂÅ’ Flora Species
                    </button>
                    <button
                      onClick={() => {
                        setSpawnCategory('fauna');
                        setActiveBrush({ category: 'SPAWN_FAUNA', subType: 'Forest Stag' });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono tracking-wider transition-colors border ${
                        spawnCategory === 'fauna' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-450' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Ã°Å¸ÂÂº Fauna Beasts
                    </button>
                    <button
                      onClick={() => {
                        setSpawnCategory('structure');
                        setActiveBrush({ category: 'SPAWN_STRUCTURE', subType: 'Sacred Altar' });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono tracking-wider transition-colors border ${
                        spawnCategory === 'structure' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-450' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Ã¢â€ºÂ©Ã¯Â¸Â Shrines & Totems
                    </button>
                    <button
                      onClick={() => {
                        setSpawnCategory('tribe');
                        setActiveBrush({ category: 'SPAWN_TRIBE', subType: 'ANIMIST' });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono tracking-wider transition-colors border ${
                        spawnCategory === 'tribe' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-450' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Ã°Å¸â€ºâ€“ Civilizations
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Specific Subtypes panel: progressively shown leaf options */}
              <AnimatePresence mode="wait">
                {toolMode === 'spawn' && spawnCategory === 'banana' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                    className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-lg border border-white/5 overflow-x-auto min-h-[38px] scrollbar-none"
                  >
                    {['GOLD', 'CYBER', 'VOID', 'DIVINE', 'FIRE', 'FROST', 'TOXIC', 'COSMIC'].map(sub => (
                      <SubButton 
                        key={sub}
                        active={activeBrush.subType === sub}
                        onClick={() => setActiveBrush({ category: 'SPAWN_BANANA', subType: sub })}
                        label={`${sub} Banana`}
                      />
                    ))}
                  </motion.div>
                )}

                {toolMode === 'spawn' && spawnCategory === 'fauna' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                    className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-lg border border-white/5 min-h-[38px]"
                  >
                    {['Forest Stag', 'Dire Wolf'].map(sub => (
                      <SubButton 
                        key={sub}
                        active={activeBrush.subType === sub}
                        onClick={() => setActiveBrush({ category: 'SPAWN_FAUNA', subType: sub })}
                        label={sub}
                      />
                    ))}
                  </motion.div>
                )}

                {toolMode === 'spawn' && spawnCategory === 'structure' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                    className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-lg border border-white/5 min-h-[38px] overflow-x-auto"
                  >
                    {['Sacred Altar', 'Ancient Totem', 'Faith obelisk', 'Hydro-Bay Dome', 'Terratech Greenhouse'].map(sub => (
                      <SubButton 
                        key={sub}
                        active={activeBrush.subType === sub}
                        onClick={() => setActiveBrush({ category: 'SPAWN_STRUCTURE', subType: sub })}
                        label={sub}
                      />
                    ))}
                  </motion.div>
                )}

                {toolMode === 'spawn' && spawnCategory === 'tribe' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                    className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-lg border border-white/5 min-h-[38px] overflow-x-auto scrollbar-none"
                  >
                    {['ANIMIST', 'TECHNOCRAT', 'INTERVENTIONIST', 'NIHILIST', 'ELEMENTAL'].map(sub => (
                      <SubButton 
                        key={sub}
                        active={activeBrush.subType === sub}
                        onClick={() => setActiveBrush({ category: 'SPAWN_TRIBE', subType: sub })}
                        label={`${sub} Tribe`}
                      />
                    ))}
                  </motion.div>
                )}

                {toolMode === 'spell' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                    className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-lg border border-white/5 overflow-x-auto min-h-[38px] scrollbar-none"
                  >
                    {[
                      { name: 'Rainfall', desc: 'Heals & seeds rare flora growth' },
                      { name: 'Meteor', desc: 'High thermal block explosion blast' },
                      { name: 'Sanctity Aura', desc: 'Heals and inspires local believer sects' },
                      { name: 'Rift Collapse', desc: 'Fires timelines bending gravitational slide' },
                      { name: 'Found Outpost', desc: 'Seeds a rustic outpost with 1 Single Villager (Tier 1)' },
                      { name: 'Fertility Rite', desc: 'Enriches soils, cleanses pests & cures blights (Agriculture)' }
                    ].map(spell => {
                      const getSpellCost = (name: string) => {
                        const baseCost = {
                          'Rainfall': 35,
                          'Meteor': 65,
                          'Sanctity Aura': 40,
                          'Rift Collapse': 80,
                          'Found Outpost': 55,
                          'Fertility Rite': 30
                        }[name] || 50;
                        if (name === 'Rainfall' && selectedGod?.id === 'thalassor') return 17;
                        if (name === 'Meteor' && selectedGod?.id === 'krigor') return 39;
                        if (name === 'Fertility Rite' && selectedGod?.id === 'sylphra') return 15;
                        return baseCost;
                      };
                      const cost = getSpellCost(spell.name);
                      return (
                        <SubButton 
                          key={spell.name}
                          active={activeBrush.subType === spell.name}
                          onClick={() => setActiveBrush({ category: 'LOCALISED_SPELL', subType: spell.name })}
                          label={`${spell.name} (${cost} ÃŽâ€)`}
                          title={spell.desc}
                        />
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Collapsible Faith Tiers Panel: Progressive disclosure to hide massive stats by default */}
            <div className="flex flex-col gap-2 shrink-0 pointer-events-auto z-25">
              <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-500 uppercase tracking-widest leading-none">
                <span className="flex items-center gap-1.5 font-semibold text-[10px]">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Civilization Faith Systems
                </span>
                <button 
                  onClick={() => setFaithGridOpen(!faithGridOpen)}
                  className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-white transition-all py-1 px-2 rounded-lg bg-white/[0.03] border border-white/10"
                >
                  {faithGridOpen ? (
                    <>Collapse <ChevronDown className="w-2.5 h-2.5 rotate-180 transition-transform" /></>
                  ) : (
                    <>Expand matrices <ChevronDown className="w-2.5 h-2.5 transition-transform" /></>
                  )}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {faithGridOpen ? (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-4 gap-4 pt-1 min-h-[110px]">
                      <FaithTile 
                        title="Naturalism" 
                        type="ANIMISM" 
                        value={`${stats.religions.ANIMISM || 0}`} 
                        tag="PRO-BIO" 
                        colorClass="emerald" 
                        active={true}
                      />
                      <FaithTile 
                        title="Cosmic Worship" 
                        type="ELEMENTALISM" 
                        value={`${stats.religions.ELEMENTALISM || 0}`} 
                        tag="PHYSICS-MAX" 
                        colorClass="orange" 
                        active={stats.religions.ELEMENTALISM > 0 || true}
                      />
                      <FaithTile 
                        title="Direct Theism" 
                        type="INTERVENTIONIST" 
                        value={`${stats.religions.INTERVENTIONIST || 0}`} 
                        tag="ZEALOTRY" 
                        colorClass="amber" 
                        active={stats.religions.INTERVENTIONIST > 0 || true}
                      />
                      <FaithTile 
                        title="Secular Science" 
                        type="SECULAR" 
                        value={`${stats.religions.SECULAR || 0}`} 
                        tag="ZERO YIELD" 
                        colorClass="sky" 
                        active={stats.religions.SECULAR > 0 || true}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.98, opacity: 0 }}
                    className="flex justify-between items-center bg-[#020304]/30 p-3 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center gap-5 text-[10px] sm:text-[11px] font-mono">
                      <span className="text-slate-500 font-bold">COEXISTING BELIEFS:</span>
                      <span className="flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ANIMISM: <strong className="text-emerald-400 font-bold">{stats.religions.ANIMISM || 0}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        COSMIC: <strong className="text-orange-400 font-bold">{stats.religions.ELEMENTALISM || 0}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        INTERVENTION: <strong className="text-amber-400 font-bold">{stats.religions.INTERVENTIONIST || 0}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        SECULAR: <strong className="text-sky-400 font-bold">{stats.religions.SECULAR || 0}</strong>
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-550 italic hidden sm:inline">click expand for ratios</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Right Sidebar containing logs and metrics - collapsible using progressive disclosure layout */}
          <div className={`relative transition-all duration-300 shrink-0 ${rightPanelOpen ? 'w-80' : 'w-0'}`}>
            
            {/* Sliding narrow absolute trigger handle tab sticking out to the left */}
            <button 
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="absolute top-1/2 -left-[14px] transform -translate-y-1/2 w-3.5 h-16 bg-slate-900 border border-white/10 rounded-l-md flex items-center justify-center pointer-events-auto hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors z-30 shadow-md animate-pulse"
              title={rightPanelOpen ? "Close logs and system statistics" : "Disclose logs and system statistics"}
            >
              {rightPanelOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {/* Sidebar main body */}
            <div className={`w-80 h-full bg-slate-950/45 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-white/15 overflow-hidden ${
              rightPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <div className="flex flex-col flex-1 min-h-0">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] mb-4 text-white/45 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-amber-500" /> Dimensional Rift Feed
                </h3>
                
                {/* Event Logs container with dynamic translucent scrollbar styling */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin scrollbar-thumb-white/10">
                  {logs.map(log => (
                    <div key={log.id} className={`border-l-2 pl-3 py-1 bg-white/[0.02] rounded-r-lg border-white/5 transition-all ${log.type === 'MIRACLE' ? 'border-amber-500/80' : log.type === 'SCHISM' ? 'border-sky-400/80' : 'border-emerald-500/80'}`}>
                      <span className={`text-[9px] font-mono uppercase tracking-widest block font-bold ${log.type === 'MIRACLE' ? 'text-amber-500' : log.type === 'SCHISM' ? 'text-sky-400' : 'text-emerald-500'}`}>
                        {log.time} // {log.type}
                      </span>
                      <p className="text-[11px] text-slate-350 leading-relaxed mt-0.5 font-light italic">
                        {log.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick intervention keys and system indicators inside sidebar footer */}
              <div className="space-y-4 shrink-0 border-t border-white/5 pt-4">
                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10 shadow-lg">
                  <h3 className="text-[10px] font-bold text-white/70 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-3 h-3 text-emerald-400" /> System Metrics
                  </h3>
                  <div className="space-y-4">
                    <MetricBar label="PHYSICS ENGINE" value="OPTIMAL" percent={92} color="bg-emerald-400" />
                    <MetricBar label="WASM TICK RATE" value="60HZ" percent={98} color="bg-sky-400" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <button 
                    onClick={() => handleIntervention('Rainfall')}
                    disabled={devotion < 35}
                    className="py-3 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/15 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex flex-col items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <CloudRain className="w-4 h-4 text-sky-450" />
                    Global Rain
                  </button>
                  <button 
                    onClick={() => handleIntervention('Meteor')}
                    disabled={devotion < 65}
                    className="py-3 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/15 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex flex-col items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Flame className="w-4 h-4 text-orange-450" />
                    Global Meteor
                  </button>
                </div>
                
                <button 
                  onClick={() => {
                    const sim = simulationRef.current;
                    if (sim) {
                      sim.addEventLog('MIRACLE', 'Executed Divine Devotion overcharge pulse.');
                      sim.totalDevotion += 100;
                    }
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                >
                  EXECUTE OVERCHARGE (+100 ÃŽâ€)
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Global Modal Tab Overlays styled as immersive glass backdrops */}
        <AnimatePresence>
          {activeTab !== 'simulation' && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="absolute inset-0 bg-slate-950/60 z-40 flex items-center justify-center p-8 select-none pointer-events-auto"
            >
              {activeTab === 'inspector' ? (
                <AssetInspector 
                  registry={registry}
                  onUpdate={(key, overrides) => {
                    if (rendererRef.current) {
                      rendererRef.current.registryOverrides[key] = overrides;
                      if (rendererRef.current.lastTerrainMap) {
                        rendererRef.current.drawTerrain(rendererRef.current.lastTerrainMap);
                      }
                      rendererRef.current.updateEntities(rendererRef.current.lastEntities);
                    }
                  }}
                  onAddMapping={(newKey, data) => {
                    setRegistry(prev => ({
                      ...prev,
                      mappings: { ...prev.mappings, [newKey]: data }
                    }));
                  }}
                  onRemoveMapping={(key) => {
                    setRegistry(prev => {
                      const newMappings = { ...prev.mappings };
                      delete (newMappings as any)[key];
                      return { ...prev, mappings: newMappings };
                    });
                  }}
                  onGlobalDebugChange={(x, y, scale) => {
                    if (rendererRef.current) {
                      rendererRef.current.debugOffsetX = x;
                      rendererRef.current.debugOffsetY = y;
                      rendererRef.current.debugScale = scale;
                      if (rendererRef.current.lastTerrainMap) {
                        rendererRef.current.drawTerrain(rendererRef.current.lastTerrainMap);
                      }
                      rendererRef.current.updateEntities(rendererRef.current.lastEntities);
                    }
                  }}
                  initialDebug={{
                    x: rendererRef.current?.debugOffsetX || 0,
                    y: rendererRef.current?.debugOffsetY || 0,
                    scale: rendererRef.current?.debugScale || 1.1
                  }}
                  onSave={async (fullRegistry) => {
                    try {
                      const response = await fetch('/api/save-registry', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fullRegistry)
                      });
                      if (response.ok) {
                        AudioEngine.playClick();
                        alert('Registry saved successfully to disk!');
                      } else {
                        throw new Error('Persistence failure');
                      }
                    } catch (e) {
                      console.error(e);
                      AudioEngine.playAlert();
                      alert('Failed to save registry.');
                    }
                  }}
                  onClose={() => setActiveTab('simulation')} 
                />
              ) : activeTab === 'settings' ? (                <CosmicSettingsHub
                  settings={settings}
                  updateSetting={updateSetting}
                  saveSlots={saveSlots}
                  onSaveGame={saveGame}
                  onLoadGame={loadGame}
                  onDeleteGameSave={deleteGameSave}
                  onHardReset={resetSimulation}
                  onExport={exportStateToJSON}
                  onImport={importStateFromJSON}
                  onClose={() => setActiveTab('simulation')}
                />
              ) : activeTab === 'deity' ? (
                <div className="w-full max-w-5xl bg-slate-950/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-amber-500 font-mono text-[9px] uppercase tracking-widest block font-bold">L4 Transcendental Core</span>
                      <h3 className="text-2xl font-bold tracking-tight capitalize flex items-center gap-3 text-white">
                        <Sparkles className="text-amber-400 w-7 h-7" />
                        Divine Patron & Skill Tree
                      </h3>
                    </div>
                    <button onClick={() => setActiveTab('simulation')} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer">
                      Ã¢Å“â€¢
                    </button>
                  </div>

                  <div className="overflow-y-auto flex-1 pr-1.5 grid grid-cols-1 lg:grid-cols-12 gap-6 custom-scrollbar select-text pointer-events-auto">
                    {/* Active God Info Card */}
                    <div className="lg:col-span-4 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between gap-6">
                      {selectedGod ? (
                        <>
                          <div className="space-y-4">
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest inline-block bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              PATRON CHOSEN
                            </span>
                            <div>
                              <h4 className="text-2xl font-black text-white leading-tight tracking-tight">
                                {selectedGod.name}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider mt-1">{selectedGod.title}</span>
                            </div>

                            <p className="text-xs text-slate-450 leading-relaxed font-light mt-2">
                              {selectedGod.description}
                            </p>

                            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl space-y-2">
                              <span className="text-[9px] font-mono text-amber-500 font-bold uppercase block tracking-widest">Active Starting Modification</span>
                              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                                {selectedGod.boostsDesc}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-500 font-mono uppercase font-bold block">Cosmic Aesthetic Signature</span>
                              <p className="text-[10px] text-slate-400 italic font-light font-sans bg-black/30 p-2.5 rounded-lg border border-white/5">
                                "{selectedGod.avatarPrompt}"
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedGod(null);
                              if (simulationRef.current) {
                                simulationRef.current.activeGodId = null;
                              }
                              setUnlockedSkills({});
                            }}
                            className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            Resurrect New Pact
                          </button>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <span className="text-4xl">Ã°Å¸â€Â®</span>
                          <h4 className="text-lg font-bold text-white mt-4">Unassigned Alignment</h4>
                          <p className="text-xs text-slate-405 mt-2">Pick your ascendancy path below to align with high stellar parameters.</p>
                        </div>
                      )}
                    </div>

                    {/* Skill Tree Matrix */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Respective Divine Skill Tree</span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Interactive matrix</span>
                      </div>

                      {selectedGod ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedGod.skills.map((skill: Skill) => {
                            const statsObj = {
                              population: stats.population,
                              religions: stats.religions,
                              techAverage: stats.techAverage
                            };
                            const reqsMet = skill.checkUnlocked(statsObj, devotion, ecsRef.current, simulationRef.current!);
                            const unlocked = !!unlockedSkills[skill.id];
                            const canAfford = devotion >= skill.cost;

                            return (
                              <div
                                key={skill.id}
                                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 relative group ${
                                  unlocked 
                                  ? 'bg-amber-500/[0.02] border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.05)]' 
                                  : 'bg-white/[0.01] border-white/5'
                                }`}
                              >
                                {unlocked && (
                                  <span className="absolute top-4 right-4 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                    ACTIVE
                                  </span>
                                )}

                                <div className="space-y-2">
                                  <h5 className="text-sm font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                                    {skill.name}
                                  </h5>
                                  <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                                    {skill.description}
                                  </p>
                                </div>

                                <div className="space-y-2.5 font-mono text-[10px] border-t border-white/5 pt-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Unlocking Requirements:</span>
                                    <span className={`font-bold uppercase ${reqsMet ? 'text-emerald-400' : 'text-orange-400'}`}>
                                      {reqsMet ? 'Ã¢Å“â€œ Cleared' : 'Ã¢Å“â€” Blocked'}
                                    </span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-black/40 text-[9px] text-slate-400 border border-white/5 leading-relaxed">
                                    {skill.reqsDesc}
                                  </div>
                                  <div className="flex justify-between items-center text-slate-400">
                                    <span>Devotion Cost:</span>
                                    <span className="text-amber-400 font-bold">{skill.cost} ÃŽâ€</span>
                                  </div>
                                </div>

                                <button
                                  disabled={(unlocked ? false : (!reqsMet || !canAfford))}
                                  onClick={() => {
                                    const sim = simulationRef.current;
                                    if (!sim) return;

                                    if (unlocked) {
                                      // Can trigger skills multiple times once unlocked!
                                      if (devotion >= skill.cost) {
                                        sim.totalDevotion -= skill.cost;
                                        setDevotion(Math.floor(sim.totalDevotion));
                                        const logText = skill.action(ecsRef.current, sim);
                                        sim.addEventLog('MIRACLE', logText);
                                        setLogs([...sim.eventLogs]);
                                      } else {
                                        sim.addEventLog('SCHISM', `Insufficient devotion to reactivate ${skill.name} (needs ${skill.cost} ÃŽâ€)`);
                                      }
                                    } else {
                                      // Unlock power first
                                      sim.totalDevotion -= skill.cost;
                                      setDevotion(Math.floor(sim.totalDevotion));
                                      const logText = skill.action(ecsRef.current, sim);
                                      sim.addEventLog('MIRACLE', logText);
                                      setUnlockedSkills(prev => ({ ...prev, [skill.id]: true }));
                                      setLogs([...sim.eventLogs]);
                                    }
                                  }}
                                  className={`w-full py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer pointer-events-auto ${
                                    unlocked
                                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : (!reqsMet)
                                    ? 'bg-white/5 text-slate-500 border border-transparent opacity-45 cursor-not-allowed'
                                    : (!canAfford)
                                    ? 'bg-white/5 text-amber-500/40 border border-amber-500/10 opacity-65 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-400 shadow-[0_4px_12px_rgba(245,158,11,0.25)]'
                                  }`}
                                >
                                  {unlocked ? `Re-Invoke Power (${skill.cost} ÃŽâ€)` : `Acquire Power (${skill.cost} ÃŽâ€)`}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-12 text-center">
                          <span className="text-3xl">Ã°Å¸Å’Å’</span>
                          <span className="text-sm text-slate-300 font-bold mt-3">Select a Patron Deity First</span>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm font-light leading-relaxed">Align yourself in the primary Selection overlay at startup or inside settings to unlock active cybernetic and nature trees.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : activeTab === 'societies' ? (
                <div className="w-full max-w-5xl bg-slate-950/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-emerald-500 font-mono text-[9px] uppercase tracking-widest block">L2-L3 Tactical Overview</span>
                      <h3 className="text-2xl font-bold tracking-tight capitalize flex items-center gap-3 text-white">
                        <Users className="text-sky-400 w-7 h-7" />
                        Civilization Societies Registry
                      </h3>
                    </div>
                    <button onClick={() => setActiveTab('simulation')} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer">
                      Ã¢Å“â€¢
                    </button>
                  </div>

                  {/* Societies list Grid */}
                  <div className="overflow-y-auto flex-1 pr-1.5 space-y-6 custom-scrollbar select-text pointer-events-auto">
                    {(() => {
                      const tribes = getSimulatedSocieties();
                      const avgHappiness = tribes.length > 0 ? Math.round(tribes.reduce((acc, t) => acc + t.soc.happiness, 0) / tribes.length) : 0;
                      const avgTech = tribes.length > 0 ? (tribes.reduce((acc, t) => acc + t.soc.technologyLevel, 0) / tribes.length).toFixed(2) : '1.00';
                      const totalRes = tribes.reduce((acc, t) => acc + t.soc.resources, 0);

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <ModalCard title="Global Social Sentiment" value={`${avgHappiness}%`} info="Average standard welfare satisfaction of all co-existing tribes." />
                          <ModalCard title="Average Civilization Level" value={`Tier v${avgTech}`} info="Technological synthesis and tool production capacity coefficient." />
                          <ModalCard title="Consolidated Reserves" value={`${Math.floor(totalRes)} Units`} info="Aggregate resource stockpile extracted by active gatherers." />
                        </div>
                      );
                    })()}

                    <div className="space-y-3.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">Active Civilization Centers</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getSimulatedSocieties().map(t => {
                          const factionColors = {
                            ANIMIST: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
                            TECHNOCRAT: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
                            INTERVENTIONIST: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
                            NIHILIST: 'border-purple-500/30 text-purple-400 bg-purple-500/5',
                            ELEMENTAL: 'border-rose-500/30 text-rose-400 bg-rose-500/5'
                          };

                          return (
                            <div 
                              key={t.id} 
                              className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/15 transition-all duration-300 flex flex-col gap-4 relative group"
                            >
                              {/* Quick Locate button floating in card header */}
                              <button
                                onClick={() => {
                                  if (rendererRef.current) {
                                    rendererRef.current.panToGrid(t.pos.x, t.pos.y);
                                    rendererRef.current.selectedEntityId = t.id;
                                    setSelectedEntity({ id: t.id, category: 'Tribe', components: { position: t.pos, society: t.soc, faith: t.faith, movement: t.mv } });
                                  }
                                  setActiveTab('simulation');
                                }}
                                className="absolute top-4 right-4 bg-white/5 hover:bg-sky-500 hover:text-white border border-white/10 hover:border-sky-400 py-1.5 px-3 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer pointer-events-auto"
                              >
                                Ã°Å¸Å½Â¯ Locate Camera
                              </button>

                              <div className="space-y-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest inline-block ${factionColors[t.soc.faction]}`}>
                                  {t.soc.faction}
                                </span>
                                <h4 className="text-base font-bold text-white font-sans mt-1.5 group-hover:text-sky-300 transition-colors">
                                  {t.soc.name.split('[')[0].trim()}
                                </h4>
                                <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">GUID Ref: {t.id} // Coordinate: ({Math.round(t.pos.x)}, {Math.round(t.pos.y)})</span>
                              </div>

                              {/* Developmental Progression Systems Info */}
                              {(() => {
                                const info = getTribeTierInfo(t.soc.population);
                                return (
                                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 font-mono">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                                        <span>{info.icon}</span>
                                        <span>Tier {info.level}: {info.name}</span>
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                                      {info.description}
                                    </p>
                                    
                                    {info.nextThreshold && (
                                      <div className="space-y-1 mt-1 pb-1">
                                        <div className="flex justify-between text-[8px] text-slate-500 uppercase">
                                          <span>Evolution to {info.nextName}</span>
                                          <span>{Math.floor(t.soc.population)} / {info.nextThreshold} Pop</span>
                                        </div>
                                        <div className="w-full bg-slate-900 h-1 rounded overflow-hidden">
                                          <div 
                                            className="bg-sky-400 h-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, (t.soc.population / info.nextThreshold) * 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {info.benefits.map((b, idx) => (
                                        <span key={idx} className="text-[8px] uppercase font-bold tracking-tight text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                                          Ã¢Å“â€œ {b}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Demographics / Parameters */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-white/5 pt-3 font-mono">
                                <div className="flex justify-between items-center text-slate-400">
                                  <span>Population:</span>
                                  <span className="text-white font-bold">{Math.floor(t.soc.population)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                  <span>Happiness:</span>
                                  <span className={`font-bold ${t.soc.happiness > 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {Math.round(t.soc.happiness)}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                  <span>Tech Scale:</span>
                                  <span className="text-cyan-400 font-bold">v{t.soc.technologyLevel.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                  <span>Reserves:</span>
                                  <span className="text-amber-400 font-bold">{Math.floor(t.soc.resources)} RES</span>
                                </div>
                              </div>

                              {/* Interactive Job / Workforce Allocation Sliders */}
                              <div className="border-t border-white/5 pt-3.5 flex flex-col gap-2 font-mono">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-sky-400 font-bold tracking-wider uppercase">Workforce Allocation</span>
                                  <span className="text-[8px] text-slate-500 font-medium">Sum matches 100%</span>
                                </div>
                                <div className="space-y-1.5 text-[11px] bg-white/[0.01] p-3 rounded-2xl border border-white/5">
                                  {/* Gatherers Slider */}
                                  <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-slate-400 text-[9px]">
                                      <span>Ã°Å¸Å’Â¾ Gatherers (Vegetation)</span>
                                      <span className="text-sky-300 font-bold">{Math.round((t.soc.gathererRatio ?? 0.35) * 100)}%</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="1" 
                                      step="0.05"
                                      value={t.soc.gathererRatio ?? 0.35}
                                      onChange={(e) => changeRatio(t.id, 'gatherer', parseFloat(e.target.value))}
                                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 pointer-events-auto"
                                    />
                                  </div>
                                  
                                  {/* Hunters Slider */}
                                  <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex justify-between text-slate-400 text-[9px]">
                                      <span>Ã°Å¸ÂÂ¹ Hunters (Wildlife hunt)</span>
                                      <span className="text-amber-500 font-bold">{Math.round((t.soc.hunterRatio ?? 0.15) * 100)}%</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="1" 
                                      step="0.05"
                                      value={t.soc.hunterRatio ?? 0.15}
                                      onChange={(e) => changeRatio(t.id, 'hunter', parseFloat(e.target.value))}
                                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 pointer-events-auto"
                                    />
                                  </div>

                                  {/* Scholars Slider */}
                                  <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex justify-between text-slate-400 text-[9px]">
                                      <span>Ã°Å¸Â§Âª Scholars (Technological speed)</span>
                                      <span className="text-cyan-400 font-bold">{Math.round((t.soc.researcherRatio ?? 0.20) * 100)}%</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="1" 
                                      step="0.05"
                                      value={t.soc.researcherRatio ?? 0.20}
                                      onChange={(e) => changeRatio(t.id, 'researcher', parseFloat(e.target.value))}
                                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 pointer-events-auto"
                                    />
                                  </div>

                                  {/* Acolytes Slider */}
                                  <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex justify-between text-slate-400 text-[9px]">
                                      <span>Ã°Å¸â€Â® Acolytes (Prayer devotion speed)</span>
                                      <span className="text-purple-400 font-bold">{Math.round((t.soc.acolyteRatio ?? 0.30) * 100)}%</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="1" 
                                      step="0.05"
                                      value={t.soc.acolyteRatio ?? 0.30}
                                      onChange={(e) => changeRatio(t.id, 'acolyte', parseFloat(e.target.value))}
                                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 pointer-events-auto"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Active Divine Directives & Orders */}
                              <div className="border-t border-white/5 pt-3 flex flex-col gap-1.5 font-mono">
                                <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">Mortal Mandates & Orders</span>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {/* Ration Toggle */}
                                  <button
                                    onClick={() => toggleRationMode(t.id)}
                                    className={`py-1.5 px-2 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer pointer-events-auto ${
                                      t.soc.rationMode
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-extrabold shadow-[0_2px_8px_rgba(244,63,94,0.15)]'
                                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/10'
                                    }`}
                                    title="Ã°Å¸ÂÂ² RATION: Cuts consumption by 50% but happiness decreases over time."
                                  >
                                    Ã°Å¸ÂÂ² RATION
                                  </button>
                                  
                                  {/* Strip-mining Toggle */}
                                  <button
                                    onClick={() => toggleStripMineMode(t.id)}
                                    className={`py-1.5 px-2 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer pointer-events-auto ${
                                      t.soc.stripMineMode
                                        ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 font-extrabold shadow-[0_2px_8px_rgba(217,119,6,0.15)]'
                                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/10'
                                    }`}
                                    title="Ã¢â€ºÂÃ¯Â¸Â STRIP-MINE: Double flora harvest speed, but dries out local tiles (reduces humidity, raises temp) and risk permanent grid depletion."
                                  >
                                    Ã¢â€ºÂÃ¯Â¸Â STRIP
                                  </button>

                                  {/* Ritual Tithe Toggle */}
                                  <button
                                    onClick={() => toggleTitheMode(t.id)}
                                    className={`py-1.5 px-2 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer pointer-events-auto ${
                                      t.soc.titheMode
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-extrabold shadow-[0_2px_8px_rgba(16,185,129,0.15)]'
                                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/10'
                                    }`}
                                    title="Ã°Å¸Â©Â¸ TITHE: Autoconsumes 1.5 res/sec to transmute directly into +1.0 Divine Devotion speed."
                                  >
                                    Ã°Å¸Â©Â¸ TITHE
                                  </button>
                                </div>
                              </div>

                              {/* Spells / Divine interventions list on specific societies */}
                              <div className="border-t border-white/5 pt-3.5 flex items-center justify-between">
                                <span className="text-[9px] text-slate-500 uppercase font-mono font-bold">Divine Intervene:</span>
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={() => {
                                      const sim = simulationRef.current;
                                      if (sim) {
                                        sim.triggerLocalizedSpell('Sanctity Aura', t.pos.x, t.pos.y);
                                        setLogs([...sim.eventLogs]);
                                      }
                                    }}
                                    className="py-1 px-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-white border border-sky-500/20 hover:border-sky-400 text-[9px] font-mono font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer pointer-events-auto"
                                  >
                                    Ã¢Å“Â¨ Inspire (+50 Faith)
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const sim = simulationRef.current;
                                      if (sim) {
                                        sim.triggerLocalizedSpell('Meteor', t.pos.x, t.pos.y);
                                        setLogs([...sim.eventLogs]);
                                      }
                                    }}
                                    className="py-1 px-2.5 bg-red-500/15 hover:bg-red-500/30 text-rose-400 hover:text-white border border-red-500/20 hover:border-red-400 text-[9px] font-mono font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer pointer-events-auto"
                                  >
                                    Ã¢Ëœâ€žÃ¯Â¸Â Disintegrate
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* --- CEASELESS GEOPOLITICAL ALIGNMENT & WAR LEDGER --- */}
                      <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-pink-500 font-mono text-[9px] uppercase tracking-widest block font-bold">Patron Deity Geopolitical Command Board</span>
                          <h4 className="text-lg font-bold text-white flex items-center gap-2 font-sans">
                            Ã°Å¸â€”ÂºÃ¯Â¸Â Inter-Tribal Relations Matrix
                          </h4>
                          <p className="text-xs text-slate-400 font-light max-w-2xl leading-relaxed">
                            Mortals forge natural alliances or wage brutal wars based on theological proximity. Intervene with Devotion (ÃŽâ€) to alter relationships, establish trade pacts, or instigate profitable schisms.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 select-text pointer-events-auto">
                          {getSimulatedSocieties().map(tribeA => {
                            const otherTribes = getSimulatedSocieties().filter(tribe => tribe.id !== tribeA.id);
                            if (otherTribes.length === 0) return null;
                            
                            return (
                              <div key={`geo-lead-${tribeA.id}`} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-sky-300">
                                      {tribeA.soc.name.split('[')[0].trim()}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">({tribeA.soc.faction})</span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-mono">GUID: {tribeA.id}</span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {otherTribes.map(tribeB => {
                                    const simObj = simulationRef.current;
                                    const relVal = simObj ? simObj.getOrCreateRelation(tribeA.id, tribeB.id) : 0;
                                    
                                    // Status styling
                                    let statusText = "Peaceful Coexistence";
                                    let statusColor = "text-slate-400 bg-slate-400/5 border-slate-400/20";
                                    let statusEmoji = "Ã¢Å¡â€“Ã¯Â¸Â";
                                    
                                    if (relVal >= 75) {
                                      statusText = "Holy Alliance";
                                      statusColor = "text-teal-400 bg-teal-400/10 border-teal-400/30 font-black animate-pulse";
                                      statusEmoji = "Ã°Å¸â€ºÂ¡Ã¯Â¸Â";
                                    } else if (relVal >= 35) {
                                      statusText = "Trading Partners";
                                      statusColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/30 font-bold";
                                      statusEmoji = "Ã°Å¸Â¤Â";
                                    } else if (relVal < -30) {
                                      statusText = "Universal War";
                                      statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/30 font-black animate-pulse";
                                      statusEmoji = "Ã¢Å¡â€Ã¯Â¸Â";
                                    } else if (relVal < -10) {
                                      statusText = "Border Hostility";
                                      statusColor = "text-amber-500/90 bg-amber-500/5 border-amber-500/20";
                                      statusEmoji = "Ã¢Å¡Â Ã¯Â¸Â";
                                    }
                                    
                                    return (
                                      <div key={`geo-rel-${tribeA.id}-${tribeB.id}`} className="bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-colors">
                                        <div className="flex justify-between items-start">
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Relation with:</span>
                                            <span className="text-xs font-bold text-white max-w-[160px] truncate block font-sans" title={tribeB.soc.name}>
                                              {tribeB.soc.name.split('[')[0].trim()}
                                            </span>
                                          </div>
                                          
                                          <div className="flex flex-col items-end gap-1 font-mono">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusColor} flex items-center gap-1`}>
                                              {statusEmoji} {statusText}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">
                                              Affinity index: <span className={relVal >= 35 ? 'text-emerald-400' : relVal < -30 ? 'text-rose-400' : 'text-white'}>{Math.round(relVal)}</span>
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {/* Action buttons list */}
                                        <div className="flex gap-1.5 border-t border-white/5 pt-2.5">
                                          {/* Trade Alliance */}
                                          <button
                                            disabled={relVal >= 75}
                                            onClick={() => {
                                              const sim = simulationRef.current;
                                              if (!sim) return;
                                              if (sim.totalDevotion < 20) {
                                                alert("Need at least 20 ÃŽâ€ Devotion points to establish a Trade Treaty.");
                                                return;
                                              }
                                              sim.totalDevotion -= 20;
                                              sim.setRelation(tribeA.id, tribeB.id, relVal + 30);
                                              
                                              const nameA = tribeA.soc.name.split('[')[0].trim();
                                              const nameB = tribeB.soc.name.split('[')[0].trim();
                                              sim.addEventLog('MIRACLE', `Ã°Å¸Â¤Â Divine Broker: Established cross-continent Trade Treaty between ${nameA} and ${nameB} (+30 Affinity).`);
                                              setLogs([...sim.eventLogs]);
                                              setDevotion(Math.floor(sim.totalDevotion));
                                            }}
                                            className="flex-1 py-1 px-1.5 select-none bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-400 disabled:opacity-40 hover:text-white border border-emerald-500/20 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer pointer-events-auto"
                                            title="Cost: 20 ÃŽâ€. Increases friendship by +30 points, facilitating trade state."
                                          >
                                            Ã°Å¸Å’Â¾ Trade Pact (20ÃŽâ€)
                                          </button>
                                          
                                          {/* Treaty Peace Broker */}
                                          {relVal < 0 && (
                                            <button
                                              onClick={() => {
                                                const sim = simulationRef.current;
                                                if (!sim) return;
                                                if (sim.totalDevotion < 35) {
                                                  alert("Need at least 35 ÃŽâ€ Devotion points to force an armistice.");
                                                  return;
                                                }
                                                sim.totalDevotion -= 35;
                                                sim.setRelation(tribeA.id, tribeB.id, 15);
                                                
                                                const nameA = tribeA.soc.name.split('[')[0].trim();
                                                const nameB = tribeB.soc.name.split('[')[0].trim();
                                                sim.addEventLog('MIRACLE', `Ã°Å¸â€¢Å Ã¯Â¸Â Cosmic Harmony: Imposed divine ceasefire pact; hostilities ceased between ${nameA} and ${nameB}.`);
                                                setLogs([...sim.eventLogs]);
                                                setDevotion(Math.floor(sim.totalDevotion));
                                              }}
                                              className="flex-1 py-1 px-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-white border border-blue-500/20 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer pointer-events-auto"
                                              title="Cost: 35 ÃŽâ€. Instantly brokers absolute peace between combatants, updating relation score to +15."
                                            >
                                              Ã°Å¸â€¢Å Ã¯Â¸Â Peace (35ÃŽâ€)
                                            </button>
                                          )}
                                          
                                          {/* Incite Disarray / War */}
                                          <button
                                            disabled={relVal < -75}
                                            onClick={() => {
                                              const sim = simulationRef.current;
                                              if (!sim) return;
                                              if (sim.totalDevotion < 15) {
                                                alert("Need at least 15 ÃŽâ€ Devotion points to sow discourse.");
                                                return;
                                              }
                                              sim.totalDevotion -= 15;
                                              sim.setRelation(tribeA.id, tribeB.id, relVal - 55);
                                              
                                              const nameA = tribeA.soc.name.split('[')[0].trim();
                                              const nameB = tribeB.soc.name.split('[')[0].trim();
                                              sim.addEventLog('SCHISM', `Ã¢Å¡Â¡ Divine Sabotage: Celested whispers incite civil discord between ${nameA} and ${nameB} (-55 Affinity).`);
                                              setLogs([...sim.eventLogs]);
                                              setDevotion(Math.floor(sim.totalDevotion));
                                            }}
                                            className="flex-1 py-1 px-1.5 select-none bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/40 text-rose-400 disabled:opacity-45 hover:text-white border border-rose-500/20 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer pointer-events-auto"
                                            title="Cost: 15 ÃŽâ€. Instigates territorial rivalry, decreases relationship score by -55."
                                          >
                                            Ã¢Å¡Â¡ Incite War (15ÃŽâ€)
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'progression' ? (
                <div className="w-full max-w-5xl bg-slate-950/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh] text-white">
                  {/* Title Bar */}
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-indigo-400 font-mono text-[9px] uppercase tracking-widest block font-bold">Divine Ascendancy Hub</span>
                      <h3 className="text-2xl font-bold tracking-tight capitalize flex items-center gap-3 text-white font-sans">
                        <Award className="text-indigo-400 w-7 h-7 animate-pulse animate-duration-3000" />
                        Divine Illumination & Achievements
                      </h3>
                    </div>
                    <button onClick={() => setActiveTab('simulation')} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer pointer-events-auto">
                      Ã¢Å“â€¢
                    </button>
                  </div>

                  {/* Body Grid Layout */}
                  <div className="overflow-y-auto flex-1 pr-1.5 grid grid-cols-1 lg:grid-cols-12 gap-6 custom-scrollbar select-text pointer-events-auto">
                    {/* Left stats & level tracker column */}
                    <div className="lg:col-span-5 bg-white/[0.015] border border-white/5 rounded-2xl p-6 flex flex-col justify-between gap-6">
                      <div className="space-y-6">
                        {/* Divine Badge */}
                        <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex flex-col items-center justify-center border border-indigo-400/30 shrink-0 shadow-[0_4px_16px_rgba(102,126,241,0.25)]">
                            <span className="text-[8px] font-mono uppercase tracking-wider text-indigo-200 block">LEVEL</span>
                            <span className="text-2xl font-black leading-none text-white">{progression.level}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-mono text-indigo-400 font-bold tracking-widest uppercase block">CURRENT DEGREE</span>
                            <h4 className="text-base font-bold text-white leading-tight truncate font-sans">
                              {progression.level >= 10 ? 'Omnipotent Overlord' : progression.level >= 7 ? 'Cosmic Archon' : progression.level >= 4 ? 'Ethereal Watcher' : 'Novice Demiurge'}
                            </h4>
                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">Mortal deeds feed cosmic wisdom</span>
                          </div>
                        </div>

                        {/* XP bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-mono text-slate-400">
                            <span>Experience Progress</span>
                            <span className="text-indigo-300 font-bold">{Math.floor(progression.xp)} / {progression.xpNeeded} XP</span>
                          </div>
                          <div className="w-full h-3 bg-slate-950 border border-white/5 rounded-full overflow-hidden p-0.5">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_8px_rgba(99,102,241,0.45)] transition-all duration-500"
                              style={{ width: `${Math.min(100, (progression.xp / progression.xpNeeded) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Spark of Lights info */}
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/15 rounded-xl flex items-center gap-3">
                          <span className="text-2xl animate-bounce">Ã¢Å“Â¨</span>
                          <div>
                            <span className="text-[9px] font-mono text-indigo-300 font-bold uppercase tracking-wider block">Sparks of Illumination</span>
                            <h5 className="text-base font-black text-indigo-100">{progression.illuminationPoints} Point(s) Available</h5>
                            <p className="text-[10px] text-indigo-200/50 leading-tight">Acquired upon leveling up. Spend to master global passive boosts opposite.</p>
                          </div>
                        </div>

                        {/* Active Passives Summary */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest block">Passive Boosts Unlocked</span>
                          <div className="flex flex-wrap gap-1.5">
                            {progression.unlockedIlluminations.length === 0 ? (
                              <span className="text-[10px] italic text-slate-550 p-2 border border-white/5 bg-white/[0.01] rounded-lg block w-full">No global miracles mastered yet. Earn experiences to level-up.</span>
                            ) : (
                              progression.unlockedIlluminations.map(id => {
                                const boost = ILLUMINATION_BOOSTS.find(b => b.id === id);
                                if (!boost) return null;
                                return (
                                  <span key={id} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-400/20 rounded-full text-indigo-300 text-[10px] font-mono font-bold tracking-tight">
                                    <span>{boost.icon}</span>
                                    <span>{boost.name}</span>
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cumulative mortal deeds stats list */}
                      <div className="border-t border-white/5 pt-4 space-y-3 font-mono">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Historical Archive of Deeds</span>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                            <span className="text-slate-500 block">Miracles Cast:</span>
                            <span className="text-base font-bold text-white">{progression.actionsCompleted.miraclesCast}</span>
                          </div>
                          <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                            <span className="text-slate-500 block">Flora Harvests:</span>
                            <span className="text-base font-bold text-emerald-400">{progression.actionsCompleted.floraHarvested}</span>
                          </div>
                          <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                            <span className="text-slate-500 block">Fauna Hunted:</span>
                            <span className="text-base font-bold text-sky-400">{progression.actionsCompleted.faunaHunted}</span>
                          </div>
                          <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                            <span className="text-slate-500 block">Altars Erected:</span>
                            <span className="text-base font-bold text-amber-400">{progression.actionsCompleted.structuresErected}</span>
                          </div>
                          <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl col-span-2 flex justify-between items-center px-3">
                            <span className="text-slate-500 text-[9px]">Climate Commands:</span>
                            <span className="text-sm font-bold text-indigo-300">{progression.actionsCompleted.weatherInterventions}</span>
                          </div>
                          <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl col-span-2 flex justify-between items-center px-3">
                            <span className="text-slate-500 text-[9px]">Devotion Yields (Static):</span>
                            <span className="text-sm font-bold text-pink-400">{Math.round(progression.actionsCompleted.devotionAccumulated)} ÃŽâ€</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side interactive boosts grid */}
                    <div className="lg:col-span-7 space-y-3 flex flex-col">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Available Divine Illuminations</span>
                      </div>
                      <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">
                        {ILLUMINATION_BOOSTS.map(boost => {
                          const unlocked = progression.unlockedIlluminations.includes(boost.id);
                          const canAfford = progression.illuminationPoints > 0;
                          return (
                            <div 
                              key={boost.id} 
                              className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between gap-4 pointer-events-auto bg-gradient-to-r ${boost.colorBg} ${
                                unlocked 
                                ? 'bg-indigo-950/20 border-indigo-500/30' 
                                : 'bg-slate-900/45 border-white/5 hover:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]'
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className="text-xl p-2 bg-black/45 border border-white/5 rounded-lg block shrink-0">{boost.icon}</span>
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-2 font-sans">
                                    {boost.name}
                                    {unlocked && <span className="px-1.5 py-0.5 rounded text-[7px] font-mono tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>}
                                  </h4>
                                  <p className="text-[10px] text-slate-450 font-light leading-snug">{boost.description}</p>
                                  <div className="pt-0.5 flex items-center gap-1.5">
                                    <span className="text-[9px] font-mono text-indigo-300 lowercase block bg-indigo-500/10 border border-indigo-400/10 px-2 py-0.5 rounded font-medium">
                                      Effect: {boost.effectDesc}
                                    </span>
                                  </div>
                                </div>
                              </div>
 
                              <div className="shrink-0">
                                {unlocked ? (
                                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest block px-2.5 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/15">
                                    Ã¢Å“â€œ Mastered
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => unlockIllumination(boost.id)}
                                    disabled={!canAfford}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all pointer-events-auto cursor-pointer ${
                                      canAfford
                                      ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_3px_8px_rgba(99,102,241,0.25)] border border-indigo-400'
                                      : 'bg-white/5 text-slate-500 border border-transparent opacity-40 cursor-not-allowed'
                                    }`}
                                  >
                                    Unlock (1 Spark)
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Civilization Developmental Tiers Milestones Chart */}
                      <div className="pt-4 border-t border-white/10 space-y-2 mt-auto">
                        <span className="text-[10px] text-amber-500 font-mono font-bold uppercase tracking-widest block">Civilization Developmental Milestones</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                          {[
                            { lvl: 1, name: "Sentinel Outpost", pop: "1+ Pop", icon: "Ã°Å¸â€ºâ€“" },
                            { lvl: 2, name: "Pioneer Clan", pop: "10+ Pop", icon: "Ã¢â€ºÂº" },
                            { lvl: 3, name: "Settled Hamlet", pop: "25+ Pop", icon: "Ã°Å¸ÂÂ¡" },
                            { lvl: 4, name: "Cohesive Village", pop: "50+ Pop", icon: "Ã°Å¸ÂÂ°" },
                            { lvl: 5, name: "Sovereign Town", pop: "150+ Pop", icon: "Ã°Å¸Ââ€ºÃ¯Â¸Â" },
                            { lvl: 6, name: "Capital City", pop: "500+ Pop", icon: "Ã¢â€ºÂª" },
                            { lvl: 7, name: "Sprawling Metropolis", pop: "1,500+ Pop", icon: "Ã°Å¸Å’Å’" },
                            { lvl: 8, name: "Sovereign Cosmic Empire", pop: "4,000+ Pop", icon: "Ã°Å¸â€˜â€˜" }
                          ].map(tier => (
                            <div key={tier.lvl} className="p-2.5 border border-white/5 bg-white/[0.015] rounded-xl flex flex-col justify-between gap-1 shadow-[0_4px_12px_rgba(0,0,0,0.2)] font-mono hover:bg-white/[0.03] transition-all">
                              <div className="flex justify-between items-center">
                                <span className="text-[8px] font-bold text-slate-500 uppercase">T{tier.lvl}</span>
                                <span className="text-xs">{tier.icon}</span>
                              </div>
                              <div className="mt-1">
                                <div className="text-[9px] font-bold text-white truncate leading-tight select-none">{tier.name}</div>
                                <div className="text-[8px] text-amber-500 mt-0.5">{tier.pop}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-5xl bg-slate-950/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-purple-400 font-mono text-[9px] uppercase tracking-widest block">L0-L1 Theological Layer</span>
                      <h3 className="text-2xl font-bold tracking-tight capitalize flex items-center gap-3 text-white">
                        <TrendingUp className="text-purple-400 w-7 h-7" />
                        Planetary Belief Matrix
                      </h3>
                    </div>
                    <button onClick={() => setActiveTab('simulation')} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer">
                      Ã¢Å“â€¢
                    </button>
                  </div>

                  <div className="overflow-y-auto flex-1 pr-1.5 space-y-6 custom-scrollbar select-text pointer-events-auto">
                    {(() => {
                      const societies = getSimulatedSocieties();
                      const religiousBodiesCount = societies.filter(s => s.faith.dominantSystem !== 'SECULAR').length;
                      const nonBelieversPercentage = societies.length > 0 
                        ? Math.round((societies.filter(s => s.faith.dominantSystem === 'SECULAR').length / societies.length) * 100) 
                        : 0;
                      const netYieldVal = societies.reduce((acc, s) => {
                        const baseRate = s.soc.population * 0.012;
                        const multipliers = {
                          'ANIMISM': 0.8,
                          'ELEMENTALISM': 1.0,
                          'INTERVENTIONIST': 1.6,
                          'SECULAR': 0.2,
                          'NIHILISM': 0.1
                        };
                        const mult = multipliers[s.faith.dominantSystem] || 1.0;
                        return acc + (baseRate * mult);
                      }, 0);

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <ModalCard title="Planetary Devotion Yield" value={`+${netYieldVal.toFixed(1)}/sec`} info="Consolidated net yield of Divine Devotion harvested from mortal prayer structures." />
                          <ModalCard title="Primal Belief Ratio" value={`${societies.length > 0 ? Math.round((religiousBodiesCount / societies.length) * 100) : 100}%`} info="Proportion of civilizations that actively maintain transcendental spiritualism." />
                          <ModalCard title="Secular Enlightenment" value={`${nonBelieversPercentage}%`} info="Mortal societies which abandoned ritualistic beliefs for standard physics and empiricism." />
                        </div>
                      );
                    })()}

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Theological Matrix Breakdown</span>
                        <span className="text-[9px] font-mono text-slate-400 animate-pulse">Live feedback grid</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            id: 'ANIMISM',
                            title: 'Naturalistic Animism',
                            description: 'The belief that non-human entities contain active spiritual essences. Thrives on flora, forest canopies, and organic stags.',
                            color: 'emerald',
                            colorHex: '#10b981',
                            multiplier: '0.8x devotion yield',
                            sacrament: 'Manifest Bio-Bloom',
                            cost: 80,
                            action: () => {
                              const sim = simulationRef.current;
                              if (sim) {
                                for(let idx=0; idx<6; idx++) {
                                  const rx = Math.floor(Math.random() * 64);
                                  const ry = Math.floor(Math.random() * 64);
                                  sim.spawnFlora(rx, ry, 'TREE', 'Oak');
                                }
                                sim.addEventLog('MIRACLE', 'Planetary Gaia sacrament manifested beautiful Oak forests in the Verdant Rift.');
                              }
                            }
                          },
                          {
                            id: 'ELEMENTALISM',
                            title: 'Elemental Cosmology',
                            description: 'Devoted adoration of high physical energy sources, volcanics, cosmic bodies, and the majestic infinite solar system structures.',
                            color: 'orange',
                            colorHex: '#f97316',
                            multiplier: '1.0x devotion yield',
                            sacrament: 'Cosmic Shard Cascade',
                            cost: 100,
                            action: () => {
                              const sim = simulationRef.current;
                              if (sim) {
                                for(let idx=0; idx<4; idx++) {
                                  const rx = Math.floor(Math.random() * 64);
                                  const ry = Math.floor(Math.random() * 64);
                                  sim.spawnFlora(rx, ry, 'NANO_BANANA', 'COSMIC');
                                }
                                sim.addEventLog('MIRACLE', 'Deity invoked Cosmos Sacrament, drawing Deep Cosmic Bananas to the surface.');
                              }
                            }
                          },
                          {
                            id: 'INTERVENTIONIST',
                            title: 'Transcendental Theism',
                            description: 'Devotion dedicated to direct interaction with the Deity. High belief concentration leads to highly volatile devotion harvests.',
                            color: 'amber',
                            colorHex: '#f59e0b',
                            multiplier: '1.6x devotion yield',
                            sacrament: 'Aura of Saintly Rapture',
                            cost: 110,
                            action: () => {
                              const sim = simulationRef.current;
                              if (sim) {
                                sim.totalDevotion += 250;
                                sim.addEventLog('MIRACLE', 'Activated Aura of Saintly Rapture. Mortal devotion focusing amplified global reserves (+250 ÃŽâ€).');
                              }
                            }
                          },
                          {
                            id: 'SECULAR',
                            title: 'Secular Empiricism',
                            description: 'Rational intellectual framework prioritizing scientific method. Yields minimal devotion, but speeds up technology levels.',
                            color: 'sky',
                            colorHex: '#06b6d4',
                            multiplier: '0.2x devotion yield',
                            sacrament: 'Technological Catalyst Cascade',
                            cost: 90,
                            action: () => {
                              if (ecsRef.current && simulationRef.current) {
                                const list = ecsRef.current.getEntitiesWith(['society']);
                                list.forEach(e => {
                                  const soc = ecsRef.current.getComponent<Society>(e, 'society')!;
                                  soc.technologyLevel += 0.85;
                                });
                                simulationRef.current.addEventLog('EVOLUTION', 'Initiated planetary secular paradigm cycle. Technology level coefficient increased dynamically.');
                              }
                            }
                          }
                        ].map(belief => {
                          const valCount = getSimulatedSocieties().filter(s => s.faith.dominantSystem === belief.id).length;
                          const total = getSimulatedSocieties().length || 1;
                          const pct = Math.round((valCount / total) * 100);

                          return (
                            <div 
                              key={belief.id} 
                              className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col justify-between gap-5 relative group"
                            >
                              <div>
                                <div className="flex justify-between items-center">
                                  <h4 className="text-base font-bold text-white tracking-tight">{belief.title}</h4>
                                  <span 
                                    className="text-[10px] font-mono font-bold"
                                    style={{ color: belief.colorHex }}
                                  >
                                    {valCount} Factions ({pct}%)
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-light leading-relaxed">
                                  {belief.description}
                                </p>
                                <span className="text-[9px] font-mono uppercase bg-white/5 border border-white/10 rounded-md py-0.5 px-2 mt-2.5 inline-block text-slate-400">
                                  {belief.multiplier}
                                </span>
                              </div>

                              {/* Custom progress bar */}
                              <div className="space-y-1">
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${pct}%`, backgroundColor: belief.colorHex }}
                                    className="h-full rounded-full transition-all duration-500"
                                  />
                                </div>
                              </div>

                              {/* Sacrament button to cast global spells of this religion */}
                              <div className="border-t border-white/5 pt-3.5 flex items-center justify-between">
                                <div>
                                  <span className="text-[8px] text-slate-500 font-mono block uppercase">SACRAMENT SKILL</span>
                                  <span className="text-xs font-semibold text-white">{belief.sacrament}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    const sim = simulationRef.current;
                                    if (sim && devotion >= belief.cost) {
                                      sim.totalDevotion -= belief.cost;
                                      setDevotion(Math.floor(sim.totalDevotion));
                                      belief.action();
                                      setLogs([...sim.eventLogs]);
                                    }
                                  }}
                                  disabled={devotion < belief.cost}
                                  className="py-1.5 px-3 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider bg-white/5 hover:bg-purple-500 hover:text-white border border-white/10 hover:border-purple-400 transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none cursor-pointer pointer-events-auto"
                                >
                                  EXECUTE ({belief.cost} ÃŽâ€)
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* If no selected god, force choice screen */}
        {!selectedGod && !showStartMenu && (
          <DeitySelectionOverlay 
            onSelect={(god) => {
              setSelectedGod(god);
              if (ecsRef.current && simulationRef.current) {
                simulationRef.current.activeGodId = god.id;
                god.startingBoost(ecsRef.current, simulationRef.current);
                setDevotion(Math.floor(simulationRef.current.totalDevotion));
              }
              setActiveTab('simulation');
            }} 
          />
        )}

        {/* Immersive Start Menu / Splash Overlay */}
        <AnimatePresence>
          {showStartMenu && (
            <StartMenuOverlay
              saveSlots={saveSlots}
              onLoadGame={loadGame}
              onResume={() => setShowStartMenu(false)}
              onImport={importStateFromJSON}
              onLaunchNewGame={(config) => {
                const sim = simulationRef.current;
                if (sim) {
                  ecsRef.current.clear();
                  const newSim = new SimulationEngine(ecsRef.current);
                  simulationRef.current = newSim;

                  // 1. Core values
                  newSim.globalTemperature = config.temperature;
                  newSim.globalHumidity = config.humidity;
                  newSim.totalDevotion = config.startingDevotion;
                  
                  // Set initial weather based on parameters
                  if (config.humidity > 70) {
                    newSim.setWeather('RAINY', 45, 0.6);
                  } else if (config.temperature > 35) {
                    newSim.setWeather('DROUGHT', 45, 0.7);
                  } else {
                    newSim.setWeather('CLEAR', 45, 0.5);
                  }

                  // 2. Deity selection
                  const godObj = GODS_PANTHEON.find(g => g.id === config.deityId);
                  if (godObj) {
                    setSelectedGod(godObj);
                    newSim.activeGodId = godObj.id;
                    godObj.startingBoost(ecsRef.current, newSim);
                  } else {
                    setSelectedGod(null);
                  }

                  // 3. React bindings update
                  setDevotion(Math.floor(newSim.totalDevotion));
                  setProgression({
                    level: newSim.divineLevel,
                    xp: newSim.divineXP,
                    xpNeeded: newSim.divineXPNeeded,
                    illuminationPoints: newSim.illuminationPoints,
                    unlockedIlluminations: [...newSim.unlockedIlluminations],
                    actionsCompleted: { ...newSim.actionsCompleted }
                  });
                  setWeatherInfo({
                    weather: newSim.weather,
                    timeLeft: newSim.weatherTimeLeft,
                    timer: newSim.weatherTimer,
                    temperature: newSim.globalTemperature,
                    humidity: newSim.globalHumidity
                  });
                  setLogs([...newSim.eventLogs]);

                  // Don't redraw terrain here - newSim doesn't have terrain yet
                  // Terrain was already drawn during initial setup in useEffect

                  setShowStartMenu(false);
                  setActiveTab('simulation');
                  newSim.addEventLog('MIRACLE', `Ã°Å¸Â§Â¬ COGNITIVE GENESIS: Seeded "${godObj?.name ?? 'Mortal State'}" at climate temperature ${config.temperature}Ã‚Â°C.`);
                }
              }}
            />
          )}
        </AnimatePresence>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Render Debug Panel toggle button Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <button
          id="render-debug-toggle"
          onClick={() => setShowRenderDebug(v => !v)}
          title="Toggle Render Debug Panel (shows pipeline stages)"
          style={{
            position: 'fixed',
            top: 36,
            right: 16,
            zIndex: 9998,
            background: showRenderDebug
              ? 'rgba(34, 211, 238, 0.18)'
              : 'rgba(8, 12, 24, 0.85)',
            border: `1px solid ${showRenderDebug ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8,
            color: showRenderDebug ? '#22d3ee' : '#64748b',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: 10,
            padding: '4px 10px',
            letterSpacing: 1,
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s',
            boxShadow: showRenderDebug ? '0 0 12px rgba(34,211,238,0.25)' : 'none',
          }}
        >
          Ã¢Â¬Â¡ RENDER
        </button>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Render Debug Panel Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {showRenderDebug && (
          <RenderDebugPanel
            renderer={rendererRef.current}
            onClose={() => setShowRenderDebug(false)}
          />
        )}
      </div>
    </div>
  );

function TopStat({ label, value, unit, color = "text-white", isMobile }: { label: string, value: string | number, unit: string, color?: string, isMobile?: boolean }) {
  return (
    <div className={`flex flex-col ${isMobile ? 'items-start' : 'items-end'}`}>
      <span className={`${isMobile ? 'text-[7px]' : 'text-[9px]'} uppercase tracking-widest opacity-40 font-mono mb-0.5`}>{label}</span>
      <span className={`${isMobile ? 'text-xs' : 'text-xl'} ${color} font-bold tracking-tight`}>
        {value} <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} opacity-60 font-mono ml-0.5`}>{unit}</span>
      </span>
    </div>
  );
}

function NavIcon({ children, active, onClick, title, isMobile }: { children: React.ReactNode, active?: boolean, onClick?: () => void, title?: string, isMobile?: boolean }) {
  return (
    <div 
      onClick={onClick}
      title={title}
      className={`${isMobile ? 'w-12 h-12' : 'w-11 h-11'} flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer ${
        active 
        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
        : 'bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
      }`}
    >
      {children}
    </div>
  );
}

function FaithTile({ title, type, value, tag, colorClass, active }: { title: string, type: string, value: string, tag: string, colorClass: 'emerald' | 'orange' | 'amber' | 'sky', active: boolean }) {
  const colors = {
    emerald: 'bg-emerald-950/25 border-emerald-500/30 text-emerald-300 shadow-lg shadow-emerald-500/5',
    orange: 'bg-orange-950/25 border-orange-500/30 text-orange-300 shadow-lg shadow-orange-500/5',
    amber: 'bg-amber-950/35 border-amber-500/45 text-amber-300 shadow-2xl shadow-amber-500/5',
    sky: 'bg-sky-950/25 border-sky-500/30 text-sky-300 shadow-lg shadow-sky-500/5'
  };

  return (
    <div className={`${active ? colors[colorClass] : 'bg-[#020304]/30 border-white/5 text-slate-500 opacity-40'} border backdrop-blur-md p-4 rounded-2xl flex flex-col justify-between transition-all duration-350 group hover:border-white/20 hover:-translate-y-0.5`}>
      <div className="flex flex-col gap-0.5">
        <span className={`text-[8px] font-mono uppercase tracking-[0.2em] opacity-80 ${active ? '' : 'text-slate-500'}`}>{type}</span>
        <h4 className={`text-xs font-semibold tracking-tight text-white ${active ? '' : 'opacity-40'}`}>{title}</h4>
      </div>
      <div className="flex items-end justify-between font-mono mt-2">
        <span className="text-xl font-bold tracking-tighter text-white">{value}<span className="text-[9px] font-light opacity-50 ml-0.5">SECTS</span></span>
        <div className={`text-[8px] font-bold tracking-widest ${active ? '' : 'text-slate-700'}`}>{tag}</div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, percent, color }: { label: string, value: string, percent: number, color: string }) {
  return (
    <div className="space-y-1.5 font-mono">
      <div className="flex justify-between text-[9px] tracking-widest opacity-60">
        <span>{label}</span>
        <span className={color.replace('bg-', 'text-')}>{value}</span>
      </div>
      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={`${color} h-full rounded-full`} 
        />
      </div>
    </div>
  );
}

function ModalCard({ title, value, info }: { title: string, value: string, info: string }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-slate-900/60 transition-colors font-sans duration-300">
      <h4 className="text-[10px] text-slate-500 mb-2 uppercase tracking-[0.2em] font-mono">{title}</h4>
      <div className="text-4xl font-bold mb-4 text-white tracking-tight">{value}</div>
      <p className="text-xs text-slate-400 leading-relaxed font-light">{info}</p>
    </div>
  );
}

function IconButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 border rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
        active 
          ? 'bg-amber-500/30 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)] backdrop-blur-sm' 
          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function SubButton({ active, onClick, label, title }: { active: boolean, onClick: () => void, label: string, title?: string, key?: any }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-3 py-1.5 rounded-md text-[9px] font-mono tracking-wide transition-all duration-200 shrink-0 ${
        active 
          ? 'bg-sky-500/25 border border-sky-400/50 text-sky-300 backdrop-blur-sm shadow-[0_0_8px_rgba(14,165,233,0.15)]' 
          : 'bg-black/55 border border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  );
}
}
