import { GameStateManager } from '../game/GameState';
import { TierType, Settlement } from '../types/game';
import { TIER_DATA, getTierByType } from '../data/tiers';
import { formatNumber, formatIncome } from '../utils/format';

export class UI {
  private game: GameStateManager;
  private container: HTMLElement;
  private selectedTier: TierType = TierType.Hamlet;

  constructor(game: GameStateManager, container: HTMLElement) {
    this.game = game;
    this.container = container;
  }

  public render(): void {
    const state = this.game.getState();

    this.container.innerHTML = `
      <div class="game-container">
        <header class="game-header">
          <h1>Path to Kingdoms</h1>
          <div class="stats">
            <div class="stat">
              <span class="stat-label">Currency:</span>
              <span class="stat-value">${formatNumber(this.game.getCurrency())}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Income:</span>
              <span class="stat-value">${formatIncome(this.game.getTotalIncome())}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Research:</span>
              <span class="stat-value">${state.researchPoints}</span>
            </div>
          </div>
        </header>
        
        <div class="game-content">
          <nav class="tier-tabs">
            ${this.renderTierTabs()}
          </nav>
          
          <main class="settlements-area">
            <div class="tier-header">
              <h2>${this.selectedTier.charAt(0).toUpperCase() + this.selectedTier.slice(1)}s</h2>
              <button class="spawn-btn" onclick="window.spawnSettlement('${this.selectedTier}')">
                Spawn New ${this.selectedTier.charAt(0).toUpperCase() + this.selectedTier.slice(1)}
              </button>
            </div>
            <div class="settlements-list">
              ${this.renderSettlements()}
            </div>
          </main>
          
          <aside class="research-panel">
            <h3>Research</h3>
            ${this.renderResearch()}
          </aside>
        </div>
      </div>
    `;
  }

  private renderTierTabs(): string {
    const state = this.game.getState();
    return TIER_DATA.map((tier) => {
      const isUnlocked = state.unlockedTiers.has(tier.type);
      const isSelected = tier.type === this.selectedTier;
      const completedCount = state.completedSettlements.get(tier.type) ?? 0;

      if (!isUnlocked) {
        return `<button class="tier-tab locked" disabled>???</button>`;
      }

      return `
        <button 
          class="tier-tab ${isSelected ? 'active' : ''}" 
          onclick="window.selectTier('${tier.type}')"
        >
          ${tier.name}
          ${completedCount > 0 ? `<span class="badge">${completedCount}</span>` : ''}
        </button>
      `;
    }).join('');
  }

  private renderSettlements(): string {
    const state = this.game.getState();
    const settlements = state.settlements.filter((s) => s.tier === this.selectedTier);

    if (settlements.length === 0) {
      return '<div class="empty-message">No settlements yet. Spawn your first one!</div>';
    }

    return settlements.map((settlement) => this.renderSettlement(settlement)).join('');
  }

  private renderSettlement(settlement: Settlement): string {
    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return '';

    const progressPercent = (settlement.totalIncome / tierDef.completionThreshold) * 100;

    return `
      <div class="settlement ${settlement.isComplete ? 'complete' : ''}">
        <div class="settlement-header">
          <h4>${tierDef.name} #${settlement.id.split('_')[1].slice(-4)}</h4>
          <span class="income">${formatIncome(settlement.totalIncome)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(progressPercent, 100)}%"></div>
          <span class="progress-text">${formatNumber(settlement.totalIncome)} / ${formatNumber(tierDef.completionThreshold)}</span>
        </div>
        <div class="buildings">
          ${tierDef.buildings
            .map((building) => {
              const count = settlement.buildings.get(building.id) ?? 0;
              const cost = this.game.getBuildingCost(settlement.id, building.id) ?? 0;
              const canAfford = this.game.getCurrency() >= cost;

              return `
              <div class="building">
                <div class="building-info">
                  <span class="building-name">${building.name} (${count})</span>
                  <span class="building-income">+${formatIncome(building.baseIncome)}</span>
                </div>
                <button 
                  class="buy-btn ${!canAfford ? 'disabled' : ''}"
                  onclick="window.buyBuilding('${settlement.id}', '${building.id}')"
                  ${!canAfford ? 'disabled' : ''}
                >
                  Buy (${formatNumber(cost)})
                </button>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  private renderResearch(): string {
    const state = this.game.getState();

    return `
      <div class="research-list">
        ${state.research
          .map((research) => {
            const canAfford = state.researchPoints >= research.cost;

            return `
            <div class="research-item ${research.purchased ? 'purchased' : ''}">
              <h4>${research.name}</h4>
              <p>${research.description}</p>
              ${
                !research.purchased
                  ? `
                <button 
                  class="research-btn ${!canAfford ? 'disabled' : ''}"
                  onclick="window.purchaseResearch('${research.id}')"
                  ${!canAfford ? 'disabled' : ''}
                >
                  Research (${research.cost} points)
                </button>
              `
                  : '<span class="purchased-label">Purchased</span>'
              }
            </div>
          `;
          })
          .join('')}
      </div>
    `;
  }

  public selectTier(tier: TierType): void {
    if (this.game.getState().unlockedTiers.has(tier)) {
      this.selectedTier = tier;
    }
  }
}
