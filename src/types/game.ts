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

export interface Settlement {
  id: string;
  tier: TierType;
  isComplete: boolean;
  totalIncome: number;
  buildings: Map<string, number>;
}

export interface ResearchUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  tier: TierType;
  effect: {
    type: 'autobuy_speed' | 'bulk_buy' | 'cost_reduction' | 'parallel_slots';
    value: number;
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
  settings: {
    autobuyEnabled: boolean;
    autobuyInterval: number;
  };
}
