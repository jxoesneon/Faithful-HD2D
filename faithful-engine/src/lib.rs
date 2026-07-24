pub mod types;
pub mod ecs;
pub mod fractal;
pub mod gods;
pub mod simulation;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "wasm")]
use serde::{Serialize, Deserialize};

#[cfg(feature = "wasm")]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WasmExportedState {
    #[serde(default)]
    pub terrain: Vec<Vec<f64>>,
    #[serde(rename = "totalDevotion", default = "default_total_devotion")]
    pub total_devotion: f64,
    #[serde(rename = "activeGodId", default)]
    pub active_god_id: Option<String>,
    #[serde(default = "default_weather")]
    pub weather: String,
    #[serde(rename = "weatherTimer", default = "default_timer")]
    pub weather_timer: f64,
    #[serde(rename = "weatherTimeLeft", default = "default_timer")]
    pub weather_time_left: f64,
    #[serde(rename = "weatherIntensity", default = "default_intensity")]
    pub weather_intensity: f64,
    #[serde(rename = "globalTemperature", default = "default_temp")]
    pub global_temperature: f64,
    #[serde(rename = "globalHumidity", default = "default_humidity")]
    pub global_humidity: f64,
    #[serde(rename = "eventLogs", default)]
    pub event_logs: Vec<types::EventLog>,
    #[serde(rename = "divineLevel", default = "default_one_u32")]
    pub divine_level: u32,
    #[serde(rename = "divineXP", default)]
    pub divine_xp: f64,
    #[serde(rename = "divineXPNeeded", default = "default_xp_needed")]
    pub divine_xp_needed: f64,
    #[serde(rename = "illuminationPoints", default)]
    pub illumination_points: u32,
    #[serde(rename = "unlockedIlluminations", default)]
    pub unlocked_illuminations: Vec<String>,
    #[serde(rename = "actionsCompleted", default)]
    pub actions_completed: Option<types::ActionsCompleted>,
    #[serde(rename = "tribalRelations", default)]
    pub tribal_relations: std::collections::HashMap<String, std::collections::HashMap<String, f64>>,
    #[serde(rename = "ecsState")]
    pub ecs_state: ecs::ExportedState,
}

