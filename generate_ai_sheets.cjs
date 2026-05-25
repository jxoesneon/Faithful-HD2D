const fs = require('fs');
const path = require('path');

const outDir = 'docs/ai-spritesheets';
const mapFile = 'docs/sprite-mappings.json';

if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

const jsonSheets = {};
const mappings = {};

function addSheet(filename, title, description, rowsDef) {
    const sheetId = filename.replace('.md', '');
    const pngPath = `/assets/sprites/${sheetId}.svg`;
    jsonSheets[sheetId] = pngPath;
    
    let md = `# 4K Sprite Sheet: ${title}\n`;
    md += `**Dimensions**: 4096 x 4096 pixels (1:1 Ratio)\n`;
    md += `**Grid Layout**: 8x8 Cells (64 Cells total)\n`;
    md += `**Cell Size**: 512 x 512 pixels per cell\n`;
    md += `**Perspective**: Isometric (2:1 ratio)\n\n`;
    md += `*Note: Every subject represents a full animation lifecycle occupying an entire 8-frame row, ensuring 100% logic coverage across the ECS engine.*\n\n`;
    md += `${description}\n\n`;
    
    rowsDef.forEach((row, rIndex) => {
        md += `## Row ${rIndex + 1}: ${row.category} (\`${row.id}\`)\n`;
        if (row.id === "empty") {
            md += `*(Empty row reserved for future expansion)*\n\n`;
            return;
        }
        row.frames.forEach((frame, cIndex) => {
            md += `* **Cell ${cIndex},${rIndex}** [\`${frame.id}\`]: **${frame.name}** - ${frame.desc}\n`;
            mappings[`${row.id}_${frame.id}`] = { sheet: sheetId, col: cIndex, row: rIndex };
        });
        md += '\n';
    });
    
    fs.writeFileSync(path.join(outDir, filename), md);
}

const f_char = (id, desc) => ({ category: desc, id, frames: [
    { id: "idle_1", name: "Idle 1", desc: `${desc} standing, breathing in.` },
    { id: "idle_2", name: "Idle 2", desc: `${desc} standing, breathing out.` },
    { id: "walk_1", name: "Walk 1", desc: `${desc} stepping left foot forward.` },
    { id: "walk_2", name: "Walk 2", desc: `${desc} center stride.` },
    { id: "walk_3", name: "Walk 3", desc: `${desc} stepping right foot forward.` },
    { id: "act_1", name: "Action 1", desc: `${desc} winding up motion / loading.` },
    { id: "act_2", name: "Action 2", desc: `${desc} striking / interacting.` },
    { id: "death", name: "Death", desc: `${desc} collapsed on the ground lifeless.` }
]});

const f_tree = (id, desc) => ({ category: desc, id, frames: [
    { id: "sway_1", name: "Sway 1", desc: `${desc} center position.` },
    { id: "sway_2", name: "Sway 2", desc: `${desc} leaning right in wind.` },
    { id: "sway_3", name: "Sway 3", desc: `${desc} returning to center.` },
    { id: "sway_4", name: "Sway 4", desc: `${desc} leaning left in wind.` },
    { id: "hit_1", name: "Hit 1", desc: `${desc} shaking violently, dropping leaves/dust.` },
    { id: "hit_2", name: "Hit 2", desc: `${desc} leaning heavily, trunk snapping.` },
    { id: "falling", name: "Falling", desc: `${desc} falling over horizontally.` },
    { id: "stump", name: "Stump", desc: `${desc} only a cut stump remains.` }
]});

const f_crop = (id, desc) => ({ category: desc, id, frames: [
    { id: "seeded", name: "Seeded", desc: `${desc} in tilled dirt, barely visible seed.` },
    { id: "sprout", name: "Sprout", desc: `${desc} small green shoot emerging.` },
    { id: "young", name: "Young", desc: `${desc} half size, leaves unfurling.` },
    { id: "mature_1", name: "Mature 1", desc: `${desc} full size, ready, swaying left.` },
    { id: "mature_2", name: "Mature 2", desc: `${desc} full size, ready, swaying right.` },
    { id: "harvested", name: "Harvested", desc: `${desc} only stalks or roots left in dirt.` },
    { id: "withered", name: "Withered", desc: `${desc} brown, sickly, dying version.` },
    { id: "rotted", name: "Rotted", desc: `${desc} completely dead, flat decayed compost.` }
]});

