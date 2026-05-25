# VFX & Divine Intervention Sprites

Visual effects translate the unseen mechanical math of the simulation into player-facing feedback across all simulation levels.

## L0: Planetary (Global Scale)

- **Atmospheric Events**: Global auroras representing massive Devotion spikes, planetary cloud layers.
- **Cataclysms**: Massive orbital strikes, global tectonic fractures glowing from space.
- **Faith Overlay**: "Faith Fog", a semi-transparent colored shader interpolating the dominant global religion over the sphere.

## L1: Region (Macro Scale)

- **Weather Fronts**: Rolling storm clouds crossing regional borders, regional drought scorch-marks.
- **Schisms**: Massive border-clashes represented by glowing fault-lines of conflicting beliefs (e.g., Crimson vs. Blue sparks along a border).
- **Macro-Miracles**: Entire regions pulsating with golden light during a sustained era of peace/growth.

## L2: Tile / Action (Meso Scale)

- **Divine Interventions (The Miracles)**:
  - _Rainfall / Genesis_: Translucent blue vertical streaks passing through the screen, culminating in a sprawling green volumetric mist that rapidly converts arid tiles to lush grassland.
  - _Meteor Impact (Elemental)_: Expanding shockwave sprites followed by a permanent crater scorch decal, applying extreme screenshake and chromatic aberration to the viewport.
  - _Healing Pulse (Interventionist)_: A golden ripple expanding from a specific epicenter tile, applying a holy emission map glow to all friendly structures and actors in radius.
  - _Abyssal Rift (Nihilism)_: A jagged purple/black tear in the ground tile. Summons chaotic gravity vortices, pulling in loose L4 items and applying heavy post-processing distortion.
- **Status Indicators (UI Overlays in World)**: Floating semantic icons above tiles bounding with a sine-wave animation (Exclamation marks for unrest, Crossed Swords for war, Golden Praying Hands for periods of high devotion).

## L3: Entity (Micro Scale)

- **Combat & Friction**: When entities clash, standard sprite rendering is augmented with intense particle bursts: sparks of clashing metal, red pixel blood spatters, or cyan data-corruption glitches when fighting Technocratic units.
- **Worship**: Small, glowing "soul" or "prayer" particles continuously rising from specific citizen sprites praying at an altar, fading via alpha decay.
- **Auras & Decals**: Ground-plane rings rendered strictly beneath citizen feet (e.g., pulsing red ring for plague, bright green ring for blessed/healed).

## L4: UI & Connecting Threads (Atomic Scale)

- **Ley-lines (The Faith Network)**: Bright, animated spline meshes. These are thin, energetic strands visually connecting Level 3 actors directly to their Level 2 temples, illustrating exactly where Devotion is flowing. Ley-lines snap and spark wildly during a religious schism.
- **Feedback Sparks**: Tiny UI particles flying from the map space directly up into the player's 2D Divine Console (literally transferring space-to-screen to represent harvested Devotion points).
- **Cursor FX**: The divine cursor acts as the player's avatar. It trails dynamic particles depending on the currently selected intervention type (e.g., trailing ember sparks when "Meteor" is primed; dripping ethereal water when "Rainfall" is selected).

# Complete Sprite Registry & VFX Reference

Every divine intervention miracle and elemental disaster event is mathematically defined below.

## Complete Sprite Reference: Miracles & Disasters

| Subject ID | Name | Sprite Sheet | Detailed Documentation |
| :--- | :--- | :--- | :--- |
| `vfx_meteor` | Meteor Strike & Explosion | `vfx-disasters-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-disasters-4k-sheet.md) |
| `vfx_earthquake` | Earthquake Fissure Tear | `vfx-disasters-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-disasters-4k-sheet.md) |
| `vfx_lightning` | Lightning Bolt Strike | `vfx-disasters-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-disasters-4k-sheet.md) |
| `vfx_plague` | Plague Cloud / Miasma | `vfx-disasters-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-disasters-4k-sheet.md) |
| `vfx_abyss_rift` | Abyssal Void Tear | `vfx-disasters-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-disasters-4k-sheet.md) |
| `vfx_sparks` | Combat Clashing Sparks | `vfx-disasters-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-disasters-4k-sheet.md) |
| `vfx_blood` | Combat Blood Spatter | `vfx-disasters-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-disasters-4k-sheet.md) |
| `vfx_glitch` | Cyber-Glitch Damage | `vfx-disasters-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-disasters-4k-sheet.md) |
| `vfx_heal` | Healing Pulse Ring | `vfx-miracles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-miracles-4k-sheet.md) |
| `vfx_holy_beam` | Descending Holy Light Beam | `vfx-miracles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-miracles-4k-sheet.md) |
| `vfx_genesis` | Genesis Nature Bloom | `vfx-miracles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-miracles-4k-sheet.md) |
| `vfx_rain` | Soothing Rainfall | `vfx-miracles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-miracles-4k-sheet.md) |
| `vfx_ascend` | Ascension Tractor Beam | `vfx-miracles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-miracles-4k-sheet.md) |
| `vfx_shield` | Divine Energy Shield Bubble | `vfx-miracles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-miracles-4k-sheet.md) |
| `vfx_bless_aura` | Blessed Golden Ground Aura | `vfx-miracles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-miracles-4k-sheet.md) |
| `vfx_convert` | Faith Conversion Color Wave | `vfx-miracles-4k-sheet` | [Detailed Sheet Reference](file:///Users/meilynlopezcubero/antigravity/Faithful/docs/ai-spritesheets/vfx-miracles-4k-sheet.md) |

