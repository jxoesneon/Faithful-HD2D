# Faithful: Full AAA Gap Analysis

**Document Version:** 1.0  
**Last Updated:** 2026-06-03  
**Status:** Living document - updated as systems are implemented  
**Scope:** Complete inventory of missing systems between current state and AAA production readiness  

---

## Legend

- **Status:** `MISSING` | `PARTIAL` | `STUB` | `COMPLETE`
- **Priority:** `P0` (Critical) | `P1` (High) | `P2` (Medium) | `P3` (Low)
- **Effort:** `S` (Small) | `M` (Medium) | `L` (Large) | `XL` (Massive)
- **Impact:** `Critical` | `High` | `Medium` | `Low`

---

## 1. ARTIFICIAL INTELLIGENCE SYSTEMS

### 1.1 Pathfinding & Navigation
**Status:** MISSING | **Priority:** P0 | **Effort:** M | **Impact:** Critical

**Current State:**
- Entities have `Position` components with `x`, `y`, `z` coordinates
- `Movement` component defines `targetX`, `targetY`, `speed`, `vx`, `vy`
- No actual path computation between points
- `findLandTile()` in world gen does brute-force random sampling
- No avoidance of obstacles, water, or other entities

**Required:**
- [ ] Navigation Mesh (NavMesh) generation from terrain heightmap
- [ ] A* Pathfinding Algorithm with diagonal movement and terrain weights
- [ ] Path smoothing via string pulling or funnel algorithm
- [ ] Path invalidation on terrain change
- [ ] Multi-threaded pathfinding via Web Worker
- [ ] Dynamic obstacle avoidance (other entities, structures)

**Files:** `src/engine/pathfinding.ts` (new), `src/engine/navmesh.ts` (new)

---

### 1.2 Behavior Trees / GOAP
**Status:** MISSING | **Priority:** P0 | **Effort:** L | **Impact:** Critical

**Current State:**
- `Fauna.actionState`: `'WANDERING' | 'HUNTING' | 'FLEEING' | 'GRAZING'`
- No actual behavior logic - state changes are random or external
- `Society` has role ratios but no AI logic

**Required:**
- [ ] Behavior Tree framework (Sequence, Selector, Parallel, Decorator nodes)
- [ ] Blackboard system for shared agent memory
- [ ] GOAP (Goal-Oriented Action Planning) with preconditions/effects
- [ ] Per-entity presets: Wolf (hunt→eat→sleep), Stag (graze→flee→herd), Villager (work→eat→sleep→pray)
- [ ] Sensation system: sight cone, hearing radius, smell trails, memory decay

**Files:** `src/engine/behavior/` directory (new)

---

### 1.3 Squad & Formation AI
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Required:**
- [ ] Group membership system (squad IDs, leader designation)
- [ ] Formation templates: Line, Wedge, Circle, Column, Scatter
- [ ] Coordinated movement (follow leader with offset)
- [ ] Shared target acquisition and retreat coordination

---

### 1.4 Combat AI
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Required:**
- [ ] Threat assessment and target prioritization
- [ ] Tactical positioning (flanking, high ground, cover)
- [ ] Spell/ability selection based on cooldowns and effectiveness
- [ ] Retreat and call-for-help logic

---

## 2. ECONOMY & PROGRESSION SYSTEMS

### 2.1 Resource Gathering & Harvesting
**Status:** MISSING | **Priority:** P0 | **Effort:** M | **Impact:** Critical

**Current State:**
- `Flora.resourcesYield` exists but never used
- `Society.resources` exists but only incremented by tithe mode
- No harvest animation, no resource depletion

**Required:**
- [ ] Harvest interaction system (click → walk → animate → collect)
- [ ] Resource types: Wood, Stone, Food, Metal, Crystal, Divine Essence
- [ ] Resource storage limits per structure
- [ ] Resource decay/spoilage for food
- [ ] Auto-gather mode for villagers
- [ ] Visual feedback: floating numbers, progress bars, particles

---

### 2.2 Crafting & Production
**Status:** MISSING | **Priority:** P1 | **Effort:** L | **Impact:** High

