# Faithful: Master Tier Definitions

This document provides a rigorous, exhaustive definition for every pillar across all five simulation tiers, including the specific quantitative data points tracked.

---

## PILLAR 1: PHYSICS (The Canvas)

### L0: Planetary

- **Definition**: Global thermocline, sea level, and axial tilt.
- **Data Bounds**: Temperature (-100C to +100C), Hydrosphere coverage (0% to 100%).
- **Visual**: A spherical gradient showing temperature bands and sea level projections.

### L1: Region

- **Definition**: Regional weather cells (High/Low pressure) and seismic risk zones.
- **Data Bounds**: 64x64 chunk data arrays (e.g., Regional Aridity Index, Tectonic Stress 0-100).
- **Visual**: Flowing wind vectors and shaded "risk zones" for earthquakes.

### L2: Tile

- **Definition**: Specific tile properties (Humidity, Temp, Elevation, Material).
- **Data Bounds**: Z-height (0-255), Biome ID, localized moisture level.
- **Visual**: The 64x32px isometric tile texture (Grass, Rock, Sand) with dynamic edge masking.

### L3: Prop

- **Definition**: Physical interaction with structures (Collision, shadow casting, destructibility).
- **Data Bounds**: Bounding box dimensions (x,y,width,height), Structural Integrity (0-1000 HP).
- **Visual**: Lighting masks, occlusion volumes, and rigid-body collision boxes.

### L4: Material

- **Definition**: Atomic properties of physical matter.
- **Data Bounds**: Friction coefficient, Flammability (0.0 - 1.0), Density.
- **Visual**: Particle emission type when struck or destroyed (e.g., sparks vs wood splinters).

---

## PILLAR 2: BIOLOGY (The Actors)

### L0: Planetary

- **Definition**: The Global Ecosystem Health Index and Species Count.
- **Data Bounds**: Total Biomass (teratons), Genetic Diversity Index (GDI 0.0 - 1.0).
- **Visual**: A pulsing green aura around the planet that dims during extinction events.

### L1: Region

- **Definition**: Biome-specific food webs and migration paths.
- **Data Bounds**: Carrying Capacity multipliers, Apex Predator census.
- **Visual**: Statistical overlays; abstracted herd density clouds.

### L2: Ecosystem

- **Definition**: Local Flora/Fauna densities and localized health over the grid.
- **Data Bounds**: Growth cycles, localized disease vectors.
- **Visual**: Animated grass tiles, flora growth states (seasonal changes).

### L3: Actor

- **Definition**: Individual agent logic (Health, AI routines - Graze, Hunt, Rest).
- **Data Bounds**: Stamina, Hunger, Hydration, Movement Speed (pixels/sec).
- **Visual**: Specific animated entity sprites (e.g., A stag, a wolf, a villager).

### L4: Attributes

- **Definition**: DNA strands and distinct physiological variables.
- **Data Bounds**: Trait UUIDs (e.g., "Thick Fur", "Night Vision"), current active Status Effects ticks.
- **Visual**: Glowing DNA strand UI elements and floating status effect buff/debuff icons.

---

## PILLAR 3: SOCIETY (The Builders)

### L0: Planetary

- **Definition**: Total Sentience and "Progress of Civilization" Metric.
- **Data Bounds**: Aggregate population integer; dominant global technology tier (1-5).
- **Visual**: Night-side orbital lights indicating civilization spread via electric/fire light.

### L1: Region

- **Definition**: National borders, macro trade routes, and diplomatic states.
- **Data Bounds**: Gross Domestic Product (GDP equivalent), Allegiance ID tags.
- **Visual**: Subtly drawn colored border lines; glowing splines moving along trade routes.

### L2: Settlement

- **Definition**: City resources, population capacity, and technology stage.
- **Data Bounds**: Stockpile integers (Wood, Iron, Food), Housing capacity.
- **Visual**: Settlement clusters (Huts, Towns, Metropolises) auto-tiling across the grid.

### L3: Structure

- **Definition**: Functional buildings (Temple, Forge, Farm, Laboratory).
- **Data Bounds**: Job capacity (e.g., 0/5 workers), current production progress.
- **Visual**: Individual structure sprites with varying "work" animations and emission layers.

### L4: Artifact

- **Definition**: Unit inventories: Swords, Scrolls, Computed Data, Relics.
- **Data Bounds**: Stack counts, Item rarity (Common to Mythic), Durability.
- **Visual**: Inventory icons, held-item sprites equipped onto L3 actors.

---

## PILLAR 4: FAITH (The Ideology)

### L0: Planetary

- **Definition**: The Global Divine Resonance and Dominant World Religion.
- **Data Bounds**: Net Devotion per second (Δ/tick), Global Belief Matrix distribution percentages.
- **Visual**: A "Faith Fog" overlay showing the planetary ideological color lean.

### L1: Region

- **Definition**: Religious borders and Schism transition zones.
- **Data Bounds**: Regional Radicalization Index, Conversion pressure vectors.
- **Visual**: Moving "Missionary" nodes; glowing fault lines indicating holy wars.

### L2: Faith System

- **Definition**: Local Devotion yield, active Miracles, and Priesthood activity.
- **Data Bounds**: Local Shrine radius influence, regional belief matrix.
- **Visual**: Glowing halos around holy sites; localized miracle VFX fields.

### L3: Ritual

- **Definition**: Individual acts of worship, prayer, or sacrifice.
- **Data Bounds**: Individual Piety score (0-100), active prayer cooldown timers.
- **Visual**: Particle effects (e.g., rising "souls" or light) emitting from worshippers.

### L4: Dogma

- **Definition**: Specific belief tenets or doctrines dictating AI behavior.
- **Data Bounds**: Policy flags (e.g., `allow_human_sacrifice: true`, `tech_hate: true`).
- **Visual**: Textual runes and symbolic glyphs attached to the belief matrix UI.