const f_geo = (id, desc) => ({ category: desc, id, frames: [
    { id: "pristine_1", name: "Pristine 1", desc: `${desc} normal ambient lighting.` },
    { id: "pristine_2", name: "Pristine 2", desc: `${desc} slightly glowing / twinkling reflection.` },
    { id: "mined_1", name: "Mined 1", desc: `${desc} slightly chipped, pickaxe marks visible.` },
    { id: "mined_2", name: "Mined 2", desc: `${desc} half mined out, inner structure exposed.` },
    { id: "mined_3", name: "Mined 3", desc: `${desc} mostly rubble, chunks scattered.` },
    { id: "depleted", name: "Depleted", desc: `${desc} hollowed out base, no resources left.` },
    { id: "crumbling", name: "Crumbling", desc: `${desc} active destruction animation frame.` },
    { id: "dust", name: "Dust Decal", desc: `${desc} flat decal of dust and fragments.` }
]});

const f_bldg = (id, desc) => ({ category: desc, id, frames: [
    { id: "found", name: "Foundation", desc: `${desc} dirt outline and base stones laid.` },
    { id: "scaffold", name: "Scaffold", desc: `${desc} wooden supports, half built.` },
    { id: "idle_1", name: "Idle 1", desc: `${desc} fully built, inactive, unlit.` },
    { id: "idle_2", name: "Idle 2", desc: `${desc} fully built, subtle lighting shift.` },
    { id: "act_1", name: "Active 1", desc: `${desc} working: smoke exiting chimney or energy pulsing.` },
    { id: "act_2", name: "Active 2", desc: `${desc} working: alternate frame (wheel turned).` },
    { id: "damaged", name: "Damaged", desc: `${desc} cracked walls, small flames.` },
    { id: "ruined", name: "Ruined", desc: `${desc} collapsed rubble pile.` }
]});

const f_vfx = (id, desc) => ({ category: desc, id, frames: [
    { id: "f1", name: "Frame 1 (Start)", desc: `${desc} initial spark or gathering.` },
    { id: "f2", name: "Frame 2", desc: `${desc} expansion phase.` },
    { id: "f3", name: "Frame 3", desc: `${desc} near peak power.` },
    { id: "f4", name: "Frame 4 (Peak)", desc: `${desc} maximum size and brightness.` },
    { id: "f5", name: "Frame 5", desc: `${desc} sustained energy or cratering impact.` },
    { id: "f6", name: "Frame 6", desc: `${desc} dissipating or cooling down.` },
    { id: "f7", name: "Frame 7", desc: `${desc} trailing off, smoke/embers.` },
    { id: "f8", name: "Frame 8 (End)", desc: `${desc} final resting decal or complete fade.` }
]});

const f_equip = (id, desc) => ({ category: desc, id, frames: [
    { id: "idle_1", name: "Equip Idle 1", desc: `${desc} overlaid on resting char.` },
    { id: "idle_2", name: "Equip Idle 2", desc: `${desc} overlaid on breathing char.` },
    { id: "walk_1", name: "Equip Walk 1", desc: `${desc} bobbing down for stride.` },
    { id: "walk_2", name: "Equip Walk 2", desc: `${desc} center stride.` },
    { id: "walk_3", name: "Equip Walk 3", desc: `${desc} bobbing down opposite.` },
    { id: "act_1", name: "Equip Action 1", desc: `${desc} pulled back for strike.` },
    { id: "act_2", name: "Equip Action 2", desc: `${desc} swung forward/activated.` },
    { id: "dropped", name: "Dropped", desc: `${desc} lying abandoned on ground.` }
]});

const f_terrain = (id, desc) => ({ category: desc, id, frames: [
    { id: "base", name: "Base Tile", desc: `${desc} core isometric block.` },
    { id: "var_1", name: "Variant 1", desc: `${desc} subtle surface variation.` },
    { id: "var_2", name: "Variant 2", desc: `${desc} medium surface variation.` },
    { id: "anim_1", name: "Anim 1", desc: `${desc} active loop frame 1 (e.g., wind ripple).` },
    { id: "anim_2", name: "Anim 2", desc: `${desc} active loop frame 2.` },
    { id: "anim_3", name: "Anim 3", desc: `${desc} active loop frame 3.` },
    { id: "anim_4", name: "Anim 4", desc: `${desc} active loop frame 4.` },
    { id: "coast", name: "Coast/Edge", desc: `${desc} sloping edge blending down.` }
]});