**Required:**
- [ ] Recipe system with ingredients, time, and output
- [ ] Crafting queue with progress tracking
- [ ] Structure-specific recipes (Farm→Food, Forge→Metal)
- [ ] Quality tiers (Normal, Refined, Masterwork)
- [ ] Crafting UI panel with recipe discovery

---

### 2.3 Technology Tree (Research)
**Status:** STUB | **Priority:** P1 | **Effort:** L | **Impact:** High

**Current State:**
- `Society.technologyLevel` exists (numeric 0-10)
- No actual tree structure, no unlockable technologies

**Required:**
- [ ] Tech tree DAG structure with prerequisites
- [ ] Research buildings and research queue
- [ ] Tech unlocks: new structures, units, abilities, passive bonuses
- [ ] Interactive tech tree UI (circular/grid layout)
- [ ] Mod support: JSON export/import of tech trees

---

### 2.4 Trade & Commerce
**Status:** MISSING | **Priority:** P2 | **Effort:** L | **Impact:** Medium

**Required:**
- [ ] Market structure with supply/demand pricing
- [ ] Caravan system for inter-tribe trade
- [ ] Trade routes with ambush risk
- [ ] Currency system beyond barter

---

### 2.5 Population Dynamics
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Required:**
- [ ] Birth system: coupling, pregnancy, child growth
- [ ] Death system: age mortality, combat, starvation, disease
- [ ] Migration based on happiness and tribe reputation
- [ ] Population cap based on housing + food production

---

## 3. COMBAT & CONFLICT SYSTEMS

### 3.1 Combat Resolution Engine
**Status:** MISSING | **Priority:** P0 | **Effort:** L | **Impact:** Critical

**Current State:**
- No combat system at all
- No health modification beyond `Biology.health`

**Required:**
- [ ] Stat system: Attack, Defense, Speed, Range, Elemental types
- [ ] Damage formula with critical hits, variance, resistances
- [ ] Combat phases: Initiation → Approach → Attack → Resolution → Loot
- [ ] Visual: health bars, damage numbers, hit sparks, blood particles
- [ ] Combat log for player review

---

### 3.2 Unit Types & Specializations
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Required:**
- [ ] Infantry, Ranged, Cavalry, Siege, Support, Stealth types
- [ ] Unit stats and role definitions
- [ ] Counter relationships (spear beats cavalry, etc.)

---

### 3.3 Morale & Psychology
**Status:** MISSING | **Priority:** P2 | **Effort:** M | **Impact:** Medium

**Required:**
- [ ] Morale meter per unit (0-100)
- [ ] Morale modifiers: outnumbered, commander presence, casualties
- [ ] Break threshold (flee at <25% morale)
- [ ] Rally abilities and rout chain reactions

---

## 4. WORLD SIMULATION SYSTEMS

### 4.1 Day/Night Cycle
**Status:** MISSING | **Priority:** P0 | **Effort:** M | **Impact:** Critical

**Current State:**
- No time tracking beyond ECS `time` counter
- `globalTemperature` exists but static
- Lighting shader uses static values

**Required:**
- [ ] 24-hour accelerated cycle with sun/moon position
- [ ] Dynamic lighting: bright day → twilight → dark night
- [ ] Entity behavior changes: sleep at night, nocturnal predators
- [ ] Shader uniforms: `uTimeOfDay`, `uSunPosition`, `uAmbientIntensity`
- [ ] Visual: sky gradient, stars, moon phases

---

### 4.2 Seasonal Cycle
**Status:** MISSING | **Priority:** P1 | **Effort:** L | **Impact:** High

**Required:**
- [ ] 4-season cycle: Spring → Summer → Fall → Winter
- [ ] Visual changes: foliage colors, snow cover, dry grass
- [ ] Gameplay effects: crop growth rates, food scarcity, animal migration
- [ ] Season prediction UI

---

### 4.3 Weather System (Visual + Mechanical)
**Status:** PARTIAL | **Priority:** P0 | **Effort:** M | **Impact:** Critical

