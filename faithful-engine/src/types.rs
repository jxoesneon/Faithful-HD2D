use serde::{Serialize, Deserialize};
use std::collections::HashMap;

pub type Entity = String;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Faction {
    ANIMIST,
    TECHNOCRAT,
    INTERVENTIONIST,
    NIHILIST,
    ELEMENTAL,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FaithSystemType {
    ANIMISM,
    ELEMENTALISM,
    INTERVENTIONIST,
    SECULAR,
    NIHILISM,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Physics {
    pub temperature: f64,
    pub humidity: f64,
    pub height: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Biology {
    pub biomass: f64,
    pub health: f64,
    pub dna: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Society {
    pub name: String,
    pub faction: Faction,
    pub population: f64,
    pub technology_level: f64,
    pub resources: f64,
    pub happiness: f64,
    #[serde(default)]
    pub gatherer_ratio: Option<f64>,
    #[serde(default)]
    pub hunter_ratio: Option<f64>,
    #[serde(default)]
    pub researcher_ratio: Option<f64>,
    #[serde(default)]
    pub acolyte_ratio: Option<f64>,
    #[serde(default)]
    pub ration_mode: Option<bool>,
    #[serde(default)]
    pub strip_mine_mode: Option<bool>,
    #[serde(default)]
    pub tithe_mode: Option<bool>,
    #[serde(default)]
    pub tier_level: Option<u32>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Faith {
    pub devotion: f64,
    pub dominant_system: FaithSystemType,
    pub belief_matrix: HashMap<FaithSystemType, f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FloraCategory {
    CROP,
    NANO_BANANA,
    EXOTIC,
    TREE,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Flora {
    pub category: FloraCategory,
    pub sub_type: String,
    pub growth: f64,
    pub resources_yield: f64,
    pub is_harvested: bool,
    #[serde(default)]
    pub soil_moisture: Option<f64>,
    #[serde(default)]
    pub soil_nutrients: Option<f64>,
    #[serde(default)]
    pub pest_level: Option<f64>,
    #[serde(default)]
    pub disease_active: Option<bool>,
    #[serde(default)]
    pub cultivar_tier: Option<u32>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FaunaCategory {
    WOLF,
    STAG,
    COW,
    CELESTIAL,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FaunaActionState {
    WANDERING,
    HUNTING,
    FLEEING,
    GRAZING,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Fauna {
    pub category: FaunaCategory,
    pub sub_type: String,
    pub health: f64,
    pub hunger: f64,
    pub aggressiveness: f64,
    pub action_state: FaunaActionState,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum StructureCategory {
    ALTAR,
    REACTOR,
    HABITAT,
    DEFENSE,
    FARM,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Structure {
    pub category: StructureCategory,
    pub sub_type: String,
    pub durability: f64,
    pub efficiency: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ActivityState {
    IDLE,
    WANDERING,
    MOVING_TO_RESOURCE,
    PRAYING,
    FLEEING,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Movement {
    pub speed: f64,
    pub vx: f64,
    pub vy: f64,
    pub target_x: Option<f64>,
    pub target_y: Option<f64>,
    pub activity_state: ActivityState,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Prayer {
    pub quest_type: String,
    pub target_value: String,
    pub duration_left: f64,
    pub reward_devotion: f64,
    pub is_fulfilled: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EventLog {
    pub id: f64,
    pub time: String,
    #[serde(rename = "type")]
    pub log_type: String, // MIRACLE | SCHISM | EVOLUTION
    pub text: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ActionsCompleted {
    pub miracles_cast: u32,
    pub flora_harvested: u32,
    pub fauna_hunted: u32,
    pub structures_erected: u32,
    pub weather_interventions: u32,
    pub tithes_completed: u32,
    pub devotion_accumulated: f64,
}
