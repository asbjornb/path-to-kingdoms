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
];