**Current State:**
- `weather` enum exists (`CLEAR`, `RAINY`, `DROUGHT`, `TEMPEST`, `AURORA`)
- No visual representation of weather
- No gameplay effects from weather

**Required:**
- [ ] Particle systems for rain, snow, dust, embers
- [ ] Lightning flashes with delayed thunder
- [ ] Weather effects: +crop growth (rain), -movement (storm), +fire risk (drought)
- [ ] Weather prediction via Observatory structure
- [ ] Player weather manipulation spells

---

### 4.4 Ecological Simulation
**Status:** PARTIAL | **Priority:** P1 | **Effort:** XL | **Impact:** High

**Current State:**
- Biome-aware spawning exists
- Flora has growth fields but no actual growth over time
- No species interaction

**Required:**
- [ ] Flora lifecycle: Seed → Sprout → Mature → Decaying → Dead
- [ ] Fauna lifecycle: Birth → Growth → Reproduction → Aging → Death
- [ ] Predator-prey dynamics (Lotka-Volterra)
- [ ] Food chain: wolves eat stags, stags eat crops
- [ ] Soil system: nutrients, depletion, fertilization, erosion
- [ ] Fire ecology: lightning fires, spread, regrowth

---

### 4.5 Disease & Epidemics
**Status:** STUB | **Priority:** P1 | **Effort:** M | **Impact:** High

**Current State:**
- `Flora.diseaseActive` boolean exists
- No actual disease mechanics

**Required:**
- [ ] Disease types: Blight (flora), Plague (entities), Pest swarms
- [ ] Transmission: contact, airborne, vector-based
- [ ] Immunity system: recovery, herd immunity, vaccination
- [ ] Player intervention: Purify spell, quarantine, burn infected crops

---

### 4.6 Terraforming
**Status:** MISSING | **Priority:** P2 | **Effort:** L | **Impact:** Medium

**Required:**
- [ ] Player spells: raise/lower land, create water channels
- [ ] Natural terraforming: river meandering, erosion
- [ ] Structure impact: dams (flood/dry), walls (wind blocks)

---

## 5. RENDERING & VISUAL SYSTEMS

### 5.1 Particle Effects Engine
**Status:** MISSING | **Priority:** P0 | **Effort:** L | **Impact:** Critical

**Current State:**
- No particle system
- `vfx-miracles-4k-sheet` and `vfx-disasters-4k-sheet` exist but unused

**Required:**
- [ ] GPU particle system (10,000+ particles)
- [ ] Spell effects: Meteor trail, Heal sparkles, Lightning arcs, Shield bubble
- [ ] Weather particles: Rain, snow, dust, embers
- [ ] Ambient particles: Fireflies, pollen, magic dust
- [ ] Combat particles: Blood spray, block sparks, death dissolve
- [ ] In-game particle designer tool

---

### 5.2 Post-Processing Pipeline
**Status:** STUB | **Priority:** P0 | **Effort:** M | **Impact:** Critical

**Current State:**
- Deferred rendering exists (G-buffers, lighting)
- No post-processing after lighting pass

**Required:**
- [ ] Bloom (HDR glow with multi-pass Gaussian blur)
- [ ] SSAO (Screen-Space Ambient Occlusion)
- [ ] SSR (Screen-Space Reflections on water)
- [ ] Volumetric lighting / God Rays
- [ ] Chromatic aberration (toggleable)
- [ ] Film grain, vignette, motion blur
- [ ] Color grading with LUT support per biome/time

---

### 5.3 Dynamic Shadows
**Status:** MISSING | **Priority:** P1 | **Effort:** L | **Impact:** High

**Current State:**
- No shadow system
- `shadow` Graphics object exists in entity container but unused

**Required:**
- [ ] Directional light shadow maps (sun/moon)
- [ ] Cascade shadow maps for large distances
- [ ] PCF soft shadows with contact hardening
- [ ] Self-shadowing on entities and structures
- [ ] Performance: culling, LOD, static object caching

---

