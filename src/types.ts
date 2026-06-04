
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

export interface RenderableEntity {
  id: string;
  x: number;
  y: number;
  category: 'Tribe' | 'Flora' | 'Fauna' | 'Structure';
  subType: string;
  name: string;
  faction?: 'ANIMIST' | 'TECHNOCRAT' | 'INTERVENTIONIST' | 'NIHILIST' | 'ELEMENTAL' | string;
  activityState?: string;
  population?: number;
  resources?: number;
  growth?: number;
  health?: number;
  isSelected?: boolean;
}

// ============================================================================
// Economy & Progression Types
// ============================================================================

export type ResourceType = 'Wood' | 'Stone' | 'Food' | 'Metal' | 'Crystal' | 'DivineEssence';

export interface ResourceStorage extends Component {
  type: 'resourceStorage';
  capacity: number;
  contents: Partial<Record<ResourceType, number>>;
  structureType: 'HABITAT' | 'FARM' | 'REACTOR' | 'ALTAR' | 'DEFENSE' | string;
}

export interface GatheringTask extends Component {
  type: 'gatheringTask';
  targetEntity: Entity;
  resourceType: ResourceType;
  progress: number; // 0-1
  totalTime: number;
  isAutoGather: boolean;
}

export interface FloatingText extends Component {
  type: 'floatingText';
  text: string;
  color: string;
  lifetime: number;
  elapsed: number;
}

// ============================================================================
// Inventory & Equipment Types
// ============================================================================

export type ItemType = 'Weapon' | 'Armor' | 'Accessory' | 'Relic' | 'Consumable' | 'Material';
export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface Item extends Component {
  type: 'item';
  name: string;
  itemType: ItemType;
  rarity: ItemRarity;
  durability: number;
  maxDurability: number;
  weight: number;
  effects: ItemEffect[];
  activeAbility?: ActiveAbility;
  setId?: string;
  quality: 'Normal' | 'Refined' | 'Masterwork';
  levelRequirement?: number;
}

export interface ItemEffect {
  stat: string;
  value: number;
  operation: 'add' | 'multiply' | 'flat';
  condition?: string;
}

export interface ActiveAbility {
  name: string;
  cooldown: number;
  currentCooldown: number;
  description: string;
}

export type EquipmentSlot = 'head' | 'chest' | 'hands' | 'feet' | 'mainHand' | 'offHand' | 'accessory1' | 'accessory2';

export interface Equipment extends Component {
  type: 'equipment';
  slots: Partial<Record<EquipmentSlot, Entity | undefined>>;
  setBonusesActive: string[];
}

export interface Inventory extends Component {
  type: 'inventory';
  items: Entity[];
  maxWeight: number;
  currentWeight: number;
}

export interface GroundItem extends Component {
  type: 'groundItem';
  itemEntity: Entity;
  dropTime: number;
  despawnTime: number;
  positionX: number;
  positionY: number;
}

// ============================================================================
// Crafting & Production Types
// ============================================================================

export type CraftingQuality = 'Normal' | 'Refined' | 'Masterwork';

export interface RecipeIngredient {
  resourceType?: ResourceType;
  itemType?: ItemType;
  itemName?: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  craftingTime: number; // seconds
  outputItem: string; // item name or resource type
  outputQuantity: number;
  requiredStructure: string;
  requiredTech?: string;
  skillId?: string;
  baseFailureChance: number; // 0-1
  qualityTiers: boolean;
}

export interface CraftingQueue extends Component {
  type: 'craftingQueue';
  queue: CraftingJob[];
  currentJob: CraftingJob | null;
  structureEntity: Entity;
}

export interface CraftingJob {
  recipeId: string;
  progress: number;
  totalTime: number;
  assignedQuality: CraftingQuality;
  assignedCrafter: Entity | null;
}

// ============================================================================
// Technology Tree Types
// ============================================================================

export interface Technology {
  id: string;
  name: string;
  description: string;
  prerequisites: string[]; // tech IDs
  cost: Partial<Record<ResourceType, number>>;
  researchTime: number;
  unlocks: TechUnlock[];
  category: 'Infrastructure' | 'Military' | 'Faith' | 'Agriculture' | 'Industry' | 'Divine';
  tier: number;
}

