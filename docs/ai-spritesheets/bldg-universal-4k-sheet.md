# 4K Sprite Sheet: Buildings: Universal & Defenses
**Dimensions**: 4096 x 4096 pixels (1:1 Ratio)
**Grid Layout**: 8x8 Cells (64 Cells total)
**Cell Size**: 512 x 512 pixels per cell
**Perspective**: Isometric (2:1 ratio)

*Note: Every subject represents a full animation lifecycle occupying an entire 8-frame row, ensuring 100% logic coverage across the ECS engine.*

Construction and active states for shared structures.

## Row 1: Universal Wood Granary (`bldg_uni_granary`)
* **Cell 0,0** [`found`]: **Foundation** - Universal Wood Granary dirt outline and base stones laid.
* **Cell 1,0** [`scaffold`]: **Scaffold** - Universal Wood Granary wooden supports, half built.
* **Cell 2,0** [`idle_1`]: **Idle 1** - Universal Wood Granary fully built, inactive, unlit.
* **Cell 3,0** [`idle_2`]: **Idle 2** - Universal Wood Granary fully built, subtle lighting shift.
* **Cell 4,0** [`act_1`]: **Active 1** - Universal Wood Granary working: smoke exiting chimney or energy pulsing.
* **Cell 5,0** [`act_2`]: **Active 2** - Universal Wood Granary working: alternate frame (wheel turned).
* **Cell 6,0** [`damaged`]: **Damaged** - Universal Wood Granary cracked walls, small flames.
* **Cell 7,0** [`ruined`]: **Ruined** - Universal Wood Granary collapsed rubble pile.

## Row 2: Universal Stone Silo (`bldg_uni_stone_silo`)
* **Cell 0,1** [`found`]: **Foundation** - Universal Stone Silo dirt outline and base stones laid.
* **Cell 1,1** [`scaffold`]: **Scaffold** - Universal Stone Silo wooden supports, half built.
* **Cell 2,1** [`idle_1`]: **Idle 1** - Universal Stone Silo fully built, inactive, unlit.
* **Cell 3,1** [`idle_2`]: **Idle 2** - Universal Stone Silo fully built, subtle lighting shift.
* **Cell 4,1** [`act_1`]: **Active 1** - Universal Stone Silo working: smoke exiting chimney or energy pulsing.
* **Cell 5,1** [`act_2`]: **Active 2** - Universal Stone Silo working: alternate frame (wheel turned).
* **Cell 6,1** [`damaged`]: **Damaged** - Universal Stone Silo cracked walls, small flames.
* **Cell 7,1** [`ruined`]: **Ruined** - Universal Stone Silo collapsed rubble pile.

## Row 3: Wooden Palisade Wall (`bldg_uni_wall_l1`)
* **Cell 0,2** [`found`]: **Foundation** - Wooden Palisade Wall dirt outline and base stones laid.
* **Cell 1,2** [`scaffold`]: **Scaffold** - Wooden Palisade Wall wooden supports, half built.
* **Cell 2,2** [`idle_1`]: **Idle 1** - Wooden Palisade Wall fully built, inactive, unlit.
* **Cell 3,2** [`idle_2`]: **Idle 2** - Wooden Palisade Wall fully built, subtle lighting shift.
* **Cell 4,2** [`act_1`]: **Active 1** - Wooden Palisade Wall working: smoke exiting chimney or energy pulsing.
* **Cell 5,2** [`act_2`]: **Active 2** - Wooden Palisade Wall working: alternate frame (wheel turned).
* **Cell 6,2** [`damaged`]: **Damaged** - Wooden Palisade Wall cracked walls, small flames.
* **Cell 7,2** [`ruined`]: **Ruined** - Wooden Palisade Wall collapsed rubble pile.

## Row 4: Stone Brick Wall (`bldg_uni_wall_l2`)
* **Cell 0,3** [`found`]: **Foundation** - Stone Brick Wall dirt outline and base stones laid.
* **Cell 1,3** [`scaffold`]: **Scaffold** - Stone Brick Wall wooden supports, half built.
* **Cell 2,3** [`idle_1`]: **Idle 1** - Stone Brick Wall fully built, inactive, unlit.
* **Cell 3,3** [`idle_2`]: **Idle 2** - Stone Brick Wall fully built, subtle lighting shift.
* **Cell 4,3** [`act_1`]: **Active 1** - Stone Brick Wall working: smoke exiting chimney or energy pulsing.
* **Cell 5,3** [`act_2`]: **Active 2** - Stone Brick Wall working: alternate frame (wheel turned).
* **Cell 6,3** [`damaged`]: **Damaged** - Stone Brick Wall cracked walls, small flames.
* **Cell 7,3** [`ruined`]: **Ruined** - Stone Brick Wall collapsed rubble pile.

