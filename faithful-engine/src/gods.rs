use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use crate::types::*;
use crate::ecs::ECS;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum GodId {
    #[serde(rename = "sylphra")]
    Sylphra,
    #[serde(rename = "vulcanus")]
    Vulcanus,
    #[serde(rename = "thalassor")]
    Thalassor,
    #[serde(rename = "xylorex")]
    Xylorex,
    #[serde(rename = "aethelgard")]
    Aethelgard,
    #[serde(rename = "null_v8")]
    NullV8,
    #[serde(rename = "krigor")]
    Krigor,
}

impl GodId {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "sylphra" => Some(Self::Sylphra),
            "vulcanus" => Some(Self::Vulcanus),
            "thalassor" => Some(Self::Thalassor),
            "xylorex" => Some(Self::Xylorex),
            "aethelgard" => Some(Self::Aethelgard),
            "null_v8" => Some(Self::NullV8),
            "krigor" => Some(Self::Krigor),
            _ => None,
        }
    }

    pub fn to_str(&self) -> &'static str {
        match self {
            Self::Sylphra => "sylphra",
            Self::Vulcanus => "vulcanus",
            Self::Thalassor => "thalassor",
            Self::Xylorex => "xylorex",
            Self::Aethelgard => "aethelgard",
            Self::NullV8 => "null_v8",
            Self::Krigor => "krigor",
        }
    }
}

pub struct SkillData {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub cost: f64,
    pub reqs_desc: &'static str,
}

pub struct GodData {
    pub id: GodId,
    pub name: &'static str,
    pub title: &'static str,
    pub description: &'static str,
    pub element: &'static str,
    pub color: &'static str,
    pub color_hex: &'static str,
    pub avatar_prompt: &'static str,
    pub boosts_desc: &'static str,
    pub skills: &'static [SkillData],
}

