# Terrain & Biome Sprites

Terrain in Faithful is rendered procedurally, with visual representation changing based on the current simulation scale (L0 - L4).

## L0: Planetary (Global Scale)

- **Concept**: A unified sphere representing global climates.
- **Visuals**: Low-resolution procedural sphere shaders.
- **Biomes**: Interpolated color gradients representing broad climate zones (e.g., green for verdant, white for polar, brown for arid).
- **Overlays**: Heat maps, tectonic fault lines, and global moisture overlays.

## L1: Region (Macro Scale)

- **Concept**: Large-scale landmasses and geographic features.
- **Visuals**: Seamless texture blending across chunks (e.g., 64x64 groups of tiles).
- **Features**: River networks, massive mountain ranges, and continental shelves.
- **Transitions**: Smooth gradient masks between biome types (e.g., Lush Forest fading into Arid Wasteland).

## L2: Tile (Meso Scale)

- **Concept**: The standard isometric grid (64x32 base tiles) composing the interactive terrain.
- **The Verdant Rift (Green Faith)**: Lush grass, thick moss patches, varied emerald shades.
- **Volcanic Desolation (Elementalism)**: Dark obsidian rock, glowing magma veins, cracked basalt.
- **Glacial Tundra (Elementalism)**: Cracked ice with subsurface cerulean scattering, frosted snow drifts.
- **Arid Wasteland**: Rippled sand dunes, cracked dry earth.
- **Industrial Blight (Secular Technocracy)**: Concrete slabs, rusted metal grating, polluted sludge channels.
- **Blighted Ruin (Nihilism)**: Charred, ashen earth, bone-yards, and cracked tiles leaking crimson vapor.

### Edge Transitions & Morphing (L2 Auto-Tiling)

Tiles do not abruptly swap; the engine supports 16-way auto-tiling masks for smooth borders:

- **Coastlines**: Shallow water tiles featuring dynamic foam edge sprites blending into sand, mud, or rock faces.
- **Cliffs / Elevation**: Tiles with differing `z-heights` render distinct vertical faces (e.g., exposed dirt struts for grassy hills, sheared obsidian for volcanic cliffs).
- **Corruption Bleed**: When faith shifts aggressively, dominant biomes "creep" by rendering translucent overlay sprites (e.g., Technocratic steel veins sprawling over Verdant grass).

## L3: Prop (Micro Scale)

- **Concept**: Interactive organic and inorganic structures rooted to tiles.
- **Flora**: Deciduous trees, bioluminescent mushrooms, mutated scrub brush, giant cacti, sprawling weeping willows.
- **Geology**: Boulders, stalagmites, exposed fossil beds, active geysers, mineral nodes.
- **Dynamic States**: Props change based on simulation seasons or global events:
  - _Day/Night_: Trees cast elongated shadows; bioluminescence blooms at night.
  - _Seasonal_: Deciduous flora cycles through Green -> Amber (Autumn) -> Bare (Winter).

## L4: Material / Particle (Atomic Scale)

- **Concept**: Smallest visual units comprising the terrain & physical reactions.
- **Particles**: Falling leaves in autumn, blowing sand dust in deserts, volcanic ash flakes, localized rain flurries.
- **Destruction & Decals**: When a tile is struck by a miracle/disaster, L4 decals are applied permanently (e.g., Crumbled stone debris, crater scorch marks, splintered wood remnants).

# Complete Sprite Registry & Ecological Reference

Every procedurally generated tile type, organic prop variant, resource node, and animal lifeform is mathematically defined below.

## Complete Sprite Reference: Ecology, Crops & Botanical Variants

