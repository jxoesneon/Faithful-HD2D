use noise::{NoiseFn, OpenSimplex, Worley, RidgedMulti};
use serde::{Serialize, Deserialize};

// --- AAA Post-Processing and Camera Coefficients Buffer ---
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AAAEffectsBuffer {
    pub bloom_intensity: f64,
    pub bloom_threshold: f64,
    pub dof_focus_plane: f64,
    pub dof_focus_range: f64,
    pub dof_blur_far: f64,
    pub dof_blur_near: f64,
    pub chromatic_aberration_radial: f64,
    pub lut_index: u32,
}

// --- Level 0: Planetary Spherical Vertex ---
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlanetaryVertex {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub u: f64,
    pub v: f64,
    pub elevation: f64,
    pub aridity: f64,
    pub tectonic_stress: f64,
}

// --- Level 1: Regional Vector and Stress Flow ---
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FlowVector {
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub tectonic_risk: f64,
}

// --- Level 2: Isometric Tile Vertex & AO Mapping ---
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IsoTileVertex {
    pub x_iso: f64,
    pub y_iso: f64,
    pub z_iso: f64,
    pub grid_x: f64,
    pub grid_y: f64,
    pub material_id: u32,
    pub ambient_occlusion: f64,
    pub edge_blend_mask: f64,
}

// --- Level 3: Actor & Prop Isometric Depth Render Info ---
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ActorRenderInfo {
    pub id: String,
    pub x_iso: f64,
    pub y_iso: f64,
    pub depth: f64,
    pub sprite_id: String,
    pub damage_fractal_scale: f64,
    pub shadow_scale: f64,
}

// --- Level 4: Item & Particle Vector Trajectory ---
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ParticleVertex {
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub age: f64,
    pub life: f64,
    pub temperature: f64,
    pub transparency: f64,
}

pub struct FractalDetailEngine {
    simplex: OpenSimplex,
    worley: Worley,
    ridged: RidgedMulti<OpenSimplex>,
    pub seed: u32,
}

impl Default for FractalDetailEngine {
    fn default() -> Self {
        Self::new(rand::random::<u32>())
    }
}

impl FractalDetailEngine {
    pub fn new(seed: u32) -> Self {
        Self {
            simplex: OpenSimplex::new(seed),
            worley: Worley::new(seed),
            ridged: RidgedMulti::new(seed + 100),
            seed,
        }
    }

    /// State-of-the-Art Hybrid Terrain Generation
    /// Layers low-frequency Simplex, mid-frequency Ridged, and high-frequency Worley
    pub fn hybrid_elevation(&self, x: f64, y: f64) -> f64 {
        // 1. Low-frequency base Simplex (Rolling hills / Base continents)
        let base = (self.simplex.get([x * 0.003, y * 0.003]) + 1.0) / 2.0;
        
        // 2. Mid-frequency Ridged Multifractal (Jagged Mountains)
        // High steepness areas are weighted towards the base peaks
        let ridge_freq = 0.015;
        let ridge_noise = (self.ridged.get([x * ridge_freq, y * ridge_freq]) + 1.0) / 2.0;
        let ridge_weight = (base * 1.8 - 0.65).clamp(0.0, 1.0);
        
        // 3. High-frequency Worley (Crystalline Cracks, Cliffs, and Canyons)
        let voronoi_freq = 0.08;
        let cellular = self.worley.get([x * voronoi_freq, y * voronoi_freq]);
        let canyon = (1.0 - cellular.abs()).powf(5.0); // Create sharp "V" canyons
        
        // Combine layers with exponential distribution for true geological profile
        let mut h = base;
        
        // Blend in mountains
        h = h * (1.0 - ridge_weight) + ridge_noise * ridge_weight;
        
        // Sculpt plateaus and dry riverbeds using cellular noise
        h -= canyon * 0.12 * (1.0 - base); 

        // Apply exponential distribution to flatten valleys and sharpen peaks (Mandelbrot style)
        h = h.powf(1.2);
        
        h.clamp(0.0, 1.0)
    }

    /// Get a grid of 2D samples with a specific resolution (LOD) using the Hybrid Engine
    pub fn get_grid(&self, start_x: f64, start_y: f64, size: usize, resolution: f64) -> Vec<Vec<f64>> {
        let steps = (size as f64 / resolution).floor() as usize;
        let mut grid = vec![vec![0.0; steps]; steps];

        for x in 0..steps {
            for y in 0..steps {
                grid[x][y] = self.hybrid_elevation(
                    start_x + x as f64 * resolution,
                    start_y + y as f64 * resolution,
                );
            }
        }
        
        // Post-Process: Particle-based Hydraulic Erosion simulator
        self.apply_hydraulic_erosion(&mut grid, 5); // 5 passes for high detail
        
        // Post-Process: Thermal Erosion (Slope stabilization)
        self.apply_thermal_erosion(&mut grid, 3, 0.1); 

        grid
    }

