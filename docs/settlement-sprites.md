# Settlement & Architectural Sprites

Societies evolve their infrastructure based on their **Faith System** and **Technology Level**, visualized across all tiers.

## L0: Planetary (Global Scale)

- **Concept**: Global civilization footprint.
- **Visuals**: Night-side orbital lights, glowing network hubs indicating massive population centers.
- **Faith Influence**: Color-coded lights (Green for Animist, Amber for Interventionist, Sky Blue for Secular).

## L1: Region / Border (Macro Scale)

- **Concept**: National boundaries and macro-infrastructure.
- **Visuals**: Stylized border lines drawn on the terrain.
- **Networks**: Macro trade routes, great walls, and visible terraforming boundaries.

## L2: Settlement Cluster (Meso Scale)

- **Concept**: The overall layout, zoning, and density of a city or tribe extending across multiple tiles.
- **Tribal Phase (Tech L1)**:
  - _Visuals_: Thatched hut clusters, stone circles, organic layouts. Paths are just worn dirt.
- **Civilization Phase (Tech L2)**:
  - _Visuals_: Planned grid layouts, low stone walls, monumental faith centers, cobbled roads.
  - _Interventionist_: Gilded layouts with central massive cathedrals and marble plazas.
  - _Naturalist_: Organic sprawl integrating with dense forests; structures built directly into massive trees.
- **Age of Progress (Tech L3)**:
  - _Visuals_: Sprawling concrete blocks, centralized power grids, massive factory complexes, paved asphalt.
  - _Secular_: Chrome skyscrapers, neon commercial districts, monolithic corporate structures.
  - _Nihilist (Cults of Ruin)_: Brutalist fortresses, sacrificial arenas, spike-laden perimeter walls, rusted scrap-towers leaking toxic runoff.

### Macro-Infrastructure

- **Roads & Bridges**: Settlements autonomously generate pathfinding connections to other friendly settlements. These range from dirt trails (L1) to stone bridges (L2) to glowing mag-lev tracks (L3).
- **Schism States (Hybrids)**: If a society converts peacefully, transitional hybrid sprites appear. (e.g., An Animist-Technocracy features chrome skyscrapers aggressively overgrown with bioluminescent ivy).

## L3: Structure & Citizen (Micro Scale)

- **Concept**: Individual buildings and the sentient actors populating them.
- **Buildings**:
  - _Temples_: Steeples emitting vertical light beams, sprawling sacrificial altars, monolithic ziggurats.
  - _Industry_: Forges with smoking chimneys, river-powered watermills, neon-lit research labs emitting sparks.
  - _Housing_: Specific house variants dictated by both biome and faith (e.g., igloos for Elemental tundra, adobe for Arid regions, eco-pods for Animists).
- **Citizens (Actors)**:
  - _Visuals_: 16x16px character sprites. Attire matches faith and tech level.
  - _Variants_: Furs/leather for Tribal Animists, standardized metallic plating for Secular Technocrats, flowing golden silk for Interventionist priests, ragged chained armor for Nihilists.

## L4: Tool & Artifact (Atomic Scale)

- **Concept**: Holdable items, specific resources, animated interactions, and religious relics.
- **Resources**: Stacks of harvested lumber, ingots of processed metal, glowing mana crystals (processed Devotion reserves) sitting in stockpiles.
- **Equipment**: Citizen tools visible during work animations (stone pickaxes striking rock, holy staves glowing during prayer, industrial energy blasters during warfare).
- **Relics**: Tiny, highly detailed artifact icons used in the UI and dimensional trading menus (e.g., "The Scorched Chalice of Seed-X", "The Cybernetic Crown").

# Complete Sprite Registry & Logical Reference

Every architectural element, active character class, logistical vehicle, and piece of equipment is mathematically defined below.

## Complete Sprite Reference: Characters & Sentient Citizens

