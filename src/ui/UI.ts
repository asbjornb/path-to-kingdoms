import { GameStateManager } from '../game/GameState';
import { TierType, Settlement } from '../types/game';
import { TIER_DATA, getTierByType } from '../data/tiers';
import { formatNumber, formatIncome } from '../utils/format';

export class UI {
  private game: GameStateManager;
  private container: HTMLElement;
  private selectedTier: TierType = TierType.Hamlet;
  private isInitialized: boolean = false;

  constructor(game: GameStateManager, container: HTMLElement) {
    this.game = game;
    this.container = container;
  }

  public render(): void {
    this.isInitialized = true;

    this.container.innerHTML = `
      <div class="game-container">
        <header class="game-header">
          <h1>Path to Kingdoms</h1>
          <div class="stats">
            <div class="stat">
              <span class="stat-label">${this.selectedTier.charAt(0).toUpperCase() + this.selectedTier.slice(1)} Research:</span>
              <span class="stat-value" id="research">${this.game.getResearchPoints(this.selectedTier)}</span>
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
              <div class="tier-progress">
                ${this.renderTierProgress()}
              </div>
            </div>
            <div class="settlements-list">
              ${this.renderSettlements()}
            </div>
          </main>
          
          <aside class="research-panel">
            <h3>${this.selectedTier.charAt(0).toUpperCase() + this.selectedTier.slice(1)} Research</h3>
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
      const isUnlocked = this.game.getState().unlockedTiers.has(this.selectedTier);
      if (isUnlocked) {
        return '<div class="empty-message">Settlements auto-spawn when you unlock parallel slots!</div>';
      } else {
        return '<div class="empty-message">Complete 6 of the previous tier to unlock this tier.</div>';
      }
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
        <div class="settlement-stats">
          <div class="settlement-stat">
            <span class="stat-label">Currency:</span>
            <span class="stat-value">${formatNumber(settlement.currency)}</span>
          </div>
          <div class="settlement-stat">
            <span class="stat-label">Income:</span>
            <span class="stat-value">${formatIncome(settlement.totalIncome)}</span>
          </div>
        </div>
        <div class="buildings">
          ${tierDef.buildings
            .map((building) => {
              const count = settlement.buildings.get(building.id) ?? 0;
              const cost = this.game.getBuildingCost(settlement.id, building.id) ?? 0;
              const canAfford = settlement.currency >= cost;

              return `
              <div class="building">
                <div class="building-info">
                  <span class="building-name">${building.name} (${count})</span>
                  <span class="building-income">+${formatIncome(building.baseIncome)}</span>
                  ${building.effect ? `<span class="building-effect">${building.effect.description}</span>` : ''}
                </div>
                <button 
                  class="buy-btn ${!canAfford ? 'disabled' : ''}"
                  data-settlement="${settlement.id}"
                  data-building="${building.id}"
                  data-cost="${cost}"
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
    const tierResearchPoints = this.game.getResearchPoints(this.selectedTier);

    // Filter research for current tier
    const tierResearch = state.research.filter((r) => r.tier === this.selectedTier);

    // Filter out research that doesn't meet prerequisites
    const availableResearch = tierResearch.filter((research) => {
      if (research.prerequisite === undefined || research.prerequisite === '') return true;
      const prereq = state.research.find((r) => r.id === research.prerequisite);
      return prereq !== undefined && prereq.purchased;
    });

    return `
      <div class="research-list">
        ${availableResearch
          .map((research) => {
            const canAfford = tierResearchPoints >= research.cost;

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

  private renderTierProgress(): string {
    const state = this.game.getState();
    const completedCount = state.completedSettlements.get(this.selectedTier) ?? 0;
    const progressToNext = completedCount % 6;
    const nextTierUnlocks = 6 - progressToNext;

    return `
      <div class="progress-info">
        <span class="completed-count">${completedCount} completed</span>
        <span class="next-unlock">${nextTierUnlocks === 6 ? '' : `${nextTierUnlocks} more for next tier`}</span>
      </div>
      <div class="tier-progress-bar">
        <div class="tier-progress-fill" style="width: ${(progressToNext / 6) * 100}%"></div>
        <span class="tier-progress-text">${progressToNext} / 6</span>
      </div>
    `;
  }

  public update(): void {
    if (!this.isInitialized) return;

    // Just re-render the entire UI since currency/income are now per-settlement
    this.render();
  }
}
