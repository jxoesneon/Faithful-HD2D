import type { ECS } from '../ecs';
import type { Entity, DialogueNode, LoreEntry, BestiaryEntry, HerbariumEntry, TimelineEvent } from '../../types';

export class DialogueManager {
  private ecs: ECS;
  private loreDatabase: LoreEntry[] = [];
  private bestiary: Map<string, BestiaryEntry> = new Map();
  private herbarium: Map<string, HerbariumEntry> = new Map();
  private timeline: TimelineEvent[] = [];
  private npcDialogues: Map<string, DialogueNode[]> = new Map();

  constructor(ecs: ECS) {
    this.ecs = ecs;
    this.initLore();
    this.initBestiary();
    this.initHerbarium();
    this.initNPCDialogues();
  }

  /** Evaluate a dialogue node and return available choices */
  evaluateNode(node: DialogueNode): DialogueNode['choices'] {
    if (!node.conditions || node.conditions.length === 0) {
      return node.choices;
    }

    return node.choices.filter((choice) => {
      return node.conditions!.every((cond) => {
        // For simplicity, conditions check a mock stats object
        // In a real game, this would check the player/protagonist entity
        return true;
      });
    });
  }

  /** Unlock a lore entry by ID */
  unlockLore(loreId: string): boolean {
    const entry = this.loreDatabase.find((l) => l.id === loreId);
    if (!entry || entry.isUnlocked) return false;
    entry.isUnlocked = true;
    return true;
  }

  /** Get all unlocked lore entries */
  getUnlockedLore(): LoreEntry[] {
    return this.loreDatabase.filter((l) => l.isUnlocked);
  }

  /** Discover a creature and add to bestiary */
  discoverCreature(creatureType: string, name: string, description: string): void {
    if (!this.bestiary.has(creatureType)) {
      this.bestiary.set(creatureType, {
        id: `bestiary_${creatureType}`,
        creatureType,
        name,
        description,
        discovered: true,
        killCount: 0,
      });
    } else {
      const entry = this.bestiary.get(creatureType)!;
      entry.discovered = true;
    }
  }

  /** Record a kill for a creature type */
  recordKill(creatureType: string): void {
    const entry = this.bestiary.get(creatureType);
    if (entry) {
      entry.killCount++;
    }
  }

  /** Get bestiary entry */
  getBestiaryEntry(creatureType: string): BestiaryEntry | undefined {
    return this.bestiary.get(creatureType);
  }

  /** Discover a flora and add to herbarium */
  discoverFlora(floraType: string, name: string, description: string): void {
    if (!this.herbarium.has(floraType)) {
      this.herbarium.set(floraType, {
        id: `herbarium_${floraType}`,
        floraType,
        name,
        description,
        discovered: true,
        harvestCount: 0,
      });
    } else {
      const entry = this.herbarium.get(floraType)!;
      entry.discovered = true;
    }
  }

  /** Record a harvest for a flora type */
  recordHarvest(floraType: string): void {
    const entry = this.herbarium.get(floraType);
    if (entry) {
      entry.harvestCount++;
    }
  }

  /** Get herbarium entry */
  getHerbariumEntry(floraType: string): HerbariumEntry | undefined {
    return this.herbarium.get(floraType);
  }

  /** Add a timeline event */
  addTimelineEvent(event: Omit<TimelineEvent, 'id'>): TimelineEvent {
    const timelineEvent: TimelineEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.timeline.push(timelineEvent);
    return timelineEvent;
  }

