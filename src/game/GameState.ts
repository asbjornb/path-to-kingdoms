import { GameState, Settlement, TierType } from '../types/game';
import { TIER_DATA, getTierByType } from '../data/tiers';
import { RESEARCH_DATA } from '../data/research';

export class GameStateManager {
  private state: GameState;
  private currency: number = 0;
  private lastUpdate: number = Date.now();

  constructor() {
    this.state = this.initializeState();
    this.currency = 100; // Starting currency
    this.autospawnSettlements();
  }

  private initializeState(): GameState {
    return {
      settlements: [],
      researchPoints: 0,
      unlockedTiers: new Set([TierType.Hamlet]),
      completedSettlements: new Map(),
      research: RESEARCH_DATA.map((r) => ({ ...r, purchased: false })),
      settings: {
        autobuyEnabled: false,
        autobuyInterval: 1000,
      },
    };
  }

  public getState(): GameState {
    return this.state;
  }

  public getCurrency(): number {
    return this.currency;
  }

  public getTotalIncome(): number {
    return this.state.settlements.reduce((total, settlement) => total + settlement.totalIncome, 0);
  }

  private spawnSettlement(tierType: TierType): Settlement | null {
    const tierDef = getTierByType(tierType);
    if (!tierDef || !this.state.unlockedTiers.has(tierType)) {
      return null;
    }

    const newSettlement: Settlement = {
      id: `${tierType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tier: tierType,
      isComplete: false,
      totalIncome: 0,
      buildings: new Map(),
    };

    tierDef.buildings.forEach((building) => {
      newSettlement.buildings.set(building.id, 0);
    });

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
    );

    if (this.currency < cost) return false;

    this.currency -= cost;
    settlement.buildings.set(buildingId, currentCount + 1);
    settlement.totalIncome += building.baseIncome;

    this.checkSettlementCompletion(settlement);
    return true;
  }

  private calculateBuildingCost(baseCost: number, multiplier: number, count: number): number {
    const costReduction = this.getResearchEffect('cost_reduction');
    return Math.floor(baseCost * Math.pow(multiplier, count) * costReduction);
  }

  private getResearchEffect(type: string): number {
    const upgrades = this.state.research.filter((r) => r.purchased && r.effect.type === type);
    if (type === 'cost_reduction') {
      return upgrades.reduce((mult, upgrade) => mult * upgrade.effect.value, 1);
    }
    if (type === 'parallel_slots') {
      // Return the highest parallel slots research (they don't stack)
      return upgrades.reduce((max, upgrade) => Math.max(max, upgrade.effect.value), 1);
    }
    return upgrades.reduce((sum, upgrade) => sum + upgrade.effect.value, 0);
  }

  private checkSettlementCompletion(settlement: Settlement): void {
    const tierDef = getTierByType(settlement.tier);
    if (!tierDef || settlement.isComplete) return;

    if (settlement.totalIncome >= tierDef.completionThreshold) {
      settlement.isComplete = true;
      this.state.researchPoints += 1;

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
        // The autospawn will handle creating the settlement
      }
    }
  }

  private autospawnSettlements(): void {
    const maxSlots = this.getResearchEffect('parallel_slots');

    // For each tier, check if we need to spawn settlements
    for (const tierDef of TIER_DATA) {
      if (!this.state.unlockedTiers.has(tierDef.type)) continue;

      const currentCount = this.state.settlements.filter((s) => s.tier === tierDef.type).length;
      const slotsNeeded = maxSlots - currentCount;

      for (let i = 0; i < slotsNeeded; i++) {
        this.spawnSettlement(tierDef.type);
      }
    }
  }

  public purchaseResearch(researchId: string): boolean {
    const research = this.state.research.find((r) => r.id === researchId);
    if (!research || research.purchased || this.state.researchPoints < research.cost) {
      return false;
    }

    this.state.researchPoints -= research.cost;
    research.purchased = true;

    if (research.id === 'autobuy_unlock') {
      this.state.settings.autobuyEnabled = true;
    }

    // If this is a parallel slots research, autospawn settlements
    if (research.effect.type === 'parallel_slots') {
      this.autospawnSettlements();
    }

    return true;
  }

  public update(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    const income = this.getTotalIncome();
    this.currency += income * deltaTime;
  }

  public getBuildingCost(settlementId: string, buildingId: string): number | null {
    const settlement = this.state.settlements.find((s) => s.id === settlementId);
    if (!settlement) return null;

    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return null;

    const building = tierDef.buildings.find((b) => b.id === buildingId);
    if (!building) return null;

    const currentCount = settlement.buildings.get(buildingId) ?? 0;
    return this.calculateBuildingCost(building.baseCost, building.costMultiplier, currentCount);
  }

  // For testing - manually trigger autospawn
  public triggerAutospawn(): void {
    this.autospawnSettlements();
  }
}