    /// Simulate thermal erosion: stabilizing slopes exceeding a critical angle
    fn apply_thermal_erosion(&self, grid: &mut Vec<Vec<f64>>, passes: usize, talus_angle: f64) {
        let steps = grid.len();
        for _ in 0..passes {
            for x in 0..steps {
                for y in 0..steps {
                    let h = grid[x][y];
                    let neighbors = [
                        (x as i32 - 1, y as i32), (x as i32 + 1, y as i32),
                        (x as i32, y as i32 - 1), (x as i32, y as i32 + 1)
                    ];
                    
                    for (nx, ny) in neighbors {
                        if nx >= 0 && nx < steps as i32 && ny >= 0 && ny < steps as i32 {
                            let nh = grid[nx as usize][ny as usize];
                            let diff = h - nh;
                            if diff > talus_angle {
                                let erosion = (diff - talus_angle) * 0.1;
                                grid[x][y] -= erosion;
                                grid[nx as usize][ny as usize] += erosion;
                            }
                        }
                    }
                }
            }
        }
    }

    /// Simulate tectonic plate stress based on large-scale noise gradients
    pub fn get_tectonic_stress(&self, x: f64, y: f64) -> f64 {
        // Tectonic plates are large-scale features
        let plate_noise = self.simplex.get([x * 0.0001, y * 0.0001]);
        let fault_line = (plate_noise.abs() - 0.05).abs();
        let stress = (1.0 - (fault_line * 10.0).clamp(0.0, 1.0)).powf(2.0);
        stress
    }

    /// Simulate hydraulic erosion by smoothing steep drops and following gravitational gradients
    fn apply_hydraulic_erosion(&self, grid: &mut Vec<Vec<f64>>, passes: usize) {
        let steps = grid.len();
        if steps < 2 { return; }

        for _ in 0..passes {
            for x in 1..steps-1 {
                for y in 1..steps-1 {
                    let h = grid[x][y];
                    
                    // Find lowest neighbor to define "river" flow direction
                    let mut lowest = h;
                    let neighbors = [(x-1,y), (x+1,y), (x,y-1), (x,y+1)];
                    let mut target = (x, y);
                    
                    for (nx, ny) in neighbors {
                        if grid[nx][ny] < lowest {
                            lowest = grid[nx][ny];
                            target = (nx, ny);
                        }
                    }
                    
                    if h > lowest {
                        let diff = h - lowest;
                        let sediment_amount = diff * 0.1; // Carry 10% sediment down
                        grid[x][y] -= sediment_amount;
                        grid[target.0][target.1] += sediment_amount * 0.5; // Deposit some at target
                    }
                }
            }
        }
    }

    // --- LEVEL 0: Procedural Spherical Planetary Mesh Generation ---
    pub fn get_planetary_mesh(&self, subdivisions: usize) -> Vec<PlanetaryVertex> {
        let mut mesh = Vec::with_capacity(subdivisions * subdivisions);
        
        for i in 0..subdivisions {
            let lat = (i as f64 / subdivisions as f64) * std::f64::consts::PI - std::f64::consts::FRAC_PI_2;
            for j in 0..subdivisions {
                let lon = (j as f64 / subdivisions as f64) * std::f64::consts::TAU;
                
                let x = lat.cos() * lon.cos();
                let y = lat.cos() * lon.sin();
                let z = lat.sin();
                
                let elevation = self.hybrid_elevation(x * 1000.0, y * 1000.0);
                let aridity = (lat.sin().abs() * 0.75 + self.hybrid_elevation(x * 500.0, y * 500.0) * 0.25).clamp(0.0, 1.0);
                let stress = self.hybrid_elevation(x * 200.0, y * 200.0);
                
                mesh.push(PlanetaryVertex {
                    x,
                    y,
                    z,
                    u: j as f64 / subdivisions as f64,
                    v: i as f64 / subdivisions as f64,
                    elevation,
                    aridity,
                    tectonic_stress: stress,
                });
            }
        }
        mesh
    }

    // --- LEVEL 1: Regional Vector Winds and Stress Fields ---
    pub fn get_regional_flow_field(&self, start_x: f64, start_y: f64, size: usize, chunk_res: f64) -> Vec<FlowVector> {
        let steps = (size as f64 / chunk_res).floor() as usize;
        let mut vectors = Vec::with_capacity(steps * steps);
        
        for x in 0..steps {
            for y in 0..steps {
                let gx = start_x + x as f64 * chunk_res;
                let gy = start_y + y as f64 * chunk_res;
                
                let noise_x = self.hybrid_elevation(gx * 0.1, gy * 0.1);
                let noise_y = self.hybrid_elevation((gx + 500.0) * 0.1, (gy + 500.0) * 0.1);
                
                let angle = noise_x * std::f64::consts::TAU;
                let magnitude = noise_y * 15.0; 
                
                let tectonic = self.hybrid_elevation(gx * 0.05, gy * 0.05);
                
                vectors.push(FlowVector {
                    x: gx,
                    y: gy,
                    vx: angle.cos() * magnitude,
                    vy: angle.sin() * magnitude,
                    tectonic_risk: tectonic,
                });
            }
        }
        vectors
    }

