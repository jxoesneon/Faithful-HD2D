# Faithful: AAA Gap Analysis - SUPPLEMENT

**Document Version:** 1.0  
**Last Updated:** 2026-06-03  
**Purpose:** Additional systems discovered after initial audit  

---

## 11. ITEM & EQUIPMENT SYSTEMS

### 11.1 Inventory / Artifact System
**Status:** MISSING | **Priority:** P1 | **Effort:** L | **Impact:** High

**Source:** `docs/tier-definitions.md` - Pillar 3 L4 (Artifact)

**Current State:**
- `Society.resources` exists but represents abstract currency only
- No item entity type, no inventory component
- `equip-armor-4k-sheet` and `equip-weapons-4k-sheet` exist but unused

**Required:**
- [ ] Item entity type with: name, type, rarity (Common to Mythic), durability, weight
- [ ] Equipment slots: Weapon, Armor, Accessory, Relic
- [ ] Inventory capacity per unit based on carrying capacity stat
- [ ] Item effects: passive bonuses, active abilities, set bonuses
- [ ] Loot tables per biome / creature type / difficulty
- [ ] Item degradation and repair system
- [ ] Visual: equipped items shown on entity sprites (sword in hand, armor tint)
- [ ] Drop/pickup ground items (timed despawn)

**Files:**
- `src/types.ts` - Add `Item`, `Inventory`, `Equipment` components
- `src/engine/items/` directory (new)
- `src/components/InventoryUI.tsx` (new)

---

### 11.2 Item Crafting & Enchanting
**Status:** MISSING | **Priority:** P2 | **Effort:** L | **Impact:** Medium

**Required:**
- [ ] Socket system for gems/runes
- [ ] Enchantment recipes (elemental damage, divine blessing)
- [ ] Transmutation (convert items to essence)
- [ ] Legendary items with unique proc effects
- [ ] Item sets: equip 3/5 pieces for bonus

---

## 12. FAITH & RELIGION SYSTEMS (Deep Dive)

### 12.1 Faith Fog / Ideology Overlay
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Source:** `docs/tier-definitions.md` - Pillar 4 L0

**Current State:**
- `Faith` component exists with `beliefMatrix`
- No visual overlay of religious influence
- No regional conversion mechanics

**Required:**
- [ ] Per-tile faith intensity map (Float32Array overlay)
- [ ] Faith spread algorithm: adjacent tile influence decay
- [ ] Visual: colored fog overlay (ANIMIST=green, TECHNOCRAT=cyan, etc.)
- [ ] Dominant religion calculation per region
- [ ] Religious border conflicts when different faiths meet

---

### 12.2 Missionary & Conversion System
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Source:** `docs/tier-definitions.md` - Pillar 4 L1

**Current State:**
- `tribalRelations` exists but unused
- No conversion mechanics

**Required:**
- [ ] Missionary unit type (travels between tribes)
- [ ] Conversion rate formula: preacher piety × target openness × time
- [ ] Resistance factors: native faith strength, Inquisitor units, cultural isolation
- [ ] Schism events: when a tribe splits over religious differences
- [ ] Holy War declaration when conversion aggressive

---

### 12.3 Shrine Influence Radius
**Status:** MISSING | **Priority:** P1 | **Effort:** S | **Impact:** High

**Source:** `docs/tier-definitions.md` - Pillar 4 L2

**Required:**
- [ ] Circular area of effect around holy structures
- [ ] Effects: devotion generation boost, healing, happiness, enemy debuff
- [ ] Overlapping shrines create "sacred ground" with amplified effects
- [ ] Desecrated shrines invert effects (cursed ground)

---

### 12.4 Piety & Prayer Cooldown System
**Status:** STUB | **Priority:** P1 | **Effort:** M | **Impact:** High

**Source:** `docs/tier-definitions.md` - Pillar 4 L3

**Current State:**
- `Prayer` component exists (`questType`, `targetValue`, `durationLeft`, `rewardDevotion`, `isFulfilled`)
- No actual prayer mechanics implemented

**Required:**
- [ ] Individual piety score per entity (0-100)
- [ ] Prayer cooldown timers per entity
- [ ] Prayer types: petition, thanksgiving, penance, intercession
- [ ] Answered prayer probability based on piety + devotion pool
- [ ] Unanswered prayers reduce piety over time (crisis of faith)
- [ ] Mass prayer events (tribe-wide rituals)

---

### 12.5 Dogma / Policy System
**Status:** MISSING | **Priority:** P2 | **Effort:** M | **Impact:** Medium

**Source:** `docs/tier-definitions.md` - Pillar 4 L4

**Current State:**
- `FaithSystemType` enum exists (`ANIMISM`, `ELEMENTALISM`, etc.)
- No policy flags or tenet mechanics

