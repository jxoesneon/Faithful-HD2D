# Faithful: Cutting-Edge 2.5D Architecture Blueprint

## Objective
Establish a cutting-edge 2.5D game architecture for 'Faithful' that exceeds current professional HD-2D standards by combining high-fidelity WebGL rendering with a sophisticated Rust-based geological simulation core.

---

## Core Pillars & Requirements

### 1. Visual Frontier (HD-2D+)
**Goal:** Deliver a visual experience that combines the charm of pixel art with the depth and lighting of modern 3D titles.
- **Normal-Mapped Sprite Rendering:** Every sprite (character, building, flora) will have an associated normal map generated or manually tuned to allow for dynamic, direction-aware lighting.
- **Dynamic World-Space Lighting:** Support for multiple light sources (point, directional, spot) that interact with the terrain and sprites via a deferred rendering pipeline.
- **Professional Post-Processing:** 
  - **Volumetric Rays (God Rays):** Screen-space light scattering for atmospheric depth.
  - **Depth-of-Field (DoF):** Bokeh-style blurring based on focus distance to emphasize scale.
  - **Bloom & Tonemapping:** High-dynamic range (HDR) handling for miraculous effects and disasters.

### 2. Simulation Frontier
**Goal:** A planetary-scale simulation driven by rigorous geological and ecological models.
- **Advanced Geological Rust Core:**
  - **Hydraulic Erosion:** Particle-based water flow that carves rivers and basins over time.
  - **Thermal Erosion:** Modeling the breakdown of slopes and peaks due to temperature cycles.
  - **Tectonic Stress:** Simulating plate movement to generate mountain ranges and fault lines.
- **Hydrated/Exponential Fractal Terrain:** Moving beyond simple Perlin noise to a multi-octave, hydrated fractal system that creates realistic biomes and landmass distributions.

### 3. Performance Frontier
**Goal:** Smooth, stutter-free performance even at extreme zoom levels and high entity counts.
- **'Infinite Resolution' Zoom:** A Mandelbrot-inspired system that dynamically generates and culls quadtree nodes based on view distance.
- **WASM-GPU Synchronization:**
  - **Direct Memory Access:** Use `SharedArrayBuffer` for zero-copy data transfer between the Rust simulation and the WebGL renderer.
  - **Instanced Rendering:** Massive batching of entities to minimize draw calls.
- **Dynamic Quadtree Culling:** Efficiently pruning off-screen and low-detail nodes to save cycles.

### 4. Tooling Frontier
**Goal:** A unified pipeline for creators to integrate assets with professional precision.
- **Registry Architect:** A web-based visual editor for sprite metadata.
- **Automated Pivot Detection:** Algorithmic calculation of sprite 'grounding' points.
- **Interaction Surface Hitboxes:** Defining 3D-aware interaction volumes for 2.5D space.
- **GPU Matrix Overrides:** Real-time artist-driven adjustments to entity transforms and materials.

---

## Phase 1: Foundation & Rendering (Step 1-3)

### Step 1: The HD-2D+ Pipeline
- **Persona:** `webgl-wizard`, `visual-architect`
- **Context Brief:** Refactor the current PixiJS-based renderer to a custom WebGL deferred pipeline.
- **Tasks:**
  - Implement G-Buffers (Albedo, Normal, Depth, Material).
  - Create a Sprite shader supporting normal maps and specular highlights.
  - Build the deferred lighting pass with support for world-space light volumes.
- **Verification:** 
  - Visual check: Sprites should cast/receive shadows from moving light sources.
  - Performance: Maintain 60fps with 50+ active lights.
- **Exit Criteria:** A working deferred renderer displaying normal-mapped sprites.

### Step 2: Advanced Geological Core
- **Persona:** `rust-evangelist`
- **Context Brief:** Enhance the `faithful-engine` fractal system with physical erosion and tectonic modeling.
- **Tasks:**
  - Implement particle-based hydraulic erosion in `fractal.rs`.
  - Add thermal erosion pass for slope stabilization.
  - Implement tectonic plate simulation for large-scale terrain formation.
- **Verification:** 
  - Run `cargo test` in `faithful-engine`.
  - Visual check: Terrain should show realistic drainage patterns and mountain ridges.
- **Exit Criteria:** Rust core generates geologically plausible terrain at various scales.

### Step 3: Performance Bridge (WASM-GPU)
- **Persona:** `performance-optimizer`
- **Context Brief:** Optimize the data flow between Rust and WebGL to support millions of entities.
- **Tasks:**
  - Implement `SharedArrayBuffer` for entity transforms and states.
  - Build a dynamic quadtree management system in JS that pools simulation chunks.
  - Implement hierarchical LOD for sprites (switching to dots/icons at high zoom).
- **Verification:** 
  - Profile using Chrome DevTools: WASM-to-JS overhead should be < 1ms.
  - Stress test: 100,000+ entities visible without dropping below 30fps.
- **Exit Criteria:** Seamless zoom from planetary view to individual character level.

---

## Phase 2: Tooling & Integration (Step 4-5)

### Step 4: Registry Architect Integration
- **Persona:** `game-designer`
- **Context Brief:** Create a unified tool for asset management and interactive property tuning.
- **Tasks:**
  - Build the 'Registry Architect' UI component in React.
  - Implement automated pivot detection using alpha-channel analysis.
  - Add real-time GPU matrix override sliders for offset/scale/tilt adjustments.
- **Verification:** 
  - Asset import flow: A new sprite can be ground-aligned automatically.
  - Real-time updates: Changing a scale override reflects immediately in the renderer.
- **Exit Criteria:** A functional internal tool for rapid asset integration.

### Step 5: Master Integration & Polish
- **Persona:** `all`
- **Tasks:**
  - Integrate post-processing stack (DoF, God Rays).
  - Connect simulation events (disasters, miracles) to the visual effects system.
  - Final performance pass and battery-saver mode implementation.
- **Verification:** 
  - End-to-end gameplay loop test.
  - Device compatibility test (Mobile/Desktop).
- **Exit Criteria:** A polished, "cutting-edge" architecture ready for content production.
