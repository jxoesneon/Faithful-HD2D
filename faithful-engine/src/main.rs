use std::env;
use std::fs::File;
use std::io::{Read, Write};
use faithful_engine::simulation::SimulationEngine;
use faithful_engine::gods::GodId;

fn main() {
    println!("=== Faithful Game Engine CLI ===");
    
    let args: Vec<String> = env::args().collect();
    
    let mut sim = SimulationEngine::new();
    
    if args.contains(&"--help".to_string()) || args.contains(&"-h".to_string()) {
        println!("Usage:");
        println!("  faithful-cli [--load <file>] [--save <file>] [--ticks <count>] [--god <sylphra|vulcanus|thalassor|xylorex|aethelgard|null_v8|krigor>]");
        return;
    }
    
    // Check if starting boost god is specified
    if let Some(pos) = args.iter().position(|x| x == "--god") {
        if pos + 1 < args.len() {
            let god_name = &args[pos + 1];
            if let Some(god_id) = GodId::from_str(god_name) {
                println!("Applying starting boost for deity: {}", god_name);
                sim.apply_starting_boost(god_id);
            } else {
                println!("Warning: unknown god '{}'", god_name);
            }
        }
    }
    
    // Check if loading state
    if let Some(pos) = args.iter().position(|x| x == "--load") {
        if pos + 1 < args.len() {
            let file_path = &args[pos + 1];
            println!("Loading state from: {}", file_path);
            match File::open(file_path) {
                Ok(mut file) => {
                    let mut contents = String::new();
                    if file.read_to_string(&mut contents).is_ok() {
                        match serde_json::from_str(&contents) {
                            Ok(exported) => {
                                sim.ecs.import_state(exported);
                                println!("Imported state successfully!");
                            }
                            Err(e) => {
                                println!("Error parsing JSON state: {}", e);
                            }
                        }
                    }
                }
                Err(e) => {
                    println!("Error opening file: {}", e);
                }
            }
        }
    }
    
    // Ticks count
    let mut ticks = 10;
    if let Some(pos) = args.iter().position(|x| x == "--ticks") {
        if pos + 1 < args.len() {
            if let Ok(t) = args[pos + 1].parse::<u32>() {
                ticks = t;
            }
        }
    }
    
    println!("Running simulation for {} ticks...", ticks);
    for _ in 0..ticks {
        sim.update(1.0);
    }
    
    println!("Simulation step completed.");
    println!("Total Devotion: {}", sim.total_devotion);
    println!("Active Factions / Entities in ECS: {}", sim.ecs.entities.len());
    
    if !sim.event_logs.is_empty() {
        println!("Recent Event Logs:");
        for log in sim.event_logs.iter().take(5) {
            println!("  [{}] {}: {}", log.log_type, log.time, log.text);
        }
    }
    
    // Check if saving state
    if let Some(pos) = args.iter().position(|x| x == "--save") {
        if pos + 1 < args.len() {
            let file_path = &args[pos + 1];
            println!("Saving state to: {}", file_path);
            let state = sim.ecs.export_state();
            match serde_json::to_string_pretty(&state) {
                Ok(json_str) => {
                    match File::create(file_path) {
                        Ok(mut file) => {
                            if file.write_all(json_str.as_bytes()).is_ok() {
                                println!("State saved successfully.");
                            } else {
                                println!("Error writing to file.");
                            }
                        }
                        Err(e) => println!("Error creating file: {}", e),
                    }
                }
                Err(e) => println!("Error serializing state: {}", e),
            }
        }
    }
}
