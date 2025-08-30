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
  {
    id: 'hamlet_parallel_4',
    name: 'Quad Hamlet Management',
    description: 'Run 4 hamlets in parallel',
    cost: 800,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_parallel_3',
    effect: {
      type: 'parallel_slots',
      value: 4,
    },
    purchased: false,
  },
  {
    id: 'hamlet_parallel_5',
    name: 'Penta Hamlet Management',
    description: 'Run 5 hamlets in parallel',
    cost: 3200,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_parallel_4',
    effect: {
      type: 'parallel_slots',
      value: 5,
    },
    purchased: false,
  },
  {
    id: 'hamlet_parallel_6',
    name: 'Hexa Hamlet Management',
    description: 'Run 6 hamlets in parallel',
    cost: 12800,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_parallel_5',
    effect: {
      type: 'parallel_slots',
      value: 6,
    },
    purchased: false,
  },
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

  // Village Parallel Slots
  {
    id: 'village_parallel_2',
    name: 'Dual Village Management',
    description: 'Run 2 villages in parallel',
    cost: 100,
    tier: TierType.Village,
    effect: {
      type: 'parallel_slots',
      value: 2,
    },
    purchased: false,
  },
  {
    id: 'village_parallel_3',
    name: 'Triple Village Management',
    description: 'Run 3 villages in parallel',
    cost: 400,
    tier: TierType.Village,
    prerequisite: 'village_parallel_2',
    effect: {
      type: 'parallel_slots',
      value: 3,
    },
    purchased: false,
  },

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

  // ===== TOWN RESEARCH =====

  // Town Parallel Slots
  {
    id: 'town_parallel_2',
    name: 'Dual Town Administration',
    description: 'Run 2 towns in parallel',
    cost: 200,
    tier: TierType.Town,
    effect: {
      type: 'parallel_slots',
      value: 2,
    },
    purchased: false,
  },
  {
    id: 'town_parallel_3',
    name: 'Triple Town Administration',
    description: 'Run 3 towns in parallel',
    cost: 800,
    tier: TierType.Town,
    prerequisite: 'town_parallel_2',
    effect: {
      type: 'parallel_slots',
      value: 3,
    },
    purchased: false,
  },

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

  // ===== CITY RESEARCH =====

  // City Parallel Slots
  {
    id: 'city_parallel_2',
    name: 'Dual City Governance',
    description: 'Run 2 cities in parallel',
    cost: 500,
    tier: TierType.City,
    effect: {
      type: 'parallel_slots',
      value: 2,
    },
    purchased: false,
  },

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
];
