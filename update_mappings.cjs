const fs = require('fs');

const mappingsFile = 'docs/sprite-mappings.json';
const data = JSON.parse(fs.readFileSync(mappingsFile, 'utf8'));

// Add new sheets
data.sheets.flora_and_crops = "/assets/sprites/flora-and-crops-4k-sheet.png";
data.sheets.geology_and_minerals = "/assets/sprites/geology-and-minerals-4k-sheet.png";
data.sheets.characters_and_equipment = "/assets/sprites/characters-and-equipment-4k-sheet.png";

// Helper to bulk add mappings for a new sheet
function bulkAdd(prefix, sheetName, rows) {
    rows.forEach((row, rIndex) => {
        row.forEach((itemName, cIndex) => {
            if (itemName) {
                data.mappings[`${prefix}_${itemName}`] = { sheet: sheetName, col: cIndex, row: rIndex };
            }
        });
    });
}

// Flora mappings
bulkAdd('flora', 'flora_and_crops', [
    ['oak_summer', 'oak_autumn', 'maple', 'birch', 'willow', 'cherry', 'elm', 'dead_tree'],
    ['pine', 'snow_pine', 'spruce', 'baobab', 'saguaro', 'barrel_cactus', 'palm', 'joshua'],
    ['animist_mother', 'glow_shroom_cyan', 'glow_shroom_gold', 'obsidian_thorn', 'magma_root', 'cyber_flora', 'flesh_weed', 'void_lotus'],
    ['wheat_sprout', 'wheat_mature', 'corn', 'potato', 'berry_bush', 'grape_vines', 'cabbage', 'rice_paddy'],
    ['mana_fruit', 'sun_wheat', 'ash_tubers', 'nutrient_vats', 'blood_vines', 'sacred_lotus', 'crystal_sprouts', 'synth_corn'],
    ['fern', 'ivy', 'thorn', 'tumbleweed', 'moss', 'tall_grass', 'wildflowers', 'glowing_spores'],
    ['kelp', 'coral_red', 'coral_brain', 'sea_anemone', 'lily_pads', 'cattails', 'biolum_algae', 'sea_vent'],
    ['stump', 'burned_tree', 'harvested_field', 'withered_crop', 'fallen_log', 'wood_pile', 'smashed_pumpkin', 'uprooted_tree']
]);

// Geology mappings
bulkAdd('geo', 'geology_and_minerals', [
    ['granite', 'limestone', 'sandstone', 'slate', 'mossy_rock', 'river_rocks', 'gravel', 'archway'],
    ['obsidian', 'basalt', 'pumice', 'magma_node', 'crater', 'sulfur_vent', 'ash_mound', 'cooled_lava'],
    ['ice_boulder', 'glacial_spire', 'permafrost', 'frozen_geode', 'snow_rock', 'black_ice', 'cryo_vent', 'shattered_floe'],
    ['gold_vein', 'silver_vein', 'diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'meteoritic_iron'],
    ['coal', 'iron_ore', 'copper_ore', 'uranium', 'bauxite', 'oil_seep', 'salt_flat', 'clay_deposit'],
    ['animist_stone', 'divine_quartz', 'tech_shard', 'void_stone', 'mana_geyser', 'floating_rock', 'leyline_nexus', 'blood_pearl'],
    ['stalactite', 'stalagmite', 'cave_column', 'cave_entrance', 'cave_wall', 'mined_wall', 'fungus_wall', 'cave_pool'],
    ['fossil', 'petrified_wood', 'alien_artefact', 'depleted_node', 'depleted_oil', 'sinkhole', 'excavation', 'craterscape']
]);

// Characters mappings
bulkAdd('char', 'characters_and_equipment', [
    ['animist_gatherer', 'animist_woodsman', 'animist_hunter', 'animist_beastmaster', 'animist_shaman', 'animist_warrior', 'animist_chieftain', 'animist_ent'],
    ['tech_worker', 'tech_miner', 'tech_engineer', 'tech_soldier', 'tech_biker', 'tech_drone_op', 'tech_director', 'tech_mech'],
    ['inter_peasant', 'inter_acolyte', 'inter_paladin', 'inter_inquisitor', 'inter_cleric', 'inter_zealot', 'inter_choir', 'inter_angel'],
    ['nihil_scavenger', 'nihil_butcher', 'nihil_cultist', 'nihil_executioner', 'nihil_plague', 'nihil_doomcaller', 'nihil_mutant', 'nihil_fiend'],
    ['elem_stonemason', 'elem_ash', 'elem_pyro', 'elem_frostguard', 'elem_earthshaper', 'elem_magmasmith', 'elem_warlord', 'elem_golem'],
    ['equip_spear', 'equip_sword', 'equip_rifle', 'equip_pickaxe', 'equip_staff', 'equip_cleaver', 'equip_shield_wood', 'equip_shield_energy'],
    ['armor_skull', 'armor_hardhat', 'armor_greathelm', 'armor_hood', 'armor_visor', 'armor_halo', 'armor_fur', 'armor_jetpack'],
    ['corpse_fur', 'corpse_armor', 'corpse_tech', 'corpse_skeleton', 'corpse_ash', 'corpse_frozen', 'corpse_gore', 'corpse_angel']
]);

fs.writeFileSync(mappingsFile, JSON.stringify(data, null, 2));
