import {
  GameState,
  Settlement,
  TierType,
  GoalType,
  SaveData,
  SerializableSettlement,
  BuyAmount,
} from '../types/game';
import { TIER_DATA, getTierByType } from '../data/tiers';
import { RESEARCH_DATA } from '../data/research';
import { GoalGenerator } from '../data/goals';

function createSettlement(tierType: TierType): Settlement {
  const tierDef = getTierByType(tierType);
  if (!tierDef) {
    throw new Error(`Invalid tier type: ${tierType}`);
  }

  const now = Date.now();
  const baseCurrency = tierDef.buildings[0]?.baseCost ?? 10;
  const settlement: Settlement = {
    id: `${tierType}_${now}_${Math.random().toString(36).substr(2, 9)}`,
    tier: tierType,
    isComplete: false,
    currency: baseCurrency,
    totalIncome: 0,
    buildings: new Map(),
    lifetimeCurrencyEarned: 0,
    spawnTime: now,
    goals: GoalGenerator.generateRandomGoals(tierType, 1),
  };

  // Initialize all buildings to 0 count
  tierDef.buildings.forEach((building) => {
    settlement.buildings.set(building.id, 0);
  });

  return settlement;
}

export class GameStateManager {
  private state: GameState;
  private lastUpdate: number = Date.now();
  private readonly GAME_VERSION = '0.1.0';
  private readonly SAVE_KEY = 'path-to-kingdoms-save';
  private autoSaveInterval: number | null = null;

  constructor() {
    // Initialize state first
    this.state = this.initializeState();

    // Try to load existing save, otherwise use the initialized state
    if (!this.loadGame()) {
      this.autospawnSettlements();
    }

    // Start auto-save every 30 seconds
    this.startAutoSave();
  }

  private initializeState(): GameState {
    return {
      settlements: [],
      researchPoints: new Map([[TierType.Hamlet, 0]]),
      unlockedTiers: new Set([TierType.Hamlet]),
      completedSettlements: new Map(),
      research: RESEARCH_DATA.map((r) => ({ ...r, purchased: false })),
      autoBuildingTimers: new Map(),
      settings: {
        autobuyEnabled: false,
        autobuyInterval: 1000,
        devModeEnabled: false,
        showCompletedResearch: false, // Default to hiding completed research
        buyAmount: 1,
      },
    };
  }

  public getState(): GameState {
    return this.state;
  }

  public getTotalIncome(): number {
    return this.state.settlements.reduce((total, settlement) => total + settlement.totalIncome, 0);
  }

  public getResearchPoints(tier: TierType): number {
    return this.state.researchPoints.get(tier) ?? 0;
  }

  private spawnSettlement(tierType: TierType): Settlement | null {
    if (!this.state.unlockedTiers.has(tierType)) {
      return null;
    }

    const newSettlement = createSettlement(tierType);
    this.state.settlements.push(newSettlement);
    return newSettlement;
  }

  public buyBuilding(settlementId: string, buildingId: string): boolean {
    const settlement = this.state.settlements.find((s) => s.id === settlementId);
    if (!settlement) return false;

    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return false;

    const building = tierDef.buildings.find((b) => b.id === buildingId);
    if (!building) return false;

    const currentCount = settlement.buildings.get(buildingId) ?? 0;
    const cost = this.calculateBuildingCost(
      building.baseCost,
      building.costMultiplier,
      currentCount,
      settlementId,
    );

    if (settlement.currency < cost) return false;

    settlement.currency -= cost;
    settlement.buildings.set(buildingId, currentCount + 1);

    // Recalculate total income for the settlement (accounts for building effects)
    settlement.totalIncome = this.calculateSettlementIncome(settlement);

    this.checkSettlementCompletion(settlement);
    return true;
  }

