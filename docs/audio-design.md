# Audio Design & Dynamic Soundscapes

The audio engine in Faithful is not a static tracklist; it is a dynamic, procedurally layered soundscape that responds directly to the simulation scale (L0 - L4) and the dominant Faith of the region currently under observation.

## L0: Planetary (Global Scale - The Sphere)

- **Concept**: The Sound of the Cosmos.
- **Music**: Deep, drone-heavy ambient tracks. Low-frequency hums and slow, sweeping synthesizer pads.
- **SFX**: None. The scale is too massive to hear physical events.
- **Mix**: Highly reverbed, isolating the player in the void of space.

## L1: Region (Macro Scale - The Map)

- **Concept**: The Breath of the Continent.
- **Music**: The ambient drone introduces rhythmic motifs based on the region's dominant Faith (e.g., distant, slow tribal drums for Animism; erratic, synthetic arpeggios for Technocracy; somber organ chords for Interventionist).
- **SFX**: Macro weather patterns. Deep, rolling thunder from overlapping storm systems, howling blizzards, or the low rumble of shifting tectonic plates.

## L2: Settlement / Tile (Meso Scale - The Grid)

- **Concept**: The Bustle of Life.
- **Music**: The core musical track kicks in, utilizing a dynamic stem system. As population density and Devotion yields increase, more stems (melody, percussion, bass) fade into the mix.
- **SFX**: 2D Spatial audio (panned left/right based on screen position).
  - _Environmental_: Flowing river loops, crackling localized fires, wind rushing through dense foliage.
  - _Societal_: A generic "crowd murmur" loop, the volume of which is tied directly to the settlement's population integer.
- **Scale Blending**: Zooming out smoothly low-pass filters the L2 SFX until they fade entirely at L1.

## L3: Entity / Structure (Micro Scale - The Actors)

- **Concept**: The Foley Layer.
- **SFX (Foley)**: Granular, specific sounds triggered precisely by animation frames (e.g., the _clack_ of a stone pickaxe, the _thud_ of timber falling, individual animal grazing sounds).
- **Vocalization**: Citizens emit procedurally randomized "murmur" syllables (Simlish-style) when clicked, during trade, or during religious schisms.
- **Culling**: The audio engine strictly limits simultaneous L3 SFX to 16 channels to prevent a wall of noise during large, dense city simulations.

## L4: UI & Atomic (The Divine Interface)

- **Concept**: The Player's Interaction.
- **SFX**: High-fidelity, crisp, non-diegetic sounds that cut through the game mix.
  - _Devotion Chimes_: Soft, resonant, ethereal chimes when Devotion is harvested from the map.
  - _Intervention Priming_: A rising, resonant tone when holding the mouse button to warm up a Miracle (e.g., Meteor Strike).
  - _System Alerts_: Glitchy, urgent notifications when a Schism or Catastrophe occurs.
