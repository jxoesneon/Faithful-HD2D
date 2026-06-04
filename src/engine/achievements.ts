import type { Achievement, AchievementProgress, PlayerTitle, WorldStateSnapshot } from '../types';

// ============================================================
// Achievement Database
// ============================================================

export const ACHIEVEMENT_DATABASE: Achievement[] = [
  // --- Progression ---
  { id: 'ach_first_tribe', title: 'First Tribe', description: 'Establish your first tribe.', category: 'Progression', icon: '🛖', requirement: { type: 'stat_threshold', statKey: 'tribeCount', threshold: 1 }, tier: 1 },
  { id: 'ach_village_elder', title: 'Village Elder', description: 'Reach a population of 50.', category: 'Progression', icon: '🏡', requirement: { type: 'stat_threshold', statKey: 'population', threshold: 50 }, tier: 1 },
  { id: 'ach_city_builder', title: 'City Builder', description: 'Reach a population of 500.', category: 'Progression', icon: '🏛️', requirement: { type: 'stat_threshold', statKey: 'population', threshold: 500 }, tier: 2 },
  { id: 'ach_metropolis', title: 'Metropolis', description: 'Reach a population of 1,500.', category: 'Progression', icon: '🌌', requirement: { type: 'stat_threshold', statKey: 'population', threshold: 1500 }, tier: 3 },
  { id: 'ach_cosmic_empire', title: 'Cosmic Empire', description: 'Reach a population of 4,000.', category: 'Progression', icon: '👑', requirement: { type: 'stat_threshold', statKey: 'population', threshold: 4000 }, tier: 4 },
  { id: 'ach_technocracy', title: 'Technocracy', description: 'Achieve an average technology level of 5.', category: 'Progression', icon: '⚙️', requirement: { type: 'stat_threshold', statKey: 'averageTech', threshold: 5 }, tier: 3 },
  { id: 'ach_agrarian', title: 'Agrarian Society', description: 'Cultivate 100 flora.', category: 'Progression', icon: '🌾', requirement: { type: 'stat_threshold', statKey: 'totalFlora', threshold: 100 }, tier: 2 },
  { id: 'ach_master_builder', title: 'Master Builder', description: 'Construct 20 structures.', category: 'Progression', icon: '🏗️', requirement: { type: 'stat_threshold', statKey: 'totalStructures', threshold: 20 }, tier: 2 },
  { id: 'ach_explorer', title: 'World Explorer', description: 'Play for 1 hour.', category: 'Progression', icon: '🧭', requirement: { type: 'stat_threshold', statKey: 'timePlayed', threshold: 3600 }, tier: 1 },
  { id: 'ach_veteran', title: 'Veteran Deity', description: 'Play for 10 hours.', category: 'Progression', icon: '⏳', requirement: { type: 'stat_threshold', statKey: 'timePlayed', threshold: 36000 }, tier: 3 },
  { id: 'ach_immortal', title: 'Immortal Patron', description: 'Play for 24 hours.', category: 'Progression', icon: '♾️', requirement: { type: 'stat_threshold', statKey: 'timePlayed', threshold: 86400 }, tier: 4 },

  // --- Combat ---
  { id: 'ach_wolf_slayer', title: 'Wolf Slayer', description: 'Defeat 10 wolf packs.', category: 'Combat', icon: '🐺', requirement: { type: 'stat_threshold', statKey: 'wolvesDefeated', threshold: 10 }, tier: 2 },
  { id: 'ach_pacifist', title: 'Pacifist', description: 'Have zero active conflicts for 5 minutes.', category: 'Combat', icon: '🕊️', requirement: { type: 'stat_threshold', statKey: 'peaceTime', threshold: 300 }, tier: 2 },
  { id: 'ach_warmonger', title: 'Warmonger', description: 'Survive 10 active conflicts.', category: 'Combat', icon: '⚔️', requirement: { type: 'stat_threshold', statKey: 'conflictsSurvived', threshold: 10 }, tier: 3 },
  { id: 'ach_siege_master', title: 'Siege Master', description: 'Build 5 defensive structures.', category: 'Combat', icon: '🛡️', requirement: { type: 'stat_threshold', statKey: 'defensesBuilt', threshold: 5 }, tier: 2 },
  { id: 'ach_dragon_slayer', title: 'Celestial Slayer', description: 'Defeat a celestial being.', category: 'Combat', icon: '☄️', requirement: { type: 'stat_threshold', statKey: 'celestialsDefeated', threshold: 1 }, tier: 4 },
  { id: 'ach_blood_god', title: 'Blood God', description: 'Defeat 100 enemies in total.', category: 'Combat', icon: '🩸', requirement: { type: 'stat_threshold', statKey: 'totalKills', threshold: 100 }, tier: 3 },
  { id: 'ach_defender', title: 'Defender of the Realm', description: 'Win 5 defensive quests.', category: 'Combat', icon: '🏰', requirement: { type: 'stat_threshold', statKey: 'defensiveQuestsWon', threshold: 5 }, tier: 2 },

  // --- Divine ---
  { id: 'ach_miracle_worker', title: 'Miracle Worker', description: 'Cast 10 miracles.', category: 'Divine', icon: '✨', requirement: { type: 'stat_threshold', statKey: 'miraclesCast', threshold: 10 }, tier: 2 },
  { id: 'ach_apocalypse', title: 'Apocalypse', description: 'Witness the extinction of all population.', category: 'Divine', icon: '💀', requirement: { type: 'stat_threshold', statKey: 'population', threshold: 0 }, tier: 4 },
  { id: 'ach_prophet', title: 'Voice of the Prophet', description: 'Experience the Prophet event.', category: 'Divine', icon: '📜', requirement: { type: 'event_trigger', eventId: 'evt_prophet' }, tier: 2 },
  { id: 'ach_heretic', title: 'Tolerated Heresy', description: 'Experience the Heresy event.', category: 'Divine', icon: '🔥', requirement: { type: 'event_trigger', eventId: 'evt_heresy' }, tier: 2 },
  { id: 'ach_pantheon', title: 'Pantheon Builder', description: 'Unlock every deity.', category: 'Divine', icon: '🏛️', requirement: { type: 'stat_threshold', statKey: 'deitiesUnlocked', threshold: 5 }, tier: 3 },
  { id: 'ach_divine_intervention', title: 'Divine Interventionist', description: 'Perform 50 interventions.', category: 'Divine', icon: '⚡', requirement: { type: 'stat_threshold', statKey: 'interventions', threshold: 50 }, tier: 3 },
  { id: 'ach_true_believer', title: 'True Believer', description: 'Reach 1,000 devotion.', category: 'Divine', icon: '🔮', requirement: { type: 'stat_threshold', statKey: 'devotion', threshold: 1000 }, tier: 3 },
  { id: 'ach_ascended', title: 'Ascended', description: 'Reach Divine Level 10.', category: 'Divine', icon: '🌟', requirement: { type: 'stat_threshold', statKey: 'divineLevel', threshold: 10 }, tier: 4 },

  // --- Economy ---
  { id: 'ach_hoarder', title: 'Hoarder', description: 'Accumulate 1,000 resources.', category: 'Economy', icon: '💰', requirement: { type: 'stat_threshold', statKey: 'resources', threshold: 1000 }, tier: 2 },
  { id: 'ach_master_trader', title: 'Master Trader', description: 'Complete 5 trade events.', category: 'Economy', icon: '🤝', requirement: { type: 'stat_threshold', statKey: 'tradeEvents', threshold: 5 }, tier: 2 },
  { id: 'ach_famine_survivor', title: 'Famine Survivor', description: 'Survive a famine event.', category: 'Economy', icon: '🍞', requirement: { type: 'event_trigger', eventId: 'evt_famine' }, tier: 2 },
  { id: 'ach_industrialist', title: 'Industrialist', description: 'Build 10 reactors.', category: 'Economy', icon: '⚙️', requirement: { type: 'stat_threshold', statKey: 'reactorsBuilt', threshold: 10 }, tier: 3 },
  { id: 'ach_golden_age', title: 'Golden Age', description: 'Maintain 90+ average happiness for 5 minutes.', category: 'Economy', icon: '🌞', requirement: { type: 'stat_threshold', statKey: 'goldenAgeTime', threshold: 300 }, tier: 3 },
  { id: 'ach_tithe_lord', title: 'Tithe Lord', description: 'Collect 100 tithes.', category: 'Economy', icon: '🪙', requirement: { type: 'stat_threshold', statKey: 'tithesCollected', threshold: 100 }, tier: 2 },

  // --- Ecology ---
  { id: 'ach_green_thumb', title: 'Green Thumb', description: 'Harvest 100 flora.', category: 'Ecology', icon: '🌿', requirement: { type: 'stat_threshold', statKey: 'floraHarvested', threshold: 100 }, tier: 2 },
  { id: 'ach_beast_master', title: 'Beast Master', description: 'Have 50 fauna in the world.', category: 'Ecology', icon: '🦌', requirement: { type: 'stat_threshold', statKey: 'totalFauna', threshold: 50 }, tier: 2 },
  { id: 'ach_forest_guardian', title: 'Forest Guardian', description: 'Prevent any wildfire for 10 minutes.', category: 'Ecology', icon: '🌲', requirement: { type: 'stat_threshold', statKey: 'noWildfireTime', threshold: 600 }, tier: 3 },
  { id: 'ach_nature_wrath', title: 'Nature\'s Wrath', description: 'Survive 5 natural disasters.', category: 'Ecology', icon: '🌪️', requirement: { type: 'stat_threshold', statKey: 'naturalDisastersSurvived', threshold: 5 }, tier: 3 },
  { id: 'ach_terraformer', title: 'Terraformer', description: 'Change the terrain of 20 tiles.', category: 'Ecology', icon: '🌍', requirement: { type: 'stat_threshold', statKey: 'tilesTerraformd', threshold: 20 }, tier: 3 },

  // --- Social ---
  { id: 'ach_diplomat', title: 'Master Diplomat', description: 'Complete 5 diplomacy quests.', category: 'Social', icon: '🕊️', requirement: { type: 'stat_threshold', statKey: 'diplomacyQuests', threshold: 5 }, tier: 2 },
  { id: 'ach_tyrant', title: 'Tyrant', description: 'Suppress 3 coups.', category: 'Social', icon: '👿', requirement: { type: 'stat_threshold', statKey: 'coupsSuppressed', threshold: 3 }, tier: 3 },
  { id: 'ach_beloved', title: 'Beloved Deity', description: 'Maintain 90+ average happiness.', category: 'Social', icon: '💖', requirement: { type: 'stat_threshold', statKey: 'averageHappiness', threshold: 90 }, tier: 3 },
  { id: 'ach_scholar', title: 'Patron of Scholars', description: 'Research 10 technologies.', category: 'Social', icon: '📚', requirement: { type: 'stat_threshold', statKey: 'techsResearched', threshold: 10 }, tier: 2 },
  { id: 'ach_popular', title: 'Popular Vote', description: 'Reach a population of 250 with 80+ happiness.', category: 'Social', icon: '🗳️', requirement: { type: 'compound', subAchievements: ['ach_village_elder', 'ach_beloved'] }, tier: 3 },

  // --- Secret ---
  { id: 'ach_meteor_hunter', title: 'Meteor Hunter', description: 'Survive the Meteor Shower event.', category: 'Secret', icon: '☄️', requirement: { type: 'event_trigger', eventId: 'evt_meteor' }, isHidden: true, tier: 3 },
  { id: 'ach_void_walker', title: 'Void Walker', description: 'Witness the Void Rift.', category: 'Secret', icon: '🌀', requirement: { type: 'event_trigger', eventId: 'evt_void_rift' }, isHidden: true, tier: 4 },
  { id: 'ach_comet_watcher', title: 'Comet Watcher', description: 'Sigh the Great Comet.', category: 'Secret', icon: '✴️', requirement: { type: 'event_trigger', eventId: 'evt_comet' }, isHidden: true, tier: 3 },
  { id: 'ach_eclipse_chaser', title: 'Eclipse Chaser', description: 'Survive a total solar eclipse.', category: 'Secret', icon: '🌑', requirement: { type: 'event_trigger', eventId: 'evt_eclipse' }, isHidden: true, tier: 3 },
  { id: 'ach_perfect_run', title: 'Perfect Run', description: 'Complete a chain quest without failure.', category: 'Secret', icon: '🏆', requirement: { type: 'stat_threshold', statKey: 'perfectChains', threshold: 1 }, isHidden: true, tier: 4 },
  { id: 'ach_everything', title: 'Omniscient', description: 'Unlock all non-secret achievements.', category: 'Secret', icon: '👁️', requirement: { type: 'compound', subAchievements: [] }, isHidden: true, tier: 4 },
  { id: 'ach_benevolent', title: 'Benevolent God', description: 'Maintain 80+ average happiness.', category: 'Social', icon: '😇', requirement: { type: 'stat_threshold', statKey: 'averageHappiness', threshold: 80 }, tier: 2 },
  { id: 'ach_cataclysm', title: 'Cataclysm', description: 'Survive a meteor shower and a solar eclipse.', category: 'Secret', icon: '💥', requirement: { type: 'compound', subAchievements: ['ach_meteor_hunter', 'ach_eclipse_chaser'] }, isHidden: true, tier: 4 },

  // --- Progression ---
  { id: 'ach_age_of_exploration', title: 'Age of Exploration', description: 'Explore 25 new sectors.', category: 'Progression', icon: '🗺️', requirement: { type: 'stat_threshold', statKey: 'sectorsExplored', threshold: 25 }, tier: 2 },
  { id: 'ach_spacefaring', title: 'Spacefaring Civilization', description: 'Reach an average technology level of 8.', category: 'Progression', icon: '🚀', requirement: { type: 'stat_threshold', statKey: 'averageTech', threshold: 8 }, tier: 4 },
  { id: 'ach_eternal_city', title: 'Eternal City', description: 'Reach a population of 2,500 in a single settlement.', category: 'Progression', icon: '🏰', requirement: { type: 'stat_threshold', statKey: 'maxSettlementPopulation', threshold: 2500 }, tier: 3 },

  // --- Combat ---
  { id: 'ach_vanguard_commander', title: 'Vanguard Commander', description: 'Win 10 offensive conflicts.', category: 'Combat', icon: '🎖️', requirement: { type: 'stat_threshold', statKey: 'offensiveWins', threshold: 10 }, tier: 3 },
  { id: 'ach_unbroken_shield', title: 'Unbroken Shield', description: 'Survive 20 wolf attacks without losing population.', category: 'Combat', icon: '🛡️', requirement: { type: 'stat_threshold', statKey: 'wolfAttacksSurvived', threshold: 20 }, tier: 3 },
  { id: 'ach_doomsday_survivor', title: 'Doomsday Survivor', description: 'Survive the Doomsday Split event.', category: 'Combat', icon: '☢️', requirement: { type: 'event_trigger', eventId: 'evt_doomsday_split' }, tier: 4 },

  // --- Divine ---
  { id: 'ach_wrath_of_gods', title: 'Wrath of the Gods', description: 'Cast 50 destructive miracles.', category: 'Divine', icon: '⚔️', requirement: { type: 'stat_threshold', statKey: 'destructiveMiraclesCast', threshold: 50 }, tier: 3 },
  { id: 'ach_pantheon_ascendant', title: 'Pantheon Ascendant', description: 'Unlock every deity including secret ones.', category: 'Divine', icon: '🌠', requirement: { type: 'stat_threshold', statKey: 'deitiesUnlocked', threshold: 10 }, tier: 4 },
  { id: 'ach_crusaders_blessing', title: 'Crusader\'s Blessing', description: 'Complete the Holy War quest chain.', category: 'Divine', icon: '✝️', requirement: { type: 'stat_threshold', statKey: 'holyWarChainsCompleted', threshold: 1 }, tier: 3 },

  // --- Economy ---
  { id: 'ach_silk_road', title: 'Silk Road Merchant', description: 'Accumulate 5,000 total resources across all trades.', category: 'Economy', icon: '🐫', requirement: { type: 'stat_threshold', statKey: 'totalResourcesTraded', threshold: 5000 }, tier: 3 },
  { id: 'ach_trade_prince', title: 'Trade Prince', description: 'Complete 20 trade events.', category: 'Economy', icon: '💎', requirement: { type: 'stat_threshold', statKey: 'tradeEvents', threshold: 20 }, tier: 3 },
  { id: 'ach_gilded_throne', title: 'Gilded Throne', description: 'Maintain 10,000 resources for 60 seconds.', category: 'Economy', icon: '👑', requirement: { type: 'stat_threshold', statKey: 'maxResourcesHeld', threshold: 10000 }, tier: 4 },

  // --- Ecology ---
  { id: 'ach_gaias_champion', title: 'Gaia\'s Champion', description: 'Plant 200 flora without losing any to fire.', category: 'Ecology', icon: '🌳', requirement: { type: 'stat_threshold', statKey: 'floraPlanted', threshold: 200 }, tier: 3 },
  { id: 'ach_extinction_preventer', title: 'Extinction Preventer', description: 'Save a species from total annihilation.', category: 'Ecology', icon: '🦅', requirement: { type: 'stat_threshold', statKey: 'speciesSaved', threshold: 1 }, tier: 2 },
  { id: 'ach_apex_tamer', title: 'Apex Predator Tamer', description: 'Have 20 wolves coexisting peacefully near settlements.', category: 'Ecology', icon: '🐺', requirement: { type: 'stat_threshold', statKey: 'wolvesTamed', threshold: 20 }, tier: 3 },

  // --- Social ---
  { id: 'ach_grand_mediator', title: 'Grand Mediator', description: 'Resolve 15 conflicts through diplomacy.', category: 'Social', icon: '⚖️', requirement: { type: 'stat_threshold', statKey: 'conflictsResolvedDiplomatically', threshold: 15 }, tier: 3 },
  { id: 'ach_cult_of_personality', title: 'Cult of Personality', description: 'Reach 100 devotion in under 5 minutes.', category: 'Social', icon: '🎭', requirement: { type: 'stat_threshold', statKey: 'fastDevotion100', threshold: 1 }, tier: 3 },
  { id: 'ach_peoples_champion', title: 'People\'s Champion', description: 'Maintain 95+ average happiness for 10 minutes.', category: 'Social', icon: '🏅', requirement: { type: 'stat_threshold', statKey: 'utopiaTime', threshold: 600 }, tier: 4 },

  // --- Secret ---
  { id: 'ach_truth_beneath', title: 'The Truth Beneath', description: 'Discover the Ancient Cave Paintings.', category: 'Secret', icon: '🗿', requirement: { type: 'event_trigger', eventId: 'evt_cave_paintings' }, isHidden: true, tier: 3 },
  { id: 'ach_all_seeing_eye', title: 'All-Seeing Eye', description: 'Trigger the Angelic Host event.', category: 'Secret', icon: '👁️', requirement: { type: 'event_trigger', eventId: 'evt_angelic_host' }, isHidden: true, tier: 4 },
];

