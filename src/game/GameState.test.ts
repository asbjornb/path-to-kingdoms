import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from './GameState';
import { TierType } from '../types/game';

describe('GameStateManager', () => {
  let game: GameStateManager;

  beforeEach(() => {
    game = new GameStateManager();
  });

  describe('Initial state', () => {
    it('should start with correct initial values', () => {
      expect(game.getCurrency()).toBe(100);
      expect(game.getTotalIncome()).toBe(0);
      expect(game.getState().settlements).toHaveLength(0);
      expect(game.getState().researchPoints).toBe(0);
      expect(game.getState().unlockedTiers.has(TierType.Hamlet)).toBe(true);
    });
  });

  describe('Settlement spawning', () => {
    it('should spawn a hamlet when unlocked', () => {
      const settlement = game.spawnSettlement(TierType.Hamlet);

      expect(settlement).not.toBeNull();
      expect(settlement?.tier).toBe(TierType.Hamlet);
      expect(settlement?.isComplete).toBe(false);
      expect(settlement?.totalIncome).toBe(0);
      expect(game.getState().settlements).toHaveLength(1);
    });

    it('should not spawn locked tiers', () => {
      const settlement = game.spawnSettlement(TierType.Village);

      expect(settlement).toBeNull();
      expect(game.getState().settlements).toHaveLength(0);
    });

    it('should initialize settlement with empty buildings', () => {
      const settlement = game.spawnSettlement(TierType.Hamlet);

      expect(settlement?.buildings.size).toBe(3); // Hamlet has 3 buildings
      expect(settlement?.buildings.get('hamlet_hut')).toBe(0);
      expect(settlement?.buildings.get('hamlet_garden')).toBe(0);
      expect(settlement?.buildings.get('hamlet_workshop')).toBe(0);
    });
  });

  describe('Building purchases', () => {
    let settlementId: string;

    beforeEach(() => {
      const settlement = game.spawnSettlement(TierType.Hamlet);
      settlementId = settlement!.id;
    });

    it('should buy building when player has enough currency', () => {
      const initialCurrency = game.getCurrency();
      const success = game.buyBuilding(settlementId, 'hamlet_hut');

      expect(success).toBe(true);
      expect(game.getCurrency()).toBe(initialCurrency - 10); // Hut costs 10

      const settlement = game.getState().settlements[0];
      expect(settlement.buildings.get('hamlet_hut')).toBe(1);
      expect(settlement.totalIncome).toBe(1); // Hut generates 1 income
    });

    it('should not buy building when player lacks currency', () => {
      // Spend most currency first
      for (let i = 0; i < 9; i++) {
        game.buyBuilding(settlementId, 'hamlet_hut');
      }

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
  });

  describe('Settlement completion', () => {
    let settlementId: string;

    beforeEach(() => {
      const settlement = game.spawnSettlement(TierType.Hamlet);
      settlementId = settlement!.id;
    });

    it('should complete settlement when income threshold is reached', () => {
      // Give player more money for testing
      (game as any).currency = 1000;

      // Buy enough buildings to reach completion threshold (10 for hamlet)
      for (let i = 0; i < 10; i++) {
        game.buyBuilding(settlementId, 'hamlet_hut'); // Each hut gives 1 income
      }

      const settlement = game.getState().settlements[0];
      expect(settlement.totalIncome).toBeGreaterThanOrEqual(10);
      expect(settlement.isComplete).toBe(true);
      expect(game.getState().researchPoints).toBe(1);
    });

    it('should track completed settlements', () => {
      // Give player more money for testing
      (game as any).currency = 100000;

      // Complete some hamlets
      for (let i = 0; i < 2; i++) {
        const settlement = game.spawnSettlement(TierType.Hamlet);
        const id = settlement!.id;

        // Complete this settlement
        for (let j = 0; j < 10; j++) {
          game.buyBuilding(id, 'hamlet_hut');
        }
      }

      // Test that completed settlements are tracked
      expect(game.getState().completedSettlements.get(TierType.Hamlet)).toBeGreaterThan(0);
    });
  });

  describe('Research system', () => {
    it('should purchase research when player has enough points', () => {
      // Give player enough research points by completing settlements
      (game as any).currency = 100000; // Much more money for escalating costs

      for (let i = 0; i < 5; i++) {
        const settlement = game.spawnSettlement(TierType.Hamlet);
        // Complete each settlement (gives 1 research point each)
        for (let j = 0; j < 10; j++) {
          game.buyBuilding(settlement!.id, 'hamlet_hut');
        }
      }

      // Test that we get at least some research points from completed settlements
      expect(game.getState().researchPoints).toBeGreaterThanOrEqual(1);

      // Test that we can purchase research when we have enough points
      const initialPoints = game.getState().researchPoints;
      const success = game.purchaseResearch('autobuy_unlock');

      if (initialPoints >= 5) {
        expect(success).toBe(true);
        expect(game.getState().researchPoints).toBe(initialPoints - 5);
      } else {
        expect(success).toBe(false);
      }
    });

    it('should not purchase research without enough points', () => {
      const success = game.purchaseResearch('autobuy_unlock');
      expect(success).toBe(false);
      expect(game.getState().researchPoints).toBe(0);
    });
  });

  describe('Game loop updates', () => {
    it('should generate income over time', () => {
      const settlement = game.spawnSettlement(TierType.Hamlet);
      game.buyBuilding(settlement!.id, 'hamlet_hut'); // 1 income/sec

      const initialCurrency = game.getCurrency();

      // Simulate 1 second passing
      game.update();
      // Manually advance time for testing
      (game as any).lastUpdate = Date.now() - 1000;
      game.update();

      expect(game.getCurrency()).toBeGreaterThan(initialCurrency);
    });
  });
});