| Subject ID | Name | Sprite Sheet | Detailed Documentation |
| :--- | :--- | :--- | :--- |
| `char_ani_gatherer` | Animist Gatherer | `char-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-animist-4k-sheet.md) |
| `char_ani_woodsman` | Animist Woodsman | `char-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-animist-4k-sheet.md) |
| `char_ani_hunter` | Animist Hunter | `char-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-animist-4k-sheet.md) |
| `char_ani_beastmaster` | Animist Beastmaster | `char-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-animist-4k-sheet.md) |
| `char_ani_shaman` | Animist Shaman | `char-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-animist-4k-sheet.md) |
| `char_ani_warrior` | Animist Warrior | `char-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-animist-4k-sheet.md) |
| `char_ani_chieftain` | Animist Chieftain | `char-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-animist-4k-sheet.md) |
| `char_ani_ent` | Animist Ent (Giant) | `char-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-animist-4k-sheet.md) |
| `char_ele_mason` | Elemental Stonemason | `char-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-elemental-4k-sheet.md) |
| `char_ele_ash` | Elemental Ash-Gatherer | `char-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-elemental-4k-sheet.md) |
| `char_ele_pyro` | Elemental Pyromancer | `char-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-elemental-4k-sheet.md) |
| `char_ele_frost` | Elemental Frostguard | `char-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-elemental-4k-sheet.md) |
| `char_ele_earth` | Elemental Earth-Shaper | `char-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-elemental-4k-sheet.md) |
| `char_ele_smith` | Elemental Magma-Smith | `char-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-elemental-4k-sheet.md) |
| `char_ele_khan` | Elemental Warlord | `char-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-elemental-4k-sheet.md) |
| `char_ele_golem` | Elemental Golem | `char-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-elemental-4k-sheet.md) |
| `char_int_peasant` | Interventionist Peasant | `char-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-interventionist-4k-sheet.md) |
| `char_int_acolyte` | Interventionist Acolyte | `char-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-interventionist-4k-sheet.md) |
| `char_int_paladin` | Interventionist Paladin | `char-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-interventionist-4k-sheet.md) |
| `char_int_inquis` | Interventionist Inquisitor | `char-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-interventionist-4k-sheet.md) |
| `char_int_cleric` | Interventionist High Cleric | `char-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-interventionist-4k-sheet.md) |
| `char_int_zealot` | Interventionist Zealot | `char-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-interventionist-4k-sheet.md) |
| `char_int_choir` | Interventionist Levitating Choir | `char-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-interventionist-4k-sheet.md) |
| `char_int_angel` | Interventionist Lesser Angel | `char-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-interventionist-4k-sheet.md) |
| `char_nih_scav` | Nihilist Scavenger | `char-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-nihilist-4k-sheet.md) |
| `char_nih_butcher` | Nihilist Butcher | `char-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-nihilist-4k-sheet.md) |
| `char_nih_cultist` | Nihilist Cultist | `char-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-nihilist-4k-sheet.md) |
| `char_nih_exec` | Nihilist Executioner | `char-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-nihilist-4k-sheet.md) |
| `char_nih_plague` | Nihilist Plague-Spreader | `char-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-nihilist-4k-sheet.md) |
| `char_nih_doom` | Nihilist Doomcaller | `char-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-nihilist-4k-sheet.md) |
| `char_nih_mutant` | Nihilist Flesh-Graft Mutant | `char-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-nihilist-4k-sheet.md) |
| `char_nih_fiend` | Nihilist Abyssal Fiend | `char-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-nihilist-4k-sheet.md) |
| `char_tec_worker` | Technocrat Factory Worker | `char-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-technocrat-4k-sheet.md) |
| `char_tec_miner` | Technocrat Exo-Miner | `char-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-technocrat-4k-sheet.md) |
| `char_tec_engineer` | Technocrat Field Engineer | `char-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-technocrat-4k-sheet.md) |
| `char_tec_soldier` | Technocrat Cyber-Soldier | `char-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-technocrat-4k-sheet.md) |
| `char_tec_biker` | Technocrat Hover-Biker | `char-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-technocrat-4k-sheet.md) |
| `char_tec_droneop` | Technocrat Drone Operator | `char-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-technocrat-4k-sheet.md) |
| `char_tec_director` | Technocrat Director/CEO | `char-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-technocrat-4k-sheet.md) |
| `char_tec_mech` | Technocrat Walker Mech | `char-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/char-technocrat-4k-sheet.md) |


## Complete Sprite Reference: Buildings & Civil Structure Tiers