export type TechUnlock =
  | { kind: 'structure'; structureType: string }
  | { kind: 'unit'; unitType: string }
  | { kind: 'ability'; abilityId: string }
  | { kind: 'passive'; stat: string; value: number; operation: 'add' | 'multiply' }
  | { kind: 'recipe'; recipeId: string }
  | { kind: 'resource'; resourceType: ResourceType };

export interface TechProgress extends Component {
  type: 'techProgress';
  researchedTechs: string[];
  activeResearch: string | null;
  researchProgress: number;
  researchQueue: string[];
}

// ============================================================================
// Population Dynamics Types
// ============================================================================

export interface PopulationData extends Component {
  type: 'populationData';
  age: number;
  maxAge: number;
  gender: 'M' | 'F' | 'N';
  isPregnant: boolean;
  pregnancyProgress: number;
  pregnancyDuration: number;
  partner: Entity | null;
  happiness: number; // 0-100
  healthStatus: 'Healthy' | 'Sick' | 'Injured' | 'Starving';
  starvationTimer: number;
  diseaseTimer: number;
  childGrowthProgress: number;
  isChild: boolean;
  adulthoodAge: number;
  societyId: Entity;
}

export interface Housing extends Component {
  type: 'housing';
  capacity: number;
  occupants: Entity[];
  comfortLevel: number;
}
// ========================
// Combat System Types
// ========================

export type ElementalType = 'Fire' | 'Frost' | 'Lightning' | 'Earth' | 'Divine';

export type UnitClass = 'Infantry' | 'Ranged' | 'Cavalry' | 'Siege' | 'Support' | 'Stealth';

export type CombatPhase = 'Initiation' | 'Approach' | 'Attack' | 'Resolution' | 'Cooldown';

export interface CombatStats extends Component {
  type: 'combatStats';
  attack: number;
  defense: number;
  speed: number;
  range: number;
  elementalType: ElementalType;
  /** Resistance percentage per element (0-1) */
  resistances: Record<ElementalType, number>;
  unitClass: UnitClass;
  /** Current combat phase if engaged */
  currentPhase?: CombatPhase;
  /** Seconds remaining in current phase */
  phaseTimer?: number;
  /** Entity this unit is currently attacking, if any */
  target?: Entity;
  /** Seconds until next attack is allowed */
  cooldownTimer?: number;
}

export interface CombatEvent {
  id: string;
  attacker: Entity;
  target: Entity;
  damage: number;
  damageType: 'physical' | 'critical' | ElementalType;
  timestamp: number;
  /** Whether the target was killed */
  fatal: boolean;
  /** Original base damage before modifiers */
  baseDamage: number;
  /** Multipliers applied (for log detail) */
  multipliers: {
    attackDefenseRatio: number;
    critMultiplier: number;
    varianceMultiplier: number;
    elementalMultiplier: number;
  };
}

export interface DamageNumber {
  entity: Entity;
  value: number;
  type: 'damage' | 'heal' | 'crit' | 'miss';
  timestamp: number;
  /** Seconds to live for visual rendering */
  ttl: number;
}

export interface HitSpark {
  entity: Entity;
  timestamp: number;
  element: ElementalType | 'physical';
  /** Seconds to live for visual rendering */
  ttl: number;
}

export interface Morale extends Component {
  type: 'morale';
  value: number; // 0-100
  /** Whether the entity is currently fleeing */
  isFleeing: boolean;
  /** Timestamp of last rally received */
  lastRallyTime: number;
}

// ========================
// Status Effect Types
// ========================

export type StatusEffectCategory = 'buff' | 'debuff' | 'cc';

export type StatusEffectType =
  | 'Blessed'
  | 'Inspired'
  | 'Hasted'
  | 'Cursed'
  | 'Diseased'
  | 'Starving'
  | 'Poisoned'
  | 'Stunned'
  | 'Feared'
  | 'Rooted'
  | 'Slowed'
  | 'Blinded';

