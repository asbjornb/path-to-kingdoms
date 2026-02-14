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
    cost: 2,
    tier: TierType.Village,
    effect: { type: 'prestige_income_multiplier', value: 0.25 },
    purchased: false,
    prerequisite: 'prestige_growth_1',
  },
  {
    id: 'prestige_growth_3',
    name: 'Crown of Growth III',
    description: '+40% income to all settlements',
    cost: 4,
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
    cost: 2,
    tier: TierType.Town,
    effect: { type: 'prestige_cost_reduction', value: 0.85 },
    purchased: false,
    prerequisite: 'prestige_industry_1',
  },
  {
    id: 'prestige_industry_3',
    name: 'Crown of Industry III',
    description: '-25% all building costs',
    cost: 4,
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
    cost: 2,
    tier: TierType.City,
    effect: { type: 'prestige_research_bonus', value: 10 },
    purchased: false,
    prerequisite: 'prestige_knowledge_1',
  },
  {
    id: 'prestige_knowledge_3',
    name: 'Crown of Knowledge III',
    description: '+20 research points per settlement completion',
    cost: 4,
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
    cost: 2,
    tier: TierType.County,
    effect: { type: 'prestige_goal_reduction', value: 0.15 },
    purchased: false,
    prerequisite: 'prestige_ambition_1',
  },
  {
    id: 'prestige_ambition_3',
    name: 'Crown of Ambition III',
    description: '-20% goal targets',
    cost: 4,
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
    cost: 2,
    tier: TierType.Duchy,
    effect: { type: 'prestige_starting_currency', value: 3 },
    purchased: false,
    prerequisite: 'prestige_wealth_1',
  },
  {
    id: 'prestige_wealth_3',
    name: 'Crown of Wealth III',
    description: '5x starting currency for all settlements',
    cost: 4,
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
    cost: 2,
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

  // ===== Building-specific income boosts =====

  // Village currency → Boost Hamlet Hut
  {
    id: 'prestige_hearth_1',
    name: 'Blessing of the Hearth',
    description: '+50% Hut income',
    cost: 1,
    tier: TierType.Village,
    effect: { type: 'prestige_building_income_boost', value: 0.5, targetBuilding: 'hamlet_hut' },
    purchased: false,
  },

  // Town currency → Boost Town Forge
  {
    id: 'prestige_forgemaster_1',
    name: "Forgemaster's Legacy",
    description: '+50% Forge income',
    cost: 1,
    tier: TierType.Town,
    effect: { type: 'prestige_building_income_boost', value: 0.5, targetBuilding: 'town_forge' },
    purchased: false,
  },

  // City currency → Boost City University
  {
    id: 'prestige_academic_1',
    name: 'Academic Excellence',
    description: '+50% University income',
    cost: 1,
    tier: TierType.City,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.5,
      targetBuilding: 'city_university',
    },
    purchased: false,
  },
  // City currency → Boost City Grand Bazaar
  {
    id: 'prestige_bazaar_1',
    name: 'Bazaar Mastery',
    description: '+75% Grand Bazaar income',
    cost: 2,
    tier: TierType.City,
    effect: { type: 'prestige_building_income_boost', value: 0.75, targetBuilding: 'city_bazaar' },
    purchased: false,
  },
  // City currency → Cross-tier boost to Village Cottage
  {
    id: 'prestige_cottage_1',
    name: 'Urban Blueprint',
    description: '+40% Cottage income',
    cost: 3,
    tier: TierType.City,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.4,
      targetBuilding: 'village_cottage',
    },
    purchased: false,
    prerequisite: 'prestige_academic_1',
  },

  // County currency → Boost County Manor
  {
    id: 'prestige_manor_1',
    name: 'Estate Management',
    description: '+50% Manor income',
    cost: 1,
    tier: TierType.County,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.5,
      targetBuilding: 'county_manor',
    },
    purchased: false,
  },

  // Duchy currency → Boost Duchy Grand Port
  {
    id: 'prestige_port_1',
    name: 'Maritime Dominance',
    description: '+50% Grand Port income',
    cost: 1,
    tier: TierType.Duchy,
    effect: { type: 'prestige_building_income_boost', value: 0.5, targetBuilding: 'duchy_port' },
    purchased: false,
  },
  // Duchy currency → Cross-tier boost to Village Chapel
  {
    id: 'prestige_chapel_1',
    name: 'Ducal Patronage',
    description: '+75% Chapel income',
    cost: 2,
    tier: TierType.Duchy,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.75,
      targetBuilding: 'village_chapel',
    },
    purchased: false,
  },

  // Realm currency → Boost Realm Grand Exchange
  {
    id: 'prestige_exchange_1',
    name: 'Exchange Mastery',
    description: '+50% Grand Exchange income',
    cost: 1,
    tier: TierType.Realm,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.5,
      targetBuilding: 'realm_exchange',
    },
    purchased: false,
  },
  // Realm currency → Cross-tier boost to Hamlet Workshop
  {
    id: 'prestige_workshop_1',
    name: "Realm's Blessing",
    description: '+100% Workshop income',
    cost: 3,
    tier: TierType.Realm,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'hamlet_workshop',
    },
    purchased: false,
    prerequisite: 'prestige_exchange_1',
  },

  // Kingdom currency → Cross-tier boost to Town Market
  {
    id: 'prestige_market_1',
    name: 'Royal Commerce',
    description: '+100% Market income',
    cost: 1,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_building_income_boost', value: 1.0, targetBuilding: 'town_market' },
    purchased: false,
  },

  // ===== Survival speed boosts =====

  // Village currency → Survival speed I
  {
    id: 'prestige_pastoral_1',
    name: 'Pastoral Wisdom I',
    description: 'Survival goals progress 10% faster',
    cost: 1,
    tier: TierType.Village,
    effect: { type: 'prestige_survival_speed', value: 0.1 },
    purchased: false,
  },
  {
    id: 'prestige_pastoral_2',
    name: 'Pastoral Wisdom II',
    description: 'Survival goals progress 15% faster',
    cost: 3,
    tier: TierType.Village,
    effect: { type: 'prestige_survival_speed', value: 0.15 },
    purchased: false,
    prerequisite: 'prestige_pastoral_1',
  },

  // County currency → Survival speed
  {
    id: 'prestige_swift_1',
    name: 'Swift Conquest',
    description: 'Survival goals progress 15% faster',
    cost: 1,
    tier: TierType.County,
    effect: { type: 'prestige_survival_speed', value: 0.15 },
    purchased: false,
  },

  // Realm currency → Survival speed
  {
    id: 'prestige_oracle_speed_1',
    name: "Oracle's Swiftness",
    description: 'Survival goals progress 20% faster',
    cost: 2,
    tier: TierType.Realm,
    effect: { type: 'prestige_survival_speed', value: 0.2 },
    purchased: false,
  },

  // Kingdom currency → Survival speed
  {
    id: 'prestige_eternal_speed_1',
    name: 'Eternal Swiftness',
    description: 'Survival goals progress 25% faster',
    cost: 1,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_survival_speed', value: 0.25 },
    purchased: false,
  },

  // ===== Flat cost buildings (no scaling) =====

  // Town currency → Some buildings don't count toward scaling
  {
    id: 'prestige_foundation_1',
    name: 'Foundation Stone I',
    description: '2 of each building have flat cost (no scaling)',
    cost: 1,
    tier: TierType.Town,
    effect: { type: 'prestige_flat_cost_count', value: 2 },
    purchased: false,
  },
  {
    id: 'prestige_foundation_2',
    name: 'Foundation Stone II',
    description: '+1 more flat cost building (no scaling)',
    cost: 3,
    tier: TierType.Town,
    effect: { type: 'prestige_flat_cost_count', value: 1 },
    purchased: false,
    prerequisite: 'prestige_foundation_1',
  },

  // County currency → More flat cost buildings
  {
    id: 'prestige_feudal_foundation_1',
    name: 'Feudal Foundation',
    description: '+2 more flat cost buildings (no scaling)',
    cost: 2,
    tier: TierType.County,
    effect: { type: 'prestige_flat_cost_count', value: 2 },
    purchased: false,
  },

  // Kingdom currency → Even more flat cost buildings
  {
    id: 'prestige_royal_foundation_1',
    name: 'Royal Foundation',
    description: '+3 more flat cost buildings (no scaling)',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_flat_cost_count', value: 3 },
    purchased: false,
  },

  // ===== Cost scaling reduction =====

  // Town currency → Reduce cost multiplier
  {
    id: 'prestige_scaling_town_1',
    name: 'Efficient Construction',
    description: 'Reduce all building cost scaling by 0.01',
    cost: 3,
    tier: TierType.Town,
    effect: { type: 'prestige_cost_scaling_reduction', value: 0.01 },
    purchased: false,
    prerequisite: 'prestige_foundation_1',
  },

  // City currency → Reduce cost multiplier
  {
    id: 'prestige_scaling_city_1',
    name: 'Architectural Mastery',
    description: 'Reduce all building cost scaling by 0.01',
    cost: 3,
    tier: TierType.City,
    effect: { type: 'prestige_cost_scaling_reduction', value: 0.01 },
    purchased: false,
    prerequisite: 'prestige_crowning_1',
  },

  // Duchy currency → Reduce cost multiplier
  {
    id: 'prestige_scaling_duchy_1',
    name: 'Economic Reform',
    description: 'Reduce all building cost scaling by 0.02',
    cost: 3,
    tier: TierType.Duchy,
    effect: { type: 'prestige_cost_scaling_reduction', value: 0.02 },
    purchased: false,
    prerequisite: 'prestige_trade_routes_1',
  },

  // Kingdom currency → Large cost scaling reduction
  {
    id: 'prestige_imperial_scaling_1',
    name: 'Imperial Efficiency',
    description: 'Reduce all building cost scaling by 0.02',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_cost_scaling_reduction', value: 0.02 },
    purchased: false,
  },

  // ===== Patronage boosts =====

  // Village currency → Patronage from higher tiers is stronger
  {
    id: 'prestige_patron_1',
    name: 'Patron of the Arts',
    description: '+25% patronage income from higher tiers',
    cost: 2,
    tier: TierType.Village,
    effect: { type: 'prestige_patronage_boost', value: 0.25 },
    purchased: false,
  },
  // County currency → Even more patronage
  {
    id: 'prestige_feudal_ties_1',
    name: 'Feudal Ties',
    description: '+40% patronage income from higher tiers',
    cost: 2,
    tier: TierType.County,
    effect: { type: 'prestige_patronage_boost', value: 0.4 },
    purchased: false,
  },
  // Kingdom currency → Massive patronage
  {
    id: 'prestige_royal_patronage_1',
    name: 'Royal Patronage',
    description: '+50% patronage income from higher tiers',
    cost: 1,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_patronage_boost', value: 0.5 },
    purchased: false,
  },

  // ===== Research discounts =====

  // Town currency → Cheaper research
  {
    id: 'prestige_stipend_1',
    name: "Scholar's Stipend",
    description: '-10% research costs',
    cost: 2,
    tier: TierType.Town,
    effect: { type: 'prestige_research_discount', value: 0.9 },
    purchased: false,
  },
  // Realm currency → Even cheaper research
  {
    id: 'prestige_endowment_1',
    name: "Scholar's Endowment",
    description: '-15% research costs',
    cost: 3,
    tier: TierType.Realm,
    effect: { type: 'prestige_research_discount', value: 0.85 },
    purchased: false,
  },

  // ===== Free starting buildings =====

  // Duchy currency → Start with buildings pre-built
  {
    id: 'prestige_settlers_cache_1',
    name: "Settler's Cache I",
    description: 'New settlements start with 2 of the cheapest building',
    cost: 2,
    tier: TierType.Duchy,
    effect: { type: 'prestige_free_buildings', value: 2 },
    purchased: false,
  },
  {
    id: 'prestige_settlers_cache_2',
    name: "Settler's Cache II",
    description: '+2 more free starting buildings',
    cost: 4,
    tier: TierType.Duchy,
    effect: { type: 'prestige_free_buildings', value: 2 },
    purchased: false,
    prerequisite: 'prestige_settlers_cache_1',
  },
  // Kingdom currency → Big head start
  {
    id: 'prestige_royal_settlers_1',
    name: 'Royal Settlers',
    description: '+3 more free starting buildings',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_free_buildings', value: 3 },
    purchased: false,
  },

  // ===== Prestige currency boost =====

  // City currency → Earn more crowns on prestige
  {
    id: 'prestige_crowning_1',
    name: 'Crowning Glory',
    description: '+25% prestige currency earned on reset',
    cost: 2,
    tier: TierType.City,
    effect: { type: 'prestige_currency_boost', value: 0.25 },
    purchased: false,
  },
  // Realm currency → Even more crowns
  {
    id: 'prestige_realm_prestige_1',
    name: 'Legacy of the Realm',
    description: '+40% prestige currency earned on reset',
    cost: 3,
    tier: TierType.Realm,
    effect: { type: 'prestige_currency_boost', value: 0.4 },
    purchased: false,
  },

  // ===== Production boost amplifier =====

  // County currency → Production boost buildings are stronger
  {
    id: 'prestige_synergy_1',
    name: 'Feudal Synergy',
    description: 'Production boost buildings are 20% more effective',
    cost: 3,
    tier: TierType.County,
    effect: { type: 'prestige_production_boost_amplifier', value: 0.2 },
    purchased: false,
    prerequisite: 'prestige_crown_tax_1',
  },
  // Duchy currency → Even stronger production boosts
  {
    id: 'prestige_trade_networks_1',
    name: 'Trade Networks',
    description: 'Production boost buildings are 30% more effective',
    cost: 3,
    tier: TierType.Duchy,
    effect: { type: 'prestige_production_boost_amplifier', value: 0.3 },
    purchased: false,
  },

  // ===== More building-specific income boosts =====

  // Village currency → Boost Hamlet Garden
  {
    id: 'prestige_harvest_1',
    name: 'Harvest Moon',
    description: '+75% Garden income',
    cost: 2,
    tier: TierType.Village,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.75,
      targetBuilding: 'hamlet_garden',
    },
    purchased: false,
  },

  // Town currency → Boost Town Guild Hall
  {
    id: 'prestige_guild_1',
    name: 'Guild Dominion',
    description: '+50% Guild Hall income',
    cost: 2,
    tier: TierType.Town,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.5,
      targetBuilding: 'town_guild',
    },
    purchased: false,
  },

  // City currency → Boost City Cathedral
  {
    id: 'prestige_cathedral_1',
    name: "Cathedral's Blessing",
    description: '+50% Cathedral income',
    cost: 2,
    tier: TierType.City,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.5,
      targetBuilding: 'city_cathedral',
    },
    purchased: false,
  },

  // County currency → Boost County Plantation
  {
    id: 'prestige_plantation_1',
    name: 'Plantation Bounty',
    description: '+50% Plantation income',
    cost: 2,
    tier: TierType.County,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.5,
      targetBuilding: 'county_plantation',
    },
    purchased: false,
  },

  // Duchy currency → Boost Duchy Royal Academy
  {
    id: 'prestige_academy_1',
    name: 'Royal Academy Award',
    description: '+50% Royal Academy income',
    cost: 2,
    tier: TierType.Duchy,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.5,
      targetBuilding: 'duchy_academy',
    },
    purchased: false,
  },
  // Duchy currency → Cross-tier boost Hamlet Shrine
  {
    id: 'prestige_sacred_1',
    name: 'Sacred Legacy',
    description: '+100% Shrine income',
    cost: 2,
    tier: TierType.Duchy,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'hamlet_shrine',
    },
    purchased: false,
  },

  // Realm currency → Boost Realm Wonder
  {
    id: 'prestige_wonder_1',
    name: 'Wonder of the World',
    description: '+75% Wonder income',
    cost: 3,
    tier: TierType.Realm,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.75,
      targetBuilding: 'realm_wonder',
    },
    purchased: false,
    prerequisite: 'prestige_realm_scouts_1',
  },
  // Realm currency → Cross-tier boost Village Farm
  {
    id: 'prestige_agri_1',
    name: 'Agricultural Revolution',
    description: '+100% Farm income',
    cost: 3,
    tier: TierType.Realm,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'village_farm',
    },
    purchased: false,
    prerequisite: 'prestige_realm_scouts_1',
  },

  // Kingdom currency → Boost Kingdom Capital
  {
    id: 'prestige_capital_1',
    name: 'Capital Glory',
    description: '+50% Capital income',
    cost: 1,
    tier: TierType.Kingdom,
    effect: {
      type: 'prestige_building_income_boost',
      value: 0.5,
      targetBuilding: 'kingdom_capital',
    },
    purchased: false,
  },
  // Kingdom currency → Boost Kingdom Eternal Monument
  {
    id: 'prestige_monument_1',
    name: 'Monumental Legacy',
    description: '+100% Eternal Monument income',
    cost: 2,
    tier: TierType.Kingdom,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'kingdom_monument',
    },
    purchased: false,
    prerequisite: 'prestige_destiny_1',
  },

  // ===== Grant specific buildings on settlement spawn =====

  // Village currency → Hamlets start with Shrines (income multiplier head start)
  {
    id: 'prestige_shrine_keepers_1',
    name: 'Shrine Keepers',
    description: 'New Hamlets start with 2 Shrines',
    cost: 2,
    tier: TierType.Village,
    effect: { type: 'prestige_grant_building', value: 2, targetBuilding: 'hamlet_shrine' },
    purchased: false,
  },

  // Town currency → Hamlets start with Market Stalls (cost reduction head start)
  {
    id: 'prestige_market_founders_1',
    name: 'Market Founders',
    description: 'New Hamlets start with 2 Market Stalls',
    cost: 2,
    tier: TierType.Town,
    effect: { type: 'prestige_grant_building', value: 2, targetBuilding: 'hamlet_market' },
    purchased: false,
  },

  // City currency → Villages start with Herbalists (goal reduction head start)
  {
    id: 'prestige_herbalist_guild_1',
    name: 'Herbalist Guild',
    description: 'New Villages start with 1 Herbalist',
    cost: 3,
    tier: TierType.City,
    effect: { type: 'prestige_grant_building', value: 1, targetBuilding: 'village_herbalist' },
    purchased: false,
    prerequisite: 'prestige_crown_tax_1',
  },

  // County currency → Towns start with Watchtower (production boost head start)
  {
    id: 'prestige_watchtower_scouts_1',
    name: 'Watchtower Scouts',
    description: 'New Towns start with 1 Watchtower',
    cost: 2,
    tier: TierType.County,
    effect: { type: 'prestige_grant_building', value: 1, targetBuilding: 'town_watchtower' },
    purchased: false,
  },

  // Duchy currency → Cities start with Observatory (goal reduction head start)
  {
    id: 'prestige_observatory_builders_1',
    name: 'Observatory Builders',
    description: 'New Cities start with 1 Observatory',
    cost: 3,
    tier: TierType.Duchy,
    effect: { type: 'prestige_grant_building', value: 1, targetBuilding: 'city_observatory' },
    purchased: false,
    prerequisite: 'prestige_trade_routes_1',
  },

  // Realm currency → Towns start with Granary (income per building head start)
  {
    id: 'prestige_granary_network_1',
    name: 'Granary Network',
    description: 'New Towns start with 1 Granary',
    cost: 2,
    tier: TierType.Realm,
    effect: { type: 'prestige_grant_building', value: 1, targetBuilding: 'town_granary' },
    purchased: false,
  },

  // Kingdom currency → Hamlets start with Libraries (completion bonus head start)
  {
    id: 'prestige_royal_library_1',
    name: 'Royal Library',
    description: 'New Hamlets start with 1 Small Library',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_grant_building', value: 1, targetBuilding: 'hamlet_library' },
    purchased: false,
  },

  // Village currency → Villages start with Village Well (income per building)
  {
    id: 'prestige_well_diggers_1',
    name: 'Well Diggers',
    description: 'New Villages start with 1 Village Well',
    cost: 3,
    tier: TierType.Village,
    effect: { type: 'prestige_grant_building', value: 1, targetBuilding: 'village_well' },
    purchased: false,
    prerequisite: 'prestige_shrine_keepers_1',
  },

  // Duchy currency → Counties start with Courthouse (special building head start)
  {
    id: 'prestige_royal_charter_1',
    name: 'Royal Charter',
    description: 'New Counties start with 1 Courthouse',
    cost: 3,
    tier: TierType.Duchy,
    effect: { type: 'prestige_grant_building', value: 1, targetBuilding: 'county_courthouse' },
    purchased: false,
    prerequisite: 'prestige_trade_routes_1',
  },

  // Realm currency → Cities start with Trade Guild (production boost head start)
  {
    id: 'prestige_merchant_league_1',
    name: 'Merchant League',
    description: 'New Cities start with 1 Trade Guild',
    cost: 3,
    tier: TierType.Realm,
    effect: { type: 'prestige_grant_building', value: 1, targetBuilding: 'city_trade_guild' },
    purchased: false,
    prerequisite: 'prestige_granary_network_1',
  },

  // ===== Hamlet parallel slots (prestige) =====

  // Town prestige → 6th hamlet slot
  {
    id: 'prestige_hamlet_parallel_6',
    name: 'Hexa Hamlet Management',
    description: '+1 extra hamlet parallel slot',
    cost: 2,
    tier: TierType.Town,
    effect: { type: 'prestige_parallel_slots', value: 1 },
    purchased: false,
  },

  // ===== Tier requirement reduction =====

  // City currency → Reduce completions needed to advance tiers
  {
    id: 'prestige_swift_expansion_1',
    name: 'Swift Expansion I',
    description: 'Reduces completions needed to advance tiers by 1',
    cost: 3,
    tier: TierType.City,
    effect: { type: 'prestige_tier_requirement_reduction', value: 1 },
    purchased: false,
  },
  // Duchy currency → Final tier requirement reduction (3→2)
  {
    id: 'prestige_swift_expansion_2',
    name: 'Swift Expansion II',
    description: 'Reduces completions needed to advance tiers by 1 (minimum 2)',
    cost: 4,
    tier: TierType.Duchy,
    effect: { type: 'prestige_tier_requirement_reduction', value: 1 },
    purchased: false,
    prerequisite: 'prestige_swift_expansion_1',
  },

  // ===== Building synergy boosts =====

  // Town currency → Cottages boost Mills
  {
    id: 'prestige_cottage_industry_1',
    name: 'Cottage Industry',
    description: 'Each Cottage gives +1% income to Mills',
    cost: 2,
    tier: TierType.Town,
    effect: {
      type: 'prestige_building_synergy',
      value: 0.01,
      sourceBuilding: 'village_cottage',
      targetBuilding: 'village_mill',
    },
    purchased: false,
  },

  // City currency → Universities boost Grand Bazaars
  {
    id: 'prestige_academic_commerce_1',
    name: 'Academic Commerce',
    description: 'Each University gives +2% income to Grand Bazaars',
    cost: 3,
    tier: TierType.City,
    effect: {
      type: 'prestige_building_synergy',
      value: 0.02,
      sourceBuilding: 'city_university',
      targetBuilding: 'city_bazaar',
    },
    purchased: false,
  },

  // County currency → Fortresses boost Plantations
  {
    id: 'prestige_fortress_economy_1',
    name: 'Fortress Economy',
    description: 'Each Fortress gives +2% income to Plantations',
    cost: 3,
    tier: TierType.County,
    effect: {
      type: 'prestige_building_synergy',
      value: 0.02,
      sourceBuilding: 'county_fortress',
      targetBuilding: 'county_plantation',
    },
    purchased: false,
    prerequisite: 'prestige_feudal_foundation_1',
  },

  // Duchy currency → Mints boost Royal Academies
  {
    id: 'prestige_minting_scholars_1',
    name: 'Minting Scholars',
    description: 'Each Mint gives +2% income to Royal Academies',
    cost: 3,
    tier: TierType.Duchy,
    effect: {
      type: 'prestige_building_synergy',
      value: 0.02,
      sourceBuilding: 'duchy_mint',
      targetBuilding: 'duchy_academy',
    },
    purchased: false,
    prerequisite: 'prestige_port_1',
  },

  // Realm currency → Metropolises boost Wonders
  {
    id: 'prestige_metro_wonders_1',
    name: 'Metropolitan Wonders',
    description: 'Each Metropolis gives +2% income to Wonders',
    cost: 3,
    tier: TierType.Realm,
    effect: {
      type: 'prestige_building_synergy',
      value: 0.02,
      sourceBuilding: 'realm_metropolis',
      targetBuilding: 'realm_wonder',
    },
    purchased: false,
    prerequisite: 'prestige_exchange_1',
  },

  // Kingdom currency → Empire Districts boost Eternal Monuments
  {
    id: 'prestige_imperial_legacy_1',
    name: 'Imperial Legacy',
    description: 'Each Empire District gives +2% income to Eternal Monuments',
    cost: 2,
    tier: TierType.Kingdom,
    effect: {
      type: 'prestige_building_synergy',
      value: 0.02,
      sourceBuilding: 'kingdom_empire',
      targetBuilding: 'kingdom_monument',
    },
    purchased: false,
  },

  // ===== Cheap starter upgrades (cost 1) =====

  // Village currency → Small patronage boost
  {
    id: 'prestige_village_tithe_1',
    name: 'Village Tithe',
    description: '+10% patronage income from higher tiers',
    cost: 1,
    tier: TierType.Village,
    effect: { type: 'prestige_patronage_boost', value: 0.1 },
    purchased: false,
  },

  // Town currency → Small research discount
  {
    id: 'prestige_apprentice_scholars_1',
    name: 'Apprentice Scholars',
    description: '-5% research costs',
    cost: 1,
    tier: TierType.Town,
    effect: { type: 'prestige_research_discount', value: 0.95 },
    purchased: false,
  },

  // City currency → Small prestige currency boost
  {
    id: 'prestige_crown_tax_1',
    name: 'Crown Tax',
    description: '+10% prestige currency earned on reset',
    cost: 1,
    tier: TierType.City,
    effect: { type: 'prestige_currency_boost', value: 0.1 },
    purchased: false,
  },

  // Duchy currency → Small production boost amplifier
  {
    id: 'prestige_trade_routes_1',
    name: 'Trade Routes',
    description: 'Production boost buildings are 10% more effective',
    cost: 1,
    tier: TierType.Duchy,
    effect: { type: 'prestige_production_boost_amplifier', value: 0.1 },
    purchased: false,
  },

  // Realm currency → Small survival speed
  {
    id: 'prestige_realm_scouts_1',
    name: 'Realm Scouts',
    description: 'Survival goals progress 10% faster',
    cost: 1,
    tier: TierType.Realm,
    effect: { type: 'prestige_survival_speed', value: 0.1 },
    purchased: false,
  },

  // Kingdom currency → Small goal reduction
  {
    id: 'prestige_royal_decree_1',
    name: 'Royal Decree',
    description: '-5% goal targets',
    cost: 1,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_goal_reduction', value: 0.05 },
    purchased: false,
  },

  // ===== Tiered chain extensions (currency sinks for early tiers) =====

  // Village currency → Hut income chain extension
  {
    id: 'prestige_hearth_2',
    name: 'Blessing of the Hearth II',
    description: '+100% Hut income',
    cost: 3,
    tier: TierType.Village,
    effect: { type: 'prestige_building_income_boost', value: 1.0, targetBuilding: 'hamlet_hut' },
    purchased: false,
    prerequisite: 'prestige_hearth_1',
  },

  // Village currency → Patronage chain extension
  {
    id: 'prestige_patron_2',
    name: 'Patron of the Arts II',
    description: '+40% patronage income from higher tiers',
    cost: 4,
    tier: TierType.Village,
    effect: { type: 'prestige_patronage_boost', value: 0.4 },
    purchased: false,
    prerequisite: 'prestige_patron_1',
  },

  // Village currency → Survival speed chain extension
  {
    id: 'prestige_pastoral_3',
    name: 'Pastoral Wisdom III',
    description: 'Survival goals progress 15% faster',
    cost: 5,
    tier: TierType.Village,
    effect: { type: 'prestige_survival_speed', value: 0.15 },
    purchased: false,
    prerequisite: 'prestige_pastoral_2',
  },

  // Town currency → Forge income chain extension
  {
    id: 'prestige_forgemaster_2',
    name: "Forgemaster's Legacy II",
    description: '+100% Forge income',
    cost: 3,
    tier: TierType.Town,
    effect: { type: 'prestige_building_income_boost', value: 1.0, targetBuilding: 'town_forge' },
    purchased: false,
    prerequisite: 'prestige_forgemaster_1',
  },

  // Town currency → Flat cost chain extension
  {
    id: 'prestige_foundation_3',
    name: 'Foundation Stone III',
    description: '+2 more flat cost buildings (no scaling)',
    cost: 5,
    tier: TierType.Town,
    effect: { type: 'prestige_flat_cost_count', value: 2 },
    purchased: false,
    prerequisite: 'prestige_foundation_2',
  },

  // Town currency → Cottage synergy chain extension
  {
    id: 'prestige_cottage_industry_2',
    name: 'Cottage Industry II',
    description: 'Each Cottage gives +2% income to Mills',
    cost: 4,
    tier: TierType.Town,
    effect: {
      type: 'prestige_building_synergy',
      value: 0.02,
      sourceBuilding: 'village_cottage',
      targetBuilding: 'village_mill',
    },
    purchased: false,
    prerequisite: 'prestige_cottage_industry_1',
  },

  // City currency → Cathedral income chain extension
  {
    id: 'prestige_cathedral_2',
    name: "Cathedral's Blessing II",
    description: '+100% Cathedral income',
    cost: 4,
    tier: TierType.City,
    effect: {
      type: 'prestige_building_income_boost',
      value: 1.0,
      targetBuilding: 'city_cathedral',
    },
    purchased: false,
    prerequisite: 'prestige_cathedral_1',
  },

  // City currency → Prestige currency chain extension
  {
    id: 'prestige_crowning_2',
    name: 'Crowning Glory II',
    description: '+40% prestige currency earned on reset',
    cost: 4,
    tier: TierType.City,
    effect: { type: 'prestige_currency_boost', value: 0.4 },
    purchased: false,
    prerequisite: 'prestige_crowning_1',
  },

  // City currency → University synergy chain extension
  {
    id: 'prestige_academic_commerce_2',
    name: 'Academic Commerce II',
    description: 'Each University gives +3% income to Grand Bazaars',
    cost: 5,
    tier: TierType.City,
    effect: {
      type: 'prestige_building_synergy',
      value: 0.03,
      sourceBuilding: 'city_university',
      targetBuilding: 'city_bazaar',
    },
    purchased: false,
    prerequisite: 'prestige_academic_commerce_1',
  },

  // County currency → Survival speed chain extension
  {
    id: 'prestige_swift_2',
    name: 'Swift Conquest II',
    description: 'Survival goals progress 20% faster',
    cost: 3,
    tier: TierType.County,
    effect: { type: 'prestige_survival_speed', value: 0.2 },
    purchased: false,
    prerequisite: 'prestige_swift_1',
  },

  // County currency → Patronage chain extension
  {
    id: 'prestige_feudal_ties_2',
    name: 'Feudal Ties II',
    description: '+50% patronage income from higher tiers',
    cost: 4,
    tier: TierType.County,
    effect: { type: 'prestige_patronage_boost', value: 0.5 },
    purchased: false,
    prerequisite: 'prestige_feudal_ties_1',
  },

  // ===== Repeatable prestige sinks (infinite purchase, escalating cost) =====

  // Village: Tithe Collector (+2% income per level)
  {
    id: 'prestige_repeatable_tithe',
    name: 'Tithe Collector',
    description: '+2% income per level',
    cost: 2,
    tier: TierType.Village,
    effect: { type: 'prestige_income_multiplier', value: 0.02 },
    purchased: false,
    prerequisite: 'prestige_growth_3',
    repeatable: true,
    level: 0,
  },
  // Village: Pastoral Endurance (+3% survival speed per level)
  {
    id: 'prestige_repeatable_pastoral',
    name: 'Pastoral Endurance',
    description: '+3% survival speed per level',
    cost: 2,
    tier: TierType.Village,
    effect: { type: 'prestige_survival_speed', value: 0.03 },
    purchased: false,
    prerequisite: 'prestige_pastoral_2',
    repeatable: true,
    level: 0,
  },

  // Town: Guild Coffers (+1 flat cost building per level)
  {
    id: 'prestige_repeatable_coffers',
    name: 'Guild Coffers',
    description: '+1 flat cost building per level',
    cost: 2,
    tier: TierType.Town,
    effect: { type: 'prestige_flat_cost_count', value: 1 },
    purchased: false,
    prerequisite: 'prestige_foundation_2',
    repeatable: true,
    level: 0,
  },
  // Town: Guild Connections (+2% patronage per level)
  {
    id: 'prestige_repeatable_guild_conn',
    name: 'Guild Connections',
    description: '+2% patronage per level',
    cost: 2,
    tier: TierType.Town,
    effect: { type: 'prestige_patronage_boost', value: 0.02 },
    purchased: false,
    prerequisite: 'prestige_apprentice_scholars_1',
    repeatable: true,
    level: 0,
  },

  // City: Crown Mint (+5% prestige currency per level)
  {
    id: 'prestige_repeatable_mint',
    name: 'Crown Mint',
    description: '+5% prestige currency per level',
    cost: 3,
    tier: TierType.City,
    effect: { type: 'prestige_currency_boost', value: 0.05 },
    purchased: false,
    prerequisite: 'prestige_crowning_1',
    repeatable: true,
    level: 0,
  },
  // City: Research Patronage (+3 research points per level)
  {
    id: 'prestige_repeatable_research',
    name: 'Research Patronage',
    description: '+3 research points per level',
    cost: 3,
    tier: TierType.City,
    effect: { type: 'prestige_research_bonus', value: 3 },
    purchased: false,
    prerequisite: 'prestige_knowledge_2',
    repeatable: true,
    level: 0,
  },

  // County: Ambitious Drive (-2% goal targets per level)
  {
    id: 'prestige_repeatable_ambition',
    name: 'Ambitious Drive',
    description: '-2% goal targets per level',
    cost: 3,
    tier: TierType.County,
    effect: { type: 'prestige_goal_reduction', value: 0.02 },
    purchased: false,
    prerequisite: 'prestige_ambition_2',
    repeatable: true,
    level: 0,
  },
  // Duchy: Trade Empire (+5% production boost per level)
  {
    id: 'prestige_repeatable_trade',
    name: 'Trade Empire',
    description: '+5% production boost per level',
    cost: 3,
    tier: TierType.Duchy,
    effect: { type: 'prestige_production_boost_amplifier', value: 0.05 },
    purchased: false,
    prerequisite: 'prestige_trade_networks_1',
    repeatable: true,
    level: 0,
  },
  // Duchy: Noble Connections (+5% patronage per level)
  {
    id: 'prestige_repeatable_noble',
    name: 'Noble Connections',
    description: '+5% patronage per level',
    cost: 3,
    tier: TierType.Duchy,
    effect: { type: 'prestige_patronage_boost', value: 0.05 },
    purchased: false,
    prerequisite: 'prestige_settlers_cache_1',
    repeatable: true,
    level: 0,
  },

  // Realm: Realm Efficiency (+3% auto-build speed per level)
  {
    id: 'prestige_repeatable_autobuild',
    name: 'Realm Efficiency',
    description: '+3% auto-build speed per level',
    cost: 3,
    tier: TierType.Realm,
    effect: { type: 'prestige_autobuild_speed', value: 0.03 },
    purchased: false,
    prerequisite: 'prestige_power_2',
    repeatable: true,
    level: 0,
  },
  // Realm: Arcane Scholarship (-2% research cost per level)
  {
    id: 'prestige_repeatable_scholarship',
    name: 'Arcane Scholarship',
    description: '-2% research cost per level',
    cost: 3,
    tier: TierType.Realm,
    effect: { type: 'prestige_research_discount', value: 0.98 },
    purchased: false,
    prerequisite: 'prestige_endowment_1',
    repeatable: true,
    level: 0,
  },

  // Kingdom: Eternal Prosperity (+3% income per level)
  {
    id: 'prestige_repeatable_prosperity',
    name: 'Eternal Prosperity',
    description: '+3% income per level',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_income_multiplier', value: 0.03 },
    purchased: false,
    prerequisite: 'prestige_destiny_2',
    repeatable: true,
    level: 0,
  },
  // Kingdom: Royal Ambition (-3% goal targets per level)
  {
    id: 'prestige_repeatable_royal_ambition',
    name: 'Royal Ambition',
    description: '-3% goal targets per level',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_goal_reduction', value: 0.03 },
    purchased: false,
    prerequisite: 'prestige_royal_decree_1',
    repeatable: true,
    level: 0,
  },
];

/**
 * Calculate the current cost of a prestige upgrade.
 * For repeatable upgrades: baseCost + currentLevel (linear escalation).
 * For one-time upgrades: just the base cost.
 */
export function getPrestigeUpgradeCost(upgrade: PrestigeUpgrade): number {
  if (upgrade.repeatable !== true) return upgrade.cost;
  return upgrade.cost + (upgrade.level ?? 0);
}

/**
 * Calculate prestige currency earned for a tier based on completions.
 * First 3 crowns use sqrt scaling (1/4/9 completions), then logarithmic
 * scaling (base 3) kicks in — each additional crown requires 3× more completions.
 */
export function calculatePrestigeCurrency(completions: number): number {
  if (completions <= 0) return 0;
  if (completions < 9) return Math.floor(Math.sqrt(completions));
  return 3 + Math.floor(Math.log(completions / 9) / Math.log(3));
}