// ============================================================
// Titles
// ============================================================

export const PLAYER_TITLES: PlayerTitle[] = [
  { id: 'title_novice', name: 'Novice Shepherd', description: 'A fledgling deity.', unlockCondition: 'Default', styleClass: 'text-slate-300' },
  { id: 'title_builder', name: 'Architect of Worlds', description: 'Built your first city.', unlockCondition: 'ach_city_builder', styleClass: 'text-emerald-400' },
  { id: 'title_warlord', name: 'Warlord', description: 'Embraced endless conflict.', unlockCondition: 'ach_warmonger', styleClass: 'text-rose-400' },
  { id: 'title_peacemaker', name: 'Peacemaker', description: 'Maintained lasting peace.', unlockCondition: 'ach_pacifist', styleClass: 'text-sky-400' },
  { id: 'title_divine', name: 'Aspect of Divinity', description: 'Ascended beyond mortal comprehension.', unlockCondition: 'ach_ascended', styleClass: 'text-amber-400' },
  { id: 'title_secret', name: 'Keeper of Secrets', description: 'Discovered hidden truths.', unlockCondition: 'ach_void_walker', styleClass: 'text-purple-400' },
];

// ============================================================
// Achievement Engine
// ============================================================

export class AchievementEngine {
  private unlocked = new Set<string>();
  private progress = new Map<string, AchievementProgress>();
  private eventTriggers = new Set<string>();
  private statOverrides = new Map<string, number>();