export interface StatusEffect extends Component {
  type: 'statusEffect';
  effectType: StatusEffectType;
  category: StatusEffectCategory;
  /** Intensity/strength of the effect (e.g., +5 speed) */
  intensity: number;
  /** Duration remaining in seconds */
  duration: number;
  /** Tick interval in seconds (0 for non-ticking) */
  tickInterval: number;
  /** Time until next tick */
  tickTimer: number;
  /** Entity that applied this effect */
  source: Entity;
  /** Max duration for refresh calculations */
  maxDuration: number;
  /** Max intensity for stacking calculations */
  maxIntensity: number;
  /** Whether same-type effects should stack intensity or refresh duration */
  stackMode: 'refresh' | 'stackIntensity' | 'stackDuration';
}

export interface Trait {
  id: string;
  name: string;
  description: string;
  /** Effect on combat stats (additive) */
  statModifiers: Partial<Omit<CombatStats, 'type' | 'resistances' | 'elementalType' | 'unitClass'>> & {
    resistanceModifiers?: Partial<Record<ElementalType, number>>;
  };
  /** Effect on morale (additive) */
  moraleModifier?: number;
  /** Effect on speed (multiplicative) */
  speedMultiplier?: number;
}

export interface TraitComponent extends Component {
  type: 'trait';
  traitIds: string[];
}

// -- Faith & Religion Systems --

/** Piety component tracking an entity's spiritual standing (0-100). */
export interface Piety extends Component {
  type: 'piety';
  score: number;
  lastPrayerTime: number;
  prayerCooldown: number;
}

/** Shrine-specific state attached to ALTAR structures. */
export interface ShrineStatus extends Component {
  type: 'shrineStatus';
  isDesecrated: boolean;
  radius: number;
  strength: number;
  faithSystem: FaithSystemType;
}

/** Dogma component storing a society's active tenets and schism risk. */
export interface Dogma extends Component {
  type: 'dogma';
  tenets: string[];
  schismRisk: number;
}

/** Missionary component for conversion units travelling between tribes. */
export interface Missionary extends Component {
  type: 'missionary';
  targetEntity: Entity | null;
  piety: number;
  conversionProgress: number;
  originFaith: FaithSystemType;
}

/** Definition of a doctrinal tenet. */
export interface TenetDefinition {
  id: string;
  name: string;
  description: string;
  effects: Record<string, number>;
  unlockRequirement: {
    divineLevel?: number;
    tribeSize?: number;
    events?: string[];
  };
  conflictsWith: string[];
  faithSystem: FaithSystemType;
}

/** Per-chunk summary of faith dominance for the fog overlay. */
export interface FaithChunkData {
  chunkX: number;
  chunkY: number;
  dominantSystem: FaithSystemType;
  intensity: number;
  tension: number;
}

/** Snapshot of shrine influence at a world coordinate. */
export interface ShrineInfluenceSnapshot {
  x: number;
  y: number;
  totalStrength: number;
  isSacredGround: boolean;
  isCursedGround: boolean;
  devotionBoost: number;
  healing: number;
  happinessDelta: number;
  enemyDebuff: number;
}

// ============================================================
// VFX & Particle System Types
// ============================================================

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: [number, number, number, number]; // RGBA 0-1
  rotation: number;
  rotationSpeed: number;
  active: boolean;
}

export interface EmitterConfig {
  name: string;
  spawnRate: number; // particles per second
  maxParticles: number;
  burstCount?: number;
  duration?: number; // seconds, undefined = infinite
  shape: 'point' | 'circle' | 'rect' | 'cone';
  spawnRadius: number;
  angle: number; // radians
  angleSpread: number; // radians
  speedMin: number;
  speedMax: number;
  lifeMin: number;
  lifeMax: number;
  sizeMin: number;
  sizeMax: number;
  sizeOverLife?: number; // multiplier at end of life
  colorStart: [number, number, number, number];
  colorEnd: [number, number, number, number];
  gravity: [number, number];
  drag: number;
  blendMode: 'normal' | 'additive';
  textureKey?: string;
  rotationMin?: number;
  rotationMax?: number;
  rotationSpeedMin?: number;
  rotationSpeedMax?: number;
}

// ============================================================
// Animation & Tweening Types
// ============================================================

export type EasingName = 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic' | 'elastic' | 'bounce' | 'back';

export interface TweenConfig {
  target: Record<string, number>;
  to: Record<string, number>;
  duration: number; // ms
  easing?: EasingName;
  delay?: number;
  onUpdate?: (obj: Record<string, number>) => void;
  onComplete?: (obj: Record<string, number>) => void;
}

