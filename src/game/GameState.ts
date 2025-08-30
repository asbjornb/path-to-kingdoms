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
  }

  private initializeState(): GameState {
    return {
      settlements: [],
      researchPoints: 0,
      unlockedTiers: new Set([TierType.Hamlet]),
      completedSettlements: new Map(),
      research: [...RESEARCH_DATA],
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

  public spawnSettlement(tierType: TierType): Settlement | null {
    const tierDef = getTierByType(tierType);
    if (!tierDef || !this.state.unlockedTiers.has(tierType)) {
      return null;
    }

    const newSettlement: Settlement = {
      id: `${tierType}_${Date.now()}`,
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

      this.checkTierUnlock(settlement.tier);
    }
  }

  private checkTierUnlock(completedTier: TierType): void {
    const tierIndex = TIER_DATA.findIndex((t) => t.type === completedTier);
    if (tierIndex === -1 || tierIndex === TIER_DATA.length - 1) return;

    const nextTier = TIER_DATA[tierIndex + 1];
    const completedCount = this.state.completedSettlements.get(completedTier) ?? 0;

    if (
      completedCount >= nextTier.unlockRequirement &&
      !this.state.unlockedTiers.has(nextTier.type)
    ) {
      this.state.unlockedTiers.add(nextTier.type);
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
}