#[cfg(feature = "wasm")]
fn default_total_devotion() -> f64 { 100.0 }
#[cfg(feature = "wasm")]
fn default_weather() -> String { "CLEAR".to_string() }
#[cfg(feature = "wasm")]
fn default_timer() -> f64 { 45.0 }
#[cfg(feature = "wasm")]
fn default_intensity() -> f64 { 0.5 }
#[cfg(feature = "wasm")]
fn default_temp() -> f64 { 22.0 }
#[cfg(feature = "wasm")]
fn default_humidity() -> f64 { 45.0 }
#[cfg(feature = "wasm")]
fn default_one_u32() -> u32 { 1 }
#[cfg(feature = "wasm")]
fn default_xp_needed() -> f64 { 100.0 }

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct WasmSimulationEngine {
    inner: simulation::SimulationEngine,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl WasmSimulationEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();
        Self {
            inner: simulation::SimulationEngine::new(),
        }
    }

    pub fn update(&mut self, dt: f64) {
        self.inner.update(dt);
    }

    pub fn trigger_localized_spell(&mut self, spell_type: &str, tx: f64, ty: f64) -> bool {
        self.inner.trigger_localized_spell(spell_type, tx, ty)
    }

    pub fn execute_skill(&mut self, skill_id: &str) -> String {
        self.inner.execute_skill(skill_id)
    }

    pub fn apply_starting_boost(&mut self, god_name: &str) {
        if let Some(god_id) = gods::GodId::from_str(god_name) {
            self.inner.apply_starting_boost(god_id);
        }
    }

    pub fn export_state(&self) -> JsValue {
        let active_god_str = self.inner.active_god_id.map(|id| id.to_str().to_string());
        
        let state = WasmExportedState {
            terrain: self.inner.terrain.clone(),
            total_devotion: self.inner.total_devotion,
            active_god_id: active_god_str,
            weather: self.inner.weather.clone(),
            weather_timer: self.inner.weather_timer,
            weather_time_left: self.inner.weather_time_left,
            weather_intensity: self.inner.weather_intensity,
            global_temperature: self.inner.global_temperature,
            global_humidity: self.inner.global_humidity,
            event_logs: self.inner.event_logs.clone(),
            divine_level: self.inner.divine_level,
            divine_xp: self.inner.divine_xp,
            divine_xp_needed: self.inner.divine_xp_needed,
            illumination_points: self.inner.illumination_points,
            unlocked_illuminations: self.inner.unlocked_illuminations.clone(),
            actions_completed: Some(self.inner.actions_completed.clone()),
            tribal_relations: self.inner.tribal_relations.clone(),
            ecs_state: self.inner.ecs.export_state(),
        };
        serde_wasm_bindgen::to_value(&state).unwrap_or(JsValue::NULL)
    }

    pub fn import_state(&mut self, state: JsValue) {
        if let Ok(exported) = serde_wasm_bindgen::from_value::<WasmExportedState>(state) {
            if !exported.terrain.is_empty() {
                self.inner.terrain = exported.terrain;
            }
            self.inner.total_devotion = exported.total_devotion;
            self.inner.active_god_id = exported.active_god_id.and_then(|name| gods::GodId::from_str(&name));
            self.inner.weather = exported.weather;
            self.inner.weather_timer = exported.weather_timer;
            self.inner.weather_time_left = exported.weather_time_left;
            self.inner.weather_intensity = exported.weather_intensity;
            self.inner.global_temperature = exported.global_temperature;
            self.inner.global_humidity = exported.global_humidity;
            self.inner.event_logs = exported.event_logs;
            self.inner.divine_level = exported.divine_level;
            self.inner.divine_xp = exported.divine_xp;
            self.inner.divine_xp_needed = exported.divine_xp_needed;
            self.inner.illumination_points = exported.illumination_points;
            self.inner.unlocked_illuminations = exported.unlocked_illuminations;
            if let Some(actions) = exported.actions_completed {
                self.inner.actions_completed = actions;
            }
            self.inner.tribal_relations = exported.tribal_relations;
            self.inner.ecs.import_state(exported.ecs_state);
        }
    }

    pub fn get_total_devotion(&self) -> f64 {
        self.inner.total_devotion
    }

    pub fn set_total_devotion(&mut self, val: f64) {
        self.inner.total_devotion = val;
    }

    pub fn get_active_god_id(&self) -> Option<String> {
        self.inner.active_god_id.map(|id| id.to_str().to_string())
    }

    pub fn set_active_god_id(&mut self, god_name: Option<String>) {
        self.inner.active_god_id = god_name.and_then(|name| gods::GodId::from_str(&name));
    }

    pub fn get_weather(&self) -> String {
        self.inner.weather.clone()
    }

    pub fn set_weather(&mut self, weather: &str, duration: f64, intensity: f64) {
        self.inner.set_weather(weather, duration, intensity);
    }

    pub fn get_weather_time_left(&self) -> f64 {
        self.inner.weather_time_left
    }

    pub fn get_weather_intensity(&self) -> f64 {
        self.inner.weather_intensity
    }

    pub fn get_global_temperature(&self) -> f64 {
        self.inner.global_temperature
    }

    pub fn get_global_humidity(&self) -> f64 {
        self.inner.global_humidity
    }

    pub fn get_divine_level(&self) -> u32 {
        self.inner.divine_level
    }

    pub fn get_divine_xp(&self) -> f64 {
        self.inner.divine_xp
    }

    pub fn get_divine_xp_needed(&self) -> f64 {
        self.inner.divine_xp_needed
    }

    pub fn get_illumination_points(&self) -> u32 {
        self.inner.illumination_points
    }

    pub fn get_event_logs(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.inner.event_logs).unwrap_or(JsValue::NULL)
    }

    pub fn add_event_log(&mut self, log_type: &str, text: String) {
        self.inner.add_event_log(log_type, text);
    }

    pub fn gain_divine_xp(&mut self, amount: f64, multiplier: f64) {
        self.inner.gain_divine_xp(amount, multiplier);
    }

    pub fn get_terrain(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.inner.terrain).unwrap_or(JsValue::NULL)
    }

    pub fn get_entity_at(&self, tx: f64, ty: f64) -> JsValue {
        serde_wasm_bindgen::to_value(&self.inner.get_entity_at(tx, ty)).unwrap_or(JsValue::NULL)
    }

    pub fn get_actions_completed(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.inner.actions_completed).unwrap_or(JsValue::NULL)
    }

    pub fn increment_weather_interventions(&mut self) {
        self.inner.actions_completed.weather_interventions += 1;
    }

    pub fn spawn_tribe(&mut self, x: f64, y: f64, faction_str: &str) -> String {
        let faction = match faction_str {
            "ANIMIST" => types::Faction::ANIMIST,
            "TECHNOCRAT" => types::Faction::TECHNOCRAT,
            "INTERVENTIONIST" => types::Faction::INTERVENTIONIST,
            "NIHILIST" => types::Faction::NIHILIST,
            "ELEMENTAL" => types::Faction::ELEMENTAL,
            _ => types::Faction::INTERVENTIONIST,
        };
        self.inner.spawn_tribe(x, y, faction)
    }

    pub fn spawn_flora(&mut self, x: f64, y: f64, category_str: &str, sub_type: String) -> String {
        let category = match category_str {
            "CROP" => types::FloraCategory::CROP,
            "NANO_BANANA" => types::FloraCategory::NANO_BANANA,
            "EXOTIC" => types::FloraCategory::EXOTIC,
            "TREE" => types::FloraCategory::TREE,
            _ => types::FloraCategory::CROP,
        };
        self.inner.spawn_flora(x, y, category, sub_type)
    }

    pub fn spawn_fauna(&mut self, x: f64, y: f64, category_str: &str, sub_type: String) -> String {
        let category = match category_str {
            "WOLF" => types::FaunaCategory::WOLF,
            "STAG" => types::FaunaCategory::STAG,
            "COW" => types::FaunaCategory::COW,
            "CELESTIAL" => types::FaunaCategory::CELESTIAL,
            _ => types::FaunaCategory::STAG,
        };
        self.inner.spawn_fauna(x, y, category, sub_type)
    }

    pub fn spawn_structure(&mut self, x: f64, y: f64, category_str: &str, sub_type: String) -> String {
        let category = match category_str {
            "ALTAR" => types::StructureCategory::ALTAR,
            "REACTOR" => types::StructureCategory::REACTOR,
            "HABITAT" => types::StructureCategory::HABITAT,
            "DEFENSE" => types::StructureCategory::DEFENSE,
            "FARM" => types::StructureCategory::FARM,
            _ => types::StructureCategory::ALTAR,
        };
        self.inner.spawn_structure(x, y, category, sub_type)
    }

    pub fn get_planetary_mesh(&self, subdivisions: usize) -> JsValue {
        let fractal = fractal::FractalDetailEngine::new(42);
        let mesh = fractal.get_planetary_mesh(subdivisions, fractal::BiomeProfile::Standard);
        serde_wasm_bindgen::to_value(&mesh).unwrap_or(JsValue::NULL)
    }

    pub fn get_regional_flow_field(&self, start_x: f64, start_y: f64, size: usize, chunk_res: f64) -> JsValue {
        let fractal = fractal::FractalDetailEngine::new(42);
        let field = fractal.get_regional_flow_field(start_x, start_y, size, chunk_res, fractal::BiomeProfile::Standard);
        serde_wasm_bindgen::to_value(&field).unwrap_or(JsValue::NULL)
    }

    pub fn get_isometric_tile_buffer(&self, start_x: f64, start_y: f64, size: usize, resolution: f64) -> JsValue {
        let fractal = fractal::FractalDetailEngine::new(42);
        let buffer = fractal.get_isometric_tile_buffer(start_x, start_y, size, resolution, fractal::BiomeProfile::Standard);
        serde_wasm_bindgen::to_value(&buffer).unwrap_or(JsValue::NULL)
    }

    pub fn get_y_sorted_actors(&self, actors: JsValue) -> JsValue {
        if let Ok(actors_vec) = serde_wasm_bindgen::from_value::<Vec<fractal::ActorRenderInfo>>(actors) {
            let fractal = fractal::FractalDetailEngine::new(42);
            let sorted = fractal.get_y_sorted_actors(actors_vec);
            serde_wasm_bindgen::to_value(&sorted).unwrap_or(JsValue::NULL)
        } else {
            JsValue::NULL
        }
    }

    pub fn get_particle_emission_buffer(&self, emitter_x: f64, emitter_y: f64, particle_count: usize, seed: f64) -> JsValue {
        let fractal = fractal::FractalDetailEngine::new(42);
        let particles = fractal.get_particle_emission_buffer(emitter_x, emitter_y, particle_count, seed);
        serde_wasm_bindgen::to_value(&particles).unwrap_or(JsValue::NULL)
    }

    pub fn get_aaa_effects(&self, camera_zoom: f64, target_depth: f64, active_deity_id: Option<String>) -> JsValue {
        let fractal = fractal::FractalDetailEngine::new(42);
        let deity_str = active_deity_id.as_deref();
        let effects = fractal.get_aaa_effects(camera_zoom, target_depth, deity_str);
        serde_wasm_bindgen::to_value(&effects).unwrap_or(JsValue::NULL)
    }

    pub fn get_entity_data_flat(&self) -> Vec<f32> {
        let mut data = Vec::new();
        for ent in &self.inner.ecs.entities {
            if let Some(pos) = self.inner.ecs.positions.get(ent) {
                data.push(pos.x as f32);
                data.push(pos.y as f32);
                
                let (vx, vy) = if let Some(m) = self.inner.ecs.movements.get(ent) {
                    (m.vx as f32, m.vy as f32)
                } else {
                    (0.0, 0.0)
                };
                data.push(vx);
                data.push(vy);
                
                let biomass = if let Some(b) = self.inner.ecs.biologies.get(ent) {
                    b.biomass as f32
                } else {
                    0.0
                };
                data.push(biomass);
                
                let health = if let Some(b) = self.inner.ecs.biologies.get(ent) {
                    b.health as f32
                } else if let Some(fa) = self.inner.ecs.faunas.get(ent) {
                    fa.health as f32
                } else if let Some(fl) = self.inner.ecs.floras.get(ent) {
                    fl.growth as f32
                } else if let Some(s) = self.inner.ecs.structures.get(ent) {
                    s.durability as f32
                } else {
                    100.0
                };
                data.push(health);
                
                let hash = hash_string_rust(ent) as f32;
                data.push(hash);
                
                data.push(0.0); // state placeholder
            }
        }
        data
    }
}