addSheet('char-animist-4k-sheet.md', "Characters: Animist Faction", "Fully animated roster for the nature-based Animist society.", [
    f_char('char_ani_gatherer', 'Animist Gatherer'),
    f_char('char_ani_woodsman', 'Animist Woodsman'),
    f_char('char_ani_hunter', 'Animist Hunter'),
    f_char('char_ani_beastmaster', 'Animist Beastmaster'),
    f_char('char_ani_shaman', 'Animist Shaman'),
    f_char('char_ani_warrior', 'Animist Warrior'),
    f_char('char_ani_chieftain', 'Animist Chieftain'),
    f_char('char_ani_ent', 'Animist Ent (Giant)')
]);

addSheet('char-technocrat-4k-sheet.md', "Characters: Technocrat Faction", "Fully animated roster for the Secular / Technocrat society.", [
    f_char('char_tec_worker', 'Technocrat Factory Worker'),
    f_char('char_tec_miner', 'Technocrat Exo-Miner'),
    f_char('char_tec_engineer', 'Technocrat Field Engineer'),
    f_char('char_tec_soldier', 'Technocrat Cyber-Soldier'),
    f_char('char_tec_biker', 'Technocrat Hover-Biker'),
    f_char('char_tec_droneop', 'Technocrat Drone Operator'),
    f_char('char_tec_director', 'Technocrat Director/CEO'),
    f_char('char_tec_mech', 'Technocrat Walker Mech')
]);

addSheet('char-interventionist-4k-sheet.md', "Characters: Interventionist Faction", "Fully animated roster for the Divine Theocracy.", [
    f_char('char_int_peasant', 'Interventionist Peasant'),
    f_char('char_int_acolyte', 'Interventionist Acolyte'),
    f_char('char_int_paladin', 'Interventionist Paladin'),
    f_char('char_int_inquis', 'Interventionist Inquisitor'),
    f_char('char_int_cleric', 'Interventionist High Cleric'),
    f_char('char_int_zealot', 'Interventionist Zealot'),
    f_char('char_int_choir', 'Interventionist Levitating Choir'),
    f_char('char_int_angel', 'Interventionist Lesser Angel')
]);

addSheet('char-nihilist-4k-sheet.md', "Characters: Nihilist Faction", "Fully animated roster for the Cult of Ruin.", [
    f_char('char_nih_scav', 'Nihilist Scavenger'),
    f_char('char_nih_butcher', 'Nihilist Butcher'),
    f_char('char_nih_cultist', 'Nihilist Cultist'),
    f_char('char_nih_exec', 'Nihilist Executioner'),
    f_char('char_nih_plague', 'Nihilist Plague-Spreader'),
    f_char('char_nih_doom', 'Nihilist Doomcaller'),
    f_char('char_nih_mutant', 'Nihilist Flesh-Graft Mutant'),
    f_char('char_nih_fiend', 'Nihilist Abyssal Fiend')
]);

addSheet('char-elemental-4k-sheet.md', "Characters: Elemental Faction", "Fully animated roster for the Primal/Geomantic faction.", [
    f_char('char_ele_mason', 'Elemental Stonemason'),
    f_char('char_ele_ash', 'Elemental Ash-Gatherer'),
    f_char('char_ele_pyro', 'Elemental Pyromancer'),
    f_char('char_ele_frost', 'Elemental Frostguard'),
    f_char('char_ele_earth', 'Elemental Earth-Shaper'),
    f_char('char_ele_smith', 'Elemental Magma-Smith'),
    f_char('char_ele_khan', 'Elemental Warlord'),
    f_char('char_ele_golem', 'Elemental Golem')
]);

addSheet('bldg-animist-4k-sheet.md', "Buildings: Animist", "Construction and active states for Animist buildings.", [
    f_bldg('bldg_ani_hut', 'Animist Thatch Hut'),
    f_bldg('bldg_ani_firepit', 'Animist Firepit'),
    f_bldg('bldg_ani_treehouse', 'Animist Tree-House'),
    f_bldg('bldg_ani_grove', 'Animist Farm Grove'),
    f_bldg('bldg_ani_heartwood', 'Animist Heart-Wood Temple'),
    f_bldg('bldg_ani_ecopod', 'Animist Eco-Pod L3'),
    f_bldg('bldg_ani_synthvat', 'Animist Synth-Vat L3'),
    f_bldg('bldg_ani_wonder', 'Animist World Tree Wonder')
]);

