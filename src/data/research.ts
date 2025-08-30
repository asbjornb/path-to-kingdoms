import { ResearchUpgrade } from '../types/game';

export const RESEARCH_DATA: ResearchUpgrade[] = [
  {
    id: 'autobuy_unlock',
    name: 'Automated Purchasing',
    description: 'Enables automatic building purchases',
    cost: 5,
    effect: {
      type: 'autobuy_speed',
      value: 1,
    },
    purchased: false,
  },
  {
    id: 'autobuy_speed_1',
    name: 'Faster Automation',
    description: 'Increases autobuy speed by 50%',
    cost: 10,
    effect: {
      type: 'autobuy_speed',
      value: 1.5,
    },
    purchased: false,
  },
  {
    id: 'bulk_buy_10',
    name: 'Bulk Construction',
    description: 'Buy 10 buildings at once',
    cost: 15,
    effect: {
      type: 'bulk_buy',
      value: 10,
    },
    purchased: false,
  },
  {
    id: 'cost_reduction_1',
    name: 'Efficient Building',
    description: 'Reduces all building costs by 10%',
    cost: 20,
    effect: {
      type: 'cost_reduction',
      value: 0.9,
    },
    purchased: false,
  },
  {
    id: 'autobuy_speed_2',
    name: 'Rapid Automation',
    description: 'Doubles autobuy speed',
    cost: 30,
    effect: {
      type: 'autobuy_speed',
      value: 2,
    },
    purchased: false,
  },
];
