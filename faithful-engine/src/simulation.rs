use std::collections::HashMap;
use crate::types::*;
use crate::ecs::ECS;
use crate::fractal::FractalDetailEngine;
use crate::gods::{GodId, SkillData, GODS_PANTHEON};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SimulationEngine {
    pub ecs: ECS,
    pub width: usize,
    pub height: usize,
    pub terrain: Vec<Vec<f64>>,
    pub total_devotion: f64,
    pub active_god_id: Option<GodId>,
    pub weather: String, // CLEAR | RAINY | DROUGHT | TEMPEST | AURORA
    pub weather_timer: f64,
    pub weather_time_left: f64,
    pub weather_intensity: f64,
    pub global_temperature: f64,
    pub global_humidity: f64,
    pub event_logs: Vec<EventLog>,
    pub tribal_relations: HashMap<String, HashMap<String, f64>>,
    pub relation_log_cooldowns: HashMap<String, f64>,
    pub divine_level: u32,
    pub divine_xp: f64,
    pub divine_xp_needed: f64,
    pub illumination_points: u32,
    pub unlocked_illuminations: Vec<String>,
    pub actions_completed: ActionsCompleted,
}

impl SimulationEngine {
    pub fn new() -> Self {
        let mut ecs = ECS::new();
        let fractal = FractalDetailEngine::default();
        let terrain = fractal.get_grid(12.0, 12.0, 64, 1.0);
        let width = 64;
        let height = 64;

        let mut sim = Self {
            ecs,
            width,
            height,
            terrain,
            total_devotion: 100.0,
            active_god_id: None,
            weather: "CLEAR".to_string(),
            weather_timer: 45.0,
            weather_time_left: 45.0,
            weather_intensity: 0.5,
            global_temperature: 22.0,
            global_humidity: 45.0,
            event_logs: Vec::new(),
            tribal_relations: HashMap::new(),
            relation_log_cooldowns: HashMap::new(),
            divine_level: 1,
            divine_xp: 0.0,
            divine_xp_needed: 100.0,
            illumination_points: 0,
            unlocked_illuminations: Vec::new(),
            actions_completed: ActionsCompleted {
                miracles_cast: 0,
                flora_harvested: 0,
                fauna_hunted: 0,
                structures_erected: 0,
                weather_interventions: 0,
                tithes_completed: 0,
                devotion_accumulated: 0.0,
            },
        };

        // Seed initial world structures and entities
        sim.generate_world();
        sim.set_weather("CLEAR", 45.0, 0.5);

        sim.add_event_log("EVOLUTION", "World initialized. Generative biosphere seeded.".to_string());
        sim.add_event_log("MIRACLE", "Quantum entanglement with Deity Interface online.".to_string());

        sim
    }

    pub fn add_event_log(&mut self, log_type: &str, text: String) {
        let time_str = "12:00:00".to_string(); // Simple placeholder for native Rust environment compatibility
        self.event_logs.insert(0, EventLog {
            id: rand::random::<f64>() + 1.0,
            time: time_str,
            log_type: log_type.to_string(),
            text,
        });
        if self.event_logs.length_value() > 50 {
            self.event_logs.pop();
        }
    }

    pub fn gain_divine_xp(&mut self, amount: f64) {
        if amount <= 0.0 {
            return;
        }
        self.divine_xp += amount;
        while self.divine_xp >= self.divine_xp_needed {
            self.divine_xp -= self.divine_xp_needed;
            self.divine_level += 1;
            self.illumination_points += 1;
            self.divine_xp_needed = (100.0 + self.divine_level as f64 * 75.0).floor();

            self.add_event_log(
                "MIRACLE",
                format!("✨ DIVINE ILLUMINATION LEVEL UP! Reached Divine Level {}. Spark of Light unlocked!", self.divine_level)
            );

            // Spawn extra Divine Nano Bananas at randomly selected sectors
            let rx = 10.0 + (rand::random::<f64>() * 44.0);
            let ry = 10.0 + (rand::random::<f64>() * 44.0);
            self.spawn_flora(rx, ry, FloraCategory::NANO_BANANA, "DIVINE".to_string());
        }
    }

    pub fn set_weather(&mut self, new_weather: &str, duration: f64, intensity: f64) {
        self.weather = new_weather.to_string();
        self.weather_timer = duration;
        self.weather_time_left = duration;
        self.weather_intensity = intensity;

        match new_weather {
            "CLEAR" => {
                self.global_temperature = 22.0 + (rand::random::<f64>() * 4.0 - 2.0);
                self.global_humidity = 45.0 + (rand::random::<f64>() * 10.0 - 5.0);
                self.add_event_log("EVOLUTION", "Micro-climate stabilized. Clear skies and balanced currents detected.".to_string());
            }
            "RAINY" => {
                self.global_temperature = 15.0 + (rand::random::<f64>() * 4.0 - 2.0);
                self.global_humidity = 85.0 + (rand::random::<f64>() * 10.0 - 5.0);
                self.add_event_log("EVOLUTION", "Dynamic condensation field triggered. Rain refreshing life forms.".to_string());
            }
            "DROUGHT" => {
                self.global_temperature = 41.0 + (rand::random::<f64>() * 6.0 - 3.0);
                self.global_humidity = 8.0 + (rand::random::<f64>() * 4.0 - 2.0);
                self.add_event_log("SCHISM", "Dry high pressure drought! Resource growth stalled, animal hydration stress warning.".to_string());
            }
            "TEMPEST" => {
                self.global_temperature = 11.0 + (rand::random::<f64>() * 4.0 - 2.0);
                self.global_humidity = 98.0 + (rand::random::<f64>() * 2.0);
                self.add_event_log("SCHISM", "Severe electromagnetic tempest alert. Watch out for random high energy spatial lightning discharges.".to_string());
            }
            "AURORA" => {
                self.global_temperature = 4.0 + (rand::random::<f64>() * 4.0 - 2.0);
                self.global_humidity = 30.0 + (rand::random::<f64>() * 10.0 - 5.0);
                self.add_event_log("MIRACLE", "Cosmic Aurora field active! Higher devotion levels and elevated spiritual energy.".to_string());
            }
            _ => {}
        }
    }

    fn generate_world(&mut self) {
        let factions = vec![
            Faction::ANIMIST,
            Faction::TECHNOCRAT,
            Faction::INTERVENTIONIST,
            Faction::NIHILIST,
            Faction::ELEMENTAL,
        ];

        for fac in factions {
            let rx = 10.0 + (rand::random::<f64>() * (self.width as f64 - 20.0)).floor();
            let ry = 10.0 + (rand::random::<f64>() * (self.height as f64 - 20.0)).floor();
            self.spawn_tribe(rx, ry, fac);
        }

        let banana_types = vec!["GOLD", "CYBER", "VOID", "DIVINE", "FIRE", "FROST", "TOXIC", "COSMIC"];
        for b_type in banana_types {
            for _ in 0..3 {
                let bx = 5.0 + (rand::random::<f64>() * (self.width as f64 - 10.0)).floor();
                let by = 5.0 + (rand::random::<f64>() * (self.height as f64 - 10.0)).floor();
                self.spawn_flora(bx, by, FloraCategory::NANO_BANANA, b_type.to_string());
            }
        }

        for _ in 0..25 {
            let fx = (rand::random::<f64>() * self.width as f64).floor();
            let fy = (rand::random::<f64>() * self.height as f64).floor();
            self.spawn_flora(fx, fy, FloraCategory::TREE, "Oak".to_string());
        }

        for _ in 0..20 {
            let fx = (rand::random::<f64>() * self.width as f64).floor();
            let fy = (rand::random::<f64>() * self.height as f64).floor();
            self.spawn_flora(fx, fy, FloraCategory::CROP, "Barley".to_string());
        }

        for _ in 0..12 {
            let ax = (rand::random::<f64>() * self.width as f64).floor();
            let ay = (rand::random::<f64>() * self.height as f64).floor();
            self.spawn_fauna(ax, ay, FaunaCategory::STAG, "Forest Stag".to_string());
        }

        for _ in 0..6 {
            let ax = (rand::random::<f64>() * self.width as f64).floor();
            let ay = (rand::random::<f64>() * self.height as f64).floor();
            self.spawn_fauna(ax, ay, FaunaCategory::WOLF, "Dire Wolf".to_string());
        }

        for _ in 0..4 {
            let sx = 10.0 + (rand::random::<f64>() * (self.width as f64 - 20.0)).floor();
            let sy = 10.0 + (rand::random::<f64>() * (self.height as f64 - 20.0)).floor();
            self.spawn_structure(sx, sy, StructureCategory::ALTAR, "Sacred Altar".to_string());
        }
    }

    pub fn spawn_tribe(&mut self, x: f64, y: f64, faction: Faction) -> Entity {
        let e = self.ecs.create_entity();

        let name = match faction {
            Faction::ANIMIST => "Oakheart Keepers".to_string(),
            Faction::TECHNOCRAT => "Helix Assembly".to_string(),
            Faction::INTERVENTIONIST => "Sanctum Chosen".to_string(),
            Faction::NIHILIST => "Void Singularity".to_string(),
            Faction::ELEMENTAL => "Glacial Pyre Ascendants".to_string(),
        };

        let mut belief_matrix = HashMap::new();
        match faction {
            Faction::ANIMIST => {
                belief_matrix.insert(FaithSystemType::ANIMISM, 90.0);
                belief_matrix.insert(FaithSystemType::ELEMENTALISM, 10.0);
                belief_matrix.insert(FaithSystemType::INTERVENTIONIST, 0.0);
                belief_matrix.insert(FaithSystemType::SECULAR, 0.0);
                belief_matrix.insert(FaithSystemType::NIHILISM, 0.0);
            }
            Faction::TECHNOCRAT => {
                belief_matrix.insert(FaithSystemType::ANIMISM, 0.0);
                belief_matrix.insert(FaithSystemType::ELEMENTALISM, 10.0);
                belief_matrix.insert(FaithSystemType::INTERVENTIONIST, 0.0);
                belief_matrix.insert(FaithSystemType::SECULAR, 80.0);
                belief_matrix.insert(FaithSystemType::NIHILISM, 10.0);
            }
            Faction::INTERVENTIONIST => {
                belief_matrix.insert(FaithSystemType::ANIMISM, 10.0);
                belief_matrix.insert(FaithSystemType::ELEMENTALISM, 10.0);
                belief_matrix.insert(FaithSystemType::INTERVENTIONIST, 80.0);
                belief_matrix.insert(FaithSystemType::SECULAR, 0.0);
                belief_matrix.insert(FaithSystemType::NIHILISM, 0.0);
            }
            Faction::NIHILIST => {
                belief_matrix.insert(FaithSystemType::ANIMISM, 0.0);
                belief_matrix.insert(FaithSystemType::ELEMENTALISM, 10.0);
                belief_matrix.insert(FaithSystemType::INTERVENTIONIST, 0.0);
                belief_matrix.insert(FaithSystemType::SECULAR, 10.0);
                belief_matrix.insert(FaithSystemType::NIHILISM, 80.0);
            }
            Faction::ELEMENTAL => {
                belief_matrix.insert(FaithSystemType::ANIMISM, 20.0);
                belief_matrix.insert(FaithSystemType::ELEMENTALISM, 70.0);
                belief_matrix.insert(FaithSystemType::INTERVENTIONIST, 10.0);
                belief_matrix.insert(FaithSystemType::SECULAR, 0.0);
                belief_matrix.insert(FaithSystemType::NIHILISM, 0.0);
            }
        }

        let dominant_system = match faction {
            Faction::TECHNOCRAT => FaithSystemType::SECULAR,
            Faction::ELEMENTAL => FaithSystemType::ELEMENTALISM,
            _ => unsafe { std::mem::transmute(faction) }, // Aligned mapping
        };

        self.ecs.add_position(e.clone(), Position { x, y, z: 0.0 });
        self.ecs.add_society(e.clone(), Society {
            name: format!("{} [{}]", name, e),
            faction,
            population: 40.0 + (rand::random::<f64>() * 30.0).floor(),
            technology_level: if faction == Faction::TECHNOCRAT { 2.5 } else { 1.0 },
            resources: 60.0,
            happiness: 85.0,
            gatherer_ratio: Some(0.35),
            hunter_ratio: Some(0.15),
            researcher_ratio: Some(0.20),
            acolyte_ratio: Some(0.30),
            ration_mode: Some(false),
            strip_mine_mode: Some(false),
            tithe_mode: Some(false),
            tier_level: Some(1),
        });

        self.ecs.add_faith(e.clone(), Faith {
            devotion: 30.0,
            dominant_system,
            belief_matrix,
        });

        self.ecs.add_movement(e.clone(), Movement {
            speed: 2.5 + rand::random::<f64>() * 1.5,
            vx: 0.0,
            vy: 0.0,
            target_x: None,
            target_y: None,
            activity_state: ActivityState::IDLE,
        });

        let tx = x.floor() as usize;
        let ty = y.floor() as usize;
        let height = self.terrain.get(tx).and_then(|row| row.get(ty)).cloned().unwrap_or(0.5);

        self.ecs.add_physics(e.clone(), Physics {
            temperature: 22.0,
            humidity: 45.0,
            height,
        });

        self.ecs.add_biology(e.clone(), Biology {
            biomass: 150.0,
            health: 100.0,
            dna: "HOMO_SAPIENS_CORE".to_string(),
        });

        self.add_event_log("EVOLUTION", format!("Spawned {} tribe center at coordinate ({}, {})", name, x, y));
        e
    }