export interface EntityAnimState {
  entityId: string;
  state: 'idle' | 'walk' | 'attack' | 'death' | 'spawn';
  frameIndex: number;
  frameTimer: number;
  direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  transitionProgress: number; // 0-1 between states
}

// ============================================================
// Notification System Types
// ============================================================

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'critical';
export type ToastCategory = 'Economy' | 'Combat' | 'Diplomacy' | 'Divine' | 'Ecology' | 'System';

export interface ToastNotification {
  id: string;
  type: ToastType;
  category: ToastCategory;
  title: string;
  message: string;
  timestamp: number;
  duration?: number; // ms, undefined = persistent until dismissed
  pauseGame?: boolean;
  actions?: { label: string; callback: () => void }[];
}

// ============================================================
// Input System Types
// ============================================================

export interface KeyBinding {
  key: string;
  action: string;
  modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean };
}

export interface InputAction {
  id: string;
  label: string;
  defaultBinding: KeyBinding;
  category: 'Camera' | 'Gameplay' | 'UI' | 'Spell';
  repeatable?: boolean;
}

// ============================================================
// Quest & Narrative Types
// ============================================================

export type QuestType = 'population' | 'build' | 'survive' | 'defeat' | 'faith' | 'explore' | 'harvest' | 'diplomacy';

export interface QuestReward {
  devotion?: number;
  divineXP?: number;
  spellUnlock?: string;
  illuminationPoints?: number;
}

export interface QuestObjective {
  description: string;
  targetType: string;
  targetValue: number;
  currentValue: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  chainId?: string;
  chainIndex?: number;
  chainLength?: number;
  objectives: QuestObjective[];
  rewards: QuestReward;
  isActive: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  timeLimit?: number; // seconds, undefined = no limit
  timeRemaining?: number;
  onFailConsequence?: string;
}

export type EventCategory = 'Natural' | 'Political' | 'Religious' | 'Ecological' | 'Cosmic';

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  outcomeText: string;
  weight: number; // probability weight when selected
  effects: {
    devotionDelta?: number;
    populationDelta?: number;
    resourceDelta?: number;
    happinessDelta?: number;
    divineXP?: number;
    weatherChange?: string;
    questTrigger?: string;
    achievementUnlock?: string;
  };
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  probabilityBase: number; // 0-1
  probabilityConditions?: (world: WorldStateSnapshot) => number; // returns modified probability
  choices: EventChoice[];
  isOneShot?: boolean; // true = can only happen once per game
}

export interface WorldStateSnapshot {
  population: number;
  tribeCount: number;
  averageHappiness: number;
  averageTech: number;
  weather: string;
  devotion: number;
  totalStructures: number;
  totalFlora: number;
  totalFauna: number;
  conflictsActive: number;
  timePlayed: number;
}

// ============================================================
// Achievement System Types
// ============================================================

export type AchievementCategory = 'Progression' | 'Combat' | 'Divine' | 'Economy' | 'Ecology' | 'Social' | 'Secret';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  requirement: {
    type: 'stat_threshold' | 'event_trigger' | 'compound' | 'unique_action';
    statKey?: string;
    threshold?: number;
    eventId?: string;
    subAchievements?: string[];
  };
  isHidden?: boolean;
  tier?: number; // 1 = common, 2 = rare, 3 = epic, 4 = legendary
}

export interface PlayerTitle {
  id: string;
  name: string;
  description: string;
  unlockCondition: string;
  styleClass: string;
}

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  unlockedAt?: number; // timestamp
}

// ---------------------------------------------------------------------------
// World Simulation Types
// ---------------------------------------------------------------------------

export type WeatherType = 'CLEAR' | 'RAINY' | 'DROUGHT' | 'TEMPEST' | 'AURORA';

export type Season = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';

export type MoonPhase = 'NEW' | 'WAXING_CRESCENT' | 'FIRST_QUARTER' | 'WAXING_GIBBOUS' | 'FULL' | 'WANING_GIBBOUS' | 'LAST_QUARTER' | 'WANING_CRESCENT';