| Subject ID | Name | Sprite Sheet | Detailed Documentation |
| :--- | :--- | :--- | :--- |
| `crop_wheat` | Wheat Field | `flora-crops-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-crops-4k-sheet.md) |
| `crop_corn` | Corn Stalks | `flora-crops-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-crops-4k-sheet.md) |
| `crop_potato` | Root Crop (Potato) | `flora-crops-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-crops-4k-sheet.md) |
| `crop_rice` | Rice Paddy | `flora-crops-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-crops-4k-sheet.md) |
| `crop_ani_mana` | Animist Mana-Fruit | `flora-crops-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-crops-4k-sheet.md) |
| `crop_int_sun` | Interventionist Sun-Wheat | `flora-crops-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-crops-4k-sheet.md) |
| `crop_tec_algae` | Technocrat Algae Vat | `flora-crops-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-crops-4k-sheet.md) |
| `crop_nih_blood` | Nihilist Blood-Vines | `flora-crops-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-crops-4k-sheet.md) |
| `tree_ani_mother` | Animist Glowing Mother-Tree | `flora-exotic-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-exotic-4k-sheet.md) |
| `tree_glow_shroom` | Giant Bioluminescent Mushroom | `flora-exotic-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-exotic-4k-sheet.md) |
| `tree_ele_obsidian` | Elemental Obsidian Thorn-Tree | `flora-exotic-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-exotic-4k-sheet.md) |
| `tree_ele_magma` | Elemental Magma-Root Tree | `flora-exotic-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-exotic-4k-sheet.md) |
| `tree_tec_cyber` | Secular Cyber-Flora | `flora-exotic-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-exotic-4k-sheet.md) |
| `tree_nih_flesh` | Nihilist Flesh-Weed Mound | `flora-exotic-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-exotic-4k-sheet.md) |
| `tree_void_lotus` | Hovering Void Lotus | `flora-exotic-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-exotic-4k-sheet.md) |
| `tree_crystal` | Resonant Crystal Tree | `flora-exotic-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-exotic-4k-sheet.md) |
| `tree_oak_sum` | Oak Tree (Summer) | `flora-trees-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-trees-4k-sheet.md) |
| `tree_oak_aut` | Oak Tree (Autumn) | `flora-trees-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-trees-4k-sheet.md) |
| `tree_birch` | Birch Tree | `flora-trees-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-trees-4k-sheet.md) |
| `tree_willow` | Weeping Willow | `flora-trees-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-trees-4k-sheet.md) |
| `tree_pine` | Pine Tree | `flora-trees-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-trees-4k-sheet.md) |
| `tree_spruce` | Spruce Tree | `flora-trees-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-trees-4k-sheet.md) |
| `tree_cactus` | Giant Saguaro Cactus | `flora-trees-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-trees-4k-sheet.md) |
| `tree_dead` | Dead Lifeless Tree | `flora-trees-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/flora-trees-4k-sheet.md) |
| `banana_gold` | Golden Nano Banana | `nano-banana-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/nano-banana-4k-sheet.md) |
| `banana_cyber` | Electric Cyber Banana | `nano-banana-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/nano-banana-4k-sheet.md) |
| `banana_void` | Holographic Void Banana | `nano-banana-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/nano-banana-4k-sheet.md) |
| `banana_divine` | Holy Divine Banana | `nano-banana-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/nano-banana-4k-sheet.md) |
| `banana_fire` | Pyromaniac Fire Banana | `nano-banana-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/nano-banana-4k-sheet.md) |
| `banana_frost` | Glacial Frost Banana | `nano-banana-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/nano-banana-4k-sheet.md) |
| `banana_toxic` | Radioactive Mutated Banana | `nano-banana-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/nano-banana-4k-sheet.md) |
| `banana_cosmic` | Deep Cosmic Elder Banana | `nano-banana-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/nano-banana-4k-sheet.md) |


## Complete Sprite Reference: Geological Formations & Precious Ores

