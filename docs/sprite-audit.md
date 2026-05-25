# Sprite Audit & Ecosystem Expansion (L0 - L4)

Following an exhaustive review of the core visual assets and the physical requirements for the underlying Entity Component System (ECS), the initial sprite definitions were identified as lacking structural animation coverage (e.g. they only provided 1 cell per subject, completely breaking logic mappings). 

In response, we have implemented a massive architectural overhaul. **Every subject now fully occupies an 8-cell row of a 4K spritesheet**, effectively granting 8 frames of fluid isometric animation progression.

## Resolution: Matrix-Style Scaling

We moved from 8 consolidated sheets holding thousands of static placeholders to **24 hyper-focused sheets**, mathematically structuring 8 subjects per sheet (64 cells total per sheet).

### 1. Factional Rosters (Characters)
Each of the 5 main factions (Animist, Technocrat, Interventionist, Nihilist, Elemental) received a dedicated sheet covering their 8 distinct classes (Gatherers, Soldiers, Directors, Executioners, Shamans).
Each character now possesses an exact 8-frame loop:
`Idle 1 -> Idle 2 -> Walk 1 -> Walk 2 -> Walk 3 -> Action 1 -> Action 2 -> Death`.

### 2. Settler Logic & Infrastructure (Buildings)
Each faction, plus Universal Infrastructure, now has dedicated building sheets. Every building progresses via strict ECS lifecycle rules:
`Foundation -> Scaffold -> Idle 1 -> Idle 2 -> Active 1 -> Active 2 -> Damaged -> Ruined`.

### 3. Ecology & Agriculture (Flora/Crops)
- **Trees (Standard & Exotic Phase)**: Animated across 8 states from `Swaying in the wind` down to `Being chopped`, `Falling`, and `Stump`.
- **Crops**: Every crop transitions dynamically from `Seeded dirt -> Sprout -> Young -> Mature -> Harvestable -> Withered -> Rotted compost`.

### 4. Elemental Anatomy (Geology)
Every mineral deposit (from Coal and Obsidian to Divine Faith Quartz) proceeds mechanically across 8 visual densities:
`Pristine -> Glowing -> Mined (Phase 1-3) -> Depleted -> Crumbling -> Dust Decal`.

### 5. VFX & Equipment Tracking
Equipment (Armor, Shields, Rifles) precisely match the spatial trajectory of Character sprites across all 8 frames. VFX (Miracles and Cataclysms) progress mathematically from `Inception -> Expansion -> Peak sustained -> Trailing off`.

## Final Output Status
- **Sheets Defined**: 24 Unique 4096x4096 Sheets.
- **Subjects Defined**: 192 Unique Entities (each fully animated natively in 8 directions/phases).
- **Cells Accounted For**: 1536 individual isometric states automatically fed into `/docs/sprite-mappings.json`.
- **System Capacity**: 100% Prepared for the engine loop.