    // --- LEVEL 2: 2.5D Isometric Vertex Buffer & Ambient Occlusion Mapping ---
    pub fn get_isometric_tile_buffer(&self, start_x: f64, start_y: f64, size: usize, resolution: f64) -> Vec<IsoTileVertex> {
        let steps = (size as f64 / resolution).floor() as usize;
        let mut buffer = Vec::with_capacity(steps * steps);
        
        for x in 0..steps {
            for y in 0..steps {
                let gx = start_x + x as f64 * resolution;
                let gy = start_y + y as f64 * resolution;
                
                let elevation = self.hybrid_elevation(gx, gy);
                
                // standard 2.5D isometric projection equations
                let x_iso = (gx - gy) * 32.0;
                let y_iso = (gx + gy) * 16.0 - elevation * 128.0;
                let z_iso = elevation;
                
                let material_id = if elevation < 0.20 {
                    0 // Deep Trench
                } else if elevation < 0.32 {
                    1 // Continental Shelf
                } else if elevation < 0.60 {
                    2 // Lowland Plain
                } else if elevation < 0.85 {
                    3 // Ridged Highland
                } else {
                    4 // Peak Summit
                };
                
                // Ambient occlusion based on slope gradients
                let elev_e = self.hybrid_elevation(gx + 1.0, gy);
                let elev_s = self.hybrid_elevation(gx, gy + 1.0);
                let ao = (1.0 - (elev_e - elevation).abs() * 0.5 - (elev_s - elevation).abs() * 0.5).clamp(0.2, 1.0);
                
                buffer.push(IsoTileVertex {
                    x_iso,
                    y_iso,
                    z_iso,
                    grid_x: gx,
                    grid_y: gy,
                    material_id,
                    ambient_occlusion: ao,
                    edge_blend_mask: self.hybrid_elevation(gx * 5.0, gy * 5.0),
                });
            }
        }
        buffer
    }

    // --- LEVEL 3: 2.5D Depth Sorting ---
    pub fn get_y_sorted_actors(&self, mut actors: Vec<ActorRenderInfo>) -> Vec<ActorRenderInfo> {
        actors.sort_by(|a, b| {
            a.depth.partial_cmp(&b.depth)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        actors
    }

    // --- LEVEL 4: Particle Trajectories ---
    pub fn get_particle_emission_buffer(&self, emitter_x: f64, emitter_y: f64, particle_count: usize, seed: f64) -> Vec<ParticleVertex> {
        let mut particles = Vec::with_capacity(particle_count);
        for i in 0..particle_count {
            let p_seed = seed + i as f64 * 3.14159;
            let angle = (p_seed.cos() * 9999.0).fract() * std::f64::consts::TAU;
            let speed = 2.0 + (p_seed.sin() * 777.0).fract().abs() * 4.0;
            let life = 1.0 + (p_seed.cos().abs() * 2.0);
            particles.push(ParticleVertex {
                x: emitter_x,
                y: emitter_y,
                vx: angle.cos() * speed,
                vy: angle.sin() * speed,
                age: 0.0,
                life,
                temperature: 20.0 + (p_seed.sin().abs() * 80.0),
                transparency: 1.0,
            });
        }
        particles
    }

    // --- AAA Post-Processing ---
    pub fn get_aaa_effects(&self, camera_zoom: f64, target_depth: f64, active_deity_id: Option<&str>) -> AAAEffectsBuffer {
        let mut bloom_intensity = 1.0;
        let bloom_threshold = 0.45;
        let mut lut_index = 0;
        
        if let Some(deity) = active_deity_id {
            match deity {
                "sylphra" => { bloom_intensity = 1.4; lut_index = 1; }
                "vulcanus" => { bloom_intensity = 3.2; lut_index = 2; }
                "thalassor" => { bloom_intensity = 1.2; lut_index = 3; }
                "aethelgard" => { bloom_intensity = 4.0; lut_index = 4; }
                _ => {}
            }
        }
        
        AAAEffectsBuffer {
            bloom_intensity,
            bloom_threshold,
            dof_focus_plane: target_depth,
            dof_focus_range: 200.0 / camera_zoom.clamp(0.2, 5.0),
            dof_blur_far: 8.0,
            dof_blur_near: 12.0,
            chromatic_aberration_radial: 0.005,
            lut_index,
        }
    }
}