addSheet('bldg-technocrat-4k-sheet.md', "Buildings: Technocrat", "Construction and active states for Technocrat buildings.", [
    f_bldg('bldg_tec_depot', 'Technocrat Storage Depot'),
    f_bldg('bldg_tec_well', 'Technocrat Rigid Well'),
    f_bldg('bldg_tec_block', 'Technocrat Concrete Block housing'),
    f_bldg('bldg_tec_mill', 'Technocrat Water Mill'),
    f_bldg('bldg_tec_uni', 'Technocrat University'),
    f_bldg('bldg_tec_skyscraper', 'Technocrat Skyscraper L3'),
    f_bldg('bldg_tec_forge', 'Technocrat Auto-Forge L3'),
    f_bldg('bldg_tec_wonder', 'Technocrat AI Godhead')
]);

addSheet('bldg-interventionist-4k-sheet.md', "Buildings: Interventionist", "Construction and active states for Theocracy buildings.", [
    f_bldg('bldg_int_tent', 'Interven. Canvas Tent'),
    f_bldg('bldg_int_altar', 'Interven. Stone Altar'),
    f_bldg('bldg_int_manse', 'Interven. Marble Manse'),
    f_bldg('bldg_int_bath', 'Interven. Bathhouse'),
    f_bldg('bldg_int_cathedral', 'Interven. Cathedral'),
    f_bldg('bldg_int_citadel', 'Interven. Citadel-Hab L3'),
    f_bldg('bldg_int_manafac', 'Interven. Mana-Factory L3'),
    f_bldg('bldg_int_wonder', 'Interven. Avatar Gate')
]);

addSheet('bldg-elemental-4k-sheet.md', "Buildings: Elemental", "Construction and active states for Elemental buildings.", [
    f_bldg('bldg_ele_cave', 'Elemental Cave Hab'),
    f_bldg('bldg_ele_forge', 'Elemental Primitive Forge'),
    f_bldg('bldg_ele_totem', 'Elemental Totem'),
    f_bldg('bldg_ele_ziggurat', 'Elemental Ziggurat'),
    f_bldg('bldg_ele_foundry', 'Elemental Foundry'),
    f_bldg('bldg_ele_coretap', 'Elemental Volcanic Core-Tap'),
    f_bldg('bldg_ele_reactor', 'Elemental Geo-Reactor L3'),
    f_bldg('bldg_ele_wonder', 'Elemental Planet Drill')
]);

addSheet('bldg-nihilist-4k-sheet.md', "Buildings: Nihilist", "Construction and active states for Nihilist Cult buildings.", [
    f_bldg('bldg_nih_shack', 'Nihilist Slum Shack'),
    f_bldg('bldg_nih_pyre', 'Nihilist Bonfire Pyre'),
    f_bldg('bldg_nih_arena', 'Nihilist Blood Arena'),
    f_bldg('bldg_nih_slaughter', 'Nihilist Slaughterhouse'),
    f_bldg('bldg_nih_fort', 'Nihilist Brutalist Fort'),
    f_bldg('bldg_nih_scraptower', 'Nihilist Scrap-Tower L3'),
    f_bldg('bldg_nih_factory', 'Nihilist Flesh-Factory L3'),
    f_bldg('bldg_nih_wonder', 'Nihilist Ruin Engine')
]);

addSheet('bldg-universal-4k-sheet.md', "Buildings: Universal & Defenses", "Construction and active states for shared structures.", [
    f_bldg('bldg_uni_granary', 'Universal Wood Granary'),
    f_bldg('bldg_uni_stone_silo', 'Universal Stone Silo'),
    f_bldg('bldg_uni_wall_l1', 'Wooden Palisade Wall'),
    f_bldg('bldg_uni_wall_l2', 'Stone Brick Wall'),
    f_bldg('bldg_uni_wall_l3', 'Cyber Blast-Wall'),
    f_bldg('bldg_uni_tower_l1', 'Wooden Watchtower'),
    f_bldg('bldg_uni_tower_l2', 'Stone Keep Tower'),
    f_bldg('bldg_uni_turret_l3', 'Automated Plasma Turret')
]);

addSheet('flora-trees-4k-sheet.md', "Flora: Trees", "Full animation cycles for standard trees.", [
    f_tree('tree_oak_sum', 'Oak Tree (Summer)'),
    f_tree('tree_oak_aut', 'Oak Tree (Autumn)'),
    f_tree('tree_birch', 'Birch Tree'),
    f_tree('tree_willow', 'Weeping Willow'),
    f_tree('tree_pine', 'Pine Tree'),
    f_tree('tree_spruce', 'Spruce Tree'),
    f_tree('tree_cactus', 'Giant Saguaro Cactus'),
    f_tree('tree_dead', 'Dead Lifeless Tree')
]);