export type DiseaseType = 'BLIGHT' | 'PLAGUE' | 'PEST';

export type FloraLifecycleStage = 'SEED' | 'SPROUT' | 'MATURE' | 'DECAYING' | 'DEAD';

export type FaunaLifecycleStage = 'BIRTH' | 'GROWTH' | 'REPRODUCTION' | 'AGING' | 'DEATH';

export type TransmissionModel = 'CONTACT' | 'AIRBORNE' | 'VECTOR';

/** State snapshot of the day/night cycle for rendering and gameplay queries. */
export interface DayNightState {
  totalGameMinutes: number;
  gameDay: number;
  timeOfDayMinutes: number; // 0-1439
  sunPosition: { x: number; y: number; z: number };
  moonPosition: { x: number; y: number; z: number };
  ambientIntensity: number;
  skyColorTop: [number, number, number];
  skyColorBottom: [number, number, number];
  sunColor: [number, number, number];
  moonPhase: MoonPhase;
  isNight: boolean;
  isTwilight: boolean;
}

/** Shader-compatible lighting uniform data produced by the day/night system. */
export interface LightingUniforms {
  uTimeOfDay: number; // 0-1 normalized
  uSunPosition: [number, number, number];
  uAmbientIntensity: number;
}

/** Seasonal state snapshot for rendering and gameplay queries. */
export interface SeasonState {
  currentSeason: Season;
  seasonProgress: number; // 0-1 within current season
  daysIntoSeason: number;
  foliageColor: [number, number, number];
  snowCoverProbability: number;
  dryGrassProbability: number;
  cropGrowthMultiplier: number;
  foodScarcityMultiplier: number;
  animalMigrationProbability: number;
}

/** Weather prediction data for structures like the Observatory. */
export interface WeatherPrediction {
  predictedWeather: WeatherType;
  confidence: number; // 0-1
  timeUntil: number; // game minutes until predicted weather
}

/** Active gameplay modifiers from the current weather. */
export interface WeatherEffects {
  cropGrowthModifier: number;
  humidityModifier: number;
  movementSpeedModifier: number;
  fireRiskModifier: number;
  devotionGenerationModifier: number;
  entityDamageChance: number; // 0-1 per tick
}

/** Active disease instance attached to an entity. */
export interface Disease extends Component {
  type: 'disease';
  diseaseType: DiseaseType;
  carrierId: string;
  transmissionModel: TransmissionModel;
  infectiousness: number; // 0-1
  mortalityRate: number; // 0-1
  recoveryRate: number; // 0-1
  durationRemaining: number; // game minutes
  spreadRadius: number;
  isQuarantined: boolean;
}

/** Tracks ecological lifecycle metadata for flora entities. */
export interface FloraLifecycle extends Component {
  type: 'floraLifecycle';
  stage: FloraLifecycleStage;
  ageMinutes: number;
  seedDropTimer: number; // minutes until seeds are released after death
  decayProgress: number; // 0-1
}

/** Tracks ecological lifecycle metadata for fauna entities. */
export interface FaunaLifecycle extends Component {
  type: 'faunaLifecycle';
  stage: FaunaLifecycleStage;
  ageMinutes: number;
  reproductionCooldown: number; // minutes until can reproduce again
  lastOffspringId: string | null;
}

/** Soil cell state for ecological simulation. */
export interface SoilCell {
  x: number;
  y: number;
  moisture: number; // 0-100
  nutrients: number; // 0-100
  ashFertility: number; // 0-1 temporary boost after fire
  fireIntensity: number; // 0-1 active fire
}

/** Represents an active fire in the world. */
export interface FireState {
  x: number;
  y: number;
  intensity: number; // 0-1
  spreadRadius: number;
  durationLeft: number; // minutes
}

// ============================================================================
// AI & Navigation Types
// ============================================================================

export interface PathNode {
  x: number;
  y: number;
}

export interface PathResult {
  nodes: PathNode[];
  cost: number;
  success: boolean;
}

export type BTNodeStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING';

export interface GOAPWorldState {
  [key: string]: any;
}

export interface GOAPActionDef {
  name: string;
  cost: number;
  preconditions: GOAPWorldState;
  effects: GOAPWorldState;
}