fn hash_string_rust(s: &str) -> i32 {
    let mut hash: i32 = 0;
    for c in s.chars() {
        let code = c as u32;
        hash = (hash.wrapping_shl(5)).wrapping_sub(hash).wrapping_add(code as i32);
    }
    hash
}

#[cfg(test)]
mod tests {
    use super::simulation::SimulationEngine;
    use super::gods::GodId;

    #[test]
    fn test_engine_init() {
        let sim = SimulationEngine::new();
        assert_eq!(sim.width, 64);
        assert_eq!(sim.height, 64);
        assert_eq!(sim.weather, "CLEAR");
        assert!(!sim.event_logs.is_empty());
    }

    #[test]
    fn test_engine_update() {
        let mut sim = SimulationEngine::new();
        sim.update(1.0);
        assert!(!sim.event_logs.is_empty());
    }

    #[test]
    fn test_god_starting_boosts() {
        let mut sim = SimulationEngine::new();
        sim.apply_starting_boost(GodId::Aethelgard);
        assert_eq!(sim.total_devotion, 400.0);
    }

    #[test]
    fn test_state_serialization_roundtrip() {
        let mut sim = SimulationEngine::new();
        sim.update(1.0);
        
        let exported = sim.ecs.export_state();
        let serialized = serde_json::to_string(&exported).unwrap();
        
        let deserialized: crate::ecs::ExportedState = serde_json::from_str(&serialized).unwrap();
        let mut new_sim = SimulationEngine::new();
        new_sim.ecs.import_state(deserialized);
        
        assert_eq!(sim.ecs.entities.len(), new_sim.ecs.entities.len());
    }
}