| Subject ID | Name | Sprite Sheet | Detailed Documentation |
| :--- | :--- | :--- | :--- |
| `bldg_ani_hut` | Animist Thatch Hut | `bldg-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-animist-4k-sheet.md) |
| `bldg_ani_firepit` | Animist Firepit | `bldg-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-animist-4k-sheet.md) |
| `bldg_ani_treehouse` | Animist Tree-House | `bldg-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-animist-4k-sheet.md) |
| `bldg_ani_grove` | Animist Farm Grove | `bldg-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-animist-4k-sheet.md) |
| `bldg_ani_heartwood` | Animist Heart-Wood Temple | `bldg-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-animist-4k-sheet.md) |
| `bldg_ani_ecopod` | Animist Eco-Pod L3 | `bldg-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-animist-4k-sheet.md) |
| `bldg_ani_synthvat` | Animist Synth-Vat L3 | `bldg-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-animist-4k-sheet.md) |
| `bldg_ani_wonder` | Animist World Tree Wonder | `bldg-animist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-animist-4k-sheet.md) |
| `bldg_ele_cave` | Elemental Cave Hab | `bldg-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-elemental-4k-sheet.md) |
| `bldg_ele_forge` | Elemental Primitive Forge | `bldg-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-elemental-4k-sheet.md) |
| `bldg_ele_totem` | Elemental Totem | `bldg-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-elemental-4k-sheet.md) |
| `bldg_ele_ziggurat` | Elemental Ziggurat | `bldg-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-elemental-4k-sheet.md) |
| `bldg_ele_foundry` | Elemental Foundry | `bldg-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-elemental-4k-sheet.md) |
| `bldg_ele_coretap` | Elemental Volcanic Core-Tap | `bldg-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-elemental-4k-sheet.md) |
| `bldg_ele_reactor` | Elemental Geo-Reactor L3 | `bldg-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-elemental-4k-sheet.md) |
| `bldg_ele_wonder` | Elemental Planet Drill | `bldg-elemental-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-elemental-4k-sheet.md) |
| `bldg_int_tent` | Interven. Canvas Tent | `bldg-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-interventionist-4k-sheet.md) |
| `bldg_int_altar` | Interven. Stone Altar | `bldg-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-interventionist-4k-sheet.md) |
| `bldg_int_manse` | Interven. Marble Manse | `bldg-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-interventionist-4k-sheet.md) |
| `bldg_int_bath` | Interven. Bathhouse | `bldg-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-interventionist-4k-sheet.md) |
| `bldg_int_cathedral` | Interven. Cathedral | `bldg-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-interventionist-4k-sheet.md) |
| `bldg_int_citadel` | Interven. Citadel-Hab L3 | `bldg-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-interventionist-4k-sheet.md) |
| `bldg_int_manafac` | Interven. Mana-Factory L3 | `bldg-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-interventionist-4k-sheet.md) |
| `bldg_int_wonder` | Interven. Avatar Gate | `bldg-interventionist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-interventionist-4k-sheet.md) |
| `bldg_nih_shack` | Nihilist Slum Shack | `bldg-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-nihilist-4k-sheet.md) |
| `bldg_nih_pyre` | Nihilist Bonfire Pyre | `bldg-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-nihilist-4k-sheet.md) |
| `bldg_nih_arena` | Nihilist Blood Arena | `bldg-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-nihilist-4k-sheet.md) |
| `bldg_nih_slaughter` | Nihilist Slaughterhouse | `bldg-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-nihilist-4k-sheet.md) |
| `bldg_nih_fort` | Nihilist Brutalist Fort | `bldg-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-nihilist-4k-sheet.md) |
| `bldg_nih_scraptower` | Nihilist Scrap-Tower L3 | `bldg-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-nihilist-4k-sheet.md) |
| `bldg_nih_factory` | Nihilist Flesh-Factory L3 | `bldg-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-nihilist-4k-sheet.md) |
| `bldg_nih_wonder` | Nihilist Ruin Engine | `bldg-nihilist-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-nihilist-4k-sheet.md) |
| `bldg_tec_depot` | Technocrat Storage Depot | `bldg-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-technocrat-4k-sheet.md) |
| `bldg_tec_well` | Technocrat Rigid Well | `bldg-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-technocrat-4k-sheet.md) |
| `bldg_tec_block` | Technocrat Concrete Block housing | `bldg-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-technocrat-4k-sheet.md) |
| `bldg_tec_mill` | Technocrat Water Mill | `bldg-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-technocrat-4k-sheet.md) |
| `bldg_tec_uni` | Technocrat University | `bldg-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-technocrat-4k-sheet.md) |
| `bldg_tec_skyscraper` | Technocrat Skyscraper L3 | `bldg-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-technocrat-4k-sheet.md) |
| `bldg_tec_forge` | Technocrat Auto-Forge L3 | `bldg-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-technocrat-4k-sheet.md) |
| `bldg_tec_wonder` | Technocrat AI Godhead | `bldg-technocrat-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-technocrat-4k-sheet.md) |
| `bldg_uni_granary` | Universal Wood Granary | `bldg-universal-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-universal-4k-sheet.md) |
| `bldg_uni_stone_silo` | Universal Stone Silo | `bldg-universal-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-universal-4k-sheet.md) |
| `bldg_uni_wall_l1` | Wooden Palisade Wall | `bldg-universal-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-universal-4k-sheet.md) |
| `bldg_uni_wall_l2` | Stone Brick Wall | `bldg-universal-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-universal-4k-sheet.md) |
| `bldg_uni_wall_l3` | Cyber Blast-Wall | `bldg-universal-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-universal-4k-sheet.md) |
| `bldg_uni_tower_l1` | Wooden Watchtower | `bldg-universal-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-universal-4k-sheet.md) |
| `bldg_uni_tower_l2` | Stone Keep Tower | `bldg-universal-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-universal-4k-sheet.md) |
| `bldg_uni_turret_l3` | Automated Plasma Turret | `bldg-universal-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/bldg-universal-4k-sheet.md) |


