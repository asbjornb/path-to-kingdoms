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
  window.buyBuilding = (settlementId: string, buildingId: string): void => {
    if (game.buyBuilding(settlementId, buildingId)) {
      // Use dynamic update instead of full render to preserve scroll position
      ui.update();
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

  window.toggleDevMode = (): void => {
    const devModeEnabled = game.toggleDevMode();
    console.warn(
      `Dev Mode ${devModeEnabled ? 'enabled' : 'disabled'} - Income multiplier: ${devModeEnabled ? '1000x' : '1x'}`,
    );
    ui.render(); // Re-render to update checkbox state
  };

  window.toggleShowCompletedResearch = (): void => {
    game.toggleShowCompletedResearch();
    ui.render(); // Re-render to update research list
  };

  window.saveGame = (): void => {
    if (game.saveGame()) {
      alert('Game saved successfully!');
    } else {
      alert('Failed to save game!');
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
}

document.addEventListener('DOMContentLoaded', initGame);