**Required:**
- [ ] Tenet database: 20+ doctrinal tenets per faith
  - Example: `allow_human_sacrifice: true` → +devotion, -happiness
  - Example: `tech_hate: true` → blocks research, +faith resistance
  - Example: `nature_reverence: true` → +flora growth, -strip mining
- [ ] Tenet unlocking: based on divine level, tribe size, events
- [ ] Tenet conflicts: opposing tenets create schism risk
- [ ] Visual: rune UI showing active tenets

---

## 13. PHYSICS & COLLISION SYSTEMS

### 13.1 Collision Detection & Response
**Status:** MISSING | **Priority:** P0 | **Effort:** M | **Impact:** Critical

**Source:** `docs/tier-definitions.md` - Pillar 1 L3 (Prop)

**Current State:**
- Entities overlap freely
- No bounding boxes despite mention in design docs
- `Physics` component has `height` but no collision

**Required:**
- [ ] Axis-Aligned Bounding Box (AABB) per entity
- [ ] Spatial hash or quadtree for broad-phase collision
- [ ] Narrow-phase: AABB vs AABB, Circle vs Circle
- [ ] Collision layers: terrain, structures, entities, projectiles
- [ ] Collision response: push apart, slide along, stop movement
- [ ] Ray casting for line-of-sight and projectile hit detection

---

### 13.2 Rigid Body Physics
**Status:** MISSING | **Priority:** P2 | **Effort:** L | **Impact:** Medium

**Required:**
- [ ] Velocity-based movement with friction
- [ ] Knockback from explosions/spells
- [ ] Projectile arcs (gravity-affected)
- [ ] Destructible environment (falling trees, collapsing walls)

---

## 14. MACRO-LEVEL SYSTEMS

### 14.1 Planetary View / Night-Side Orbital
**Status:** MISSING | **Priority:** P2 | **Effort:** L | **Impact:** Medium

**Source:** `docs/tier-definitions.md` - Pillar 3 L0

**Required:**
- [ ] Zoom-out transition from isometric to planetary view
- [ ] Night-side rendering: city lights based on settlement density
- [ ] Temperature bands visible as color gradients
- [ ] Sea level indicators
- [ ] Click region to zoom back in

---

### 14.2 National Borders & Allegiance
**Status:** MISSING | **Priority:** P2 | **Effort:** M | **Impact:** Medium

**Source:** `docs/tier-definitions.md` - Pillar 3 L1

**Required:**
- [ ] Border calculation via Voronoi diagram or influence map
- [ ] Border rendering: colored lines with faction emblem
- [ ] Allegiance system: vassal states, tributaries, allies
- [ ] Border tension when allegiance changes

---

### 14.3 Settlement Clustering & Auto-Tiling
**Status:** MISSING | **Priority:** P2 | **Effort:** M | **Impact:** Medium

**Source:** `docs/tier-definitions.md` - Pillar 3 L2

**Required:**
- [ ] Adjacent structures of same faction form settlement clusters
- [ ] Auto-tiling: connecting walls, roads, bridges between nearby buildings
- [ ] Settlement level upgrades based on structure count + population
  - Hamlet (1-3 structures) → Village (4-8) → Town (9-20) → City (21+)
- [ ] Visual: settlement name label, glow intensity based on size

---

### 14.4 Structure Work Animations
**Status:** MISSING | **Priority:** P2 | **Effort:** M | **Impact:** Medium

**Source:** `docs/tier-definitions.md` - Pillar 3 L3

**Current State:**
- `Structure.efficiency` exists but unused
- No structure state animations

**Required:**
- [ ] Structure states: idle, working, complete, damaged, destroyed
- [ ] Working animation: smoke from forge, spinning mill, glowing altar
- [ ] Emission layers: night-time glow from active structures
- [ ] Production progress bar over structure when crafting

---

## 15. STATUS EFFECTS & TRAITS

### 15.1 Status Effect System
**Status:** STUB | **Priority:** P1 | **Effort:** M | **Impact:** High

**Source:** `docs/tier-definitions.md` - Pillar 2 L4 (Attributes)

**Current State:**
- `Biology` component has `health` but no status effect tracking
- `Flora.cultivarTier` exists but unused
- No buff/debuff mechanics

**Required:**
- [ ] Status effect types:
  - **Buffs:** Blessed (+devotion), Inspired (+productivity), Hasted (+speed)
  - **Debuffs:** Cursed (-devotion), Diseased (-health), Starving (-strength), Poisoned (DOT)
  - **CC:** Stunned, Silenced, Feared, Rooted, Slowed, Blinded
  - **Special:** Invisible, Invulnerable, Ethereal, Berserk
