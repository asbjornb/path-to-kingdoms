import { ResearchUpgrade, TierType } from '../types/game';

// Shared research costs — all tiers use the same costs as Hamlet (the baseline).
// Later tiers are already harder by virtue of being harder to reach, so
// research costs should not scale up.
const RESEARCH_COSTS = {
  costReduction: [25, 75, 225],
  startingIncome: [5, 15, 50],
  foundationPlanning: 25,
  autoBuilding: [15, 30, 45, 75, 100, 200],
  expansionEfficiency: 500,
};

// ===== Auto-building generator =====

interface AutoBuildingSpec {
  buildingId: string;
  name: string;
  description: string;
  interval: number;
  prerequisite?: string;
}

function generateAutoBuilding(
  tier: TierType,
  prefix: string,
  buildings: AutoBuildingSpec[],
): ResearchUpgrade[] {
  return buildings.map(
    (b, i): ResearchUpgrade => ({
      id: `${prefix}_auto_${b.buildingId.replace(`${prefix}_`, '')}_1`,
      name: b.name,
      description: b.description,
      cost: RESEARCH_COSTS.autoBuilding[i],
      tier,
      ...(b.prerequisite != null ? { prerequisite: b.prerequisite } : {}),
      effect: {
        type: 'auto_building',
        buildingId: b.buildingId,
        interval: b.interval,
      },
      purchased: false,
    }),
  );
}

// ===== Foundation planning generator =====

function generateFoundationPlanning(
  tiers: { tier: TierType; prefix: string }[],
): ResearchUpgrade[] {
  return tiers.map(
    ({ tier, prefix }): ResearchUpgrade => ({
      id: `${prefix}_foundation_planning_1`,
      name: 'Foundation Planning',
      description: '1 of each building type has flat cost (no scaling)',
      cost: RESEARCH_COSTS.foundationPlanning,
      tier,
      effect: {
        type: 'flat_cost_count',
        value: 1,
      },
      purchased: false,
    }),
  );
}

// ===== Expansion efficiency generator =====

function generateExpansionEfficiency(
  tiers: { tier: TierType; prefix: string }[],
): ResearchUpgrade[] {
  return tiers.map(
    ({ tier, prefix }): ResearchUpgrade => ({
      id: `${prefix}_expansion_efficiency_1`,
      name: 'Expansion Efficiency',
      description: `Reduces ${prefix} completions needed to advance tiers by 1 (6→5)`,
      cost: RESEARCH_COSTS.expansionEfficiency,
      tier,
      effect: {
        type: 'tier_requirement_reduction',
        value: 1,
      },
      purchased: false,
    }),
  );
}

// ===== Per-tier auto-building configs =====

const VILLAGE_AUTO_BUILDINGS: AutoBuildingSpec[] = [
  {
    buildingId: 'village_cottage',
    name: 'Automated Cottage Construction',
    description: 'Automatically buys 1 cottage every 45 seconds',
    interval: 45000,
  },
  {
    buildingId: 'village_farm',
    name: 'Automated Farm Development',
    description: 'Automatically buys 1 farm every 90 seconds',
    interval: 90000,
    prerequisite: 'village_auto_cottage_1',
  },
  {
    buildingId: 'village_mill',
    name: 'Automated Mill Operation',
    description: 'Automatically buys 1 mill every 60 seconds',
    interval: 60000,
    prerequisite: 'village_auto_farm_1',
  },
  {
    buildingId: 'village_chapel',
    name: 'Automated Chapel Construction',
    description: 'Automatically buys 1 chapel every 90 seconds',
    interval: 90000,
    prerequisite: 'village_auto_cottage_1',
  },
  {
    buildingId: 'village_well',
    name: 'Automated Well Digging',
    description: 'Automatically buys 1 village well every 120 seconds',
    interval: 120000,
    prerequisite: 'village_auto_mill_1',
  },
  {
    buildingId: 'village_herbalist',
    name: 'Automated Herbalist Setup',
    description: 'Automatically buys 1 herbalist every 150 seconds',
    interval: 150000,
    prerequisite: 'village_auto_chapel_1',
  },
];

