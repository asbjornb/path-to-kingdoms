import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from './GameState';
import { TierType, GoalType } from '../types/game';

describe('GameStateManager', () => {
  let game: GameStateManager;

  beforeEach(() => {
    game = new GameStateManager();
  });

  describe('Initial state', () => {
    it('should start with correct initial values', () => {
      expect(game.getTotalIncome()).toBe(0);
      expect(game.getState().settlements).toHaveLength(1); // Now auto-spawns 1 hamlet
      expect(game.getResearchPoints(TierType.Hamlet)).toBe(0);
      expect(game.getState().unlockedTiers.has(TierType.Hamlet)).toBe(true);

      // Each hamlet should start with enough currency for first building and have goals
      const settlement = game.getState().settlements[0];
      expect(settlement.currency).toBe(10); // Cost of first building (hut)
      expect(settlement.goals).toHaveLength(1); // Should have 1 random goal
      expect(settlement.lifetimeCurrencyEarned).toBe(0);
      expect(settlement.spawnTime).toBeGreaterThan(0);
    });
  });

  describe('Settlement auto-spawning', () => {
    it('should auto-spawn a hamlet at start', () => {
      // Game should start with 1 hamlet
      expect(game.getState().settlements).toHaveLength(1);
      expect(game.getState().settlements[0]?.tier).toBe(TierType.Hamlet);
    });

    it('should initialize settlement with empty buildings', () => {
      const settlement = game.getState().settlements[0];

      expect(settlement?.buildings.size).toBe(6); // Hamlet has 6 buildings
      expect(settlement?.buildings.get('hamlet_hut')).toBe(0);
      expect(settlement?.buildings.get('hamlet_garden')).toBe(0);
      expect(settlement?.buildings.get('hamlet_workshop')).toBe(0);
      expect(settlement?.buildings.get('hamlet_shrine')).toBe(0);
      expect(settlement?.buildings.get('hamlet_market')).toBe(0);
      expect(settlement?.buildings.get('hamlet_library')).toBe(0);

      // Should have goals
      expect(settlement?.goals).toHaveLength(1);
    });

    it('should spawn more settlements when parallel research is purchased', () => {
      // Give hamlet research points and buy parallel slots
      game.getState().researchPoints.set(TierType.Hamlet, 100);
      game.purchaseResearch('hamlet_parallel_2');

      // Should now have 2 hamlets
      expect(game.getState().settlements).toHaveLength(2);
    });
  });

  describe('Building purchases', () => {
    let settlementId: string;

    beforeEach(() => {
      const settlement = game.getState().settlements[0];
      settlementId = settlement.id;
    });

    it('should buy building when settlement has enough currency', () => {
      const settlement = game.getState().settlements[0];
      const initialCurrency = settlement.currency;
      const success = game.buyBuilding(settlementId, 'hamlet_hut');

      expect(success).toBe(true);
      expect(settlement.currency).toBe(initialCurrency - 10); // Hut costs 10
      expect(settlement.buildings.get('hamlet_hut')).toBe(1);
      expect(settlement.totalIncome).toBe(1); // Hut generates 1 income
    });

    it('should not buy building when settlement lacks currency', () => {
      // Set settlement currency to 0
      const settlement = game.getState().settlements[0];
      settlement.currency = 0;

      const success = game.buyBuilding(settlementId, 'hamlet_hut');
      expect(success).toBe(false);
    });

    it('should increase building cost with multiplier', () => {
      const firstCost = game.getBuildingCost(settlementId, 'hamlet_hut');
      game.buyBuilding(settlementId, 'hamlet_hut');
      const secondCost = game.getBuildingCost(settlementId, 'hamlet_hut');

      expect(secondCost).toBeGreaterThan(firstCost!);
      expect(secondCost).toBe(Math.floor(10 * 1.15)); // Base cost 10, multiplier 1.15
    });

    it('should not buy from non-existent settlement', () => {
      const success = game.buyBuilding('fake-id', 'hamlet_hut');
      expect(success).toBe(false);
    });

    it('should not buy non-existent building', () => {
      const success = game.buyBuilding(settlementId, 'fake-building');
      expect(success).toBe(false);
    });

    it('should apply building effects correctly', () => {
      // Give settlement more money for testing
      const settlement = game.getState().settlements[0];
      settlement.currency = 10000;

      // Buy a shrine (income multiplier) and a hut
      game.buyBuilding(settlementId, 'hamlet_shrine');
      game.buyBuilding(settlementId, 'hamlet_hut');

      // Base income: shrine (2) + hut (1) = 3
      // Shrine effect: +5% income = 3 * 1.05 = 3.15
      expect(settlement.totalIncome).toBeCloseTo(3.15, 2);

      // Test that the shrine building was purchased
      expect(settlement.buildings.get('hamlet_shrine')).toBe(1);
      expect(settlement.buildings.get('hamlet_hut')).toBe(1);
    });
  });

  describe('Settlement completion', () => {
    it('should complete settlement when all goals are achieved', () => {
      // Create fresh game to avoid test interference
      const freshGame = new GameStateManager();
      const settlement = freshGame.getState().settlements[0];

      // Give settlement more money for testing
      settlement.currency = 100000;
      const initialResearchPoints = freshGame.getResearchPoints(TierType.Hamlet);

      // Ensure we have exactly 1 settlement to start
      expect(freshGame.getState().settlements).toHaveLength(1);

      // Manually complete all goals for testing
      settlement.goals.forEach((goal) => {
        goal.isCompleted = true;
        goal.currentValue = goal.targetValue;
      });

      // Trigger goal completion check
      freshGame.update();

      // Settlement should be completed and removed, replaced by new one
      expect(freshGame.getState().settlements).toHaveLength(1); // Still have 1 settlement (new autospawned one)
      expect(freshGame.getResearchPoints(TierType.Hamlet)).toBe(initialResearchPoints + 10);
      expect(freshGame.getState().completedSettlements.get(TierType.Hamlet)).toBe(1);
    });

    it('should apply completion bonuses from buildings when goals are completed', () => {
      // Create fresh game to avoid test interference
      const freshGame = new GameStateManager();
      const settlement = freshGame.getState().settlements[0];
      // Give settlement more money for testing
      settlement.currency = 10000;
      const initialResearchPoints = freshGame.getResearchPoints(TierType.Hamlet);

      // Buy a library (completion bonus)
      freshGame.buyBuilding(settlement.id, 'hamlet_library'); // +2 research points on completion

      // Manually complete all goals for testing
      settlement.goals.forEach((goal) => {
        goal.isCompleted = true;
        goal.currentValue = goal.targetValue;
      });

      // Trigger completion check
      freshGame.update();

      // Should get 10 base + 2 from library = 12 research points
      expect(freshGame.getResearchPoints(TierType.Hamlet)).toBe(initialResearchPoints + 12);
    });

    it('should track completed settlements', () => {
      // Purchase parallel slots research to get more settlements
      game.getState().researchPoints.set(TierType.Hamlet, 100);
      game.purchaseResearch('hamlet_parallel_2');

      // Complete the settlements by completing their goals
      const settlements = game.getState().settlements.filter((s) => s.tier === TierType.Hamlet);
      for (const settlement of settlements) {
        // Give each settlement enough money
        settlement.currency = 100000;

        // Complete all goals
        settlement.goals.forEach((goal) => {
          goal.isCompleted = true;
          goal.currentValue = goal.targetValue;
        });
      }

      // Trigger completion check
      game.update();

      // Test that completed settlements are tracked
      expect(game.getState().completedSettlements.get(TierType.Hamlet)).toBeGreaterThan(0);
    });
  });

  describe('Research system', () => {
    it('should purchase research when player has enough points', () => {
      // Give player enough hamlet research points
      game.getState().researchPoints.set(TierType.Hamlet, 100);

      // Test that we can purchase research when we have enough points
      const initialPoints = game.getResearchPoints(TierType.Hamlet);
      const success = game.purchaseResearch('hamlet_starting_income_1');

      expect(success).toBe(true);
      expect(game.getResearchPoints(TierType.Hamlet)).toBe(initialPoints - 5);
    });

    it('should not purchase research without enough points', () => {
      const success = game.purchaseResearch('hamlet_starting_income_1');
      expect(success).toBe(false);
      expect(game.getResearchPoints(TierType.Hamlet)).toBe(0);
    });
  });

  describe('Game loop updates', () => {
    it('should generate income over time for each settlement', () => {
      const settlement = game.getState().settlements[0];
      game.buyBuilding(settlement.id, 'hamlet_hut'); // 1 income/sec

      const initialCurrency = settlement.currency;

      // Simulate 1 second passing
      game.update();
      // Manually advance time for testing
      (game as any).lastUpdate = Date.now() - 1000;
      game.update();

      expect(settlement.currency).toBeGreaterThan(initialCurrency);
      expect(settlement.lifetimeCurrencyEarned).toBeGreaterThan(0);
    });
  });

  describe('Goal system', () => {
    it('should generate random goals for each settlement', () => {
      const settlement = game.getState().settlements[0];

      expect(settlement.goals).toHaveLength(1);
      settlement.goals.forEach((goal) => {
        expect(goal.id).toBeDefined();
        expect(goal.type).toBeDefined();
        expect(goal.description).toBeDefined();
        expect(goal.targetValue).toBeGreaterThan(0);
        expect(goal.currentValue).toBe(0);
        expect(goal.isCompleted).toBe(false);
      });
    });

    it('should track goal progress', () => {
      const settlement = game.getState().settlements[0];
      settlement.currency = 1000;

      // Buy a building and update to trigger goal progress
      game.buyBuilding(settlement.id, 'hamlet_hut');
      game.update();

      // Goals should have updated progress
      const incomeGoal = settlement.goals.find((g) => g.type === GoalType.ReachIncome);
      if (incomeGoal) {
        expect(incomeGoal.currentValue).toBe(settlement.totalIncome);
      }

      const buildingGoal = settlement.goals.find((g) => g.type === GoalType.BuildingCount);
      if (buildingGoal && buildingGoal.buildingId === 'hamlet_hut') {
        expect(buildingGoal.currentValue).toBe(1);
      }
    });

    it('should complete settlement when all goals are achieved', () => {
      const settlement = game.getState().settlements[0];
      const initialCompletedCount = game.getState().completedSettlements.get(TierType.Hamlet) ?? 0;

      // Complete all goals
      settlement.goals.forEach((goal) => {
        goal.isCompleted = true;
        goal.currentValue = goal.targetValue;
      });

      // Update should trigger completion
      game.update();

      // Settlement should be completed
      expect(game.getState().completedSettlements.get(TierType.Hamlet)).toBe(
        initialCompletedCount + 1,
      );
    });

    it('should create a completely new settlement when one is completed', () => {
      const originalSettlement = game.getState().settlements[0];
      const originalId = originalSettlement.id;

      // Give settlement some currency and buy buildings
      originalSettlement.currency = 1000;
      game.buyBuilding(originalSettlement.id, 'hamlet_hut');
      game.buyBuilding(originalSettlement.id, 'hamlet_garden');

      // Complete all goals
      originalSettlement.goals.forEach((goal) => {
        goal.isCompleted = true;
        goal.currentValue = goal.targetValue;
      });

      // Trigger completion
      game.update();

      // Should have a new settlement with different ID and fresh state
      const newSettlement = game.getState().settlements[0];
      expect(newSettlement.id).not.toBe(originalId);
      expect(newSettlement.currency).toBe(10); // Fresh starting currency
      expect(newSettlement.totalIncome).toBe(0); // No buildings yet
      expect(newSettlement.buildings.get('hamlet_hut')).toBe(0);
      expect(newSettlement.buildings.get('hamlet_garden')).toBe(0);
      expect(newSettlement.lifetimeCurrencyEarned).toBe(0);
      expect(newSettlement.goals).toHaveLength(1);
      expect(newSettlement.goals[0].isCompleted).toBe(false);
    });
  });

  describe('Bulk buy', () => {
    let settlementId: string;

    beforeEach(() => {
      settlementId = game.getState().settlements[0].id;
      game.getState().settlements[0].currency = 100000;
    });

    it('should default buy amount to 1', () => {
      expect(game.getBuyAmount()).toBe(1);
    });

    it('should set and get buy amount', () => {
      game.setBuyAmount(5);
      expect(game.getBuyAmount()).toBe(5);
      game.setBuyAmount('max');
      expect(game.getBuyAmount()).toBe('max');
      game.setBuyAmount(1);
      expect(game.getBuyAmount()).toBe(1);
    });

    it('should calculate bulk buy cost for multiple buildings', () => {
      const cost1 = game.getBuildingCost(settlementId, 'hamlet_hut')!;
      const bulkCost = game.getBulkBuyCost(settlementId, 'hamlet_hut', 3)!;

      // Cost should be sum of 3 sequential purchases (10, 11, 12 approximately)
      expect(bulkCost).toBeGreaterThan(cost1);
      expect(bulkCost).toBeGreaterThan(cost1 * 2);
    });

    it('should return null for bulk cost with invalid settlement', () => {
      expect(game.getBulkBuyCost('fake', 'hamlet_hut', 3)).toBeNull();
    });

    it('should calculate max affordable buildings', () => {
      game.getState().settlements[0].currency = 25;
      const max = game.getMaxAffordable(settlementId, 'hamlet_hut');
      // Hut costs 10, then ~11.5, then ~13.2 → 10+11+13=34 > 25, so max should be 2
      expect(max).toBe(2);
    });

    it('should return 0 max affordable when cannot afford any', () => {
      game.getState().settlements[0].currency = 0;
      expect(game.getMaxAffordable(settlementId, 'hamlet_hut')).toBe(0);
    });

    it('should return 0 max affordable for invalid settlement', () => {
      expect(game.getMaxAffordable('fake', 'hamlet_hut')).toBe(0);
    });

    it('should buy multiple buildings at once', () => {
      const bought = game.buyMultipleBuildings(settlementId, 'hamlet_hut', 3);
      expect(bought).toBe(3);
      expect(game.getState().settlements[0].buildings.get('hamlet_hut')).toBe(3);
    });

    it('should stop buying when currency runs out', () => {
      game.getState().settlements[0].currency = 25;
      const bought = game.buyMultipleBuildings(settlementId, 'hamlet_hut', 10);
      expect(bought).toBe(2);
      expect(game.getState().settlements[0].buildings.get('hamlet_hut')).toBe(2);
    });
  });

  describe('Cross-tier resource generation', () => {
    it('should return zero bonus when no higher-tier settlements exist', () => {
      const settlement = game.getState().settlements[0];
      expect(game.getCrossTierBonus(settlement.id)).toBe(0);
    });

    it('should return zero bonus for non-existent settlement', () => {
      expect(game.getCrossTierBonus('fake-id')).toBe(0);
    });

    it('should provide bonus from higher-tier settlements', () => {
      // Unlock village tier and spawn a village with income
      game.getState().unlockedTiers.add(TierType.Village);
      game.getState().researchPoints.set(TierType.Village, 0);
      game.triggerAutospawn();

      const villageSettlement = game
        .getState()
        .settlements.find((s) => s.tier === TierType.Village);
      expect(villageSettlement).toBeDefined();

      // Give village some income by buying buildings
      villageSettlement!.currency = 100000;
      game.buyBuilding(villageSettlement!.id, 'village_cottage'); // 10 income
      expect(villageSettlement!.totalIncome).toBe(10);

      // Hamlet should now get a cross-tier bonus
      const hamletSettlement = game.getState().settlements.find((s) => s.tier === TierType.Hamlet);
      const bonus = game.getCrossTierBonus(hamletSettlement!.id);

      // Village is 1 tier above hamlet: 10 * 0.001 / 2^1 = 0.005
      expect(bonus).toBeCloseTo(0.005, 4);
    });

    it('should decay bonus with tier distance', () => {
      // Unlock village and town tiers
      game.getState().unlockedTiers.add(TierType.Village);
      game.getState().unlockedTiers.add(TierType.Town);
      game.getState().researchPoints.set(TierType.Village, 0);
      game.getState().researchPoints.set(TierType.Town, 0);
      game.triggerAutospawn();

      const villageSettlement = game
        .getState()
        .settlements.find((s) => s.tier === TierType.Village);
      const townSettlement = game.getState().settlements.find((s) => s.tier === TierType.Town);

      // Give both settlements equal income
      villageSettlement!.currency = 100000;
      townSettlement!.currency = 100000;
      game.buyBuilding(villageSettlement!.id, 'village_cottage'); // 10 income
      game.buyBuilding(townSettlement!.id, 'town_house'); // 100 income

      const hamletSettlement = game.getState().settlements.find((s) => s.tier === TierType.Hamlet);
      const bonus = game.getCrossTierBonus(hamletSettlement!.id);

      // Village (distance 1): 10 * 0.001 / 2 = 0.005
      // Town (distance 2): 100 * 0.001 / 4 = 0.025
      expect(bonus).toBeCloseTo(0.03, 4);
    });

    it('should apply cross-tier bonus to currency in update loop', () => {
      // Unlock village and give it income
      game.getState().unlockedTiers.add(TierType.Village);
      game.getState().researchPoints.set(TierType.Village, 0);
      game.triggerAutospawn();

      const villageSettlement = game
        .getState()
        .settlements.find((s) => s.tier === TierType.Village);
      villageSettlement!.currency = 100000;
      game.buyBuilding(villageSettlement!.id, 'village_cottage'); // 10 income

      const hamletSettlement = game.getState().settlements.find((s) => s.tier === TierType.Hamlet);
      const initialCurrency = hamletSettlement!.currency;

      // Simulate 1 second passing
      (game as any).lastUpdate = Date.now() - 1000;
      game.update();

      // Hamlet should have gained currency from cross-tier bonus even with 0 own income
      // Bonus: 10 * 0.001 / 2 = 0.005/s, over 1 second = 0.005
      expect(hamletSettlement!.currency).toBeGreaterThan(initialCurrency);
    });
  });

  describe('Dev Mode', () => {
    it('should be disabled by default', () => {
      expect(game.isDevModeEnabled()).toBe(false);
    });

    it('should toggle dev mode on and off', () => {
      expect(game.isDevModeEnabled()).toBe(false);

      const enabled = game.toggleDevMode();
      expect(enabled).toBe(true);
      expect(game.isDevModeEnabled()).toBe(true);

      const disabled = game.toggleDevMode();
      expect(disabled).toBe(false);
      expect(game.isDevModeEnabled()).toBe(false);
    });

    it('should apply 1000x income multiplier when dev mode is enabled', () => {
      const settlement = game.getState().settlements[0];
      game.buyBuilding(settlement.id, 'hamlet_hut'); // 1 income/sec

      const initialCurrency = settlement.currency;

      // Enable dev mode
      game.toggleDevMode();

      // Simulate 1 second passing with dev mode
      (game as any).lastUpdate = Date.now() - 1000;
      game.update();

      const currencyGained = settlement.currency - initialCurrency;
      // Should gain 1000x normal income (1 * 1000 = 1000)
      expect(currencyGained).toBeCloseTo(1000, 0);
      expect(settlement.lifetimeCurrencyEarned).toBeCloseTo(1000, 0);
    });

    it('should use normal income when dev mode is disabled', () => {
      // Create fresh game to avoid test interference
      const freshGame = new GameStateManager();
      const settlement = freshGame.getState().settlements[0];
      freshGame.buyBuilding(settlement.id, 'hamlet_hut'); // 1 income/sec

      const initialCurrency = settlement.currency;

      // Simulate 1 second passing without dev mode
      (freshGame as any).lastUpdate = Date.now() - 1000;
      freshGame.update();

      const currencyGained = settlement.currency - initialCurrency;
      // Should gain normal income (1 * 1 = 1)
      expect(currencyGained).toBeCloseTo(1, 0);
    });
  });
});