- [ ] Effect stacking rules: same type refresh duration or stack intensity
- [ ] Visual: floating status icons above entities, screen tint for player
- [ ] Duration and tick system (apply per-second effects)

---

### 15.2 Trait / DNA System
**Status:** MISSING | **Priority:** P2 | **Effort:** L | **Impact:** Medium

**Source:** `docs/tier-definitions.md` - Pillar 2 L4

**Current State:**
- `Biology.dna` exists as string but unused

**Required:**
- [ ] Trait database: "Thick Fur", "Night Vision", "Fast Metabolism", etc.
- [ ] DNA encoding: traits as genes with dominant/recessive
- [ ] Inheritance: offspring inherit blended traits from parents
- [ ] Mutation: random mutations, radiation-induced, divine intervention
- [ ] Visual: DNA strand UI, trait icon display

---

## 16. QUEST & NARRATIVE SYSTEMS

### 16.1 Prayer Quest System
**Status:** STUB | **Priority:** P1 | **Effort:** M | **Impact:** High

**Current State:**
- `Prayer` component exists with `questType`, `targetValue`, `isFulfilled`
- No quest generation, tracking, or completion mechanics

**Required:**
- [ ] Quest generation engine
  - "Grow population to 50" → reward: +devotion
  - "Build 3 farms" → reward: +divine XP
  - "Defeat the wolf pack" → reward: blessing
  - "Survive the drought" → reward: rain spell unlock
- [ ] Quest acceptance UI (divine mandate prompt)
- [ ] Progress tracking with visual indicators
- [ ] Quest chains: 3-part narratives with escalating rewards
- [ ] Failable quests with consequences (lost faith, schism)

---

### 16.2 Event System (Random Events)
**Status:** PARTIAL | **Priority:** P1 | **Effort:** M | **Impact:** High

**Current State:**
- `eventLogs` array exists with `{id, time, type, text}`
- Only used for player actions, no random events

**Required:**
- [ ] Event pool: 50+ random events
  - Natural: Earthquake, Flood, Meteor Shower, Eclipse
  - Political: Coup, Election, Revolution, Civil War
  - Religious: Miracle, Heresy, Pilgrimage, Prophet born
  - Economic: Boom, Depression, Discovery, Famine
  - External: Invasion, Refugees, Plague Ship, Trader caravan
- [ ] Event probability based on world state
- [ ] Player choice events: 2-4 options with different outcomes
- [ ] Chain events: one event triggers another 30% of the time

---

### 16.3 Dialogue / Story System
**Status:** MISSING | **Priority:** P2 | **Effort:** L | **Impact:** Medium

**Required:**
- [ ] Dialogue trees for named NPCs (tribe chiefs, prophets)
- [ ] Lore codex: unlockable entries discovered through play
- [ ] Bestiary: catalog of encountered creatures
- [ ] Herbarium: catalog of discovered flora
- [ ] Timeline: major world events displayed chronologically

---

## 17. NOTIFICATION & UI SYSTEMS

### 17.1 Notification System
**Status:** MISSING | **Priority:** P0 | **Effort:** S | **Impact:** Critical

**Current State:**
- `eventLogs` pushed to array but no visible notification UI
- Console logs only, no player-facing alerts

**Required:**
- [ ] Toast notification queue (bottom-right or top-center)
- [ ] Notification types: info, success, warning, error, critical
- [ ] Categories: Economy, Combat, Diplomacy, Divine, Ecology
- [ ] Persistent log with filtering and search
- [ ] Critical alerts: pause game, require dismissal

---

### 17.2 Minimap / Overworld Map
**Status:** MISSING | **Priority:** P1 | **Effort:** M | **Impact:** High

**Required:**
- [ ] Minimap widget (corner of screen, 200x200px)
- [ ] Fog of war: unexplored areas hidden
- [ ] Entity dots: different colors per type
- [ ] Camera viewport rectangle
- [ ] Click to pan camera to location
- [ ] Zoomed-out strategic map mode

---

### 17.3 Bookmark / Waypoint System
**Status:** MISSING | **Priority:** P2 | **Effort:** S | **Impact:** Medium

**Required:**
- [ ] Player-placed waypoints with custom labels
- [ ] Quick-jump hotkeys (Ctrl+1 through Ctrl+9)
- [ ] Waypoint visualization: beacon pillars of light

---

## 18. PROGRESSION & ACHIEVEMENTS

### 18.1 Achievement System
**Status:** MISSING | **Priority:** P2 | **Effort:** M | **Impact:** Medium

**Current State:**
- `actionsCompleted` tracks counts but no achievement UI

**Required:**
- [ ] Achievement database: 100+ achievements
  - Progression: "First Tribe", "City Builder", "Technocracy"
  - Combat: "Wolf Slayer", "Siege Master", "Pacifist"
  - Divine: "Miracle Worker", "Apocalypse", "Benevolent God"
  - Secret: "Hidden" achievements with cryptic hints