const TOWN_AUTO_BUILDINGS: AutoBuildingSpec[] = [
  {
    buildingId: 'town_house',
    name: 'Automated House Construction',
    description: 'Automatically buys 1 town house every 45 seconds',
    interval: 45000,
  },
  {
    buildingId: 'town_market',
    name: 'Automated Market Construction',
    description: 'Automatically buys 1 market every 60 seconds',
    interval: 60000,
    prerequisite: 'town_auto_house_1',
  },
  {
    buildingId: 'town_forge',
    name: 'Automated Forge Construction',
    description: 'Automatically buys 1 forge every 90 seconds',
    interval: 90000,
    prerequisite: 'town_auto_house_1',
  },
  {
    buildingId: 'town_guild',
    name: 'Automated Guild Construction',
    description: 'Automatically buys 1 guild hall every 120 seconds',
    interval: 120000,
    prerequisite: 'town_auto_market_1',
  },
  {
    buildingId: 'town_watchtower',
    name: 'Automated Watchtower Construction',
    description: 'Automatically buys 1 watchtower every 150 seconds',
    interval: 150000,
    prerequisite: 'town_auto_forge_1',
  },
  {
    buildingId: 'town_granary',
    name: 'Automated Granary Construction',
    description: 'Automatically buys 1 granary every 180 seconds',
    interval: 180000,
    prerequisite: 'town_auto_guild_1',
  },
];

const CITY_AUTO_BUILDINGS: AutoBuildingSpec[] = [
  {
    buildingId: 'city_apartment',
    name: 'Automated Apartment Construction',
    description: 'Automatically buys 1 apartment every 45 seconds',
    interval: 45000,
  },
  {
    buildingId: 'city_bazaar',
    name: 'Automated Bazaar Construction',
    description: 'Automatically buys 1 grand bazaar every 60 seconds',
    interval: 60000,
    prerequisite: 'city_auto_apartment_1',
  },
  {
    buildingId: 'city_university',
    name: 'Automated University Construction',
    description: 'Automatically buys 1 university every 90 seconds',
    interval: 90000,
    prerequisite: 'city_auto_apartment_1',
  },
  {
    buildingId: 'city_cathedral',
    name: 'Automated Cathedral Construction',
    description: 'Automatically buys 1 cathedral every 120 seconds',
    interval: 120000,
    prerequisite: 'city_auto_bazaar_1',
  },
  {
    buildingId: 'city_observatory',
    name: 'Automated Observatory Construction',
    description: 'Automatically buys 1 observatory every 150 seconds',
    interval: 150000,
    prerequisite: 'city_auto_university_1',
  },
  {
    buildingId: 'city_trade_guild',
    name: 'Automated Trade Guild Construction',
    description: 'Automatically buys 1 trade guild every 180 seconds',
    interval: 180000,
    prerequisite: 'city_auto_cathedral_1',
  },
];

const COUNTY_AUTO_BUILDINGS: AutoBuildingSpec[] = [
  {
    buildingId: 'county_manor',
    name: 'Automated Manor Construction',
    description: 'Automatically buys 1 manor every 45 seconds',
    interval: 45000,
  },
  {
    buildingId: 'county_plantation',
    name: 'Automated Plantation Development',
    description: 'Automatically buys 1 plantation every 60 seconds',
    interval: 60000,
    prerequisite: 'county_auto_manor_1',
  },
  {
    buildingId: 'county_fortress',
    name: 'Automated Fortress Construction',
    description: 'Automatically buys 1 fortress every 90 seconds',
    interval: 90000,
    prerequisite: 'county_auto_manor_1',
  },
  {
    buildingId: 'county_courthouse',
    name: 'Automated Courthouse Construction',
    description: 'Automatically buys 1 courthouse every 120 seconds',
    interval: 120000,
    prerequisite: 'county_auto_plantation_1',
  },
  {
    buildingId: 'county_tax_office',
    name: 'Automated Tax Office Construction',
    description: 'Automatically buys 1 tax office every 150 seconds',
    interval: 150000,
    prerequisite: 'county_auto_fortress_1',
  },
];

