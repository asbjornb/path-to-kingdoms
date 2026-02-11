import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../game/GameState';
import { UI } from './UI';
import { TierType } from '../types/game';

describe('UI', () => {
  let game: GameStateManager;
  let container: HTMLElement;
  let ui: UI;

  beforeEach(() => {
    game = new GameStateManager();
    container = document.createElement('div');
    ui = new UI(game, container);
  });

  describe('Rendering', () => {
    it('should render without throwing errors', () => {
      expect(() => {
        ui.render();
      }).not.toThrow();
    });

    it('should render game header with stats', () => {
      ui.render();

      const header = container.querySelector('.game-header');
      expect(header).toBeTruthy();

      const title = container.querySelector('h1');
      expect(title?.textContent).toBe('Path to Kingdoms');

      // Check for research stats (currency/income are now per-settlement)
      const researchValue = container.querySelector('#research');
      expect(researchValue).toBeTruthy();
    });

    it('should render tier tabs', () => {
      ui.render();

      const tierTabs = container.querySelectorAll('.tier-tab');
      expect(tierTabs.length).toBeGreaterThan(0);

      // Should have hamlet tab as active initially
      const activeTab = container.querySelector('.tier-tab.active');
      expect(activeTab).toBeTruthy();
    });

    it('should render settlements area', () => {
      ui.render();

      const settlementsArea = container.querySelector('.settlements-area');
      expect(settlementsArea).toBeTruthy();

      const settlementsContainer = container.querySelector('.settlements-list');
      expect(settlementsContainer).toBeTruthy();
    });

    it('should render research panel', () => {
      ui.render();

      const researchPanel = container.querySelector('.research-panel');
      expect(researchPanel).toBeTruthy();

      const researchTitle = researchPanel?.querySelector('h3');
      expect(researchTitle?.textContent).toContain('Research');
    });

    it('should render buildings with correct structure', () => {
      // Disable compact mode to see all building details
      game.toggleCompactView();
      ui.render();

      const buildings = container.querySelectorAll('.building');
      expect(buildings.length).toBeGreaterThan(0);

      // Each building should have name, income, and buy button
      buildings.forEach((building) => {
        const buildingName = building.querySelector('.building-name');
        const buildingIncome = building.querySelector('.building-income');
        const buyButton = building.querySelector('.buy-btn');

        expect(buildingName).toBeTruthy();
        expect(buildingIncome).toBeTruthy();
        expect(buyButton).toBeTruthy();
      });
    });

    it('should render research items with correct structure', () => {
      ui.render();

      const researchItems = container.querySelectorAll('.research-item');
      expect(researchItems.length).toBeGreaterThan(0);

      // Each research item should have title, description, and button/label
      researchItems.forEach((item) => {
        const title = item.querySelector('h4');
        const description = item.querySelector('p');

        expect(title).toBeTruthy();
        expect(description).toBeTruthy();

        // Should have either a button or purchased label
        const button = item.querySelector('.research-btn');
        const purchasedLabel = item.querySelector('.purchased-label');
        expect(button || purchasedLabel).toBeTruthy();
      });
    });
  });

  describe('Updates', () => {
    it('should update stats without throwing errors', () => {
      ui.render();

      expect(() => {
        ui.update();
      }).not.toThrow();
    });

    it('should display settlement currency and income', () => {
      // Disable compact mode to see full settlement stats
      game.toggleCompactView();
      ui.render();

      // Each settlement should show its own currency and income
      const settlementStats = container.querySelectorAll('.settlement-stat');
      expect(settlementStats.length).toBeGreaterThan(0);
    });

    it('should update research points display when tier changes', () => {
      ui.render();

      // Add some research points
      game.getState().researchPoints.set(TierType.Hamlet, 50);

      // Change tier and render (this would normally happen through selectTier)
      ui.selectTier(TierType.Hamlet);
      ui.render();

      const researchValue = container.querySelector('#research');
      expect(researchValue?.textContent).toBe('50');
    });

    it('should handle tier switching without errors', () => {
      ui.render();

      expect(() => {
        ui.selectTier(TierType.Hamlet);
        ui.render();
      }).not.toThrow();
    });
  });

  describe('Building Effects Display', () => {
    it('should display building effects when present', () => {
      ui.render();

      // Building effects should be visible in both compact and expanded modes
      const buildingEffects = container.querySelectorAll('.building-effect');
      expect(buildingEffects.length).toBeGreaterThan(0);

      // Check that effect descriptions are present
      buildingEffects.forEach((effect) => {
        expect(effect.textContent?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      // Test with empty container
      const emptyContainer = document.createElement('div');
      const emptyUI = new UI(game, emptyContainer);

      expect(() => {
        emptyUI.render();
        emptyUI.update();
      }).not.toThrow();
    });

    it('should handle invalid tier selection', () => {
      ui.render();

      expect(() => {
        // This should not cause errors even with invalid tier
        (ui as any).selectedTier = 'invalid_tier';
        ui.render();
      }).not.toThrow();
    });
  });
});
