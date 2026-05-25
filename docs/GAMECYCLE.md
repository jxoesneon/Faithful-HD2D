# Cosmogenesis Simulation Engine: The Divine Gamecycle

Welcome to the comprehensive system core and mechanics breakdown for the **Cosmogenesis Simulation Engine**. This document specifies the architectural frameworks, physics cycles, mortal socio-demographics, active mandates, and the comprehensive Divine Progression loops that govern our ecosystem.

---

## 1. Architectural Foundation (The ECS Framework)

The core engine is built on a custom **Entity-Component-System (ECS)** architecture running on a modular, high-performance tick loop driven by localized frame-rate independent delta time (`dt`).

### Key Simulation Components
Entities within our cosmos are compositionally formed by linking independent properties:
*   **Physics Component**: Tracks tile `temperature` (°C) and relative environmental `humidity` (%).
*   **Biology Component**: Tracks organic `biomass` and holds hereditary `DNA` code strings.
*   **Position Component**: Pinpoints coordinates `(X, Y)` for spatial pathfinding.
*   **Movement Component**: Dictates current speed limits, relative velocities `(vx, vy)`, and current activity states (`IDLE`, `WANDERING`, `BUSY`, `FLEEING`).
*   **Society Component**: Governs demographic behaviors (`population`, `resources`, `happiness`, `techScale`), job assignments, and active mandates.
*   **Faith Component**: Translates devotional systems, planetary belief alignment matrices (Animism, Mysticism, Secularism), and active devotion pools.
*   **Flora Component**: Regulates local vegetative life cycles, regrowth timers, harvesting states, and resource yields.
*   **Fauna Component**: Steers wildlife health, hunger intervals, action choices, and species taxonomies (e.g., peaceful herbivores vs. hostile timberwolves).

---

## 2. Dynamic Environmental & Physical Drift Cycle

Every tick, physical layers update globally to simulate a living, breathing planet. 

```
[Global Weather Selection] 
       │
       ▼ (Rainy / Clear / Drought / Tempest / Aurora)
[Physics Layer: Local Temperature & Humidity Drift]
       │
       ▼ 
[Biology Layer: Biomass Regrowth & Vegetation Hydration]
```

### Climate Forecast Interactions
Global conditions actively shift physical properties and biological behaviors across the map:
1.  **CLEAR**: Standard baseline weather permitting stable, neutral temperature drifts.
2.  **RAINY**: Continuously floods the ecosystem with humidity, raising tile water tables, fueling rapid biological biomass growth, and spawning fresh flora.
3.  **DROUGHT**: Sky-rockets temperatures while drying global humidity to zero, restricting organic crop regrowth.
4.  **TEMPEST**: Unleashes lightning strikes across random coordinates. Strikes hit mortal camps claiming lives or structures (damaging durability), unless insulated by defensive shielding.
5.  **AURORA**: A cosmic radiation event that heightens prayer focus, accelerating natural divine devotion gains.

---

## 3. Mortal Demographics & Labor Matrix

Socio-behavioral systems translate resources directly into demographic power.

### Demographic Survival Cycle
*   **Birth Rate & Expansion**: Population grows naturally as a factor of resource stability. Tribes expand birth levels based on standard base multipliers and active fertility boosters.
*   **Consumption Rates**: Mortals consume food and energy units proportional to their population size. 
*   **Happiness Drifts**: High resource wealth feeds societal happiness up to 100%. If food supplies are strained or aggressive predators roam camp parameters, happiness drops, ultimately forcing work strikes and slowing development.

### Workforce Allocation Ratios (Target Sum = 100%)
Players can customize the exact vocational split of each society.

| Role | Operational Action | Ecosystem Outcomes |
| :--- | :--- | :--- |
| **🌾 Gatherers** | Target adjacent wild botanical and agricultural crops. | Harvests resources sequentially. Speed is affected by the gatherer allocation ratio. |
| **🏹 Hunters** | Embark on hunts targeting wild herds of herbivores in the vicinity. | Claims solid high-yield resource packets (skins, clothing, meat) on successful catches. |
| **🧪 Scholars** | Research and build spatial capacitors, thermal heat arrays, and engines. | Amplifies tech levels, accelerating infrastructure build options and passive productivity. |
| **🔮 Acolytes** | Group-meditate at Sacred Altars. | Converts human spiritual Focus directly into raw **Divine Devotion (Δ)**. |

---

## 4. Mortal Mandates & Orders

Tribal leaders can enforce holy decrees to alter society behaviors on a dime. These orders have heavy trade-offs that feed directly back into physical environment components:

