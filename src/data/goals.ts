import { Goal, GoalType, TierType } from '../types/game';
import { TIER_DATA } from './tiers';

// Tier difficulty multiplier: calibrated primarily for AccumulateCurrency (the most linear
// goal type). Other goal types apply their own dampening to account for nonlinear scaling.
const TIER_DIFFICULTY: Record<TierType, number> = {
  [TierType.Hamlet]: 1.2,
  [TierType.Village]: 4.0,
  [TierType.Town]: 4.0,
  [TierType.City]: 4.5,
  [TierType.County]: 3.5,
  [TierType.Duchy]: 3.5,
  [TierType.Realm]: 10.0,
  [TierType.Kingdom]: 6.0,
};

// Building goal scale: decoupled from TIER_DIFFICULTY because building costs grow
// exponentially and each tier has different effect synergies (goal_reduction, income_per_building)
// that dramatically change how fast buildings can be bought.
const BUILDING_TIER_SCALE: Record<TierType, number> = {
  [TierType.Hamlet]: 1.0,
  [TierType.Village]: 1.85,
  [TierType.Town]: 1.35,
  [TierType.City]: 1.9,
  [TierType.County]: 1.33,
  [TierType.Duchy]: 1.4,
  [TierType.Realm]: 2.5,
  [TierType.Kingdom]: 1.4,
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

    // Per-goal-type difficulty dampening: different goal types have very different
    // time-vs-target relationships. ReachIncome is highly nonlinear (exponential
    // building costs), while AccumulateCurrency is roughly linear.
    const incomeDifficulty = Math.pow(difficulty, 0.55);
    const currentCurrencyDifficulty = Math.pow(difficulty, 0.55);
    const survivalScale = 1 + Math.log10(Math.max(incomeScale, 1)) * 0.15;
    const buildingScale = BUILDING_TIER_SCALE[tierType];

    const templates: Array<{
      type: GoalType;
      baseValue: number;
      description: string;
      buildingId?: string;
    }> = [
      // Income goals: dampened difficulty (^0.55) because reaching high sustained income
      // requires exponentially more expensive buildings
      {
        type: GoalType.ReachIncome,
        baseValue: Math.round(500 * incomeScale * incomeDifficulty),
        description: 'Reach {value} income per second',
      },

      // Lifetime currency goals: linear difficulty (main tuning target)
      {
        type: GoalType.AccumulateCurrency,
        baseValue: Math.round(120000 * costScale * difficulty),
        description: 'Earn {value} total currency',
      },
      {
        type: GoalType.AccumulateCurrency,
        baseValue: Math.round(180000 * costScale * difficulty),
        description: 'Earn {value} total currency',
      },

      // Current currency goals: dampened (^0.55) since hoarding is harder
      // than accumulating over time, especially at high tiers
      {
        type: GoalType.CurrentCurrency,
        baseValue: Math.round(10000 * costScale * currentCurrencyDifficulty),
        description: 'Have {value} currency at once',
      },
      {
        type: GoalType.CurrentCurrency,
        baseValue: Math.round(20000 * costScale * currentCurrencyDifficulty),
        description: 'Have {value} currency at once',
      },

      // Currency spent goals: similar scaling to AccumulateCurrency but slightly lower
      // targets since players retain some currency as cash on hand
      {
        type: GoalType.CurrencySpent,
        baseValue: Math.round(110000 * costScale * difficulty),
        description: 'Spend {value} currency on buildings',
      },

      // Total buildings goals: uses BUILDING_TIER_SCALE (not TIER_DIFFICULTY) because
      // total building count is dominated by exponential cost curves. A higher flat base
      // (120) compensates for the spread-buying advantage vs individual BuildingCount goals.
      {
        type: GoalType.TotalBuildings,
        baseValue: Math.round(120 * buildingScale),
        description: 'Own {value} total buildings',
      },

      // Prosperity goals (time-based, accelerated by income)
      // Log-based income scaling compensates for income-driven acceleration at higher tiers
      {
        type: GoalType.Survival,
        baseValue: Math.round(600 * survivalScale * difficulty),
        description: 'Prosper for {minutes} minutes',
      },
      {
        type: GoalType.Survival,
        baseValue: Math.round(900 * survivalScale * difficulty),
        description: 'Prosper for {minutes} minutes',
      },
    ];

    // Building count goals (one for each building type)
    // Per-tier scale (decoupled from TIER_DIFFICULTY) with position factor (1.5x for cheapest,
    // 0.4x for most expensive). Cost multiplier adjustment reduces targets for buildings with
    // aggressive cost scaling (1.25+), dampened by position to avoid over-penalizing expensive
    // buildings that are quickly affordable once income is high.
    const buildingIndex = tierDef.buildings.length;
    tierDef.buildings.forEach((building, i) => {
      const positionFactor = 1.5 - (i / buildingIndex) * 1.1; // 1.5 down to 0.4
      const costMultAdjust = Math.pow(1.15 / building.costMultiplier, positionFactor * 2.5);
      const targetCount = Math.max(
        10,
        Math.round(30 * positionFactor * buildingScale * costMultAdjust),
      );

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
