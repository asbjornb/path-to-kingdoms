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
      researchPoints: new Map([[TierType.Hamlet, 0]]),
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

  public getResearchPoints(tier: TierType): number {
    return this.state.researchPoints.get(tier) ?? 0;
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

  private getResearchEffect(type: string, tier?: TierType): number {
    const upgrades = this.state.research.filter(
      (r) => r.purchased && r.effect.type === type && (tier !== undefined ? r.tier === tier : true),
    );

    if (type === 'cost_reduction') {
      return upgrades.reduce((mult, upgrade) => mult * upgrade.effect.value, 1);
    }
    if (type === 'parallel_slots') {
      if (tier !== undefined) {
        // Return the highest parallel slots research for this tier
        return upgrades.reduce((max, upgrade) => Math.max(max, upgrade.effect.value), 1);
      } else {
        // Return the highest across all tiers for general parallel slots
        return upgrades.reduce((max, upgrade) => Math.max(max, upgrade.effect.value), 1);
      }
    }
    return upgrades.reduce((sum, upgrade) => sum + upgrade.effect.value, 0);
  }

  private checkSettlementCompletion(settlement: Settlement): void {
    const tierDef = getTierByType(settlement.tier);
    if (!tierDef || settlement.isComplete) return;

    if (settlement.totalIncome >= tierDef.completionThreshold) {
      settlement.isComplete = true;

      // Award 10 research points for the completed tier
      const currentPoints = this.state.researchPoints.get(settlement.tier) ?? 0;
      this.state.researchPoints.set(settlement.tier, currentPoints + 10);

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
    if (research.id.includes('autobuy_unlock')) {
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
