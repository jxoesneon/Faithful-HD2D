import type { RandomEvent, WorldStateSnapshot, EventChoice, EventCategory } from '../../types';

/**
 * Full database of random narrative events.
 */
export const EVENT_DATABASE: RandomEvent[] = [
  // ============================================================
  // Natural
  // ============================================================
  {
    id: 'evt_earthquake',
    title: 'Tectonic Tremor',
    description: 'The ground shakes violently, damaging structures and unsettling the population.',
    category: 'Natural',
    probabilityBase: 0.02,
    choices: [
      { id: 'eq_evacuate', label: 'Evacuate', description: 'Move people to open fields.', outcomeText: 'Casualties are low, but productivity drops.', weight: 1, effects: { populationDelta: -2, happinessDelta: -5 } },
      { id: 'eq_reinforce', label: 'Reinforce', description: 'Divert resources to emergency repairs.', outcomeText: 'Structures hold, but resources are drained.', weight: 1, effects: { resourceDelta: -50, happinessDelta: -2 } },
    ],
  },
  {
    id: 'evt_flood',
    title: 'Great Flood',
    description: 'Rivers swell beyond their banks, threatening farms and lowland settlements.',
    category: 'Natural',
    probabilityBase: 0.025,
    choices: [
      { id: 'fl_dike', label: 'Build Dikes', description: 'Mobilize labor to contain the water.', outcomeText: 'The flood is held back at great labor cost.', weight: 1, effects: { resourceDelta: -30, happinessDelta: -3 } },
      { id: 'fl_evac', label: 'Abandon Lowlands', description: 'Save lives but lose farmland.', outcomeText: 'Crops are lost, but the people survive.', weight: 1, effects: { happinessDelta: -8, resourceDelta: -20 } },
    ],
  },
  {
    id: 'evt_drought',
    title: 'Searing Drought',
    description: 'Rain has not fallen for weeks. Crops wither and water reserves dwindle.',
    category: 'Natural',
    probabilityBase: 0.03,
    probabilityConditions: (w) => (w.weather === 'DROUGHT' ? 0.15 : 0.03),
    choices: [
      { id: 'dr_ration', label: 'Ration Water', description: 'Strict water controls for survival.', outcomeText: 'The people endure, but morale plummets.', weight: 1, effects: { happinessDelta: -10, resourceDelta: -10 } },
      { id: 'dr_pray', label: 'Pray for Rain', description: 'Acolytes perform a rain dance.', outcomeText: 'Clouds gather and a drizzle begins. Devotion surges.', weight: 1, effects: { devotionDelta: 20, happinessDelta: 5, weatherChange: 'RAINY' } },
    ],
  },
  {
    id: 'evt_wildfire',
    title: 'Raging Wildfire',
    description: 'Dry winds carry embers across the forest edge, igniting the biome.',
    category: 'Natural',
    probabilityBase: 0.02,
    choices: [
      { id: 'wf_fight', label: 'Fight the Fire', description: 'Organize bucket brigades.', outcomeText: 'The fire is contained after losing some flora.', weight: 1, effects: { resourceDelta: -20, happinessDelta: -4 } },
      { id: 'wf_let', label: 'Let it Burn', description: 'Nature will reclaim its own.', outcomeText: 'Flora is devastated, but ash fertilizes the soil.', weight: 1, effects: { happinessDelta: -8, resourceDelta: 10 } },
    ],
  },
  {
    id: 'evt_meteor',
    title: 'Meteor Shower',
    description: 'Streaks of celestial fire rain from the heavens, scorching the earth.',
    category: 'Natural',
    probabilityBase: 0.005,
    isOneShot: true,
    choices: [
      { id: 'mt_salvage', label: 'Salvage Meteorite', description: 'Mine the fallen star for divine metal.', outcomeText: 'You gain rare cosmic minerals and divine XP.', weight: 1, effects: { resourceDelta: 100, divineXP: 50 } },
      { id: 'mt_hide', label: 'Take Cover', description: 'Hide in shelters until the shower ends.', outcomeText: 'Minimal losses, but an opportunity missed.', weight: 1, effects: { happinessDelta: -2 } },
    ],
  },
  {
    id: 'evt_blizzard',
    title: 'Abyssal Blizzard',
    description: 'An unnatural storm of ice descends, freezing crops and blocking roads.',
    category: 'Natural',
    probabilityBase: 0.015,
    probabilityConditions: (w) => (w.weather === 'TEMPEST' ? 0.08 : 0.015),
    choices: [
      { id: 'bz_huddle', label: 'Huddle Together', description: 'Share body heat and rations.', outcomeText: 'The tribe survives, but resources are consumed.', weight: 1, effects: { resourceDelta: -30, happinessDelta: -3 } },
      { id: 'bz_burn', label: 'Burn Everything', description: 'Sacrifice structures for warmth.', outcomeText: 'Warmth is gained, but buildings are lost.', weight: 1, effects: { happinessDelta: -6, resourceDelta: -15 } },
    ],
  },
  // ============================================================
  // Political
  // ============================================================
  {
    id: 'evt_coup',
    title: 'Palace Coup',
    description: 'A faction within the ruling class attempts to seize control.',
    category: 'Political',
    probabilityBase: 0.02,
    probabilityConditions: (w) => (w.averageHappiness < 30 ? 0.06 : 0.02),
    choices: [
      { id: 'cp_crush', label: 'Crush Dissent', description: 'Use force to restore order.', outcomeText: 'Order returns, but fear spreads.', weight: 1, effects: { populationDelta: -5, happinessDelta: -10, devotionDelta: 10 } },
      { id: 'cp_negotiate', label: 'Negotiate', description: 'Offer concessions to the rebels.', outcomeText: 'Stability is preserved at the cost of resources.', weight: 1, effects: { resourceDelta: -40, happinessDelta: 5 } },
    ],
  },
  {
    id: 'evt_revolution',
    title: 'Popular Revolution',
    description: 'The masses rise up against the current social order.',
    category: 'Political',
    probabilityBase: 0.015,
    probabilityConditions: (w) => (w.averageHappiness < 20 ? 0.1 : 0.015),
    choices: [
      { id: 'rv_suppress', label: 'Suppress', description: 'Deploy loyal guards.', outcomeText: 'The revolution is quelled with blood.', weight: 1, effects: { populationDelta: -10, happinessDelta: -15, devotionDelta: 15 } },
      { id: 'rv_reform', label: 'Enact Reforms', description: 'Rewrite the social contract.', outcomeText: 'The people are satisfied, but traditionalists grumble.', weight: 1, effects: { happinessDelta: 15, resourceDelta: -30, devotionDelta: -10 } },
    ],
  },
  {
    id: 'evt_embargo',
    title: 'Trade Embargo',
    description: 'Neighboring tribes refuse to trade, isolating your economy.',
    category: 'Political',
    probabilityBase: 0.025,
    choices: [
      { id: 'em_bribe', label: 'Bribe Merchants', description: 'Smuggle goods through back channels.', outcomeText: 'Trade resumes at a premium.', weight: 1, effects: { resourceDelta: -30, happinessDelta: 2 } },
      { id: 'em_self', label: 'Self-Sufficiency', description: 'Invest in local production.', outcomeText: 'Short-term pain yields long-term independence.', weight: 1, effects: { resourceDelta: -20, happinessDelta: -5 } },
    ],
  },
  {
    id: 'evt_assassination',
    title: 'Assassination Attempt',
    description: 'A blade in the dark targets a key leader.',
    category: 'Political',
    probabilityBase: 0.02,
    choices: [
      { id: 'as_investigate', label: 'Investigate', description: 'Hunt the conspirators.', outcomeText: 'The plot is unraveled, but paranoia grows.', weight: 1, effects: { happinessDelta: -5, devotionDelta: 5 } },
      { id: 'as_ignore', label: 'Ignore', description: 'Pretend it never happened.', outcomeText: 'The assassins strike again later.', weight: 1, effects: { populationDelta: -3, happinessDelta: -8 } },
    ],
  },
  {
    id: 'evt_civil_war',
    title: 'Civil War',
    description: 'The tribe fractures into warring factions.',
    category: 'Political',
    probabilityBase: 0.01,
    probabilityConditions: (w) => (w.conflictsActive > 2 ? 0.08 : 0.01),
    choices: [
      { id: 'cw_unify', label: 'Unify by Force', description: 'Crush the separatists.', outcomeText: 'Unity is restored, but scars remain.', weight: 1, effects: { populationDelta: -15, happinessDelta: -10, devotionDelta: 20 } },
      { id: 'cw_partition', label: 'Partition', description: 'Allow the factions to split.', outcomeText: 'Peace is bought with land and pride.', weight: 1, effects: { populationDelta: -5, happinessDelta: -5, resourceDelta: -20 } },
    ],
  },
  // ============================================================
  // Religious
  // ============================================================
  {
    id: 'evt_miracle',
    title: 'Spontaneous Miracle',
    description: 'A statue weeps divine oil. The faithful rejoice.',
    category: 'Religious',
    probabilityBase: 0.02,
    probabilityConditions: (w) => (w.devotion > 300 ? 0.06 : 0.02),
    choices: [
      { id: 'mr_exploit', label: 'Exploit the Hype', description: 'Charge pilgrims for blessings.', outcomeText: 'Wealth flows in, but faith is commodified.', weight: 1, effects: { resourceDelta: 60, devotionDelta: 10, happinessDelta: -5 } },
      { id: 'mr_honor', label: 'Honor the Divine', description: 'Hold a grand festival.', outcomeText: 'Devotion skyrockets among the masses.', weight: 1, effects: { devotionDelta: 40, happinessDelta: 10, resourceDelta: -20 } },
    ],
  },
  {
    id: 'evt_heresy',
    title: 'Heresy Spreads',
    description: 'A charismatic dissenter preaches against your divinity.',
    category: 'Religious',
    probabilityBase: 0.025,
    choices: [
      { id: 'hr_burn', label: 'Burn the Heretic', description: 'Public execution as deterrent.', outcomeText: 'Fear silences dissent, but devotion wavers.', weight: 1, effects: { populationDelta: -2, devotionDelta: 15, happinessDelta: -10 } },
      { id: 'hr_debate', label: 'Public Debate', description: 'Challenge the heretic to theological combat.', outcomeText: 'The truth prevails, strengthening the faithful.', weight: 1, effects: { devotionDelta: 20, happinessDelta: 5 } },
    ],
  },
  {
    id: 'evt_prophet',
    title: 'Prophet Emerges',
    description: 'A mortal claims to hear your voice directly.',
    category: 'Religious',
    probabilityBase: 0.015,
    choices: [
      { id: 'pr_endorse', label: 'Endorse', description: 'Make them your official mouthpiece.', outcomeText: 'Devotion surges, but the prophet gains power.', weight: 1, effects: { devotionDelta: 30, happinessDelta: 10, resourceDelta: -10 } },
      { id: 'pr_silence', label: 'Silence', description: 'The prophet is a fraud.', outcomeText: 'Order is maintained, but whispers persist.', weight: 1, effects: { happinessDelta: -5, devotionDelta: -10 } },
    ],
  },
  {
    id: 'evt_schism',
    title: 'Doctrinal Schism',
    description: 'Your clergy split over interpretation of divine will.',
    category: 'Religious',
    probabilityBase: 0.02,
    choices: [
      { id: 'sc_purge', label: 'Purge the Dissenters', description: 'Expel the offending sect.', outcomeText: 'Unity returns, but at a bloody cost.', weight: 1, effects: { populationDelta: -5, devotionDelta: 10, happinessDelta: -8 } },
      { id: 'sc_tolerate', label: 'Tolerate Both Sects', description: 'Allow divergent worship.', outcomeText: 'Diversity blooms, but central authority weakens.', weight: 1, effects: { happinessDelta: 10, devotionDelta: -10 } },
    ],
  },
  {
    id: 'evt_pilgrimage',
    title: 'Great Pilgrimage',
    description: 'Thousands begin a holy march to a sacred site.',
    category: 'Religious',
    probabilityBase: 0.015,
    choices: [
      { id: 'pl_support', label: 'Support', description: 'Provide supplies and protection.', outcomeText: 'The pilgrims bless your name.', weight: 1, effects: { resourceDelta: -30, devotionDelta: 25, happinessDelta: 5 } },
      { id: 'pl_tax', label: 'Tax the Pilgrims', description: 'Charge for passage and lodging.', outcomeText: 'Coffers swell, but the pious grumble.', weight: 1, effects: { resourceDelta: 40, devotionDelta: -10, happinessDelta: -5 } },
    ],
  },
  // ============================================================
  // Ecological
  // ============================================================
  {
    id: 'evt_plague',
    title: 'Blight Plague',
    description: 'A strange rot spreads through crops and livestock.',
    category: 'Ecological',
    probabilityBase: 0.02,
    choices: [
      { id: 'pl_burn', label: 'Burn Infected Crops', description: 'Contain the disease with fire.', outcomeText: 'The blight stops, but food is scarce.', weight: 1, effects: { resourceDelta: -40, happinessDelta: -5 } },
      { id: 'pl_alchem', label: 'Alchemical Cure', description: 'Brew a remedy from exotic herbs.', outcomeText: 'The plague is cured, but the herbs are gone.', weight: 1, effects: { resourceDelta: -20, happinessDelta: 5, devotionDelta: 5 } },
    ],
  },
  {
    id: 'evt_migration',
    title: 'Fauna Migration',
    description: 'A great herd moves through your territory.',
    category: 'Ecological',
    probabilityBase: 0.02,
    choices: [
      { id: 'mg_hunt', label: 'Hunt', description: 'Harvest the passing beasts.', outcomeText: 'Food abounds, but predators follow.', weight: 1, effects: { resourceDelta: 50, happinessDelta: 3 } },
      { id: 'mg_protect', label: 'Protect', description: 'Guard the herd from poachers.', outcomeText: 'The ecosystem thrives, but food is not gained.', weight: 1, effects: { happinessDelta: 8, devotionDelta: 5 } },
    ],
  },
  {
    id: 'evt_overgrowth',
    title: 'Rapid Overgrowth',
    description: 'Plants grow at an unnatural rate, choking fields.',
    category: 'Ecological',
    probabilityBase: 0.015,
    choices: [
      { id: 'og_cull', label: 'Cull the Growth', description: 'Slash and burn the excess.', outcomeText: 'Fields are saved, but labor is exhausted.', weight: 1, effects: { resourceDelta: -20, happinessDelta: -3 } },
      { id: 'og_embrace', label: 'Embrace the Wild', description: 'Let nature run its course.', outcomeText: 'Flora proliferates, farms are lost.', weight: 1, effects: { resourceDelta: 20, happinessDelta: -5 } },
    ],
  },
  {
    id: 'evt_famine',
    title: 'Sudden Famine',
    description: 'Food stores vanish overnight due to spoilage.',
    category: 'Ecological',
    probabilityBase: 0.02,
    probabilityConditions: (w) => (w.averageHappiness < 25 ? 0.06 : 0.02),
    choices: [
      { id: 'fm_ration', label: 'Strict Rationing', description: 'Equal distribution of scraps.', outcomeText: 'Nobody starves, but nobody is happy.', weight: 1, effects: { happinessDelta: -10 } },
      { id: 'fm_import', label: 'Emergency Imports', description: 'Buy food from distant lands.', outcomeText: 'Stomachs are full, but coffers are empty.', weight: 1, effects: { resourceDelta: -60, happinessDelta: 2 } },
    ],
  },
  // ============================================================
  // Cosmic
  // ============================================================
  {
    id: 'evt_aurora',
    title: 'Celestial Aurora',
    description: 'The sky dances with impossible colors. Mortals are mesmerized.',
    category: 'Cosmic',
    probabilityBase: 0.015,
    choices: [
      { id: 'au_meditate', label: 'Meditate', description: 'Channel the celestial energy.', outcomeText: 'Divine insight floods your mind.', weight: 1, effects: { divineXP: 30, devotionDelta: 10 } },
      { id: 'au_festival', label: 'Festival', description: 'Celebrate under the lights.', outcomeText: 'Happiness soars, but work halts.', weight: 1, effects: { happinessDelta: 15, resourceDelta: -15 } },
    ],
  },
  {
    id: 'evt_comet',
    title: 'Comet Sighted',
    description: 'A blazing comet heralds a great omen.',
    category: 'Cosmic',
    probabilityBase: 0.01,
    isOneShot: true,
    choices: [
      { id: 'co_omen', label: 'Read the Omen', description: 'Interpret the celestial message.', outcomeText: 'A revelation grants divine XP.', weight: 1, effects: { divineXP: 50, devotionDelta: 20 } },
      { id: 'co_ignore', label: 'Ignore', description: 'It is just a rock.', outcomeText: 'Life continues unchanged.', weight: 1, effects: {} },
    ],
  },
  {
    id: 'evt_eclipse',
    title: 'Total Solar Eclipse',
    description: 'The sun vanishes. Darkness reigns for minutes.',
    category: 'Cosmic',
    probabilityBase: 0.008,
    choices: [
      { id: 'ec_sacrifice', label: 'Sacrifice', description: 'Offer blood to restore the sun.', outcomeText: 'The sun returns. Devotion peaks.', weight: 1, effects: { populationDelta: -3, devotionDelta: 40 } },
      { id: 'ec_wait', label: 'Wait', description: 'Trust in cosmic mechanics.', outcomeText: 'The eclipse passes. Mortals are shaken.', weight: 1, effects: { happinessDelta: -5 } },
    ],
  },
  {
    id: 'evt_void_rift',
    title: 'Void Rift',
    description: 'A tear in reality opens, leaking strange energies.',
    category: 'Cosmic',
    probabilityBase: 0.005,
    isOneShot: true,
    choices: [
      { id: 'vr_seal', label: 'Seal the Rift', description: 'Channel divine power to close it.', outcomeText: 'The rift closes, but drains your reserves.', weight: 1, effects: { devotionDelta: -50, divineXP: 40 } },
      { id: 'vr_study', label: 'Study', description: 'Peer into the void for knowledge.', outcomeText: 'Terrifying truths are learned. XP surges.', weight: 1, effects: { divineXP: 80, happinessDelta: -10 } },
    ],
  },
  // ============================================================
  // Diplomacy
  // ============================================================
  {
    id: 'evt_envoy_arrival',
    title: 'Foreign Envoy Arrives',
    description: 'A cloaked emissary from a distant tribe seeks audience at your borders.',
    category: 'Political',
    probabilityBase: 0.025,
    choices: [
      { id: 'en_honor', label: 'Honor the Guest', description: 'Treat them with lavish hospitality.', outcomeText: 'A lasting trade pact is signed.', weight: 1, effects: { resourceDelta: 30, happinessDelta: 5 } },
      { id: 'en_spy', label: 'Interrogate', description: 'Strip-search the envoy for secrets.', outcomeText: 'You learn enemy positions, but diplomacy suffers.', weight: 1, effects: { devotionDelta: 10, happinessDelta: -8 } },
      { id: 'en_expel', label: 'Expel', description: 'Drive them back into the wilderness.', outcomeText: 'Neutrality is preserved, but an opportunity is lost.', weight: 1, effects: { happinessDelta: -2 } },
    ],
  },
  {
    id: 'evt_royal_marriage',
    title: 'Royal Marriage Proposal',
    description: 'A neighboring chieftain offers their heir in marriage to solidify peace.',
    category: 'Political',
    probabilityBase: 0.02,
    choices: [
      { id: 'rm_accept', label: 'Accept', description: 'Unite the bloodlines.', outcomeText: 'The alliance is ironclad, but autonomy fades.', weight: 1, effects: { happinessDelta: 10, resourceDelta: -20, devotionDelta: 15 } },
      { id: 'rm_decline', label: 'Decline', description: 'Preserve tribal independence.', outcomeText: 'Pride is intact, but tensions rise.', weight: 1, effects: { happinessDelta: -5, devotionDelta: -5 } },
    ],
  },
  {
    id: 'evt_border_dispute',
    title: 'Border Dispute',
    description: 'Two allied tribes clash over fertile hunting grounds near the frontier.',
    category: 'Political',
    probabilityBase: 0.03,
    probabilityConditions: (w) => (w.conflictsActive > 0 ? 0.08 : 0.03),
    choices: [
      { id: 'bd_arbitrate', label: 'Arbitrate', description: 'Host a summit to redraw borders.', outcomeText: 'Peace holds, but both sides feel cheated.', weight: 1, effects: { happinessDelta: -3, devotionDelta: 10 } },
      { id: 'bd_military', label: 'Military Solution', description: 'Annex the land by force.', outcomeText: 'Victory is swift, but resentment festers.', weight: 1, effects: { populationDelta: -5, resourceDelta: 40 } },
      { id: 'bd_gift', label: 'Gift the Land', description: 'Sacrifice the territory to preserve harmony.', outcomeText: 'Relations warm, but your people grumble.', weight: 1, effects: { happinessDelta: 5, resourceDelta: -25 } },
    ],
  },
  // ============================================================
  // Natural Disasters
  // ============================================================
  {
    id: 'evt_tsunami',
    title: 'Tsunami Warning',
    description: 'Seers report the ocean pulling back. A great wave is coming.',
    category: 'Natural',
    probabilityBase: 0.015,
    choices: [
      { id: 'ts_evac', label: 'Evacuate Coast', description: 'Move everyone to high ground.', outcomeText: 'Lives are saved, but coastal homes are abandoned.', weight: 1, effects: { populationDelta: -1, happinessDelta: -6 } },
      { id: 'ts_shelter', label: 'Shelter in Place', description: 'Fortify structures and pray.', outcomeText: 'The wave breaks weaker structures. Devotion rises.', weight: 1, effects: { resourceDelta: -40, devotionDelta: 20, happinessDelta: -4 } },
    ],
  },
  {
    id: 'evt_volcano',
    title: 'Volcanic Eruption',
    description: 'The sleeping mountain awakens, spewing ash and molten stone.',
    category: 'Natural',
    probabilityBase: 0.018,
    choices: [
      { id: 'vo_flee', label: 'Mass Exodus', description: 'Abandon the region entirely.', outcomeText: 'The tribe survives, but the land is lost.', weight: 1, effects: { populationDelta: -3, happinessDelta: -8, resourceDelta: -30 } },
      { id: 'vo_adapt', label: 'Adapt', description: 'Build ash-collectors and lava channels.', outcomeText: 'Hardship yields fertile soil and new minerals.', weight: 1, effects: { resourceDelta: 60, happinessDelta: -5 } },
    ],
  },
  {
    id: 'evt_locust_swarm',
    title: 'Locust Swarm',
    description: 'A dark cloud of insects descends, devouring every leaf and stalk.',
    category: 'Natural',
    probabilityBase: 0.022,
    choices: [
      { id: 'lc_burn', label: 'Controlled Burn', description: 'Create firebreaks to starve the swarm.', outcomeText: 'The swarm is stopped, but crops are scorched.', weight: 1, effects: { resourceDelta: -25, happinessDelta: -4 } },
      { id: 'lc_net', label: 'Giant Nets', description: 'Mobilize labor to trap the insects.', outcomeText: 'The swarm is captured and repurposed as food.', weight: 1, effects: { resourceDelta: 15, happinessDelta: -2 } },
    ],
  },
  // ============================================================
  // Divine Intervention
  // ============================================================
  {
    id: 'evt_angelic_host',
    title: 'Angelic Host',
    description: 'Winged figures descend from golden clouds, offering divine protection.',
    category: 'Religious',
    probabilityBase: 0.008,
    probabilityConditions: (w) => (w.devotion > 400 ? 0.04 : 0.008),
    isOneShot: true,
    choices: [
      { id: 'ah_accept', label: 'Accept Guardianship', description: 'Let the host fortify your lands.', outcomeText: 'Holy wards shield your people from harm.', weight: 1, effects: { devotionDelta: 50, happinessDelta: 15, resourceDelta: -10 } },
      { id: 'ah_reject', label: 'Reject', description: 'Mortal fate belongs to mortals.', outcomeText: 'The angels depart. Pride swells, but vulnerability remains.', weight: 1, effects: { devotionDelta: -20, happinessDelta: 5 } },
    ],
  },
  {
    id: 'evt_divine_judgement',
    title: 'Divine Judgement',
    description: 'A booming voice demands a sacrifice to prove continued faith.',
    category: 'Religious',
    probabilityBase: 0.015,
    choices: [
      { id: 'dj_sacrifice', label: 'Offer Sacrifice', description: 'Give up resources and population.', outcomeText: 'The heavens are appeased. Blessings rain down.', weight: 1, effects: { populationDelta: -5, resourceDelta: -50, devotionDelta: 60, happinessDelta: 10 } },
      { id: 'dj_defy', label: 'Defy', description: 'Refuse to bend the knee.', outcomeText: 'Lightning scars the earth. The people are shaken.', weight: 1, effects: { populationDelta: -8, happinessDelta: -15, devotionDelta: -15 } },
    ],
  },
  {
    id: 'evt_relic_discovery',
    title: 'Lost Relic Discovered',
    description: 'A farmer unearths a glowing artifact from the age of the elder gods.',
    category: 'Religious',
    probabilityBase: 0.02,
    isOneShot: true,
    choices: [
      { id: 'rl_study', label: 'Study Relic', description: 'Unlock its secrets in a sealed chamber.', outcomeText: 'Ancient wisdom floods your mind.', weight: 1, effects: { divineXP: 80, devotionDelta: 30 } },
      { id: 'rl_destroy', label: 'Destroy', description: 'Smash it to prevent heresy.', outcomeText: 'Faith is preserved in pure form, but knowledge is lost.', weight: 1, effects: { devotionDelta: 20, happinessDelta: -5 } },
    ],
  },
  // ============================================================
  // Internal Politics
  // ============================================================
  {
    id: 'evt_corruption_scandal',
    title: 'Corruption Scandal',
    description: 'High priests are caught embezzling temple funds for personal luxury.',
    category: 'Political',
    probabilityBase: 0.025,
    probabilityConditions: (w) => (w.devotion > 200 ? 0.06 : 0.025),
    choices: [
      { id: 'cs_purge', label: 'Purge the Corrupt', description: 'Publicly defrock and imprison the guilty.', outcomeText: 'Justice is served, but the clergy is weakened.', weight: 1, effects: { devotionDelta: -10, happinessDelta: 10 } },
      { id: 'cs_cover', label: 'Cover It Up', description: 'Silence the whistleblowers with gold.', outcomeText: 'Scandal vanishes, but rot spreads.', weight: 1, effects: { resourceDelta: -30, devotionDelta: 15, happinessDelta: -8 } },
    ],
  },
  {
    id: 'evt_labor_strike',
    title: 'Labor Strike',
    description: 'Builders and farmers lay down tools, demanding better conditions.',
    category: 'Political',
    probabilityBase: 0.02,
    probabilityConditions: (w) => (w.averageHappiness < 40 ? 0.08 : 0.02),
    choices: [
      { id: 'ls_concede', label: 'Concede Demands', description: 'Raise wages and shorten shifts.', outcomeText: 'Work resumes, but production costs soar.', weight: 1, effects: { resourceDelta: -40, happinessDelta: 15 } },
      { id: 'ls_break', label: 'Break the Strike', description: 'Deploy guards to force labor.', outcomeText: 'Productivity returns under the whip.', weight: 1, effects: { populationDelta: -3, happinessDelta: -12, devotionDelta: 10 } },
    ],
  },
  {
    id: 'evt_succession_crisis',
    title: 'Succession Crisis',
    description: 'The chieftain dies without a clear heir. Factions mobilize.',
    category: 'Political',
    probabilityBase: 0.015,
    choices: [
      { id: 'sc_elect', label: 'Elect a Leader', description: 'Let the people vote.', outcomeText: 'Democracy wins, but the process is chaotic.', weight: 1, effects: { happinessDelta: 10, devotionDelta: -5, resourceDelta: -20 } },
      { id: 'sc_strongman', label: 'Strongman Takeover', description: 'Back the most ruthless claimant.', outcomeText: 'Order is restored through fear.', weight: 1, effects: { happinessDelta: -10, devotionDelta: 15, populationDelta: -5 } },
    ],
  },
  // ============================================================
  // Discoveries
  // ============================================================
  {
    id: 'evt_cave_paintings',
    title: 'Ancient Cave Paintings',
    description: 'Scouts find caverns depicting forgotten gods and lost technologies.',
    category: 'Cosmic',
    probabilityBase: 0.02,
    isOneShot: true,
    choices: [
      { id: 'cp_translate', label: 'Translate', description: 'Scholars decipher the pictographs.', outcomeText: 'A forgotten technology is rediscovered.', weight: 1, effects: { divineXP: 40, resourceDelta: 20 } },
      { id: 'cp_seal', label: 'Seal the Caves', description: 'Bury the past to protect the present.', outcomeText: 'Mysteries remain, but society is stable.', weight: 1, effects: { devotionDelta: 15, happinessDelta: 3 } },
    ],
  },
  {
    id: 'evt_strange_metals',
    title: 'Strange Metals',
    description: 'Miners pull iridescent ore from the deep that hums with unknown energy.',
    category: 'Cosmic',
    probabilityBase: 0.018,
    isOneShot: true,
    choices: [
      { id: 'sm_smelt', label: 'Smelt It', description: 'Forge weapons and tools from the ore.', outcomeText: 'Advanced alloys revolutionize industry.', weight: 1, effects: { resourceDelta: 80, happinessDelta: 5 } },
      { id: 'sm_bury', label: 'Bury It', description: 'The metal feels wrong. Seal the mine.', outcomeText: 'Safety is assured, but wealth is forsaken.', weight: 1, effects: { happinessDelta: 8, devotionDelta: 10 } },
    ],
  },
  {
    id: 'evt_new_continent',
    title: 'New Continent Sighted',
    description: 'Sailors report uncharted land across the western sea, rich and empty.',
    category: 'Cosmic',
    probabilityBase: 0.012,
    isOneShot: true,
    choices: [
      { id: 'nc_colonize', label: 'Colonize', description: 'Send settlers to claim the land.', outcomeText: 'A new era of expansion begins.', weight: 1, effects: { populationDelta: -5, resourceDelta: 100, happinessDelta: 10 } },
      { id: 'nc_explore', label: 'Explore Cautiously', description: 'Map the coast before committing.', outcomeText: 'Valuable intelligence is gathered at low cost.', weight: 1, effects: { divineXP: 30, happinessDelta: 5 } },
    ],
  },
];