addSheet('flora-exotic-4k-sheet.md', "Flora: Faith Mutated", "Animations for rare/alien flora.", [
    f_tree('tree_ani_mother', 'Animist Glowing Mother-Tree'),
    f_tree('tree_glow_shroom', 'Giant Bioluminescent Mushroom'),
    f_tree('tree_ele_obsidian', 'Elemental Obsidian Thorn-Tree'),
    f_tree('tree_ele_magma', 'Elemental Magma-Root Tree'),
    f_tree('tree_tec_cyber', 'Secular Cyber-Flora'),
    f_tree('tree_nih_flesh', 'Nihilist Flesh-Weed Mound'),
    f_tree('tree_void_lotus', 'Hovering Void Lotus'),
    f_tree('tree_crystal', 'Resonant Crystal Tree')
]);

addSheet('flora-crops-4k-sheet.md', "Flora: Crops & Agriculture", "Full growth and harvest cycles for crops.", [
    f_crop('crop_wheat', 'Wheat Field'),
    f_crop('crop_corn', 'Corn Stalks'),
    f_crop('crop_potato', 'Root Crop (Potato)'),
    f_crop('crop_rice', 'Rice Paddy'),
    f_crop('crop_ani_mana', 'Animist Mana-Fruit'),
    f_crop('crop_int_sun', 'Interventionist Sun-Wheat'),
    f_crop('crop_tec_algae', 'Technocrat Algae Vat'),
    f_crop('crop_nih_blood', 'Nihilist Blood-Vines')
]);

addSheet('geo-base-4k-sheet.md', "Geology: Base Formations", "Formations and extraction phases.", [
    f_geo('geo_granite', 'Granite Boulder Cluster'),
    f_geo('geo_limestone', 'Limestone Outcropping'),
    f_geo('geo_sandstone', 'Sandstone Pillar'),
    f_geo('geo_obsidian', 'Obsidian Shards'),
    f_geo('geo_ice', 'Ice Boulder'),
    f_geo('geo_cave_stalag', 'Cave Stalagmite'),
    f_geo('geo_fossil', 'Ancient Fossilized Bones'),
    f_geo('geo_oil', 'Oil Seep / Tar Pit')
]);

addSheet('geo-minerals-4k-sheet.md', "Geology: Precious Minerals", "Valuable ores and their extraction phases.", [
    f_geo('ore_coal', 'Coal Node'),
    f_geo('ore_iron', 'Iron Ore Node'),
    f_geo('ore_copper', 'Copper Ore Node'),
    f_geo('ore_gold', 'Gold Vein'),
    f_geo('ore_diamond', 'Diamond Cluster'),
    f_geo('ore_uranium', 'Radioactive Uranium Node'),
    f_geo('ore_divine', 'Divine Faith Quartz'),
    f_geo('ore_void', 'Nihilist Void-Stone')
]);

addSheet('terrain-standard-4k-sheet.md', "Terrain: Standard & Water", "Base terrain tiles with procedural variation and coastal animations.", [
    f_terrain('tile_grass', 'Verdant Grass'),
    f_terrain('tile_dirt', 'Brown Dirt / Path'),
    f_terrain('tile_sand', 'Desert Sand'),
    f_terrain('tile_snow', 'Tundra Snow'),
    f_terrain('tile_water_shallow', 'Shallow Water'),
    f_terrain('tile_water_deep', 'Deep Ocean Water'),
    f_terrain('tile_lava', 'Volcanic Magma Flow'),
    f_terrain('tile_toxic', 'Blighted Toxic Sludge')
]);

addSheet('vfx-miracles-4k-sheet.md', "VFX: Miracles", "8-frame progression for divine interventions.", [
    f_vfx('vfx_heal', 'Healing Pulse Ring'),
    f_vfx('vfx_holy_beam', 'Descending Holy Light Beam'),
    f_vfx('vfx_genesis', 'Genesis Nature Bloom'),
    f_vfx('vfx_rain', 'Soothing Rainfall'),
    f_vfx('vfx_ascend', 'Ascension Tractor Beam'),
    f_vfx('vfx_shield', 'Divine Energy Shield Bubble'),
    f_vfx('vfx_bless_aura', 'Blessed Golden Ground Aura'),
    f_vfx('vfx_convert', 'Faith Conversion Color Wave')
]);

