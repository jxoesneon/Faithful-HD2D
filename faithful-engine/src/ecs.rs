use std::collections::{HashMap, HashSet};
use crate::types::*;
use serde::{Serialize, Deserialize};

#[derive(Default, Serialize, Deserialize, Debug, Clone)]
pub struct ECS {
    pub entities: HashSet<Entity>,
    pub positions: HashMap<Entity, Position>,
    pub physics: HashMap<Entity, Physics>,
    pub biologies: HashMap<Entity, Biology>,
    pub societies: HashMap<Entity, Society>,
    pub faiths: HashMap<Entity, Faith>,
    pub floras: HashMap<Entity, Flora>,
    pub faunas: HashMap<Entity, Fauna>,
    pub structures: HashMap<Entity, Structure>,
    pub movements: HashMap<Entity, Movement>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExportedComponent {
    #[serde(rename = "type")]
    pub comp_type: String,
    pub entity: String,
    pub data: serde_json::Value,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExportedState {
    pub entities: Vec<Entity>,
    pub components: Vec<ExportedComponent>,
}

impl ECS {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn create_entity(&mut self) -> Entity {
        // Generate a random 7-character string matching the JS Math.random().toString(36).substring(2, 9)
        let id: String = rand::random::<u32>().to_string(); // Simple numeric-based random string for native speeds
        self.entities.insert(id.clone());
        id
    }

    pub fn add_position(&mut self, entity: Entity, component: Position) {
        self.entities.insert(entity.clone());
        self.positions.insert(entity, component);
    }

    pub fn add_physics(&mut self, entity: Entity, component: Physics) {
        self.entities.insert(entity.clone());
        self.physics.insert(entity, component);
    }

    pub fn add_biology(&mut self, entity: Entity, component: Biology) {
        self.entities.insert(entity.clone());
        self.biologies.insert(entity, component);
    }

    pub fn add_society(&mut self, entity: Entity, component: Society) {
        self.entities.insert(entity.clone());
        self.societies.insert(entity, component);
    }

    pub fn add_faith(&mut self, entity: Entity, component: Faith) {
        self.entities.insert(entity.clone());
        self.faiths.insert(entity, component);
    }

    pub fn add_flora(&mut self, entity: Entity, component: Flora) {
        self.entities.insert(entity.clone());
        self.floras.insert(entity, component);
    }

    pub fn add_fauna(&mut self, entity: Entity, component: Fauna) {
        self.entities.insert(entity.clone());
        self.faunas.insert(entity, component);
    }

    pub fn add_structure(&mut self, entity: Entity, component: Structure) {
        self.entities.insert(entity.clone());
        self.structures.insert(entity, component);
    }

    pub fn add_movement(&mut self, entity: Entity, component: Movement) {
        self.entities.insert(entity.clone());
        self.movements.insert(entity, component);
    }

    pub fn remove_entity(&mut self, entity: &Entity) {
        self.entities.remove(entity);
        self.positions.remove(entity);
        self.physics.remove(entity);
        self.biologies.remove(entity);
        self.societies.remove(entity);
        self.faiths.remove(entity);
        self.floras.remove(entity);
        self.faunas.remove(entity);
        self.structures.remove(entity);
        self.movements.remove(entity);
    }

    pub fn clear(&mut self) {
        self.entities.clear();
        self.positions.clear();
        self.physics.clear();
        self.biologies.clear();
        self.societies.clear();
        self.faiths.clear();
        self.floras.clear();
        self.faunas.clear();
        self.structures.clear();
        self.movements.clear();
    }

    pub fn get_entities_with(&self, types: &[&str]) -> Vec<Entity> {
        if types.is_empty() {
            return self.entities.iter().cloned().collect();
        }
        self.entities.iter().filter(|e| {
            types.iter().all(|t| match *t {
                "position" => self.positions.contains_key(*e),
                "physics" => self.physics.contains_key(*e),
                "biology" => self.biologies.contains_key(*e),
                "society" => self.societies.contains_key(*e),
                "faith" => self.faiths.contains_key(*e),
                "flora" => self.floras.contains_key(*e),
                "fauna" => self.faunas.contains_key(*e),
                "structure" => self.structures.contains_key(*e),
                "movement" => self.movements.contains_key(*e),
                _ => false,
            })
        }).cloned().collect()
    }

    pub fn export_state(&self) -> ExportedState {
        let mut components = Vec::new();

        for (entity, data) in &self.positions {
            components.push(ExportedComponent {
                comp_type: "position".to_string(),
                entity: entity.clone(),
                data: serde_json::to_value(data).unwrap(),
            });
        }
        for (entity, data) in &self.physics {
            components.push(ExportedComponent {
                comp_type: "physics".to_string(),
                entity: entity.clone(),
                data: serde_json::to_value(data).unwrap(),
            });
        }
        for (entity, data) in &self.biologies {
            components.push(ExportedComponent {
                comp_type: "biology".to_string(),
                entity: entity.clone(),
                data: serde_json::to_value(data).unwrap(),
            });
        }
        for (entity, data) in &self.societies {
            components.push(ExportedComponent {
                comp_type: "society".to_string(),
                entity: entity.clone(),
                data: serde_json::to_value(data).unwrap(),
            });
        }
        for (entity, data) in &self.faiths {
            components.push(ExportedComponent {
                comp_type: "faith".to_string(),
                entity: entity.clone(),
                data: serde_json::to_value(data).unwrap(),
            });
        }
        for (entity, data) in &self.floras {
            components.push(ExportedComponent {
                comp_type: "flora".to_string(),
                entity: entity.clone(),
                data: serde_json::to_value(data).unwrap(),
            });
        }
        for (entity, data) in &self.faunas {
            components.push(ExportedComponent {
                comp_type: "fauna".to_string(),
                entity: entity.clone(),
                data: serde_json::to_value(data).unwrap(),
            });
        }
        for (entity, data) in &self.structures {
            components.push(ExportedComponent {
                comp_type: "structure".to_string(),
                entity: entity.clone(),
                data: serde_json::to_value(data).unwrap(),
            });
        }
        for (entity, data) in &self.movements {
            components.push(ExportedComponent {
                comp_type: "movement".to_string(),
                entity: entity.clone(),
                data: serde_json::to_value(data).unwrap(),
            });
        }

        ExportedState {
            entities: self.entities.iter().cloned().collect(),
            components,
        }
    }

    pub fn import_state(&mut self, state: ExportedState) {
        self.clear();
        for entity in state.entities {
            self.entities.insert(entity);
        }
        for comp in state.components {
            match comp.comp_type.as_str() {
                "position" => {
                    if let Ok(data) = serde_json::from_value::<Position>(comp.data) {
                        self.positions.insert(comp.entity, data);
                    }
                }
                "physics" => {
                    if let Ok(data) = serde_json::from_value::<Physics>(comp.data) {
                        self.physics.insert(comp.entity, data);
                    }
                }
                "biology" => {
                    if let Ok(data) = serde_json::from_value::<Biology>(comp.data) {
                        self.biologies.insert(comp.entity, data);
                    }
                }
                "society" => {
                    if let Ok(data) = serde_json::from_value::<Society>(comp.data) {
                        self.societies.insert(comp.entity, data);
                    }
                }
                "faith" => {
                    if let Ok(data) = serde_json::from_value::<Faith>(comp.data) {
                        self.faiths.insert(comp.entity, data);
                    }
                }
                "flora" => {
                    if let Ok(data) = serde_json::from_value::<Flora>(comp.data) {
                        self.floras.insert(comp.entity, data);
                    }
                }
                "fauna" => {
                    if let Ok(data) = serde_json::from_value::<Fauna>(comp.data) {
                        self.faunas.insert(comp.entity, data);
                    }
                }
                "structure" => {
                    if let Ok(data) = serde_json::from_value::<Structure>(comp.data) {
                        self.structures.insert(comp.entity, data);
                    }
                }
                "movement" => {
                    if let Ok(data) = serde_json::from_value::<Movement>(comp.data) {
                        self.movements.insert(comp.entity, data);
                    }
                }
                _ => {}
            }
        }
    }
}