    pub fn spawn_flora(&mut self, x: f64, y: f64, category: FloraCategory, sub_type: String) -> Entity {
        let e = self.ecs.create_entity();
        self.ecs.add_position(e.clone(), Position { x, y, z: 0.0 });

        let yield_scale = if category == FloraCategory::NANO_BANANA { 50.0 } else { 15.0 };
        self.ecs.add_flora(e.clone(), Flora {
            category,
            sub_type: sub_type.clone(),
            growth: 30.0 + (rand::random::<f64>() * 70.0).floor(),
            resources_yield: yield_scale + (rand::random::<f64>() * 15.0).floor(),
            is_harvested: false,
            soil_moisture: Some(50.0 + (rand::random::<f64>() * 30.0).floor()),
            soil_nutrients: Some(60.0 + (rand::random::<f64>() * 30.0).floor()),
            pest_level: Some((rand::random::<f64>() * 10.0).floor()),
            disease_active: Some(rand::random::<f64>() < 0.05),
            cultivar_tier: Some(1),
        });

        let tx = x.floor() as usize;
        let ty = y.floor() as usize;
        let height = self.terrain.get(tx).and_then(|row| row.get(ty)).cloned().unwrap_or(0.5);

        self.ecs.add_physics(e.clone(), Physics {
            temperature: 20.0,
            humidity: 50.0,
            height,
        });

        self.ecs.add_biology(e.clone(), Biology {
            biomass: if category == FloraCategory::NANO_BANANA { 120.0 } else if category == FloraCategory::TREE { 180.0 } else { 70.0 },
            health: 100.0,
            dna: format!("FLORA_GEN_{:?}", category),
        });

        e
    }

    pub fn spawn_fauna(&mut self, x: f64, y: f64, category: FaunaCategory, sub_type: String) -> Entity {
        let e = self.ecs.create_entity();
        self.ecs.add_position(e.clone(), Position { x, y, z: 0.0 });

        self.ecs.add_fauna(e.clone(), Fauna {
            category,
            sub_type: sub_type.clone(),
            health: 100.0,
            hunger: 30.0 + (rand::random::<f64>() * 40.0).floor(),
            aggressiveness: if category == FaunaCategory::WOLF { 85.0 } else { 5.0 },
            action_state: FaunaActionState::WANDERING,
        });

        self.ecs.add_movement(e.clone(), Movement {
            speed: if category == FaunaCategory::WOLF { 3.5 } else { 2.0 },
            vx: 0.0,
            vy: 0.0,
            target_x: None,
            target_y: None,
            activity_state: ActivityState::WANDERING,
        });

        let tx = x.floor() as usize;
        let ty = y.floor() as usize;
        let height = self.terrain.get(tx).and_then(|row| row.get(ty)).cloned().unwrap_or(0.5);

        self.ecs.add_physics(e.clone(), Physics {
            temperature: 37.0,
            humidity: 60.0,
            height,
        });

        self.ecs.add_biology(e.clone(), Biology {
            biomass: if category == FaunaCategory::WOLF { 110.0 } else { 160.0 },
            health: 100.0,
            dna: format!("FAUNA_GEN_{:?}", category),
        });

        e
    }

    pub fn spawn_structure(&mut self, x: f64, y: f64, category: StructureCategory, sub_type: String) -> Entity {
        let e = self.ecs.create_entity();
        self.ecs.add_position(e.clone(), Position { x, y, z: 0.0 });

        let mut resolved_category = category;
        if sub_type == "Hydro-Bay Dome" || sub_type == "Terratech Greenhouse" {
            resolved_category = StructureCategory::FARM;
        }

        self.ecs.add_structure(e.clone(), Structure {
            category: resolved_category,
            sub_type: sub_type.clone(),
            durability: 100.0,
            efficiency: if resolved_category == StructureCategory::FARM { 1.50 } else { 1.25 },
        });

        let tx = x.floor() as usize;
        let ty = y.floor() as usize;
        let height = self.terrain.get(tx).and_then(|row| row.get(ty)).cloned().unwrap_or(0.5);

        self.ecs.add_physics(e.clone(), Physics {
            temperature: if resolved_category == StructureCategory::FARM { 24.0 } else { 15.0 },
            humidity: if resolved_category == StructureCategory::FARM { 65.0 } else { 40.0 },
            height,
        });

        self.add_event_log(
            "EVOLUTION",
            format!("Erected new historical structure [{}] of category [{:?}] at coordinate ({}, {})", sub_type, resolved_category, x, y)
        );
        self.actions_completed.structures_erected += 1;
        self.gain_divine_xp(30.0);
        e
    }

    pub fn trigger_localized_spell(&mut self, spell_type: &str, tx: f64, ty: f64) -> bool {
        let mut cost = match spell_type {
            "Rainfall" => 35.0,
            "Meteor" => 65.0,
            "Sanctity Aura" => 40.0,
            "Rift Collapse" => 80.0,
            "Found Outpost" => 55.0,
            "Fertility Rite" => 30.0,
            _ => 50.0,
        };

        // Apply deity-specific custom cost reductions
        if let Some(active_god) = self.active_god_id {
            match (spell_type, active_god) {
                ("Rainfall", GodId::Thalassor) => cost = 17.0, // 50% discount
                ("Meteor", GodId::Krigor) => cost = 39.0,      // 40% discount
                ("Fertility Rite", GodId::Sylphra) => cost = 15.0, // 50% discount
                _ => {}
            }
        }

        if self.total_devotion < cost {
            self.add_event_log("SCHISM", format!("Insufficient devotion for {} (needs {} Δ)", spell_type, cost));
            return false;
        }

        self.total_devotion -= cost;
        self.add_event_log("MIRACLE", format!("Initiating {} localized impact circle centered near tile ({}, {})", spell_type, tx, ty));

        self.actions_completed.miracles_cast += 1;
        self.gain_divine_xp(20.0);

        let range = match spell_type {
            "Meteor" => 8.0,
            "Rainfall" => 10.0,
            "Rift Collapse" => 6.0,
            "Fertility Rite" => 9.0,
            _ => 7.0,
        };

        let entities = self.ecs.get_entities_with(&["position"]);
        let mut to_remove = Vec::new();

        for ent in entities {
            let pos = self.ecs.positions.get(&ent).unwrap();
            let dx = pos.x - tx;
            let dy = pos.y - ty;
            let dist = (dx * dx + dy * dy).sqrt();

            if dist <= range {
                match spell_type {
                    "Meteor" => {
                        let has_soc = self.ecs.societies.contains_key(&ent);
                        let has_fauna = self.ecs.faunas.contains_key(&ent);
                        let has_flora = self.ecs.floras.contains_key(&ent);

                        if has_soc {
                            let (soc_name, hit_pop, collapsed) = {
                                let soc = self.ecs.societies.get_mut(&ent).unwrap();
                                let hit = (soc.population * (0.4 + rand::random::<f64>() * 0.4)).floor();
                                soc.population = (soc.population - hit).max(0.0);
                                soc.resources = (soc.resources - 50.0).max(0.0);
                                soc.happiness = (soc.happiness - 40.0).max(0.0);
                                let collapsed = soc.population <= 0.0;
                                (soc.name.clone(), hit, collapsed)
                            };

                            self.add_event_log("SCHISM", format!("Meteor collision incinerated {} population of {}.", hit_pop, soc_name));

                            if let Some(faith) = self.ecs.faiths.get_mut(&ent) {
                                *faith.belief_matrix.entry(FaithSystemType::ELEMENTALISM).or_insert(0.0) += 40.0;
                                *faith.belief_matrix.entry(FaithSystemType::NIHILISM).or_insert(0.0) += 20.0;
                                Self::recalculate_dominance(faith);
                            }

                            if collapsed {
                                to_remove.push(ent.clone());
                                self.add_event_log("SCHISM", format!("Tribe center {} disintegrated in planetary fire.", soc_name));
                            }
                        } else if has_fauna {
                            to_remove.push(ent.clone());
                            let fauna = self.ecs.faunas.get(&ent).unwrap();
                            self.add_event_log("EVOLUTION", format!("Apex wildlife [{}] vanished in flare.", fauna.sub_type));
                        } else if has_flora {
                            to_remove.push(ent.clone());
                        }
                    }
                    "Rainfall" => {
                        if let Some(flora) = self.ecs.floras.get_mut(&ent) {
                            flora.growth = 100.0;
                            flora.is_harvested = false;
                        }
                        if let Some(soc) = self.ecs.societies.get_mut(&ent) {
                            soc.resources += 40.0;
                            soc.happiness = (soc.happiness + 15.0).min(100.0);
                            if let Some(faith) = self.ecs.faiths.get_mut(&ent) {
                                *faith.belief_matrix.entry(FaithSystemType::INTERVENTIONIST).or_insert(0.0) += 15.0;
                                Self::recalculate_dominance(faith);
                            }
                        }
                    }
                    "Fertility Rite" => {
                        if let Some(flora) = self.ecs.floras.get_mut(&ent) {
                            flora.soil_moisture = Some(100.0);
                            flora.soil_nutrients = Some(100.0);
                            flora.pest_level = Some(0.0);
                            flora.disease_active = Some(false);
                            flora.growth = (flora.growth + 30.0).min(100.0);
                        }
                        if let Some(soc) = self.ecs.societies.get_mut(&ent) {
                            soc.resources += 20.0;
                            soc.happiness = (soc.happiness + 10.0).min(100.0);
                            if let Some(faith) = self.ecs.faiths.get_mut(&ent) {
                                *faith.belief_matrix.entry(FaithSystemType::ANIMISM).or_insert(0.0) += 15.0;
                                *faith.belief_matrix.entry(FaithSystemType::INTERVENTIONIST).or_insert(0.0) += 10.0;
                                Self::recalculate_dominance(faith);
                            }
                        }
                    }
                    "Sanctity Aura" => {
                        if let Some(soc) = self.ecs.societies.get_mut(&ent) {
                            soc.happiness = (soc.happiness + 30.0).min(100.0);
                            soc.population += 15.0;
                        }
                        if let Some(faith) = self.ecs.faiths.get_mut(&ent) {
                            *faith.belief_matrix.entry(FaithSystemType::INTERVENTIONIST).or_insert(0.0) += 50.0;
                            *faith.belief_matrix.entry(FaithSystemType::ANIMISM).or_insert(0.0) += 20.0;
                            Self::recalculate_dominance(faith);
                        }
                        if let Some(soc) = self.ecs.societies.get(&ent) {
                            let log_text = format!("Holy Sanctity Aura heals and inspires {}.", soc.name);
                            self.add_event_log("MIRACLE", log_text);
                        }
                        if let Some(fauna) = self.ecs.faunas.get_mut(&ent) {
                            fauna.health = 100.0;
                        }
                    }
                    "Rift Collapse" => {
                        let new_x = (pos.x + (rand::random::<f64>() * 6.0 - 3.0)).clamp(1.0, self.width as f64 - 2.0);
                        let new_y = (pos.y + (rand::random::<f64>() * 6.0 - 3.0)).clamp(1.0, self.height as f64 - 2.0);
                        
                        if let Some(pos_mut) = self.ecs.positions.get_mut(&ent) {
                            pos_mut.x = new_x;
                            pos_mut.y = new_y;
                        }

                        let has_soc = self.ecs.societies.contains_key(&ent);
                        let has_faith = self.ecs.faiths.contains_key(&ent);

                        if has_soc && has_faith {
                            let soc_name = {
                                let soc = self.ecs.societies.get_mut(&ent).unwrap();
                                soc.faction = Faction::NIHILIST;
                                soc.name.clone()
                            };
                            if let Some(faith) = self.ecs.faiths.get_mut(&ent) {
                                *faith.belief_matrix.entry(FaithSystemType::NIHILISM).or_insert(0.0) += 60.0;
                                Self::recalculate_dominance(faith);
                            }
                            self.add_event_log("SCHISM", format!("{} underwent gravitational timeline cascade into secular Null Void.", soc_name));
                        }
                    }
                    _ => {}
                }
            }
        }

        for ent in to_remove {
            self.ecs.remove_entity(&ent);
        }

        if spell_type == "Meteor" {
            self.spawn_flora((tx - 1.0).max(1.0), (ty - 1.0).max(1.0), FloraCategory::EXOTIC, "Ash Glass".to_string());
        } else if spell_type == "Rainfall" {
            self.spawn_flora(tx, ty, FloraCategory::NANO_BANANA, if rand::random::<f64>() < 0.5 { "CYBER".to_string() } else { "DIVINE".to_string() });
            self.set_weather("RAINY", 45.0, 1.0);
        } else if spell_type == "Found Outpost" {
            let active_god = self.active_god_id.unwrap_or(GodId::Aethelgard); // solaris fallback
            let god_faction = match active_god {
                GodId::Sylphra => Faction::ANIMIST,
                GodId::Thalassor => Faction::ELEMENTAL,
                GodId::NullV8 => Faction::TECHNOCRAT,
                GodId::Krigor => Faction::NIHILIST,
                _ => Faction::INTERVENTIONIST,
            };

            let new_tribe_id = self.spawn_tribe(tx, ty, god_faction);
            if let Some(soc) = self.ecs.societies.get_mut(&new_tribe_id) {
                soc.population = 1.0; // SINGLE VILLAGER OUTPOST
                soc.resources = 30.0;
                soc.tier_level = Some(1);
                soc.name = match god_faction {
                    Faction::TECHNOCRAT => "Sector Hermit".to_string(),
                    Faction::ANIMIST => "Lone Druid".to_string(),
                    _ => "Frontier Pioneer".to_string(),
                };
            }
            self.add_event_log("MIRACLE", format!("🛖 Found Outpost: Spawning a Sentinel Outpost with a Single Villager at tile ({}, {})!", tx, ty));
        }

        true
    }