/**
 * Active random event engine.
 */
export class EventEngine {
  private firedOneShots = new Set<string>();
  private cooldown = 0;
  public cooldownDuration = 60; // seconds between random events
  private history: { event: RandomEvent; choiceId: string; timestamp: number }[] = [];

  /**
   * Update cooldown. Call each tick.
   */
  update(dt: number): void {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
  }

  /**
   * Attempt to trigger a random event based on world state.
   * Returns the triggered event and its resolved choice, or `null`.
   */
  maybeTrigger(world: WorldStateSnapshot): { event: RandomEvent; choice: EventChoice } | null {
    if (this.cooldown > 0) return null;

    const candidates = EVENT_DATABASE.filter((e) => {
      if (e.isOneShot && this.firedOneShots.has(e.id)) return false;
      return true;
    });

    if (candidates.length === 0) return null;

    // Compute weighted probabilities
    const weights = candidates.map((e) => {
      let p = e.probabilityBase;
      if (e.probabilityConditions) {
        p = e.probabilityConditions(world);
      }
      return p;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) return null;

    const roll = Math.random() * totalWeight;
    let accum = 0;
    let chosen: RandomEvent | null = null;
    for (let i = 0; i < candidates.length; i++) {
      accum += weights[i];
      if (roll <= accum) {
        chosen = candidates[i];
        break;
      }
    }
    if (!chosen) chosen = candidates[candidates.length - 1];

    // Pick a weighted choice
    const choice = this.pickChoice(chosen);

    // Apply one-shot tracking and cooldown
    if (chosen.isOneShot) this.firedOneShots.add(chosen.id);
    this.cooldown = this.cooldownDuration;

    this.history.push({ event: chosen, choiceId: choice.id, timestamp: Date.now() });
    return { event: chosen, choice };
  }

  /**
   * Manually trigger a specific event by id and player-selected choice index.
   * Useful for scripted narrative moments.
   */
  triggerEvent(eventId: string, choiceIndex: number): { event: RandomEvent; choice: EventChoice } | null {
    const evt = EVENT_DATABASE.find((e) => e.id === eventId);
    if (!evt) return null;
    const choice = evt.choices[choiceIndex];
    if (!choice) return null;
    if (evt.isOneShot) this.firedOneShots.add(evt.id);
    this.history.push({ event: evt, choiceId: choice.id, timestamp: Date.now() });
    return { event: evt, choice };
  }

  private pickChoice(event: RandomEvent): EventChoice {
    const totalWeight = event.choices.reduce((sum, c) => sum + c.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const choice of event.choices) {
      roll -= choice.weight;
      if (roll <= 0) return choice;
    }
    return event.choices[event.choices.length - 1];
  }

  getHistory(filter?: { category?: string }): { event: RandomEvent; choiceId: string; timestamp: number }[] {
    if (!filter) return [...this.history];
    return this.history.filter((h) => !filter.category || h.event.category === filter.category);
  }

  resetOneShots(): void {
    this.firedOneShots.clear();
  }

  getOneShotsFired(): string[] {
    return Array.from(this.firedOneShots);
  }

  setCooldown(seconds: number): void {
    this.cooldownDuration = seconds;
    this.cooldown = seconds;
  }
}
