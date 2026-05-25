
export type Entity = string;

export interface Component {
  type: string;
}

export interface Position extends Component {
  type: 'position';
  x: number;
  y: number;
  z: number;
}

export interface Physics extends Component {
  type: 'physics';
  temperature: number; // 0-100
  humidity: number;    // 0-100
  height: number;      // 0-1 (Terrain)
}

export interface Biology extends Component {
  type: 'biology';
  biomass: number;
  health: number;
  dna: string;
}

export interface Society extends Component {
  type: 'society';
  name: string;
  faction: 'ANIMIST' | 'TECHNOCRAT' | 'INTERVENTIONIST' | 'NIHILIST' | 'ELEMENTAL';
  population: number;
  technologyLevel: number;
  resources: number;
  happiness: number;
  gathererRatio?: number; // percentage of population in gathering (0-1), default 0.35
  hunterRatio?: number;   // percentage of population in hunting (0-1), default 0.15
  researcherRatio?: number; // percentage of population in technology (0-1), default 0.20
  acolyteRatio?: number;  // percentage of population in spiritualism (0-1), default 0.30
  rationMode?: boolean;   // cuts consumption by 50% but happiness decreases
  stripMineMode?: boolean;// double harvest yield but permanently destroys/damages flora and reduces happiness
  titheMode?: boolean;    // auto-sacrifice 1.5 res/sec into +1.0 devotion/sec
  tierLevel?: number;     // current development tier level (1 to 8)
}

export type FaithSystemType = 'ANIMISM' | 'ELEMENTALISM' | 'INTERVENTIONIST' | 'SECULAR' | 'NIHILISM';

export interface Faith extends Component {
  type: 'faith';
  devotion: number;
  dominantSystem: FaithSystemType;
  beliefMatrix: Record<FaithSystemType, number>;
}

export interface Flora extends Component {
  type: 'flora';
  category: 'CROP' | 'NANO_BANANA' | 'EXOTIC' | 'TREE';
  subType: string; // e.g., 'GOLD', 'CYBER', 'VOID', etc.
  growth: number;  // 0-100
  resourcesYield: number;
  isHarvested: boolean;
  soilMoisture?: number;   // 0-100 values
  soilNutrients?: number;  // 0-100 values
  pestLevel?: number;      // 0-100 levels
  diseaseActive?: boolean; // infection status
  cultivarTier?: number;   // 1 to 5 quality mutation
}

export interface Fauna extends Component {
  type: 'fauna';
  category: 'WOLF' | 'STAG' | 'COW' | 'CELESTIAL';
  subType: string;
  health: number;
  hunger: number;
  aggressiveness: number; // 0-100
  actionState: 'WANDERING' | 'HUNTING' | 'FLEEING' | 'GRAZING';
}

export interface Structure extends Component {
  type: 'structure';
  category: 'ALTAR' | 'REACTOR' | 'HABITAT' | 'DEFENSE' | 'FARM';
  subType: string;
  durability: number;
  efficiency: number; // multiplier
}

export interface Movement extends Component {
  type: 'movement';
  speed: number;
  vx: number;
  vy: number;
  targetX: number | null;
  targetY: number | null;
  activityState: 'IDLE' | 'WANDERING' | 'MOVING_TO_RESOURCE' | 'PRAYING' | 'FLEEING';
}

export interface Prayer extends Component {
  type: "prayer";
  questType: string;
  targetValue: string;
  durationLeft: number;
  rewardDevotion: number;
  isFulfilled: boolean;
}

export interface GameState {
  entities: Map<Entity, Component[]>;
  time: number;
  totalDevotion: number;
  currentIntervention: string | null;
}