  constructor() {
    for (const ach of ACHIEVEMENT_DATABASE) {
      this.progress.set(ach.id, { achievementId: ach.id, current: 0, target: this.resolveTarget(ach) });
    }
  }

  /**
   * Update achievements from a world snapshot.
   * Returns newly unlocked achievement ids.
   */
  update(world: WorldStateSnapshot): string[] {
    const newlyUnlocked: string[] = [];
    for (const ach of ACHIEVEMENT_DATABASE) {
      if (this.unlocked.has(ach.id)) continue;
      const prog = this.progress.get(ach.id)!;

      let shouldUnlock = false;
      if (ach.requirement.type === 'stat_threshold') {
        const val = this.getStat(ach.requirement.statKey!, world);
        prog.current = val;
        shouldUnlock = val >= (ach.requirement.threshold ?? 0);
      } else if (ach.requirement.type === 'event_trigger') {
        shouldUnlock = this.eventTriggers.has(ach.requirement.eventId!);
      } else if (ach.requirement.type === 'compound') {
        const subs = ach.requirement.subAchievements ?? [];
        if (subs.length === 0 && ach.id === 'ach_everything') {
          const allNormal = ACHIEVEMENT_DATABASE.filter((a) => !a.isHidden && a.id !== 'ach_everything').every((a) => this.unlocked.has(a.id));
          shouldUnlock = allNormal;
        } else {
          shouldUnlock = subs.every((id) => this.unlocked.has(id));
        }
      }

      if (shouldUnlock) {
        this.unlock(ach.id);
        newlyUnlocked.push(ach.id);
      }
    }
    return newlyUnlocked;
  }

