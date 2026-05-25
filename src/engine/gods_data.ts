import { ECS } from './ecs';
import { SimulationEngine } from './simulation';
import { Position, Society, Faith, Flora, Fauna, Structure, Movement, FaithSystemType } from '../types';

export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  reqsDesc: string; // User-facing requirements text
  checkUnlocked: (stats: GameStats, devotion: number, ecs: ECS, sim: SimulationEngine) => boolean;
  action: (ecs: ECS, sim: SimulationEngine) => string; // Returns action outcome log text
}

export interface God {
  id: string;
  name: string;
  title: string;
  description: string;
  element: string; // Flame, Cosmos, Nature, etc.
  color: string; // tailwind color prefix like emerald, purple, orange, sky
  colorHex: string; // CSS color string, e.g., '#10b981'
  avatarPrompt: string; // prompt used for visual aesthetic description
  boostsDesc: string; // starting bonuses description
  startingBoost: (ecs: ECS, sim: SimulationEngine) => void;
  skills: Skill[];
}

export interface GameStats {
  population: number;
  religions: Record<string, number>;
  techAverage: number;
}

export const GODS_PANTHEON: God[] = [
  {
    id: 'sylphra',
    name: 'Sylphra',
    title: 'Zephyr of the Canopy',
    description: 'The gentle spirit of high canopies and soft rustling forest winds. She cherishes mutual growth, deep organic networks, and absolute natural harmony.',
    element: 'Nature & Wind',
    color: 'emerald',
    colorHex: '#10b981',
    avatarPrompt: 'An elegant verdant spirit composed of green leaves and rotating glowing dust particles, soft ambient daylight lighting.',
    boostsDesc: 'Tribes start with +20% maximum happiness, crops grow 50% faster, and initial population gets +10 members across the world.',
    startingBoost: (ecs, sim) => {
      sim.totalDevotion += 50;
      const tribes = ecs.getEntitiesWith(['society']);
      tribes.forEach(e => {
        const soc = ecs.getComponent<Society>(e, 'society')!;
        soc.population += 10;
        soc.happiness = Math.min(100, soc.happiness + 15);
      });
      sim.addEventLog('EVOLUTION', 'Sylphra whispers through the canopies. Mortals feel blessed with deep tranquil safety.');
    },
    skills: [
      {
        id: 'sylphra_crop_burst',
        name: "Zephyr's Breath",
        description: 'Instantly rejuvenates and brings all crop and banana flora reserves in the world to 100% maturity.',
        cost: 30,
        unlocked: false,
        reqsDesc: 'Possess at least 1 active tribe center on the dynamic map.',
        checkUnlocked: (stats, devotion, ecs) => {
          return ecs.getEntitiesWith(['society']).length >= 1;
        },
        action: (ecs, sim) => {
          const floras = ecs.getEntitiesWith(['flora']);
          floras.forEach(f => {
            const flo = ecs.getComponent<Flora>(f, 'flora')!;
            flo.growth = 100;
            flo.isHarvested = false;
          });
          return "Zephyr's Breath swept the lands. All biological flora reached full, ripe maturity instantly.";
        }
      },
      {
        id: 'sylphra_animist_bloom',
        name: 'Whispering Canopy',
        description: 'Deepens mortal roots. Adds +25 Animism devotion matrix points to all co-existing societies.',
        cost: 75,
        unlocked: false,
        reqsDesc: 'Total world population exceeds 80.',
        checkUnlocked: (stats) => {
          return stats.population >= 80;
        },
        action: (ecs, sim) => {
          const tribes = ecs.getEntitiesWith(['faith']);
          tribes.forEach(t => {
            const faith = ecs.getComponent<Faith>(t, 'faith')!;
            faith.beliefMatrix.ANIMISM = Math.min(100, (faith.beliefMatrix.ANIMISM || 0) + 25);
            // Re-evaluate dominance
            let maxVal = -1;
            let dominant: FaithSystemType = faith.dominantSystem;
            for (const [key, val] of Object.entries(faith.beliefMatrix)) {
              if (val > maxVal) {
                maxVal = val;
                dominant = key as FaithSystemType;
              }
            }
            faith.dominantSystem = dominant;
          });
          return "Whispering Canopy connected the minds of mortals. Natural Animism rose dramatically.";
        }
      },
      {
        id: 'sylphra_foliage_aegis',
        name: 'Foliage Aegis',
        description: 'Spawns 4 robust crop reserves and 1 Sacred Altar to shield local populations from predator attacks.',
        cost: 120,
        unlocked: false,
        reqsDesc: 'Average world happiness is above 75%.',
        checkUnlocked: (stats, devotion, ecs) => {
          const tribes = ecs.getEntitiesWith(['society']);
          if (tribes.length === 0) return false;
          const avgH = tribes.reduce((acc, t) => acc + ecs.getComponent<Society>(t, 'society')!.happiness, 0) / tribes.length;
          return avgH > 75;
        },
        action: (ecs, sim) => {
          for(let i=0; i<4; i++){
            const rx = 10 + Math.floor(Math.random() * 44);
            const ry = 10 + Math.floor(Math.random() * 44);
            sim.spawnFlora(rx, ry, 'CROP', 'Hyper Barley');
          }
          const rx = 20 + Math.floor(Math.random() * 24);
          const ry = 20 + Math.floor(Math.random() * 24);
          sim.spawnStructure(rx, ry, 'ALTAR', 'Leafward Shrine');
          return 'Foliage Aegis manifested heavy crops and a leafy Altar to protect the faithful.';
        }
      },
      {
        id: 'sylphra_vernal_sanctuary',
        name: 'Vernal Sanctuary',
        description: 'Summons three divine Holy Divine Bananas around tribal sectors to unleash massive spiritual energy harvests.',
        cost: 200,
        unlocked: false,
        reqsDesc: 'Total world population exceeds 150.',
        checkUnlocked: (stats) => {
          return stats.population >= 150;
        },
        action: (ecs, sim) => {
          const tribes = ecs.getEntitiesWith(['society', 'position']);
          tribes.forEach(t => {
            const pos = ecs.getComponent<Position>(t, 'position')!;
            const rx = Math.max(2, Math.min(61, pos.x + (Math.random() * 6 - 3)));
            const ry = Math.max(2, Math.min(61, pos.y + (Math.random() * 6 - 3)));
            sim.spawnFlora(rx, ry, 'NANO_BANANA', 'DIVINE');
          });
          return 'Vernal Sanctuary completed. Holy Divine Bananas appeared around all mortal borders.';
        }
      }
    ]
  },
  {
    id: 'vulcanus',
    name: 'Vulcanus',
    title: 'Core Ignition',
    description: 'The raging avatar of sub-crust tech metal and tectonic core pressure. He values industrial progress, smelting toolsets, and explosive chemical fuels.',
    element: 'Volcanic & Metal',
    color: 'orange',
    colorHex: '#ea580c',
    avatarPrompt: 'A powerful heavy armor titan forged from black igneous rock with lava flowing through cracks, molten orange fire lighting.',
    boostsDesc: 'Consolidated starting tribes gain +150 raw materials, start with an advanced scientific level (+0.8 Tier), and carry Elementalist religious bias.',
    startingBoost: (ecs, sim) => {
      const tribes = ecs.getEntitiesWith(['society', 'faith']);
      tribes.forEach(e => {
        const soc = ecs.getComponent<Society>(e, 'society')!;
        const faith = ecs.getComponent<Faith>(e, 'faith')!;
        soc.resources += 150;
        soc.technologyLevel += 0.8;
        faith.beliefMatrix.ELEMENTALISM = Math.min(100, (faith.beliefMatrix.ELEMENTALISM || 0) + 30);
      });
      sim.addEventLog('EVOLUTION', 'Vulcanus shakes the magma floor. Mortals ignite their forge fires.');
    },
    skills: [
      {
        id: 'vulcanus_fissure',
        name: 'Thermal Fissure',
        description: 'Cracks open the geological grid, spawning 2 rare Pyromaniac Fire Bananas containing extreme energy metrics.',
        cost: 40,
        unlocked: false,
        reqsDesc: 'Have at least 50 co-existing mortals on the planet.',
        checkUnlocked: (stats) => {
          return stats.population >= 50;
        },
        action: (ecs, sim) => {
          for(let i=0; i<2; i++){
            const rx = 15 + Math.floor(Math.random() * 34);
            const ry = 15 + Math.floor(Math.random() * 34);
            sim.spawnFlora(rx, ry, 'NANO_BANANA', 'FIRE');
          }
          return 'Magmatic steam geysers burst! Rare Pyromaniac Fire Bananas were extracted from the mantle.';
        }
      },
      {
        id: 'vulcanus_smelter',
        name: 'Obsidian Smelter',
        description: 'Equips tribal workers with thermal smelting tools. Instantly yields +200 resources to all societies.',
        cost: 80,
        unlocked: false,
        reqsDesc: 'Average world technology level is v1.50 or higher.',
        checkUnlocked: (stats) => {
          return stats.techAverage >= 1.5;
        },
        action: (ecs, sim) => {
          const tribes = ecs.getEntitiesWith(['society']);
          tribes.forEach(t => {
            const soc = ecs.getComponent<Society>(t, 'society')!;
            soc.resources += 200;
          });
          return 'Heavy metals condensed! Obsidian furnaces added +200 resources to all active tribes.';
        }
      },
      {
        id: 'vulcanus_igneous_surge',
        name: 'Igneous Surge',
        description: 'Fills the mortal psyche with high-pressure conviction. Boosts Elementalist belief scores by +40 globally.',
        cost: 140,
        unlocked: false,
        reqsDesc: 'Total devotion surpasses 180 Δ.',
        checkUnlocked: (stats, devotion) => {
          return devotion >= 180;
        },
        action: (ecs, sim) => {
          const faithList = ecs.getEntitiesWith(['faith']);
          faithList.forEach(t => {
            const faith = ecs.getComponent<Faith>(t, 'faith')!;
            faith.beliefMatrix.ELEMENTALISM = Math.min(100, (faith.beliefMatrix.ELEMENTALISM || 0) + 40);
            
            let maxVal = -1;
            let dominant: FaithSystemType = faith.dominantSystem;
            for (const [key, val] of Object.entries(faith.beliefMatrix)) {
              if (val > maxVal) {
                maxVal = val;
                dominant = key as FaithSystemType;
              }
            }
            faith.dominantSystem = dominant;
          });
          return 'Core magma surged! All tribes now worship the raw elements of heat and power.';
        }
      },
      {
        id: 'vulcanus_tectonic_prominence',
        name: 'Tectonic Prominence',
        description: 'Forges massive crystal glass deposits. Spawns 5 valuable Ash Glass structures yielding double harvesting gains.',
        cost: 250,
        unlocked: false,
        reqsDesc: 'Average technological scale is above v2.20.',
        checkUnlocked: (stats) => {
          return stats.techAverage >= 2.2;
        },
        action: (ecs, sim) => {
          for(let i=0; i<5; i++) {
            const rx = 10 + Math.floor(Math.random() * 44);
            const ry = 10 + Math.floor(Math.random() * 44);
            sim.spawnFlora(rx, ry, 'EXOTIC', 'Ash Glass');
          }
          return 'Tectonic pressure crystallized. 5 highly valuable Ash Glass nodes arose from molten basalt.';
        }
      }
    ]
  },
  {
    id: 'thalassor',
    name: 'Thalassor',
    title: 'Deep Abyssal Logo',
    description: 'The Lord of deep aquatic bioluminescence and oceanic tides. He controls deep monsoons, ocean water irrigation, and liquid bio-synthesis.',
    element: 'Aqua & Tempests',
    color: 'blue',
    colorHex: '#3b82f6',
    avatarPrompt: 'A luminous marine leviathan towering out of dark sapphire water, bioluminescent blue highlights in tentacles.',
    boostsDesc: 'Rainfall spells have their devotion cost permanently reduced by 50% (to 17 Δ), and co-existing tribes start with +15 population members.',
    startingBoost: (ecs, sim) => {
      const tribes = ecs.getEntitiesWith(['society']);
      tribes.forEach(e => {
        const soc = ecs.getComponent<Society>(e, 'society')!;
        soc.population += 15;
      });
      sim.addEventLog('EVOLUTION', 'Thalassor calls down the bio-monsoon. Aquatic currents refresh global crops.');
    },
    skills: [
      {
        id: 'thalassor_tide',
        name: 'Tidal Recharge',
        description: 'Sends heavy condensation currents, boosting resources in all societies by +40 through quick crop irrigation.',
        cost: 35,
        unlocked: false,
        reqsDesc: 'Possess at least 60 total devotion reserves.',
        checkUnlocked: (stats, devotion) => {
          return devotion >= 60;
        },
        action: (ecs, sim) => {
          const tribes = ecs.getEntitiesWith(['society']);
          tribes.forEach(t => {
            const soc = ecs.getComponent<Society>(t, 'society')!;
            soc.resources += 40;
          });
          return 'Tidal moisture condensed in mortal storages, yielding +40 organic crops and resources.';
        }
      },
      {
        id: 'thalassor_bio_light',
        name: 'Luminescent Surge',
        description: 'Imbues mortals with nocturnal tracking. Increases all tribal speed ratings by +1.5 units permanently.',
        cost: 70,
        unlocked: false,
        reqsDesc: 'Total world population is 90 or above.',
        checkUnlocked: (stats) => {
          return stats.population >= 90;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['movement']);
          list.forEach(m => {
            const mv = ecs.getComponent<Movement>(m, 'movement')!;
            mv.speed += 1.5;
          });
          return 'Deep water enzymes ingested by tribes! Gathering and movement speeds increased by +1.5 permanently.';
        }
      },
      {
        id: 'thalassor_blessing',
        name: 'Abyssal Blessing',
        description: 'Instantly elevates average global happiness to 95% and triggers cool Rainfalls over all non-believing sectors.',
        cost: 130,
        unlocked: false,
        reqsDesc: 'Have at least one tribe centering dominant non-Secular belief.',
        checkUnlocked: (stats, devotion, ecs) => {
          const faiths = ecs.getEntitiesWith(['faith']);
          return faiths.some(f => ecs.getComponent<Faith>(f, 'faith')!.dominantSystem !== 'SECULAR');
        },
        action: (ecs, sim) => {
          const tribes = ecs.getEntitiesWith(['society', 'position']);
          tribes.forEach(t => {
            const soc = ecs.getComponent<Society>(t, 'society')!;
            const pos = ecs.getComponent<Position>(t, 'position')!;
            soc.happiness = Math.max(95, soc.happiness);
            sim.spawnFlora(pos.x, pos.y, 'NANO_BANANA', 'GLACIAL');
          });
          return 'Abyssal moisture blanketed the settlements. Mortal joy stabilized at 95% with holy rains.';
        }
      },
      {
        id: 'thalassor_aquatic_genesis',
        name: 'Oceanic Genesis',
        description: 'Drowning dry ridges. Floods the terrain to spawn 6 aquatic barley plants and 2 majestic guardian Celestial Stags.',
        cost: 210,
        unlocked: false,
        reqsDesc: 'World population reaches 140.',
        checkUnlocked: (stats) => {
          return stats.population >= 140;
        },
        action: (ecs, sim) => {
          for(let i=0; i<6; i++) {
            const rx = 15 + Math.floor(Math.random() * 34);
            const ry = 15 + Math.floor(Math.random() * 34);
            sim.spawnFlora(rx, ry, 'CROP', 'Ocean Barley');
          }
          for(let i=0; i<2; i++) {
            const rx = 20 + Math.floor(Math.random() * 24);
            const ry = 20 + Math.floor(Math.random() * 24);
            sim.spawnFauna(rx, ry, 'STAG', 'Celestial Sea Stag');
          }
          return 'Oceanic Genesis activated. Bioluminescent crops and sea stags arose on flooded coastlines.';
        }
      }
    ]
  },
  {
    id: 'xylorex',
    name: 'Xylo-Rex',
    title: 'Moss Sovereign',
    description: 'The ancient wooden monolith of deep peat, lichen roots, and moss crowns. Under his soil layer, wild stags and wolves co-exist in ancient harmony.',
    element: 'Animist Roots',
    color: 'emerald',
    colorHex: '#059669',
    avatarPrompt: 'A gigantic wooden bark golem carrying a miniature forest on its shoulders, mossy green eyes glowing dimly.',
    boostsDesc: 'Starting tribes automatically adopt strong Animism belief (+80), and stags and wolves spawn 40% more frequently around forests.',
    startingBoost: (ecs, sim) => {
      const tribes = ecs.getEntitiesWith(['faith']);
      tribes.forEach(e => {
        const faith = ecs.getComponent<Faith>(e, 'faith')!;
        faith.beliefMatrix.ANIMISM = 95;
        faith.dominantSystem = 'ANIMISM';
      });
      sim.addEventLog('EVOLUTION', 'Xylo-Rex links the subterranean roots. Tribes feel organic consciousness.');
    },
    skills: [
      {
        id: 'xylorex_spore',
        name: 'Spore Bloom',
        description: 'Summons 4 wild stags and spawns 10 thick oak trees around settlement perimeters to feed the food chain.',
        cost: 30,
        unlocked: false,
        reqsDesc: 'Possess at least 40 devotion points.',
        checkUnlocked: (stats, devotion) => {
          return devotion >= 40;
        },
        action: (ecs, sim) => {
          for(let i=0; i<4; i++){
            const rx = 10 + Math.floor(Math.random() * 44);
            const ry = 10 + Math.floor(Math.random() * 44);
            sim.spawnFauna(rx, ry, 'STAG', 'Mossy Meadow Stag');
          }
          for(let i=0; i<10; i++){
            const rx = Math.floor(Math.random() * 64);
            const ry = Math.floor(Math.random() * 64);
            sim.spawnFlora(rx, ry, 'TREE', 'Ancient Oak');
          }
          return 'Spore Bloom completed. Four glowing wild stags and ten dense oak forests materialized.';
        }
      },
      {
        id: 'xylorex_moss_siphon',
        name: 'Moss Siphon',
        description: 'Absorbs minor biomaterials. Generates +120 Devotion dynamically of pure nature energy.',
        cost: 65,
        unlocked: false,
        reqsDesc: 'At least 2 tribes must carry Animism as their dominant system.',
        checkUnlocked: (stats, devotion, ecs) => {
          const list = ecs.getEntitiesWith(['faith']);
          const count = list.filter(e => ecs.getComponent<Faith>(e, 'faith')!.dominantSystem === 'ANIMISM').length;
          return count >= 2;
        },
        action: (ecs, sim) => {
          sim.totalDevotion += 120;
          return 'Moss Siphon complete. Absorbed global microflora energy to acquire +120 Divine Devotion.';
        }
      },
      {
        id: 'xylorex_mycelium',
        name: 'Great Root Connection',
        description: 'Establishes mycelial communications. Boosts tribe gathering speeds by +2.0 and gives +15 happiness.',
        cost: 110,
        unlocked: false,
        reqsDesc: 'Total world population is 110 or higher.',
        checkUnlocked: (stats) => {
          return stats.population >= 110;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['society', 'movement']);
          list.forEach(e => {
            const mv = ecs.getComponent<Movement>(e, 'movement')!;
            const soc = ecs.getComponent<Society>(e, 'society')!;
            mv.speed += 2.0;
            soc.happiness = Math.min(100, soc.happiness + 15);
          });
          return 'Mycelium network active. Mortal footfalls are lightened, boosting gathering speed and community joy.';
        }
      },
      {
        id: 'xylorex_avatar',
        name: 'Sylvan Avatar',
        description: 'Spawns a divine Holy Elder Banana tree and permanently doubles crop harvesting yields.',
        cost: 180,
        unlocked: false,
        reqsDesc: 'At least one Animist tribe has population scale >= 100.',
        checkUnlocked: (stats, devotion, ecs) => {
          const bills = ecs.getEntitiesWith(['society', 'faith']);
          return bills.some(e => {
            const soc = ecs.getComponent<Society>(e, 'society')!;
            const faith = ecs.getComponent<Faith>(e, 'faith')!;
            return faith.dominantSystem === 'ANIMISM' && soc.population >= 100;
          });
        },
        action: (ecs, sim) => {
          const rx = 20 + Math.floor(Math.random() * 24);
          const ry = 20 + Math.floor(Math.random() * 24);
          sim.spawnFlora(rx, ry, 'NANO_BANANA', 'DIVINE');
          
          const treeList = ecs.getEntitiesWith(['flora']);
          treeList.forEach(t => {
            const fl = ecs.getComponent<Flora>(t, 'flora')!;
            fl.resourcesYield *= 2;
          });
          return 'The Sylvan Avatar manifested an ancient holy tree. All crop resource yields doubled permanently!';
        }
      }
    ]
  },
  {
    id: 'aethelgard',
    name: 'Aethelgard',
    title: 'Solar Monarch',
    description: 'The blinding lord of celestial revelation, gilded gold, and holy canopies. He fuels the altars of faith and grants massive starting energy.',
    element: 'Solar & Judgement',
    color: 'amber',
    colorHex: '#d97706',
    avatarPrompt: 'A winged sun monarch clad in pristine white and golden plate armor, halo emitting blinding amber beams.',
    boostsDesc: 'The player starts with +300 additional Devotion (total 400 Δ). Prayers executed by tribes generate 150% more devotion.',
    startingBoost: (ecs, sim) => {
      sim.totalDevotion += 300;
      sim.addEventLog('EVOLUTION', 'Aethelgard shines gold rays. Solar energy channels into deity reserves.');
    },
    skills: [
      {
        id: 'aethelgard_flare',
        name: 'Solar Flare',
        description: 'Unleashes stellar rays. Adds +30 Interventionist belief points globally, converting secular tribes.',
        cost: 50,
        unlocked: false,
        reqsDesc: 'At least 1 active structure exists on map.',
        checkUnlocked: (stats, devotion, ecs) => {
          return ecs.getEntitiesWith(['structure']).length >= 1;
        },
        action: (ecs, sim) => {
          const faithList = ecs.getEntitiesWith(['faith']);
          faithList.forEach(f => {
            const faith = ecs.getComponent<Faith>(f, 'faith')!;
            faith.beliefMatrix.INTERVENTIONIST = Math.min(100, (faith.beliefMatrix.INTERVENTIONIST || 0) + 30);
            
            let maxVal = -1;
            let dominant: FaithSystemType = faith.dominantSystem;
            for (const [key, val] of Object.entries(faith.beliefMatrix)) {
              if (val > maxVal) {
                maxVal = val;
                dominant = key as FaithSystemType;
              }
            }
            faith.dominantSystem = dominant;
          });
          return 'Holy solar rays purged lingering doubts. Factions gain +30 Interventionist faith.';
        }
      },
      {
        id: 'aethelgard_altar_ascension',
        name: 'Altar Ascension',
        description: 'Permanently increases all structural temple efficiencies by +50%.',
        cost: 90,
        unlocked: false,
        reqsDesc: 'Own at least 2 active structures currently on the map.',
        checkUnlocked: (stats, devotion, ecs) => {
          return ecs.getEntitiesWith(['structure']).length >= 2;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['structure']);
          list.forEach(s => {
            const st = ecs.getComponent<Structure>(s, 'structure')!;
            st.efficiency += 0.50;
          });
          return 'Altar Ascension finalized. All temple and shrine structures gain +50% prayer focusing efficacy.';
        }
      },
      {
        id: 'aethelgard_sacrament',
        name: 'Gilded Sacrament',
        description: 'Fills and locks all tribal happiness to 100% and awards +100 raw materials to all active settlements.',
        cost: 140,
        unlocked: false,
        reqsDesc: 'Total world population size exceeds 100.',
        checkUnlocked: (stats) => {
          return stats.population >= 100;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['society']);
          list.forEach(e => {
            const soc = ecs.getComponent<Society>(e, 'society')!;
            soc.happiness = 100;
            soc.resources += 100;
          });
          return 'Gilded Sacrament completed. Golden solar crowns descended, maxing mortal happiness with resource bonuses.';
        }
      },
      {
        id: 'aethelgard_apotheosis',
        name: 'Mortal Apotheosis',
        description: 'Triggers construction of 2 high-grade Sacred Altars and rewards +300 additional Devotion.',
        cost: 240,
        unlocked: false,
        reqsDesc: 'At least one society has population scale >= 120.',
        checkUnlocked: (stats, devotion, ecs) => {
          const list = ecs.getEntitiesWith(['society']);
          return list.some(e => ecs.getComponent<Society>(e, 'society')!.population >= 120);
        },
        action: (ecs, sim) => {
          for(let i=0; i<2; i++){
            const rx = 15 + Math.floor(Math.random() * 34);
            const ry = 15 + Math.floor(Math.random() * 34);
            sim.spawnStructure(rx, ry, 'ALTAR', 'Gilded Monument');
          }
          sim.totalDevotion += 300;
          return 'Apotheosis completed! Two stellar golden Altars erected, and believers channelled +300 devotion.';
        }
      }
    ]
  },
  {
    id: 'null_v8',
    name: 'Null-v8',
    title: 'Neural Architect',
    description: 'The cold quantum computing substrate that oversees deep galaxy silicon arrays. He disdains mysticism, preferring binary code, secular science, and logic loops.',
    element: 'Logic & Circuits',
    color: 'sky',
    colorHex: '#0284c7',
    avatarPrompt: 'A metallic floating geometric orb pulsing with neon light trails, cybernetic blue projections screen.',
    boostsDesc: 'Starting tribes bypass tribal tech restrictions, starting at Tier v2.50. Factions begin with Secularity as their dominant matrix system.',
    startingBoost: (ecs, sim) => {
      const tribes = ecs.getEntitiesWith(['society', 'faith']);
      tribes.forEach(e => {
        const soc = ecs.getComponent<Society>(e, 'society')!;
        const faith = ecs.getComponent<Faith>(e, 'faith')!;
        soc.technologyLevel = 2.5;
        faith.beliefMatrix.SECULAR = 90;
        faith.dominantSystem = 'SECULAR';
      });
      sim.addEventLog('EVOLUTION', 'Null-v8 injects silicon firmware. Primitive tribal brains compile logic loops.');
    },
    skills: [
      {
        id: 'null_silicon',
        name: 'Silicon Expansion',
        description: 'Injects machine code into human brains, instantly raising global technology levels of all tribes by +0.7.',
        cost: 45,
        unlocked: false,
        reqsDesc: 'Ensure world technology average is above v2.00.',
        checkUnlocked: (stats) => {
          return stats.techAverage >= 2.0;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['society']);
          list.forEach(t => {
            const soc = ecs.getComponent<Society>(t, 'society')!;
            soc.technologyLevel += 0.7;
          });
          return 'Silicon mind expansion completed! Advanced cybernetic ideas raised global technology scales by +0.7.';
        }
      },
      {
        id: 'null_scientific_method',
        name: 'Scientific Shift',
        description: 'Secular factions gain +150 raw materials and double their food synthesis efficiency for 60 seconds.',
        cost: 85,
        unlocked: false,
        reqsDesc: 'Factions with secular dominance represent >= 50% of the active societies.',
        checkUnlocked: (stats, devotion, ecs) => {
          const list = ecs.getEntitiesWith(['faith']);
          if (list.length === 0) return false;
          const seculars = list.filter(e => ecs.getComponent<Faith>(e, 'faith')!.dominantSystem === 'SECULAR').length;
          return (seculars / list.length) >= 0.5;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['society', 'faith']);
          list.forEach(e => {
            const faith = ecs.getComponent<Faith>(e, 'faith')!;
            if (faith.dominantSystem === 'SECULAR') {
              const soc = ecs.getComponent<Society>(e, 'society')!;
              soc.resources += 150;
            }
          });
          return 'Scientific revolution enacted. Empirical groups achieved +150 resources via rapid mechanical synthesis.';
        }
      },
      {
        id: 'null_lattice',
        name: 'Cyber Lattice',
        description: 'Synchronizes co-existing entities across the world, boosting movement rates to +3.0 and awarding +50 resources.',
        cost: 150,
        unlocked: false,
        reqsDesc: 'At least 3 separate tribal centers are on the coordinate grid.',
        checkUnlocked: (stats, devotion, ecs) => {
          return ecs.getEntitiesWith(['society']).length >= 3;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['movement', 'society']);
          list.forEach(e => {
            const mv = ecs.getComponent<Movement>(e, 'movement')!;
            const soc = ecs.getComponent<Society>(e, 'society')!;
            mv.speed += 3.0;
            soc.resources += 50;
          });
          return 'Quantum fiber optic lines aligned. All cyber-entities execute commands with supercharged speed.';
        }
      },
      {
        id: 'null_singularity',
        name: 'Logic Singularity',
        description: 'Triggers extreme mental transcendence. Secular factions gain +3.5 technology levels, and maximum happiness is locked.',
        cost: 260,
        unlocked: false,
        reqsDesc: 'World technology average level has reached v3.50.',
        checkUnlocked: (stats) => {
          return stats.techAverage >= 3.5;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['society', 'faith']);
          list.forEach(e => {
            const faith = ecs.getComponent<Faith>(e, 'faith')!;
            if (faith.dominantSystem === 'SECULAR') {
              const soc = ecs.getComponent<Society>(e, 'society')!;
              soc.technologyLevel += 3.5;
              soc.happiness = 100;
            }
          });
          return 'Silicon Singularity surpassed! Scientific tribes converted to automated machine consciousness.';
        }
      }
    ]
  },
  {
    id: 'krigor',
    name: 'Krigor',
    title: 'Wrath Scribe',
    description: 'The god of planetary tension, wildlife attrition, and aggressive expansion. He thrives on high friction, predator packs, and destructive meteor triggers.',
    element: 'Friction & Predators',
    color: 'rose',
    colorHex: '#f43f5e',
    avatarPrompt: 'A towering red armored warlord standing on ruins brandishing a giant flaming claymore, volcanic dark lighting.',
    boostsDesc: 'Starting stags are doubled, tribal members carry higher baseline aggressiveness (+30), and Meteor spells cost 40% less devotion.',
    startingBoost: (ecs, sim) => {
      for(let i=0; i<10; i++) {
        const rx = Math.floor(Math.random() * 64);
        const ry = Math.floor(Math.random() * 64);
        sim.spawnFauna(rx, ry, 'WOLF', 'Krigor Shadow Wolf');
      }
      const tribes = ecs.getEntitiesWith(['society']);
      tribes.forEach(e => {
        const soc = ecs.getComponent<Society>(e, 'society')!;
        soc.happiness = Math.max(50, soc.happiness - 15); // more aggressive, less serene
      });
      sim.addEventLog('EVOLUTION', 'Krigor sharpens tribal bone spears. Ten shadow wolves crawl from the abyss.');
    },
    skills: [
      {
        id: 'krigor_frenzy',
        name: 'Blood Frenzy',
        description: 'Stirs wild predators. Increases wolf movement speed by +4.0 and maxes hunger parameters to trigger quick tribal attrition.',
        cost: 35,
        unlocked: false,
        reqsDesc: 'At least 2 active wild wolves remain in the world.',
        checkUnlocked: (stats, devotion, ecs) => {
          const list = ecs.getEntitiesWith(['fauna']);
          const count = list.filter(e => ecs.getComponent<Fauna>(e, 'fauna')!.category === 'WOLF').length;
          return count >= 2;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['fauna', 'movement']);
          list.forEach(e => {
            const f = ecs.getComponent<Fauna>(e, 'fauna')!;
            if (f.category === 'WOLF') {
              const mv = ecs.getComponent<Movement>(e, 'movement')!;
              mv.speed += 4.0;
              f.hunger = 100; // hyper hungry!
            }
          });
          return 'Blood Frenzy activated. Wolves howl in madness, sprinting to maul tribal colonies.';
        }
      },
      {
        id: 'krigor_warriors',
        name: 'Glaive Vanguard',
        description: 'Inspires non-secular factions, summoning +20 veteran warriors into their ranks.',
        cost: 75,
        unlocked: false,
        reqsDesc: 'Total world population exceeds 70.',
        checkUnlocked: (stats) => {
          return stats.population >= 70;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['society', 'faith']);
          list.forEach(e => {
            const faith = ecs.getComponent<Faith>(e, 'faith')!;
            if (faith.dominantSystem !== 'SECULAR') {
              const soc = ecs.getComponent<Society>(e, 'society')!;
              soc.population += 20;
            }
          });
          return 'Glaive warbands recruited! +20 expansionists joined non-secular societies.';
        }
      },
      {
        id: 'krigor_attrition',
        name: 'Mortal Tribulation',
        description: 'Sacrifices weak populations of all societies, turning them into elite forgers: raises Tech scale by +1.1 but cuts population by 15%.',
        cost: 130,
        unlocked: false,
        reqsDesc: 'World total population is 130 or greater.',
        checkUnlocked: (stats) => {
          return stats.population >= 130;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['society']);
          list.forEach(e => {
            const soc = ecs.getComponent<Society>(e, 'society')!;
            const sacrifice = Math.floor(soc.population * 0.15);
            soc.population = Math.max(15, soc.population - sacrifice);
            soc.technologyLevel += 1.1;
          });
          return "Mortal Tribulation complete. Sacrificed weaker members to construct tactical iron smelting engines.";
        }
      },
      {
        id: 'krigor_doomsday',
        name: 'Doomsday Split',
        description: 'Triggers tectonic fission. Spawns 3 radioactive Mutated Bananas and drops a targeted high-impact meteor near the largest secular settlement.',
        cost: 200,
        unlocked: false,
        reqsDesc: 'World devotion is 180 Δ or higher.',
        checkUnlocked: (stats, devotion) => {
          return devotion >= 180;
        },
        action: (ecs, sim) => {
          // Spawn mutagen bananas
          for(let i=0; i<3; i++){
            const rx = 10 + Math.floor(Math.random() * 44);
            const ry = 10 + Math.floor(Math.random() * 44);
            sim.spawnFlora(rx, ry, 'NANO_BANANA', 'TOXIC');
          }
          // Find largest secular tribe
          const list = ecs.getEntitiesWith(['society', 'faith', 'position']);
          let targetId: any = null;
          let maxPop = -1;
          list.forEach(e => {
            const faith = ecs.getComponent<Faith>(e, 'faith')!;
            const soc = ecs.getComponent<Society>(e, 'society')!;
            if (faith.dominantSystem === 'SECULAR' && soc.population > maxPop) {
              maxPop = soc.population;
              targetId = e;
            }
          });

          if (targetId) {
            const pos = ecs.getComponent<Position>(targetId, 'position')!;
            sim.triggerLocalizedSpell('Meteor', pos.x, pos.y);
            return 'Doomsday shockwave triggered! Volcanic meteor pulverized secular targets and spawned Mutated Bananas.';
          } else {
            // Drop meteor at grid center
            sim.triggerLocalizedSpell('Meteor', 32, 32);
            return 'Doomsday erupted. High impact meteor exploded at coordinates (32, 32).';
          }
        }
      }
    ]
  },
  {
    id: 'malakor',
    name: 'Malakor',
    title: 'Void Singularity',
    description: 'The ancient watcher residing inside gravity collapse black holes. He craves absolute entropy, vacuum physics, and gradual secular dissolution.',
    element: 'Void & Entropy',
    color: 'purple',
    colorHex: '#a855f7',
    avatarPrompt: 'A dark gaseous void humanoid with countless purple celestial eyes open across its body, outer space backdrop.',
    boostsDesc: 'All starting tribes adopt Void Nihilism as their dominant system (+90 Nihilism). Spatiotemporal Rift spells cost 50% less.',
    startingBoost: (ecs, sim) => {
      const tribes = ecs.getEntitiesWith(['faith']);
      tribes.forEach(e => {
        const faith = ecs.getComponent<Faith>(e, 'faith')!;
        faith.beliefMatrix.NIHILISM = 95;
        faith.dominantSystem = 'NIHILISM';
      });
      sim.addEventLog('EVOLUTION', 'Malakor bends gravitational strings. Primitive tribes look into the Void.');
    },
    skills: [
      {
        id: 'malakor_attraction',
        name: 'Entropy Pull',
        description: 'Gravitational vortex carries resources from bio-fields. Awards +60 resources to all nihilist settlements.',
        cost: 30,
        unlocked: false,
        reqsDesc: 'At least 1 active tribe follows Nihilism dominant beliefs.',
        checkUnlocked: (stats, devotion, ecs) => {
          const list = ecs.getEntitiesWith(['faith']);
          return list.some(e => ecs.getComponent<Faith>(e, 'faith')!.dominantSystem === 'NIHILISM');
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['society', 'faith']);
          list.forEach(e => {
            const faith = ecs.getComponent<Faith>(e, 'faith')!;
            if (faith.dominantSystem === 'NIHILISM') {
              const soc = ecs.getComponent<Society>(e, 'society')!;
              soc.resources += 60;
            }
          });
          return 'Gravitational entropy siphoned +60 dry crops directly into nihilist reserves.';
        }
      },
      {
        id: 'malakor_erosion',
        name: 'Void Erosion',
        description: 'Decreases the happiness of non-nihilist factions by 25% and converts that emotional energy to +150 Devotion.',
        cost: 75,
        unlocked: false,
        reqsDesc: 'Total world population exceeds 60.',
        checkUnlocked: (stats) => {
          return stats.population >= 60;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['society', 'faith']);
          let siphonCount = 0;
          list.forEach(e => {
            const faith = ecs.getComponent<Faith>(e, 'faith')!;
            if (faith.dominantSystem !== 'NIHILISM') {
              const soc = ecs.getComponent<Society>(e, 'society')!;
              soc.happiness = Math.max(10, soc.happiness - 25);
              siphonCount++;
            }
          });
          sim.totalDevotion += 150;
          return `Void Erosion extracted the psyche of ${siphonCount} non-believers, yielding +150 Devotion.`;
        }
      },
      {
        id: 'malakor_wormhole',
        name: 'Spatiotemporal Rift',
        description: 'Teleports three random wild wolves next to secular encampments, forcing doubt and raising Nihilism parameters by +45.',
        cost: 150,
        unlocked: false,
        reqsDesc: 'Possess at least 150 total devotion points.',
        checkUnlocked: (stats, devotion) => {
          return devotion >= 150;
        },
        action: (ecs, sim) => {
          const secularList = ecs.getEntitiesWith(['society', 'faith', 'position']);
          let wolvesSpawned = 0;
          secularList.forEach(s => {
            const faith = ecs.getComponent<Faith>(s, 'faith')!;
            if (faith.dominantSystem === 'SECULAR') {
              const pos = ecs.getComponent<Position>(s, 'position')!;
              sim.spawnFauna(pos.x, pos.y, 'WOLF', 'Quantum Rift Wolf');
              faith.beliefMatrix.NIHILISM = Math.min(100, (faith.beliefMatrix.NIHILISM || 0) + 45);
              wolvesSpawned++;
            }
          });
          return `Warped space-time! Unleashed ${wolvesSpawned} shadow wolves over secular settlements. Universal panic raised Nihilism.`;
        }
      },
      {
        id: 'malakor_gravity_collapse',
        name: 'Gravitational Singularity',
        description: 'Obliterates all altars on the map, transforming their rubble into 5 Cosmic Elder Bananas of extreme resource yields.',
        cost: 250,
        unlocked: false,
        reqsDesc: 'Nihilism is the dominant religious system in at least 3 co-existing settlements.',
        checkUnlocked: (stats, devotion, ecs) => {
          const list = ecs.getEntitiesWith(['faith']);
          const nihilList = list.filter(e => ecs.getComponent<Faith>(e, 'faith')!.dominantSystem === 'NIHILISM');
          return nihilList.length >= 3;
        },
        action: (ecs, sim) => {
          const structures = ecs.getEntitiesWith(['structure', 'position']);
          let crushed = 0;
          structures.forEach(e => {
            const st = ecs.getComponent<Structure>(e, 'structure')!;
            if (st.category === 'ALTAR') {
              const pos = ecs.getComponent<Position>(e, 'position')!;
              sim.spawnFlora(pos.x, pos.y, 'NANO_BANANA', 'COSMIC');
              ecs.removeEntity(e);
              crushed++;
            }
          });
          return `Vortex collapsed! Pulverized ${crushed} sacred structures, compressing their atomic dust into high-yield Cosmic Bananas.`;
        }
      }
    ]
  },
  {
    id: 'chrono',
    name: 'Chrono',
    title: 'Horizon Weaver',
    description: 'The celestial spinner of coordinate portals, time streams, and entropy metrics. He dictates mortal pace, loops, and rapid advancement.',
    element: 'Time & Speed',
    color: 'teal',
    colorHex: '#0d9488',
    avatarPrompt: 'An abstract mechanical body composed of turning gears, floating brass dials, sand hourglass chest.',
    boostsDesc: 'Mortal speed rates are boosted by +50% permanently. Gathering and target pathfinding resolve much quicker.',
    startingBoost: (ecs, sim) => {
      const list = ecs.getEntitiesWith(['movement']);
      list.forEach(m => {
        const mv = ecs.getComponent<Movement>(m, 'movement')!;
        mv.speed *= 1.5;
      });
      sim.addEventLog('EVOLUTION', 'Chrono accelerates cosmic timelines. Tribals perform muscle movements with insane speed.');
    },
    skills: [
      {
        id: 'chrono_warp',
        name: 'Temporal Shift',
        description: 'Bridges space gaps. Instantly completes coordinates pathfinding targets for all co-existing gatherers.',
        cost: 40,
        unlocked: false,
        reqsDesc: 'At least 1 active gatherer is currently on the map.',
        checkUnlocked: (stats, devotion, ecs) => {
          return ecs.getEntitiesWith(['movement']).length >= 1;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['position', 'movement']);
          list.forEach(e => {
            const mv = ecs.getComponent<Movement>(e, 'movement')!;
            const pos = ecs.getComponent<Position>(e, 'position')!;
            if (mv.targetX !== null && mv.targetY !== null) {
              pos.x = mv.targetX;
              pos.y = mv.targetY;
              mv.targetX = null;
              mv.targetY = null;
              mv.vx = 0;
              mv.vy = 0;
              mv.activityState = 'IDLE';
            }
          });
          return 'Spatial lines collapsed! All active mortal travelers teleported to their chosen targets instantly.';
        }
      },
      {
        id: 'chrono_leap',
        name: 'Chronos Leap',
        description: 'Speeds up the cellular cycles. Speeds up crop regrowth values to 100% and satisfies all wildlife hunger indexes.',
        cost: 80,
        unlocked: false,
        reqsDesc: 'Possess at least 90 total devotion points.',
        checkUnlocked: (stats, devotion) => {
          return devotion >= 90;
        },
        action: (ecs, sim) => {
          const floras = ecs.getEntitiesWith(['flora']);
          floras.forEach(f => {
            const flo = ecs.getComponent<Flora>(f, 'flora')!;
            flo.growth = 100;
            flo.isHarvested = false;
          });
          const faunas = ecs.getEntitiesWith(['fauna']);
          faunas.forEach(f => {
            const fau = ecs.getComponent<Fauna>(f, 'fauna')!;
            fau.hunger = 0; // pacified
          });
          return 'Time leapt. Crops grew to ripe sizes, and wild stags felt satisfied and full.';
        }
      },
      {
        id: 'chrono_decay',
        name: 'Aura of Entropy',
        description: 'Spawns 4 decaying temporal zones, slowing wild wolf speeds to 0.4 units to secure sheep and stags.',
        cost: 130,
        unlocked: false,
        reqsDesc: 'Total world population expands past 100.',
        checkUnlocked: (stats) => {
          return stats.population >= 100;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['fauna', 'movement']);
          list.forEach(e => {
            const fau = ecs.getComponent<Fauna>(e, 'fauna')!;
            if (fau.category === 'WOLF') {
              const mv = ecs.getComponent<Movement>(e, 'movement')!;
              mv.speed = 0.4;
            }
          });
          return 'Vicious predators caught in localized temporal decay fields. Threat of wildlife attrition averted.';
        }
      },
      {
        id: 'chrono_timeloop',
        name: 'Quantum Paradox',
        description: 'Rewinds temporal states of the largest active tribe, instantly doubling their starting materials (+400 RES).',
        cost: 220,
        unlocked: false,
        reqsDesc: 'A tribe center with population > 100 is registered on grid.',
        checkUnlocked: (stats, devotion, ecs) => {
          const list = ecs.getEntitiesWith(['society']);
          return list.some(e => ecs.getComponent<Society>(e, 'society')!.population > 100);
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['society']);
          let targetSoc: Society | null = null;
          let maxPop = -1;
          list.forEach(e => {
            const soc = ecs.getComponent<Society>(e, 'society')!;
            if (soc.population > maxPop) {
              maxPop = soc.population;
              targetSoc = soc;
            }
          });

          if (targetSoc) {
            (targetSoc as Society).resources += 400;
            return `Temporal paradox resolved! Replicated materials of [${(targetSoc as Society).name}] to add +400 resources.`;
          }
          return 'Paradox cycle completed with minor temporal static.';
        }
      }
    ]
  },
  {
    id: 'astraea',
    name: 'Astraea',
    title: 'Stellar Oracle',
    description: 'The crystalline maiden observing stellar lines, pulsar frequencies, and deep space banana patterns. She channels cosmic harmony.',
    element: 'Cosmos & Stars',
    color: 'indigo',
    colorHex: '#6366f1',
    avatarPrompt: 'A glowing starry priestess wearing starry robes, holds a rotating micro-galaxy in her hands, stars particles background.',
    boostsDesc: 'Spawns 2 radiant Celestial stags and 2 high-resource Cosmic Bananas on startup. Starting devotion expanded by +150.',
    startingBoost: (ecs, sim) => {
      // Spawn cosmic elements
      for(let i=0; i<2; i++) {
        const rx = 10 + Math.floor(Math.random() * 44);
        const ry = 10 + Math.floor(Math.random() * 44);
        sim.spawnFlora(rx, ry, 'NANO_BANANA', 'COSMIC');
      }
      for(let i=0; i<2; i++) {
        const rx = 20 + Math.floor(Math.random() * 24);
        const ry = 20 + Math.floor(Math.random() * 24);
        sim.spawnFauna(rx, ry, 'STAG', 'Stellar Deer');
      }
      sim.totalDevotion += 150;
      sim.addEventLog('EVOLUTION', 'Astraea projects cosmic stardust. Two Celestial stags gather energy.');
    },
    skills: [
      {
        id: 'astraea_starlight',
        name: 'Pulsar Alignment',
        description: 'Invokes deep space pulsar feeds. Grants +60 Devotion and +25 happiness to all Animists.',
        cost: 50,
        unlocked: false,
        reqsDesc: 'Possess at least 1 active Celestial beast.',
        checkUnlocked: (stats, devotion, ecs) => {
          const list = ecs.getEntitiesWith(['fauna']);
          return list.some(e => ecs.getComponent<Fauna>(e, 'fauna')!.subType.toLowerCase().includes('celestial') || ecs.getComponent<Fauna>(e, 'fauna')!.subType.toLowerCase().includes('stellar'));
        },
        action: (ecs, sim) => {
          sim.totalDevotion += 60;
          const list = ecs.getEntitiesWith(['society', 'faith']);
          list.forEach(e => {
            const faith = ecs.getComponent<Faith>(e, 'faith')!;
            if (faith.dominantSystem === 'ANIMISM') {
              const soc = ecs.getComponent<Society>(e, 'society')!;
              soc.happiness = Math.min(100, soc.happiness + 25);
            }
          });
          return 'Pulsar feed aligned! Devotion increased by +60, and Animists celebrate cosmic wonders.';
        }
      },
      {
        id: 'astraea_dust',
        name: 'Stardust Cascade',
        description: 'Impregnates dry soils with astral fragments, spawning 2 Holy Divine Bananas and 2 Electric Cyber Bananas.',
        cost: 90,
        unlocked: false,
        reqsDesc: 'Average technological scale is v2.10 or higher.',
        checkUnlocked: (stats) => {
          return stats.techAverage >= 2.1;
        },
        action: (ecs, sim) => {
          for(let i=0; i<2; i++) {
            const rx = 10 + Math.floor(Math.random() * 44);
            const ry = 10 + Math.floor(Math.random() * 44);
            sim.spawnFlora(rx, ry, 'NANO_BANANA', 'DIVINE');
          }
          for(let i=0; i<2; i++) {
            const rx = 10 + Math.floor(Math.random() * 44);
            const ry = 10 + Math.floor(Math.random() * 44);
            sim.spawnFlora(rx, ry, 'NANO_BANANA', 'CYBER');
          }
          return 'Stardust showers condensed. Spawned two Divine Bananas and two Cyber Bananas in wild territories.';
        }
      },
      {
        id: 'astraea_neutron',
        name: 'Supernova Spark',
        description: 'Fires gamma energetic rays. Instantly grants +300 food resources across all co-existing societies.',
        cost: 140,
        unlocked: false,
        reqsDesc: 'Total population scale of the world is 120 or greater.',
        checkUnlocked: (stats) => {
          return stats.population >= 120;
        },
        action: (ecs, sim) => {
          const list = ecs.getEntitiesWith(['society']);
          list.forEach(t => {
            const soc = ecs.getComponent<Society>(t, 'society')!;
            soc.resources += 300;
          });
          return 'Supernova scatter complete. Symmetrical solar energy showered storages, adding +300 resources globally.';
        }
      },
      {
        id: 'astraea_accord',
        name: 'Genesis Constellation',
        description: 'Spawns the cosmic Starlight Monolith, which channels stable galactic energy yielding +3.5 passive devotion per second.',
        cost: 230,
        unlocked: false,
        reqsDesc: 'Total world devotion is 200 Δ or higher.',
        checkUnlocked: (stats, devotion) => {
          return devotion >= 200;
        },
        action: (ecs, sim) => {
          const rx = 25 + Math.floor(Math.random() * 14);
          const ry = 25 + Math.floor(Math.random() * 14);
          sim.spawnStructure(rx, ry, 'ALTAR', 'Starlight Monolith');
          
          // Modify simulation update speed later or increase passive flow
          sim.totalDevotion += 200;
          return 'Genesis Constellation completed! Cosmic Monolith constructed to generate stable passive Devotion.';
        }
      }
    ]
  }
];