export interface ScentMarker {
  x: number;
  y: number;
  intensity: number;
  type: 'PREDATOR' | 'PREY' | 'FOOD' | 'DANGER' | 'NEUTRAL';
  ownerId?: string;
}

export interface SensationEvent {
  type: 'SIGHT' | 'HEARING' | 'SMELL';
  sourceId: Entity;
  sourceX: number;
  sourceY: number;
  threatLevel: number;
  timestamp: number;
  data?: Record<string, any>;
}

export interface AgentMemoryEntry {
  event: SensationEvent;
  confidence: number;
  lastUpdated: number;
}

// ============================================================================
// Physics & Collision Types
// ============================================================================

export type CollisionLayer = 'terrain' | 'structure' | 'entity' | 'projectile';

export interface AABB extends Component {
  type: 'aabb';
  x: number;
  y: number;
  width: number;
  height: number;
  layer: CollisionLayer;
}

export interface CircleCollider extends Component {
  type: 'circleCollider';
  x: number;
  y: number;
  radius: number;
  layer: CollisionLayer;
}

export interface RigidBody extends Component {
  type: 'rigidBody';
  vx: number;
  vy: number;
  mass: number;
  friction: number;
  restitution: number;
  isStatic: boolean;
}

export interface Projectile extends Component {
  type: 'projectile';
  ownerId: Entity;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  gravity: number;
  damage: number;
  elapsed: number;
  lifetime: number;
}

// ============================================================================
// Squad & Combat AI Types
// ============================================================================

export type FormationType = 'Line' | 'Wedge' | 'Circle' | 'Column' | 'Scatter';

export interface Squad extends Component {
  type: 'squad';
  squadId: string;
  leaderId: Entity;
  members: Entity[];
  formation: FormationType;
  spacing: number;
}

export interface CombatAIState extends Component {
  type: 'combatAIState';
  currentTarget: Entity | null;
  threatLevel: number;
  lastAbilityUsed: string;
  abilityCooldowns: Record<string, number>;
  isRetreating: boolean;
  calledForHelp: boolean;
}

export interface BehaviorType extends Component {
  type: 'behaviorType';
  behaviorType: 'wolf' | 'stag' | 'villager';
}

export interface TargetPosition extends Component {
  type: 'targetPosition';
  x: number;
  y: number;
}

export interface PathComponent extends Component {
  type: 'path';
  nodes: PathNode[];
  cost: number;
  success: boolean;
}

export interface GOAPGoal extends Component {
  type: 'goapGoal';
  goalState: GOAPWorldState;
  actionNames: string[];
  currentPlan?: { actions: string[]; cost: number; success: boolean };
  actionIndex: number;
}

export interface Sensation extends Component {
  type: 'sensation';
  sightRange?: number;
  hearingRange?: number;
  smellRange?: number;
}

// ============================================================================
// Trade & Macro Types
// ============================================================================

export type ResourceValue = 'Wood' | 'Stone' | 'Food' | 'Metal' | 'Crystal' | 'DivineEssence';

export interface Market extends Component {
  type: 'market';
  prices: Record<ResourceValue, number>;
  supply: Record<ResourceValue, number>;
  demand: Record<ResourceValue, number>;
}

export interface Caravan extends Component {
  type: 'caravan';
  originSociety: Entity;
  targetSociety: Entity;
  cargo: Partial<Record<ResourceValue, number>>;
  progress: number; // 0-1
  riskLevel: number;
}

export interface TradeRoute extends Component {
  type: 'tradeRoute';
  societyA: Entity;
  societyB: Entity;
  distance: number;
  ambushRisk: number;
  active: boolean;
}

export interface Settlement extends Component {
  type: 'settlement';
  level: 'Hamlet' | 'Village' | 'Town' | 'City';
  name: string;
  structureIds: Entity[];
  connectedSettlements: Entity[];
  reputation: number;
}

export interface Border extends Component {
  type: 'border';
  societyId: Entity;
  territoryTiles: Array<{ x: number; y: number }>;
  tension: number;
}

export interface Allegiance extends Component {
  type: 'allegiance';
  overlordId: Entity | null;
  vassals: Entity[];
  allies: Entity[];
  enemies: Entity[];
}

