import { ResearchUpgrade, TierType } from '../types/game';

export const RESEARCH_DATA: ResearchUpgrade[] = [
  // Hamlet Research
  {
    id: 'hamlet_parallel_2',
    name: 'Dual Hamlet Management',
    description: 'Run 2 hamlets in parallel',
    cost: 50,
    tier: TierType.Hamlet,
    effect: {
      type: 'parallel_slots',
      value: 2,
    },
    purchased: false,
  },
  {
    id: 'hamlet_parallel_3',
    name: 'Triple Hamlet Management',
    description: 'Run 3 hamlets in parallel',
    cost: 200,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_parallel_2',
    effect: {
      type: 'parallel_slots',
      value: 3,
    },
    purchased: false,
  },
  // hamlet_parallel_4 and hamlet_parallel_5 are in Village and Town research sections
  // hamlet_parallel_6 is a prestige upgrade
  // Starting Income Research
  {
    id: 'hamlet_starting_income_1',
    name: 'Better Starting Resources',
    description: '+5 starting income for new hamlets',
    cost: 5,
    tier: TierType.Hamlet,
    effect: {
      type: 'starting_income',
      value: 5,
    },
    purchased: false,
  },
  {
    id: 'hamlet_starting_income_2',
    name: 'Improved Starting Resources',
    description: '+10 starting income for new hamlets',
    cost: 15,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_starting_income_1',
    effect: {
      type: 'starting_income',
      value: 10,
    },
    purchased: false,
  },
  {
    id: 'hamlet_starting_income_3',
    name: 'Advanced Starting Resources',
    description: '+20 starting income for new hamlets',
    cost: 50,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_starting_income_2',
    effect: {
      type: 'starting_income',
      value: 20,
    },
    purchased: false,
  },

  // Automated Building Purchases
  {
    id: 'hamlet_auto_hut_1',
    name: 'Automated Hut Construction I',
    description: 'Automatically buys 1 hut every 30 seconds',
    cost: 15,
    tier: TierType.Hamlet,
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_hut',
      interval: 30000, // 30 seconds in milliseconds
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_hut_2',
    name: 'Automated Hut Construction II',
    description: 'Automatically buys 1 hut every 20 seconds',
    cost: 30,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_hut_1',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_hut',
      interval: 20000, // 20 seconds
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_hut_3',
    name: 'Automated Hut Construction III',
    description: 'Automatically buys 1 hut every 10 seconds',
    cost: 60,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_hut_2',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_hut',
      interval: 10000, // 10 seconds
    },
    purchased: false,
  },

  {
    id: 'hamlet_auto_garden_1',
    name: 'Automated Garden Cultivation I',
    description: 'Automatically buys 1 garden every 60 seconds',
    cost: 30,
    tier: TierType.Hamlet,
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_garden',
      interval: 60000, // 60 seconds
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_garden_2',
    name: 'Automated Garden Cultivation II',
    description: 'Automatically buys 1 garden every 40 seconds',
    cost: 60,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_garden_1',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_garden',
      interval: 40000, // 40 seconds
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_garden_3',
    name: 'Automated Garden Cultivation III',
    description: 'Automatically buys 1 garden every 20 seconds',
    cost: 120,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_garden_2',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_garden',
      interval: 20000, // 20 seconds
    },
    purchased: false,
  },

  {
    id: 'hamlet_auto_workshop_1',
    name: 'Automated Workshop Construction I',
    description: 'Automatically buys 1 workshop every 90 seconds',
    cost: 45,
    tier: TierType.Hamlet,
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_workshop',
      interval: 90000, // 90 seconds
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_workshop_2',
    name: 'Automated Workshop Construction II',
    description: 'Automatically buys 1 workshop every 60 seconds',
    cost: 90,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_workshop_1',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_workshop',
      interval: 60000, // 60 seconds
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_workshop_3',
    name: 'Automated Workshop Construction III',
    description: 'Automatically buys 1 workshop every 30 seconds',
    cost: 180,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_workshop_2',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_workshop',
      interval: 30000, // 30 seconds
    },
    purchased: false,
  },

  {
    id: 'hamlet_auto_shrine_1',
    name: 'Automated Shrine Construction I',
    description: 'Automatically buys 1 shrine every 120 seconds',
    cost: 75,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_hut_1', // Requires basic hut automation first
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_shrine',
      interval: 120000, // 120 seconds
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_shrine_2',
    name: 'Automated Shrine Construction II',
    description: 'Automatically buys 1 shrine every 80 seconds',
    cost: 150,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_shrine_1',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_shrine',
      interval: 80000, // 80 seconds
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_shrine_3',
    name: 'Automated Shrine Construction III',
    description: 'Automatically buys 1 shrine every 40 seconds',
    cost: 300,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_shrine_2',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_shrine',
      interval: 40000, // 40 seconds
    },
    purchased: false,
  },

  {
    id: 'hamlet_auto_market_1',
    name: 'Automated Market Construction I',
    description: 'Automatically buys 1 market stall every 150 seconds',
    cost: 100,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_garden_1', // Requires basic garden automation first
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_market',
      interval: 150000, // 150 seconds
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_market_2',
    name: 'Automated Market Construction II',
    description: 'Automatically buys 1 market stall every 100 seconds',
    cost: 200,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_market_1',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_market',
      interval: 100000, // 100 seconds
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_market_3',
    name: 'Automated Market Construction III',
    description: 'Automatically buys 1 market stall every 50 seconds',
    cost: 400,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_market_2',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_market',
      interval: 50000, // 50 seconds
    },
    purchased: false,
  },

  {
    id: 'hamlet_auto_library_1',
    name: 'Automated Library Construction I',
    description: 'Automatically buys 1 library every 300 seconds',
    cost: 200,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_workshop_1', // Requires basic workshop automation first
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_library',
      interval: 300000, // 300 seconds (5 minutes)
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_library_2',
    name: 'Automated Library Construction II',
    description: 'Automatically buys 1 library every 200 seconds',
    cost: 400,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_library_1',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_library',
      interval: 200000, // 200 seconds
    },
    purchased: false,
  },
  {
    id: 'hamlet_auto_library_3',
    name: 'Automated Library Construction III',
    description: 'Automatically buys 1 library every 120 seconds',
    cost: 800,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_library_2',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_library',
      interval: 120000, // 120 seconds (2 minutes)
    },
    purchased: false,
  },

  // Building Cost Reduction Research
  {
    id: 'hamlet_cost_reduction_1',
    name: 'Efficient Construction I',
    description: 'Reduces all building costs by 5%',
    cost: 25,
    tier: TierType.Hamlet,
    effect: {
      type: 'cost_reduction',
      value: 0.95, // 5% reduction (multiply by 0.95)
    },
    purchased: false,
  },
  {
    id: 'hamlet_cost_reduction_2',
    name: 'Efficient Construction II',
    description: 'Reduces all building costs by 10%',
    cost: 75,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_cost_reduction_1',
    effect: {
      type: 'cost_reduction',
      value: 0.9, // 10% reduction (multiply by 0.90)
    },
    purchased: false,
  },
  {
    id: 'hamlet_cost_reduction_3',
    name: 'Efficient Construction III',
    description: 'Reduces all building costs by 15%',
    cost: 225,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_cost_reduction_2',
    effect: {
      type: 'cost_reduction',
      value: 0.85, // 15% reduction (multiply by 0.85)
    },
    purchased: false,
  },

  // Building Cost Scaling Reduction Research
  {
    id: 'hamlet_scaling_reduction_1',
    name: 'Bulk Production I',
    description: 'Reduces building cost scaling by improving multipliers',
    cost: 50,
    tier: TierType.Hamlet,
    effect: {
      type: 'cost_scaling_reduction',
      value: 0.02, // Reduces multiplier by 0.02 (e.g., 1.15 becomes 1.13)
    },
    purchased: false,
  },
  {
    id: 'hamlet_scaling_reduction_2',
    name: 'Bulk Production II',
    description: 'Further reduces building cost scaling multipliers',
    cost: 150,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_scaling_reduction_1',
    effect: {
      type: 'cost_scaling_reduction',
      value: 0.04, // Additional 0.02 reduction (total 0.04)
    },
    purchased: false,
  },
  {
    id: 'hamlet_scaling_reduction_3',
    name: 'Bulk Production III',
    description: 'Maximizes bulk production efficiency for cost scaling',
    cost: 450,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_scaling_reduction_2',
    effect: {
      type: 'cost_scaling_reduction',
      value: 0.06, // Additional 0.02 reduction (total 0.06)
    },
    purchased: false,
  },

  // ===== VILLAGE RESEARCH =====

  // Village Starting Income
  {
    id: 'village_starting_income_1',
    name: 'Village Foundation Funds',
    description: '+50 starting income for new villages',
    cost: 50,
    tier: TierType.Village,
    effect: {
      type: 'starting_income',
      value: 50,
    },
    purchased: false,
  },
  {
    id: 'village_starting_income_2',
    name: 'Enhanced Village Resources',
    description: '+150 starting income for new villages',
    cost: 150,
    tier: TierType.Village,
    prerequisite: 'village_starting_income_1',
    effect: {
      type: 'starting_income',
      value: 150,
    },
    purchased: false,
  },

  // Village Cost Reduction
  {
    id: 'village_cost_reduction_1',
    name: 'Village Construction Efficiency',
    description: 'Reduces all village building costs by 8%',
    cost: 100,
    tier: TierType.Village,
    effect: {
      type: 'cost_reduction',
      value: 0.92,
    },
    purchased: false,
  },
  {
    id: 'village_cost_reduction_2',
    name: 'Advanced Village Engineering',
    description: 'Reduces all village building costs by 16%',
    cost: 300,
    tier: TierType.Village,
    prerequisite: 'village_cost_reduction_1',
    effect: {
      type: 'cost_reduction',
      value: 0.84,
    },
    purchased: false,
  },

  // Village Automation (Basic buildings only)
  {
    id: 'village_auto_cottage_1',
    name: 'Automated Cottage Construction',
    description: 'Automatically buys 1 cottage every 45 seconds',
    cost: 75,
    tier: TierType.Village,
    effect: {
      type: 'auto_building',
      buildingId: 'village_cottage',
      interval: 45000,
    },
    purchased: false,
  },
  {
    id: 'village_auto_farm_1',
    name: 'Automated Farm Development',
    description: 'Automatically buys 1 farm every 90 seconds',
    cost: 150,
    tier: TierType.Village,
    prerequisite: 'village_auto_cottage_1',
    effect: {
      type: 'auto_building',
      buildingId: 'village_farm',
      interval: 90000,
    },
    purchased: false,
  },
  {
    id: 'village_auto_mill_1',
    name: 'Automated Mill Operation',
    description: 'Automatically buys 1 mill every 60 seconds',
    cost: 200,
    tier: TierType.Village,
    prerequisite: 'village_auto_farm_1',
    effect: {
      type: 'auto_building',
      buildingId: 'village_mill',
      interval: 60000,
    },
    purchased: false,
  },
  {
    id: 'village_auto_chapel_1',
    name: 'Automated Chapel Construction',
    description: 'Automatically buys 1 chapel every 90 seconds',
    cost: 250,
    tier: TierType.Village,
    prerequisite: 'village_auto_cottage_1',
    effect: {
      type: 'auto_building',
      buildingId: 'village_chapel',
      interval: 90000,
    },
    purchased: false,
  },
  {
    id: 'village_auto_well_1',
    name: 'Automated Well Digging',
    description: 'Automatically buys 1 village well every 120 seconds',
    cost: 350,
    tier: TierType.Village,
    prerequisite: 'village_auto_mill_1',
    effect: {
      type: 'auto_building',
      buildingId: 'village_well',
      interval: 120000,
    },
    purchased: false,
  },
  {
    id: 'village_auto_herbalist_1',
    name: 'Automated Herbalist Setup',
    description: 'Automatically buys 1 herbalist every 150 seconds',
    cost: 500,
    tier: TierType.Village,
    prerequisite: 'village_auto_chapel_1',
    effect: {
      type: 'auto_building',
      buildingId: 'village_herbalist',
      interval: 150000,
    },
    purchased: false,
  },

  // Village → Hamlet parallel slot upgrade
  {
    id: 'hamlet_parallel_4',
    name: 'Quad Hamlet Management',
    description: 'Run 4 hamlets in parallel',
    cost: 250,
    tier: TierType.Village,
    prerequisite: 'hamlet_parallel_3',
    effect: {
      type: 'parallel_slots',
      value: 4,
    },
    purchased: false,
  },

  // ===== TOWN RESEARCH =====

  // Town Starting Income
  {
    id: 'town_starting_income_1',
    name: 'Town Development Fund',
    description: '+500 starting income for new towns',
    cost: 150,
    tier: TierType.Town,
    effect: {
      type: 'starting_income',
      value: 500,
    },
    purchased: false,
  },
  {
    id: 'town_starting_income_2',
    name: 'Major Town Investment',
    description: '+1500 starting income for new towns',
    cost: 450,
    tier: TierType.Town,
    prerequisite: 'town_starting_income_1',
    effect: {
      type: 'starting_income',
      value: 1500,
    },
    purchased: false,
  },

  // Town Cost Reduction
  {
    id: 'town_cost_reduction_1',
    name: 'Town Planning Expertise',
    description: 'Reduces all town building costs by 10%',
    cost: 250,
    tier: TierType.Town,
    effect: {
      type: 'cost_reduction',
      value: 0.9,
    },
    purchased: false,
  },
  {
    id: 'town_cost_reduction_2',
    name: 'Master Town Engineering',
    description: 'Reduces all town building costs by 20%',
    cost: 750,
    tier: TierType.Town,
    prerequisite: 'town_cost_reduction_1',
    effect: {
      type: 'cost_reduction',
      value: 0.8,
    },
    purchased: false,
  },

  // Town Cost Scaling Reduction
  {
    id: 'town_scaling_reduction_1',
    name: 'Town Mass Production',
    description: 'Reduces town building cost scaling',
    cost: 300,
    tier: TierType.Town,
    effect: {
      type: 'cost_scaling_reduction',
      value: 0.03,
    },
    purchased: false,
  },

  // Town Automation
  {
    id: 'town_auto_house_1',
    name: 'Automated House Construction',
    description: 'Automatically buys 1 town house every 45 seconds',
    cost: 200,
    tier: TierType.Town,
    effect: {
      type: 'auto_building',
      buildingId: 'town_house',
      interval: 45000,
    },
    purchased: false,
  },
  {
    id: 'town_auto_market_1',
    name: 'Automated Market Construction',
    description: 'Automatically buys 1 market every 60 seconds',
    cost: 350,
    tier: TierType.Town,
    prerequisite: 'town_auto_house_1',
    effect: {
      type: 'auto_building',
      buildingId: 'town_market',
      interval: 60000,
    },
    purchased: false,
  },
  {
    id: 'town_auto_forge_1',
    name: 'Automated Forge Construction',
    description: 'Automatically buys 1 forge every 90 seconds',
    cost: 500,
    tier: TierType.Town,
    prerequisite: 'town_auto_house_1',
    effect: {
      type: 'auto_building',
      buildingId: 'town_forge',
      interval: 90000,
    },
    purchased: false,
  },
  {
    id: 'town_auto_guild_1',
    name: 'Automated Guild Construction',
    description: 'Automatically buys 1 guild hall every 120 seconds',
    cost: 700,
    tier: TierType.Town,
    prerequisite: 'town_auto_market_1',
    effect: {
      type: 'auto_building',
      buildingId: 'town_guild',
      interval: 120000,
    },
    purchased: false,
  },
  {
    id: 'town_auto_watchtower_1',
    name: 'Automated Watchtower Construction',
    description: 'Automatically buys 1 watchtower every 150 seconds',
    cost: 900,
    tier: TierType.Town,
    prerequisite: 'town_auto_forge_1',
    effect: {
      type: 'auto_building',
      buildingId: 'town_watchtower',
      interval: 150000,
    },
    purchased: false,
  },
  {
    id: 'town_auto_granary_1',
    name: 'Automated Granary Construction',
    description: 'Automatically buys 1 granary every 180 seconds',
    cost: 1200,
    tier: TierType.Town,
    prerequisite: 'town_auto_guild_1',
    effect: {
      type: 'auto_building',
      buildingId: 'town_granary',
      interval: 180000,
    },
    purchased: false,
  },

  // Town → Hamlet parallel slot upgrade
  {
    id: 'hamlet_parallel_5',
    name: 'Penta Hamlet Management',
    description: 'Run 5 hamlets in parallel',
    cost: 500,
    tier: TierType.Town,
    prerequisite: 'hamlet_parallel_4',
    effect: {
      type: 'parallel_slots',
      value: 5,
    },
    purchased: false,
  },

  // ===== CITY RESEARCH =====

  // City Starting Income
  {
    id: 'city_starting_income_1',
    name: 'City Development Grant',
    description: '+5000 starting income for new cities',
    cost: 400,
    tier: TierType.City,
    effect: {
      type: 'starting_income',
      value: 5000,
    },
    purchased: false,
  },

  // City Cost Reduction
  {
    id: 'city_cost_reduction_1',
    name: 'Metropolitan Efficiency',
    description: 'Reduces all city building costs by 12%',
    cost: 600,
    tier: TierType.City,
    effect: {
      type: 'cost_reduction',
      value: 0.88,
    },
    purchased: false,
  },

  // City Cost Scaling Reduction
  {
    id: 'city_scaling_reduction_1',
    name: 'Urban Industrial Complex',
    description: 'Reduces city building cost scaling',
    cost: 800,
    tier: TierType.City,
    effect: {
      type: 'cost_scaling_reduction',
      value: 0.04,
    },
    purchased: false,
  },

  // City Automation
  {
    id: 'city_auto_apartment_1',
    name: 'Automated Apartment Construction',
    description: 'Automatically buys 1 apartment every 45 seconds',
    cost: 500,
    tier: TierType.City,
    effect: {
      type: 'auto_building',
      buildingId: 'city_apartment',
      interval: 45000,
    },
    purchased: false,
  },
  {
    id: 'city_auto_bazaar_1',
    name: 'Automated Bazaar Construction',
    description: 'Automatically buys 1 grand bazaar every 60 seconds',
    cost: 800,
    tier: TierType.City,
    prerequisite: 'city_auto_apartment_1',
    effect: {
      type: 'auto_building',
      buildingId: 'city_bazaar',
      interval: 60000,
    },
    purchased: false,
  },
  {
    id: 'city_auto_university_1',
    name: 'Automated University Construction',
    description: 'Automatically buys 1 university every 90 seconds',
    cost: 1200,
    tier: TierType.City,
    prerequisite: 'city_auto_apartment_1',
    effect: {
      type: 'auto_building',
      buildingId: 'city_university',
      interval: 90000,
    },
    purchased: false,
  },
  {
    id: 'city_auto_cathedral_1',
    name: 'Automated Cathedral Construction',
    description: 'Automatically buys 1 cathedral every 120 seconds',
    cost: 1600,
    tier: TierType.City,
    prerequisite: 'city_auto_bazaar_1',
    effect: {
      type: 'auto_building',
      buildingId: 'city_cathedral',
      interval: 120000,
    },
    purchased: false,
  },
  {
    id: 'city_auto_observatory_1',
    name: 'Automated Observatory Construction',
    description: 'Automatically buys 1 observatory every 150 seconds',
    cost: 2000,
    tier: TierType.City,
    prerequisite: 'city_auto_university_1',
    effect: {
      type: 'auto_building',
      buildingId: 'city_observatory',
      interval: 150000,
    },
    purchased: false,
  },
  {
    id: 'city_auto_trade_guild_1',
    name: 'Automated Trade Guild Construction',
    description: 'Automatically buys 1 trade guild every 180 seconds',
    cost: 2500,
    tier: TierType.City,
    prerequisite: 'city_auto_cathedral_1',
    effect: {
      type: 'auto_building',
      buildingId: 'city_trade_guild',
      interval: 180000,
    },
    purchased: false,
  },

  // ===== TIER REQUIREMENT REDUCTION =====

  // Hamlet Research → Reduce completions needed to spawn next tier
  {
    id: 'hamlet_expansion_efficiency_1',
    name: 'Expansion Efficiency',
    description: 'Reduces completions needed to advance tiers by 1 (6→5)',
    cost: 500,
    tier: TierType.Hamlet,
    effect: {
      type: 'tier_requirement_reduction',
      value: 1,
    },
    purchased: false,
  },

  // ===== FOUNDATION PLANNING (per-tier, tier-scoped) =====

  {
    id: 'hamlet_foundation_planning_1',
    name: 'Foundation Planning',
    description: '1 of each building type has flat cost (no scaling)',
    cost: 50,
    tier: TierType.Hamlet,
    effect: {
      type: 'flat_cost_count',
      value: 1,
    },
    purchased: false,
  },
  {
    id: 'village_foundation_planning_1',
    name: 'Foundation Planning',
    description: '1 of each building type has flat cost (no scaling)',
    cost: 200,
    tier: TierType.Village,
    effect: {
      type: 'flat_cost_count',
      value: 1,
    },
    purchased: false,
  },
  {
    id: 'town_foundation_planning_1',
    name: 'Foundation Planning',
    description: '1 of each building type has flat cost (no scaling)',
    cost: 500,
    tier: TierType.Town,
    effect: {
      type: 'flat_cost_count',
      value: 1,
    },
    purchased: false,
  },
  {
    id: 'city_foundation_planning_1',
    name: 'Foundation Planning',
    description: '1 of each building type has flat cost (no scaling)',
    cost: 1200,
    tier: TierType.City,
    effect: {
      type: 'flat_cost_count',
      value: 1,
    },
    purchased: false,
  },
  {
    id: 'county_foundation_planning_1',
    name: 'Foundation Planning',
    description: '1 of each building type has flat cost (no scaling)',
    cost: 3000,
    tier: TierType.County,
    effect: {
      type: 'flat_cost_count',
      value: 1,
    },
    purchased: false,
  },
  {
    id: 'duchy_foundation_planning_1',
    name: 'Foundation Planning',
    description: '1 of each building type has flat cost (no scaling)',
    cost: 7000,
    tier: TierType.Duchy,
    effect: {
      type: 'flat_cost_count',
      value: 1,
    },
    purchased: false,
  },
  {
    id: 'realm_foundation_planning_1',
    name: 'Foundation Planning',
    description: '1 of each building type has flat cost (no scaling)',
    cost: 15000,
    tier: TierType.Realm,
    effect: {
      type: 'flat_cost_count',
      value: 1,
    },
    purchased: false,
  },
  {
    id: 'kingdom_foundation_planning_1',
    name: 'Foundation Planning',
    description: '1 of each building type has flat cost (no scaling)',
    cost: 35000,
    tier: TierType.Kingdom,
    effect: {
      type: 'flat_cost_count',
      value: 1,
    },
    purchased: false,
  },

  // ===== ADDITIONAL TIER RESEARCH (cost reduction & scaling) =====

  // Village Cost Scaling Reduction
  {
    id: 'village_scaling_reduction_1',
    name: 'Village Bulk Production I',
    description: 'Reduces village building cost scaling',
    cost: 150,
    tier: TierType.Village,
    effect: {
      type: 'cost_scaling_reduction',
      value: 0.02,
    },
    purchased: false,
  },

  // County Research
  {
    id: 'county_cost_reduction_1',
    name: 'County Construction Efficiency I',
    description: 'Reduces all county building costs by 15%',
    cost: 1500,
    tier: TierType.County,
    effect: {
      type: 'cost_reduction',
      value: 0.85,
    },
    purchased: false,
  },
  {
    id: 'county_scaling_reduction_1',
    name: 'County Mass Production I',
    description: 'Reduces county building cost scaling',
    cost: 2000,
    tier: TierType.County,
    effect: {
      type: 'cost_scaling_reduction',
      value: 0.05,
    },
    purchased: false,
  },

  // County Automation
  {
    id: 'county_auto_manor_1',
    name: 'Automated Manor Construction',
    description: 'Automatically buys 1 manor every 45 seconds',
    cost: 1500,
    tier: TierType.County,
    effect: {
      type: 'auto_building',
      buildingId: 'county_manor',
      interval: 45000,
    },
    purchased: false,
  },
  {
    id: 'county_auto_plantation_1',
    name: 'Automated Plantation Development',
    description: 'Automatically buys 1 plantation every 60 seconds',
    cost: 2500,
    tier: TierType.County,
    prerequisite: 'county_auto_manor_1',
    effect: {
      type: 'auto_building',
      buildingId: 'county_plantation',
      interval: 60000,
    },
    purchased: false,
  },
  {
    id: 'county_auto_fortress_1',
    name: 'Automated Fortress Construction',
    description: 'Automatically buys 1 fortress every 90 seconds',
    cost: 3500,
    tier: TierType.County,
    prerequisite: 'county_auto_manor_1',
    effect: {
      type: 'auto_building',
      buildingId: 'county_fortress',
      interval: 90000,
    },
    purchased: false,
  },
  {
    id: 'county_auto_courthouse_1',
    name: 'Automated Courthouse Construction',
    description: 'Automatically buys 1 courthouse every 120 seconds',
    cost: 5000,
    tier: TierType.County,
    prerequisite: 'county_auto_plantation_1',
    effect: {
      type: 'auto_building',
      buildingId: 'county_courthouse',
      interval: 120000,
    },
    purchased: false,
  },
  {
    id: 'county_auto_tax_office_1',
    name: 'Automated Tax Office Construction',
    description: 'Automatically buys 1 tax office every 150 seconds',
    cost: 7000,
    tier: TierType.County,
    prerequisite: 'county_auto_fortress_1',
    effect: {
      type: 'auto_building',
      buildingId: 'county_tax_office',
      interval: 150000,
    },
    purchased: false,
  },

  // Duchy Research
  {
    id: 'duchy_cost_reduction_1',
    name: 'Ducal Engineering I',
    description: 'Reduces all duchy building costs by 18%',
    cost: 3500,
    tier: TierType.Duchy,
    effect: {
      type: 'cost_reduction',
      value: 0.82,
    },
    purchased: false,
  },
  {
    id: 'duchy_scaling_reduction_1',
    name: 'Ducal Mass Production I',
    description: 'Reduces duchy building cost scaling',
    cost: 5000,
    tier: TierType.Duchy,
    effect: {
      type: 'cost_scaling_reduction',
      value: 0.06,
    },
    purchased: false,
  },

  // Duchy Automation
  {
    id: 'duchy_auto_palace_1',
    name: 'Automated Palace Construction',
    description: 'Automatically buys 1 palace every 45 seconds',
    cost: 4000,
    tier: TierType.Duchy,
    effect: {
      type: 'auto_building',
      buildingId: 'duchy_palace',
      interval: 45000,
    },
    purchased: false,
  },
  {
    id: 'duchy_auto_port_1',
    name: 'Automated Port Construction',
    description: 'Automatically buys 1 grand port every 60 seconds',
    cost: 6000,
    tier: TierType.Duchy,
    prerequisite: 'duchy_auto_palace_1',
    effect: {
      type: 'auto_building',
      buildingId: 'duchy_port',
      interval: 60000,
    },
    purchased: false,
  },
  {
    id: 'duchy_auto_academy_1',
    name: 'Automated Academy Construction',
    description: 'Automatically buys 1 royal academy every 90 seconds',
    cost: 9000,
    tier: TierType.Duchy,
    prerequisite: 'duchy_auto_palace_1',
    effect: {
      type: 'auto_building',
      buildingId: 'duchy_academy',
      interval: 90000,
    },
    purchased: false,
  },
  {
    id: 'duchy_auto_mint_1',
    name: 'Automated Mint Construction',
    description: 'Automatically buys 1 mint every 120 seconds',
    cost: 12000,
    tier: TierType.Duchy,
    prerequisite: 'duchy_auto_port_1',
    effect: {
      type: 'auto_building',
      buildingId: 'duchy_mint',
      interval: 120000,
    },
    purchased: false,
  },
  {
    id: 'duchy_auto_fleet_1',
    name: 'Automated Fleet Construction',
    description: 'Automatically buys 1 merchant fleet every 150 seconds',
    cost: 16000,
    tier: TierType.Duchy,
    prerequisite: 'duchy_auto_academy_1',
    effect: {
      type: 'auto_building',
      buildingId: 'duchy_fleet',
      interval: 150000,
    },
    purchased: false,
  },

  // Realm Research
  {
    id: 'realm_cost_reduction_1',
    name: 'Realm Engineering I',
    description: 'Reduces all realm building costs by 20%',
    cost: 8000,
    tier: TierType.Realm,
    effect: {
      type: 'cost_reduction',
      value: 0.8,
    },
    purchased: false,
  },
  {
    id: 'realm_scaling_reduction_1',
    name: 'Realm Mass Production I',
    description: 'Reduces realm building cost scaling',
    cost: 12000,
    tier: TierType.Realm,
    effect: {
      type: 'cost_scaling_reduction',
      value: 0.07,
    },
    purchased: false,
  },

  // Realm Automation
  {
    id: 'realm_auto_citadel_1',
    name: 'Automated Citadel Construction',
    description: 'Automatically buys 1 citadel every 45 seconds',
    cost: 10000,
    tier: TierType.Realm,
    effect: {
      type: 'auto_building',
      buildingId: 'realm_citadel',
      interval: 45000,
    },
    purchased: false,
  },
  {
    id: 'realm_auto_metropolis_1',
    name: 'Automated Metropolis Construction',
    description: 'Automatically buys 1 metropolis every 60 seconds',
    cost: 15000,
    tier: TierType.Realm,
    prerequisite: 'realm_auto_citadel_1',
    effect: {
      type: 'auto_building',
      buildingId: 'realm_metropolis',
      interval: 60000,
    },
    purchased: false,
  },
  {
    id: 'realm_auto_wonder_1',
    name: 'Automated Wonder Construction',
    description: 'Automatically buys 1 wonder every 90 seconds',
    cost: 22000,
    tier: TierType.Realm,
    prerequisite: 'realm_auto_citadel_1',
    effect: {
      type: 'auto_building',
      buildingId: 'realm_wonder',
      interval: 90000,
    },
    purchased: false,
  },
  {
    id: 'realm_auto_oracle_1',
    name: 'Automated Oracle Construction',
    description: 'Automatically buys 1 oracle every 120 seconds',
    cost: 30000,
    tier: TierType.Realm,
    prerequisite: 'realm_auto_metropolis_1',
    effect: {
      type: 'auto_building',
      buildingId: 'realm_oracle',
      interval: 120000,
    },
    purchased: false,
  },
  {
    id: 'realm_auto_exchange_1',
    name: 'Automated Exchange Construction',
    description: 'Automatically buys 1 grand exchange every 150 seconds',
    cost: 40000,
    tier: TierType.Realm,
    prerequisite: 'realm_auto_wonder_1',
    effect: {
      type: 'auto_building',
      buildingId: 'realm_exchange',
      interval: 150000,
    },
    purchased: false,
  },

  // Kingdom Research
  {
    id: 'kingdom_cost_reduction_1',
    name: 'Royal Engineering I',
    description: 'Reduces all kingdom building costs by 22%',
    cost: 20000,
    tier: TierType.Kingdom,
    effect: {
      type: 'cost_reduction',
      value: 0.78,
    },
    purchased: false,
  },
  {
    id: 'kingdom_scaling_reduction_1',
    name: 'Royal Mass Production I',
    description: 'Reduces kingdom building cost scaling',
    cost: 30000,
    tier: TierType.Kingdom,
    effect: {
      type: 'cost_scaling_reduction',
      value: 0.08,
    },
    purchased: false,
  },

  // Kingdom Automation
  {
    id: 'kingdom_auto_capital_1',
    name: 'Automated Capital Construction',
    description: 'Automatically buys 1 capital every 45 seconds',
    cost: 25000,
    tier: TierType.Kingdom,
    effect: {
      type: 'auto_building',
      buildingId: 'kingdom_capital',
      interval: 45000,
    },
    purchased: false,
  },
  {
    id: 'kingdom_auto_empire_1',
    name: 'Automated Empire District Construction',
    description: 'Automatically buys 1 empire district every 60 seconds',
    cost: 40000,
    tier: TierType.Kingdom,
    prerequisite: 'kingdom_auto_capital_1',
    effect: {
      type: 'auto_building',
      buildingId: 'kingdom_empire',
      interval: 60000,
    },
    purchased: false,
  },
  {
    id: 'kingdom_auto_monument_1',
    name: 'Automated Monument Construction',
    description: 'Automatically buys 1 eternal monument every 90 seconds',
    cost: 55000,
    tier: TierType.Kingdom,
    prerequisite: 'kingdom_auto_capital_1',
    effect: {
      type: 'auto_building',
      buildingId: 'kingdom_monument',
      interval: 90000,
    },
    purchased: false,
  },
  {
    id: 'kingdom_auto_treasury_1',
    name: 'Automated Treasury Construction',
    description: 'Automatically buys 1 royal treasury every 120 seconds',
    cost: 75000,
    tier: TierType.Kingdom,
    prerequisite: 'kingdom_auto_empire_1',
    effect: {
      type: 'auto_building',
      buildingId: 'kingdom_treasury',
      interval: 120000,
    },
    purchased: false,
  },
  {
    id: 'kingdom_auto_records_1',
    name: 'Automated Records Construction',
    description: 'Automatically buys 1 hall of records every 150 seconds',
    cost: 100000,
    tier: TierType.Kingdom,
    prerequisite: 'kingdom_auto_monument_1',
    effect: {
      type: 'auto_building',
      buildingId: 'kingdom_records',
      interval: 150000,
    },
    purchased: false,
  },
];
