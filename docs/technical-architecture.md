# Technical Architecture & Data Scaling

The primary engineering challenge of Faithful is simulating a planetary-scale ecosystem populated by millions of entities without thermal throttling the browser.

## Spatial Partitioning & Chunking

The world requires rigorous spatial partitioning to manage memory and CPU cycles.

- **Quadtree System**: The world is divided into a hierarchical quadtree.
- **Chunk Size**: A standard `RegionChunk` strictly contains 64x64 L2 tiles.
- **Active State (The Hot Zone)**: Only chunks overlapping the camera frustum (plus a 1-chunk margin) run the full L2/L3 ECS simulation at 60Hz. Physical actors physically exist here.
- **Dormant State (The Cold Zone)**: Distant chunks are unloaded from active RAM. Their state is deeply serialized, leaving behind a simplified L1 proxy that updates via mathematical formulas at 1Hz (e.g., `population += growth_rate * delta`).

## ECS / Dormancy Transitions

- **De-instantiation (Zooming Out / Panning Away)**: When a chunk transitions from Active to Dormant, the millions of L3 actors (citizens, animals, trees) are dissolved into statistical data buffers.
  - _Example_: 50 specific villagers with individual coordinates, hunger levels, and jobs are destroyed. The chunk simply records `population=50, average_hunger=80, job_distribution=...`.
- **Re-instantiation (Zooming In)**: When a chunk becomes Active, the engine inversely spawns L3 actors based on the statistical buffer, probabilistically placing them near logical anchor points (e.g., spawning villagers near houses).

## Rendering Pipeline (WASM to WebGL)

- **Data Packing**: A WASM module traverses the ECS every frame. It gathers the transforms (x, y, z), sprite IDs, and tint values of all visible L2 and L3 entities, packing them tightly into a single contiguous `Float32Array`.
- **Zero-Copy Interop**: This packed array is shared memory. It is passed to JS (PixiJS or raw WebGL) via zero-copy.
- **Instanced Rendering**: The renderer uses `ANGLE_instanced_arrays` to draw hundreds of thousands of sprites in a single draw call, referencing the packed array as vertex attributes.

## Memory Management (L4 Data)

- Level 4 data (individual item states, exact DNA strings) is highly volatile.
- The engine employs aggressive Object Pooling for all L3 and L4 entities to eliminate Garbage Collection (GC) stutters during massive combat or natural disasters.