// ============================================================================
// Story & Progression Types
// ============================================================================

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  conditions?: Array<{ stat: string; value: number; operator: 'eq' | 'gt' | 'lt' }>;
  choices: Array<{
    id: string;
    label: string;
    nextNodeId: string | null;
    effects?: Record<string, number>;
  }>;
}

export interface LoreEntry {
  id: string;
  category: 'History' | 'Religion' | 'Nature' | 'Technology' | 'Mystery';
  title: string;
  content: string;
  unlockCondition: string;
  isUnlocked: boolean;
}

export interface BestiaryEntry {
  id: string;
  creatureType: string;
  name: string;
  description: string;
  discovered: boolean;
  killCount: number;
}

export interface HerbariumEntry {
  id: string;
  floraType: string;
  name: string;
  description: string;
  discovered: boolean;
  harvestCount: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  category: 'Political' | 'Religious' | 'Military' | 'Economic' | 'Natural';
}

export interface Waypoint {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  hotkey?: number;
}

export interface RankTitle {
  id: string;
  name: string;
  description: string;
  rank: 'Novice' | 'Adept' | 'Master' | 'Legend';
  unlockRequirements: Array<{ stat: string; target: number }>;
  isUnlocked: boolean;
}

// ============================================================================
// Persistence Types
// ============================================================================

export interface SaveMetadata {
  version: string;        // schema version e.g. "1.0.0"
  timestamp: number;      // epoch ms
  playtime: number;       // seconds
  worldName: string;
  thumbnail?: string;     // base64 placeholder or data URL
}

export interface SaveSlot {
  id: string;             // slot key, e.g. "slot-1"
  name: string;           // user-facing name
  metadata: SaveMetadata;
  data: string;           // compressed save payload
}

export interface Snapshot {
  timestamp: number;
  ecsState: { entities: string[]; components: { type: string; entity: string; data: any }[] };
  rngSeed: number;
  simulationState?: Record<string, any>;
}

export interface PlayerInput {
  timestamp: number;
  type: string;
  payload: Record<string, any>;
}

export interface ReplayData {
  version: string;
  startSeed: number;
  worldName: string;
  snapshots: Snapshot[];
  inputs: PlayerInput[];
  startTime: number;
  endTime?: number;
}

export interface ThreatAssessment {
  entity: Entity;
  dangerScore: number;
  proximityScore: number;
  healthRatio: number;
  threatLevel: number;
}

// ============================================================================
// Object Pooling Types
// ============================================================================

export interface PoolStats {
  active: number;
  pooled: number;
  totalCreated: number;
}

export interface PoolConfig {
  maxSize: number;
  prewarm?: number;
}

// ============================================================================
// Structure Animation Types
// ============================================================================

export interface StructureAnimation {
  type: 'smoke' | 'spin' | 'glow_pulse' | 'none';
  intensity: number; // 0-1
  speed: number;
}

export interface StructureState {
  entityId: string;
  category: string;
  state: 'idle' | 'working' | 'complete' | 'damaged' | 'destroyed';
  workProgress: number; // 0-1 production progress
  animation: StructureAnimation;
  glowIntensity: number; // 0-1
  nightGlowIntensity: number; // 0-1
  flickerTimer: number;
  isCollapsed: boolean;
  efficiencyModifier: number;
}

export interface WorkAnimationConfig {
  category: string;
  subType?: string;
  idle: StructureAnimation;
  working: StructureAnimation;
  complete: StructureAnimation;
  baseGlowIntensity: number;
  nightGlowMultiplier: number;
}

// ============================================================================
// GPU Compute Types
// ============================================================================

export interface GPUComputeConfig {
  workgroupSize: number
  maxEntities: number
  maxParticles: number
  gridSize: number
  useGPU: boolean
  timingEnabled: boolean
}

export interface ComputePipeline {
  label: string
  shader: string
  workgroupSize: number
  dispatchX: number
  dispatchY: number
  dispatchZ: number
}

export interface ComputeBuffer {
  label: string
  size: number
  usage: number
  data?: ArrayBuffer | ArrayBufferView
}

// ============================================================================
// Wind & Vegetation Sway Types
// ============================================================================

export interface WindState {
  direction: number; // radians, 0 = blowing right/east
  strength: number;  // 0-1
}

