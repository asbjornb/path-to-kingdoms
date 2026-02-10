import { GameStateManager } from '../game/GameState';
import { TierType, Settlement, Goal, GoalType, BuyAmount } from '../types/game';
import { TIER_DATA, getTierByType } from '../data/tiers';
import { formatNumber, formatIncome } from '../utils/format';

export class UI {
  private game: GameStateManager;
  private container: HTMLElement;
  private selectedTier: TierType = TierType.Hamlet;
  private isInitialized: boolean = false;
  private lastSettlementCount: number = 0;
  private lastSettlementIds: string[] = [];

  constructor(game: GameStateManager, container: HTMLElement) {
    this.game = game;
    this.container = container;
  }

  public render(): void {
    this.isInitialized = true;
    this.lastSettlementCount = this.game.getState().settlements.length;
    this.lastSettlementIds = this.game.getState().settlements.map((s) => s.id);

    this.container.innerHTML = `
      <div class="game-container">
        <header class="game-header">
          <h1>Path to Kingdoms</h1>
          <div class="stats">
            <div class="stat">
              <span class="stat-label">${this.selectedTier.charAt(0).toUpperCase() + this.selectedTier.slice(1)} Research:</span>
              <span class="stat-value" id="research">${this.game.getResearchPoints(this.selectedTier)}</span>
            </div>
            <div class="buy-amount-toggle">
              <span class="toggle-label">Buy:</span>
              ${this.renderBuyAmountButtons()}
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
            <div class="save-controls">
              <button onclick="window.saveGame()" class="save-btn">Save</button>
              <button onclick="window.deleteSave()" class="save-btn danger">Reset</button>
              <button onclick="window.exportSave()" class="save-btn">Export</button>
              <input type="file" id="import-file" style="display: none;" accept=".json" onchange="window.importSave(event)">
              <button onclick="document.getElementById('import-file').click()" class="save-btn">Import</button>
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

    const goal = settlement.goals[0]; // Single goal per settlement
    const goalProgress = goal !== undefined ? `${this.formatGoalProgress(goal)}` : '';

    return `
      <div class="settlement ${settlement.isComplete ? 'complete' : ''}">
        <div class="settlement-header">
          <h4>${tierDef.name} #${settlement.id.split('_')[1].slice(-4)}</h4>
          ${
            goal !== undefined
              ? `<div class="goal-display ${goal.isCompleted ? 'completed' : ''}">
            <span class="goal-description">${goal.description}</span>
            <span class="goal-progress">${goalProgress}</span>
          </div>`
              : ''
          }
          <span class="income">${formatIncome(settlement.totalIncome)}</span>
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
              const buyAmount = this.game.getBuyAmount();
              const { cost, qty } = this.getDisplayCostAndQty(settlement, building.id, buyAmount);
              const canAfford = qty > 0 && settlement.currency >= cost;

              const label =
                buyAmount === 'max' ? `Buy Max (${qty})` : buyAmount > 1 ? `Buy ${qty}x` : 'Buy';

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
                  ${label} (${formatNumber(cost)})
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
    const showCompleted = this.game.isShowCompletedResearchEnabled();

    // Filter research for current tier
    const tierResearch = state.research.filter((r) => r.tier === this.selectedTier);

    // Filter out research that doesn't meet prerequisites
    let availableResearch = tierResearch.filter((research) => {
      if (research.prerequisite === undefined || research.prerequisite === '') return true;
      const prereq = state.research.find((r) => r.id === research.prerequisite);
      return prereq !== undefined && prereq.purchased;
    });

    // Filter out completed research if toggle is disabled
    if (!showCompleted) {
      availableResearch = availableResearch.filter((research) => !research.purchased);
    }

    return `
      <div class="research-header">
        <h3>${this.selectedTier.charAt(0).toUpperCase() + this.selectedTier.slice(1)} Research</h3>
        <div class="research-toggle">
          <label>
            <input 
              type="checkbox" 
              id="show-completed-research" 
              ${showCompleted ? 'checked' : ''}
              onchange="window.toggleShowCompletedResearch()"
            >
            <span class="toggle-label">Show completed</span>
          </label>
        </div>
      </div>
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

  private getDisplayCostAndQty(
    settlement: Settlement,
    buildingId: string,
    buyAmount: BuyAmount,
  ): { cost: number; qty: number } {
    if (buyAmount === 'max') {
      const qty = this.game.getMaxAffordable(settlement.id, buildingId);
      const cost =
        qty > 0
          ? (this.game.getBulkBuyCost(settlement.id, buildingId, qty) ?? 0)
          : (this.game.getBuildingCost(settlement.id, buildingId) ?? 0);
      return { cost, qty };
    }
    const cost = this.game.getBulkBuyCost(settlement.id, buildingId, buyAmount) ?? 0;
    return { cost, qty: buyAmount };
  }

  private renderBuyAmountButtons(): string {
    const current = this.game.getBuyAmount();
    const options: BuyAmount[] = [1, 5, 'max'];
    return options
      .map((amount) => {
        const label = amount === 'max' ? 'Max' : `${amount}x`;
        const isActive = current === amount;
        return `<button class="buy-amount-btn ${isActive ? 'active' : ''}" onclick="window.setBuyAmount(${amount === 'max' ? "'max'" : amount})">${label}</button>`;
      })
      .join('');
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

    // Check if settlement count has changed or settlement IDs have changed (completion/spawning/replacement)
    const currentSettlementCount = this.game.getState().settlements.length;
    const currentSettlementIds = this.game.getState().settlements.map((s) => s.id);

    const countChanged = currentSettlementCount !== this.lastSettlementCount;
    const idsChanged =
      JSON.stringify(currentSettlementIds) !== JSON.stringify(this.lastSettlementIds);

    if (countChanged || idsChanged) {
      this.lastSettlementCount = currentSettlementCount;
      this.lastSettlementIds = currentSettlementIds;
      this.render(); // Full re-render when settlements change
      return;
    }

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

    // Update show completed research checkbox state
    const showCompletedCheckbox = document.getElementById(
      'show-completed-research',
    ) as HTMLInputElement;
    if (showCompletedCheckbox !== null) {
      showCompletedCheckbox.checked = this.game.isShowCompletedResearchEnabled();
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
      const headerIncomeEl = settlementEl.querySelector('.settlement-header .income');

      if (currencyEl !== null) {
        currencyEl.textContent = formatNumber(settlement.currency);
      }
      if (incomeEl !== null) {
        incomeEl.textContent = formatIncome(settlement.totalIncome);
      }
      if (headerIncomeEl !== null) {
        headerIncomeEl.textContent = formatIncome(settlement.totalIncome);
      }

      // Update goal progress (single goal in header)
      const goal = settlement.goals[0];
      if (goal !== undefined) {
        const goalDisplay = settlementEl.querySelector('.goal-display');
        const goalProgressText = settlementEl.querySelector('.goal-progress');

        if (goalProgressText !== null) {
          goalProgressText.textContent = this.formatGoalProgress(goal);
        }

        // Update completion status
        if (
          goal.isCompleted &&
          goalDisplay !== null &&
          !goalDisplay.classList.contains('completed')
        ) {
          goalDisplay.classList.add('completed');
        }
      }

      // Update building counts and button states
      const buyAmount = this.game.getBuyAmount();
      const buildingButtons = settlementEl.querySelectorAll('.buy-btn');
      buildingButtons.forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) return;
        const settlementId = button.getAttribute('data-settlement');
        const buildingId = button.getAttribute('data-building');
        if (settlementId === null || buildingId === null) return;

        // Update building count in the building name
        const buildingEl = button.closest('.building');
        const buildingNameEl = buildingEl?.querySelector('.building-name');
        if (buildingNameEl !== null && buildingNameEl !== undefined) {
          const currentCount = settlement.buildings.get(buildingId) ?? 0;
          const buildingName = buildingNameEl.textContent?.split(' (')[0] ?? '';
          buildingNameEl.textContent = `${buildingName} (${currentCount})`;
        }

        // Calculate cost and quantity based on buy amount
        const { cost, qty } = this.getDisplayCostAndQty(settlement, buildingId, buyAmount);
        const canAfford = qty > 0 && settlement.currency >= cost;

        const label =
          buyAmount === 'max' ? `Buy Max (${qty})` : buyAmount > 1 ? `Buy ${qty}x` : 'Buy';

        // Update cached cost attribute and button text
        button.setAttribute('data-cost', cost.toString());
        button.textContent = `${label} (${formatNumber(cost)})`;

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