    fn recalculate_dominance(faith: &mut Faith) {
        let mut max_val = -1.0;
        let mut dominant = faith.dominant_system;
        for (key, val) in &faith.belief_matrix {
            if *val > max_val {
                max_val = *val;
                dominant = *key;
            }
        }
        faith.dominant_system = dominant;
    }

    pub fn apply_starting_boost(&mut self, god_id: GodId) {
        self.active_god_id = Some(god_id);
        match god_id {
            GodId::Sylphra => {
                self.total_devotion += 50.0;
                let tribes = self.ecs.get_entities_with(&["society"]);
                for e in tribes {
                    if let Some(soc) = self.ecs.societies.get_mut(&e) {
                        soc.population += 10.0;
                        soc.happiness = (soc.happiness + 15.0).min(100.0);
                    }
                }
                self.add_event_log("EVOLUTION", "Sylphra whispers through the canopies. Mortals feel blessed with deep tranquil safety.".to_string());
            }
            GodId::Vulcanus => {
                let tribes = self.ecs.get_entities_with(&["society", "faith"]);
                for e in tribes {
                    if let Some(soc) = self.ecs.societies.get_mut(&e) {
                        soc.resources += 150.0;
                        soc.technology_level += 0.8;
                    }
                    if let Some(faith) = self.ecs.faiths.get_mut(&e) {
                        *faith.belief_matrix.entry(FaithSystemType::ELEMENTALISM).or_insert(0.0) += 30.0;
                    }
                }
                self.add_event_log("EVOLUTION", "Vulcanus shakes the magma floor. Mortals ignite their forge fires.".to_string());
            }
            GodId::Thalassor => {
                let tribes = self.ecs.get_entities_with(&["society"]);
                for e in tribes {
                    if let Some(soc) = self.ecs.societies.get_mut(&e) {
                        soc.population += 15.0;
                    }
                }
                self.add_event_log("EVOLUTION", "Thalassor calls down the bio-monsoon. Aquatic currents refresh global crops.".to_string());
            }
            GodId::Xylorex => {
                let tribes = self.ecs.get_entities_with(&["faith"]);
                for e in tribes {
                    if let Some(faith) = self.ecs.faiths.get_mut(&e) {
                        faith.belief_matrix.insert(FaithSystemType::ANIMISM, 95.0);
                        faith.dominant_system = FaithSystemType::ANIMISM;
                    }
                }
                self.add_event_log("EVOLUTION", "Xylo-Rex links the subterranean roots. Tribes feel organic consciousness.".to_string());
            }
            GodId::Aethelgard => {
                self.total_devotion += 300.0;
                self.add_event_log("EVOLUTION", "Aethelgard shines gold rays. Solar energy channels into deity reserves.".to_string());
            }
            GodId::NullV8 => {
                let tribes = self.ecs.get_entities_with(&["society", "faith"]);
                for e in tribes {
                    if let Some(soc) = self.ecs.societies.get_mut(&e) {
                        soc.technology_level = 2.5;
                    }
                    if let Some(faith) = self.ecs.faiths.get_mut(&e) {
                        faith.belief_matrix.insert(FaithSystemType::SECULAR, 90.0);
                        faith.dominant_system = FaithSystemType::SECULAR;
                    }
                }
                self.add_event_log("EVOLUTION", "Null-v8 injects silicon firmware. Primitive tribal brains compile logic loops.".to_string());
            }
            GodId::Krigor => {
                for _ in 0..10 {
                    let rx = (rand::random::<f64>() * self.width as f64).floor();
                    let ry = (rand::random::<f64>() * self.height as f64).floor();
                    self.spawn_fauna(rx, ry, FaunaCategory::WOLF, "Krigor Shadow Wolf".to_string());
                }
                let tribes = self.ecs.get_entities_with(&["society"]);
                for e in tribes {
                    if let Some(soc) = self.ecs.societies.get_mut(&e) {
                        soc.happiness = (soc.happiness - 15.0).max(50.0);
                    }
                }
                self.add_event_log("EVOLUTION", "Krigor sharpens tribal bone spears. Ten shadow wolves crawl from the abyss.".to_string());
            }
        }
    }

    pub fn execute_skill(&mut self, skill_id: &str) -> String {
        match skill_id {
            "sylphra_crop_burst" => {
                let floras = self.ecs.get_entities_with(&["flora"]);
                for f in floras {
                    if let Some(flo) = self.ecs.floras.get_mut(&f) {
                        flo.growth = 100.0;
                        flo.is_harvested = false;
                    }
                }
                "Zephyr's Breath swept the lands. All biological flora reached full, ripe maturity instantly.".to_string()
            }
            "sylphra_animist_bloom" => {
                let tribes = self.ecs.get_entities_with(&["faith"]);
                for t in tribes {
                    if let Some(faith) = self.ecs.faiths.get_mut(&t) {
                        *faith.belief_matrix.entry(FaithSystemType::ANIMISM).or_insert(0.0) = (faith.belief_matrix.get(&FaithSystemType::ANIMISM).unwrap_or(&0.0) + 25.0).min(100.0);
                        Self::recalculate_dominance(faith);
                    }
                }
                "Whispering Canopy connected the minds of mortals. Natural Animism rose dramatically.".to_string()
            }
            "sylphra_foliage_aegis" => {
                for _ in 0..4 {
                    let rx = 10.0 + (rand::random::<f64>() * 44.0).floor();
                    let ry = 10.0 + (rand::random::<f64>() * 44.0).floor();
                    self.spawn_flora(rx, ry, FloraCategory::CROP, "Hyper Barley".to_string());
                }
                let rx = 20.0 + (rand::random::<f64>() * 24.0).floor();
                let ry = 20.0 + (rand::random::<f64>() * 24.0).floor();
                self.spawn_structure(rx, ry, StructureCategory::ALTAR, "Leafward Shrine".to_string());
                "Foliage Aegis manifested heavy crops and a leafy Altar to protect the faithful.".to_string()
            }
            "sylphra_vernal_sanctuary" => {
                let tribes = self.ecs.get_entities_with(&["society", "position"]);
                for t in tribes {
                    let pos = self.ecs.positions.get(&t).unwrap().clone();
                    let rx = (pos.x + (rand::random::<f64>() * 6.0 - 3.0)).clamp(2.0, 61.0);
                    let ry = (pos.y + (rand::random::<f64>() * 6.0 - 3.0)).clamp(2.0, 61.0);
                    self.spawn_flora(rx, ry, FloraCategory::NANO_BANANA, "DIVINE".to_string());
                }
                "Vernal Sanctuary completed. Holy Divine Bananas appeared around all mortal borders.".to_string()
            }
            "vulcanus_fissure" => {
                for _ in 0..2 {
                    let rx = 15.0 + (rand::random::<f64>() * 34.0).floor();
                    let ry = 15.0 + (rand::random::<f64>() * 34.0).floor();
                    self.spawn_flora(rx, ry, FloraCategory::NANO_BANANA, "FIRE".to_string());
                }
                "Magmatic steam geysers burst! Rare Pyromaniac Fire Bananas were extracted from the mantle.".to_string()
            }
            "vulcanus_smelter" => {
                let tribes = self.ecs.get_entities_with(&["society"]);
                for t in tribes {
                    if let Some(soc) = self.ecs.societies.get_mut(&t) {
                        soc.resources += 200.0;
                    }
                }
                "Heavy metals condensed! Obsidian furnaces added +200 resources to all active tribes.".to_string()
            }
            "vulcanus_igneous_surge" => {
                let faith_list = self.ecs.get_entities_with(&["faith"]);
                for t in faith_list {
                    if let Some(faith) = self.ecs.faiths.get_mut(&t) {
                        *faith.belief_matrix.entry(FaithSystemType::ELEMENTALISM).or_insert(0.0) = (faith.belief_matrix.get(&FaithSystemType::ELEMENTALISM).unwrap_or(&0.0) + 40.0).min(100.0);
                        Self::recalculate_dominance(faith);
                    }
                }
                "Core magma surged! All tribes now worship the raw elements of heat and power.".to_string()
            }
            "vulcanus_tectonic_prominence" => {
                for _ in 0..5 {
                    let rx = 10.0 + (rand::random::<f64>() * 44.0).floor();
                    let ry = 10.0 + (rand::random::<f64>() * 44.0).floor();
                    self.spawn_flora(rx, ry, FloraCategory::EXOTIC, "Ash Glass".to_string());
                }
                "Tectonic pressure crystallized. 5 highly valuable Ash Glass nodes arose from molten basalt.".to_string()
            }
            "thalassor_tide" => {
                let tribes = self.ecs.get_entities_with(&["society"]);
                for t in tribes {
                    if let Some(soc) = self.ecs.societies.get_mut(&t) {
                        soc.resources += 40.0;
                    }
                }
                "Tidal moisture condensed in mortal storages, yielding +40 organic crops and resources.".to_string()
            }
            "thalassor_bio_light" => {
                let list = self.ecs.get_entities_with(&["movement"]);
                for m in list {
                    if let Some(mv) = self.ecs.movements.get_mut(&m) {
                        mv.speed += 1.5;
                    }
                }
                "Deep water enzymes ingested by tribes! Gathering and movement speeds increased by +1.5 permanently.".to_string()
            }
            "thalassor_blessing" => {
                let tribes = self.ecs.get_entities_with(&["society", "position"]);
                for t in tribes {
                    let pos = self.ecs.positions.get(&t).unwrap().clone();
                    if let Some(soc) = self.ecs.societies.get_mut(&t) {
                        soc.happiness = soc.happiness.max(95.0);
                    }
                    self.spawn_flora(pos.x, pos.y, FloraCategory::NANO_BANANA, "GLACIAL".to_string());
                }
                "Abyssal moisture blanketed the settlements. Mortal joy stabilized at 95% with holy rains.".to_string()
            }
            "thalassor_aquatic_genesis" => {
                for _ in 0..6 {
                    let rx = 15.0 + (rand::random::<f64>() * 34.0).floor();
                    let ry = 15.0 + (rand::random::<f64>() * 34.0).floor();
                    self.spawn_flora(rx, ry, FloraCategory::CROP, "Ocean Barley".to_string());
                }
                for _ in 0..2 {
                    let rx = 20.0 + (rand::random::<f64>() * 24.0).floor();
                    let ry = 20.0 + (rand::random::<f64>() * 24.0).floor();
                    self.spawn_fauna(rx, ry, FaunaCategory::STAG, "Celestial Sea Stag".to_string());
                }
                "Oceanic Genesis activated. Bioluminescent crops and sea stags arose on flooded coastlines.".to_string()
            }
            "xylorex_spore" => {
                for _ in 0..4 {
                    let rx = 10.0 + (rand::random::<f64>() * 44.0).floor();
                    let ry = 10.0 + (rand::random::<f64>() * 44.0).floor();
                    self.spawn_fauna(rx, ry, FaunaCategory::STAG, "Mossy Meadow Stag".to_string());
                }
                for _ in 0..10 {
                    let rx = (rand::random::<f64>() * 64.0).floor();
                    let ry = (rand::random::<f64>() * 64.0).floor();
                    self.spawn_flora(rx, ry, FloraCategory::TREE, "Ancient Oak".to_string());
                }
                "Spore Bloom completed. Four glowing wild stags and ten dense oak forests materialized.".to_string()
            }
            "xylorex_moss_siphon" => {
                self.total_devotion += 120.0;
                "Moss Siphon complete. Absorbed global microflora energy to acquire +120 Divine Devotion.".to_string()
            }
            "xylorex_mycelium" => {
                let list = self.ecs.get_entities_with(&["society", "movement"]);
                for e in list {
                    if let Some(mv) = self.ecs.movements.get_mut(&e) {
                        mv.speed += 2.0;
                    }
                    if let Some(soc) = self.ecs.societies.get_mut(&e) {
                        soc.happiness = (soc.happiness + 15.0).min(100.0);
                    }
                }
                "Mycelium network active. Mortal footfalls are lightened, boosting gathering speed and community joy.".to_string()
            }
            "xylorex_avatar" => {
                let rx = 20.0 + (rand::random::<f64>() * 24.0).floor();
                let ry = 20.0 + (rand::random::<f64>() * 24.0).floor();
                self.spawn_flora(rx, ry, FloraCategory::NANO_BANANA, "DIVINE".to_string());
                
                let tree_list = self.ecs.get_entities_with(&["flora"]);
                for t in tree_list {
                    if let Some(fl) = self.ecs.floras.get_mut(&t) {
                        fl.resources_yield *= 2.0;
                    }
                }
                "The Sylvan Avatar manifested an ancient holy tree. All crop resource yields doubled permanently!".to_string()
            }
            "aethelgard_flare" => {
                let faith_list = self.ecs.get_entities_with(&["faith"]);
                for f in faith_list {
                    if let Some(faith) = self.ecs.faiths.get_mut(&f) {
                        *faith.belief_matrix.entry(FaithSystemType::INTERVENTIONIST).or_insert(0.0) = (faith.belief_matrix.get(&FaithSystemType::INTERVENTIONIST).unwrap_or(&0.0) + 30.0).min(100.0);
                        Self::recalculate_dominance(faith);
                    }
                }
                "Holy solar rays purged lingering doubts. Factions gain +30 Interventionist faith.".to_string()
            }
            "aethelgard_altar_ascension" => {
                let list = self.ecs.get_entities_with(&["structure"]);
                for s in list {
                    if let Some(st) = self.ecs.structures.get_mut(&s) {
                        st.efficiency += 0.50;
                    }
                }
                "Altar Ascension finalized. All temple and shrine structures gain +50% prayer focusing efficacy.".to_string()
            }
            "aethelgard_sacrament" => {
                let list = self.ecs.get_entities_with(&["society"]);
                for e in list {
                    if let Some(soc) = self.ecs.societies.get_mut(&e) {
                        soc.happiness = 100.0;
                        soc.resources += 100.0;
                    }
                }
                "Gilded Sacrament completed. Golden solar crowns descended, maxing mortal happiness with resource bonuses.".to_string()
            }
            "aethelgard_apotheosis" => {
                for _ in 0..2 {
                    let rx = 15.0 + (rand::random::<f64>() * 34.0).floor();
                    let ry = 15.0 + (rand::random::<f64>() * 34.0).floor();
                    self.spawn_structure(rx, ry, StructureCategory::ALTAR, "Gilded Monument".to_string());
                }
                self.total_devotion += 300.0;
                "Apotheosis completed! Two stellar golden Altars erected, and believers channelled +300 devotion.".to_string()
            }
            "null_silicon" => {
                let list = self.ecs.get_entities_with(&["society"]);
                for t in list {
                    if let Some(soc) = self.ecs.societies.get_mut(&t) {
                        soc.technology_level += 0.7;
                    }
                }
                "Silicon mind expansion completed! Advanced cybernetic ideas raised global technology scales by +0.7.".to_string()
            }
            "null_scientific_method" => {
                let list = self.ecs.get_entities_with(&["society", "faith"]);
                for e in list {
                    let is_secular = self.ecs.faiths.get(&e).map(|f| f.dominant_system == FaithSystemType::SECULAR).unwrap_or(false);
                    if is_secular {
                        if let Some(soc) = self.ecs.societies.get_mut(&e) {
                            soc.resources += 150.0;
                        }
                    }
                }
                "Scientific revolution enacted. Empirical groups achieved +150 resources via rapid mechanical synthesis.".to_string()
            }
            "null_lattice" => {
                let list = self.ecs.get_entities_with(&["movement", "society"]);
                for e in list {
                    if let Some(mv) = self.ecs.movements.get_mut(&e) {
                        mv.speed += 3.0;
                    }
                    if let Some(soc) = self.ecs.societies.get_mut(&e) {
                        soc.resources += 50.0;
                    }
                }
                "Quantum fiber optic lines aligned. All cyber-entities execute commands with supercharged speed.".to_string()
            }
            "null_singularity" => {
                let list = self.ecs.get_entities_with(&["society", "faith"]);
                for e in list {
                    let is_secular = self.ecs.faiths.get(&e).map(|f| f.dominant_system == FaithSystemType::SECULAR).unwrap_or(false);
                    if is_secular {
                        if let Some(soc) = self.ecs.societies.get_mut(&e) {
                            soc.technology_level += 3.5;
                            soc.happiness = 100.0;
                        }
                    }
                }
                "Silicon Singularity surpassed! Scientific tribes converted to automated machine consciousness.".to_string()
            }
            "krigor_frenzy" => {
                let list = self.ecs.get_entities_with(&["fauna", "movement"]);
                for e in list {
                    let is_wolf = self.ecs.faunas.get(&e).map(|f| f.category == FaunaCategory::WOLF).unwrap_or(false);
                    if is_wolf {
                        if let Some(mv) = self.ecs.movements.get_mut(&e) {
                            mv.speed += 4.0;
                        }
                        if let Some(f) = self.ecs.faunas.get_mut(&e) {
                            f.hunger = 100.0;
                        }
                    }
                }
                "Blood Frenzy activated. Wolves howl in madness, sprinting to maul tribal colonies.".to_string()
            }
            "krigor_warriors" => {
                let list = self.ecs.get_entities_with(&["society", "faith"]);
                for e in list {
                    let is_secular = self.ecs.faiths.get(&e).map(|f| f.dominant_system == FaithSystemType::SECULAR).unwrap_or(false);
                    if !is_secular {
                        if let Some(soc) = self.ecs.societies.get_mut(&e) {
                            soc.population += 20.0;
                        }
                    }
                }
                "Glaive warbands recruited! +20 expansionists joined non-secular societies.".to_string()
            }
            "krigor_attrition" => {
                let list = self.ecs.get_entities_with(&["society"]);
                for e in list {
                    if let Some(soc) = self.ecs.societies.get_mut(&e) {
                        let sacrifice = (soc.population * 0.15).floor();
                        soc.population = (soc.population - sacrifice).max(15.0);
                        soc.technology_level += 1.1;
                    }
                }
                "Mortal Tribulation complete. Sacrificed weaker members to construct tactical iron smelting engines.".to_string()
            }
            "krigor_doomsday" => {
                for _ in 0..3 {
                    let rx = 10.0 + (rand::random::<f64>() * 44.0).floor();
                    let ry = 10.0 + (rand::random::<f64>() * 44.0).floor();
                    self.spawn_flora(rx, ry, FloraCategory::NANO_BANANA, "TOXIC".to_string());
                }

                // Drop meteor on largest secular tribe
                let tribes = self.ecs.get_entities_with(&["society", "position", "faith"]);
                let mut best_target = None;
                let mut max_pop = -1.0;
                
                for t in tribes {
                    let is_secular = self.ecs.faiths.get(&t).map(|f| f.dominant_system == FaithSystemType::SECULAR).unwrap_or(false);
                    if is_secular {
                        let pop = self.ecs.societies.get(&t).unwrap().population;
                        if pop > max_pop {
                            max_pop = pop;
                            best_target = Some(t);
                        }
                    }
                }

                if let Some(target) = best_target {
                    let pos = self.ecs.positions.get(&target).unwrap().clone();
                    self.trigger_localized_spell("Meteor", pos.x, pos.y);
                }
                "Doomsday Split triggered tectonic fission. Toxic bananas seeded and Meteor strike initiated.".to_string()
            }
            _ => "Unknown skill ID triggered".to_string(),
        }
    }