| Subject ID | Name | Sprite Sheet | Detailed Documentation |
| :--- | :--- | :--- | :--- |
| `geo_granite` | Granite Boulder Cluster | `geo-base-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-base-4k-sheet.md) |
| `geo_limestone` | Limestone Outcropping | `geo-base-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-base-4k-sheet.md) |
| `geo_sandstone` | Sandstone Pillar | `geo-base-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-base-4k-sheet.md) |
| `geo_obsidian` | Obsidian Shards | `geo-base-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-base-4k-sheet.md) |
| `geo_ice` | Ice Boulder | `geo-base-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-base-4k-sheet.md) |
| `geo_cave_stalag` | Cave Stalagmite | `geo-base-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-base-4k-sheet.md) |
| `geo_fossil` | Ancient Fossilized Bones | `geo-base-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-base-4k-sheet.md) |
| `geo_oil` | Oil Seep / Tar Pit | `geo-base-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-base-4k-sheet.md) |
| `ore_coal` | Coal Node | `geo-minerals-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-minerals-4k-sheet.md) |
| `ore_iron` | Iron Ore Node | `geo-minerals-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-minerals-4k-sheet.md) |
| `ore_copper` | Copper Ore Node | `geo-minerals-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-minerals-4k-sheet.md) |
| `ore_gold` | Gold Vein | `geo-minerals-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-minerals-4k-sheet.md) |
| `ore_diamond` | Diamond Cluster | `geo-minerals-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-minerals-4k-sheet.md) |
| `ore_uranium` | Radioactive Uranium Node | `geo-minerals-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-minerals-4k-sheet.md) |
| `ore_divine` | Divine Faith Quartz | `geo-minerals-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-minerals-4k-sheet.md) |
| `ore_void` | Nihilist Void-Stone | `geo-minerals-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/geo-minerals-4k-sheet.md) |


## Complete Sprite Reference: Procedural Terrain Tiles

| Subject ID | Name | Sprite Sheet | Detailed Documentation |
| :--- | :--- | :--- | :--- |
| `tile_grass` | Verdant Grass | `terrain-standard-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/terrain-standard-4k-sheet.md) |
| `tile_dirt` | Brown Dirt / Path | `terrain-standard-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/terrain-standard-4k-sheet.md) |
| `tile_sand` | Desert Sand | `terrain-standard-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/terrain-standard-4k-sheet.md) |
| `tile_snow` | Tundra Snow | `terrain-standard-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/terrain-standard-4k-sheet.md) |
| `tile_water_shallow` | Shallow Water | `terrain-standard-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/terrain-standard-4k-sheet.md) |
| `tile_water_deep` | Deep Ocean Water | `terrain-standard-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/terrain-standard-4k-sheet.md) |
| `tile_lava` | Volcanic Magma Flow | `terrain-standard-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/terrain-standard-4k-sheet.md) |
| `tile_toxic` | Blighted Toxic Sludge | `terrain-standard-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/terrain-standard-4k-sheet.md) |


## Complete Sprite Reference: Ecosystem Fauna

| Subject ID | Name | Sprite Sheet | Detailed Documentation |
| :--- | :--- | :--- | :--- |
| `fauna_wolf` | Wild Predator (Wolf) | `fauna-wild-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/fauna-wild-4k-sheet.md) |
| `fauna_deer` | Wild Prey (Stag) | `fauna-wild-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/fauna-wild-4k-sheet.md) |
| `fauna_cow` | Domestic Livestock (Cow) | `fauna-wild-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/fauna-wild-4k-sheet.md) |
| `fauna_sheep` | Domestic Livestock (Sheep) | `fauna-wild-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/fauna-wild-4k-sheet.md) |
| `fauna_bird` | Flying Bird of Prey (Falcon) | `fauna-wild-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/fauna-wild-4k-sheet.md) |
| `fauna_fish` | Swimming Fish School | `fauna-wild-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/fauna-wild-4k-sheet.md) |
| `fauna_whale` | Massive Sea Monster / Whale | `fauna-wild-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/fauna-wild-4k-sheet.md) |
| `fauna_locust` | Swarm of Devouring Locusts | `fauna-wild-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/fauna-wild-4k-sheet.md) |