### 5.4 Water Rendering
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Current State:**
- Water tiles rendered as flat blue color
- No animation, reflections, or transparency

**Required:**
- [ ] Animated waves with vertex displacement
- [ ] Water types: shallow (transparent), deep (dark), murky
- [ ] Reflections: sky, entities, structures
- [ ] Interaction: ripples, splashes, wake trails
- [ ] Shoreline foam and wet sand effects

---

### 5.5 Animation & Tweening
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Current State:**
- `animFrame` counter used for simple sprite frame selection
- No smooth transitions between positions
- Entities teleport when position updates

**Required:**
- [ ] Tweening library with easing functions (Linear, EaseInOut, Elastic, Bounce)
- [ ] Entity animations: walk (smooth interpolation + bobbing), attack (lunge + swing), death (fall + fade)
- [ ] UI animations: panel slide, number counting, toast notifications
- [ ] Camera animations: smooth pan, shake on impact, zoom transitions

---

### 5.6 Vegetation Wind Response
**Status:** MISSING | **Priority:** P2 | **Effort:** S | **Impact:** Medium

**Required:**
- [ ] Per-plant vertex shader wind sway
- [ ] Amplitude variation by plant height
- [ ] Gust response system

---

## 6. AUDIO SYSTEMS

### 6.1 Sound Effects (Foley)
**Status:** MISSING | **Priority:** P0 | **Effort:** M | **Impact:** Critical

**Current State:**
- Only procedural synth sounds (hover, click, alert, miracles)
- No recorded Foley, no spatial audio
- No audio assets in `/public/assets/audio/`

**Required:**
- [ ] Entity sounds: footsteps (per terrain), combat (swing/hit/block), vocalizations (idle/work/battle/pain)
- [ ] Structure sounds: construction, active operations, destruction
- [ ] Ambient biome sounds: forest birds, plains wind, coastal waves, highland eagles
- [ ] Weather sounds: rain intensity levels, thunder with distance delay, snow silence
- [ ] UI sounds: menu whoosh, selection click, error buzz, level-up fanfare
- [ ] Spatial audio: 3D positioning, occlusion, reverb zones

---

### 6.2 Music System
**Status:** STUB | **Priority:** P1 | **Effort:** L | **Impact:** High

**Current State:**
- Procedural pentatonic OST (simple interval-based)
- No composed tracks, no mood transitions

**Required:**
- [ ] Layered music: ambient drone, percussion, melody, intensity
- [ ] Dynamic mixing: crossfade calm↔intense based on combat
- [ ] Theme triggers: dawn, battle, victory, defeat, discovery, menu
- [ ] Seamless looping and stinger support

---

### 6.3 Adaptive Audio
**Status:** MISSING | **Priority:** P2 | **Effort:** M | **Impact:** Medium

**Required:**
- [ ] Stinger system: one-shot musical cues for events
- [ ] Vertical remixing: add/remove layers based on tension
- [ ] Horizontal sequencing: chain musical phrases procedurally
- [ ] Audio ducking: lower music when dialogue/voiceover plays

---

## 7. ENGINEERING & PERFORMANCE

### 7.1 Object Pooling
**Status:** MISSING | **Priority:** P0 | **Effort:** S | **Impact:** Critical

**Current State:**
- Sprites created/destroyed per entity per frame
- `entitySprites` Map grows unbounded
- Memory leaks from abandoned PIXI objects

**Required:**
- [ ] Sprite pool for each entity type (Tribe, Flora, Fauna, Structure)
- [ ] Particle pool system
- [ ] Audio source pool
- [ ] Maximum pool sizes with LRU eviction

---

### 7.2 Asset Streaming
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Current State:**
- All sprites loaded upfront in `loadAssets()`
- No LOD for distant objects

**Required:**
- [ ] Distance-based sprite LOD (full → half → quarter resolution)
- [ ] Async sprite sheet loading on biome discovery
- [ ] Texture compression (Basis Universal or WebP)
- [ ] Asset prefetching for predicted camera movement

---

### 7.3 Chunked World Streaming
**Status:** MISSING | **Priority:** P1 | **Effort:** L | **Impact:** High