  public getBulkBuyCost(settlementId: string, buildingId: string, count: number): number | null {
    const settlement = this.state.settlements.find((s) => s.id === settlementId);
    if (!settlement) return null;

    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return null;

    const building = tierDef.buildings.find((b) => b.id === buildingId);
    if (!building) return null;

    const currentCount = settlement.buildings.get(buildingId) ?? 0;
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += this.calculateBuildingCost(
        building.baseCost,
        building.costMultiplier,
        currentCount + i,
        settlementId,
      );
    }
    return total;
  }

  public getMaxAffordable(settlementId: string, buildingId: string): number {
    const settlement = this.state.settlements.find((s) => s.id === settlementId);
    if (!settlement) return 0;

    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return 0;

    const building = tierDef.buildings.find((b) => b.id === buildingId);
    if (!building) return 0;

    const currentCount = settlement.buildings.get(buildingId) ?? 0;
    let total = 0;
    let count = 0;
    while (true) {
      const nextCost = this.calculateBuildingCost(
        building.baseCost,
        building.costMultiplier,
        currentCount + count,
        settlementId,
      );
      if (total + nextCost > settlement.currency) break;
      total += nextCost;
      count++;
    }
    return count;
  }

  public buyMultipleBuildings(
    settlementId: string,
    buildingId: string,
    requestedCount: number,
  ): number {
    let bought = 0;
    for (let i = 0; i < requestedCount; i++) {
      if (!this.buyBuilding(settlementId, buildingId)) break;
      bought++;
    }
    return bought;
  }

  public setBuyAmount(amount: BuyAmount): void {
    this.state.settings.buyAmount = amount;
  }

  public getBuyAmount(): BuyAmount {
    return this.state.settings.buyAmount;
  }

  private calculateBuildingCost(
    baseCost: number,
    multiplier: number,
    count: number,
    settlementId?: string,
  ): number {
    let costReduction = this.getResearchEffect('cost_reduction');

    // Apply cost scaling reduction to the multiplier
    const scalingReduction = this.getResearchEffect('cost_scaling_reduction');
    const adjustedMultiplier = Math.max(1.0, multiplier - scalingReduction);

    // Apply building-specific cost reduction effects
    if (settlementId !== undefined && settlementId !== '') {
      const settlement = this.state.settlements.find((s) => s.id === settlementId);
      if (settlement) {
        costReduction *= this.getBuildingEffectMultiplier(settlement, 'cost_reduction');
      }
    }

    return Math.floor(baseCost * Math.pow(adjustedMultiplier, count) * costReduction);
  }

  private getBuildingEffectMultiplier(settlement: Settlement, effectType: string): number {
    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return 1;

    let multiplier = 1;

    for (const building of tierDef.buildings) {
      if (building.effect && building.effect.type === effectType) {
        const count = settlement.buildings.get(building.id) ?? 0;
        if (effectType === 'cost_reduction') {
          // Cost reduction stacks multiplicatively (each building reduces cost by the percentage)
          multiplier *= Math.pow(1 - building.effect.value, count);
        } else if (effectType === 'income_multiplier') {
          // Income multiplier stacks additively (each building adds to the multiplier)
          multiplier += building.effect.value * count;
        }
      }
    }

    return multiplier;
  }

  private getBuildingCompletionBonus(settlement: Settlement): number {
    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return 0;

    let bonus = 0;

    for (const building of tierDef.buildings) {
      if (building.effect && building.effect.type === 'completion_bonus') {
        const count = settlement.buildings.get(building.id) ?? 0;
        bonus += building.effect.value * count;
      }
    }

    return bonus;
  }

  private calculateSettlementIncome(settlement: Settlement): number {
    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return 0;

    let baseIncome = 0;

    // Calculate base income from all buildings
    for (const building of tierDef.buildings) {
      const count = settlement.buildings.get(building.id) ?? 0;
      baseIncome += building.baseIncome * count;
    }

    // Add starting income bonus from research
    const startingIncomeResearch = this.state.research.filter(
      (r) => r.purchased && r.effect.type === 'starting_income' && r.tier === settlement.tier,
    );
    const startingIncomeBonus = startingIncomeResearch.reduce((total, research) => {
      return total + (research.effect.value ?? 0);
    }, 0);
    baseIncome += startingIncomeBonus;

    // Apply income multiplier effects
    const incomeMultiplier = this.getBuildingEffectMultiplier(settlement, 'income_multiplier');

    return baseIncome * incomeMultiplier;
  }

  private getResearchEffect(type: string, tier?: TierType): number {
    const upgrades = this.state.research.filter(
      (r) => r.purchased && r.effect.type === type && (tier !== undefined ? r.tier === tier : true),
    );

    if (type === 'cost_reduction') {
      return upgrades.reduce((mult, upgrade) => mult * (upgrade.effect.value ?? 1), 1);
    }
    if (type === 'parallel_slots') {
      if (tier !== undefined) {
        // Return the highest parallel slots research for this tier
        return upgrades.reduce((max, upgrade) => Math.max(max, upgrade.effect.value ?? 0), 1);
      } else {
        // Return the highest across all tiers for general parallel slots
        return upgrades.reduce((max, upgrade) => Math.max(max, upgrade.effect.value ?? 0), 1);
      }
    }
    return upgrades.reduce((sum, upgrade) => sum + (upgrade.effect.value ?? 0), 0);
  }

  private checkSettlementCompletion(settlement: Settlement): void {
    if (settlement.isComplete) return;

    // Check if all goals are completed
    const allGoalsCompleted =
      settlement.goals.length > 0 && settlement.goals.every((goal) => goal.isCompleted);

    if (allGoalsCompleted) {
      settlement.isComplete = true;

      // Award 10 research points for the completed tier
      let researchBonus = 10;

      // Add completion bonus from buildings (like libraries)
      const completionBonus = this.getBuildingCompletionBonus(settlement);
      researchBonus += completionBonus;

      const currentPoints = this.state.researchPoints.get(settlement.tier) ?? 0;
      this.state.researchPoints.set(settlement.tier, currentPoints + researchBonus);

      const completedCount = (this.state.completedSettlements.get(settlement.tier) ?? 0) + 1;
      this.state.completedSettlements.set(settlement.tier, completedCount);

      // Remove completed settlement
      this.state.settlements = this.state.settlements.filter((s) => s.id !== settlement.id);

      // Check if we should spawn next tier settlement
      this.checkNextTierSpawn(settlement.tier);

      // Autospawn replacement in same tier
      this.autospawnSettlements();
    }
  }

  private checkNextTierSpawn(completedTier: TierType): void {
    const completedCount = this.state.completedSettlements.get(completedTier) ?? 0;

    // Every 6 completions spawn next tier
    if (completedCount % 6 === 0) {
      const tierIndex = TIER_DATA.findIndex((t) => t.type === completedTier);
      if (tierIndex !== -1 && tierIndex < TIER_DATA.length - 1) {
        const nextTier = TIER_DATA[tierIndex + 1];
        this.state.unlockedTiers.add(nextTier.type);

        // Initialize research points for the new tier
        if (!this.state.researchPoints.has(nextTier.type)) {
          this.state.researchPoints.set(nextTier.type, 0);
        }

        // The autospawn will handle creating the settlement
      }
    }
  }

  private autospawnSettlements(): void {
    // For each tier, check if we need to spawn settlements
    for (const tierDef of TIER_DATA) {
      if (!this.state.unlockedTiers.has(tierDef.type)) continue;

      const maxSlots = this.getResearchEffect('parallel_slots', tierDef.type);
      const currentCount = this.state.settlements.filter((s) => s.tier === tierDef.type).length;
      const slotsNeeded = maxSlots - currentCount;

      for (let i = 0; i < slotsNeeded; i++) {
        this.spawnSettlement(tierDef.type);
      }
    }
  }

  public purchaseResearch(researchId: string): boolean {
    const research = this.state.research.find((r) => r.id === researchId);
    if (!research || research.purchased) return false;

    // Check if tier is unlocked
    if (!this.state.unlockedTiers.has(research.tier)) return false;

    // Check if player has enough research points for this tier
    const tierPoints = this.state.researchPoints.get(research.tier) ?? 0;
    if (tierPoints < research.cost) return false;

    // Check prerequisites
    if (research.prerequisite !== undefined && research.prerequisite !== '') {
      const prereq = this.state.research.find((r) => r.id === research.prerequisite);
      if (!prereq || !prereq.purchased) return false;
    }

    // Purchase the research
    this.state.researchPoints.set(research.tier, tierPoints - research.cost);
    research.purchased = true;

    // Handle special research effects
    if (research.effect.type === 'parallel_slots') {
      this.autospawnSettlements();
    }

    // Recalculate income for all existing settlements of this tier
    // (applies to starting_income, and potentially other income-affecting research)
    this.state.settlements
      .filter((settlement) => settlement.tier === research.tier)
      .forEach((settlement) => {
        settlement.totalIncome = this.calculateSettlementIncome(settlement);
      });

    return true;
  }

  public update(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    // Update currency for each settlement based on its income
    this.state.settlements.forEach((settlement) => {
      let currencyGained = settlement.totalIncome * deltaTime;

      // Apply dev mode 1000x income multiplier
      if (this.state.settings.devModeEnabled) {
        currencyGained *= 1000;
      }

      settlement.currency += currencyGained;
      settlement.lifetimeCurrencyEarned += currencyGained;

      // Update goal progress
      this.updateGoalProgress(settlement);
    });

    // Process automated building purchases
    this.processAutoBuildingPurchases(now);
  }

  private processAutoBuildingPurchases(now: number): void {
    // Get all purchased auto-building research
    const autoBuildingResearch = this.state.research.filter(
      (r) => r.purchased && r.effect.type === 'auto_building',
    );

    for (const research of autoBuildingResearch) {
      const buildingId = research.effect.buildingId;
      const interval = research.effect.interval;

      if (buildingId === undefined || buildingId === '' || interval === undefined || interval === 0)
        continue;

      const lastPurchaseTime = this.state.autoBuildingTimers.get(research.id) ?? 0;

      // Check if enough time has passed
      if (now - lastPurchaseTime >= interval) {
        // Find settlements of the same tier that can afford this building
        const tierSettlements = this.state.settlements.filter((s) => s.tier === research.tier);

        for (const settlement of tierSettlements) {
          const cost = this.getBuildingCost(settlement.id, buildingId);
          if (cost !== null && settlement.currency >= cost) {
            // Try to buy the building
            if (this.buyBuilding(settlement.id, buildingId)) {
              // Update the timer for this research
              this.state.autoBuildingTimers.set(research.id, now);
              break; // Only buy one building per interval
            }
          }
        }
      }
    }
  }

  public getBuildingCost(settlementId: string, buildingId: string): number | null {
    const settlement = this.state.settlements.find((s) => s.id === settlementId);
    if (!settlement) return null;

    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return null;

    const building = tierDef.buildings.find((b) => b.id === buildingId);
    if (!building) return null;

    const currentCount = settlement.buildings.get(buildingId) ?? 0;
    return this.calculateBuildingCost(
      building.baseCost,
      building.costMultiplier,
      currentCount,
      settlementId,
    );
  }

  private updateGoalProgress(settlement: Settlement): void {
    const now = Date.now();

    settlement.goals.forEach((goal) => {
      if (goal.isCompleted) return;

      let newValue = 0;
      let completed = false;

      switch (goal.type) {
        case GoalType.ReachIncome:
          newValue = settlement.totalIncome;
          completed = newValue >= goal.targetValue;
          break;

        case GoalType.AccumulateCurrency:
          newValue = settlement.lifetimeCurrencyEarned;
          completed = newValue >= goal.targetValue;
          break;

        case GoalType.CurrentCurrency:
          newValue = settlement.currency;
          completed = newValue >= goal.targetValue;
          break;

        case GoalType.BuildingCount:
          if (goal.buildingId !== undefined && goal.buildingId !== '') {
            newValue = settlement.buildings.get(goal.buildingId) ?? 0;
            completed = newValue >= goal.targetValue;
          }
          break;

        case GoalType.Survival:
          newValue = Math.floor((now - settlement.spawnTime) / 1000); // seconds
          completed = newValue >= goal.targetValue;
          break;
      }

      goal.currentValue = newValue;
      if (completed && !goal.isCompleted) {
        goal.isCompleted = true;
      }
    });

    // Check if all goals are completed after updating all goals
    this.checkSettlementCompletion(settlement);
  }

  public toggleDevMode(): boolean {
    this.state.settings.devModeEnabled = !this.state.settings.devModeEnabled;
    return this.state.settings.devModeEnabled;
  }

  public isDevModeEnabled(): boolean {
    return this.state.settings.devModeEnabled;
  }

  public toggleShowCompletedResearch(): boolean {
    this.state.settings.showCompletedResearch = !this.state.settings.showCompletedResearch;
    return this.state.settings.showCompletedResearch;
  }

  public isShowCompletedResearchEnabled(): boolean {
    return this.state.settings.showCompletedResearch;
  }

  // For testing - manually trigger autospawn
  public triggerAutospawn(): void {
    this.autospawnSettlements();
  }

  private startAutoSave(): void {
    // Save every 30 seconds
    this.autoSaveInterval = window.setInterval(() => {
      this.saveGame();
    }, 30000);
  }

  public stopAutoSave(): void {
    if (this.autoSaveInterval !== null) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  public saveGame(): boolean {
    try {
      // Convert settlements to serializable format
      const serializableSettlements: SerializableSettlement[] = this.state.settlements.map(
        (settlement) => ({
          ...settlement,
          buildings: Array.from(settlement.buildings.entries()),
        }),
      );

      const saveData: SaveData = {
        version: this.GAME_VERSION,
        timestamp: Date.now(),
        gameState: {
          settlements: serializableSettlements,
          researchPoints: Array.from(this.state.researchPoints.entries()),
          unlockedTiers: Array.from(this.state.unlockedTiers),
          completedSettlements: Array.from(this.state.completedSettlements.entries()),
          research: this.state.research,
          autoBuildingTimers: Array.from(this.state.autoBuildingTimers.entries()),
          settings: this.state.settings,
        },
      };

      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      console.warn('Game saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  public loadGame(): boolean {
    try {
      const saveString = localStorage.getItem(this.SAVE_KEY);
      if (saveString === null || saveString === '') {
        console.warn('No save data found');
        return false;
      }

      const saveData = JSON.parse(saveString) as SaveData;

      // Check version compatibility
      if (saveData.version !== this.GAME_VERSION) {
        console.warn(`Save version mismatch: ${saveData.version} vs ${this.GAME_VERSION}`);
        // For now, we'll try to load anyway, but in the future we could add migration logic here
      }

      // Convert serializable settlements back to Settlement format
      const settlements: Settlement[] = saveData.gameState.settlements.map(
        (serializableSettlement) => ({
          ...serializableSettlement,
          buildings: new Map(serializableSettlement.buildings),
        }),
      );

      // Reconstruct the state from serialized data
      const settings = saveData.gameState.settings;
      if (settings.buyAmount === undefined) {
        settings.buyAmount = 1;
      }

      this.state = {
        settlements,
        researchPoints: new Map(saveData.gameState.researchPoints),
        unlockedTiers: new Set(saveData.gameState.unlockedTiers),
        completedSettlements: new Map(saveData.gameState.completedSettlements),
        research: saveData.gameState.research,
        autoBuildingTimers: new Map(saveData.gameState.autoBuildingTimers),
        settings,
      };

      console.warn(
        `Game loaded successfully from ${new Date(saveData.timestamp).toLocaleString()}`,
      );
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }

  public deleteSave(): void {
    localStorage.removeItem(this.SAVE_KEY);
    console.warn('Save data deleted');
  }

  public exportSave(): string {
    const saveString = localStorage.getItem(this.SAVE_KEY);
    return saveString ?? '';
  }

  public importSave(saveString: string): boolean {
    try {
      JSON.parse(saveString) as SaveData;
      localStorage.setItem(this.SAVE_KEY, saveString);
      return this.loadGame();
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }
}
