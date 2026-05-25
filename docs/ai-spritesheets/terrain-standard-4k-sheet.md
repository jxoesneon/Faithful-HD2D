# 4K Sprite Sheet: Terrain: Standard & Water
**Dimensions**: 4096 x 4096 pixels (1:1 Ratio)
**Grid Layout**: 8x8 Cells (64 Cells total)
**Cell Size**: 512 x 512 pixels per cell
**Perspective**: Isometric (2:1 ratio)

*Note: Every subject represents a full animation lifecycle occupying an entire 8-frame row, ensuring 100% logic coverage across the ECS engine.*

Base terrain tiles with procedural variation and coastal animations.

## Row 1: Verdant Grass (`tile_grass`)
* **Cell 0,0** [`base`]: **Base Tile** - Verdant Grass core isometric block.
* **Cell 1,0** [`var_1`]: **Variant 1** - Verdant Grass subtle surface variation.
* **Cell 2,0** [`var_2`]: **Variant 2** - Verdant Grass medium surface variation.
* **Cell 3,0** [`anim_1`]: **Anim 1** - Verdant Grass active loop frame 1 (e.g., wind ripple).
* **Cell 4,0** [`anim_2`]: **Anim 2** - Verdant Grass active loop frame 2.
* **Cell 5,0** [`anim_3`]: **Anim 3** - Verdant Grass active loop frame 3.
* **Cell 6,0** [`anim_4`]: **Anim 4** - Verdant Grass active loop frame 4.
* **Cell 7,0** [`coast`]: **Coast/Edge** - Verdant Grass sloping edge blending down.

## Row 2: Brown Dirt / Path (`tile_dirt`)
* **Cell 0,1** [`base`]: **Base Tile** - Brown Dirt / Path core isometric block.
* **Cell 1,1** [`var_1`]: **Variant 1** - Brown Dirt / Path subtle surface variation.
* **Cell 2,1** [`var_2`]: **Variant 2** - Brown Dirt / Path medium surface variation.
* **Cell 3,1** [`anim_1`]: **Anim 1** - Brown Dirt / Path active loop frame 1 (e.g., wind ripple).
* **Cell 4,1** [`anim_2`]: **Anim 2** - Brown Dirt / Path active loop frame 2.
* **Cell 5,1** [`anim_3`]: **Anim 3** - Brown Dirt / Path active loop frame 3.
* **Cell 6,1** [`anim_4`]: **Anim 4** - Brown Dirt / Path active loop frame 4.
* **Cell 7,1** [`coast`]: **Coast/Edge** - Brown Dirt / Path sloping edge blending down.

## Row 3: Desert Sand (`tile_sand`)
* **Cell 0,2** [`base`]: **Base Tile** - Desert Sand core isometric block.
* **Cell 1,2** [`var_1`]: **Variant 1** - Desert Sand subtle surface variation.
* **Cell 2,2** [`var_2`]: **Variant 2** - Desert Sand medium surface variation.
* **Cell 3,2** [`anim_1`]: **Anim 1** - Desert Sand active loop frame 1 (e.g., wind ripple).
* **Cell 4,2** [`anim_2`]: **Anim 2** - Desert Sand active loop frame 2.
* **Cell 5,2** [`anim_3`]: **Anim 3** - Desert Sand active loop frame 3.
* **Cell 6,2** [`anim_4`]: **Anim 4** - Desert Sand active loop frame 4.
* **Cell 7,2** [`coast`]: **Coast/Edge** - Desert Sand sloping edge blending down.

## Row 4: Tundra Snow (`tile_snow`)
* **Cell 0,3** [`base`]: **Base Tile** - Tundra Snow core isometric block.
* **Cell 1,3** [`var_1`]: **Variant 1** - Tundra Snow subtle surface variation.
* **Cell 2,3** [`var_2`]: **Variant 2** - Tundra Snow medium surface variation.
* **Cell 3,3** [`anim_1`]: **Anim 1** - Tundra Snow active loop frame 1 (e.g., wind ripple).
* **Cell 4,3** [`anim_2`]: **Anim 2** - Tundra Snow active loop frame 2.
* **Cell 5,3** [`anim_3`]: **Anim 3** - Tundra Snow active loop frame 3.
* **Cell 6,3** [`anim_4`]: **Anim 4** - Tundra Snow active loop frame 4.
* **Cell 7,3** [`coast`]: **Coast/Edge** - Tundra Snow sloping edge blending down.