addSheet('vfx-disasters-4k-sheet.md', "VFX: Disasters & Combat", "8-frame progression for destruction.", [
    f_vfx('vfx_meteor', 'Meteor Strike & Explosion'),
    f_vfx('vfx_earthquake', 'Earthquake Fissure Tear'),
    f_vfx('vfx_lightning', 'Lightning Bolt Strike'),
    f_vfx('vfx_plague', 'Plague Cloud / Miasma'),
    f_vfx('vfx_abyss_rift', 'Abyssal Void Tear'),
    f_vfx('vfx_sparks', 'Combat Clashing Sparks'),
    f_vfx('vfx_blood', 'Combat Blood Spatter'),
    f_vfx('vfx_glitch', 'Cyber-Glitch Damage')
]);

addSheet('equip-weapons-4k-sheet.md', "Equipment: Weapons", "Wieldable weapons animated to match character frames.", [
    f_equip('weap_spear', 'Wooden Spear'),
    f_equip('weap_sword', 'Iron Longsword'),
    f_equip('weap_axe', 'Stone Axe'),
    f_equip('weap_rifle', 'Plasma Rifle'),
    f_equip('weap_staff', 'Holy Glowing Staff'),
    f_equip('weap_cleaver', 'Rusted Meat Cleaver'),
    f_equip('weap_bow', 'Wooden Bow'),
    f_equip('weap_pickaxe', 'Heavy Iron Pickaxe')
]);

addSheet('equip-armor-4k-sheet.md', "Equipment: Armor & Wearables", "Wearable armor and shields matching character frames.", [
    f_equip('arm_shield_wood', 'Wooden Kite Shield'),
    f_equip('arm_shield_energy', 'Tech Energy Shield'),
    f_equip('arm_helmet_iron', 'Iron Great-Helm'),
    f_equip('arm_helmet_mining', 'Mining Hardhat with Lamp'),
    f_equip('arm_visor', 'Cyber-Visor Overlay'),
    f_equip('arm_halo', 'Floating Divine Halo'),
    f_equip('arm_cloak_fur', 'Heavy Fur Cloak'),
    f_equip('arm_jetpack', 'Cyber Jetpack')
]);

addSheet('logistics-vehicles-4k-sheet.md', "Logistics: Vehicles & Animals", "Fully animated logistics units.", [
    f_char('veh_mule', 'Pack Mule (Beast of Burden)'),
    f_char('veh_wagon', 'Ox-Drawn Trade Wagon'),
    f_char('veh_handcart', 'Citizen pushing wooden Handcart'),
    f_char('veh_ship_galleon', 'Wooden Sailing Galleon'),
    f_char('veh_ship_steam', 'Ironclad Steamship'),
    f_char('veh_drone', 'Hovering Trade Drone'),
    f_char('veh_train', 'Mag-Lev Cargo Train'),
    f_char('veh_siege', 'Wooden Catapult / Siege Engine')
]);

addSheet('fauna-wild-4k-sheet.md', "Fauna: Wild & Domestic", "Animated animals traversing ecosystems.", [
    f_char('fauna_wolf', 'Wild Predator (Wolf)'),
    f_char('fauna_deer', 'Wild Prey (Stag)'),
    f_char('fauna_cow', 'Domestic Livestock (Cow)'),
    f_char('fauna_sheep', 'Domestic Livestock (Sheep)'),
    f_char('fauna_bird', 'Flying Bird of Prey (Falcon)'),
    f_char('fauna_fish', 'Swimming Fish School'),
    f_char('fauna_whale', 'Massive Sea Monster / Whale'),
    f_char('fauna_locust', 'Swarm of Devouring Locusts')
]);


addSheet('nano-banana-4k-sheet.md', "Flora: Nano Banana 2", "Incredible procedurally generated high-fidelity banana variants using the Nano Banana 2 system.", [
    f_char('banana_gold', 'Golden Nano Banana'),
    f_char('banana_cyber', 'Electric Cyber Banana'),
    f_char('banana_void', 'Holographic Void Banana'),
    f_char('banana_divine', 'Holy Divine Banana'),
    f_char('banana_fire', 'Pyromaniac Fire Banana'),
    f_char('banana_frost', 'Glacial Frost Banana'),
    f_char('banana_toxic', 'Radioactive Mutated Banana'),
    f_char('banana_cosmic', 'Deep Cosmic Elder Banana')
]);


const outJson = {
    sheets: jsonSheets,
    config: {
        size: 4096,
        columns: 8,
        rows: 8,
        cellSize: 512
    },
    mappings: mappings
};

fs.writeFileSync(mapFile, JSON.stringify(outJson, null, 2));