    pub fn update(&mut self, dt: f64) {
        // --- 0. Update climate/weather parameters ---
        self.update_weather(dt);

        // --- 1. Movement interpolation loop ---
        self.update_movement(dt);

        // --- 2. Flora growth cycle ---
        self.update_flora(dt);

        // --- 3. Tribe / Society progression updates ---
        self.update_societies(dt);

        // --- 4. Wildlife updates (wolf packs/hunger/starving stags) ---
        self.update_wildlife(dt);
    }

    fn update_weather(&mut self, dt: f64) {
        self.weather_time_left -= dt;
        if self.weather_time_left <= 0.0 {
            let choices = vec!["CLEAR", "CLEAR", "RAINY", "RAINY", "DROUGHT", "TEMPEST", "AURORA"];
            let idx = (rand::random::<f64>() * choices.len() as f64).floor() as usize;
            let chosen = choices[idx];
            self.set_weather(chosen, 35.0 + (rand::random::<f64>() * 30.0).floor(), 0.4 + rand::random::<f64>() * 0.6);
        }

        let physics_entities = self.ecs.get_entities_with(&["physics"]);
        for e in physics_entities {
            if let Some(p) = self.ecs.physics.get_mut(&e) {
                let rate = 0.05 * dt;
                p.temperature += (self.global_temperature - p.temperature) * rate;
                p.humidity += (self.global_humidity - p.humidity) * rate;
                p.temperature = p.temperature.clamp(0.0, 100.0);
                p.humidity = p.humidity.clamp(0.0, 100.0);
            }
        }

        let societies = self.ecs.get_entities_with(&["society", "position"]);
        let floras = self.ecs.get_entities_with(&["flora", "position", "biology"]);
        let faunas = self.ecs.get_entities_with(&["fauna", "biology"]);

        match self.weather.as_str() {
            "RAINY" => {
                for e in societies {
                    let has_faith = self.ecs.faiths.contains_key(&e);
                    let has_soc = self.ecs.societies.contains_key(&e);
                    let has_pos = self.ecs.positions.contains_key(&e);

                    if has_faith && has_soc && has_pos {
                        let faith = self.ecs.faiths.get_mut(&e).unwrap();
                        let soc = self.ecs.societies.get_mut(&e).unwrap();
                        let pos = self.ecs.positions.get(&e).unwrap().clone();

                        if faith.dominant_system == FaithSystemType::ANIMISM || soc.faction == Faction::ANIMIST {
                            soc.happiness = (soc.happiness + 1.2 * dt).min(100.0);
                            self.total_devotion += 0.35 * dt;
                            faith.devotion += 0.25 * dt;

                            if rand::random::<f64>() < 0.04 * dt {
                                let range = 6.0;
                                let sx = (pos.x + (rand::random::<f64>() * range * 2.0 - range)).clamp(1.0, self.width as f64 - 2.0);
                                let sy = (pos.y + (rand::random::<f64>() * range * 2.0 - range)).clamp(1.0, self.height as f64 - 2.0);
                                
                                // check proximity
                                if self.get_entity_at(sx, sy).is_none() {
                                    self.spawn_flora(sx, sy, FloraCategory::NANO_BANANA, "GOLD".to_string());
                                    self.add_event_log("EVOLUTION", format!("Holy rain triggers custom Golden Nano Banana sprout at ({}, {})!", sx.round(), sy.round()));
                                }
                            }
                        }
                    }
                }

                for f in floras {
                    if let (Some(flo), Some(bio)) = (self.ecs.floras.get_mut(&f), self.ecs.biologies.get_mut(&f)) {
                        bio.biomass = (bio.biomass + 6.0 * dt).min(250.0);
                        if flo.is_harvested {
                            flo.growth = (flo.growth + 9.0 * dt).min(100.0);
                            if flo.growth >= 100.0 {
                                flo.is_harvested = false;
                            }
                        } else {
                            flo.resources_yield = (flo.resources_yield + 1.5 * dt).min(100.0);
                        }
                    }
                }
            }
            "DROUGHT" => {
                for f in floras {
                    if let (Some(flo), Some(bio)) = (self.ecs.floras.get_mut(&f), self.ecs.biologies.get_mut(&f)) {
                        bio.biomass = (bio.biomass - 5.0 * dt).max(10.0);
                        if bio.biomass <= 20.0 {
                            flo.resources_yield = (flo.resources_yield - 3.5 * dt).max(5.0);
                        }
                    }
                }

                for f in faunas {
                    if let (Some(fauna), Some(bio)) = (self.ecs.faunas.get_mut(&f), self.ecs.biologies.get_mut(&f)) {
                        fauna.hunger = (fauna.hunger + 4.0 * dt).min(100.0);
                        bio.health = (bio.health - 1.5 * dt).max(30.0);
                        if fauna.category == FaunaCategory::WOLF {
                            fauna.aggressiveness = (fauna.aggressiveness + 10.0 * dt).min(100.0);
                        }
                    }
                }

                for e in societies {
                    if let (Some(soc), Some(bio)) = (self.ecs.societies.get_mut(&e), self.ecs.biologies.get_mut(&e)) {
                        soc.resources = (soc.resources - 2.0 * dt).max(0.0);
                        soc.happiness = (soc.happiness - 2.5 * dt).max(20.0);
                        bio.health = (bio.health - 1.0 * dt).max(40.0);
                    }
                }
            }
            "TEMPEST" => {
                if rand::random::<f64>() < 0.12 * dt {
                    let tx = (rand::random::<f64>() * self.width as f64).floor();
                    let ty = (rand::random::<f64>() * self.height as f64).floor();
                    
                    if let Some((hit_id, cat, _)) = self.get_entity_at(tx, ty) {
                        let shield_factor = if self.unlocked_illuminations.contains(&"tempest_insulation".to_string()) { 0.0 } else { 1.0 };
                        if cat == "Tribe" {
                            let (soc_name, faction, population) = {
                                let soc = self.ecs.societies.get(&hit_id).unwrap();
                                (soc.name.clone(), soc.faction, soc.population)
                            };
                            if faction != Faction::TECHNOCRAT {
                                let loss = (((population).min(3.0 + rand::random::<f64>() * 5.0).floor()) * shield_factor) as f64;
                                if loss > 0.0 {
                                    if let Some(soc) = self.ecs.societies.get_mut(&hit_id) {
                                        soc.population = (soc.population - loss).max(5.0);
                                        soc.happiness = (soc.happiness - 10.0).max(0.0);
                                    }
                                    self.add_event_log("SCHISM", format!("Spatial lightning strike hits {}, claiming {} mortals.", soc_name, loss));
                                } else {
                                    self.add_event_log("MIRACLE", format!("Kinetic Shield absorbed spatial lightning strike targeted at {}.", soc_name));
                                }
                            } else {
                                let technocrat_gains = if self.unlocked_illuminations.contains(&"tempest_insulation".to_string()) { 55.0 } else { 25.0 };
                                if let Some(soc) = self.ecs.societies.get_mut(&hit_id) {
                                    soc.resources += technocrat_gains;
                                }
                                self.add_event_log("MIRACLE", format!("{} grid capacitor absorbed strike (+{} energy resources).", soc_name, technocrat_gains));
                            }
                        } else if cat.starts_with("Structure") {
                            let damage = if self.unlocked_illuminations.contains(&"tempest_insulation".to_string()) { 10.0 } else { 30.0 };
                            if let Some(str_comp) = self.ecs.structures.get_mut(&hit_id) {
                                str_comp.durability = (str_comp.durability - damage).max(10.0);
                            }
                            self.add_event_log("SCHISM", format!("Lightning impact hit Structure [GUID: {}] decreasing durability (-{}% durability).", hit_id, damage));
                        }
                    }
                }

                for e in societies {
                    if let (Some(faith), Some(soc)) = (self.ecs.faiths.get_mut(&e), self.ecs.societies.get_mut(&e)) {
                        if faith.dominant_system == FaithSystemType::INTERVENTIONIST {
                            self.total_devotion += 0.9 * dt;
                            faith.devotion += 0.5 * dt;
                            soc.happiness = (soc.happiness - 0.6 * dt).max(10.0);
                        }
                    }
                }
            }
            "AURORA" => {
                self.total_devotion += 1.8 * dt;
                let societies = self.ecs.get_entities_with(&["faith"]);
                for e in societies {
                    if let Some(faith) = self.ecs.faiths.get_mut(&e) {
                        *faith.belief_matrix.entry(FaithSystemType::ELEMENTALISM).or_insert(0.0) = (faith.belief_matrix.get(&FaithSystemType::ELEMENTALISM).unwrap_or(&0.0) + 1.5 * dt).min(100.0);
                        *faith.belief_matrix.entry(FaithSystemType::ANIMISM).or_insert(0.0) = (faith.belief_matrix.get(&FaithSystemType::ANIMISM).unwrap_or(&0.0) + 1.0 * dt).min(100.0);
                        Self::recalculate_dominance(faith);
                    }
                }
            }
            _ => {}
        }
    }

