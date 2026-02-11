export type BuyAmount = 1 | 5 | 'max';

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
    type:
      | 'income_multiplier'
      | 'cost_reduction'
      | 'completion_bonus'
      | 'income_per_building'
      | 'goal_reduction'
      | 'production_boost';
    value: number;
    description: string;
    targetBuilding?: string; // For production_boost - which building ID to boost
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
  repeatable?: boolean; // If true, purchasing generates a more expensive next level
  level?: number; // Current level for repeatable research
}

export interface PrestigeUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  tier: TierType; // Which prestige currency to spend
  effect: {
    type:
      | 'prestige_income_multiplier'
      | 'prestige_cost_reduction'
      | 'prestige_research_bonus'
      | 'prestige_goal_reduction'
      | 'prestige_starting_currency'
      | 'prestige_autobuild_speed';
    value: number;
  };
  purchased: boolean;
  prerequisite?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  hidden?: boolean; // If true, description is also hidden until unlocked
  condition: {
    type:
      | 'tier_completions'
      | 'total_completions'
      | 'prestige_count'
      | 'speed_completion'
      | 'max_single_building'
      | 'max_currency_held'
      | 'settlement_count'
      | 'research_purchased'
      | 'near_broke'
      | 'specific_building_count';
    tier?: TierType;
    buildingId?: string; // For specific_building_count
    value: number;
  };
  bonus: {
    type: 'income_multiplier' | 'cost_reduction' | 'research_bonus' | 'starting_currency';
    value: number;
    description: string;
  };
  unlocked: boolean;
}

export interface GameState {
  settlements: Settlement[];
  researchPoints: Map<TierType, number>; // Tier-specific research points
  unlockedTiers: Set<TierType>;
  completedSettlements: Map<TierType, number>;
  research: ResearchUpgrade[];
  autoBuildingTimers: Map<string, number>; // Track last auto-purchase time for each research upgrade
  prestigeCurrency: Map<TierType, number>; // Prestige currency per tier (Village+)
  prestigeCount: number;
  lifetimeCompletions: Map<TierType, number>; // Persists through prestige resets
  prestigeUpgrades: PrestigeUpgrade[];
  achievements: Achievement[];
  settings: {
    autobuyEnabled: boolean;
    autobuyInterval: number;
    devModeEnabled: boolean;
    showCompletedResearch: boolean;
    buyAmount: BuyAmount;
    compactView: boolean;
  };
}

export interface SerializableSettlement {
  id: string;
  tier: TierType;
  isComplete: boolean;
  currency: number;
  totalIncome: number;
  buildings: [string, number][]; // Serialized Map
  lifetimeCurrencyEarned: number;
  spawnTime: number;
  goals: Goal[];
}

export interface SaveData {
  version: string; // Game version for compatibility checking
  timestamp: number; // When the save was created
  gameState: {
    settlements: SerializableSettlement[]; // Settlements with serialized Maps
    researchPoints: [TierType, number][]; // Serialized Map
    unlockedTiers: TierType[]; // Serialized Set
    completedSettlements: [TierType, number][]; // Serialized Map
    research: ResearchUpgrade[];
    autoBuildingTimers: [string, number][]; // Serialized Map
    prestigeCurrency?: [TierType, number][]; // Serialized Map
    prestigeCount?: number;
    lifetimeCompletions?: [TierType, number][]; // Serialized Map
    prestigeUpgrades?: PrestigeUpgrade[];
    achievements?: Achievement[];
    settings: {
      autobuyEnabled: boolean;
      autobuyInterval: number;
      devModeEnabled: boolean;
      showCompletedResearch: boolean;
      buyAmount: BuyAmount;
      compactView: boolean;
    };
  };
}