const DUCHY_AUTO_BUILDINGS: AutoBuildingSpec[] = [
  {
    buildingId: 'duchy_palace',
    name: 'Automated Palace Construction',
    description: 'Automatically buys 1 palace every 45 seconds',
    interval: 45000,
  },
  {
    buildingId: 'duchy_port',
    name: 'Automated Port Construction',
    description: 'Automatically buys 1 grand port every 60 seconds',
    interval: 60000,
    prerequisite: 'duchy_auto_palace_1',
  },
  {
    buildingId: 'duchy_academy',
    name: 'Automated Academy Construction',
    description: 'Automatically buys 1 royal academy every 90 seconds',
    interval: 90000,
    prerequisite: 'duchy_auto_palace_1',
  },
  {
    buildingId: 'duchy_mint',
    name: 'Automated Mint Construction',
    description: 'Automatically buys 1 mint every 120 seconds',
    interval: 120000,
    prerequisite: 'duchy_auto_port_1',
  },
  {
    buildingId: 'duchy_fleet',
    name: 'Automated Fleet Construction',
    description: 'Automatically buys 1 merchant fleet every 150 seconds',
    interval: 150000,
    prerequisite: 'duchy_auto_academy_1',
  },
];

const REALM_AUTO_BUILDINGS: AutoBuildingSpec[] = [
  {
    buildingId: 'realm_citadel',
    name: 'Automated Citadel Construction',
    description: 'Automatically buys 1 citadel every 45 seconds',
    interval: 45000,
  },
  {
    buildingId: 'realm_metropolis',
    name: 'Automated Metropolis Construction',
    description: 'Automatically buys 1 metropolis every 60 seconds',
    interval: 60000,
    prerequisite: 'realm_auto_citadel_1',
  },
  {
    buildingId: 'realm_wonder',
    name: 'Automated Wonder Construction',
    description: 'Automatically buys 1 wonder every 90 seconds',
    interval: 90000,
    prerequisite: 'realm_auto_citadel_1',
  },
  {
    buildingId: 'realm_oracle',
    name: 'Automated Oracle Construction',
    description: 'Automatically buys 1 oracle every 120 seconds',
    interval: 120000,
    prerequisite: 'realm_auto_metropolis_1',
  },
  {
    buildingId: 'realm_exchange',
    name: 'Automated Exchange Construction',
    description: 'Automatically buys 1 grand exchange every 150 seconds',
    interval: 150000,
    prerequisite: 'realm_auto_wonder_1',
  },
];

const KINGDOM_AUTO_BUILDINGS: AutoBuildingSpec[] = [
  {
    buildingId: 'kingdom_capital',
    name: 'Automated Capital Construction',
    description: 'Automatically buys 1 capital every 45 seconds',
    interval: 45000,
  },
  {
    buildingId: 'kingdom_empire',
    name: 'Automated Empire District Construction',
    description: 'Automatically buys 1 empire district every 60 seconds',
    interval: 60000,
    prerequisite: 'kingdom_auto_capital_1',
  },
  {
    buildingId: 'kingdom_monument',
    name: 'Automated Monument Construction',
    description: 'Automatically buys 1 eternal monument every 90 seconds',
    interval: 90000,
    prerequisite: 'kingdom_auto_capital_1',
  },
  {
    buildingId: 'kingdom_treasury',
    name: 'Automated Treasury Construction',
    description: 'Automatically buys 1 royal treasury every 120 seconds',
    interval: 120000,
    prerequisite: 'kingdom_auto_empire_1',
  },
  {
    buildingId: 'kingdom_records',
    name: 'Automated Records Construction',
    description: 'Automatically buys 1 hall of records every 150 seconds',
    interval: 150000,
    prerequisite: 'kingdom_auto_monument_1',
  },
];

// ===== RESEARCH DATA =====

