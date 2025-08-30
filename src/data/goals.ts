import { Goal, GoalType, TierType } from '../types/game';
import { TIER_DATA } from './tiers';

export const GoalGenerator = {
  goalCounter: 0,

  generateRandomGoals(tierType: TierType, count: number = 3): Goal[] {
    const goals: Goal[] = [];
    const tierDef = TIER_DATA.find((t) => t.type === tierType);
    if (!tierDef) return goals;

    // Available goal templates for hamlet tier
    const goalTemplates: Array<{
      type: GoalType;
      baseValue: number;
      description: string;
      buildingId?: string;
    }> = [
      // Income goals
      { type: GoalType.ReachIncome, baseValue: 50, description: 'Reach {value} income per second' },
      {
        type: GoalType.ReachIncome,
        baseValue: 100,
        description: 'Reach {value} income per second',
      },
      {
        type: GoalType.ReachIncome,
        baseValue: 200,
        description: 'Reach {value} income per second',
      },

      // Lifetime currency goals
      {
        type: GoalType.AccumulateCurrency,
        baseValue: 5000,
        description: 'Earn {value} total currency',
      },
      {
        type: GoalType.AccumulateCurrency,
        baseValue: 15000,
        description: 'Earn {value} total currency',
      },
      {
        type: GoalType.AccumulateCurrency,
        baseValue: 50000,
        description: 'Earn {value} total currency',
      },

      // Current currency goals
      {
        type: GoalType.CurrentCurrency,
        baseValue: 1000,
        description: 'Have {value} currency at once',
      },
      {
        type: GoalType.CurrentCurrency,
        baseValue: 2500,
        description: 'Have {value} currency at once',
      },
      {
        type: GoalType.CurrentCurrency,
        baseValue: 5000,
        description: 'Have {value} currency at once',
      },

      // Survival goals (in seconds)
      { type: GoalType.Survival, baseValue: 300, description: 'Survive for {minutes} minutes' }, // 5 min
      { type: GoalType.Survival, baseValue: 600, description: 'Survive for {minutes} minutes' }, // 10 min
      { type: GoalType.Survival, baseValue: 900, description: 'Survive for {minutes} minutes' }, // 15 min
    ];

    // Building count goals (one for each building type)
    tierDef.buildings.forEach((building) => {
      let targetCount = 40;
      if (building.id.includes('garden')) targetCount = 35;
      else if (building.id.includes('workshop')) targetCount = 30;
      else if (building.id.includes('shrine')) targetCount = 25;
      else if (building.id.includes('market')) targetCount = 20;
      else if (building.id.includes('library')) targetCount = 15;

      goalTemplates.push({
        type: GoalType.BuildingCount,
        baseValue: targetCount,
        description: `Build ${targetCount} ${building.name}s`,
        buildingId: building.id,
      });
    });

    // Randomly select unique goals
    const shuffled = [...goalTemplates].sort(() => Math.random() - 0.5);
    const selectedTemplates = shuffled.slice(0, count);

    for (const template of selectedTemplates) {
      const goal: Goal = {
        id: `goal_${this.goalCounter++}`,
        type: template.type,
        description: this.formatDescription(template.description, template.baseValue),
        targetValue: template.baseValue,
        currentValue: 0,
        isCompleted: false,
        buildingId: template.buildingId,
      };
      goals.push(goal);
    }

    return goals;
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
