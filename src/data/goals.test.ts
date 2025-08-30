import { describe, it, expect } from 'vitest';
import { GoalGenerator } from './goals';
import { TierType, GoalType } from '../types/game';

describe('GoalGenerator', () => {
  it('should generate the correct number of goals', () => {
    const goals = GoalGenerator.generateRandomGoals(TierType.Hamlet, 1);
    expect(goals).toHaveLength(1);
  });

  it('should generate goals with required properties', () => {
    const goals = GoalGenerator.generateRandomGoals(TierType.Hamlet, 5);

    goals.forEach((goal) => {
      expect(goal.id).toBeDefined();
      expect(goal.type).toBeDefined();
      expect(goal.description).toBeDefined();
      expect(goal.targetValue).toBeGreaterThan(0);
      expect(goal.currentValue).toBe(0);
      expect(goal.isCompleted).toBe(false);
    });
  });

  it('should generate different goal types', () => {
    // Generate many goals to get variety
    const goals = GoalGenerator.generateRandomGoals(TierType.Hamlet, 10);
    const goalTypes = goals.map((g) => g.type);
    const uniqueTypes = new Set(goalTypes);

    // Should have at least 2 different types
    expect(uniqueTypes.size).toBeGreaterThan(1);
  });

  it('should generate building count goals with building IDs', () => {
    // Generate many goals to ensure we get building count goals
    const goals = GoalGenerator.generateRandomGoals(TierType.Hamlet, 15);
    const buildingGoals = goals.filter((g) => g.type === GoalType.BuildingCount);

    if (buildingGoals.length > 0) {
      buildingGoals.forEach((goal) => {
        expect(goal.buildingId).toBeDefined();
        expect(goal.buildingId).toContain('hamlet_');
      });
    }
  });

  it('should format numbers in descriptions correctly', () => {
    const goals = GoalGenerator.generateRandomGoals(TierType.Hamlet, 10);

    goals.forEach((goal) => {
      expect(goal.description).toMatch(/\d+/); // Should contain numbers

      // Survival goals should show minutes
      if (goal.type === GoalType.Survival) {
        expect(goal.description).toContain('minutes');
      }
    });
  });
});
