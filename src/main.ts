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
    console.log('Spawning settlement:', tierType);
    const settlement = game.spawnSettlement(tierType);
    console.log('Spawned:', settlement);
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

  // Game loop - less frequent updates
  setInterval(() => {
    game.update();
    ui.render();
  }, 500);

  // Initial render
  ui.render();

  // Debug: Check if functions are properly set
  console.log('spawnSettlement function:', window.spawnSettlement);
}

document.addEventListener('DOMContentLoaded', initGame);
