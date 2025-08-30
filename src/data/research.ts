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
  {
    id: 'hamlet_autobuy_unlock',
    name: 'Hamlet Automated Purchasing',
    description: 'Enables automatic building purchases for hamlets',
    cost: 100,
    tier: TierType.Hamlet,
    effect: {
      type: 'autobuy_speed',
      value: 1,
    },
    purchased: false,
  },

  // Village Research (unlocked when villages are unlocked)
  {
    id: 'village_parallel_2',
    name: 'Dual Village Management',
    description: 'Run 2 villages in parallel',
    cost: 50,
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
    cost: 200,
    tier: TierType.Village,
    prerequisite: 'village_parallel_2',
    effect: {
      type: 'parallel_slots',
      value: 3,
    },
    purchased: false,
  },
  // More village research can be added later...

  // Town Research (unlocked when towns are unlocked)
  {
    id: 'town_parallel_2',
    name: 'Dual Town Management',
    description: 'Run 2 towns in parallel',
    cost: 50,
    tier: TierType.Town,
    effect: {
      type: 'parallel_slots',
      value: 2,
    },
    purchased: false,
  },
  // More tiers can be added later...
];