  /** Get all timeline events sorted by timestamp */
  getTimeline(): TimelineEvent[] {
    return [...this.timeline].sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Get events by category */
  getTimelineByCategory(category: TimelineEvent['category']): TimelineEvent[] {
    return this.timeline.filter((e) => e.category === category);
  }

  private initLore(): void {
    this.loreDatabase = [
      { id: 'lore_1', category: 'History', title: 'The First Spark', content: 'Before the gods, there was only void.', unlockCondition: 'tutorial_complete', isUnlocked: false },
      { id: 'lore_2', category: 'Religion', title: 'Animist Pantheon', content: 'Spirits dwell in every stone and tree.', unlockCondition: 'discover_animist', isUnlocked: false },
      { id: 'lore_3', category: 'Nature', title: 'Crystal Flora', content: 'Some plants absorb divine essence.', unlockCondition: 'harvest_crystal', isUnlocked: false },
      { id: 'lore_4', category: 'Technology', title: 'The Great Forge', content: 'Metalworking changed civilization forever.', unlockCondition: 'build_forge', isUnlocked: false },
      { id: 'lore_5', category: 'Mystery', title: 'The Hollow Mountain', content: 'Beneath the tallest peak, a cavity stretches for leagues, filled with silence older than language.', unlockCondition: 'explore_mountain', isUnlocked: false },
      { id: 'lore_6', category: 'History', title: 'War of the Three Banners', content: 'Once, three divine hosts clashed for dominion over the eastern plains. No mortal survived to record who won.', unlockCondition: 'complete_holy_war_chain', isUnlocked: false },
      { id: 'lore_7', category: 'Religion', title: 'The Silent Sacrament', content: 'True prayer requires no words, only the willingness to listen to nothing.', unlockCondition: 'reach_max_devotion', isUnlocked: false },
      { id: 'lore_8', category: 'Nature', title: 'Bloodroot Vine', content: 'A crimson creeper that blooms only where great battles were fought, feeding on residual rage.', unlockCondition: 'harvest_bloodroot', isUnlocked: false },
      { id: 'lore_9', category: 'Technology', title: 'The Null Engine', content: 'A machine designed by a secular sect to replace gods with logic. It ran for three days before asking why.', unlockCondition: 'build_null_engine', isUnlocked: false },
      { id: 'lore_10', category: 'Mystery', title: 'Letter from the Edge', content: '"We have reached the end of the map. The ocean does not stop. It simply learns your name."', unlockCondition: 'sail_beyond_map', isUnlocked: false },
      { id: 'lore_11', category: 'History', title: 'The Last Pilgrimage', content: 'A million faithful walked into the desert and were never seen again. Their footprints remain, burned into glass.', unlockCondition: 'complete_pilgrimage_chain', isUnlocked: false },
      { id: 'lore_12', category: 'Religion', title: 'The Doubt Codex', content: 'Heretical texts that claim gods are merely echoes of mortal fear. Possession carries the death penalty.', unlockCondition: 'trigger_heresy_event', isUnlocked: false },
      { id: 'lore_13', category: 'Nature', title: 'Ashglass Forest', content: 'Trees of obsidian glass that grow where volcanoes weep. Their fruit is said to grant visions of tomorrow.', unlockCondition: 'harvest_ashglass', isUnlocked: false },
      { id: 'lore_14', category: 'Technology', title: 'Stellar Cartography', content: 'Mapping the stars revealed they were not lights, but holes punched through a shell no one knew existed.', unlockCondition: 'discover_stellar_map', isUnlocked: false },
    ];
  }

  private initBestiary(): void {
    const creatures = [
      { type: 'WOLF', name: 'Timber Wolf', desc: 'A fierce predator of the forests.' },
      { type: 'STAG', name: 'Forest Stag', desc: 'A majestic herbivore.' },
      { type: 'COW', name: 'Plains Cow', desc: 'A docile grazing animal.' },
      { type: 'CELESTIAL', name: 'Celestial Beast', desc: 'A divine creature from the heavens.' },
    ];
    for (const c of creatures) {
      this.bestiary.set(c.type, {
        id: `bestiary_${c.type}`,
        creatureType: c.type,
        name: c.name,
        description: c.desc,
        discovered: false,
        killCount: 0,
      });
    }
  }

  private initHerbarium(): void {
    const flora = [
      { type: 'CROP', name: 'Wheat', desc: 'A staple grain crop.' },
      { type: 'NANO_BANANA', name: 'Nano-Banana', desc: 'A strange fruit from another age.' },
      { type: 'EXOTIC', name: 'Void Orchid', desc: 'A flower that blooms in darkness.' },
      { type: 'TREE', name: 'Ancient Oak', desc: 'A tree older than memory.' },
    ];
    for (const f of flora) {
      this.herbarium.set(f.type, {
        id: `herbarium_${f.type}`,
        floraType: f.type,
        name: f.name,
        description: f.desc,
        discovered: false,
        harvestCount: 0,
      });
    }
  }

  /** Get an NPC dialogue tree by ID */
  getNPCDialogueTree(npcId: string): DialogueNode[] | undefined {
    return this.npcDialogues.get(npcId);
  }

  /** Get all registered NPC dialogue tree IDs */
  getNPCDialogueIds(): string[] {
    return Array.from(this.npcDialogues.keys());
  }

  private initNPCDialogues(): void {
    this.npcDialogues.set('npc_elder_sage', [
      { id: 'es_start', speaker: 'Elder Sage', text: 'You stand at the crossroads of ages, deity. What do you seek in the archives of dust?', choices: [
        { id: 'es_wisdom', label: 'Seek Wisdom', nextNodeId: 'es_wisdom_node', effects: { divineXP: 10 } },
        { id: 'es_power', label: 'Seek Power', nextNodeId: 'es_power_node', effects: { devotionDelta: -5 } },
        { id: 'es_leave', label: 'Leave', nextNodeId: null },
      ]},
      { id: 'es_wisdom_node', speaker: 'Elder Sage', text: 'Wisdom is the acceptance that the flame burns without purpose. Here, take this scroll of silence.', choices: [
        { id: 'es_wisdom_accept', label: 'Accept the Scroll', nextNodeId: 'es_end', effects: { divineXP: 20 } },
      ]},
      { id: 'es_power_node', speaker: 'Elder Sage', text: 'Power is a hungry mirror. It reflects what you feed it. Are you certain?', choices: [
        { id: 'es_power_sure', label: 'I am certain.', nextNodeId: 'es_end', effects: { devotionDelta: 15, happinessDelta: -10 } },
        { id: 'es_power_doubt', label: 'Perhaps not.', nextNodeId: 'es_wisdom_node', effects: { devotionDelta: 5 } },
      ]},
      { id: 'es_end', speaker: 'Elder Sage', text: 'Go then. The stones remember even when gods forget.', choices: [
        { id: 'es_farewell', label: 'Farewell', nextNodeId: null },
      ]},
    ]);

    this.npcDialogues.set('npc_wandering_merchant', [
      { id: 'wm_start', speaker: 'Wandering Merchant', text: 'Greetings, divine one! I have wares from ten thousand leagues. Care to trade?', choices: [
        { id: 'wm_trade', label: 'Trade Resources', nextNodeId: 'wm_trade_node', effects: { resourceDelta: -20, devotionDelta: 10 } },
        { id: 'wm_info', label: 'Ask for Rumors', nextNodeId: 'wm_rumor_node' },
        { id: 'wm_refuse', label: 'Not interested', nextNodeId: null },
      ]},
      { id: 'wm_trade_node', speaker: 'Wandering Merchant', text: 'A pleasure doing business! May your coffers never empty.', choices: [
        { id: 'wm_trade_done', label: 'Safe travels.', nextNodeId: null, effects: { happinessDelta: 2 } },
      ]},
      { id: 'wm_rumor_node', speaker: 'Wandering Merchant', text: 'They say a hollow mountain hides a gate to the first age. But who believes merchants?', choices: [
        { id: 'wm_rumor_thanks', label: 'Interesting. Farewell.', nextNodeId: null, effects: { divineXP: 5 } },
      ]},
    ]);

    this.npcDialogues.set('npc_heretic_prophet', [
      { id: 'hp_start', speaker: 'Heretic Prophet', text: 'The gods are puppets of older things, stranger things. Will you hear the truth?', choices: [
        { id: 'hp_listen', label: 'Listen', nextNodeId: 'hp_revelation' },
        { id: 'hp_silence', label: 'Silence them', nextNodeId: 'hp_silenced', effects: { devotionDelta: 10, happinessDelta: -5 } },
      ]},
      { id: 'hp_revelation', speaker: 'Heretic Prophet', text: 'Divinity is a mirror. You are not looking out at mortals—you are looking at yourself, twisted by worship.', choices: [
        { id: 'hp_deny', label: 'Deny the Heresy', nextNodeId: 'hp_denial', effects: { devotionDelta: 20 } },
        { id: 'hp_embrace', label: 'Consider the Truth', nextNodeId: 'hp_conflicted', effects: { devotionDelta: -15, divineXP: 25 } },
      ]},
      { id: 'hp_silenced', speaker: 'Heretic Prophet', text: 'So be it. But the doubt will outlive the voice.', choices: [
        { id: 'hp_silenced_end', label: 'Leave', nextNodeId: null },
      ]},
      { id: 'hp_denial', speaker: 'Heretic Prophet', text: 'Faith is a shield, but shields rust when not tested. Remember me when cracks appear.', choices: [
        { id: 'hp_denial_end', label: 'I will not.', nextNodeId: null },
      ]},
      { id: 'hp_conflicted', speaker: 'Heretic Prophet', text: 'To doubt is not to fall. It is to stand on the edge of a greater understanding.', choices: [
        { id: 'hp_conflicted_end', label: 'I must think.', nextNodeId: null },
      ]},
    ]);

    this.npcDialogues.set('npc_wounded_warrior', [
      { id: 'ww_start', speaker: 'Wounded Warrior', text: 'I have fought in twelve battles for your name. Now I bleed in the mud. Will you heal me, or let me die a legend?', choices: [
        { id: 'ww_heal', label: 'Heal', nextNodeId: 'ww_healed', effects: { devotionDelta: 10, happinessDelta: 5 } },
        { id: 'ww_let_die', label: 'Let them die', nextNodeId: 'ww_death', effects: { devotionDelta: -10 } },
        { id: 'ww_promote', label: 'Make them a Saint', nextNodeId: 'ww_saint', effects: { devotionDelta: 25, populationDelta: -1 } },
      ]},
      { id: 'ww_healed', speaker: 'Wounded Warrior', text: 'I will stand again. For you, and for the banner.', choices: [
        { id: 'ww_healed_end', label: 'Rise, soldier.', nextNodeId: null },
      ]},
      { id: 'ww_death', speaker: 'Wounded Warrior', text: 'So this is how faith ends. Not with glory, but with silence.', choices: [
        { id: 'ww_death_end', label: 'Your silence serves.', nextNodeId: null },
      ]},
      { id: 'ww_saint', speaker: 'Wounded Warrior', text: 'A saint? Then let my blood be the ink of hymns.', choices: [
        { id: 'ww_saint_end', label: 'Sing, martyr.', nextNodeId: null, effects: { happinessDelta: 10 } },
      ]},
    ]);

    this.npcDialogues.set('npc_child_seer', [
      { id: 'cs_start', speaker: 'Child Seer', text: 'I saw you in a dream before you existed. You were smaller then. Kinder.', choices: [
        { id: 'cs_kind', label: 'I can still be kind.', nextNodeId: 'cs_kindness' },
        { id: 'cs_grow', label: 'Gods must grow beyond kindness.', nextNodeId: 'cscold' },
        { id: 'cs_ignore', label: 'You are just a child.', nextNodeId: 'cs_angry' },
      ]},
      { id: 'cs_kindness', speaker: 'Child Seer', text: 'Then there is hope. The threads are not yet cut.', choices: [
        { id: 'cs_kindness_end', label: 'Sleep well, little one.', nextNodeId: null, effects: { happinessDelta: 5, devotionDelta: 5 } },
      ]},
      { id: 'cscold', speaker: 'Child Seer', text: 'Cold stone does not remember the sun. That is what you will become.', choices: [
        { id: 'cs_cold_end', label: 'So be it.', nextNodeId: null, effects: { devotionDelta: 10, happinessDelta: -5 } },
      ]},
      { id: 'cs_angry', speaker: 'Child Seer', text: 'Children see what adults have learned to hide. Do not dismiss what you fear.', choices: [
        { id: 'cs_angry_apologize', label: 'You are right. I apologize.', nextNodeId: 'cs_kindness' },
        { id: 'cs_angry_leave', label: 'Leave me.', nextNodeId: null, effects: { happinessDelta: -3 } },
      ]},
    ]);
  }
}