    fn update_movement(&mut self, dt: f64) {
        let moving_entities = self.ecs.get_entities_with(&["position", "movement"]);
        for e in moving_entities {
            let pos = self.ecs.positions.get(&e).unwrap().clone();
            let mut pos_mut = self.ecs.positions.get_mut(&e).unwrap();
            let mut mv = self.ecs.movements.get_mut(&e).unwrap();

            if let (Some(tx), Some(ty)) = (mv.target_x, mv.target_y) {
                let dx = tx - pos.x;
                let dy = ty - pos.y;
                let dist = (dx * dx + dy * dy).sqrt();

                if dist < 0.25 {
                    pos_mut.x = tx;
                    pos_mut.y = ty;
                    mv.target_x = None;
                    mv.target_y = None;
                    mv.vx = 0.0;
                    mv.vy = 0.0;

                    if mv.activity_state == ActivityState::MOVING_TO_RESOURCE || mv.activity_state == ActivityState::PRAYING {
                        mv.activity_state = ActivityState::IDLE;
                    }
                } else {
                    let velocity_mod = if self.unlocked_illuminations.contains(&"feline_grace".to_string()) { 1.30 } else { 1.0 };
                    let step = mv.speed * velocity_mod * dt;
                    pos_mut.x += (dx / dist) * step.min(dist);
                    pos_mut.y += (dy / dist) * step.min(dist);
                    mv.vx = (dx / dist) * mv.speed * velocity_mod;
                    mv.vy = (dy / dist) * mv.speed * velocity_mod;
                }
            } else {
                if rand::random::<f64>() < 0.08 * dt {
                    let wander_distance = 5.0;
                    let target_x = (pos.x + (rand::random::<f64>() * wander_distance * 2.0 - wander_distance)).clamp(1.0, self.width as f64 - 2.0);
                    let target_y = (pos.y + (rand::random::<f64>() * wander_distance * 2.0 - wander_distance)).clamp(1.0, self.height as f64 - 2.0);
                    mv.target_x = Some(target_x);
                    mv.target_y = Some(target_y);
                    mv.activity_state = ActivityState::WANDERING;
                }
            }
        }
    }

    fn update_flora(&mut self, dt: f64) {
        let mut growth_mult = 1.0;
        if let Some(GodId::Sylphra) = self.active_god_id {
            growth_mult = 1.5;
        }
        if self.unlocked_illuminations.contains(&"growth_catalyst".to_string()) {
            growth_mult += 0.35;
        }

        let floras = self.ecs.get_entities_with(&["flora", "position"]);
        let structures = self.ecs.get_entities_with(&["structure", "position"]);

        for f in floras {
            let pos = self.ecs.positions.get(&f).unwrap().clone();
            let mut flora = self.ecs.floras.get(&f).unwrap().clone();

            // Safe defaults fallbacks
            let soil_moisture = flora.soil_moisture.get_or_insert(60.0);
            let soil_nutrients = flora.soil_nutrients.get_or_insert(70.0);
            let pest_level = flora.pest_level.get_or_insert(5.0);
            let disease_active = flora.disease_active.get_or_insert(false);
            let cultivar_tier = flora.cultivar_tier.get_or_insert(1);

            let mut irrigation_tower_boost = false;
            for str_ent in &structures {
                let str_comp = self.ecs.structures.get(str_ent).unwrap();
                let s_pos = self.ecs.positions.get(str_ent).unwrap();
                let is_irrigator = str_comp.sub_type == "Hydro-Bay Dome" || str_comp.sub_type == "Terratech Greenhouse";
                if is_irrigator {
                    let d = ((s_pos.x - pos.x) * (s_pos.x - pos.x) + (s_pos.y - pos.y) * (s_pos.y - pos.y)).sqrt();
                    if d <= 8.5 {
                        irrigation_tower_boost = true;
                    }
                }
            }

            let mut moisture_delta = -2.5;
            match self.weather.as_str() {
                "RAINY" | "TEMPEST" => moisture_delta += 18.0,
                "DROUGHT" => moisture_delta -= 8.5,
                "CLEAR" => moisture_delta -= 0.5,
                _ => {}
            }

            if irrigation_tower_boost {
                moisture_delta += 24.0;
                *soil_nutrients = (*soil_nutrients + 2.0 * dt).min(100.0);
                *pest_level = (*pest_level - 12.0 * dt).max(0.0);
                if rand::random::<f64>() < 0.12 * dt {
                    *disease_active = false;
                }
            }

            *soil_moisture = (*soil_moisture + moisture_delta * dt).clamp(0.0, 100.0);

            if *soil_moisture > 70.0 && self.global_temperature > 22.0 && !irrigation_tower_boost {
                *pest_level = (*pest_level + 3.0 * dt).min(100.0);
            } else {
                *pest_level = (*pest_level - 2.0 * dt).max(0.0);
            }

            if *pest_level > 40.0 && rand::random::<f64>() < 0.006 * dt && !irrigation_tower_boost {
                *disease_active = true;
            }

            let moisture_factor = if *soil_moisture > 15.0 && *soil_moisture < 85.0 { 1.25 } else if *soil_moisture <= 15.0 || *soil_moisture >= 85.0 { 0.35 } else { 1.0 };
            let nutrient_factor = *soil_nutrients / 70.0;
            let pest_factor = (1.0 - *pest_level / 100.0).max(0.15);
            let disease_factor = if *disease_active { 0.25 } else { 1.0 };

            let biological_growth_factor = moisture_factor * nutrient_factor * pest_factor * disease_factor;
            let combined_growth_rate = growth_mult * biological_growth_factor;

            // Crop Cultivar Mutation upgrade
            if *soil_moisture > 50.0 && *soil_moisture < 80.0 && *soil_nutrients > 75.0 && *pest_level < 15.0 && !*disease_active {
                if rand::random::<f64>() < 0.015 * dt && *cultivar_tier < 5 {
                    *cultivar_tier += 1;
                    flora.resources_yield = (flora.resources_yield * 1.35).floor();
                    self.add_event_log("EVOLUTION", format!("🌱 Gen-Enrichment mutation! Crop at ({}, {}) upgraded to Cultivar Tier {}!", pos.x.round(), pos.y.round(), cultivar_tier));
                }
            }

            if flora.is_harvested {
                flora.growth += 6.0 * combined_growth_rate * dt;
                if flora.growth >= 100.0 {
                    flora.growth = 100.0;
                    flora.is_harvested = false;
                }
            } else if flora.growth < 100.0 {
                flora.growth = (flora.growth + 2.0 * combined_growth_rate * dt).min(100.0);
                *soil_nutrients = (*soil_nutrients - 1.5 * combined_growth_rate * dt).max(5.0);
            }

            *self.ecs.floras.get_mut(&f).unwrap() = flora;
        }
    }

