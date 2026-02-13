import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from './GameState';
import { TierType, GoalType, Settlement } from '../types/game';
import { getTierByType } from '../data/tiers';
import { GoalGenerator } from '../data/goals';

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
      expect(newSettlement.currency).toBe(11); // Fresh starting currency (10 base + 1 mastery bonus from 1 completion)
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

    it('should provide patronage bonus from completed higher-tier settlements', () => {
      // Record some completed villages
      game.getState().completedSettlements.set(TierType.Village, 3);

      const hamletSettlement = game.getState().settlements.find((s) => s.tier === TierType.Hamlet);
      const bonus = game.getCrossTierBonus(hamletSettlement!.id);

      // Village first building baseIncome = 10
      // Patronage: 3 completions * 10 * 0.05 / 2^1 = 0.75
      expect(bonus).toBeCloseTo(0.75, 4);
    });

    it('should decay patronage bonus with tier distance', () => {
      // Record completed villages and towns
      game.getState().completedSettlements.set(TierType.Village, 2);
      game.getState().completedSettlements.set(TierType.Town, 1);

      const hamletSettlement = game.getState().settlements.find((s) => s.tier === TierType.Hamlet);
      const bonus = game.getCrossTierBonus(hamletSettlement!.id);

      // Village (distance 1): 2 * 10 * 0.05 / 2 = 0.5
      // Town (distance 2): 1 * 85 * 0.05 / 4 = 1.0625
      expect(bonus).toBeCloseTo(1.5625, 4);
    });

    it('should apply patronage bonus to currency in update loop', () => {
      // Record some completed villages so patronage exists
      game.getState().completedSettlements.set(TierType.Village, 2);

      const hamletSettlement = game.getState().settlements.find((s) => s.tier === TierType.Hamlet);
      const initialCurrency = hamletSettlement!.currency;

      // Simulate 1 second passing
      (game as any).lastUpdate = Date.now() - 1000;
      game.update();

      // Hamlet should have gained currency from patronage even with 0 own income
      // Bonus: 2 * 10 * 0.05 / 2 = 0.5/s, over 1 second = 0.5
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

  describe('Higher tier spawning mechanics', () => {
    it('should spawn a village after 6 hamlet completions', () => {
      // Complete 6 hamlets
      for (let i = 0; i < 6; i++) {
        const settlement = game.getState().settlements.find((s) => s.tier === TierType.Hamlet);
        expect(settlement).toBeDefined();
        settlement!.currency = 100000;
        settlement!.goals.forEach((goal) => {
          goal.isCompleted = true;
          goal.currentValue = goal.targetValue;
        });
        game.update();
      }

      // Should have unlocked village tier and spawned 1 village
      expect(game.getState().unlockedTiers.has(TierType.Village)).toBe(true);
      const villages = game.getState().settlements.filter((s) => s.tier === TierType.Village);
      expect(villages).toHaveLength(1);
    });

    it('should not respawn higher tier settlements when completed', () => {
      // Unlock village and spawn one
      game.getState().unlockedTiers.add(TierType.Village);
      game.spawnTestSettlement(TierType.Village);

      const village = game.getState().settlements.find((s) => s.tier === TierType.Village);
      expect(village).toBeDefined();

      // Complete the village
      village!.currency = 1000000;
      village!.goals.forEach((goal) => {
        goal.isCompleted = true;
        goal.currentValue = goal.targetValue;
      });
      game.update();

      // Village should not be replaced
      const villages = game.getState().settlements.filter((s) => s.tier === TierType.Village);
      expect(villages).toHaveLength(0);
    });

    it('should still auto-replace completed hamlets', () => {
      const settlement = game.getState().settlements.find((s) => s.tier === TierType.Hamlet);
      expect(settlement).toBeDefined();

      settlement!.currency = 100000;
      settlement!.goals.forEach((goal) => {
        goal.isCompleted = true;
        goal.currentValue = goal.targetValue;
      });
      game.update();

      // Hamlet should be replaced
      const hamlets = game.getState().settlements.filter((s) => s.tier === TierType.Hamlet);
      expect(hamlets).toHaveLength(1);
    });
  });

  describe('Starting income applied at spawn', () => {
    it('should include starting_income research in totalIncome for newly spawned settlements', () => {
      // Purchase starting income research
      game.getState().researchPoints.set(TierType.Hamlet, 100);
      game.purchaseResearch('hamlet_starting_income_1'); // +5

      // Complete the current hamlet to trigger a new one to spawn
      const settlement = game.getState().settlements.find((s) => s.tier === TierType.Hamlet)!;
      settlement.currency = 100000;
      settlement.goals.forEach((goal) => {
        goal.isCompleted = true;
        goal.currentValue = goal.targetValue;
      });
      game.update();

      // The newly spawned hamlet should already have starting income applied
      const newHamlet = game.getState().settlements.find((s) => s.tier === TierType.Hamlet)!;
      expect(newHamlet.totalIncome).toBeGreaterThan(0);

      // Buy first hut — income should only increase by the hut's base income (1),
      // not by 1 + the entire starting bonus
      const incomeBeforeHut = newHamlet.totalIncome;
      newHamlet.currency = 100;
      game.buyBuilding(newHamlet.id, 'hamlet_hut');
      const incomeAfterHut = newHamlet.totalIncome;

      // The hut adds 1 base income (plus tiny mastery multiplier), not ~20
      expect(incomeAfterHut - incomeBeforeHut).toBeLessThan(2);
    });
  });

  describe('Repeatable research', () => {
    it('should generate next level when terminal research is purchased', () => {
      game.getState().researchPoints.set(TierType.Hamlet, 1000);

      // Buy all 3 levels of starting income
      game.purchaseResearch('hamlet_starting_income_1');
      game.purchaseResearch('hamlet_starting_income_2');
      game.purchaseResearch('hamlet_starting_income_3');

      // Should have generated hamlet_starting_income_4
      const nextLevel = game.getState().research.find((r) => r.id === 'hamlet_starting_income_4');
      expect(nextLevel).toBeDefined();
      expect(nextLevel!.cost).toBe(150); // 50 * 3
      expect(nextLevel!.prerequisite).toBe('hamlet_starting_income_3');
      expect(nextLevel!.effect.type).toBe('starting_income');
    });

    it('should not generate next level for parallel_slots', () => {
      game.getState().researchPoints.set(TierType.Hamlet, 100000);
      game.getState().researchPoints.set(TierType.Village, 100000);
      game.getState().researchPoints.set(TierType.Town, 100000);

      // Buy all hamlet parallel slot research
      game.purchaseResearch('hamlet_parallel_2');
      game.purchaseResearch('hamlet_parallel_3');
      game.purchaseResearch('hamlet_parallel_4'); // Village tier
      game.purchaseResearch('hamlet_parallel_5'); // Town tier

      // Should NOT have generated hamlet_parallel_6 (6th slot is prestige-only)
      const nextLevel = game.getState().research.find((r) => r.id === 'hamlet_parallel_6');
      expect(nextLevel).toBeUndefined();
    });

    it('should escalate cost 3x for each repeatable level', () => {
      game.getState().researchPoints.set(TierType.Hamlet, 100000);

      game.purchaseResearch('hamlet_cost_reduction_1');
      game.purchaseResearch('hamlet_cost_reduction_2');
      game.purchaseResearch('hamlet_cost_reduction_3');

      const level4 = game.getState().research.find((r) => r.id === 'hamlet_cost_reduction_4');
      expect(level4).toBeDefined();
      expect(level4!.cost).toBe(675); // 225 * 3

      game.purchaseResearch('hamlet_cost_reduction_4');

      const level5 = game.getState().research.find((r) => r.id === 'hamlet_cost_reduction_5');
      expect(level5).toBeDefined();
      expect(level5!.cost).toBe(2025); // 675 * 3
    });
  });

  describe('Effect caching', () => {
    it('should return same prestige effect value on repeated calls within a tick', () => {
      // Call getPrestigeEffect multiple times — should get consistent results
      const first = game.getPrestigeEffect('prestige_income_multiplier');
      const second = game.getPrestigeEffect('prestige_income_multiplier');
      expect(first).toBe(second);
      expect(first).toBe(0); // No prestige upgrades purchased
    });

    it('should return same achievement effect value on repeated calls within a tick', () => {
      const first = game.getAchievementEffect('income_multiplier');
      const second = game.getAchievementEffect('income_multiplier');
      expect(first).toBe(second);
      expect(first).toBe(0); // No achievements unlocked
    });

    it('should return same building boost value on repeated calls within a tick', () => {
      const first = game.getPrestigeBuildingBoost('hamlet_hut');
      const second = game.getPrestigeBuildingBoost('hamlet_hut');
      expect(first).toBe(second);
      expect(first).toBe(0); // No building boosts purchased
    });

    it('should reflect prestige upgrade purchases after cache invalidation', () => {
      // Set up: give prestige currency and unlock village
      game.getState().unlockedTiers.add(TierType.Village);
      game.getState().prestigeCurrency.set(TierType.Village, 100);

      // Find first village prestige upgrade with income_multiplier effect
      const incomeUpgrade = game
        .getState()
        .prestigeUpgrades.find(
          (u) => u.tier === TierType.Village && u.effect.type === 'prestige_income_multiplier',
        );

      if (incomeUpgrade) {
        const before = game.getPrestigeEffect('prestige_income_multiplier');
        game.purchasePrestigeUpgrade(incomeUpgrade.id);
        const after = game.getPrestigeEffect('prestige_income_multiplier');

        // After purchasing, the effect should increase
        expect(after).toBeGreaterThan(before);
      }
    });

    it('should reflect research purchases after cache invalidation', () => {
      game.getState().researchPoints.set(TierType.Hamlet, 100);

      // Cache a research effect value
      const costBefore = game.getBuildingCost(game.getState().settlements[0].id, 'hamlet_hut');

      // Purchase cost reduction research
      game.purchaseResearch('hamlet_cost_reduction_1');

      // Cost should now be lower (cache was cleared by purchaseResearch)
      const costAfter = game.getBuildingCost(game.getState().settlements[0].id, 'hamlet_hut');

      expect(costAfter).toBeLessThan(costBefore!);
    });

    it('should clear cache between update ticks', () => {
      const settlement = game.getState().settlements[0];
      settlement.currency = 1000;
      game.buyBuilding(settlement.id, 'hamlet_hut');

      // Run one update tick
      game.update();

      // Trigger the 'Humble Beginnings' achievement (complete 1 hamlet) through the proper API
      game.getState().lifetimeCompletions.set(TierType.Hamlet, 1);
      game.checkAchievements();

      const achievement = game
        .getState()
        .achievements.find((a) => a.id === 'ach_hamlet_1' && a.bonus.type === 'income_multiplier');

      // Run another tick — cache should be cleared and new values used
      game.update();

      // The achievement bonus should now be reflected in income
      const incomeBonus = game.getAchievementEffect('income_multiplier');
      if (achievement) {
        expect(incomeBonus).toBeGreaterThan(0);
      }
    });
  });

  describe('Auto-builder treasury cap', () => {
    let settlementId: string;

    beforeEach(() => {
      const settlement = game.getState().settlements[0];
      settlementId = settlement.id;
      // Give plenty of research points and purchase auto-hut research
      game.getState().researchPoints.set(TierType.Hamlet, 1000);
      game.purchaseResearch('hamlet_auto_hut_1');
    });

    it('should auto-buy when cost is within 5% of treasury', () => {
      const settlement = game.getState().settlements[0];
      // Buy first hut manually so the cap applies
      settlement.currency = 10000;
      game.buyBuilding(settlementId, 'hamlet_hut');

      // Next hut costs ~11.5 (10 * 1.15). Set currency so 5% of treasury > cost.
      // 5% of 400 = 20 > 11.5, so it should auto-buy.
      settlement.currency = 400;
      const costBefore = game.getBuildingCost(settlementId, 'hamlet_hut')!;
      expect(costBefore).toBeLessThan(400 * 0.05); // Verify our assumption

      // Set the auto-build timer far in the past so it triggers immediately
      const autoResearch = game.getState().research.find((r) => r.id === 'hamlet_auto_hut_1')!;
      game.getState().autoBuildingTimers.set(autoResearch.id, 0);

      game.update();

      expect(settlement.buildings.get('hamlet_hut')).toBe(2);
    });

    it('should NOT auto-buy when cost exceeds 5% of treasury', () => {
      const settlement = game.getState().settlements[0];
      // Buy many huts to make cost very high
      settlement.currency = 1000000;
      for (let i = 0; i < 30; i++) {
        game.buyBuilding(settlementId, 'hamlet_hut');
      }
      const hutCount = settlement.buildings.get('hamlet_hut')!;
      expect(hutCount).toBe(30);

      // Now set treasury low so cost > 5% of treasury
      const nextCost = game.getBuildingCost(settlementId, 'hamlet_hut')!;
      // Set currency so we can afford it, but it's more than 5% of treasury
      // cost / 0.05 = treasury where cost is exactly 5%. Use slightly more than cost
      // so we can afford it but 5% of treasury < cost.
      settlement.currency = nextCost * 2; // cost is 50% of treasury, way over 5%
      expect(nextCost).toBeGreaterThan(settlement.currency * 0.05);

      const autoResearch = game.getState().research.find((r) => r.id === 'hamlet_auto_hut_1')!;
      game.getState().autoBuildingTimers.set(autoResearch.id, 0);

      game.update();

      // Should NOT have bought another hut
      expect(settlement.buildings.get('hamlet_hut')).toBe(30);
    });

    it('should bypass treasury cap for the first building of a type', () => {
      const settlement = game.getState().settlements[0];
      // No huts yet (count = 0). Cost is 10, set treasury to 15.
      // 5% of 15 = 0.75, cost (10) > 0.75, but first building should bypass cap.
      settlement.currency = 15;
      expect(settlement.buildings.get('hamlet_hut')).toBe(0);

      const autoResearch = game.getState().research.find((r) => r.id === 'hamlet_auto_hut_1')!;
      game.getState().autoBuildingTimers.set(autoResearch.id, 0);

      game.update();

      expect(settlement.buildings.get('hamlet_hut')).toBe(1);
      expect(settlement.currency).toBe(5); // 15 - 10
    });

    it('should auto-buy in ALL parallel settlements, not just the first', () => {
      // Unlock a second parallel hamlet slot
      game.getState().researchPoints.set(TierType.Hamlet, 1000);
      game.purchaseResearch('hamlet_parallel_2');

      const settlements = game.getState().settlements.filter((s) => s.tier === TierType.Hamlet);
      expect(settlements.length).toBeGreaterThanOrEqual(2);

      // Give all settlements enough currency for huts
      for (const s of settlements) {
        s.currency = 10000;
      }

      // Set auto-build timer to fire immediately
      const autoResearch = game.getState().research.find((r) => r.id === 'hamlet_auto_hut_1')!;
      game.getState().autoBuildingTimers.set(autoResearch.id, 0);

      game.update();

      // All settlements should have gotten a hut, not just the first one
      for (const s of settlements) {
        expect(s.buildings.get('hamlet_hut')).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('getEffectiveBuildingIncome', () => {
    function createTownSettlement(): Settlement {
      const tierDef = getTierByType(TierType.Town)!;
      const settlement: Settlement = {
        id: `town_test_${Date.now()}`,
        tier: TierType.Town,
        isComplete: false,
        currency: 1000000,
        totalIncome: 0,
        buildings: new Map(),
        lifetimeCurrencyEarned: 0,
        totalCurrencySpent: 0,
        spawnTime: Date.now(),
        goals: GoalGenerator.generateRandomGoals(TierType.Town, 1),
      };
      tierDef.buildings.forEach((b) => settlement.buildings.set(b.id, 0));
      return settlement;
    }

    it('should return baseIncome when no synergies are active', () => {
      const settlement = game.getState().settlements[0];
      // hamlet_hut has baseIncome of 1
      expect(game.getEffectiveBuildingIncome(settlement.id, 'hamlet_hut')).toBe(1);
    });

    it('should return 0 for non-existent settlement', () => {
      expect(game.getEffectiveBuildingIncome('fake_id', 'hamlet_hut')).toBe(0);
    });

    it('should return 0 for non-existent building', () => {
      const settlement = game.getState().settlements[0];
      expect(game.getEffectiveBuildingIncome(settlement.id, 'fake_building')).toBe(0);
    });

    it('should boost forge income based on watchtower count', () => {
      // Set up a Town settlement with watchtowers
      const settlement = createTownSettlement();
      game.getState().unlockedTiers.add(TierType.Town);
      game.getState().settlements.push(settlement);

      // No watchtowers: forge income should be base (800)
      expect(game.getEffectiveBuildingIncome(settlement.id, 'town_forge')).toBe(800);

      // Add 2 watchtowers: each gives +15% to forge = +30% total
      settlement.buildings.set('town_watchtower', 2);
      expect(game.getEffectiveBuildingIncome(settlement.id, 'town_forge')).toBeCloseTo(
        800 * 1.3,
        2,
      );

      // Add more watchtowers: 5 watchtowers = +75%
      settlement.buildings.set('town_watchtower', 5);
      expect(game.getEffectiveBuildingIncome(settlement.id, 'town_forge')).toBeCloseTo(
        800 * 1.75,
        2,
      );
    });

    it('should not boost watchtower income (only forge is the target)', () => {
      const settlement = createTownSettlement();
      game.getState().unlockedTiers.add(TierType.Town);
      game.getState().settlements.push(settlement);

      settlement.buildings.set('town_watchtower', 5);
      // Watchtower base income is 150, it should not boost itself
      expect(game.getEffectiveBuildingIncome(settlement.id, 'town_watchtower')).toBe(150);
    });
  });
});
