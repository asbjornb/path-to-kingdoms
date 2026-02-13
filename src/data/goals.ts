import { Goal, GoalType, TierType } from '../types/game';
import { TIER_DATA } from './tiers';

// Tier difficulty multiplier: each tier is slightly harder relative to its economic baseline
const TIER_DIFFICULTY: Record<TierType, number> = {
  [TierType.Hamlet]: 1.0,
  [TierType.Village]: 1.1,
  [TierType.Town]: 1.2,
  [TierType.City]: 1.3,
  [TierType.County]: 1.4,
  [TierType.Duchy]: 1.5,
  [TierType.Realm]: 1.6,
  [TierType.Kingdom]: 1.7,
};

export const GoalGenerator = {
  goalCounter: 0,

  /**
   * Get the economic scale factor for a tier relative to Hamlet.
   * Uses the tier's average building income to determine scaling.
   */
  getTierScale(tierType: TierType): number {
    const tierDef = TIER_DATA.find((t) => t.type === tierType);
    const hamletDef = TIER_DATA.find((t) => t.type === TierType.Hamlet);
    if (!tierDef || !hamletDef) return 1;

    const tierAvgIncome =
      tierDef.buildings.reduce((sum, b) => sum + b.baseIncome, 0) / tierDef.buildings.length;
    const hamletAvgIncome =
      hamletDef.buildings.reduce((sum, b) => sum + b.baseIncome, 0) / hamletDef.buildings.length;

    return tierAvgIncome / hamletAvgIncome;
  },

  getCostScale(tierType: TierType): number {
    const tierDef = TIER_DATA.find((t) => t.type === tierType);
    const hamletDef = TIER_DATA.find((t) => t.type === TierType.Hamlet);
    if (!tierDef || !hamletDef) return 1;

    const tierFirstCost = tierDef.buildings[0]?.baseCost ?? 10;
    const hamletFirstCost = hamletDef.buildings[0]?.baseCost ?? 10;

    return tierFirstCost / hamletFirstCost;
  },

  getAllGoalTemplates(tierType: TierType): Goal[] {
    const tierDef = TIER_DATA.find((t) => t.type === tierType);
    if (!tierDef) return [];

    const incomeScale = this.getTierScale(tierType);
    const costScale = this.getCostScale(tierType);
    const difficulty = TIER_DIFFICULTY[tierType];

    const templates: Array<{
      type: GoalType;
      baseValue: number;
      description: string;
      buildingId?: string;
    }> = [
      // Income goals (scaled by tier income level and difficulty)
      {
        type: GoalType.ReachIncome,
        baseValue: Math.round(500 * incomeScale * difficulty),
        description: 'Reach {value} income per second',
      },

      // Lifetime currency goals (scaled by tier cost level and difficulty)
      {
        type: GoalType.AccumulateCurrency,
        baseValue: Math.round(100000 * costScale * difficulty),
        description: 'Earn {value} total currency',
      },
      {
        type: GoalType.AccumulateCurrency,
        baseValue: Math.round(150000 * costScale * difficulty),
        description: 'Earn {value} total currency',
      },

      // Current currency goals (scaled by tier cost level and difficulty)
      {
        type: GoalType.CurrentCurrency,
        baseValue: Math.round(10000 * costScale * difficulty),
        description: 'Have {value} currency at once',
      },
      {
        type: GoalType.CurrentCurrency,
        baseValue: Math.round(20000 * costScale * difficulty),
        description: 'Have {value} currency at once',
      },

      // Prosperity goals (time-based, accelerated by income)
      {
        type: GoalType.Survival,
        baseValue: Math.round(600 * difficulty),
        description: 'Prosper for {minutes} minutes',
      },
      {
        type: GoalType.Survival,
        baseValue: Math.round(900 * difficulty),
        description: 'Prosper for {minutes} minutes',
      },
    ];

    // Building count goals (one for each building type, scaled by difficulty)
    const buildingIndex = tierDef.buildings.length;
    tierDef.buildings.forEach((building, i) => {
      // Cheaper buildings get higher targets, expensive buildings get lower targets
      const positionFactor = 1 - (i / buildingIndex) * 0.6; // 1.0 down to 0.4
      const targetCount = Math.round(30 * positionFactor * difficulty);

      templates.push({
        type: GoalType.BuildingCount,
        baseValue: targetCount,
        description: `Build ${targetCount} ${building.name}s`,
        buildingId: building.id,
      });
    });

    return templates.map((t) => ({
      id: `goal_${this.goalCounter++}`,
      type: t.type,
      description: this.formatDescription(t.description, t.baseValue),
      targetValue: t.baseValue,
      currentValue: 0,
      isCompleted: false,
      buildingId: t.buildingId,
    }));
  },

  generateRandomGoals(tierType: TierType, count: number = 1): Goal[] {
    const allTemplates = this.getAllGoalTemplates(tierType);
    const shuffled = [...allTemplates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  formatDescription(description: string, value: number): string {
    if (description.includes('{minutes}')) {
      return description.replace('{minutes}', Math.floor(value / 60).toString());
    }
    return description.replace('{value}', this.formatNumber(value));
  },

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  },
};