    fn update_societies(&mut self, dt: f64) {
        let societies = self.ecs.get_entities_with(&["society", "faith", "position", "movement"]);
        let structures = self.ecs.get_entities_with(&["structure", "position"]);
        let herbivore_entities = self.ecs.get_entities_with(&["fauna", "position"]);

        let mut to_remove = Vec::new();

        for e in societies {
            let pos = self.ecs.positions.get(&e).unwrap().clone();
            
            // Check extinction
            {
                let soc = self.ecs.societies.get(&e).unwrap();
                if soc.population <= 0.0 {
                    to_remove.push(e.clone());
                    let name_clean = soc.name.split('[').next().unwrap().trim().to_string();
                    self.add_event_log("SCHISM", format!("💀 EXTINCTION: The final citizen of {} has passed. The settlement is lost to the elements.", name_clean));
                    continue;
                }
            }

            let mut soc = self.ecs.societies.get(&e).unwrap().clone();
            let mut faith = self.ecs.faiths.get(&e).unwrap().clone();
            let mut mv = self.ecs.movements.get(&e).unwrap().clone();

            // Tier system
            let get_tier_for_pop = |pop: f64| -> u32 {
                if pop >= 4000.0 { 8 }
                else if pop >= 1500.0 { 7 }
                else if pop >= 500.0 { 6 }
                else if pop >= 150.0 { 5 }
                else if pop >= 50.0 { 4 }
                else if pop >= 25.0 { 3 }
                else if pop >= 10.0 { 2 }
                else { 1 }
            };

            let get_tier_title = |tier: u32| -> &'static str {
                match tier {
                    8 => "👑 Sovereign Cosmic Empire",
                    7 => "🌌 Sprawling Metropolis",
                    6 => "⛪ Capital City",
                    5 => "🏛️ Sovereign Town",
                    4 => "🏰 Cohesive Village",
                    3 => "🏡 Settled Hamlet",
                    2 => "⛺ Pioneer Clan",
                    _ => "🛖 Sentinel Outpost",
                }
            };

            let calculated_tier = get_tier_for_pop(soc.population);
            let prev_tier = soc.tier_level.unwrap_or(1);
            if soc.tier_level.is_none() {
                soc.tier_level = Some(calculated_tier);
            } else if prev_tier != calculated_tier {
                soc.tier_level = Some(calculated_tier);
                let prev_title = get_tier_title(prev_tier);
                let next_title = get_tier_title(calculated_tier);
                let tribe_name = soc.name.split('[').next().unwrap().trim();

                if calculated_tier > prev_tier {
                    self.add_event_log("EVOLUTION", format!("🎉 High Ascension! {} advanced from {} to {}! All citizens celebrate.", tribe_name, prev_title, next_title));
                    soc.resources += calculated_tier as f64 * 30.0;
                } else {
                    self.add_event_log("SCHISM", format!("📉 Grid Decay: {} collapsed from {} down to {} due to population decay.", tribe_name, prev_title, next_title));
                }
            }

            let current_tier = soc.tier_level.unwrap_or(1);
            let mut local_gathering_bonus = 1.0;
            let mut local_hunting_bonus = 1.0;
            let mut local_research_bonus = 1.0;
            let mut automatic_defense_active = false;

            if current_tier == 1 {
                mv.speed = 4.2; // faster escape speed
            }
            if current_tier >= 2 { local_gathering_bonus += 0.15; }
            if current_tier >= 3 { local_hunting_bonus += 0.25; }
            if current_tier >= 4 {
                local_research_bonus += 0.25;
                automatic_defense_active = true;
            }
            if current_tier >= 5 {
                local_gathering_bonus += 0.20;
                local_hunting_bonus += 0.15;
            }
            if current_tier >= 6 { local_research_bonus += 0.35; }
            if current_tier >= 7 {
                soc.resources += 3.0 * dt;
                faith.devotion += 1.0 * dt;
                self.total_devotion += 1.0 * dt;
            }
            if current_tier >= 8 {
                soc.resources += 8.0 * dt;
                faith.devotion += 3.0 * dt;
                self.total_devotion += 3.0 * dt;
                soc.happiness = soc.happiness.max(50.0);
            }

            // Sentry defense
            if automatic_defense_active {
                let wolves = self.ecs.get_entities_with(&["fauna", "position"]);
                for w in wolves {
                    let w_is_wolf = self.ecs.faunas.get(&w).map(|f| f.category == FaunaCategory::WOLF).unwrap_or(false);
                    if w_is_wolf {
                        let w_pos = self.ecs.positions.get(&w).unwrap();
                        let d = ((w_pos.x - pos.x) * (w_pos.x - pos.x) + (w_pos.y - pos.y) * (w_pos.y - pos.y)).sqrt();
                        if d < 8.0 {
                             let mut f_comp = self.ecs.faunas.get(&w).unwrap().clone();
                             f_comp.health = (f_comp.health - 30.0 * dt).max(0.0);
                             
                             // Push away
                             let dx = w_pos.x - pos.x;
                             let dy = w_pos.y - pos.y;
                             let angle = dy.atan2(dx);
                             if let Some(w_pos_mut) = self.ecs.positions.get_mut(&w) {
                                 w_pos_mut.x = (w_pos_mut.x + angle.cos() * 4.0 * dt).clamp(1.0, self.width as f64 - 2.0);
                                 w_pos_mut.y = (w_pos_mut.y + angle.sin() * 4.0 * dt).clamp(1.0, self.height as f64 - 2.0);
                             }

                             if rand::random::<f64>() < 0.02 * dt {
                                 self.add_event_log("EVOLUTION", format!("🛡️ Perimeter Alert: {} sentry guards fired cross-bolts, driving wolves away.", soc.name));
                             }

                             if f_comp.health <= 0.0 {
                                 self.ecs.remove_entity(&w);
                                 self.add_event_log("EVOLUTION", format!("💀 Threat Slain: Elite garrison defense of {} neutralized the timberwolf pack.", soc.name));
                             } else {
                                 *self.ecs.faunas.get_mut(&w).unwrap() = f_comp;
                             }
                        }
                    }
                }
            }

            let consumption_mult = if soc.ration_mode.unwrap_or(false) { 0.5 } else { 1.0 };
            if soc.ration_mode.unwrap_or(false) {
                soc.happiness = (soc.happiness - 1.5 * dt).max(10.0);
            }
            if soc.strip_mine_mode.unwrap_or(false) {
                soc.happiness = (soc.happiness - 1.0 * dt).max(10.0);
            }

            // Tithe conversion
            if soc.tithe_mode.unwrap_or(false) && soc.resources > 20.0 {
                let tithe_amount = (soc.resources - 20.0).min(1.5 * dt);
                if tithe_amount > 0.0 {
                    soc.resources -= tithe_amount;
                    let mut dev_gained = tithe_amount * 1.5;
                    if current_tier >= 8 {
                        dev_gained *= 2.0;
                    }
                    faith.devotion += dev_gained;
                    self.total_devotion += dev_gained;
                }
            }

            // Starvationneed
            if soc.resources < 15.0 {
                let starve_factor = (15.0 - soc.resources) / 15.0;
                let lost_pop = soc.population * 0.04 * starve_factor * dt;
                soc.population = (soc.population - lost_pop).max(0.0);
                soc.happiness = (soc.happiness - 12.0 * starve_factor * dt).max(10.0);
                if rand::random::<f64>() < 0.02 * dt && lost_pop > 0.1 {
                    self.add_event_log("SCHISM", format!("Resource crisis! Hunger causing disease/starvation in {}.", soc.name));
                }
            } else {
                let growth_bonus = (soc.resources / 100.0).min(2.0);
                let mut pop_growth = soc.resources * 0.006 * growth_bonus * dt;
                if self.unlocked_illuminations.contains(&"mortal_abundance".to_string()) {
                    pop_growth *= 1.40;
                }
                soc.population += pop_growth;

                let job_production_boost = 1.0 +
                    ((soc.gatherer_ratio.unwrap_or(0.35) * 0.5 * local_gathering_bonus) +
                     (soc.hunter_ratio.unwrap_or(0.15) * 0.3 * local_hunting_bonus));
                soc.resources += soc.population * 0.001 * job_production_boost * dt;
            }

            if current_tier > 1 {
                soc.resources = (soc.resources - soc.population * 0.004 * consumption_mult * dt).max(0.0);
            }

            // Reactor bonuses
            let mut reactor_bonus = 1.0;
            for st in &structures {
                let s_comp = self.ecs.structures.get(st).unwrap();
                if s_comp.category == StructureCategory::REACTOR {
                    let s_pos = self.ecs.positions.get(st).unwrap();
                    let d = ((s_pos.x - pos.x) * (s_pos.x - pos.x) + (s_pos.y - pos.y) * (s_pos.y - pos.y)).sqrt();
                    if d < 10.0 {
                        reactor_bonus += 0.5 * s_comp.efficiency;
                    }
                }
            }

            let researcher_factor = soc.researcher_ratio.unwrap_or(0.20) / 0.20;
            let mut tech_speed = if soc.faction == Faction::TECHNOCRAT { 0.0065 } else { 0.0022 } * reactor_bonus * researcher_factor * local_research_bonus;
            if self.unlocked_illuminations.contains(&"fertile_mind".to_string()) {
                tech_speed *= 1.40;
            }
            soc.technology_level += tech_speed * dt;

            let mut target_happiness: f64 = if soc.resources > 50.0 { 95.0 } else if soc.resources < 20.0 { 35.0 } else { 70.0 };
            if soc.ration_mode.unwrap_or(false) { target_happiness = (target_happiness - 20.0).max(20.0); }
            if soc.strip_mine_mode.unwrap_or(false) { target_happiness = (target_happiness - 15.0).max(20.0); }
            soc.happiness += (target_happiness - soc.happiness) * 0.05 * dt;

            if self.unlocked_illuminations.contains(&"infinite_joy".to_string()) {
                soc.happiness = soc.happiness.max(45.0);
            } else {
                soc.happiness = soc.happiness.max(10.0);
            }

            // Danger checklist
            let wolves = self.ecs.get_entities_with(&["fauna", "position"]);
            let mut closest_wolf_dist = 999.0;
            let mut closest_wolf_ent = None;
            for w in wolves {
                let w_is_wolf = self.ecs.faunas.get(&w).map(|f| f.category == FaunaCategory::WOLF).unwrap_or(false);
                if w_is_wolf {
                    let w_pos = self.ecs.positions.get(&w).unwrap();
                    let d = ((w_pos.x - pos.x) * (w_pos.x - pos.x) + (w_pos.y - pos.y) * (w_pos.y - pos.y)).sqrt();
                    if d < closest_wolf_dist {
                        closest_wolf_dist = d;
                        closest_wolf_ent = Some(w);
                    }
                }
            }

            if closest_wolf_dist < 6.0 && closest_wolf_ent.is_some() {
                soc.happiness = (soc.happiness - 8.0 * dt).max(10.0);
                if mv.activity_state != ActivityState::FLEEING {
                    let w_pos = self.ecs.positions.get(&closest_wolf_ent.unwrap()).unwrap();
                    let dx = pos.x - w_pos.x;
                    let dy = pos.y - w_pos.y;
                    let dist_norm = (dx * dx + dy * dy).sqrt().max(1.0);
                    mv.target_x = Some((pos.x + (dx / dist_norm) * 5.0).clamp(1.0, self.width as f64 - 2.0));
                    mv.target_y = Some((pos.y + (dy / dist_norm) * 5.0).clamp(1.0, self.height as f64 - 2.0));
                    mv.activity_state = ActivityState::FLEEING;
                }
            }

            // Devotion Yields
            let acolyte_factor = soc.acolyte_ratio.unwrap_or(0.30) / 0.30;
            let base_dev_rate = soc.population * 0.012 * acolyte_factor;
            let multipliers = vec![
                (FaithSystemType::ANIMISM, 0.8),
                (FaithSystemType::ELEMENTALISM, 1.1),
                (FaithSystemType::INTERVENTIONIST, 1.6),
                (FaithSystemType::SECULAR, 0.2),
                (FaithSystemType::NIHILISM, 0.1),
            ];

            let faith_type = faith.dominant_system;
            let faith_mult = multipliers.iter().find(|(t, _)| *t == faith_type).map(|(_, m)| *m).unwrap_or(1.0);
            let mut dev_added = base_dev_rate * faith_mult * dt;

            if faith_type == FaithSystemType::SECULAR && self.active_god_id == Some(GodId::NullV8) {
                dev_added += soc.technology_level * 0.08 * dt;
            } else if faith_type == FaithSystemType::NIHILISM && self.active_god_id == Some(GodId::NullV8) { // malakor fallback is NullV8
                let despair_factor = (100.0 - soc.happiness) / 100.0;
                dev_added += base_dev_rate * despair_factor * 1.5 * dt;
            }

            if self.unlocked_illuminations.contains(&"tithe_transmutation".to_string()) {
                dev_added *= 1.25;
            }

            faith.devotion += dev_added;
            self.total_devotion += dev_added;

            self.actions_completed.devotion_accumulated += dev_added;
            self.gain_divine_xp(dev_added * 0.15);

            if soc.population > 80.0 && faith.dominant_system == FaithSystemType::ANIMISM {
                *faith.belief_matrix.entry(FaithSystemType::SECULAR).or_insert(0.0) = (faith.belief_matrix.get(&FaithSystemType::SECULAR).unwrap_or(&0.0) + 1.0 * dt).min(100.0);
                if faith.belief_matrix.get(&FaithSystemType::SECULAR).unwrap_or(&0.0) > faith.belief_matrix.get(&FaithSystemType::ANIMISM).unwrap_or(&0.0) {
                    faith.dominant_system = FaithSystemType::SECULAR;
                }
            }

            // Pathfinding decisions for core needs
            if mv.activity_state == ActivityState::IDLE || mv.activity_state == ActivityState::WANDERING {
                if soc.resources < 45.0 {
                    let floras = self.ecs.get_entities_with(&["flora", "position"]);
                    let mut closest_flora = None;
                    let mut f_dist = 12.0;

                    for f in floras {
                        let flora_comp = self.ecs.floras.get(&f).unwrap();
                        if !flora_comp.is_harvested && flora_comp.growth > 40.0 {
                            let f_pos = self.ecs.positions.get(&f).unwrap();
                            let d = ((f_pos.x - pos.x) * (f_pos.x - pos.x) + (f_pos.y - pos.y) * (f_pos.y - pos.y)).sqrt();
                            if d < f_dist {
                                f_dist = d;
                                closest_flora = Some(f);
                            }
                        }
                    }

                    if let Some(cf) = closest_flora {
                        let f_pos = self.ecs.positions.get(&cf).unwrap();
                        mv.target_x = Some(f_pos.x);
                        mv.target_y = Some(f_pos.y);
                        mv.activity_state = ActivityState::MOVING_TO_RESOURCE;
                    } else {
                        // Hunt herbivores
                        let mut closest_herb = None;
                        let mut h_dist = 14.0;
                        for h in &herbivore_entities {
                            let h_pos = self.ecs.positions.get(h).unwrap();
                            let d = ((h_pos.x - pos.x) * (h_pos.x - pos.x) + (h_pos.y - pos.y) * (h_pos.y - pos.y)).sqrt();
                            if d < h_dist {
                                h_dist = d;
                                closest_herb = Some(h.clone());
                            }
                        }

                        if let Some(ch) = closest_herb {
                            let h_pos = self.ecs.positions.get(&ch).unwrap();
                            mv.target_x = Some(h_pos.x);
                            mv.target_y = Some(h_pos.y);
                            mv.activity_state = ActivityState::MOVING_TO_RESOURCE;
                        }
                    }
                } else {
                    // Pray
                    let mut closest_altar = None;
                    let mut a_dist = 15.0;
                    for s in &structures {
                        let str_comp = self.ecs.structures.get(s).unwrap();
                        if str_comp.category == StructureCategory::ALTAR {
                            let a_pos = self.ecs.positions.get(s).unwrap();
                            let d = ((a_pos.x - pos.x) * (a_pos.x - pos.x) + (a_pos.y - pos.y) * (a_pos.y - pos.y)).sqrt();
                            if d < a_dist {
                                a_dist = d;
                                closest_altar = Some(s.clone());
                            }
                        }
                    }

                    if let Some(ca) = closest_altar {
                        if rand::random::<f64>() < 0.25 {
                            let a_pos = self.ecs.positions.get(&ca).unwrap();
                            mv.target_x = Some(a_pos.x);
                            mv.target_y = Some(a_pos.y);
                            mv.activity_state = ActivityState::PRAYING;
                        }
                    }
                }
            }

            // Resolve arrivals
            if mv.activity_state == ActivityState::MOVING_TO_RESOURCE && mv.target_x.is_none() {
                let floras = self.ecs.get_entities_with(&["flora", "position"]);
                let faunas = self.ecs.get_entities_with(&["fauna", "position"]);
                let mut closest_flora = None;
                let mut closest_fauna = None;
                let mut c_dist = 1.2;

                for f in floras {
                    let f_pos = self.ecs.positions.get(&f).unwrap();
                    let d = ((f_pos.x - pos.x) * (f_pos.x - pos.x) + (f_pos.y - pos.y) * (f_pos.y - pos.y)).sqrt();
                    if d < c_dist {
                        closest_flora = Some(f);
                        c_dist = d;
                    }
                }

                let mut fd_dist = 1.5;
                for fa in faunas {
                    let fa_pos = self.ecs.positions.get(&fa).unwrap();
                    let d = ((fa_pos.x - pos.x) * (fa_pos.x - pos.x) + (fa_pos.y - pos.y) * (fa_pos.y - pos.y)).sqrt();
                    if d < fd_dist {
                        closest_fauna = Some(fa);
                        fd_dist = d;
                    }
                }

                if let Some(cf) = closest_flora {
                    let mut flora_comp = self.ecs.floras.get(&cf).unwrap().clone();
                    if !flora_comp.is_harvested {
                        flora_comp.is_harvested = true;
                        flora_comp.growth = 0.0;

                        let gatherer_factor = soc.gatherer_ratio.unwrap_or(0.35) / 0.35;
                        let faction_mult = if soc.faction == Faction::TECHNOCRAT { 1.5 } else if soc.faction == Faction::ANIMIST { 1.2 } else { 1.0 };
                        let strip_mult = if soc.strip_mine_mode.unwrap_or(false) { 2.0 } else { 1.0 };
                        
                        let yield_val = flora_comp.resources_yield * faction_mult * gatherer_factor * strip_mult;
                        soc.resources += yield_val;
                        soc.happiness = (soc.happiness + if soc.strip_mine_mode.unwrap_or(false) { 1.0 } else { 8.0 }).clamp(10.0, 100.0);

                        let log_text = format!(
                            "{} harvested [{}] (+{} resources){}",
                            soc.name, flora_comp.sub_type, yield_val.floor(),
                            if soc.strip_mine_mode.unwrap_or(false) { " [STRIP MINE]" } else { "" }
                        );
                        self.add_event_log("EVOLUTION", log_text);

                        self.actions_completed.flora_harvested += 1;
                        self.gain_divine_xp(8.0);

                        if let Some(phys) = self.ecs.physics.get_mut(&cf) {
                            phys.humidity = (phys.humidity - if soc.strip_mine_mode.unwrap_or(false) { 25.0 } else { 5.0 }).max(0.0);
                            phys.temperature = (phys.temperature + if soc.strip_mine_mode.unwrap_or(false) { 8.0 } else { 1.0 }).min(100.0);
                        }
                        if let Some(bio) = self.ecs.biologies.get_mut(&cf) {
                            bio.biomass = (bio.biomass - if soc.strip_mine_mode.unwrap_or(false) { 80.0 } else { 25.0 }).max(10.0);
                        }

                        let depleted = soc.strip_mine_mode.unwrap_or(false) && rand::random::<f64>() < 0.45;
                        if depleted {
                            self.ecs.remove_entity(&cf);
                            let log_text = format!("Intensive strip-mining has permanently depleted flora node at coord ({}, {}).", pos.x.round(), pos.y.round());
                            self.add_event_log("SCHISM", log_text);
                        } else {
                            *self.ecs.floras.get_mut(&cf).unwrap() = flora_comp;
                        }
                    }
                } else if let Some(cf) = closest_fauna {
                    let mut fauna_comp = self.ecs.faunas.get(&cf).unwrap().clone();
                    if fauna_comp.category == FaunaCategory::STAG || fauna_comp.category == FaunaCategory::COW {
                        fauna_comp.health = (fauna_comp.health - 60.0).max(0.0);
                        let killed = fauna_comp.health <= 0.0;
                        if killed {
                            self.ecs.remove_entity(&cf);
                            let hunter_factor = soc.hunter_ratio.unwrap_or(0.15) / 0.15;
                            let hunt_yield = (110.0 + (rand::random::<f64>() * 40.0).floor()) * hunter_factor;
                            soc.resources += hunt_yield;
                            soc.happiness = (soc.happiness + 15.0).min(100.0);
                            
                            let log_text = format!("{} successfully caught and hunted a {} (+{} resources, meat/skins).", soc.name, fauna_comp.sub_type, hunt_yield.floor());
                            self.add_event_log("EVOLUTION", log_text);

                            self.actions_completed.fauna_hunted += 1;
                            self.gain_divine_xp(15.0);
                        } else {
                            let log_text = format!("{} wounded a {} during a huntsman chase.", soc.name, fauna_comp.sub_type);
                            self.add_event_log("EVOLUTION", log_text);
                            *self.ecs.faunas.get_mut(&cf).unwrap() = fauna_comp;
                        }
                    }
                }
                mv.activity_state = ActivityState::IDLE;
            }

            if mv.activity_state == ActivityState::PRAYING && mv.target_x.is_none() {
                let bonus_dev = if soc.faction == Faction::INTERVENTIONIST { 35.0 } else { 15.0 };
                self.total_devotion += bonus_dev;
                faith.devotion += bonus_dev * 0.5;
                soc.happiness = (soc.happiness + 6.0).min(100.0);
                self.add_event_log("MIRACLE", format!("{} completed high-fidelity focus meditation at Sacred Altar (+{} Devotion)", soc.name, bonus_dev));

                self.actions_completed.devotion_accumulated += bonus_dev;
                self.gain_divine_xp(6.0);

                mv.activity_state = ActivityState::IDLE;
            }

            *self.ecs.societies.get_mut(&e).unwrap() = soc;
            *self.ecs.faiths.get_mut(&e).unwrap() = faith;
            *self.ecs.movements.get_mut(&e).unwrap() = mv;
        }

