import { GameStateManager } from '../game/GameState';
import {
  TierType,
  GameNotification,
  Settlement,
  Goal,
  GoalType,
  BuyAmount,
  PrestigeUpgrade,
  ResearchUpgrade,
} from '../types/game';
import { TIER_DATA, getTierByType } from '../data/tiers';
import { getPrestigeUpgradeCost } from '../data/prestige';
import { formatNumber, formatIncome } from '../utils/format';
import { getAppVersion } from '../version';

export class UI {
  private game: GameStateManager;
  private container: HTMLElement;
  private selectedTier: TierType = TierType.Hamlet;
  private isInitialized: boolean = false;
  private lastSettlementCount: number = 0;
  private lastSettlementIds: string[] = [];
  private showAchievements: boolean = false;
  private prestigeShopOpen: boolean = false;
  private selectedPrestigeUpgrades: Set<string> = new Set();
  private notificationContainer: HTMLElement;
  private activeNotificationIds: Set<string> = new Set();
  private prestigeSearchQuery: string = '';
  private prestigeShopSearchQuery: string = '';
  private holdBuyTimer: ReturnType<typeof setTimeout> | null = null;
  private holdBuyInterval: ReturnType<typeof setInterval> | null = null;
  private gameInfoOpen: boolean = false;

  constructor(game: GameStateManager, container: HTMLElement) {
    this.game = game;
    this.container = container;
    this.notificationContainer = this.createNotificationContainer();
    this.setupHoldToBuy();
  }

  private createNotificationContainer(): HTMLElement {
    const existing = document.getElementById('notification-container');
    if (existing) return existing;
    const el = document.createElement('div');
    el.id = 'notification-container';
    el.className = 'notification-container';
    document.body.appendChild(el);
    return el;
  }

  private setupHoldToBuy(): void {
    const INITIAL_DELAY = 400;
    const REPEAT_INTERVAL = 100;

    this.container.addEventListener('pointerdown', (e: PointerEvent) => {
      const btn = (e.target as HTMLElement).closest('.buy-btn');
      if (!(btn instanceof HTMLButtonElement) || btn.disabled) return;

      const settlementId = btn.getAttribute('data-settlement');
      const buildingId = btn.getAttribute('data-building');
      if (settlementId === null || buildingId === null) return;

      // Immediate buy on first press
      window.buyBuilding(settlementId, buildingId);

      // After initial delay, start repeating
      this.holdBuyTimer = setTimeout(() => {
        this.holdBuyInterval = setInterval(() => {
          window.buyBuilding(settlementId, buildingId);
        }, REPEAT_INTERVAL);
      }, INITIAL_DELAY);
    });

    document.addEventListener('pointerup', () => this.stopHoldBuy());
    document.addEventListener('pointercancel', () => this.stopHoldBuy());

    // Prevent context menu on long-press of buy buttons (mobile)
    this.container.addEventListener('contextmenu', (e: Event) => {
      if ((e.target as HTMLElement).closest('.buy-btn') !== null) {
        e.preventDefault();
      }
    });
  }

  private stopHoldBuy(): void {
    if (this.holdBuyTimer !== null) {
      window.clearTimeout(this.holdBuyTimer);
      this.holdBuyTimer = null;
    }
    if (this.holdBuyInterval !== null) {
      window.clearInterval(this.holdBuyInterval);
      this.holdBuyInterval = null;
    }
  }

  public isPrestigeShopOpen(): boolean {
    return this.prestigeShopOpen;
  }

  public openPrestigeShop(): void {
    this.prestigeShopOpen = true;
    this.selectedPrestigeUpgrades = new Set();
    this.prestigeShopSearchQuery = '';
  }

  public closePrestigeShop(): void {
    this.prestigeShopOpen = false;
    this.selectedPrestigeUpgrades = new Set();
  }

  public getSelectedPrestigeUpgrades(): Set<string> {
    return this.selectedPrestigeUpgrades;
  }

  public setPrestigeSearch(query: string): void {
    this.prestigeSearchQuery = query;
  }

  public setPrestigeShopSearch(query: string): void {
    this.prestigeShopSearchQuery = query;
  }

  private getUpgradeBuildingTags(
    upgrade: PrestigeUpgrade,
  ): { tierName: string; buildingName: string }[] {
    const tags: { tierName: string; buildingName: string }[] = [];
    const findBuilding = (buildingId: string): void => {
      for (const tier of TIER_DATA) {
        const building = tier.buildings.find((b) => b.id === buildingId);
        if (building !== undefined) {
          tags.push({ tierName: tier.name, buildingName: building.name });
          break;
        }
      }
    };
    if (upgrade.effect.targetBuilding !== undefined) {
      findBuilding(upgrade.effect.targetBuilding);
    }
    if (upgrade.effect.sourceBuilding !== undefined) {
      findBuilding(upgrade.effect.sourceBuilding);
    }
    return tags;
  }

  private getUpgradeSearchText(upgrade: PrestigeUpgrade): string {
    const tags = this.getUpgradeBuildingTags(upgrade);
    const tierName = upgrade.tier.charAt(0).toUpperCase() + upgrade.tier.slice(1);
    return [
      upgrade.name,
      upgrade.description,
      tierName,
      ...tags.map((t) => `${t.tierName} ${t.buildingName}`),
    ]
      .join(' ')
      .toLowerCase();
  }

