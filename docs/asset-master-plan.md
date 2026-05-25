# Consolidated Asset Master Plan

This document categorizes all project assets for **Faithful** into two pipelines: **Kinematic (High Motion)** and **Consolidated (Static/Low Frame)**.

---

## 🔴 Pipeline A: Kinematic (PENDING)
These assets require complex character identity locking and vigorous motion across 16+ frames. They will be processed using the **Single-Frame Identity Anchor Pipeline**.

| Asset Group | Description | Frames Required | Status |
| :--- | :--- | :--- | :--- |
| **Animist Faction** | Gatherer, Woodsman, Hunter, Beastmaster, Shaman, Warrior, Chieftain, Ent. | Walk, Run, Act, Death (32+ frames ea) | **PENDING** |
| **Technocrat Faction** | Worker, Miner, Engineer, Soldier, Biker, DroneOp, CEO, Mech. | Walk, Run, Act, Death (32+ frames ea) | **PENDING** |
| **Interventionist** | Peasant, Acolyte, Paladin, Inquisitor, Cleric, Zealot, Choir, Angel. | Walk, Run, Act, Death (32+ frames ea) | **PENDING** |
| **Nihilist Faction** | Scavenger, Butcher, Cultist, Exec, Plague, Doom, Mutant, Fiend. | Walk, Run, Act, Death (32+ frames ea) | **PENDING** |
| **Elemental Faction** | Mason, Ash, Pyro, Frost, Earth, Smith, Khan, Golem. | Walk, Run, Act, Death (32+ frames ea) | **PENDING** |
| **Fauna** | Wild beasts and companion animals. | Walk, Act, Death | **PENDING** |

---

## 🟢 Pipeline B: Consolidated (ACTIVE BATCH)
These assets are static or have minor secondary animations (sway, pulse, flicker). We will batch generate them into unified 4x4 sheets to maximize API efficiency.

| Asset Group | Content | Optimization Strategy | Status |
| :--- | :--- | :--- | :--- |
| **Buildings** | Huts, Depots, Wells, Groves, Shrines, Wonders. | Consolidated 4x4 sheets per faction. | **READY** |
| **Flora** | Trees, Crops, Exotic Bio-luminescent plants. | Consolidated 4x4 sheets by category. | **READY** |
| **Geography** | Minerals, Ores, Base terrain features. | Single 4x4 sheet for all geological assets. | **READY** |
| **Logistics** | Non-character vehicles and storage units. | Single 4x4 sheet. | **READY** |
| **Equipment** | Swords, Bows, Armor sets, Relics. | Multi-asset icon sheets. | **READY** |
| **VFX** | Miracles (Holy Rain) and Disasters (Meteor). | 4-frame animation loops. | **READY** |

---

## ⚡ Batch Generation Queue (Phase 1)
We will now execute the generation of the following consolidated sheets:
1. `bldg-animist-4k-sheet`: All Animist structures.
2. `flora-trees-4k-sheet`: Standard and Exotic trees.
3. `geo-minerals-4k-sheet`: All minable resources.

**API Rate Limit Strategy:**
- 3 requests per batch.
- 15-second cooldown between API calls.
- Total expected generation time: < 2 minutes.
