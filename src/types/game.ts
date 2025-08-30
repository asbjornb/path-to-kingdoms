export enum TierType {
  Hamlet = 'hamlet',
  Village = 'village',
  Town = 'town',
  City = 'city',
  County = 'county',
  Duchy = 'duchy',
  Realm = 'realm',
  Kingdom = 'kingdom',
}

export interface Building {
  id: string;
  name: string;
  baseCost: number;
  baseIncome: number;
  costMultiplier: number;
  description?: string;
  effect?: {
    type: 'income_multiplier' | 'cost_reduction' | 'completion_bonus';
    value: number;
    description: string;
  };
}

export interface TierDefinition {
  type: TierType;
  name: string;
  unlockRequirement: number;
  completionThreshold: number;
  buildings: Building[];
}

export enum GoalType {
  ReachIncome = 'reach_income',
  AccumulateCurrency = 'accumulate_currency',
  BuildingCount = 'building_count',
  CurrentCurrency = 'current_currency',
  Survival = 'survival',
}

export interface Goal {
  id: string;
  type: GoalType;
  description: string;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  buildingId?: string; // For building count goals
}

export interface Settlement {
  id: string;
  tier: TierType;
  isComplete: boolean;
  currency: number;
  totalIncome: number;
  buildings: Map<string, number>;
  lifetimeCurrencyEarned: number;
  spawnTime: number;
  goals: Goal[];
}

export interface ResearchUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  tier: TierType;
  effect: {
    type:
      | 'autobuy_speed'
      | 'bulk_buy'
      | 'cost_reduction'
      | 'parallel_slots'
      | 'starting_income'
      | 'auto_building'
      | 'cost_scaling_reduction';
    value?: number;
    buildingId?: string; // For auto_building type
    interval?: number; // For auto_building type (in milliseconds)
  };
  purchased: boolean;
  prerequisite?: string; // ID of research that must be purchased first
}

export interface GameState {
  settlements: Settlement[];
  researchPoints: Map<TierType, number>; // Tier-specific research points
  unlockedTiers: Set<TierType>;
  completedSettlements: Map<TierType, number>;
  research: ResearchUpgrade[];
  autoBuildingTimers: Map<string, number>; // Track last auto-purchase time for each research upgrade
  settings: {
    autobuyEnabled: boolean;
    autobuyInterval: number;
    devModeEnabled: boolean;
    showCompletedResearch: boolean;
  };
}
