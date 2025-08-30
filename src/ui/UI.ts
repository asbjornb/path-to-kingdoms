import { GameStateManager } from '../game/GameState';
import { TierType, Settlement, Goal, GoalType } from '../types/game';
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
            <div class="dev-mode-toggle">
              <label>
                <input 
                  type="checkbox" 
                  id="dev-mode" 
                  ${this.game.isDevModeEnabled() ? 'checked' : ''}
                  onchange="window.toggleDevMode()"
                >
                <span class="dev-mode-label">Dev Mode (1000x income)</span>
              </label>
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
        <div class="settlement-goals">
          <h5>Goals:</h5>
          ${settlement.goals
            .map((goal) => {
              const progressPercent = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
              return `
              <div class="goal ${goal.isCompleted ? 'completed' : ''}">
                <div class="goal-description">${goal.description}</div>
                <div class="goal-progress">
                  <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${progressPercent}%"></div>
                  </div>
                  <span class="goal-progress-text">${this.formatGoalProgress(goal)}</span>
                </div>
              </div>
            `;
            })
            .join('')}
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

  private formatGoalProgress(goal: Goal): string {
    if (goal.type === GoalType.Survival) {
      const currentMinutes = Math.floor(goal.currentValue / 60);
      const targetMinutes = Math.floor(goal.targetValue / 60);
      return `${currentMinutes}/${targetMinutes} min`;
    }

    return `${formatNumber(goal.currentValue)}/${formatNumber(goal.targetValue)}`;
  }

  public update(): void {
    if (!this.isInitialized) return;

    // Update dynamic values without full re-render to prevent button flickering
    this.updateDynamicValues();
  }

  private updateDynamicValues(): void {
    // Update research points in header
    const researchEl = document.getElementById('research');
    if (researchEl) {
      researchEl.textContent = this.game.getResearchPoints(this.selectedTier).toString();
    }

    // Update dev mode checkbox state
    const devModeCheckbox = document.getElementById('dev-mode') as HTMLInputElement;
    if (devModeCheckbox !== null) {
      devModeCheckbox.checked = this.game.isDevModeEnabled();
    }

    // Update settlement-specific values
    const settlements = this.game
      .getState()
      .settlements.filter((s) => s.tier === this.selectedTier);
    settlements.forEach((settlement, index) => {
      // Find settlement elements by data attribute or index
      const settlementElements = document.querySelectorAll('.settlement');
      const settlementEl = settlementElements[index] as HTMLElement;
      if (settlementEl === null || settlementEl === undefined) return;

      // Update currency and income values
      const currencyEl = settlementEl.querySelector('.settlement-stat .stat-value');
      const incomeEl = settlementEl.querySelectorAll('.settlement-stat .stat-value')[1];

      if (currencyEl !== null) {
        currencyEl.textContent = formatNumber(settlement.currency);
      }
      if (incomeEl !== null) {
        incomeEl.textContent = formatIncome(settlement.totalIncome);
      }

      // Update goal progress
      const goalElements = settlementEl.querySelectorAll('.goal');
      settlement.goals.forEach((goal, goalIndex) => {
        const goalEl = goalElements[goalIndex];
        if (goalEl === null || goalEl === undefined) return;

        const progressPercent = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
        const progressFill = goalEl.querySelector('.goal-progress-fill') as HTMLElement;
        const progressText = goalEl.querySelector('.goal-progress-text');

        if (progressFill !== null) {
          progressFill.style.width = `${progressPercent}%`;
        }
        if (progressText !== null) {
          progressText.textContent = this.formatGoalProgress(goal);
        }

        // Update completion status
        if (goal.isCompleted && !goalEl.classList.contains('completed')) {
          goalEl.classList.add('completed');
        }
      });

      // Update building button states
      const buildingButtons = settlementEl.querySelectorAll('.buy-btn');
      buildingButtons.forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) return;
        const costAttr = button.getAttribute('data-cost');
        if (costAttr === null || costAttr === '') return;

        const cost = parseFloat(costAttr);
        const canAfford = settlement.currency >= cost;

        if (canAfford && button.disabled === true) {
          button.disabled = false;
          button.classList.remove('disabled');
        } else if (!canAfford && button.disabled === false) {
          button.disabled = true;
          button.classList.add('disabled');
        }
      });
    });

    // Update research button states
    const researchButtons = document.querySelectorAll('.research-btn');
    researchButtons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      const costText = button.textContent?.match(/\((\d+)\s+points\)/);
      if (costText && costText[1]) {
        const cost = parseInt(costText[1]);
        const canAfford = this.game.getResearchPoints(this.selectedTier) >= cost;

        if (canAfford && button.disabled === true) {
          button.disabled = false;
          button.classList.remove('disabled');
        } else if (!canAfford && button.disabled === false) {
          button.disabled = true;
          button.classList.add('disabled');
        }
      }
    });
  }
}