**Current State:**
- Entire 64x64 map in memory
- No streaming for larger worlds

**Required:**
- [ ] World divided into chunks (e.g., 16x16 tiles)
- [ ] Chunk loading/unloading based on camera position
- [ ] Chunk LOD: full detail near camera, simplified distant
- [ ] Seamless chunk transitions (no pop-in)

---

### 7.4 GPU Compute (WebGPU)
**Status:** MISSING | **Priority:** P2 | **Effort:** XL | **Impact:** Medium

**Required:**
- [ ] WebGPU compute shaders for simulation offload
- [ ] Parallel entity updates (movement, growth, decay)
- [ ] GPU-based pathfinding (Jump Point Search)
- [ ] Particle physics on GPU

---

### 7.5 Testing Infrastructure
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Current State:**
- 1 e2e Playwright test (sprite loading)
- No unit tests for ECS, simulation, or combat
- No performance benchmarks

**Required:**
- [ ] Unit test suite: ECS, pathfinding, combat resolution, economy
- [ ] Visual regression tests (screenshot comparison)
- [ ] Performance benchmarks: FPS profiling, memory usage, load times
- [ ] Stress tests: 1000+ entities, large world, concurrent actions

---

### 7.6 CI/CD Pipeline
**Status:** MISSING | **Priority:** P2 | **Effort:** S | **Impact:** Medium

**Required:**
- [ ] GitHub Actions: build, test, lint on every PR
- [ ] Automated deployment to staging environment
- [ ] Bundle size monitoring
- [ ] Lighthouse CI for web performance

---

## 8. UX & ACCESSIBILITY

### 8.1 Accessibility
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Required:**
- [ ] Colorblind modes: Deuteranopia, Protanopia, Tritanopia filters
- [ ] Screen reader support: ARIA labels for all interactive elements
- [ ] Motor impairment: adjustable click timing, sticky keys, reduced motion
- [ ] Dyslexia: dyslexia-friendly font option
- [ ] Subtitles/CC: captioning system for all audio
- [ ] UI scaling: 75% to 200% interface size

---

### 8.2 Input Systems
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Current State:**
- Mouse only (drag to pan, wheel to zoom, click to select)
- Touch support for mobile (basic)
- No gamepad support

**Required:**
- [ ] Gamepad API support (Xbox/PlayStation controller mapping)
- [ ] Full keyboard controls (WASD pan, +/- zoom, hotkeys for spells)
- [ ] Key remapping UI
- [ ] Input assist: auto-aim, snap-to-grid, smart selection
- [ ] Gesture recognition for touch (pinch zoom, two-finger rotate)

---

### 8.3 Onboarding & Tutorial
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Required:**
- [ ] Interactive tutorial: guided first 5 minutes of gameplay
- [ ] Contextual hints: "?" tooltips on first encounter
- [ ] Encyclopedia: in-game lore and mechanic reference
- [ ] Difficulty selection: Easy/Normal/Hard/Custom
- [ ] New game presets: peaceful, balanced, hardcore

---

## 9. INFRASTRUCTURE & BACKEND

### 9.1 Cloud Saves
**Status:** MISSING | **Priority:** P2 | **Effort:** L | **Impact:** Medium

**Current State:**
- `localStorage` only for persistence
- No server backup

**Required:**
- [ ] User account system (OAuth: Google, Discord, etc.)
- [ ] Cloud save sync across devices
- [ ] Save versioning and rollback
- [ ] Offline queue: sync when connection restored

---

### 9.2 Multiplayer
**Status:** MISSING | **Priority:** P3 | **Effort:** XL | **Impact:** Low

**Required:**
- [ ] Client-server architecture (WebSocket or WebRTC)
- [ ] Authoritative server for simulation
- [ ] Client-side prediction + server reconciliation
- [ ] Lobby system and matchmaking
- [ ] Spectator mode and replay system

---

### 9.3 Analytics & Telemetry
**Status:** MISSING | **Priority:** P2 | **Effort:** S | **Impact:** Medium