1.  **🍲 Rationing Orders**
    *   *Mechanism*: Decreases food consumption levels by a massive **50%**.
    *   *Trade-off*: Decreases natural human happiness drift by 20 points over time.
2.  **⛏️ Intensive Strip-Mining**
    *   *Mechanism*: Boosts botanical resource harvesting yields to **200%**.
    *   *Trade-off*: Permanently dries out physical soil tiles (lowers humidity by 25, cooks temperature up by 8°C).
    *   *Risk of Collapse*: Heavy stripping incurs a persistent **45% chance** to permanently deplete and erase the vegetation node entirely from the map.
3.  **🩸 Ritual Tithe Offers**
    *   *Mechanism*: Consecrates raw wealth directly to the heavens, melting down **1.5 resources per second** continuously.
    *   *Reward*: Transmutes the spent material wealth directly into **+1.0 Divine Devotion speed Δ** added directly to the total pool.

---

## 5. Divine Active Interventions (Spells)

Using accumulated **Divine Devotion (Δ)**, players cast real-time local mutations on any targeted tiles in the active editor:

*   **⚡ Holy Rainfall (Cost: 30 Δ)**: Spawns dense clouds to raise local water levels, instantly hydrates parched tiles, regrows depleted vegetation, and triggers unique Golden Nano Banana sprouts.
*   **☄️ Meteor Impact (Cost: 65 Δ)**: Detonates a concentrated thermal impact. Hits flora and structures, burns away biomass, and forces immediate fleeing movements in animals/mortals.
*   **🌀 Spatial Rift Collapse (Cost: 80 Δ)**: Bends the surrounding fabric of gravity to convert physical elements into volatile dark fuel resources.

---

## 6. Divine Ascendancy & Progression Loop

Every interaction, both divine and mortal, feeds into your divine experience pool.

```
       [Mortal Actions Completing] 
 (Harvests / Hunts / Prayers / Altars / Spells)
                   │
                   ▼
  [Earn Divine Experience Points (XP)]
                   │
                   ▼
       [Divine Levels Ascent!]
                   │
                   ▼ (Unlocks)
 [1 Spark of Illumination Point Reward]
                   │
                   ▼ (Redeem)
[Unlocking Cosmic Passive Boosts & Perks]
```

### Experience Multipliers (Divine XP)
Divine Wisdom grows when the world acts:
*   **Wild Botanical Harvests**: +8 Divine XP
*   **Successful Game Hunts**: +15 Divine XP
*   **Sacred Altar Meditations**: +6 Divine XP
*   **Altar Structure Construction**: +30 Divine XP
*   **Climate Interventions (Weather changes)**: +20 to +25 Divine XP
*   **Mortal Devotion Prayers (Passive)**: Converts **15%** of all passively generated Devotion into Divine XP.

---

## 7. Master Divine Illuminations (The Perk Tree)

Players spend their earned **Sparks of Illumination** inside the Ascension hub to permanently rewrite thermodynamic laws across the planet.

### Available Masteries

*   🌱 **Celestial Dew** (*ID: growth_catalyst*)
    *   *Effect*: Accelerates plant cell division to increase wild vegetation and crop regrowth speeds by **+35%**.
*   ✨ **Astral Velocity** (*ID: feline_grace*)
    *   *Effect*: Calibrates quantum step steps globally, boosting mortal movement and pathfinding velocity by **+30%**.
*   🧪 **Cognitive Spark** (*ID: fertile_mind*)
    *   *Effect*: Sparks micro-synaptic processing, boosting global technological research rates by **+40%** across all societies.
*   💖 **Aerosol of Serenity** (*ID: infinite_joy*)
    *   *Effect*: Saturates the atmosphere with eye-safe calming ozone, permanently locking human happiness to a strict floor of **45%** (preventing collapses even under severe rationing or wolf threat).
*   🔮 **Acolyte Resonance** (*ID: tithe_transmutation*)
    *   *Effect*: Tunes sacred focus ranges, boosting global devotion generation from worship, acolytes, and tithe rituals by **+25%**.
*   🛡️ **Kinetic Shielder** (*ID: tempest_insulation*)
    *   *Effect*: Overlays global ionic deflector plates. **Shields mortals from absolute lightning casualties** during Tempest events, reduces structure damage by 3x, and amplifies energy/resource absorption of lightning strikes by 3x.
*   👥 **Generative Bliss** (*ID: mortal_abundance*)
    *   *Effect*: Adjusts bio-favorable climate ratios, raising natural birth rates and socio-demographic expansions by **+40%**.