## Complete Sprite Reference: Logistics & Domestic Transport

| Subject ID | Name | Sprite Sheet | Detailed Documentation |
| :--- | :--- | :--- | :--- |
| `veh_mule` | Pack Mule (Beast of Burden) | `logistics-vehicles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/logistics-vehicles-4k-sheet.md) |
| `veh_wagon` | Ox-Drawn Trade Wagon | `logistics-vehicles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/logistics-vehicles-4k-sheet.md) |
| `veh_handcart` | Citizen pushing wooden Handcart | `logistics-vehicles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/logistics-vehicles-4k-sheet.md) |
| `veh_ship_galleon` | Wooden Sailing Galleon | `logistics-vehicles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/logistics-vehicles-4k-sheet.md) |
| `veh_ship_steam` | Ironclad Steamship | `logistics-vehicles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/logistics-vehicles-4k-sheet.md) |
| `veh_drone` | Hovering Trade Drone | `logistics-vehicles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/logistics-vehicles-4k-sheet.md) |
| `veh_train` | Mag-Lev Cargo Train | `logistics-vehicles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/logistics-vehicles-4k-sheet.md) |
| `veh_siege` | Wooden Catapult / Siege Engine | `logistics-vehicles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/logistics-vehicles-4k-sheet.md) |


## Complete Sprite Reference: Equipment, Weapons & Wearables

| Subject ID | Name | Sprite Sheet | Detailed Documentation |
| :--- | :--- | :--- | :--- |
| `arm_shield_wood` | Wooden Kite Shield | `equip-armor-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-armor-4k-sheet.md) |
| `arm_shield_energy` | Tech Energy Shield | `equip-armor-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-armor-4k-sheet.md) |
| `arm_helmet_iron` | Iron Great-Helm | `equip-armor-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-armor-4k-sheet.md) |
| `arm_helmet_mining` | Mining Hardhat with Lamp | `equip-armor-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-armor-4k-sheet.md) |
| `arm_visor` | Cyber-Visor Overlay | `equip-armor-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-armor-4k-sheet.md) |
| `arm_halo` | Floating Divine Halo | `equip-armor-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-armor-4k-sheet.md) |
| `arm_cloak_fur` | Heavy Fur Cloak | `equip-armor-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-armor-4k-sheet.md) |
| `arm_jetpack` | Cyber Jetpack | `equip-armor-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-armor-4k-sheet.md) |
| `weap_spear` | Wooden Spear | `equip-weapons-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-weapons-4k-sheet.md) |
| `weap_sword` | Iron Longsword | `equip-weapons-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-weapons-4k-sheet.md) |
| `weap_axe` | Stone Axe | `equip-weapons-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-weapons-4k-sheet.md) |
| `weap_rifle` | Plasma Rifle | `equip-weapons-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-weapons-4k-sheet.md) |
| `weap_staff` | Holy Glowing Staff | `equip-weapons-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-weapons-4k-sheet.md) |
| `weap_cleaver` | Rusted Meat Cleaver | `equip-weapons-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-weapons-4k-sheet.md) |
| `weap_bow` | Wooden Bow | `equip-weapons-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-weapons-4k-sheet.md) |
| `weap_pickaxe` | Heavy Iron Pickaxe | `equip-weapons-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/equip-weapons-4k-sheet.md) |

