import { PrestigeUpgrade, TierType } from '../types/game';

export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  // Village prestige currency → Income bonuses
  {
    id: 'prestige_growth_1',
    name: 'Crown of Growth I',
    description: '+15% income to all settlements',
    cost: 1,
    tier: TierType.Village,
    effect: { type: 'prestige_income_multiplier', value: 0.15 },
    purchased: false,
  },
  {
    id: 'prestige_growth_2',
    name: 'Crown of Growth II',
    description: '+25% income to all settlements',
    cost: 3,
    tier: TierType.Village,
    effect: { type: 'prestige_income_multiplier', value: 0.25 },
    purchased: false,
    prerequisite: 'prestige_growth_1',
  },
  {
    id: 'prestige_growth_3',
    name: 'Crown of Growth III',
    description: '+40% income to all settlements',
    cost: 7,
    tier: TierType.Village,
    effect: { type: 'prestige_income_multiplier', value: 0.4 },
    purchased: false,
    prerequisite: 'prestige_growth_2',
  },

  // Town prestige currency → Cost reduction
  {
    id: 'prestige_industry_1',
    name: 'Crown of Industry I',
    description: '-10% all building costs',
    cost: 1,
    tier: TierType.Town,
    effect: { type: 'prestige_cost_reduction', value: 0.9 },
    purchased: false,
  },
  {
    id: 'prestige_industry_2',
    name: 'Crown of Industry II',
    description: '-15% all building costs',
    cost: 3,
    tier: TierType.Town,
    effect: { type: 'prestige_cost_reduction', value: 0.85 },
    purchased: false,
    prerequisite: 'prestige_industry_1',
  },
  {
    id: 'prestige_industry_3',
    name: 'Crown of Industry III',
    description: '-25% all building costs',
    cost: 7,
    tier: TierType.Town,
    effect: { type: 'prestige_cost_reduction', value: 0.75 },
    purchased: false,
    prerequisite: 'prestige_industry_2',
  },

  // City prestige currency → Research bonus
  {
    id: 'prestige_knowledge_1',
    name: 'Crown of Knowledge I',
    description: '+5 research points per settlement completion',
    cost: 1,
    tier: TierType.City,
    effect: { type: 'prestige_research_bonus', value: 5 },
    purchased: false,
  },
  {
    id: 'prestige_knowledge_2',
    name: 'Crown of Knowledge II',
    description: '+10 research points per settlement completion',
    cost: 3,
    tier: TierType.City,
    effect: { type: 'prestige_research_bonus', value: 10 },
    purchased: false,
    prerequisite: 'prestige_knowledge_1',
  },
  {
    id: 'prestige_knowledge_3',
    name: 'Crown of Knowledge III',
    description: '+20 research points per settlement completion',
    cost: 7,
    tier: TierType.City,
    effect: { type: 'prestige_research_bonus', value: 20 },
    purchased: false,
    prerequisite: 'prestige_knowledge_2',
  },

  // County prestige currency → Goal reduction
  {
    id: 'prestige_ambition_1',
    name: 'Crown of Ambition I',
    description: '-10% goal targets',
    cost: 1,
    tier: TierType.County,
    effect: { type: 'prestige_goal_reduction', value: 0.1 },
    purchased: false,
  },
  {
    id: 'prestige_ambition_2',
    name: 'Crown of Ambition II',
    description: '-15% goal targets',
    cost: 3,
    tier: TierType.County,
    effect: { type: 'prestige_goal_reduction', value: 0.15 },
    purchased: false,
    prerequisite: 'prestige_ambition_1',
  },
  {
    id: 'prestige_ambition_3',
    name: 'Crown of Ambition III',
    description: '-20% goal targets',
    cost: 7,
    tier: TierType.County,
    effect: { type: 'prestige_goal_reduction', value: 0.2 },
    purchased: false,
    prerequisite: 'prestige_ambition_2',
  },

  // Duchy prestige currency → Starting currency multiplier
  {
    id: 'prestige_wealth_1',
    name: 'Crown of Wealth I',
    description: '2x starting currency for all settlements',
    cost: 1,
    tier: TierType.Duchy,
    effect: { type: 'prestige_starting_currency', value: 2 },
    purchased: false,
  },
  {
    id: 'prestige_wealth_2',
    name: 'Crown of Wealth II',
    description: '3x starting currency for all settlements',
    cost: 3,
    tier: TierType.Duchy,
    effect: { type: 'prestige_starting_currency', value: 3 },
    purchased: false,
    prerequisite: 'prestige_wealth_1',
  },
  {
    id: 'prestige_wealth_3',
    name: 'Crown of Wealth III',
    description: '5x starting currency for all settlements',
    cost: 7,
    tier: TierType.Duchy,
    effect: { type: 'prestige_starting_currency', value: 5 },
    purchased: false,
    prerequisite: 'prestige_wealth_2',
  },

  // Realm prestige currency → Auto-build speed
  {
    id: 'prestige_power_1',
    name: 'Crown of Power I',
    description: '+15% auto-build speed',
    cost: 1,
    tier: TierType.Realm,
    effect: { type: 'prestige_autobuild_speed', value: 0.15 },
    purchased: false,
  },
  {
    id: 'prestige_power_2',
    name: 'Crown of Power II',
    description: '+25% auto-build speed',
    cost: 3,
    tier: TierType.Realm,
    effect: { type: 'prestige_autobuild_speed', value: 0.25 },
    purchased: false,
    prerequisite: 'prestige_power_1',
  },

  // Kingdom prestige currency → Massive income multiplier
  {
    id: 'prestige_destiny_1',
    name: 'Crown of Destiny I',
    description: '+100% income to all settlements',
    cost: 1,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_income_multiplier', value: 1.0 },
    purchased: false,
  },
  {
    id: 'prestige_destiny_2',
    name: 'Crown of Destiny II',
    description: '+200% income to all settlements',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_income_multiplier', value: 2.0 },
    purchased: false,
    prerequisite: 'prestige_destiny_1',
  },

  // ===== NEW: Building-specific income boosts =====

  // Village currency → Boost Hamlet Hut
  {
    id: 'prestige_hearth_1',
    name: 'Blessing of the Hearth',
    description: '+100% Hut income',
    cost: 2,
    tier: TierType.Village,
    effect: { type: 'prestige_building_income_boost', value: 1.0, targetBuilding: 'hamlet_hut' },
    purchased: false,
  },

  // Town currency → Boost Town Forge
  {
    id: 'prestige_forgemaster_1',
    name: "Forgemaster's Legacy",
    description: '+100% Forge income',
    cost: 2,
    tier: TierType.Town,
    effect: { type: 'prestige_building_income_boost', value: 1.0, targetBuilding: 'town_forge' },
    purchased: false,
  },

  // City currency → Boost City University
  {
    id: 'prestige_academic_1',
    name: 'Academic Excellence',
    description: '+100% University income',
    cost: 2,
    tier: TierType.City,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'city_university',
    },
    purchased: false,
  },
  // City currency → Boost City Grand Bazaar
  {
    id: 'prestige_bazaar_1',
    name: 'Bazaar Mastery',
    description: '+150% Grand Bazaar income',
    cost: 4,
    tier: TierType.City,
    effect: { type: 'prestige_building_income_boost', value: 1.5, targetBuilding: 'city_bazaar' },
    purchased: false,
  },
  // City currency → Cross-tier boost to Village Cottage
  {
    id: 'prestige_cottage_1',
    name: 'Urban Blueprint',
    description: '+75% Cottage income',
    cost: 5,
    tier: TierType.City,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.75,
      targetBuilding: 'village_cottage',
    },
    purchased: false,
  },

  // County currency → Boost County Manor
  {
    id: 'prestige_manor_1',
    name: 'Estate Management',
    description: '+100% Manor income',
    cost: 2,
    tier: TierType.County,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'county_manor',
    },
    purchased: false,
  },

  // Duchy currency → Boost Duchy Grand Port
  {
    id: 'prestige_port_1',
    name: 'Maritime Dominance',
    description: '+100% Grand Port income',
    cost: 2,
    tier: TierType.Duchy,
    effect: { type: 'prestige_building_income_boost', value: 1.0, targetBuilding: 'duchy_port' },
    purchased: false,
  },
  // Duchy currency → Cross-tier boost to Village Chapel
  {
    id: 'prestige_chapel_1',
    name: 'Ducal Patronage',
    description: '+150% Chapel income',
    cost: 3,
    tier: TierType.Duchy,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.5,
      targetBuilding: 'village_chapel',
    },
    purchased: false,
  },

  // Realm currency → Boost Realm Grand Exchange
  {
    id: 'prestige_exchange_1',
    name: 'Exchange Mastery',
    description: '+100% Grand Exchange income',
    cost: 2,
    tier: TierType.Realm,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'realm_exchange',
    },
    purchased: false,
  },
  // Realm currency → Cross-tier boost to Hamlet Workshop
  {
    id: 'prestige_workshop_1',
    name: "Realm's Blessing",
    description: '+200% Workshop income',
    cost: 5,
    tier: TierType.Realm,
    effect: {
      type: 'prestige_building_income_boost',
      value: 2.0,
      targetBuilding: 'hamlet_workshop',
    },
    purchased: false,
  },

  // Kingdom currency → Cross-tier boost to Town Market
  {
    id: 'prestige_market_1',
    name: 'Royal Commerce',
    description: '+200% Market income',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_building_income_boost', value: 2.0, targetBuilding: 'town_market' },
    purchased: false,
  },

  // ===== NEW: Survival speed boosts =====

  // Village currency → Survival speed I
  {
    id: 'prestige_pastoral_1',
    name: 'Pastoral Wisdom I',
    description: 'Survival goals progress 20% faster',
    cost: 2,
    tier: TierType.Village,
    effect: { type: 'prestige_survival_speed', value: 0.2 },
    purchased: false,
  },
  {
    id: 'prestige_pastoral_2',
    name: 'Pastoral Wisdom II',
    description: 'Survival goals progress 25% faster',
    cost: 5,
    tier: TierType.Village,
    effect: { type: 'prestige_survival_speed', value: 0.25 },
    purchased: false,
    prerequisite: 'prestige_pastoral_1',
  },

  // County currency → Survival speed
  {
    id: 'prestige_swift_1',
    name: 'Swift Conquest',
    description: 'Survival goals progress 30% faster',
    cost: 2,
    tier: TierType.County,
    effect: { type: 'prestige_survival_speed', value: 0.3 },
    purchased: false,
  },

  // Realm currency → Survival speed
  {
    id: 'prestige_oracle_speed_1',
    name: "Oracle's Swiftness",
    description: 'Survival goals progress 35% faster',
    cost: 3,
    tier: TierType.Realm,
    effect: { type: 'prestige_survival_speed', value: 0.35 },
    purchased: false,
  },

  // Kingdom currency → Survival speed
  {
    id: 'prestige_eternal_speed_1',
    name: 'Eternal Swiftness',
    description: 'Survival goals progress 50% faster',
    cost: 1,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_survival_speed', value: 0.5 },
    purchased: false,
  },

  // ===== NEW: Flat cost for first N buildings =====

  // Town currency → First 3 buildings don't scale
  {
    id: 'prestige_foundation_1',
    name: 'Foundation Stone I',
    description: 'First 3 of each building have flat cost (no scaling)',
    cost: 2,
    tier: TierType.Town,
    effect: { type: 'prestige_flat_cost_count', value: 3 },
    purchased: false,
  },
  {
    id: 'prestige_foundation_2',
    name: 'Foundation Stone II',
    description: '+2 more flat cost buildings (no scaling)',
    cost: 5,
    tier: TierType.Town,
    effect: { type: 'prestige_flat_cost_count', value: 2 },
    purchased: false,
    prerequisite: 'prestige_foundation_1',
  },

  // County currency → More flat cost buildings
  {
    id: 'prestige_feudal_foundation_1',
    name: 'Feudal Foundation',
    description: '+3 more flat cost buildings (no scaling)',
    cost: 4,
    tier: TierType.County,
    effect: { type: 'prestige_flat_cost_count', value: 3 },
    purchased: false,
  },

  // Kingdom currency → Even more flat cost buildings
  {
    id: 'prestige_royal_foundation_1',
    name: 'Royal Foundation',
    description: '+5 more flat cost buildings (no scaling)',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_flat_cost_count', value: 5 },
    purchased: false,
  },

  // ===== NEW: Cost scaling reduction =====

  // Town currency → Reduce cost multiplier
  {
    id: 'prestige_scaling_town_1',
    name: 'Efficient Construction',
    description: 'Reduce all building cost scaling by 0.02',
    cost: 5,
    tier: TierType.Town,
    effect: { type: 'prestige_cost_scaling_reduction', value: 0.02 },
    purchased: false,
  },

  // City currency → Reduce cost multiplier
  {
    id: 'prestige_scaling_city_1',
    name: 'Architectural Mastery',
    description: 'Reduce all building cost scaling by 0.02',
    cost: 5,
    tier: TierType.City,
    effect: { type: 'prestige_cost_scaling_reduction', value: 0.02 },
    purchased: false,
  },

  // Duchy currency → Reduce cost multiplier
  {
    id: 'prestige_scaling_duchy_1',
    name: 'Economic Reform',
    description: 'Reduce all building cost scaling by 0.03',
    cost: 5,
    tier: TierType.Duchy,
    effect: { type: 'prestige_cost_scaling_reduction', value: 0.03 },
    purchased: false,
  },

  // Kingdom currency → Large cost scaling reduction
  {
    id: 'prestige_imperial_scaling_1',
    name: 'Imperial Efficiency',
    description: 'Reduce all building cost scaling by 0.04',
    cost: 3,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_cost_scaling_reduction', value: 0.04 },
    purchased: false,
  },

  // ===== NEW: Patronage boosts =====

  // Village currency → Patronage from higher tiers is stronger
  {
    id: 'prestige_patron_1',
    name: 'Patron of the Arts',
    description: '+50% patronage income from higher tiers',
    cost: 3,
    tier: TierType.Village,
    effect: { type: 'prestige_patronage_boost', value: 0.5 },
    purchased: false,
  },
  // County currency → Even more patronage
  {
    id: 'prestige_feudal_ties_1',
    name: 'Feudal Ties',
    description: '+75% patronage income from higher tiers',
    cost: 3,
    tier: TierType.County,
    effect: { type: 'prestige_patronage_boost', value: 0.75 },
    purchased: false,
  },
  // Kingdom currency → Massive patronage
  {
    id: 'prestige_royal_patronage_1',
    name: 'Royal Patronage',
    description: '+100% patronage income from higher tiers',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_patronage_boost', value: 1.0 },
    purchased: false,
  },

  // ===== NEW: Research discounts =====

  // Town currency → Cheaper research
  {
    id: 'prestige_stipend_1',
    name: "Scholar's Stipend",
    description: '-15% research costs',
    cost: 3,
    tier: TierType.Town,
    effect: { type: 'prestige_research_discount', value: 0.85 },
    purchased: false,
  },
  // Realm currency → Even cheaper research
  {
    id: 'prestige_endowment_1',
    name: "Scholar's Endowment",
    description: '-25% research costs',
    cost: 4,
    tier: TierType.Realm,
    effect: { type: 'prestige_research_discount', value: 0.75 },
    purchased: false,
  },

  // ===== NEW: Free starting buildings =====

  // Duchy currency → Start with buildings pre-built
  {
    id: 'prestige_settlers_cache_1',
    name: "Settler's Cache I",
    description: 'New settlements start with 3 of the cheapest building',
    cost: 3,
    tier: TierType.Duchy,
    effect: { type: 'prestige_free_buildings', value: 3 },
    purchased: false,
  },
  {
    id: 'prestige_settlers_cache_2',
    name: "Settler's Cache II",
    description: '+4 more free starting buildings',
    cost: 6,
    tier: TierType.Duchy,
    effect: { type: 'prestige_free_buildings', value: 4 },
    purchased: false,
    prerequisite: 'prestige_settlers_cache_1',
  },
  // Kingdom currency → Big head start
  {
    id: 'prestige_royal_settlers_1',
    name: 'Royal Settlers',
    description: '+5 more free starting buildings',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_free_buildings', value: 5 },
    purchased: false,
  },

  // ===== NEW: Prestige currency boost =====

  // City currency → Earn more crowns on prestige
  {
    id: 'prestige_crowning_1',
    name: 'Crowning Glory',
    description: '+50% prestige currency earned on reset',
    cost: 3,
    tier: TierType.City,
    effect: { type: 'prestige_currency_boost', value: 0.5 },
    purchased: false,
  },
  // Realm currency → Even more crowns
  {
    id: 'prestige_realm_prestige_1',
    name: 'Legacy of the Realm',
    description: '+75% prestige currency earned on reset',
    cost: 4,
    tier: TierType.Realm,
    effect: { type: 'prestige_currency_boost', value: 0.75 },
    purchased: false,
  },

  // ===== NEW: Mastery boost =====

  // County currency → Mastery grows faster
  {
    id: 'prestige_master_builder_1',
    name: 'Master Builder',
    description: 'Mastery income bonus grows 50% faster per completion',
    cost: 4,
    tier: TierType.County,
    effect: { type: 'prestige_mastery_boost', value: 0.5 },
    purchased: false,
  },
  // Kingdom currency → Mastery grows much faster
  {
    id: 'prestige_eternal_mastery_1',
    name: 'Eternal Mastery',
    description: 'Mastery income bonus grows 100% faster per completion',
    cost: 3,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_mastery_boost', value: 1.0 },
    purchased: false,
  },

  // ===== NEW: Production boost amplifier =====

  // County currency → Production boost buildings are stronger
  {
    id: 'prestige_synergy_1',
    name: 'Feudal Synergy',
    description: 'Production boost buildings are 40% more effective',
    cost: 5,
    tier: TierType.County,
    effect: { type: 'prestige_production_boost_amplifier', value: 0.4 },
    purchased: false,
  },
  // Duchy currency → Even stronger production boosts
  {
    id: 'prestige_trade_networks_1',
    name: 'Trade Networks',
    description: 'Production boost buildings are 60% more effective',
    cost: 4,
    tier: TierType.Duchy,
    effect: { type: 'prestige_production_boost_amplifier', value: 0.6 },
    purchased: false,
  },

  // ===== NEW: More building-specific income boosts (covering untouched buildings) =====

  // Village currency → Boost Hamlet Garden
  {
    id: 'prestige_harvest_1',
    name: 'Harvest Moon',
    description: '+150% Garden income',
    cost: 3,
    tier: TierType.Village,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.5,
      targetBuilding: 'hamlet_garden',
    },
    purchased: false,
  },

  // Town currency → Boost Town Guild Hall
  {
    id: 'prestige_guild_1',
    name: 'Guild Dominion',
    description: '+100% Guild Hall income',
    cost: 4,
    tier: TierType.Town,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'town_guild',
    },
    purchased: false,
  },

  // City currency → Boost City Cathedral
  {
    id: 'prestige_cathedral_1',
    name: "Cathedral's Blessing",
    description: '+100% Cathedral income',
    cost: 3,
    tier: TierType.City,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'city_cathedral',
    },
    purchased: false,
  },

  // County currency → Boost County Plantation
  {
    id: 'prestige_plantation_1',
    name: 'Plantation Bounty',
    description: '+100% Plantation income',
    cost: 3,
    tier: TierType.County,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'county_plantation',
    },
    purchased: false,
  },

  // Duchy currency → Boost Duchy Royal Academy
  {
    id: 'prestige_academy_1',
    name: 'Royal Academy Award',
    description: '+100% Royal Academy income',
    cost: 4,
    tier: TierType.Duchy,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'duchy_academy',
    },
    purchased: false,
  },
  // Duchy currency → Cross-tier boost Hamlet Shrine
  {
    id: 'prestige_sacred_1',
    name: 'Sacred Legacy',
    description: '+200% Shrine income',
    cost: 3,
    tier: TierType.Duchy,
    effect: {
      type: 'prestige_building_income_boost',
      value: 2.0,
      targetBuilding: 'hamlet_shrine',
    },
    purchased: false,
  },

  // Realm currency → Boost Realm Wonder
  {
    id: 'prestige_wonder_1',
    name: 'Wonder of the World',
    description: '+150% Wonder income',
    cost: 5,
    tier: TierType.Realm,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.5,
      targetBuilding: 'realm_wonder',
    },
    purchased: false,
  },
  // Realm currency → Cross-tier boost Village Farm
  {
    id: 'prestige_agri_1',
    name: 'Agricultural Revolution',
    description: '+200% Farm income',
    cost: 4,
    tier: TierType.Realm,
    effect: {
      type: 'prestige_building_income_boost',
      value: 2.0,
      targetBuilding: 'village_farm',
    },
    purchased: false,
  },

  // Kingdom currency → Boost Kingdom Capital
  {
    id: 'prestige_capital_1',
    name: 'Capital Glory',
    description: '+100% Capital income',
    cost: 1,
    tier: TierType.Kingdom,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'kingdom_capital',
    },
    purchased: false,
  },
  // Kingdom currency → Boost Kingdom Eternal Monument
  {
    id: 'prestige_monument_1',
    name: 'Monumental Legacy',
    description: '+200% Eternal Monument income',
    cost: 3,
    tier: TierType.Kingdom,
    effect: {
      type: 'prestige_building_income_boost',
      value: 2.0,
      targetBuilding: 'kingdom_monument',
    },
    purchased: false,
  },
];

/**
 * Calculate prestige currency earned for a tier based on completions.
 * Formula: floor(sqrt(completions))
 */
export function calculatePrestigeCurrency(completions: number): number {
  if (completions <= 0) return 0;
  return Math.floor(Math.sqrt(completions));
}
