import { GameStateManager } from './game/GameState';
import { UI } from './ui/UI';
import { TierType } from './types/game';

let game: GameStateManager;
let ui: UI;

function initGame(): void {
  const app = document.getElementById('app');
  if (!app) {
    throw new Error('App container not found');
  }

  game = new GameStateManager();
  ui = new UI(game, app);

  // Set up global functions for UI interactions
  window.spawnSettlement = (tierType: TierType): void => {
    game.spawnSettlement(tierType);
    ui.render();
  };

  window.buyBuilding = (settlementId: string, buildingId: string): void => {
    if (game.buyBuilding(settlementId, buildingId)) {
      ui.render();
    }
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

  // Game loop - update stats frequently without re-rendering
  setInterval(() => {
    game.update();
    ui.update();
  }, 100);

  // Initial render
  ui.render();
}

document.addEventListener('DOMContentLoaded', initGame);