  private upgradeMatchesSearch(upgrade: PrestigeUpgrade, query: string): boolean {
    if (query === '') return true;
    const searchText = this.getUpgradeSearchText(upgrade);
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0)
      .every((term) => searchText.includes(term));
  }

  private renderUpgradeTags(upgrade: PrestigeUpgrade): string {
    const tags = this.getUpgradeBuildingTags(upgrade);
    if (tags.length === 0) return '';
    return `<span class="prestige-upgrade-tags">${tags
      .map((tag) => `<span class="prestige-upgrade-tag">${tag.tierName} ${tag.buildingName}</span>`)
      .join('')}</span>`;
  }

  public togglePrestigeUpgradeSelection(upgradeId: string): void {
    if (this.selectedPrestigeUpgrades.has(upgradeId)) {
      this.selectedPrestigeUpgrades.delete(upgradeId);
    } else {
      // Validate selection is affordable with remaining budget
      if (this.canSelectPrestigeUpgrade(upgradeId)) {
        this.selectedPrestigeUpgrades.add(upgradeId);
      }
    }
  }

  private canSelectPrestigeUpgrade(upgradeId: string): boolean {
    const state = this.game.getState();
    const preview = this.game.getPrestigePreview();
    const upgrade = state.prestigeUpgrades.find((u) => u.id === upgradeId);
    if (!upgrade || upgrade.purchased) return false;

    // Check prerequisite: must be already purchased OR selected
    if (upgrade.prerequisite !== undefined && upgrade.prerequisite !== '') {
      const prereq = state.prestigeUpgrades.find((u) => u.id === upgrade.prerequisite);
      if (!prereq || (!prereq.purchased && !this.selectedPrestigeUpgrades.has(prereq.id))) {
        return false;
      }
    }

    // Calculate available budget for this tier: current + preview earnings - already selected costs
    const currentCurrency = state.prestigeCurrency.get(upgrade.tier) ?? 0;
    const earnedCurrency = preview.get(upgrade.tier) ?? 0;
    const totalBudget = currentCurrency + earnedCurrency;

    // Sum costs of already selected upgrades for same tier
    let selectedCost = 0;
    for (const selectedId of this.selectedPrestigeUpgrades) {
      const sel = state.prestigeUpgrades.find((u) => u.id === selectedId);
      if (sel && sel.tier === upgrade.tier) {
        selectedCost += sel.cost;
      }
    }

    return totalBudget - selectedCost >= upgrade.cost;
  }

  public toggleAchievements(): void {
    this.showAchievements = !this.showAchievements;
  }

  public toggleGameInfo(): void {
    this.gameInfoOpen = !this.gameInfoOpen;
  }

  public render(): void {
    this.isInitialized = true;
    this.lastSettlementCount = this.game.getState().settlements.length;
    this.lastSettlementIds = this.game.getState().settlements.map((s) => s.id);

    const settlementsArea = this.container.querySelector('.settlements-area');
    const savedSettlementsScroll = settlementsArea !== null ? settlementsArea.scrollTop : 0;
    const researchPanel = this.container.querySelector('.research-panel');
    const savedResearchScroll = researchPanel !== null ? researchPanel.scrollTop : 0;
    const prestigeModal = this.container.querySelector('.prestige-shop-modal');
    const savedModalScroll = prestigeModal !== null ? prestigeModal.scrollTop : 0;

    this.container.innerHTML = `
      <div class="game-container">
        <header class="game-header">
          <h1>Path to Kingdoms <span class="version-label">v${getAppVersion()}</span></h1>
          <div class="stats">
            ${this.renderPrestigeHeader()}
            <div class="buy-amount-toggle">
              <span class="toggle-label">Buy:</span>
              ${this.renderBuyAmountButtons()}
            </div>
            <div class="compact-toggle">
              <label>
                <input
                  type="checkbox"
                  id="compact-view-toggle"
                  ${this.game.isCompactViewEnabled() ? 'checked' : ''}
                  onchange="window.toggleCompactView()"
                >
                <span class="toggle-label">Compact</span>
              </label>
            </div>
            <div class="save-controls">
              <button onclick="window.saveGame()" class="save-btn">Save</button>
              <button onclick="window.deleteSave()" class="save-btn danger">Reset</button>
              <button onclick="window.exportSave()" class="save-btn">Export</button>
              <input type="file" id="import-file" style="display: none;" accept=".json" onchange="window.importSave(event)">
              <button onclick="document.getElementById('import-file').click()" class="save-btn">Import</button>
              <button onclick="window.toggleGameInfo()" class="save-btn info-btn">Info</button>
            </div>
          </div>
        </header>
        
        <div class="game-content">
          <nav class="tier-tabs">
            ${this.renderTierTabs()}
          </nav>
          
          <main class="settlements-area">
            <div class="tier-header">
              <div class="tier-header-top">
                <h2>${this.selectedTier.charAt(0).toUpperCase() + this.selectedTier.slice(1)}s</h2>
                <label class="goal-notification-toggle">
                  <input
                    type="checkbox"
                    id="goal-notification-toggle"
                    ${this.game.isGoalNotificationEnabled(this.selectedTier) ? 'checked' : ''}
                    onchange="window.toggleGoalNotification('${this.selectedTier}')"
                  >
                  <span class="toggle-label">Goal alerts</span>
                </label>
              </div>
              ${this.renderMastery()}
              ${this.renderPatronage()}
              <div class="tier-progress">
                ${this.renderTierProgress()}
              </div>
            </div>
            ${this.renderAchievements()}
            <div class="settlements-list">
              ${this.renderSettlements()}
            </div>
          </main>
          
          <aside class="research-panel">
            ${this.renderResearch()}
            ${this.renderPrestigeUpgrades()}
          </aside>
        </div>
      </div>
      ${this.renderPrestigeShopOverlay()}
      ${this.renderGameInfoModal()}
    `;

    const newSettlementsArea = this.container.querySelector('.settlements-area');
    if (newSettlementsArea !== null && savedSettlementsScroll > 0) {
      newSettlementsArea.scrollTop = savedSettlementsScroll;
    }
    const newResearchPanel = this.container.querySelector('.research-panel');
    if (newResearchPanel !== null && savedResearchScroll > 0) {
      newResearchPanel.scrollTop = savedResearchScroll;
    }
    const newPrestigeModal = this.container.querySelector('.prestige-shop-modal');
    if (newPrestigeModal !== null && savedModalScroll > 0) {
      newPrestigeModal.scrollTop = savedModalScroll;
    }
  }

  private renderTierTabs(): string {
    const state = this.game.getState();
    return TIER_DATA.map((tier) => {
      const isUnlocked = state.unlockedTiers.has(tier.type);
      const isSelected = tier.type === this.selectedTier;
      const activeCount = state.settlements.filter((s) => s.tier === tier.type).length;
      const completedCount = state.completedSettlements.get(tier.type) ?? 0;

      if (!isUnlocked) {
        return `<button class="tier-tab locked" disabled>???</button>`;
      }

      const showBadge = activeCount > 0 || completedCount > 0;

      return `
        <button
          class="tier-tab ${isSelected ? 'active' : ''}"
          onclick="window.selectTier('${tier.type}')"
        >
          ${tier.name}
          ${showBadge ? `<span class="badge">${activeCount} / ${completedCount}</span>` : ''}
        </button>
      `;
    }).join('');
  }

  private renderSettlements(): string {
    const state = this.game.getState();
    const settlements = state.settlements.filter((s) => s.tier === this.selectedTier);

    if (settlements.length === 0) {
      const isUnlocked = this.game.getState().unlockedTiers.has(this.selectedTier);
      if (isUnlocked && this.selectedTier === TierType.Hamlet) {
        return '<div class="empty-message">Settlements auto-spawn when you unlock parallel slots!</div>';
      } else if (isUnlocked) {
        const tierIndex = TIER_DATA.findIndex((t) => t.type === this.selectedTier);
        const prevTier = tierIndex > 0 ? TIER_DATA[tierIndex - 1].type : this.selectedTier;
        const prevTierName = tierIndex > 0 ? TIER_DATA[tierIndex - 1].name : 'previous tier';
        const req = this.game.getTierRequirement(prevTier);
        return `<div class="empty-message">Complete ${req} ${prevTierName}s to earn a new settlement here.</div>`;
      } else {
        const tierIndex = TIER_DATA.findIndex((t) => t.type === this.selectedTier);
        const prevTier = tierIndex > 0 ? TIER_DATA[tierIndex - 1].type : this.selectedTier;
        const req = this.game.getTierRequirement(prevTier);
        return `<div class="empty-message">Complete ${req} of the previous tier to unlock this tier.</div>`;
      }
    }

    return settlements.map((settlement) => this.renderSettlement(settlement)).join('');
  }

  private renderSettlement(settlement: Settlement): string {
    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return '';

    const compact = this.game.isCompactViewEnabled();
    const goal = settlement.goals[0]; // Single goal per settlement
    const goalProgress = goal !== undefined ? `${this.formatGoalProgress(goal, settlement)}` : '';

    return `
      <div class="settlement ${settlement.isComplete ? 'complete' : ''} ${compact ? 'compact' : ''}">
        <div class="settlement-header">
          <h4>${tierDef.name} #${settlement.id.split('_')[1].slice(-4)}</h4>
          ${
            goal !== undefined
              ? `<div class="goal-display ${goal.isCompleted ? 'completed' : ''}">
            <span class="goal-description">${this.formatGoalDescription(goal, settlement)}</span>
            <span class="goal-progress">${goalProgress}</span>
          </div>`
              : ''
          }
          <span class="income">${formatIncome(settlement.totalIncome + this.game.getCrossTierBonus(settlement.id))}</span>
          ${compact ? `<span class="stat-value compact-currency">${formatNumber(settlement.currency)}</span>` : ''}
        </div>
        ${
          !compact
            ? `<div class="settlement-stats">
          <div class="settlement-stat">
            <span class="stat-label">Currency:</span>
            <span class="stat-value">${formatNumber(settlement.currency)}</span>
          </div>
          <div class="settlement-stat">
            <span class="stat-label">Income:</span>
            <span class="stat-value">${formatIncome(settlement.totalIncome)}</span>
          </div>
          ${((): string => {
            const crossBonus = this.game.getCrossTierBonus(settlement.id);
            return crossBonus >= 1
              ? `<div class="settlement-stat cross-tier-stat" title="Bonus income from completing higher-tier settlements. Each completion grants 5% of that tier's base building income to all lower-tier settlements.">
                <span class="stat-label">Patronage:</span>
                <span class="stat-value cross-tier-value">+${formatIncome(crossBonus)}</span>
              </div>`
              : '';
          })()}
        </div>`
            : ''
        }
        <div class="buildings">
          ${tierDef.buildings
            .map((building) => {
              const count = settlement.buildings.get(building.id) ?? 0;
              const buyAmount = this.game.getBuyAmount();
              const { cost, qty } = this.getDisplayCostAndQty(settlement, building.id, buyAmount);
              const canAfford = qty > 0 && settlement.currency >= cost;

              const label =
                buyAmount === 'max'
                  ? `Buy Max (<span class="buy-qty">${qty}</span>)`
                  : buyAmount > 1
                    ? `Buy ${qty}x`
                    : 'Buy';

              const effectiveIncome = this.game.getEffectiveBuildingIncome(
                settlement.id,
                building.id,
              );
              const isBoosted = effectiveIncome > building.baseIncome;

              return `
              <div class="building">
                <div class="building-header">
                  <span class="building-name">${building.name} (${count})</span>
                  <button
                    class="buy-btn ${!canAfford ? 'disabled' : ''}"
                    data-settlement="${settlement.id}"
                    data-building="${building.id}"
                    data-cost="${cost}"
                    ${!canAfford ? 'disabled' : ''}
                  >
                    ${label} (<span class="buy-cost">${formatNumber(cost)}</span>)
                  </button>
                </div>
                <div class="building-details">
                  <span class="building-income ${isBoosted ? 'boosted' : ''}">+${formatIncome(effectiveIncome)}</span>
                  ${building.effect ? `<span class="building-effect">${building.effect.description}</span>` : ''}
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  private sortResearch(research: ResearchUpgrade[], buildingIds: string[]): ResearchUpgrade[] {
    const categoryOrder: Record<string, number> = {
      parallel_slots: 0,
      starting_income: 1,
      cost_reduction: 2,
      flat_cost_count: 3,
      auto_building: 4,
      tier_requirement_reduction: 5,
    };

    return [...research].sort((a, b) => {
      const catA = categoryOrder[a.effect.type] ?? 99;
      const catB = categoryOrder[b.effect.type] ?? 99;
      if (catA !== catB) return catA - catB;

      // Within auto_building, sort by building index then cost
      if (a.effect.type === 'auto_building' && b.effect.type === 'auto_building') {
        const idxA = buildingIds.indexOf(a.effect.buildingId ?? '');
        const idxB = buildingIds.indexOf(b.effect.buildingId ?? '');
        if (idxA !== idxB) return idxA - idxB;
      }

      return a.cost - b.cost;
    });
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

    // Stable sort: by category, then building order, then cost
    const tierDef = getTierByType(this.selectedTier);
    const buildingIds = tierDef?.buildings.map((b) => b.id) ?? [];
    availableResearch = this.sortResearch(availableResearch, buildingIds);

    const hasAutoBuilding = availableResearch.some(
      (r) => r.effect.type === 'auto_building' && !r.purchased,
    );

    return `
      <div class="research-points-display">
        <span class="stat-label">Research Points:</span>
        <span class="stat-value" id="research">${tierResearchPoints}</span>
      </div>
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
      ${hasAutoBuilding ? '<p class="research-auto-note">Auto-builders spend up to 5% of treasury per purchase. First of each type is always bought when affordable.</p>' : ''}
      <div class="research-list">
        ${availableResearch
          .map((research) => {
            const canAfford = tierResearchPoints >= research.cost;

            if (research.purchased) {
              return `
              <div class="research-item purchased" title="${this.escapeAttr(research.description)}">
                <span class="research-item-name">${research.name}</span>
                <span class="purchased-label">Purchased</span>
              </div>`;
            }

            const hint = this.game.getResearchComparisonHint(research);
            return `
            <div class="research-item clickable ${!canAfford ? 'cant-afford' : ''}"
              data-cost="${research.cost}"
              onclick="window.purchaseResearch('${research.id}')"
            >
              <div class="research-item-top">
                <span class="research-item-name">${research.name}</span>
                <span class="research-cost">${research.cost} pts</span>
              </div>
              <p class="research-desc">${research.description}${hint !== '' ? ` <span class="research-hint">${hint}</span>` : ''}</p>
            </div>
          `;
          })
          .join('')}
      </div>
    `;
  }

  private escapeAttr(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  private getDisplayCostAndQty(
    settlement: Settlement,
    buildingId: string,
    buyAmount: BuyAmount,
  ): { cost: number; qty: number } {
    if (buyAmount === 'max') {
      const { count: qty, cost } = this.game.getMaxAffordableWithCost(settlement.id, buildingId);
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

  private renderPrestigeHeader(): string {
    const prestigeCount = this.game.getPrestigeCount();
    const canPrestige = this.game.canPrestige();
    const prestigeCurrency = this.game.getPrestigeCurrency(this.selectedTier);
    const tierName = this.selectedTier.charAt(0).toUpperCase() + this.selectedTier.slice(1);

    const parts: string[] = [];

    if (prestigeCount > 0) {
      parts.push(`<span class="prestige-count">Prestige ${prestigeCount}</span>`);
    }

    if (this.selectedTier !== TierType.Hamlet && prestigeCurrency > 0) {
      parts.push(`<span class="prestige-currency">${tierName} Crowns: ${prestigeCurrency}</span>`);
    }

    if (canPrestige) {
      parts.push(
        `<button onclick="window.performPrestige()" class="prestige-btn">Prestige</button>`,
      );
    }

    if (parts.length === 0) return '';

    return `<div class="prestige-header-info">${parts.join('')}</div>`;
  }

  private renderPrestigeUpgrades(): string {
    const state = this.game.getState();

    // Check if any prestige currency exists
    let hasAnyCurrency = false;
    for (const amount of state.prestigeCurrency.values()) {
      if (amount > 0) {
        hasAnyCurrency = true;
        break;
      }
    }
    // Also show if any prestige upgrades have been purchased (or levelled)
    const hasPurchased = state.prestigeUpgrades.some(
      (u) => u.purchased || (u.repeatable === true && (u.level ?? 0) > 0),
    );
    if (!hasAnyCurrency && !hasPurchased) return '';

    const showShop = this.game.isShowPrestigeShopEnabled();
    const purchasedUpgrades = state.prestigeUpgrades.filter(
      (u) => u.purchased || (u.repeatable === true && (u.level ?? 0) > 0),
    );

    return `
      <div class="prestige-upgrades-section">
        <div class="research-header">
          <h3>Prestige Upgrades</h3>
          <div class="research-toggle">
            <label>
              <input
                type="checkbox"
                id="show-prestige-shop"
                ${showShop ? 'checked' : ''}
                onchange="window.toggleShowPrestigeShop()"
              >
              <span class="toggle-label">Show owned</span>
            </label>
          </div>
        </div>
        ${
          showShop && purchasedUpgrades.length > 0
            ? `
          <input type="text" class="prestige-search-input" placeholder="Search upgrades..." value="${this.prestigeSearchQuery}" oninput="window.filterPrestigeUpgrades(this.value)">
          <div class="research-list">
            ${purchasedUpgrades
              .map((upgrade) => {
                const searchText = this.getUpgradeSearchText(upgrade);
                const matchesSearch = this.upgradeMatchesSearch(upgrade, this.prestigeSearchQuery);
                const upgradeTags = this.renderUpgradeTags(upgrade);
                const isRepeatable = upgrade.repeatable === true;
                const level = upgrade.level ?? 0;
                const levelBadge =
                  isRepeatable && level > 0
                    ? `<span class="prestige-level-badge">Lv.${level}</span>`
                    : '';

                return `
                <div class="research-item prestige-item purchased ${isRepeatable ? 'repeatable' : ''}" data-search-text="${searchText}"${!matchesSearch ? ' style="display:none"' : ''}>
                  <h4>${upgrade.name} ${levelBadge}</h4>
                  ${upgradeTags}
                  <p>${upgrade.description}</p>
                  <span class="purchased-label">${isRepeatable ? `Level ${level}` : 'Purchased'}</span>
                </div>
              `;
              })
              .join('')}
          </div>
        `
            : showShop
              ? '<p class="prestige-shop-empty">No prestige upgrades purchased yet.</p>'
              : ''
        }
      </div>
    `;
  }

  private renderPrestigeShopOverlay(): string {
    if (!this.prestigeShopOpen) return '';

    const state = this.game.getState();
    const preview = this.game.getPrestigePreview();

    // Build currency summary: current + earned = total per tier
    const currencyRows: string[] = [];
    for (const tier of TIER_DATA) {
      if (tier.type === TierType.Hamlet) continue;
      const current = state.prestigeCurrency.get(tier.type) ?? 0;
      const earned = preview.get(tier.type) ?? 0;
      if (current > 0 || earned > 0) {
        currencyRows.push(`
          <div class="prestige-shop-currency-row">
            <span class="prestige-shop-tier-name">${tier.name} Crowns</span>
            <span class="prestige-shop-currency-detail">
              ${current > 0 ? `<span class="currency-current">${current} held</span>` : ''}
              ${earned > 0 ? `<span class="currency-earned">+${earned} earned</span>` : ''}
              <span class="currency-total">= ${current + earned} total</span>
            </span>
          </div>
        `);
      }
    }

    // Calculate remaining budget per tier
    const budgetByTier = new Map<TierType, number>();
    for (const tier of TIER_DATA) {
      if (tier.type === TierType.Hamlet) continue;
      const current = state.prestigeCurrency.get(tier.type) ?? 0;
      const earned = preview.get(tier.type) ?? 0;
      let selectedCost = 0;
      for (const selectedId of this.selectedPrestigeUpgrades) {
        const sel = state.prestigeUpgrades.find((u) => u.id === selectedId);
        if (sel && sel.tier === tier.type) {
          selectedCost += getPrestigeUpgradeCost(sel);
        }
      }
      budgetByTier.set(tier.type, current + earned - selectedCost);
    }

    // Show all prestige upgrades (filtering by prerequisites as before, but also
    // considering selected upgrades as "virtually purchased" for prerequisite checks)
    const isPrereqMet = (prereqId: string): boolean => {
      const prereq = state.prestigeUpgrades.find((u) => u.id === prereqId);
      if (!prereq) return false;
      if (this.selectedPrestigeUpgrades.has(prereq.id)) return true;
      return prereq.repeatable === true ? (prereq.level ?? 0) > 0 : prereq.purchased;
    };
    const upgrades = state.prestigeUpgrades
      .filter((upgrade) => {
        // Non-repeatable purchased upgrades go in the "owned" section
        if (upgrade.purchased && upgrade.repeatable !== true) return false;
        if (upgrade.prerequisite === undefined || upgrade.prerequisite === '') return true;
        return isPrereqMet(upgrade.prerequisite);
      })
      .sort((a, b) => {
        const aBudget = budgetByTier.get(a.tier) ?? 0;
        const bBudget = budgetByTier.get(b.tier) ?? 0;
        const aCost = getPrestigeUpgradeCost(a);
        const bCost = getPrestigeUpgradeCost(b);
        const aAffordable = this.selectedPrestigeUpgrades.has(a.id) || aBudget >= aCost;
        const bAffordable = this.selectedPrestigeUpgrades.has(b.id) || bBudget >= bCost;
        if (aAffordable !== bAffordable) return aAffordable ? -1 : 1;
        return aCost - bCost;
      });

    // Also show already-purchased one-time upgrades for context
    const purchasedUpgrades = state.prestigeUpgrades.filter(
      (u) => u.purchased && u.repeatable !== true,
    );

    return `
      <div class="prestige-shop-overlay" id="prestige-shop-overlay">
        <div class="prestige-shop-modal">
          <div class="prestige-shop-header">
            <h2>Prestige Shop</h2>
            <button class="prestige-shop-close-btn" onclick="window.closePrestigeShop()">Close</button>
          </div>

          <div class="prestige-shop-description">
            <p>Select upgrades below to purchase when you prestige, or prestige without buying anything.</p>
            <details class="prestige-info-details">
              <summary>What happens when you prestige?</summary>
              <div class="prestige-info-lists">
                <div class="prestige-info-lost">
                  <strong>Reset:</strong>
                  <ul>
                    <li>All settlements</li>
                    <li>All research purchases</li>
                    <li>Research points</li>
                    <li>Mastery progress</li>
                    <li>Unlocked tiers (back to Hamlet)</li>
                  </ul>
                </div>
                <div class="prestige-info-kept">
                  <strong>Kept:</strong>
                  <ul>
                    <li>Crowns (prestige currency)</li>
                    <li>Purchased prestige upgrades</li>
                    <li>Achievements</li>
                  </ul>
                </div>
              </div>
            </details>
          </div>

          ${
            currencyRows.length > 0
              ? `
            <div class="prestige-shop-currencies">
              <h3>Crown Earnings</h3>
              ${currencyRows.join('')}
            </div>
          `
              : '<div class="prestige-shop-currencies"><p class="prestige-shop-no-earnings">No crowns will be earned. You need non-Hamlet tier completions.</p></div>'
          }

          <div class="prestige-shop-upgrades">
            <h3>Available Upgrades</h3>
            <input type="text" class="prestige-search-input" placeholder="Search upgrades..." value="${this.prestigeShopSearchQuery}" oninput="window.filterPrestigeShop(this.value)">
            ${
              purchasedUpgrades.length > 0
                ? `
              <div class="research-toggle">
                <label>
                  <input
                    type="checkbox"
                    id="show-completed-prestige"
                    ${this.game.isShowCompletedPrestigeEnabled() ? 'checked' : ''}
                    onchange="window.toggleShowCompletedPrestige()"
                  >
                  <span class="toggle-label">Show owned</span>
                </label>
              </div>
              ${
                this.game.isShowCompletedPrestigeEnabled()
                  ? `<div class="prestige-shop-purchased">
                ${purchasedUpgrades
                  .map((upgrade) => {
                    const searchText = this.getUpgradeSearchText(upgrade);
                    const matchesSearch = this.upgradeMatchesSearch(
                      upgrade,
                      this.prestigeShopSearchQuery,
                    );
                    const upgradeTags = this.renderUpgradeTags(upgrade);
                    return `
                    <div class="prestige-shop-upgrade purchased" data-search-text="${searchText}"${!matchesSearch ? ' style="display:none"' : ''}>
                      <div class="prestige-shop-upgrade-info">
                        <span class="prestige-shop-upgrade-name">${upgrade.name}</span>
                        ${upgradeTags}
                        <span class="prestige-shop-upgrade-desc">${upgrade.description}</span>
                      </div>
                      <span class="prestige-shop-purchased-label">Owned</span>
                    </div>
                  `;
                  })
                  .join('')}
              </div>`
                  : ''
              }
            `
                : ''
            }
            <div class="prestige-shop-available">
              ${
                upgrades.length > 0
                  ? upgrades
                      .map((upgrade) => {
                        const actualCost = getPrestigeUpgradeCost(upgrade);
                        const tierName =
                          upgrade.tier.charAt(0).toUpperCase() + upgrade.tier.slice(1);
                        const isSelected = this.selectedPrestigeUpgrades.has(upgrade.id);
                        const remaining = budgetByTier.get(upgrade.tier) ?? 0;
                        const canAfford = isSelected || remaining >= actualCost;
                        const searchText = this.getUpgradeSearchText(upgrade);
                        const matchesSearch = this.upgradeMatchesSearch(
                          upgrade,
                          this.prestigeShopSearchQuery,
                        );
                        const upgradeTags = this.renderUpgradeTags(upgrade);
                        const isRepeatable = upgrade.repeatable === true;
                        const level = upgrade.level ?? 0;
                        const levelBadge =
                          isRepeatable && level > 0
                            ? ` <span class="prestige-level-badge">Lv.${level}</span>`
                            : '';

                        return `
                  <div class="prestige-shop-upgrade ${isSelected ? 'selected' : ''} ${!canAfford ? 'unaffordable' : ''} ${isRepeatable ? 'repeatable' : ''}"
                       data-search-text="${searchText}"${!matchesSearch ? ' style="display:none"' : ''}
                       onclick="window.togglePrestigeShopUpgrade('${upgrade.id}')">
                    <div class="prestige-shop-upgrade-info">
                      <span class="prestige-shop-upgrade-name">${upgrade.name}${levelBadge}</span>
                      ${upgradeTags}
                      <span class="prestige-shop-upgrade-desc">${upgrade.description}</span>
                    </div>
                    <div class="prestige-shop-upgrade-cost">
                      <span class="prestige-shop-cost-amount">${actualCost} ${tierName} Crown${actualCost !== 1 ? 's' : ''}</span>
                      ${isSelected ? '<span class="prestige-shop-selected-badge">Selected</span>' : ''}
                    </div>
                  </div>
                `;
                      })
                      .join('')
                  : '<p class="prestige-shop-empty">No upgrades available yet. Earn crowns from higher-tier completions to unlock upgrades.</p>'
              }
            </div>
          </div>

          <div class="prestige-shop-actions">
            <button class="prestige-shop-cancel-btn" onclick="window.closePrestigeShop()">Cancel</button>
            <button class="prestige-shop-confirm-btn" onclick="window.confirmPrestige()">
              Prestige${this.selectedPrestigeUpgrades.size > 0 ? ` (${this.selectedPrestigeUpgrades.size} upgrade${this.selectedPrestigeUpgrades.size !== 1 ? 's' : ''})` : ''}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderGameInfoModal(): string {
    if (!this.gameInfoOpen) return '';

    return `
      <div class="game-info-overlay" onclick="if(event.target===this)window.toggleGameInfo()">
        <div class="game-info-modal">
          <div class="game-info-header">
            <h2>Game Guide</h2>
            <button class="game-info-close-btn" onclick="window.toggleGameInfo()">Close</button>
          </div>

          <div class="game-info-content">
            <section class="game-info-section">
              <h3>About</h3>
              <p>
                Path to Kingdoms is an idle game inspired by
                <strong>Matter of Scale</strong> by astarsearcher &mdash; a wonderful
                incremental game that has since been discontinued. This project aims to
                capture the spirit of the original while continuing its legacy with
                new improvements and original content.
              </p>
            </section>

            <section class="game-info-section">
              <h3>Core Loop</h3>
              <p>
                Build structures to earn income, complete goals to finish settlements,
                finish enough settlements to unlock the next tier, and repeat across
                8 tiers of civilization &mdash; from Hamlet all the way to Kingdom.
              </p>
            </section>

            <section class="game-info-section">
              <details>
                <summary>Buildings &amp; Income</summary>
                <p>
                  Each tier has 6 unique buildings. Buying a building increases your
                  settlement's income. Building costs rise with each purchase based on
                  a cost multiplier. Some buildings have special effects like boosting
                  income from other buildings, reducing costs, or granting completion
                  bonuses.
                </p>
              </details>
            </section>

            <section class="game-info-section">
              <details>
                <summary>Goals &amp; Settlement Completion</summary>
                <p>
                  Every settlement has a randomly generated goal to complete &mdash;
                  reach a target income, accumulate currency, build a certain number of
                  structures, or survive for a duration. Once you meet the goal, the
                  settlement is completed and you earn research points. Completing a
                  settlement will spawn a new one.
                </p>
              </details>
            </section>

            <section class="game-info-section">
              <details>
                <summary>Parallel Slots</summary>
                <p>
                  Hamlets are limited to one settlement at a time until you research
                  the &ldquo;Parallel Slots&rdquo; upgrade. All other tiers have
                  unlimited parallelism &mdash; the only bottleneck is how fast you
                  can complete settlements in earlier tiers to unlock the next one.
                </p>
              </details>
            </section>

            <section class="game-info-section">
              <details>
                <summary>Research</summary>
                <p>
                  Spend research points earned from completions on upgrades scoped to
                  each tier. Options include cost reductions, extra parallel slots,
                  starting income, starting buildings, auto-building, and reduced tier
                  requirements. Research resets on prestige but can be re-purchased.
                </p>
              </details>
            </section>

            <section class="game-info-section">
              <details>
                <summary>Mastery</summary>
                <p>
                  Each settlement completion adds permanent mastery to that tier.
                  Mastery provides a stacking income bonus (+0.1% per completion),
                  starting currency for new settlements, and faster auto-build speed.
                  Income and starting currency bonuses have diminishing returns
                  past 200 completions. Mastery resets on prestige but accumulates
                  faster each run.
                </p>
              </details>
            </section>

            <section class="game-info-section">
              <details>
                <summary>Prestige</summary>
                <p>
                  Once you have at least one non-Hamlet tier completion, you can
                  prestige. This resets your settlements, research, research points,
                  mastery, and unlocked tiers &mdash; but you earn Crowns based on your
                  tier completions. Spend Crowns in the Prestige Shop on powerful
                  permanent upgrades: income multipliers, cost reductions, free
                  buildings, extra parallel slots, and more. Strategic prestige timing
                  is key to long-term progress.
                </p>
              </details>
            </section>

            <section class="game-info-section">
              <details>
                <summary>Cross-Tier Bonus (Patronage)</summary>
                <p>
                  Completing a higher-tier settlement grants a permanent 5% income
                  bonus to all lower-tier settlements. This stacks with each completion
                  and can be boosted further with prestige upgrades, creating a
                  snowball effect as you progress.
                </p>
              </details>
            </section>

            <section class="game-info-section">
              <details>
                <summary>Achievements</summary>
                <p>
                  Unlock achievements by hitting milestones &mdash; tier completions,
                  speed runs, building counts, currency thresholds, and more. Each
                  achievement grants a permanent bonus such as income multipliers or
                  cost reductions. Some achievements are hidden until discovered.
                </p>
              </details>
            </section>

            <section class="game-info-section">
              <details>
                <summary>Tips</summary>
                <ul>
                  <li>Hold the buy button to purchase buildings rapidly.</li>
                  <li>Use the buy amount toggle (x1 / x10 / x100 / Max) for bulk purchases.</li>
                  <li>Unlock parallel slots early &mdash; they are the biggest time saver.</li>
                  <li>Check building effects carefully; some synergize with others.</li>
                  <li>Don't wait too long to prestige &mdash; Crowns compound your progress.</li>
                  <li>Toggle compact view for a denser layout when managing many settlements.</li>
                </ul>
              </details>
            </section>
          </div>
        </div>
      </div>
    `;
  }

  private renderAchievements(): string {
    const state = this.game.getState();
    const unlockedCount = state.achievements.filter((a) => a.unlocked).length;
    const totalCount = state.achievements.length;

    if (unlockedCount === 0 && !this.showAchievements) return '';

    return `
      <div class="achievements-section">
        <div class="achievements-header" onclick="window.toggleAchievements()">
          <span class="achievements-title">Achievements: ${unlockedCount}/${totalCount}</span>
          <span class="achievements-toggle">${this.showAchievements ? '[-]' : '[+]'}</span>
        </div>
        ${
          this.showAchievements
            ? `<div class="achievements-list">
            ${state.achievements
              .map(
                (achievement) => `
              <div class="achievement ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-info">
                  <span class="achievement-name">${achievement.unlocked ? achievement.name : '???'}</span>
                  <span class="achievement-desc">${achievement.unlocked ? achievement.description : achievement.hidden === true ? '???' : achievement.description}</span>
                </div>
                <span class="achievement-bonus ${achievement.unlocked ? 'active' : ''}">${achievement.unlocked ? achievement.bonus.description : '???'}</span>
              </div>
            `,
              )
              .join('')}
          </div>`
            : ''
        }
      </div>
    `;
  }

  public processNotifications(): void {
    const notifications = this.game.getAndClearNotifications();
    for (const notification of notifications) {
      this.showNotification(notification);
    }
  }

  private showNotification(notification: GameNotification): void {
    if (this.activeNotificationIds.size >= 5) return;

    this.activeNotificationIds.add(notification.id);

    const el = document.createElement('div');
    el.className = `notification notification-${notification.type}`;
    el.setAttribute('data-notification-id', notification.id);

    const messageSpan = document.createElement('span');
    messageSpan.className = 'notification-message';
    messageSpan.textContent = notification.message;

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'notification-dismiss';
    dismissBtn.textContent = '\u00d7';
    dismissBtn.addEventListener('click', () => {
      this.removeNotification(notification.id);
    });

    el.appendChild(messageSpan);
    el.appendChild(dismissBtn);
    this.notificationContainer.appendChild(el);

    window.setTimeout(() => {
      el.classList.add('notification-fade-out');
      window.setTimeout(() => {
        this.removeNotification(notification.id);
      }, 500);
    }, 4500);
  }

  public removeNotification(id: string): void {
    this.activeNotificationIds.delete(id);
    const el = this.notificationContainer.querySelector(`[data-notification-id="${id}"]`);
    if (el) {
      el.remove();
    }
  }

  public selectTier(tier: TierType): void {
    if (this.game.getState().unlockedTiers.has(tier)) {
      this.selectedTier = tier;
    }
  }

  private renderMastery(): string {
    const level = this.game.getMasteryLevel(this.selectedTier);
    if (level === 0) return '';

    const startingCurrency = this.game.getMasteryStartingCurrency(this.selectedTier);
    const autoBuildSpeed = this.game.getMasteryAutoBuildSpeed(this.selectedTier);

    const bonuses: string[] = [];
    if (startingCurrency > 0) {
      bonuses.push(`<span class="mastery-bonus">+${formatNumber(startingCurrency)} start</span>`);
    }
    if (autoBuildSpeed > 0) {
      bonuses.push(
        `<span class="mastery-bonus">${(autoBuildSpeed * 100).toFixed(1)}% faster builds</span>`,
      );
    }

    const tooltip =
      'Mastery is earned by completing settlements. Each completion gives ' +
      'starting currency for new settlements and faster auto-building for this tier. ' +
      'Starting currency has diminishing returns past 200 completions. ' +
      'Auto-build speed has a soft cap (50% at 500 completions, max 90%). ' +
      'Mastery resets on prestige.';

    return `
      <div class="mastery-display" id="mastery-display" title="${this.escapeAttr(tooltip)}">
        <span class="mastery-level">Mastery ${level}</span>
        <div class="mastery-bonuses">${bonuses.join('<span class="mastery-sep"> | </span>')}</div>
      </div>
    `;
  }

  private renderPatronage(): string {
    const bonus = this.game.getCrossTierBonusForTier(this.selectedTier);
    if (bonus < 0.01) return '';

    const tooltip =
      'Patronage income from completing higher-tier settlements. ' +
      "Each completion grants 1% of that tier's base building income to all lower-tier settlements.";

    return `
      <div class="patronage-display" id="patronage-display" title="${this.escapeAttr(tooltip)}">
        <span class="patronage-label">Patronage</span>
        <span class="patronage-value">+${formatIncome(bonus)}/s to all settlements</span>
      </div>
    `;
  }

  private renderTierProgress(): string {
    const state = this.game.getState();
    const completedCount = state.completedSettlements.get(this.selectedTier) ?? 0;
    const requirement = this.game.getTierRequirement(this.selectedTier);
    const progressToNext = completedCount % requirement;
    const nextTierUnlocks = requirement - progressToNext;

    return `
      <div class="progress-info">
        <span class="completed-count">${completedCount} completed</span>
        <span class="next-unlock">${nextTierUnlocks === requirement ? '' : `${nextTierUnlocks} more for next tier`}</span>
      </div>
      <div class="tier-progress-bar">
        <div class="tier-progress-fill" style="width: ${(progressToNext / requirement) * 100}%"></div>
        <span class="tier-progress-text">${progressToNext} / ${requirement}</span>
      </div>
    `;
  }

  private formatGoalProgress(goal: Goal, settlement: Settlement): string {
    const reductionFactor = this.game.getGoalReductionFactor(settlement);
    const effectiveTarget =
      goal.type === GoalType.BuildingCount
        ? Math.ceil(goal.targetValue * reductionFactor)
        : goal.targetValue * reductionFactor;

    if (goal.type === GoalType.Survival) {
      const currentMinutes = Math.floor(goal.currentValue / 60);
      const targetMinutes = Math.floor(effectiveTarget / 60);
      return `${currentMinutes}/${targetMinutes} min`;
    }

    return `${formatNumber(goal.currentValue)}/${formatNumber(effectiveTarget)}`;
  }

  private formatGoalDescription(goal: Goal, settlement: Settlement): string {
    const reductionFactor = this.game.getGoalReductionFactor(settlement);
    const effectiveTarget =
      goal.type === GoalType.BuildingCount
        ? Math.ceil(goal.targetValue * reductionFactor)
        : goal.targetValue * reductionFactor;

    switch (goal.type) {
      case GoalType.ReachIncome:
        return `Reach ${formatNumber(effectiveTarget)} income per second`;
      case GoalType.AccumulateCurrency:
        return `Earn ${formatNumber(effectiveTarget)} total currency`;
      case GoalType.CurrentCurrency:
        return `Have ${formatNumber(effectiveTarget)} currency at once`;
      case GoalType.CurrencySpent:
        return `Spend ${formatNumber(effectiveTarget)} currency on buildings`;
      case GoalType.TotalBuildings:
        return `Own ${formatNumber(effectiveTarget)} total buildings`;
      case GoalType.Survival: {
        const targetMinutes = Math.floor(effectiveTarget / 60);
        return `Prosper for ${targetMinutes} minutes`;
      }
      case GoalType.BuildingCount: {
        const tierDef = getTierByType(settlement.tier);
        const building = tierDef?.buildings.find((b) => b.id === goal.buildingId);
        const buildingName = building !== undefined ? building.name : 'buildings';
        return `Build ${effectiveTarget} ${buildingName}s`;
      }
      default:
        return goal.description;
    }
  }

  public update(): void {
    if (!this.isInitialized) return;

    this.processNotifications();

    // Check if settlement count has changed or settlement IDs have changed (completion/spawning/replacement)
    const currentSettlementCount = this.game.getState().settlements.length;
    const currentSettlementIds = this.game.getState().settlements.map((s) => s.id);

    const countChanged = currentSettlementCount !== this.lastSettlementCount;
    const idsChanged =
      currentSettlementIds.length !== this.lastSettlementIds.length ||
      currentSettlementIds.some((id, i) => id !== this.lastSettlementIds[i]);

    if (countChanged || idsChanged) {
      this.lastSettlementCount = currentSettlementCount;
      this.lastSettlementIds = currentSettlementIds;
      if (!this.prestigeShopOpen && !this.gameInfoOpen) {
        this.render(); // Full re-render when settlements change
      }
      return;
    }

    // Update dynamic values without full re-render to prevent button flickering
    this.updateDynamicValues();
  }

  private updateDynamicValues(): void {
    // Update research points in research panel
    const researchEl = document.getElementById('research');
    if (researchEl) {
      researchEl.textContent = this.game.getResearchPoints(this.selectedTier).toString();
    }

    // Update show completed research checkbox state
    const showCompletedCheckbox = document.getElementById(
      'show-completed-research',
    ) as HTMLInputElement;
    if (showCompletedCheckbox !== null) {
      showCompletedCheckbox.checked = this.game.isShowCompletedResearchEnabled();
    }

    // Update mastery display
    const masteryEl = document.getElementById('mastery-display');
    if (masteryEl !== null) {
      const level = this.game.getMasteryLevel(this.selectedTier);
      const levelEl = masteryEl.querySelector('.mastery-level');
      if (levelEl !== null) {
        levelEl.textContent = `Mastery ${level}`;
      }
    }

    // Update patronage display
    const patronageEl = document.getElementById('patronage-display');
    if (patronageEl !== null) {
      const bonus = this.game.getCrossTierBonusForTier(this.selectedTier);
      const valueEl = patronageEl.querySelector('.patronage-value');
      if (valueEl !== null) {
        valueEl.textContent = `+${formatIncome(bonus)}/s to all settlements`;
      }
    }

    // Only update settlements for the active tier — non-active tiers are skipped entirely
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
      const statValues = settlementEl.querySelectorAll('.settlement-stat .stat-value');
      const incomeEl = statValues.length > 1 ? statValues[1] : null;
      const headerIncomeEl = settlementEl.querySelector('.settlement-header .income');
      const crossTierBonus = this.game.getCrossTierBonus(settlement.id);

      if (currencyEl !== null) {
        currencyEl.textContent = formatNumber(settlement.currency);
      }
      if (incomeEl !== null) {
        incomeEl.textContent = formatIncome(settlement.totalIncome);
      }
      if (headerIncomeEl !== null) {
        headerIncomeEl.textContent = formatIncome(settlement.totalIncome + crossTierBonus);
      }

      // Update compact currency display in header
      const compactCurrencyEl = settlementEl.querySelector('.compact-currency');
      if (compactCurrencyEl !== null) {
        compactCurrencyEl.textContent = formatNumber(settlement.currency);
      }

      // Update cross-tier tribute display
      const crossTierEl = settlementEl.querySelector('.cross-tier-value');
      if (crossTierEl !== null) {
        crossTierEl.textContent = `+${formatIncome(crossTierBonus)}`;
      }

      // Update goal progress (single goal in header)
      const goal = settlement.goals[0];
      if (goal !== undefined) {
        const goalDisplay = settlementEl.querySelector('.goal-display');
        const goalProgressText = settlementEl.querySelector('.goal-progress');
        const goalDescriptionText = settlementEl.querySelector('.goal-description');

        if (goalDescriptionText !== null) {
          goalDescriptionText.textContent = this.formatGoalDescription(goal, settlement);
        }

        if (goalProgressText !== null) {
          goalProgressText.textContent = this.formatGoalProgress(goal, settlement);
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
          buyAmount === 'max'
            ? `Buy Max (<span class="buy-qty">${qty}</span>)`
            : buyAmount > 1
              ? `Buy ${qty}x`
              : 'Buy';

        // Update cached cost attribute and button text
        button.setAttribute('data-cost', cost.toString());
        button.innerHTML = `${label} (<span class="buy-cost">${formatNumber(cost)}</span>)`;

        if (canAfford && button.disabled === true) {
          button.disabled = false;
          button.classList.remove('disabled');
        } else if (!canAfford && button.disabled === false) {
          button.disabled = true;
          button.classList.add('disabled');
        }
      });
    });

    // Update research item affordability states
    const researchItems = document.querySelectorAll('.research-item.clickable');
    researchItems.forEach((item) => {
      if (!(item instanceof HTMLElement)) return;
      const cost = parseInt(item.dataset.cost ?? '0');
      if (cost <= 0) return;
      const canAfford = this.game.getResearchPoints(this.selectedTier) >= cost;

      if (canAfford && item.classList.contains('cant-afford')) {
        item.classList.remove('cant-afford');
      } else if (!canAfford && !item.classList.contains('cant-afford')) {
        item.classList.add('cant-afford');
      }
    });
  }
}