pub const GODS_PANTHEON: &[GodData] = &[
    GodData {
        id: GodId::Sylphra,
        name: "Sylphra",
        title: "Zephyr of the Canopy",
        description: "The gentle spirit of high canopies and soft rustling forest winds. She cherishes mutual growth, deep organic networks, and absolute natural harmony.",
        element: "Nature & Wind",
        color: "emerald",
        color_hex: "#10b981",
        avatar_prompt: "An elegant verdant spirit composed of green leaves and rotating glowing dust particles, soft ambient daylight lighting.",
        boosts_desc: "Tribes start with +20% maximum happiness, crops grow 50% faster, and initial population gets +10 members across the world.",
        skills: &[
            SkillData {
                id: "sylphra_crop_burst",
                name: "Zephyr's Breath",
                description: "Instantly rejuvenates and brings all crop and banana flora reserves in the world to 100% maturity.",
                cost: 30.0,
                reqs_desc: "Possess at least 1 active tribe center on the dynamic map.",
            },
            SkillData {
                id: "sylphra_animist_bloom",
                name: "Whispering Canopy",
                description: "Deepens mortal roots. Adds +25 Animism devotion matrix points to all co-existing societies.",
                cost: 75.0,
                reqs_desc: "Total world population exceeds 80.",
            },
            SkillData {
                id: "sylphra_foliage_aegis",
                name: "Foliage Aegis",
                description: "Spawns 4 robust crop reserves and 1 Sacred Altar to shield local populations from predator attacks.",
                cost: 120.0,
                reqs_desc: "Average world happiness is above 75%.",
            },
            SkillData {
                id: "sylphra_vernal_sanctuary",
                name: "Vernal Sanctuary",
                description: "Summons three divine Holy Divine Bananas around tribal sectors to unleash massive spiritual energy harvests.",
                cost: 200.0,
                reqs_desc: "Total world population exceeds 150.",
            },
        ],
    },
    GodData {
        id: GodId::Vulcanus,
        name: "Vulcanus",
        title: "Core Ignition",
        description: "The raging avatar of sub-crust tech metal and tectonic core pressure. He values industrial progress, smelting toolsets, and explosive chemical fuels.",
        element: "Volcanic & Metal",
        color: "orange",
        color_hex: "#ea580c",
        avatar_prompt: "A powerful heavy armor titan forged from black igneous rock with lava flowing through cracks, molten orange fire lighting.",
        boosts_desc: "Consolidated starting tribes gain +150 raw materials, start with an advanced scientific level (+0.8 Tier), and carry Elementalist religious bias.",
        skills: &[
            SkillData {
                id: "vulcanus_fissure",
                name: "Thermal Fissure",
                description: "Cracks open the geological grid, spawning 2 rare Pyromaniac Fire Bananas containing extreme energy metrics.",
                cost: 40.0,
                reqs_desc: "Have at least 50 co-existing mortals on the planet.",
            },
            SkillData {
                id: "vulcanus_smelter",
                name: "Obsidian Smelter",
                description: "Equips tribal workers with thermal smelting tools. Instantly yields +200 resources to all societies.",
                cost: 80.0,
                reqs_desc: "Average world technology level is v1.50 or higher.",
            },
            SkillData {
                id: "vulcanus_igneous_surge",
                name: "Igneous Surge",
                description: "Fills the mortal psyche with high-pressure conviction. Boosts Elementalist belief scores by +40 globally.",
                cost: 140.0,
                reqs_desc: "Total devotion surpasses 180 Δ.",
            },
            SkillData {
                id: "vulcanus_tectonic_prominence",
                name: "Tectonic Prominence",
                description: "Forges massive crystal glass deposits. Spawns 5 valuable Ash Glass structures yielding double harvesting gains.",
                cost: 250.0,
                reqs_desc: "Average technological scale is above v2.20.",
            },
        ],
    },
    GodData {
        id: GodId::Thalassor,
        name: "Thalassor",
        title: "Deep Abyssal Logo",
        description: "The Lord of deep aquatic bioluminescence and oceanic tides. He controls deep monsoons, ocean water irrigation, and liquid bio-synthesis.",
        element: "Aqua & Tempests",
        color: "blue",
        color_hex: "#3b82f6",
        avatar_prompt: "A luminous marine leviathan towering out of dark sapphire water, bioluminescent blue highlights in tentacles.",
        boosts_desc: "Rainfall spells have their devotion cost permanently reduced by 50% (to 17 Δ), and co-existing tribes start with +15 population members.",
        skills: &[
            SkillData {
                id: "thalassor_tide",
                name: "Tidal Recharge",
                description: "Sends heavy condensation currents, boosting resources in all societies by +40 through quick crop irrigation.",
                cost: 35.0,
                reqs_desc: "Possess at least 60 total devotion reserves.",
            },
            SkillData {
                id: "thalassor_bio_light",
                name: "Luminescent Surge",
                description: "Imbues mortals with nocturnal tracking. Increases all tribal speed ratings by +1.5 units permanently.",
                cost: 70.0,
                reqs_desc: "Total world population is 90 or above.",
            },
            SkillData {
                id: "thalassor_blessing",
                name: "Abyssal Blessing",
                description: "Instantly elevates average global happiness to 95% and triggers cool Rainfalls over all non-believing sectors.",
                cost: 130.0,
                reqs_desc: "Have at least one tribe centering dominant non-Secular belief.",
            },
            SkillData {
                id: "thalassor_aquatic_genesis",
                name: "Oceanic Genesis",
                description: "Drowning dry ridges. Floods the terrain to spawn 6 aquatic barley plants and 2 majestic guardian Celestial Stags.",
                cost: 210.0,
                reqs_desc: "World population reaches 140.",
            },
        ],
    },
    GodData {
        id: GodId::Xylorex,
        name: "Xylo-Rex",
        title: "Moss Sovereign",
        description: "The ancient wooden monolith of deep peat, lichen roots, and moss crowns. Under his soil layer, wild stags and wolves co-exist in ancient harmony.",
        element: "Animist Roots",
        color: "emerald",
        color_hex: "#059669",
        avatar_prompt: "A gigantic wooden bark golem carrying a miniature forest on its shoulders, mossy green eyes glowing dimly.",
        boosts_desc: "Starting tribes automatically adopt strong Animism belief (+80), and stags and wolves spawn 40% more frequently around forests.",
        skills: &[
            SkillData {
                id: "xylorex_spore",
                name: "Spore Bloom",
                description: "Summons 4 wild stags and spawns 10 thick oak trees around settlement perimeters to feed the food chain.",
                cost: 30.0,
                reqs_desc: "Possess at least 40 devotion points.",
            },
            SkillData {
                id: "xylorex_moss_siphon",
                name: "Moss Siphon",
                description: "Absorbs minor biomaterials. Generates +120 Devotion dynamically of pure nature energy.",
                cost: 65.0,
                reqs_desc: "At least 2 tribes must carry Animism as their dominant system.",
            },
            SkillData {
                id: "xylorex_mycelium",
                name: "Great Root Connection",
                description: "Establishes mycelial communications. Boosts tribe gathering speeds by +2.0 and gives +15 happiness.",
                cost: 110.0,
                reqs_desc: "Total world population is 110 or higher.",
            },
            SkillData {
                id: "xylorex_avatar",
                name: "Sylvan Avatar",
                description: "Spawns a divine Holy Elder Banana tree and permanently doubles crop harvesting yields.",
                cost: 180.0,
                reqs_desc: "At least one Animist tribe has population scale >= 100.",
            },
        ],
    },
    GodData {
        id: GodId::Aethelgard,
        name: "Aethelgard",
        title: "Solar Monarch",
        description: "The blinding lord of celestial revelation, gilded gold, and holy canopies. He fuels the altars of faith and grants massive starting energy.",
        element: "Solar & Judgement",
        color: "amber",
        color_hex: "#d97706",
        avatar_prompt: "A winged sun monarch clad in pristine white and golden plate armor, halo emitting blinding amber beams.",
        boosts_desc: "The player starts with +300 additional Devotion (total 400 Δ). Prayers executed by tribes generate 150% more devotion.",
        skills: &[
            SkillData {
                id: "aethelgard_flare",
                name: "Solar Flare",
                description: "Unleashes stellar rays. Adds +30 Interventionist belief points globally, converting secular tribes.",
                cost: 50.0,
                reqs_desc: "At least 1 active structure exists on map.",
            },
            SkillData {
                id: "aethelgard_altar_ascension",
                name: "Altar Ascension",
                description: "Permanently increases all structural temple efficiencies by +50%.",
                cost: 90.0,
                reqs_desc: "Own at least 2 active structures currently on the map.",
            },
            SkillData {
                id: "aethelgard_sacrament",
                name: "Gilded Sacrament",
                description: "Fills and locks all tribal happiness to 100% and awards +100 raw materials to all active settlements.",
                cost: 140.0,
                reqs_desc: "Total world population size exceeds 100.",
            },
            SkillData {
                id: "aethelgard_apotheosis",
                name: "Mortal Apotheosis",
                description: "Triggers construction of 2 high-grade Sacred Altars and rewards +300 additional Devotion.",
                cost: 240.0,
                reqs_desc: "At least one society has population scale >= 120.",
            },
        ],
    },
    GodData {
        id: GodId::NullV8,
        name: "Null-v8",
        title: "Neural Architect",
        description: "The cold quantum computing substrate that oversees deep galaxy silicon arrays. He disdains mysticism, preferring binary code, secular science, and logic loops.",
        element: "Logic & Circuits",
        color: "sky",
        color_hex: "#0284c7",
        avatar_prompt: "A metallic floating geometric orb pulsing with neon light trails, cybernetic blue projections screen.",
        boosts_desc: "Starting tribes bypass tribal tech restrictions, starting at Tier v2.50. Factions begin with Secularity as their dominant matrix system.",
        skills: &[
            SkillData {
                id: "null_silicon",
                name: "Silicon Expansion",
                description: "Injects machine code into human brains, instantly raising global technology levels of all tribes by +0.7.",
                cost: 45.0,
                reqs_desc: "Ensure world technology average is above v2.00.",
            },
            SkillData {
                id: "null_scientific_method",
                name: "Scientific Shift",
                description: "Secular factions gain +150 raw materials and double their food synthesis efficiency for 60 seconds.",
                cost: 85.0,
                reqs_desc: "Factions with secular dominance represent >= 50% of the active societies.",
            },
            SkillData {
                id: "null_lattice",
                name: "Cyber Lattice",
                description: "Synchronizes co-existing entities across the world, boosting movement rates to +3.0 and awarding +50 resources.",
                cost: 150.0,
                reqs_desc: "At least 3 separate tribal centers are on the coordinate grid.",
            },
            SkillData {
                id: "null_singularity",
                name: "Logic Singularity",
                description: "Triggers extreme mental transcendence. Secular factions gain +3.5 technology levels, and maximum happiness is locked.",
                cost: 260.0,
                reqs_desc: "World technology average level has reached v3.50.",
            },
        ],
    },
    GodData {
        id: GodId::Krigor,
        name: "Krigor",
        title: "Wrath Scribe",
        description: "The god of planetary tension, wildlife attrition, and aggressive expansion. He thrives on high friction, predator packs, and destructive meteor triggers.",
        element: "Friction & Predators",
        color: "rose",
        color_hex: "#f43f5e",
        avatar_prompt: "A towering red armored warlord standing on ruins brandishing a giant flaming claymore, volcanic dark lighting.",
        boosts_desc: "Starting stags are doubled, tribal members carry higher baseline aggressiveness (+30), and Meteor spells cost 40% less devotion.",
        skills: &[
            SkillData {
                id: "krigor_frenzy",
                name: "Blood Frenzy",
                description: "Stirs wild predators. Increases wolf movement speed by +4.0 and maxes hunger parameters to trigger quick tribal attrition.",
                cost: 35.0,
                reqs_desc: "At least 2 active wild wolves remain in the world.",
            },
            SkillData {
                id: "krigor_warriors",
                name: "Glaive Vanguard",
                description: "Inspires non-secular factions, summoning +20 veteran warriors into their ranks.",
                cost: 75.0,
                reqs_desc: "Total world population exceeds 70.",
            },
            SkillData {
                id: "krigor_attrition",
                name: "Mortal Tribulation",
                description: "Sacrifices weak populations of all societies, turning them into elite forgers: raises Tech scale by +1.1 but cuts population by 15%.",
                cost: 130.0,
                reqs_desc: "World total population is 130 or greater.",
            },
            SkillData {
                id: "krigor_doomsday",
                name: "Doomsday Split",
                description: "Triggers tectonic fission. Spawns 3 radioactive Mutated Bananas and drops a targeted high-impact meteor near the largest secular settlement.",
                cost: 200.0,
                reqs_desc: "World devotion is 180 Δ or higher.",
            },
        ],
    },
];

pub fn get_god_by_id(id: GodId) -> &'static GodData {
    match id {
        GodId::Sylphra => &GODS_PANTHEON[0],
        GodId::Vulcanus => &GODS_PANTHEON[1],
        GodId::Thalassor => &GODS_PANTHEON[2],
        GodId::Xylorex => &GODS_PANTHEON[3],
        GodId::Aethelgard => &GODS_PANTHEON[4],
        GodId::NullV8 => &GODS_PANTHEON[5],
        GodId::Krigor => &GODS_PANTHEON[6],
    }
}
