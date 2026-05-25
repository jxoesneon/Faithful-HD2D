# Faithful: Hierarchical Simulation Levels

This document defines the nested scales of the _Faithful_ engine, detailing how every simulation pillar (Physics, Biology, Society, Faith) manifests from the global planetary view down to individual atomic items, ensuring massive scale without throttling CPU overhead.

---

## Level 0: Planetary (Global Scale - The Sphere)

_The absolute scope of the simulation. Visualized as a 3D procedural sphere, rendering global data sets without individual sprites._

| Pillar      | Manifestation                                                          | Engine Component       | Update Frequency |
| :---------- | :--------------------------------------------------------------------- | :--------------------- | :--------------- |
| **Physics** | Global Climate (Average Temp, axial tilt, sea level, tectonic plates). | `GlobalPhysicsBuffer`  | 1 Tick / 10s     |
| **Biology** | Total Planetary Biomass, Global Extinction Events, Ecosystem Health.   | `WorldStats`           | 1 Tick / 10s     |
| **Society** | Total Sentient Population, Global Deforestation, Carbon Footprint.     | `MacroEconomySystem`   | 1 Tick / 5s      |
| **Faith**   | "Divine Resonance" - The net reception of the divine globally.         | `BeliefMatrix::Global` | 1 Tick / 1s      |

---

## Level 1: Region / Biome (Macro Scale - The Map)

_Large geographical sectors (e.g., The Verdant Rift, The Obsidian Peaks). Rendered as blended texture splats._

| Pillar      | Manifestation                                                   | Engine Component     | Update Frequency |
| :---------- | :-------------------------------------------------------------- | :------------------- | :--------------- |
| **Physics** | Macro-Weather Systems (Hurricanes, Fronts), Seismic risk zones. | `RegionChunk`        | 1 Tick / 1s      |
| **Biology** | Biome specialization (Predator/Prey ratios), Migration routes.  | `EcosystemNode`      | 1 Tick / 2s      |
| **Society** | National Borders, Macro-Trade Routes, Diplomatic relations.     | `SocioCulturalBlock` | 1 Tick / 2s      |
| **Faith**   | Religious dominance boundaries, Macro-Schism zones, Holy Wars.  | `FaithSchismLayer`   | 1 Tick / 1s      |

---

## Level 2: Settlement / Ecosystem (Meso Scale - The Grid)

_The primary level of gameplay and intervention. The classic 2.5D isometric view._

| Pillar      | Manifestation                                                        | Engine Component        | Update Frequency |
| :---------- | :------------------------------------------------------------------- | :---------------------- | :--------------- |
| **Physics** | Local Tile Humidity, Soil Composition, Elevation, Flowing Water.     | `TileGrid`              | 10 Ticks / 1s    |
| **Biology** | Local Food Chains, Disease outbreaks, Crop yields.                   | `BiologyComponent`      | 5 Ticks / 1s     |
| **Society** | Specific Tribes, City clusters, Resource Depots, Tech progression.   | `SocietyComponent`      | 10 Ticks / 1s    |
| **Faith**   | Specific Temples, Local Ritual modifiers, Devotion Generation Yield. | `FaithComponent::Local` | 20 Ticks / 1s    |

---

## Level 3: Entity / Structure (Micro Scale - The Actors)

_Individual actors and buildings within the simulation. Culled entirely when off-screen or zoomed out._

| Pillar      | Manifestation                                                        | Engine Component  | Update Frequency |
| :---------- | :------------------------------------------------------------------- | :---------------- | :--------------- |
| **Physics** | Structural Stress/Durability, Actor core temperature, Collision.     | `PhysicsAttribs`  | 60Hz (Physics)   |
| **Biology** | Specific Animal or Sentient Being (Health, Hunger, Stamina).         | `ActorEntity`     | 60Hz (Logic)     |
| **Society** | Individual Houses, Forges, Barracks, Job Assignments.                | `StructureEntity` | 1 Tick / 1s      |
| **Faith**   | Individual Piety, Spiritual Alignment, susceptibility to conversion. | `BeliefComponent` | 1 Tick / 1s      |

---

## Level 4: Item / Component (Atomic Scale - The Data)

_The smallest trackable data points and material properties in the ECS._

| Pillar      | Manifestation                                                     | Engine Component  | Update Frequency |
| :---------- | :---------------------------------------------------------------- | :---------------- | :--------------- |
| **Physics** | Material properties (Lava Heat, Steel Hardness, Water Viscosity). | `MaterialTable`   | Static/Event     |
| **Biology** | DNA Sequences, Status Effects (Poison, Buff, Burn duration).      | `AttributeBuffer` | 60Hz (Event)     |
| **Society** | Tools, Artifacts, Currency units, specific weapon types.          | `InventoryItem`   | Event Driven     |
| **Faith**   | Holy Symbols, Relics, Specific Miracles, UI indicator particles.  | `DivineArtifact`  | Event Driven     |

---

## Data Propagation Flow

The engine uses a highly optimized bidirectional data flow to prevent simulation bottlenecking:

1. **Data Emergence (Bottom-Up):**
   - _Example:_ A Level 4 genetic mutation (Thick Fur) allows a species to survive in the cold. At Level 3, individual wolves migrate north. At Level 2, a new Tundra Ecosystem is formed. At Level 1, the biome's predator ratio shifts. At Level 0, the Global Genetic Diversity Index (GDI) increases.
   - Computations are averaged and aggregated into LOD layers to prevent the global simulation from tracking individual Level 4 mutations.

2. **Data Cascade (Top-Down):**
   - _Example:_ The player initiates a Level 0 global "Ice Age" miracle. At Level 1, polar regions physically expand toward the equator. At Level 2, specific Grass tiles freeze over. At Level 3, farmers without cold protection freeze. At Level 4, local water items transition to ice.
   - Global parameters act as bounds and multipliers for localized ECS updates, ensuring massive changes do not stall the main thread.