## Row 5: Cyber Blast-Wall (`bldg_uni_wall_l3`)
* **Cell 0,4** [`found`]: **Foundation** - Cyber Blast-Wall dirt outline and base stones laid.
* **Cell 1,4** [`scaffold`]: **Scaffold** - Cyber Blast-Wall wooden supports, half built.
* **Cell 2,4** [`idle_1`]: **Idle 1** - Cyber Blast-Wall fully built, inactive, unlit.
* **Cell 3,4** [`idle_2`]: **Idle 2** - Cyber Blast-Wall fully built, subtle lighting shift.
* **Cell 4,4** [`act_1`]: **Active 1** - Cyber Blast-Wall working: smoke exiting chimney or energy pulsing.
* **Cell 5,4** [`act_2`]: **Active 2** - Cyber Blast-Wall working: alternate frame (wheel turned).
* **Cell 6,4** [`damaged`]: **Damaged** - Cyber Blast-Wall cracked walls, small flames.
* **Cell 7,4** [`ruined`]: **Ruined** - Cyber Blast-Wall collapsed rubble pile.

## Row 6: Wooden Watchtower (`bldg_uni_tower_l1`)
* **Cell 0,5** [`found`]: **Foundation** - Wooden Watchtower dirt outline and base stones laid.
* **Cell 1,5** [`scaffold`]: **Scaffold** - Wooden Watchtower wooden supports, half built.
* **Cell 2,5** [`idle_1`]: **Idle 1** - Wooden Watchtower fully built, inactive, unlit.
* **Cell 3,5** [`idle_2`]: **Idle 2** - Wooden Watchtower fully built, subtle lighting shift.
* **Cell 4,5** [`act_1`]: **Active 1** - Wooden Watchtower working: smoke exiting chimney or energy pulsing.
* **Cell 5,5** [`act_2`]: **Active 2** - Wooden Watchtower working: alternate frame (wheel turned).
* **Cell 6,5** [`damaged`]: **Damaged** - Wooden Watchtower cracked walls, small flames.
* **Cell 7,5** [`ruined`]: **Ruined** - Wooden Watchtower collapsed rubble pile.

## Row 7: Stone Keep Tower (`bldg_uni_tower_l2`)
* **Cell 0,6** [`found`]: **Foundation** - Stone Keep Tower dirt outline and base stones laid.
* **Cell 1,6** [`scaffold`]: **Scaffold** - Stone Keep Tower wooden supports, half built.
* **Cell 2,6** [`idle_1`]: **Idle 1** - Stone Keep Tower fully built, inactive, unlit.
* **Cell 3,6** [`idle_2`]: **Idle 2** - Stone Keep Tower fully built, subtle lighting shift.
* **Cell 4,6** [`act_1`]: **Active 1** - Stone Keep Tower working: smoke exiting chimney or energy pulsing.
* **Cell 5,6** [`act_2`]: **Active 2** - Stone Keep Tower working: alternate frame (wheel turned).
* **Cell 6,6** [`damaged`]: **Damaged** - Stone Keep Tower cracked walls, small flames.
* **Cell 7,6** [`ruined`]: **Ruined** - Stone Keep Tower collapsed rubble pile.

## Row 8: Automated Plasma Turret (`bldg_uni_turret_l3`)
* **Cell 0,7** [`found`]: **Foundation** - Automated Plasma Turret dirt outline and base stones laid.
* **Cell 1,7** [`scaffold`]: **Scaffold** - Automated Plasma Turret wooden supports, half built.
* **Cell 2,7** [`idle_1`]: **Idle 1** - Automated Plasma Turret fully built, inactive, unlit.
* **Cell 3,7** [`idle_2`]: **Idle 2** - Automated Plasma Turret fully built, subtle lighting shift.
* **Cell 4,7** [`act_1`]: **Active 1** - Automated Plasma Turret working: smoke exiting chimney or energy pulsing.
* **Cell 5,7** [`act_2`]: **Active 2** - Automated Plasma Turret working: alternate frame (wheel turned).
* **Cell 6,7** [`damaged`]: **Damaged** - Automated Plasma Turret cracked walls, small flames.
* **Cell 7,7** [`ruined`]: **Ruined** - Automated Plasma Turret collapsed rubble pile.