- [ ] Achievement unlock: popup with icon, title, description
- [ ] Steam/Xbox/PlayStation integration for platform achievements

---

### 18.2 Title / Rank System
**Status:** MISSING | **Priority:** P3 | **Effort:** S | **Impact:** Low

**Required:**
- [ ] Player titles based on playstyle: "The Benevolent", "The Wrathful", "The Builder"
- [ ] Prefix/suffix display in multiplayer
- [ ] Title unlock conditions

---

### 18.3 Leaderboard / Competitive
**Status:** MISSING | **Priority:** P3 | **Effort:** L | **Impact:** Low

**Required:**
- [ ] Score calculation: population × tech × faith × happiness
- [ ] Speed-run categories: fastest to divine ascension
- [ ] Leaderboard API integration

---

## 19. SOCIAL & MULTIPLAYER

### 19.1 Guild / Pantheon System
**Status:** MISSING | **Priority:** P3 | **Effort:** L | **Impact:** Low

**Required:**
- [ ] Player guilds (named pantheons)
- [ ] Pantheon-wide blessings
- [ ] Shared temples and relics
- [ ] Pantheon wars (group vs group)

---

### 19.2 Chat & Emote System
**Status:** MISSING | **Priority:** P3 | **Effort:** S | **Impact:** Low

**Required:**
- [ ] In-game chat: global, pantheon, whisper
- [ ] Emote animations for entities
- [ ] Ping system: mark locations for allies

---

## 20. CINEMATIC & CAMERA SYSTEMS

### 20.1 Cinematic Camera
**Status:** MISSING | **Priority:** P2 | **Effort:** M | **Impact:** Medium

**Required:**
- [ ] Scripted camera paths (spline-based)
- [ ] Cinematic triggers: first miracle, first battle, divine ascension
- [ ] Depth of field focus pulling during cinematics
- [ ] Letterbox mode (black bars top/bottom)
- [ ] Skip button for repeat viewings

---

### 20.2 Photo Mode
**Status:** MISSING | **Priority:** P3 | **Effort:** S | **Impact:** Low

**Required:**
- [ ] Free camera (noclip) with full control
- [ ] Time freeze while in photo mode
- [ ] Filters: grayscale, sepia, high contrast
- [ ] Screenshot with UI hidden
- [ ] Share to social media integration

---

### 20.3 Replay System
**Status:** MISSING | **Priority:** P2 | **Effort:** L | **Impact:** Medium

**Required:**
- [ ] Deterministic replay recording (inputs + RNG seeds)
- [ ] Playback controls: play, pause, rewind, fast-forward
- [ ] Spectator camera during replay
- [ ] Export/share replays as files or URLs

---

## 21. DEBUG & CHEAT SYSTEMS

### 21.1 Developer Console
**Status:** MISSING | **Priority:** P2 | **Effort:** S | **Impact:** Medium

**Required:**
- [ ] In-game console (~ key toggle)
- [ ] Commands: spawn entity, set weather, teleport, give resources
- [ ] Entity inspector (click any entity to see all components)
- [ ] Performance overlay: FPS, draw calls, entity count, memory
- [ ] Hot-reload support for shaders/scripts

---

### 21.2 Cheat System
**Status:** MISSING | **Priority:** P3 | **Effort:** S | **Impact:** Low

**Required:**
- [ ] Cheat codes for testing (disable achievements when active)
- [ ] God mode, infinite resources, instant build
- [ ] Time manipulation: pause, slow-mo, fast-forward

---

## REVISED SUMMARY STATISTICS

### Original Audit
| Category | MISSING | PARTIAL | STUB | COMPLETE |
|----------|---------|---------|------|----------|
| **TOTAL** | **42** | **2** | **4** | **0** |

### Supplement Additions
| Category | Count |
|----------|-------|
| Item & Equipment | 2 |
| Faith & Religion | 5 |
| Physics & Collision | 2 |
| Macro-Level | 4 |
| Status Effects | 2 |
| Quest & Narrative | 3 |
| Notification & UI | 3 |
| Progression | 3 |
| Social & Multiplayer | 2 |
| Cinematic & Camera | 3 |
| Debug & Cheat | 2 |
| **NEW TOTAL** | **31** |

### Combined Total
| Category | MISSING | PARTIAL | STUB | COMPLETE |
|----------|---------|---------|------|----------|
| **TOTAL** | **73** | **2** | **5** | **0** |

**Revised AAA Readiness:** ~10% (Foundation exists, majority of systems missing)

---

*This supplement should be merged into the main AAA-GAP-ANALYSIS.md in the next revision.*