## Row 5: Shallow Water (`tile_water_shallow`)
* **Cell 0,4** [`base`]: **Base Tile** - Shallow Water core isometric block.
* **Cell 1,4** [`var_1`]: **Variant 1** - Shallow Water subtle surface variation.
* **Cell 2,4** [`var_2`]: **Variant 2** - Shallow Water medium surface variation.
* **Cell 3,4** [`anim_1`]: **Anim 1** - Shallow Water active loop frame 1 (e.g., wind ripple).
* **Cell 4,4** [`anim_2`]: **Anim 2** - Shallow Water active loop frame 2.
* **Cell 5,4** [`anim_3`]: **Anim 3** - Shallow Water active loop frame 3.
* **Cell 6,4** [`anim_4`]: **Anim 4** - Shallow Water active loop frame 4.
* **Cell 7,4** [`coast`]: **Coast/Edge** - Shallow Water sloping edge blending down.

## Row 6: Deep Ocean Water (`tile_water_deep`)
* **Cell 0,5** [`base`]: **Base Tile** - Deep Ocean Water core isometric block.
* **Cell 1,5** [`var_1`]: **Variant 1** - Deep Ocean Water subtle surface variation.
* **Cell 2,5** [`var_2`]: **Variant 2** - Deep Ocean Water medium surface variation.
* **Cell 3,5** [`anim_1`]: **Anim 1** - Deep Ocean Water active loop frame 1 (e.g., wind ripple).
* **Cell 4,5** [`anim_2`]: **Anim 2** - Deep Ocean Water active loop frame 2.
* **Cell 5,5** [`anim_3`]: **Anim 3** - Deep Ocean Water active loop frame 3.
* **Cell 6,5** [`anim_4`]: **Anim 4** - Deep Ocean Water active loop frame 4.
* **Cell 7,5** [`coast`]: **Coast/Edge** - Deep Ocean Water sloping edge blending down.

## Row 7: Volcanic Magma Flow (`tile_lava`)
* **Cell 0,6** [`base`]: **Base Tile** - Volcanic Magma Flow core isometric block.
* **Cell 1,6** [`var_1`]: **Variant 1** - Volcanic Magma Flow subtle surface variation.
* **Cell 2,6** [`var_2`]: **Variant 2** - Volcanic Magma Flow medium surface variation.
* **Cell 3,6** [`anim_1`]: **Anim 1** - Volcanic Magma Flow active loop frame 1 (e.g., wind ripple).
* **Cell 4,6** [`anim_2`]: **Anim 2** - Volcanic Magma Flow active loop frame 2.
* **Cell 5,6** [`anim_3`]: **Anim 3** - Volcanic Magma Flow active loop frame 3.
* **Cell 6,6** [`anim_4`]: **Anim 4** - Volcanic Magma Flow active loop frame 4.
* **Cell 7,6** [`coast`]: **Coast/Edge** - Volcanic Magma Flow sloping edge blending down.

## Row 8: Blighted Toxic Sludge (`tile_toxic`)
* **Cell 0,7** [`base`]: **Base Tile** - Blighted Toxic Sludge core isometric block.
* **Cell 1,7** [`var_1`]: **Variant 1** - Blighted Toxic Sludge subtle surface variation.
* **Cell 2,7** [`var_2`]: **Variant 2** - Blighted Toxic Sludge medium surface variation.
* **Cell 3,7** [`anim_1`]: **Anim 1** - Blighted Toxic Sludge active loop frame 1 (e.g., wind ripple).
* **Cell 4,7** [`anim_2`]: **Anim 2** - Blighted Toxic Sludge active loop frame 2.
* **Cell 5,7** [`anim_3`]: **Anim 3** - Blighted Toxic Sludge active loop frame 3.
* **Cell 6,7** [`anim_4`]: **Anim 4** - Blighted Toxic Sludge active loop frame 4.
* **Cell 7,7** [`coast`]: **Coast/Edge** - Blighted Toxic Sludge sloping edge blending down.