  /** Mark an event as having occurred (for event_trigger achievements). */
  triggerEvent(eventId: string): void {
    this.eventTriggers.add(eventId);
  }

  /** Override a custom stat not present in WorldStateSnapshot. */
  setCustomStat(key: string, value: number): void {
    this.statOverrides.set(key, value);
  }

  /** Check if an achievement is unlocked. */
  isUnlocked(id: string): boolean {
    return this.unlocked.has(id);
  }

  /** Get progress for an achievement. */
  getProgress(id: string): AchievementProgress | undefined {
    return this.progress.get(id);
  }

  /** Get current title based on highest-tier unlocked title condition. */
  getCurrentTitle(): PlayerTitle {
    for (const title of PLAYER_TITLES.slice().reverse()) {
      if (title.unlockCondition === 'Default' || this.unlocked.has(title.unlockCondition)) {
        return title;
      }
    }
    return PLAYER_TITLES[0];
  }

  /** Total unlocked count. */
  get unlockedCount(): number {
    return this.unlocked.size;
  }

  /** Percentage of all achievements unlocked (0-1). */
  get completionRate(): number {
    return this.unlocked.size / ACHIEVEMENT_DATABASE.length;
  }

  private resolveTarget(ach: Achievement): number {
    if (ach.requirement.type === 'stat_threshold') {
      return ach.requirement.threshold ?? 1;
    }
    if (ach.requirement.type === 'compound') {
      return ach.requirement.subAchievements?.length ?? 1;
    }
    return 1;
  }

  private getStat(key: string, world: WorldStateSnapshot): number {
    if (this.statOverrides.has(key)) return this.statOverrides.get(key)!;
    return (world as any)[key] ?? 0;
  }

  private unlock(id: string): void {
    this.unlocked.add(id);
    const prog = this.progress.get(id);
    if (prog) {
      prog.current = prog.target;
      prog.unlockedAt = Date.now();
    }
  }
}