export interface VegetationSway {
  swayX: number;
  swayY: number;
  swayRot: number;
}

// ============================================================================
// Planetary View Types
// ============================================================================

export interface CityLight {
  x: number;
  y: number;
  intensity: number;
  population: number;
}

export interface TemperatureBand {
  minTemp: number;
  maxTemp: number;
  classification: 'frozen' | 'cold' | 'temperate' | 'hot' | 'scorched';
  color: [number, number, number];
}

export interface PlanetaryViewState {
  zoom: number; // 1.0 = planetary, 0.0 = isometric
  lastClickedRegion: { x: number; y: number } | null;
  gridSize: number;
}


// ============================================================================
// Asset Streaming & LOD Types
// ============================================================================

export type LODLevel = 'near' | 'mid' | 'far';

export interface AssetLoadRequest {
  url: string;
  priority?: number;
  retries?: number;
}

export interface PrefetchZone {
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number;
  assets: string[];
}

// ============================================================================
// Chunk System Types
// ============================================================================

export interface ChunkCoord {
  cx: number;
  cy: number;
}

export interface ChunkLoadRequest {
  cx: number;
  cy: number;
  priority: number;
}

export interface Chunk {
  coord: ChunkCoord;
  terrain: number[][];
  entities: Entity[];
  lodLevel: number;
  isLoaded: boolean;
  lastAccessed: number;
}

// ============================================================================
// Terraforming Types
// ============================================================================

export interface TerrainBrush {
  radius: number;
  strength: number;
}

export type TerraformOperation =
  | { type: 'raise'; x: number; y: number; amount: number; brush: TerrainBrush }
  | { type: 'lower'; x: number; y: number; amount: number; brush: TerrainBrush }
  | { type: 'channel'; x1: number; y1: number; x2: number; y2: number; width: number }
  | { type: 'flatten'; centerX: number; centerY: number; radius: number; targetHeight: number }
  | { type: 'lake'; centerX: number; centerY: number; radius: number }
  | { type: 'erosion'; dt: number };

export interface WaterChannel {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  waterLevel?: number;
  blockedBy?: string;
}

// ============================================================================
// Shadow System Types
// ============================================================================

export interface ShadowCaster extends Component {
  type: 'shadowCaster';
  width: number;
  height: number;
  castHeight?: number;
  isStatic: boolean;
  category: 'Tribe' | 'Flora' | 'Fauna' | 'Structure';
}

export interface ShadowMap {
  entityId: Entity;
  graphics: any; // PIXI.Graphics
  cached: boolean;
  lastSunAngle: number;
  lastIntensity: number;
}

export interface ShadowSettings {
  maxShadowDistance: number;
  pcfKernelSize: number;
  contactHardeningFactor: number;
  baseIntensity: number;
  staticCacheEnabled: boolean;
  shadowLengthMultiplier: number;
}

// ============================================================================
// Water Rendering Types
// ============================================================================

export interface WaterTile {
  x: number;
  y: number;
  depth: number; // 0-1
  type: 'shallow' | 'deep' | 'murky';
}

export interface WaterSettings {
  waveAmplitude: number;
  waveFrequency: number;
  shallowColor: [number, number, number];
  deepColor: [number, number, number];
  murkyColor: [number, number, number];
  skyColor: [number, number, number];
  reflectionStrength: number;
  foamAmount: number;
  rippleDecayRate: number;
  tileSize: number;
  isoWidth: number;
  isoHeight: number;
}

export interface Ripple {
  x: number;
  y: number;
  time: number;
  strength: number;
}

// ============================================================================
// Post-Processing Types
// ============================================================================

export interface BloomSettings {
  threshold: number;
  intensity: number;
  radius: number;
}

export interface SSAOSettings {
  radius: number;
  intensity: number;
  bias: number;
}

export interface ColorGradeSettings {
  contrast: number;
  saturation: number;
  brightness: number;
  tint: [number, number, number];
}

export interface PostProcessConfig {
  bloom: BloomSettings;
  ssao: SSAOSettings;
  colorGrading: ColorGradeSettings;
  chromaticAberration: boolean;
  filmGrain: boolean;
  vignette: boolean;
  motionBlur: boolean;
  volumetricLight: boolean;
}