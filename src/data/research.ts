import { ResearchUpgrade } from '../types/game';

export const RESEARCH_DATA: ResearchUpgrade[] = [
  {
    id: 'parallel_2',
    name: 'Dual Management',
    description: 'Run 2 settlements in parallel',
    cost: 1,
    effect: {
      type: 'parallel_slots',
      value: 2,
    },
    purchased: false,
  },
  {
    id: 'parallel_3',
    name: 'Triple Management',
    description: 'Run 3 settlements in parallel',
    cost: 2,
    effect: {
      type: 'parallel_slots',
      value: 3,
    },
    purchased: false,
  },
  {
    id: 'parallel_4',
    name: 'Quad Management',
    description: 'Run 4 settlements in parallel',
    cost: 4,
    effect: {
      type: 'parallel_slots',
      value: 4,
    },
    purchased: false,
  },
  {
    id: 'parallel_5',
    name: 'Penta Management',
    description: 'Run 5 settlements in parallel',
    cost: 8,
    effect: {
      type: 'parallel_slots',
      value: 5,
    },
    purchased: false,
  },
  {
    id: 'parallel_6',
    name: 'Hexa Management',
    description: 'Run 6 settlements in parallel',
    cost: 16,
    effect: {
      type: 'parallel_slots',
      value: 6,
    },
    purchased: false,
  },
  {
    id: 'autobuy_unlock',
    name: 'Automated Purchasing',
    description: 'Enables automatic building purchases',
    cost: 32,
    effect: {
      type: 'autobuy_speed',
      value: 1,
    },
    purchased: false,
  },
];