**Required:**
- [ ] Player behavior tracking (opt-in)
- [ ] Performance telemetry (FPS drops, load times)
- [ ] Funnel analysis: tutorial completion, first battle, first spell
- [ ] A/B testing framework for balance tuning

---

### 9.4 Crash Reporting
**Status:** MISSING | **Priority:** P2 | **Effort:** S | **Impact:** Medium

**Required:**
- [ ] Sentry or Rollbar integration
- [ ] Automatic error capture (JS exceptions, WebGL errors)
- [ ] User-initiated bug reports with screenshot
- [ ] Performance regression alerts

---

## 10. PERSISTENCE & STATE MANAGEMENT

### 10.1 Save System Robustness
**Status:** PARTIAL | **Priority:** P0 | **Effort:** M | **Impact:** Critical

**Current State:**
- `exportState()` / `importState()` exist on ECS
- `saveGame` / `loadGame` in App.tsx use JSON serialization
- No versioning, no migration, no validation

**Required:**
- [ ] Save format versioning (`version: "1.0.0"`)
- [ ] Migration system for old saves (`migrate_1_0_to_1_1`)
- [ ] Schema validation on load (reject corrupted saves)
- [ ] Auto-save every 60 seconds
- [ ] Manual save slots (5+ named slots)
- [ ] Save thumbnails (screenshot at save time)
- [ ] Compressed save format (gzip JSON)
- [ ] Quicksave/Quickload (F5/F9)

---

### 10.2 State Snapshots & Replays
**Status:** MISSING | **Priority:** P2 | **Effort:** L | **Impact:** Medium

**Required:**
- [ ] Periodic state snapshots (every 30 seconds)
- [ ] Deterministic replay system (record all RNG seeds + inputs)
- [ ] Rewind capability (return to previous snapshot)
- [ ] Replay export/share (encode as URL or file)

---

## IMPLEMENTATION PRIORITY ROADMAP

### Phase 1: Core Gameplay (Weeks 1-4)
1. Pathfinding (A* + NavMesh)
2. Particle Effects Engine
3. Day/Night Cycle
4. Sound Effects (Foley)
5. Combat Resolution Engine

### Phase 2: World Depth (Weeks 5-8)
6. Weather System (Visual + Mechanical)
7. Behavior Trees for Entities
8. Resource Gathering & Harvesting
9. Post-Processing Pipeline (Bloom, SSAO)
10. Object Pooling

### Phase 3: Player Experience (Weeks 9-12)
11. Animation & Tweening
12. Music System
13. Crafting & Tech Tree
14. Input Systems (Gamepad, Keyboard)
15. Accessibility Features

### Phase 4: Polish & Scale (Weeks 13-16)
16. Dynamic Shadows
17. Water Rendering
18. Seasonal Cycle
19. Ecological Simulation
20. Cloud Saves

### Phase 5: Advanced Features (Weeks 17-20)
21. Disease & Epidemics
22. Squad/Formation AI
23. Trade System
24. Multiplayer (if scope permits)
25. GPU Compute (WebGPU)

---

## SUMMARY STATISTICS

| Category | MISSING | PARTIAL | STUB | COMPLETE |
|----------|---------|---------|------|----------|
| AI Systems | 4 | 0 | 0 | 0 |
| Economy | 5 | 0 | 0 | 0 |
| Combat | 3 | 0 | 0 | 0 |
| World Sim | 6 | 1 | 2 | 0 |
| Rendering | 6 | 0 | 1 | 0 |
| Audio | 3 | 0 | 1 | 0 |
| Engineering | 6 | 0 | 0 | 0 |
| UX/Accessibility | 3 | 0 | 0 | 0 |
| Infrastructure | 4 | 0 | 0 | 0 |
| Persistence | 2 | 1 | 0 | 0 |
| **TOTAL** | **42** | **2** | **4** | **0** |

**Current AAA Readiness:** ~15% (Foundation exists, most systems missing)

---

*This document should be reviewed and updated after each implementation sprint. Check off items as they are completed and add new gaps discovered during development.*
