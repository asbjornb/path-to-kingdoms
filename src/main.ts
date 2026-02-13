import { GameStateManager } from './game/GameState';
import { UI } from './ui/UI';
import { TierType, BuyAmount } from './types/game';
import { startVersionChecker } from './version';

let game: GameStateManager;
let ui: UI;

function initGame(): void {
  const app = document.getElementById('app');
  if (!app) {
    throw new Error('App container not found');
  }

  game = new GameStateManager();

  // Check for URL parameter to toggle income multiplier
  const params = new URLSearchParams(window.location.search);
  if (params.has('t')) {
    game.toggleDevMode();
    // Strip the parameter from the URL so it doesn't linger
    params.delete('t');
    const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', cleanUrl);
  }

  ui = new UI(game, app);

  // Set up global functions for UI interactions
  window.buyBuilding = (settlementId: string, buildingId: string): void => {
    const buyAmount = game.getBuyAmount();
    if (buyAmount === 1) {
      if (game.buyBuilding(settlementId, buildingId)) {
        ui.update();
      }
    } else {
      const count =
        buyAmount === 'max' ? game.getMaxAffordable(settlementId, buildingId) : buyAmount;
      if (count > 0 && game.buyMultipleBuildings(settlementId, buildingId, count) > 0) {
        ui.update();
      }
    }
  };

  window.setBuyAmount = (amount: BuyAmount): void => {
    game.setBuyAmount(amount);
    ui.render();
  };

  window.selectTier = (tierType: TierType): void => {
    ui.selectTier(tierType);
    ui.render();
  };

  window.purchaseResearch = (researchId: string): void => {
    if (game.purchaseResearch(researchId)) {
      ui.render();
    }
  };

  window.toggleDevMode = (): void => {
    game.toggleDevMode();
    ui.render();
  };

  window.toggleShowCompletedResearch = (): void => {
    game.toggleShowCompletedResearch();
    ui.render();
  };

  window.performPrestige = (): void => {
    if (!game.canPrestige()) {
      alert('You need at least 1 non-Hamlet tier completion to prestige.');
      return;
    }
    ui.openPrestigeShop();
    ui.render();
  };

  window.closePrestigeShop = (): void => {
    ui.closePrestigeShop();
    ui.render();
  };

  window.togglePrestigeShopUpgrade = (upgradeId: string): void => {
    ui.togglePrestigeUpgradeSelection(upgradeId);
    ui.render();
  };

  window.confirmPrestige = (): void => {
    const selectedUpgrades = ui.getSelectedPrestigeUpgrades();
    game.performPrestige();

    // Purchase selected upgrades (currency was just awarded by performPrestige)
    for (const upgradeId of selectedUpgrades) {
      game.purchasePrestigeUpgrade(upgradeId);
    }

    ui.closePrestigeShop();
    ui.selectTier(TierType.Hamlet);
    ui.render();
  };

  window.purchasePrestigeUpgrade = (upgradeId: string): void => {
    if (game.purchasePrestigeUpgrade(upgradeId)) {
      ui.render();
    }
  };

  window.filterPrestigeUpgrades = (query: string): void => {
    ui.setPrestigeSearch(query);
    const container = document.querySelector('.prestige-upgrades-section');
    if (container === null) return;
    const items = container.querySelectorAll('.prestige-item[data-search-text]');
    const lowerQuery = query.toLowerCase().trim();
    const terms = lowerQuery.split(/\s+/).filter((t) => t.length > 0);
    items.forEach((item) => {
      const el = item as HTMLElement;
      const searchText = el.dataset.searchText ?? '';
      const matches = terms.length === 0 || terms.every((term) => searchText.includes(term));
      el.style.display = matches ? '' : 'none';
    });
  };

  window.filterPrestigeShop = (query: string): void => {
    ui.setPrestigeShopSearch(query);
    const container = document.querySelector('.prestige-shop-upgrades');
    if (container === null) return;
    const items = container.querySelectorAll('[data-search-text]');
    const lowerQuery = query.toLowerCase().trim();
    const terms = lowerQuery.split(/\s+/).filter((t) => t.length > 0);
    items.forEach((item) => {
      const el = item as HTMLElement;
      const searchText = el.dataset.searchText ?? '';
      const matches = terms.length === 0 || terms.every((term) => searchText.includes(term));
      el.style.display = matches ? '' : 'none';
    });
  };

  window.toggleAchievements = (): void => {
    ui.toggleAchievements();
    ui.render();
  };

  window.toggleCompactView = (): void => {
    game.toggleCompactView();
    ui.render();
  };

  window.toggleGoalNotification = (tier: TierType): void => {
    game.toggleGoalNotification(tier);
    ui.render();
  };

  window.dismissNotification = (id: string): void => {
    ui.removeNotification(id);
  };

  window.saveGame = (): void => {
    const success = game.saveGame();
    const btn = document.querySelector<HTMLButtonElement>('button.save-btn');
    if (btn) {
      btn.classList.remove('save-flash-success', 'save-flash-fail');
      // Force reflow so re-adding the class restarts the animation
      void btn.offsetWidth;
      btn.classList.add(success ? 'save-flash-success' : 'save-flash-fail');
    }
  };

  window.deleteSave = (): void => {
    if (
      confirm(
        'Are you sure you want to delete your save and restart the game? This cannot be undone!',
      )
    ) {
      game.deleteSave();
      location.reload(); // Reload the page to start fresh
    }
  };

  window.exportSave = (): void => {
    const saveData = game.exportSave();
    if (saveData) {
      const blob = new Blob([saveData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `path-to-kingdoms-save-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('No save data to export!');
    }
  };

  window.importSave = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e): void => {
        const saveData = e.target?.result as string;
        if (game.importSave(saveData)) {
          alert('Save imported successfully!');
          location.reload(); // Reload to apply the imported save
        } else {
          alert('Failed to import save! Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Game loop - update stats frequently without re-rendering
  setInterval(() => {
    game.update();
    ui.update();
  }, 100);

  // Initial render
  ui.render();

  // Check for new versions periodically
  startVersionChecker();
}

document.addEventListener('DOMContentLoaded', initGame);