export const RESEARCH_DATA: ResearchUpgrade[] = [
  // ===== HAMLET RESEARCH =====

  {
    id: 'hamlet_parallel_2',
    name: 'Dual Hamlet Management',
    description: '+1 hamlet parallel slot',
    cost: 50,
    tier: TierType.Hamlet,
    effect: {
      type: 'parallel_slots',
      value: 1,
    },
    purchased: false,
  },
  {
    id: 'hamlet_parallel_3',
    name: 'Triple Hamlet Management',
    description: '+1 hamlet parallel slot',
    cost: 200,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_parallel_2',
    effect: {
      type: 'parallel_slots',
      value: 1,
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
    cost: RESEARCH_COSTS.startingIncome[0],
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
    cost: RESEARCH_COSTS.startingIncome[1],
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
    cost: RESEARCH_COSTS.startingIncome[2],
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
      interval: 30000,
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
      interval: 20000,
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
      interval: 10000,
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
      interval: 60000,
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
      interval: 40000,
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
      interval: 20000,
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
      interval: 90000,
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
      interval: 60000,
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
      interval: 30000,
    },
    purchased: false,
  },

  {
    id: 'hamlet_auto_shrine_1',
    name: 'Automated Shrine Construction I',
    description: 'Automatically buys 1 shrine every 120 seconds',
    cost: 75,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_hut_1',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_shrine',
      interval: 120000,
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
      interval: 80000,
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
      interval: 40000,
    },
    purchased: false,
  },

  {
    id: 'hamlet_auto_market_1',
    name: 'Automated Market Construction I',
    description: 'Automatically buys 1 market stall every 150 seconds',
    cost: 100,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_garden_1',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_market',
      interval: 150000,
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
      interval: 100000,
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
      interval: 50000,
    },
    purchased: false,
  },

  {
    id: 'hamlet_auto_library_1',
    name: 'Automated Library Construction I',
    description: 'Automatically buys 1 library every 300 seconds',
    cost: 200,
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_auto_workshop_1',
    effect: {
      type: 'auto_building',
      buildingId: 'hamlet_library',
      interval: 300000,
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
      interval: 200000,
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
      interval: 120000,
    },
    purchased: false,
  },

  // Building Cost Reduction Research
  {
    id: 'hamlet_cost_reduction_1',
    name: 'Efficient Construction I',
    description: 'Reduces all building costs by 5%',
    cost: RESEARCH_COSTS.costReduction[0],
    tier: TierType.Hamlet,
    effect: {
      type: 'cost_reduction',
      value: 0.95,
    },
    purchased: false,
  },
  {
    id: 'hamlet_cost_reduction_2',
    name: 'Efficient Construction II',
    description: 'Reduces all building costs by 10%',
    cost: RESEARCH_COSTS.costReduction[1],
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_cost_reduction_1',
    effect: {
      type: 'cost_reduction',
      value: 0.9,
    },
    purchased: false,
  },
  {
    id: 'hamlet_cost_reduction_3',
    name: 'Efficient Construction III',
    description: 'Reduces all building costs by 15%',
    cost: RESEARCH_COSTS.costReduction[2],
    tier: TierType.Hamlet,
    prerequisite: 'hamlet_cost_reduction_2',
    effect: {
      type: 'cost_reduction',
      value: 0.85,
    },
    purchased: false,
  },

  // ===== VILLAGE RESEARCH =====

  // Village Starting Income
  {
    id: 'village_starting_income_1',
    name: 'Village Foundation Funds',
    description: '+50 starting income for new villages',
    cost: RESEARCH_COSTS.startingIncome[0],
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
    cost: RESEARCH_COSTS.startingIncome[1],
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
    cost: RESEARCH_COSTS.costReduction[0],
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
    cost: RESEARCH_COSTS.costReduction[1],
    tier: TierType.Village,
    prerequisite: 'village_cost_reduction_1',
    effect: {
      type: 'cost_reduction',
      value: 0.84,
    },
    purchased: false,
  },

  // Village Automation
  ...generateAutoBuilding(TierType.Village, 'village', VILLAGE_AUTO_BUILDINGS),

  // Village → Hamlet parallel slot upgrade
  {
    id: 'hamlet_parallel_4',
    name: 'Quad Hamlet Management',
    description: '+1 hamlet parallel slot',
    cost: 200,
    tier: TierType.Village,
    prerequisite: 'hamlet_parallel_3',
    effect: {
      type: 'parallel_slots',
      value: 1,
    },
    purchased: false,
  },

  // ===== TOWN RESEARCH =====

  // Town Starting Income
  {
    id: 'town_starting_income_1',
    name: 'Town Development Fund',
    description: '+500 starting income for new towns',
    cost: RESEARCH_COSTS.startingIncome[0],
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
    cost: RESEARCH_COSTS.startingIncome[1],
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
    cost: RESEARCH_COSTS.costReduction[0],
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
    cost: RESEARCH_COSTS.costReduction[1],
    tier: TierType.Town,
    prerequisite: 'town_cost_reduction_1',
    effect: {
      type: 'cost_reduction',
      value: 0.8,
    },
    purchased: false,
  },

  // Town Automation
  ...generateAutoBuilding(TierType.Town, 'town', TOWN_AUTO_BUILDINGS),

  // Town → Hamlet parallel slot upgrade
  {
    id: 'hamlet_parallel_5',
    name: 'Penta Hamlet Management',
    description: '+1 hamlet parallel slot',
    cost: 50,
    tier: TierType.Town,
    prerequisite: 'hamlet_parallel_4',
    effect: {
      type: 'parallel_slots',
      value: 1,
    },
    purchased: false,
  },

  // ===== CITY RESEARCH =====

  // City Starting Income
  {
    id: 'city_starting_income_1',
    name: 'City Development Grant',
    description: '+5000 starting income for new cities',
    cost: RESEARCH_COSTS.startingIncome[0],
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
    cost: RESEARCH_COSTS.costReduction[0],
    tier: TierType.City,
    effect: {
      type: 'cost_reduction',
      value: 0.88,
    },
    purchased: false,
  },

  // City Automation
  ...generateAutoBuilding(TierType.City, 'city', CITY_AUTO_BUILDINGS),

  // ===== TIER REQUIREMENT REDUCTION (per-tier, tier-scoped) =====

  ...generateExpansionEfficiency([
    { tier: TierType.Hamlet, prefix: 'hamlet' },
    { tier: TierType.Village, prefix: 'village' },
    { tier: TierType.Town, prefix: 'town' },
    { tier: TierType.City, prefix: 'city' },
    { tier: TierType.County, prefix: 'county' },
    { tier: TierType.Duchy, prefix: 'duchy' },
    { tier: TierType.Realm, prefix: 'realm' },
  ]),

  // ===== FOUNDATION PLANNING (per-tier, tier-scoped) =====

  ...generateFoundationPlanning([
    { tier: TierType.Hamlet, prefix: 'hamlet' },
    { tier: TierType.Village, prefix: 'village' },
    { tier: TierType.Town, prefix: 'town' },
    { tier: TierType.City, prefix: 'city' },
    { tier: TierType.County, prefix: 'county' },
    { tier: TierType.Duchy, prefix: 'duchy' },
    { tier: TierType.Realm, prefix: 'realm' },
    { tier: TierType.Kingdom, prefix: 'kingdom' },
  ]),

  // ===== COUNTY RESEARCH =====

  {
    id: 'county_cost_reduction_1',
    name: 'County Construction Efficiency I',
    description: 'Reduces all county building costs by 15%',
    cost: RESEARCH_COSTS.costReduction[0],
    tier: TierType.County,
    effect: {
      type: 'cost_reduction',
      value: 0.85,
    },
    purchased: false,
  },
  // County Automation
  ...generateAutoBuilding(TierType.County, 'county', COUNTY_AUTO_BUILDINGS),

  // ===== DUCHY RESEARCH =====

  {
    id: 'duchy_cost_reduction_1',
    name: 'Ducal Engineering I',
    description: 'Reduces all duchy building costs by 18%',
    cost: RESEARCH_COSTS.costReduction[0],
    tier: TierType.Duchy,
    effect: {
      type: 'cost_reduction',
      value: 0.82,
    },
    purchased: false,
  },
  // Duchy Automation
  ...generateAutoBuilding(TierType.Duchy, 'duchy', DUCHY_AUTO_BUILDINGS),

  // ===== REALM RESEARCH =====

  {
    id: 'realm_cost_reduction_1',
    name: 'Realm Engineering I',
    description: 'Reduces all realm building costs by 20%',
    cost: RESEARCH_COSTS.costReduction[0],
    tier: TierType.Realm,
    effect: {
      type: 'cost_reduction',
      value: 0.8,
    },
    purchased: false,
  },
  // Realm Automation
  ...generateAutoBuilding(TierType.Realm, 'realm', REALM_AUTO_BUILDINGS),

  // ===== KINGDOM RESEARCH =====

  {
    id: 'kingdom_cost_reduction_1',
    name: 'Royal Engineering I',
    description: 'Reduces all kingdom building costs by 22%',
    cost: RESEARCH_COSTS.costReduction[0],
    tier: TierType.Kingdom,
    effect: {
      type: 'cost_reduction',
      value: 0.78,
    },
    purchased: false,
  },
  // Kingdom Automation
  ...generateAutoBuilding(TierType.Kingdom, 'kingdom', KINGDOM_AUTO_BUILDINGS),
];
