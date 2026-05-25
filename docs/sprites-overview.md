# Faithful: Sprite Design Overview

## Visual Identity

**Faithful** utilizes a high-fidelity 2.5D isometric perspective. The art style is defined as **"Primal-Industrial Fusion"**:

- **Palette**: High contrast with deep shadow depths. Biomes use saturated natural tones, while divine interventions use glowing neon accents (Gold for Theism, Cyan for Technocracy, Crimson for Nihilism).
- **Perspective**: Standard true isometric (2:1 ratio).
- **Scale**: Base tile size is 64x32px. Rendering transitions smoothly through depth levels.

## Hierarchical Rendering & Systems Architecture

The visual and systemic engines scale perfectly with the simulation depth (L0 - L4) to maintain 60FPS:

### L0: Planetary Level

- **Tech**: WebGL/WebGPU custom sphere shaders. Global mathematical physics layers.
- **Detail**: Procedural textures (clouds, temp mapping) mapped to a 3D sphere.

### L1: Macro Level

- **Tech**: Chunk-based texture blending and regional statistical logic (1Hz updates).
- **Detail**: Abstracted regions, moving weather fronts, macro trade-path visualization.

### L2: Meso Level

- **Tech**: Isometric Sprite Batching, active TileGrid pathfinding.
- **Detail**: The primary gameplay view. Individual tiles, settlement clusters, dynamic coastlines.

### L3: Micro Level

- **Tech**: High-frequency ECS (60Hz) within localized Quadtree active chunks.
- **Detail**: Animated actors, structural props, combat loops. Culled when zoomed out.

### L4: Atomic Level

- **Tech**: UI Overlays, GPU Particle Systems, Foley Audio layer.
- **Detail**: Individual items, glowing visual feedback (Miracles, Devotion arcs), precise physical materials.

## Technical Requirements & Material Pipelines

- **Format**: Sprites exported as transparent PNGs (diffuse) bundled with corresponding Normal and Emission maps.
- **Normal Mapping (2.5D Lighting)**: All Level 3 (Actors/Structures) and Level 2 (Tiles) sprites must include Normal Maps. The engine uses a unified directional light (The Sun/Divine Light) which dynamically casts normal-mapped shadows and highlights across the isometric planes.
- **Emission Maps**: Used for bioluminescence (Animism), magma (Elementalism), neon signage (Technocracy), and holy light (Interventionist). Glow intensity pulses based on Devotion loops.
- **Batching & Atlasing**: The engine utilizes WASM-driven sprite batching. All diffuse, normal, and emission assets are packed into separate 4096x4096px WebGL texture arrays to minimize draw calls strictly to 1 or 2 per simulation chunk.

## Specific Color Palettes & Thematic Identifiers

Every sprite must adhere strictly to its religious alignment palette:

- **Animism (Green Faith)**:
  - Base: Deep Moss (`#1E3A2F`)
  - Accent: Vibrant Emerald (`#34D399`)
  - Glow: Bioluminescent Teal (`#2DD4BF`)
- **Elementalism (Cosmic/Primal)**:
  - Base: Obsidian Charcoal (`#1F1F1F`)
  - Accent: Rust/Terracotta (`#C2410C`)
  - Glow: Magma Orange (`#F97316`)
- **Interventionist (Direct Theism)**:
  - Base: Alabaster/Marble (`#F1F5F9`)
  - Accent: Royal Azure (`#1D4ED8`)
  - Glow: Divine Gold (`#FBBF24`)
- **Secular (Technocracy)**:
  - Base: Gunmetal/Chrome (`#334155`)
  - Accent: Sterile White (`#FFFFFF`)
  - Glow: Cyan/Electric Blue (`#06B6D4`)
- **Nihilism (Cults of Ruin)**:
  - Base: Ashen Gray (`#4B5563`)
  - Accent: Dried Bone (`#D6D3D1`)
  - Glow: Sickly Crimson (`#E11D48`)

## Animation Philosophy

- **Environmental Rate**: Fluid and organic. Flora wind-sway operates on a global noise field (simplex). Water ripples use a sine-wave offset in the shader, entirely bypassing the CPU.
- **Societal Rate**: Animation speed acts as visual feedback. Idle "bustle" animations for L2 cities scale their frame updates proportionally with Devotion generation rates (higher devotion = frantic, energetic sprite updating).
- **Divine Quality**: All miracle VFX bypass sprite arrays entirely; they utilize GPU-based particle systems, additive blending, and bloom post-processing filters to ensure miracles feel inherently _otherworldly_ compared to the terrestrial sprites.