        for ent in to_remove {
            self.ecs.remove_entity(&ent);
        }

        // --- Geopolitical updates ---
        let active_societies = self.ecs.get_entities_with(&["society", "position"]);
        let count = active_societies.len();
        for i in 0..count {
            for j in (i + 1)..count {
                let id_a = &active_societies[i];
                let id_b = &active_societies[j];
                
                let pos_a = self.ecs.positions.get(id_a).unwrap().clone();
                let pos_b = self.ecs.positions.get(id_b).unwrap().clone();

                let dx = pos_a.x - pos_b.x;
                let dy = pos_a.y - pos_b.y;
                let dist = (dx * dx + dy * dy).sqrt();

                let rel = self.get_or_create_relation(id_a, id_b);
                let coop_key = format!("{}_{}", id_a, id_b);
                
                let cd = self.relation_log_cooldowns.entry(coop_key.clone()).or_insert(0.0);
                if *cd > 0.0 {
                    *cd -= dt;
                }

                if self.weather == "DROUGHT" {
                    let competition_decay = -1.2 * dt;
                    self.set_relation(id_a, id_b, rel + competition_decay);
                }

                let current_rel = self.get_or_create_relation(id_a, id_b);

                if dist < 18.0 {
                    if current_rel < -30.0 {
                        // WAR RAID
                        let dmg_rate = 0.5 * dt;
                        let res_raid_rate = 1.0 * dt;

                        let (pop_loss_a, happiness_loss_a) = {
                            let soc_a = self.ecs.societies.get(id_a).unwrap();
                            let pop_loss = (soc_a.population - 5.0).min(soc_a.population * dmg_rate * 0.04);
                            (pop_loss, 3.0 * dt)
                        };
                        let (pop_loss_b, happiness_loss_b) = {
                            let soc_b = self.ecs.societies.get(id_b).unwrap();
                            let pop_loss = (soc_b.population - 5.0).min(soc_b.population * dmg_rate * 0.04);
                            (pop_loss, 3.0 * dt)
                        };

                        if let Some(soc_a) = self.ecs.societies.get_mut(id_a) {
                            soc_a.population = (soc_a.population - pop_loss_a).max(5.0);
                            soc_a.happiness = (soc_a.happiness - happiness_loss_a).max(10.0);
                        }
                        if let Some(soc_b) = self.ecs.societies.get_mut(id_b) {
                            soc_b.population = (soc_b.population - pop_loss_b).max(5.0);
                            soc_b.happiness = (soc_b.happiness - happiness_loss_b).max(10.0);
                        }

                        // raid resources
                        let res_a = self.ecs.societies.get(id_a).unwrap().resources;
                        let res_b = self.ecs.societies.get(id_b).unwrap().resources;

                        if res_a > 15.0 && res_b < 1500.0 {
                            let looted = (res_a - 15.0).min(res_raid_rate);
                            self.ecs.societies.get_mut(id_a).unwrap().resources -= looted;
                            self.ecs.societies.get_mut(id_b).unwrap().resources += looted;
                        }
                        if res_b > 15.0 && res_a < 1500.0 {
                            let looted = (res_b - 15.0).min(res_raid_rate);
                            self.ecs.societies.get_mut(id_b).unwrap().resources -= looted;
                            self.ecs.societies.get_mut(id_a).unwrap().resources += looted;
                        }

                        if *self.relation_log_cooldowns.get(&coop_key).unwrap() <= 0.0 && rand::random::<f64>() < 0.1 {
                            let text_a = self.ecs.societies.get(id_a).unwrap().name.split('[').next().unwrap().trim().to_string();
                            let text_b = self.ecs.societies.get(id_b).unwrap().name.split('[').next().unwrap().trim().to_string();
                            self.add_event_log("SCHISM", format!("⚔️ War skirmish between hostile {} and {}! Raw materials looted.", text_a, text_b));
                            self.relation_log_cooldowns.insert(coop_key.clone(), 25.0);
                        }
                    } else if current_rel > 35.0 {
                        // TRADE
                        let trade_rate = 0.6 * dt;
                        
                        if let Some(soc_a) = self.ecs.societies.get_mut(id_a) {
                            soc_a.resources += trade_rate;
                            soc_a.happiness = (soc_a.happiness + 0.6 * dt).min(100.0);
                        }

                        if let Some(soc_b) = self.ecs.societies.get_mut(id_b) {
                            soc_b.resources += trade_rate;
                            soc_b.happiness = (soc_b.happiness + 0.6 * dt).min(100.0);
                        }

                        self.set_relation(id_a, id_b, current_rel + 0.25 * dt);

                        if *self.relation_log_cooldowns.get(&coop_key).unwrap() <= 0.0 && rand::random::<f64>() < 0.08 {
                            let text_a = self.ecs.societies.get(id_a).unwrap().name.split('[').next().unwrap().trim().to_string();
                            let text_b = self.ecs.societies.get(id_b).unwrap().name.split('[').next().unwrap().trim().to_string();
                            self.add_event_log("EVOLUTION", format!("🤝 Trade treaty active: {} and {} held mutual markets (+Raw Materials).", text_a, text_b));
                            self.relation_log_cooldowns.insert(coop_key.clone(), 30.0);
                        }
                    }
                }

                // Slow relational drift
                let drift_target = if self.ecs.societies.get(id_a).unwrap().faction == self.ecs.societies.get(id_b).unwrap().faction { 60.0 } else { 0.0 };
                let drift = (drift_target - self.get_or_create_relation(id_a, id_b)) * 0.005 * dt;
                let final_rel = self.get_or_create_relation(id_a, id_b) + drift;
                self.set_relation(id_a, id_b, final_rel);
            }
        }
    }

    fn update_wildlife(&mut self, dt: f64) {
        let fauna_entities = self.ecs.get_entities_with(&["fauna", "position", "movement"]);
        let structures = self.ecs.get_entities_with(&["structure", "position"]);
        let floras = self.ecs.get_entities_with(&["flora", "position"]);
        let tribes = self.ecs.get_entities_with(&["society", "position"]);

        let mut to_remove = Vec::new();

        for f in fauna_entities {
            let pos = self.ecs.positions.get(&f).unwrap().clone();
            
            // Hunger decay
            {
                let fauna = self.ecs.faunas.get_mut(&f).unwrap();
                fauna.hunger += 1.8 * dt;
                if fauna.hunger > 80.0 {
                    fauna.health = (fauna.health - 4.5 * dt).max(0.0);
                    if fauna.health <= 0.0 {
                        to_remove.push(f.clone());
                        let log_text = format!("A {} succumbed to hunger and dissolved back to stardust.", fauna.sub_type);
                        self.add_event_log("EVOLUTION", log_text);
                        continue;
                    }
                }
            }

            // Clone components to avoid active mutable borrows on self.ecs/self
            let mut fauna = self.ecs.faunas.get(&f).unwrap().clone();
            let mut mv = self.ecs.movements.get(&f).unwrap().clone();

            if fauna.category == FaunaCategory::WOLF {
                for st in &structures {
                    let s_comp = self.ecs.structures.get(st).unwrap();
                    if s_comp.category == StructureCategory::DEFENSE {
                        let s_pos = self.ecs.positions.get(st).unwrap();
                        let d = ((s_pos.x - pos.x) * (s_pos.x - pos.x) + (s_pos.y - pos.y) * (s_pos.y - pos.y)).sqrt();
                        if d < 8.0 {
                            fauna.health = (fauna.health - 25.0 * s_comp.efficiency * dt).max(0.0);
                            if rand::random::<f64>() < 0.05 * dt {
                                let log_text = format!("Planetary defense laser tower fired upon aggressive [{}] near core structure.", fauna.sub_type);
                                self.add_event_log("SCHISM", log_text);
                            }
                        }
                    }
                }

                if fauna.health <= 0.0 {
                    to_remove.push(f.clone());
                    self.add_event_log("EVOLUTION", "Defensive grid neutralized an aggressive predatory Wolf.".to_string());
                    continue;
                }

                // Wolf hunting target
                if fauna.hunger > 25.0 && (mv.activity_state == ActivityState::WANDERING || mv.activity_state == ActivityState::IDLE) {
                    let mut closest_herb = None;
                    let mut h_dist = 16.0;

                    let other_faunas = self.ecs.get_entities_with(&["fauna", "position"]);
                    for fo in other_faunas {
                        if fo != f {
                            let fo_comp = self.ecs.faunas.get(&fo).unwrap();
                            if fo_comp.category == FaunaCategory::STAG || fo_comp.category == FaunaCategory::COW {
                                let fo_pos = self.ecs.positions.get(&fo).unwrap();
                                let d = ((fo_pos.x - pos.x) * (fo_pos.x - pos.x) + (fo_pos.y - pos.y) * (fo_pos.y - pos.y)).sqrt();
                                if d < h_dist {
                                    h_dist = d;
                                    closest_herb = Some(fo);
                                }
                            }
                        }
                    }

                    if let Some(ch) = closest_herb {
                        let h_pos = self.ecs.positions.get(&ch).unwrap();
                        mv.target_x = Some(h_pos.x);
                        mv.target_y = Some(h_pos.y);
                        fauna.action_state = FaunaActionState::HUNTING;
                        mv.activity_state = ActivityState::MOVING_TO_RESOURCE;
                    } else if fauna.hunger > 55.0 {
                        // attack tribe
                        let mut closest_tribe = None;
                        let mut t_dist = 14.0;
                        for t in &tribes {
                            let t_pos = self.ecs.positions.get(t).unwrap();
                            let d = ((t_pos.x - pos.x) * (t_pos.x - pos.x) + (t_pos.y - pos.y) * (t_pos.y - pos.y)).sqrt();
                            if d < t_dist {
                                t_dist = d;
                                closest_tribe = Some(t.clone());
                            }
                        }

                        if let Some(ct) = closest_tribe {
                            let t_pos = self.ecs.positions.get(&ct).unwrap();
                            mv.target_x = Some(t_pos.x);
                            mv.target_y = Some(t_pos.y);
                            fauna.action_state = FaunaActionState::HUNTING;
                            mv.activity_state = ActivityState::MOVING_TO_RESOURCE;
                        }
                    }
                }

                // Resolve wolf hunting arrivals
                if fauna.action_state == FaunaActionState::HUNTING && mv.target_x.is_none() {
                    let mut adjacent_herb = None;
                    let mut adjacent_tribe = None;

                    let other_faunas = self.ecs.get_entities_with(&["fauna", "position"]);
                    for fo in other_faunas {
                        if fo != f {
                            let fo_comp = self.ecs.faunas.get(&fo).unwrap();
                            if fo_comp.category == FaunaCategory::STAG || fo_comp.category == FaunaCategory::COW {
                                let fo_pos = self.ecs.positions.get(&fo).unwrap();
                                let d = ((fo_pos.x - pos.x) * (fo_pos.x - pos.x) + (fo_pos.y - pos.y) * (fo_pos.y - pos.y)).sqrt();
                                if d < 1.8 {
                                    adjacent_herb = Some(fo);
                                }
                            }
                        }
                    }

                    if adjacent_herb.is_none() {
                        for t in &tribes {
                            let t_pos = self.ecs.positions.get(t).unwrap();
                            let d = ((t_pos.x - pos.x) * (t_pos.x - pos.x) + (t_pos.y - pos.y) * (t_pos.y - pos.y)).sqrt();
                            if d < 1.8 {
                                adjacent_tribe = Some(t.clone());
                            }
                        }
                    }

                    if let Some(ah) = adjacent_herb {
                        let mut target_health = 0.0;
                        let mut target_sub_type = String::new();
                        let mut killed = false;

                        if let Some(target_fauna) = self.ecs.faunas.get_mut(&ah) {
                            target_fauna.health = (target_fauna.health - 50.0).max(0.0);
                            target_health = target_fauna.health;
                            target_sub_type = target_fauna.sub_type.clone();
                            if target_fauna.health <= 0.0 {
                                killed = true;
                            }
                        }

                        if killed {
                            self.ecs.remove_entity(&ah);
                            fauna.hunger = 0.0;
                            let log_text = format!("Predator [{}] caught and devoured active [{}].", fauna.sub_type, target_sub_type);
                            self.add_event_log("EVOLUTION", log_text);
                        } else {
                            fauna.hunger = (fauna.hunger - 20.0).max(0.0);
                            let log_text = format!("Predator [{}] attacked and wounded [{}].", fauna.sub_type, target_sub_type);
                            self.add_event_log("EVOLUTION", log_text);
                        }
                        fauna.action_state = FaunaActionState::WANDERING;
                        mv.activity_state = ActivityState::IDLE;
                    } else if let Some(at) = adjacent_tribe {
                        let mut name = String::new();
                        let mut collapsed = false;
                        let mut bite = 0.0;

                        if let Some(soc) = self.ecs.societies.get_mut(&at) {
                            bite = (4.0 + (rand::random::<f64>() * 6.0).floor()).min(soc.population);
                            soc.population = (soc.population - bite).max(0.0);
                            soc.happiness = (soc.happiness - 15.0).max(10.0);
                            name = soc.name.clone();

                            if soc.population <= 0.0 {
                                collapsed = true;
                            }
                        }

                        let log_text = format!("Starving predator wolf pack breached boundaries of {}, claiming {} members.", name, bite);
                        self.add_event_log("SCHISM", log_text);

                        if collapsed {
                            self.ecs.remove_entity(&at);
                            let log_text = format!("Tribe center {} completely collapsed following predatory pack invasions.", name);
                            self.add_event_log("SCHISM", log_text);
                        }

                        fauna.hunger = 0.0;
                        fauna.action_state = FaunaActionState::WANDERING;
                        mv.activity_state = ActivityState::IDLE;
                    } else {
                        fauna.action_state = FaunaActionState::WANDERING;
                        mv.activity_state = ActivityState::IDLE;
                    }
                }
            } else {
                // Herbivore (STAG / COW) Flee checks
                let mut closest_wolf_pos = None;
                let mut wolf_dist = 5.5;
                
                let wolves = self.ecs.get_entities_with(&["fauna", "position"]);
                for w in wolves {
                    let w_is_wolf = self.ecs.faunas.get(&w).map(|f| f.category == FaunaCategory::WOLF).unwrap_or(false);
                    if w_is_wolf {
                        let w_pos = self.ecs.positions.get(&w).unwrap();
                        let d = ((w_pos.x - pos.x) * (w_pos.x - pos.x) + (w_pos.y - pos.y) * (w_pos.y - pos.y)).sqrt();
                        if d < wolf_dist {
                            wolf_dist = d;
                            closest_wolf_pos = Some(w_pos.clone());
                        }
                    }
                }

                if let Some(w_pos) = closest_wolf_pos {
                    let dx = pos.x - w_pos.x;
                    let dy = pos.y - w_pos.y;
                    let norm = (dx * dx + dy * dy).sqrt().max(1.0);
                    mv.target_x = Some((pos.x + (dx / norm) * 6.0).clamp(1.0, self.width as f64 - 2.0));
                    mv.target_y = Some((pos.y + (dy / norm) * 6.0).clamp(1.0, self.width as f64 - 2.0));
                    fauna.action_state = FaunaActionState::FLEEING;
                    mv.activity_state = ActivityState::FLEEING;
                }

                // Graze check
                if fauna.hunger > 35.0 && (mv.activity_state == ActivityState::WANDERING || mv.activity_state == ActivityState::IDLE) {
                    let mut closest_grass = None;
                    let mut g_dist = 12.0;
                    for f_ent in &floras {
                        let flora_comp = self.ecs.floras.get(f_ent).unwrap();
                        if !flora_comp.is_harvested && flora_comp.growth > 30.0 {
                            let f_pos = self.ecs.positions.get(f_ent).unwrap();
                            let d = ((f_pos.x - pos.x) * (f_pos.x - pos.x) + (f_pos.y - pos.y) * (f_pos.y - pos.y)).sqrt();
                            if d < g_dist {
                                g_dist = d;
                                closest_grass = Some(f_ent.clone());
                            }
                        }
                    }

                    if let Some(cg) = closest_grass {
                        let g_pos = self.ecs.positions.get(&cg).unwrap();
                        mv.target_x = Some(g_pos.x);
                        mv.target_y = Some(g_pos.y);
                        fauna.action_state = FaunaActionState::GRAZING;
                        mv.activity_state = ActivityState::MOVING_TO_RESOURCE;
                    }
                }

                // Resolve graze arrival
                if fauna.action_state == FaunaActionState::GRAZING && mv.target_x.is_none() {
                    let other_floras = self.ecs.get_entities_with(&["flora", "position"]);
                    let mut closest_grass = None;
                    let mut g_dist = 1.3;
                    for f_ent in other_floras {
                        let f_pos = self.ecs.positions.get(&f_ent).unwrap();
                        let d = ((f_pos.x - pos.x) * (f_pos.x - pos.x) + (f_pos.y - pos.y) * (f_pos.y - pos.y)).sqrt();
                        if d < g_dist {
                            closest_grass = Some(f_ent);
                            g_dist = d;
                        }
                    }

                    if let Some(cg) = closest_grass {
                        if let Some(flora_comp) = self.ecs.floras.get_mut(&cg) {
                            flora_comp.growth = (flora_comp.growth - 30.0).max(0.0);
                            if flora_comp.growth < 10.0 {
                                flora_comp.is_harvested = true;
                            }
                        }
                        fauna.hunger = 0.0;
                        fauna.health = (fauna.health + 10.0).min(100.0);
                    }
                    fauna.action_state = FaunaActionState::WANDERING;
                    mv.activity_state = ActivityState::IDLE;
                }
            }

            // Write modified components back to the ECS safely
            if !to_remove.contains(&f) {
                *self.ecs.faunas.get_mut(&f).unwrap() = fauna;
                *self.ecs.movements.get_mut(&f).unwrap() = mv;
            }
        }

        for ent in to_remove {
            self.ecs.remove_entity(&ent);
        }
    }

    pub fn get_or_create_relation(&mut self, id_a: &str, id_b: &str) -> f64 {
        if id_a == id_b { return 100.0; }
        
        let rel_a = self.tribal_relations.entry(id_a.to_string()).or_insert_with(HashMap::new);
        if let Some(val) = rel_a.get(id_b) {
            return *val;
        }

        // Seeding baseline
        let soc_a = self.ecs.societies.get(id_a);
        let soc_b = self.ecs.societies.get(id_b);

        let mut initial_val = 0.0;
        if let (Some(a), Some(b)) = (soc_a, soc_b) {
            if a.faction == b.faction {
                initial_val = 60.0;
            } else {
                let clash = (a.faction == Faction::TECHNOCRAT && b.faction == Faction::ANIMIST) ||
                            (a.faction == Faction::ANIMIST && b.faction == Faction::TECHNOCRAT) ||
                            (a.faction == Faction::TECHNOCRAT && b.faction == Faction::ELEMENTAL) ||
                            (a.faction == Faction::ELEMENTAL && b.faction == Faction::TECHNOCRAT) ||
                            (a.faction == Faction::NIHILIST || b.faction == Faction::NIHILIST);

                let align = (a.faction == Faction::ANIMIST && b.faction == Faction::ELEMENTAL) ||
                            (a.faction == Faction::ELEMENTAL && b.faction == Faction::ANIMIST) ||
                            (a.faction == Faction::INTERVENTIONIST && b.faction == Faction::ANIMIST) ||
                            (a.faction == Faction::ANIMIST && b.faction == Faction::INTERVENTIONIST);

                if clash {
                    initial_val = -40.0;
                } else if align {
                    initial_val = 30.0;
                }
            }
        }

        self.tribal_relations.get_mut(id_a).unwrap().insert(id_b.to_string(), initial_val);
        self.tribal_relations.entry(id_b.to_string()).or_insert_with(HashMap::new).insert(id_a.to_string(), initial_val);

        initial_val
    }

    pub fn set_relation(&mut self, id_a: &str, id_b: &str, value: f64) {
        if id_a == id_b { return; }
        let clamped = value.clamp(-100.0, 100.0);
        self.tribal_relations.entry(id_a.to_string()).or_insert_with(HashMap::new).insert(id_b.to_string(), clamped);
        self.tribal_relations.entry(id_b.to_string()).or_insert_with(HashMap::new).insert(id_a.to_string(), clamped);
    }

    pub fn get_entity_at(&self, tx: f64, ty: f64) -> Option<(Entity, String, serde_json::Value)> {
        let list = self.ecs.get_entities_with(&["position"]);
        let mut best_entity = None;
        let mut min_dist = 2.0;

        for e in list {
            let pos = self.ecs.positions.get(&e).unwrap();
            let d = ((pos.x - tx) * (pos.x - tx) + (pos.y - ty) * (pos.y - ty)).sqrt();
            if d < min_dist {
                min_dist = d;
                best_entity = Some(e);
            }
        }

        let ent = best_entity?;
        let mut components = HashMap::new();

        if let Some(pos) = self.ecs.positions.get(&ent) { components.insert("position", serde_json::to_value(pos).unwrap()); }
        if let Some(soc) = self.ecs.societies.get(&ent) { components.insert("society", serde_json::to_value(soc).unwrap()); }
        if let Some(faith) = self.ecs.faiths.get(&ent) { components.insert("faith", serde_json::to_value(faith).unwrap()); }
        if let Some(flora) = self.ecs.floras.get(&ent) { components.insert("flora", serde_json::to_value(flora).unwrap()); }
        if let Some(fauna) = self.ecs.faunas.get(&ent) { components.insert("fauna", serde_json::to_value(fauna).unwrap()); }
        if let Some(struc) = self.ecs.structures.get(&ent) { components.insert("structure", serde_json::to_value(struc).unwrap()); }
        if let Some(mov) = self.ecs.movements.get(&ent) { components.insert("movement", serde_json::to_value(mov).unwrap()); }
        if let Some(phys) = self.ecs.physics.get(&ent) { components.insert("physics", serde_json::to_value(phys).unwrap()); }
        if let Some(bio) = self.ecs.biologies.get(&ent) { components.insert("biology", serde_json::to_value(bio).unwrap()); }

        let mut cat = "Unknown".to_string();
        if components.contains_key("society") {
            cat = "Tribe".to_string();
        } else if let Some(flo) = self.ecs.floras.get(&ent) {
            cat = format!("Flora ({:?})", flo.category);
        } else if let Some(fau) = self.ecs.faunas.get(&ent) {
            cat = format!("Fauna ({:?})", fau.category);
        } else if components.contains_key("structure") {
            cat = "Structure".to_string();
        }

        Some((ent, cat, serde_json::to_value(components).unwrap()))
    }
}

// Helper trait extension to count elements on vectors
trait VecExt {
    fn length_value(&self) -> usize;
}
impl<T> VecExt for Vec<T> {
    fn length_value(&self) -> usize {
        self.len()
    }
}
