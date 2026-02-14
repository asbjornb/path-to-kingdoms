import {
  GameState,
  GameNotification,
  Settlement,
  TierType,
  GoalType,
  SaveData,
  SerializableSettlement,
  BuyAmount,
  ResearchUpgrade,
  PrestigeUpgrade,
  Achievement,
} from '../types/game';
import { TIER_DATA, getTierByType } from '../data/tiers';
import { RESEARCH_DATA } from '../data/research';
import { GoalGenerator } from '../data/goals';
import {
  PRESTIGE_UPGRADES,
  calculatePrestigeCurrency,
  getPrestigeUpgradeCost,
} from '../data/prestige';
import { ACHIEVEMENTS_DATA } from '../data/achievements';

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
    totalCurrencySpent: 0,
    spawnTime: now,
    goals: GoalGenerator.generateRandomGoals(tierType, 1),
  };

  // Initialize all buildings to 0 count
  tierDef.buildings.forEach((building) => {
    settlement.buildings.set(building.id, 0);
  });

  return settlement;
}

// Patronage: each completed higher-tier settlement gives a small flat income bonus
// to all lower-tier settlements, scaled by the higher tier's base income.
// Slow but accumulates permanently.
const PATRONAGE_PER_COMPLETION = 0.05; // fraction of higher tier's first building income

// Mastery: permanent bonuses from repeated tier completions (intentionally slow)
const MASTERY_INCOME_PER_COMPLETION = 0.001; // +0.1% income per completion
const MASTERY_STARTING_CURRENCY_FACTOR = 0.1; // completions * baseCurrency * this
const MASTERY_AUTOBUILD_HALFPOINT = 500; // completions at which auto-build speed reaches 50%
const MASTERY_SOFTCAP_START = 200; // completions at which diminishing returns begin

// Auto-builders will only spend up to this fraction of treasury per purchase.
// Prevents expensive buildings from draining the entire treasury in one shot.
// The first building of each type bypasses this cap so settlements can bootstrap.
const AUTO_BUILD_TREASURY_PCT = 0.05;

// Maximum number of buildings that can be bought in a single bulk purchase.
// Prevents UI freezes when cost scaling is low and thousands would be affordable.
const MAX_BULK_BUY = 500;

export class GameStateManager {
  private state: GameState;
  private lastUpdate: number = Date.now();
  private lastAchievementCheck: number = 0;
  private lastGoalUpdate: number = 0;
  private readonly GAME_VERSION = '0.1.0';
  private readonly SAVE_KEY = 'path-to-kingdoms-save';
  private autoSaveInterval: number | null = null;
  private pendingNotifications: GameNotification[] = [];
  private effectCache: Map<string, number> = new Map();
  private maxAffordableCache: Map<
    string,
    { count: number; totalCost: number; threshold: number; buildingCount: number }
  > = new Map();
  /** Pre-filtered list of purchased prestige upgrades, rebuilt on purchase/load. */
  private purchasedPrestigeUpgrades: PrestigeUpgrade[] = [];
  /** Pre-filtered list of unlocked achievements, rebuilt on unlock/load. */
  private unlockedAchievements: Achievement[] = [];

  constructor() {
    // Initialize state first
    this.state = this.initializeState();

    // Try to load existing save, otherwise use the initialized state
    if (!this.loadGame()) {
      this.rebuildPurchasedCaches();
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
      prestigeCurrency: new Map(),
      prestigeCount: 0,
      lifetimeCompletions: new Map(),
      prestigeUpgrades: PRESTIGE_UPGRADES.map((u) => ({ ...u, purchased: false })),
      achievements: ACHIEVEMENTS_DATA.map((a) => ({ ...a, unlocked: false })),
      settings: {
        devModeEnabled: false,
        showCompletedResearch: false,
        showPrestigeShop: false,
        showCompletedPrestige: false,
        buyAmount: 1,
        compactView: true,
        goalNotificationsByTier: {},
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

    // Apply research starting capital bonus (additive, before prestige multiplier)
    const startingCapitalBonus = this.getResearchEffect('starting_capital', tierType);
    if (startingCapitalBonus > 0) {
      newSettlement.currency += startingCapitalBonus;
    }

    // Apply mastery starting currency bonus
    const masteryBonus = this.getMasteryStartingCurrency(tierType);
    if (masteryBonus > 0) {
      newSettlement.currency += masteryBonus;
    }

    // Apply prestige starting currency multiplier
    const prestigeStartMult = this.getPrestigeEffect('prestige_starting_currency');
    if (prestigeStartMult > 1) {
      newSettlement.currency *= prestigeStartMult;
      newSettlement.currency = Math.floor(newSettlement.currency);
    }

    // Apply achievement starting currency bonus (additive percentage)
    const achievementStartBonus = this.getAchievementEffect('starting_currency');
    if (achievementStartBonus > 0) {
      newSettlement.currency += Math.floor(newSettlement.currency * achievementStartBonus);
    }

    // Apply prestige free buildings: start with N of the cheapest building pre-built
    const freeBuildings = this.getPrestigeEffect('prestige_free_buildings');
    if (freeBuildings > 0) {
      const tierDef = getTierByType(tierType);
      if (tierDef && tierDef.buildings.length > 0) {
        const cheapestBuilding = tierDef.buildings[0]; // buildings are ordered by cost
        const currentCount = newSettlement.buildings.get(cheapestBuilding.id) ?? 0;
        newSettlement.buildings.set(cheapestBuilding.id, currentCount + freeBuildings);
      }
    }

    // Apply prestige grant building: add specific buildings to matching-tier settlements
    const grantUpgrades = this.purchasedPrestigeUpgrades.filter(
      (u) => u.effect.type === 'prestige_grant_building' && u.effect.targetBuilding !== undefined,
    );
    for (const upgrade of grantUpgrades) {
      const buildingId = upgrade.effect.targetBuilding ?? '';
      // Check if this building belongs to the settlement's tier
      if (buildingId !== '' && newSettlement.buildings.has(buildingId)) {
        const currentCount = newSettlement.buildings.get(buildingId) ?? 0;
        newSettlement.buildings.set(buildingId, currentCount + upgrade.effect.value);
      }
    }

    // Apply research starting buildings: add pre-built buildings for this tier
    const startingBuildingResearch = this.state.research.filter(
      (r) =>
        r.purchased &&
        r.effect.type === 'starting_buildings' &&
        r.tier === tierType &&
        r.effect.buildingId !== undefined,
    );
    for (const research of startingBuildingResearch) {
      const buildingId = research.effect.buildingId ?? '';
      if (buildingId !== '' && newSettlement.buildings.has(buildingId)) {
        const currentCount = newSettlement.buildings.get(buildingId) ?? 0;
        newSettlement.buildings.set(buildingId, currentCount + (research.effect.value ?? 0));
      }
    }

    // Calculate initial income so starting_income research and granted buildings are reflected immediately
    newSettlement.totalIncome = this.calculateSettlementIncome(newSettlement);

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
    settlement.totalCurrencySpent += cost;
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
    const cacheKey = `${settlementId}:${buildingId}`;
    const cached = this.maxAffordableCache.get(cacheKey);

    if (cached !== undefined && cached.buildingCount === currentCount) {
      if (cached.count === 0 && settlement.currency < cached.threshold) {
        return 0;
      }
      if (
        cached.count > 0 &&
        settlement.currency >= cached.totalCost &&
        settlement.currency < cached.threshold
      ) {
        return cached.count;
      }
    }

    let total = 0;
    let count = 0;
    while (count < MAX_BULK_BUY) {
      const nextCost = this.calculateBuildingCost(
        building.baseCost,
        building.costMultiplier,
        currentCount + count,
        settlementId,
      );
      if (total + nextCost > settlement.currency) {
        this.maxAffordableCache.set(cacheKey, {
          count,
          totalCost: total,
          threshold: total + nextCost,
          buildingCount: currentCount,
        });
        return count;
      }
      total += nextCost;
      count++;
    }

    this.maxAffordableCache.set(cacheKey, {
      count,
      totalCost: total,
      threshold: Infinity,
      buildingCount: currentCount,
    });
    return count;
  }

  /**
   * Get max affordable count and total cost in one call, using the cache.
   * Avoids a separate getBulkBuyCost call when buy mode is 'max'.
   */
  public getMaxAffordableWithCost(
    settlementId: string,
    buildingId: string,
  ): { count: number; cost: number } {
    const count = this.getMaxAffordable(settlementId, buildingId);
    if (count > 0) {
      const cacheKey = `${settlementId}:${buildingId}`;
      const cached = this.maxAffordableCache.get(cacheKey);
      return { count, cost: cached?.totalCost ?? 0 };
    }
    return { count: 0, cost: this.getBuildingCost(settlementId, buildingId) ?? 0 };
  }

  public buyMultipleBuildings(
    settlementId: string,
    buildingId: string,
    requestedCount: number,
  ): number {
    const settlement = this.state.settlements.find((s) => s.id === settlementId);
    if (!settlement) return 0;

    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return 0;

    const building = tierDef.buildings.find((b) => b.id === buildingId);
    if (!building) return 0;

    let bought = 0;
    const count = Math.min(requestedCount, MAX_BULK_BUY);
    for (let i = 0; i < count; i++) {
      const currentCount = settlement.buildings.get(buildingId) ?? 0;
      const cost = this.calculateBuildingCost(
        building.baseCost,
        building.costMultiplier,
        currentCount,
        settlementId,
      );
      if (settlement.currency < cost) break;
      settlement.currency -= cost;
      settlement.totalCurrencySpent += cost;
      settlement.buildings.set(buildingId, currentCount + 1);
      bought++;
    }

    if (bought > 0) {
      settlement.totalIncome = this.calculateSettlementIncome(settlement);
      this.checkSettlementCompletion(settlement);
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
    // Look up settlement tier for tier-scoped research effects
    let settlement: Settlement | undefined;
    if (settlementId !== undefined && settlementId !== '') {
      settlement = this.state.settlements.find((s) => s.id === settlementId);
    }
    const settlementTier = settlement?.tier;

    // Research cost_reduction and flat_cost_count are tier-scoped:
    // each tier's research only affects that tier's buildings
    let costReduction = this.getResearchEffect('cost_reduction', settlementTier);

    // Apply prestige cost scaling reduction to the multiplier
    const prestigeScalingReduction = this.getPrestigeEffect('prestige_cost_scaling_reduction');
    const adjustedMultiplier = Math.max(1.01, multiplier - prestigeScalingReduction);

    // Apply building-specific cost reduction effects
    if (settlement) {
      costReduction *= this.getBuildingEffectMultiplier(settlement, 'cost_reduction');
    }

    // Apply prestige cost reduction (multiplicative)
    const prestigeCostReduction = this.getPrestigeEffect('prestige_cost_reduction');

    // Apply achievement cost reduction (multiplicative)
    const achievementCostReduction = this.getAchievementEffect('cost_reduction');

    // Apply flat cost: N buildings of each type don't count toward cost scaling
    // Research flat_cost_count is tier-scoped; prestige flat_cost_count is global
    const researchFlatCost = this.getResearchEffect('flat_cost_count', settlementTier);
    const prestigeFlatCost = this.getPrestigeEffect('prestige_flat_cost_count');
    const flatCostCount = researchFlatCost + prestigeFlatCost;
    const effectiveCount = Math.max(0, count - flatCostCount);

    return Math.max(
      1,
      Math.floor(
        baseCost *
          Math.pow(adjustedMultiplier, effectiveCount) *
          costReduction *
          prestigeCostReduction *
          achievementCostReduction,
      ),
    );
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

  /**
   * Get the goal reduction factor for a settlement from goal_reduction buildings.
   * Returns a multiplier (e.g., 0.85 for 15% reduction). Capped at 0.25 (75% max reduction).
   */
  public getGoalReductionFactor(settlement: Settlement): number {
    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return 1;

    let totalReduction = 0;
    for (const building of tierDef.buildings) {
      if (building.effect?.type === 'goal_reduction') {
        const count = settlement.buildings.get(building.id) ?? 0;
        totalReduction += building.effect.value * count;
      }
    }

    // Apply prestige goal reduction
    const prestigeGoalReduction = this.getPrestigeEffect('prestige_goal_reduction');
    totalReduction += prestigeGoalReduction;

    // Cap at 75% reduction (factor of 0.25)
    return Math.max(0.25, 1 - totalReduction);
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

    // Calculate total building count for income_per_building effect
    let totalBuildingCount = 0;
    for (const count of settlement.buildings.values()) {
      totalBuildingCount += count;
    }

    // Build a map of production_boost multipliers per building ID
    const productionBoostAmplifier =
      1 + this.getPrestigeEffect('prestige_production_boost_amplifier');
    const productionBoosts = new Map<string, number>();
    for (const building of tierDef.buildings) {
      if (
        building.effect?.type === 'production_boost' &&
        building.effect.targetBuilding !== undefined &&
        building.effect.targetBuilding !== ''
      ) {
        const boosterCount = settlement.buildings.get(building.id) ?? 0;
        const currentBoost = productionBoosts.get(building.effect.targetBuilding) ?? 0;
        productionBoosts.set(
          building.effect.targetBuilding,
          currentBoost + building.effect.value * boosterCount * productionBoostAmplifier,
        );
      }
    }

    // Add synergy bonuses from unlocked achievements
    for (const achievement of this.unlockedAchievements) {
      if (
        achievement.bonus.type === 'building_synergy' &&
        achievement.bonus.sourceBuildingId !== undefined &&
        achievement.bonus.targetBuildingId !== undefined
      ) {
        const sourceCount = settlement.buildings.get(achievement.bonus.sourceBuildingId) ?? 0;
        if (sourceCount > 0) {
          const currentBoost = productionBoosts.get(achievement.bonus.targetBuildingId) ?? 0;
          productionBoosts.set(
            achievement.bonus.targetBuildingId,
            currentBoost + achievement.bonus.value * sourceCount,
          );
        }
      }
    }

    // Add synergy bonuses from purchased prestige upgrades
    for (const upgrade of this.purchasedPrestigeUpgrades) {
      if (
        upgrade.effect.type === 'prestige_building_synergy' &&
        upgrade.effect.sourceBuilding !== undefined &&
        upgrade.effect.targetBuilding !== undefined
      ) {
        const sourceCount = settlement.buildings.get(upgrade.effect.sourceBuilding) ?? 0;
        if (sourceCount > 0) {
          const currentBoost = productionBoosts.get(upgrade.effect.targetBuilding) ?? 0;
          productionBoosts.set(
            upgrade.effect.targetBuilding,
            currentBoost + upgrade.effect.value * sourceCount,
          );
        }
      }
    }

    let baseIncome = 0;

    // Calculate base income from all buildings, applying production_boost and prestige building boosts
    for (const building of tierDef.buildings) {
      const count = settlement.buildings.get(building.id) ?? 0;
      let buildingIncome = building.baseIncome * count;

      // Apply production_boost if this building is targeted
      const boost = productionBoosts.get(building.id) ?? 0;
      if (boost > 0) {
        buildingIncome *= 1 + boost;
      }

      // Apply prestige building-specific income boost
      const prestigeBuildingBoost = this.getPrestigeBuildingBoost(building.id);
      if (prestigeBuildingBoost > 0) {
        buildingIncome *= 1 + prestigeBuildingBoost;
      }

      baseIncome += buildingIncome;
    }

    // Add income_per_building bonus (flat income per building in the settlement)
    for (const building of tierDef.buildings) {
      if (building.effect?.type === 'income_per_building') {
        const count = settlement.buildings.get(building.id) ?? 0;
        baseIncome += building.effect.value * totalBuildingCount * count;
      }
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

    // Apply mastery income multiplier
    const masteryMultiplier = this.getMasteryIncomeMultiplier(settlement.tier);

    // Apply prestige income multiplier (additive sum, applied as 1 + total)
    const prestigeIncomeBonus = 1 + this.getPrestigeEffect('prestige_income_multiplier');

    // Apply achievement income multiplier (additive sum, applied as 1 + total)
    const achievementIncomeBonus = 1 + this.getAchievementEffect('income_multiplier');

    return (
      baseIncome *
      incomeMultiplier *
      masteryMultiplier *
      prestigeIncomeBonus *
      achievementIncomeBonus
    );
  }

  /**
   * Calculate the patronage bonus for a settlement.
   * Each completed settlement of a higher tier provides a small permanent
   * income bonus, scaled by that tier's economic level.
   */
  private calculateCrossTierBonus(settlement: Settlement): number {
    const settlementTierIndex = TIER_DATA.findIndex((t) => t.type === settlement.tier);
    if (settlementTierIndex === -1) return 0;

    let bonus = 0;

    // Sum contributions from each higher tier's completed settlements
    for (let i = settlementTierIndex + 1; i < TIER_DATA.length; i++) {
      const higherTier = TIER_DATA[i];

      const completedCount = this.state.completedSettlements.get(higherTier.type) ?? 0;
      if (completedCount === 0) continue;

      // Base bonus scales with the higher tier's first building income
      const tierBaseIncome = higherTier.buildings[0]?.baseIncome ?? 1;
      bonus += completedCount * tierBaseIncome * PATRONAGE_PER_COMPLETION;
    }

    // Apply prestige patronage boost
    const patronageBoost = 1 + this.getPrestigeEffect('prestige_patronage_boost');
    bonus *= patronageBoost;

    return bonus;
  }

  public getCrossTierBonus(settlementId: string): number {
    const settlement = this.state.settlements.find((s) => s.id === settlementId);
    if (!settlement) return 0;
    return this.calculateCrossTierBonus(settlement);
  }

  public getCrossTierBonusForTier(tier: TierType): number {
    const tierIndex = TIER_DATA.findIndex((t) => t.type === tier);
    if (tierIndex === -1) return 0;

    let bonus = 0;
    for (let i = tierIndex + 1; i < TIER_DATA.length; i++) {
      const higherTier = TIER_DATA[i];
      const completedCount = this.state.completedSettlements.get(higherTier.type) ?? 0;
      if (completedCount === 0) continue;
      const tierBaseIncome = higherTier.buildings[0]?.baseIncome ?? 1;
      bonus += completedCount * tierBaseIncome * PATRONAGE_PER_COMPLETION;
    }

    const patronageBoost = 1 + this.getPrestigeEffect('prestige_patronage_boost');
    bonus *= patronageBoost;

    return bonus;
  }

  /**
   * Get the effective per-unit income for a building in a settlement,
   * accounting for production boosts, achievement synergies, prestige synergies,
   * and prestige building income boosts.
   */
  public getEffectiveBuildingIncome(settlementId: string, buildingId: string): number {
    const settlement = this.state.settlements.find((s) => s.id === settlementId);
    if (!settlement) return 0;

    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return 0;

    const building = tierDef.buildings.find((b) => b.id === buildingId);
    if (!building) return 0;

    let income = building.baseIncome;

    // Calculate production_boost total for this building
    const productionBoostAmplifier =
      1 + this.getPrestigeEffect('prestige_production_boost_amplifier');
    let boost = 0;

    for (const b of tierDef.buildings) {
      if (b.effect?.type === 'production_boost' && b.effect.targetBuilding === buildingId) {
        const boosterCount = settlement.buildings.get(b.id) ?? 0;
        boost += b.effect.value * boosterCount * productionBoostAmplifier;
      }
    }

    // Add achievement synergy boosts
    for (const achievement of this.unlockedAchievements) {
      if (
        achievement.bonus.type === 'building_synergy' &&
        achievement.bonus.targetBuildingId === buildingId &&
        achievement.bonus.sourceBuildingId !== undefined
      ) {
        const sourceCount = settlement.buildings.get(achievement.bonus.sourceBuildingId) ?? 0;
        boost += achievement.bonus.value * sourceCount;
      }
    }

    // Add prestige synergy boosts
    for (const upgrade of this.purchasedPrestigeUpgrades) {
      if (
        upgrade.effect.type === 'prestige_building_synergy' &&
        upgrade.effect.targetBuilding === buildingId &&
        upgrade.effect.sourceBuilding !== undefined
      ) {
        const sourceCount = settlement.buildings.get(upgrade.effect.sourceBuilding) ?? 0;
        boost += upgrade.effect.value * sourceCount;
      }
    }

    if (boost > 0) {
      income *= 1 + boost;
    }

    // Apply prestige building-specific income boost
    const prestigeBuildingBoost = this.getPrestigeBuildingBoost(buildingId);
    if (prestigeBuildingBoost > 0) {
      income *= 1 + prestigeBuildingBoost;
    }

    return income;
  }

  /**
   * Get the mastery level for a tier (= total completions for that tier).
   */
  public getMasteryLevel(tier: TierType): number {
    return this.state.completedSettlements.get(tier) ?? 0;
  }

  /**
   * Apply a square-root soft cap to mastery completions.
   * Below MASTERY_SOFTCAP_START: linear (unchanged).
   * Above: excess compressed via sqrt(excess * softcap).
   */
  private getEffectiveMasteryCompletions(completions: number): number {
    if (completions <= MASTERY_SOFTCAP_START) {
      return completions;
    }
    const excess = completions - MASTERY_SOFTCAP_START;
    return MASTERY_SOFTCAP_START + Math.sqrt(excess * MASTERY_SOFTCAP_START);
  }

  /**
   * Get the income multiplier from mastery for a tier.
   * Formula: 1 + (effective_completions * 0.001)
   * Soft-capped: linear up to 200, then square-root diminishing returns.
   */
  public getMasteryIncomeMultiplier(tier: TierType): number {
    const completions = this.getMasteryLevel(tier);
    const effective = this.getEffectiveMasteryCompletions(completions);
    const masteryBoost = 1 + this.getPrestigeEffect('prestige_mastery_boost');
    return 1 + effective * MASTERY_INCOME_PER_COMPLETION * masteryBoost;
  }

  /**
   * Get the starting currency bonus from mastery for a tier.
   * Uses soft-capped completions for diminishing returns.
   */
  public getMasteryStartingCurrency(tier: TierType): number {
    const completions = this.getMasteryLevel(tier);
    const effective = this.getEffectiveMasteryCompletions(completions);
    const tierDef = getTierByType(tier);
    if (!tierDef) return 0;
    const baseCurrency = tierDef.buildings[0]?.baseCost ?? 10;
    return Math.floor(effective * baseCurrency * MASTERY_STARTING_CURRENCY_FACTOR);
  }

  /**
   * Get the auto-build speed bonus from mastery.
   * Uses soft-capped completions fed into hyperbolic curve: c / (c + 500).
   * Applied as: interval * (1 - speedBonus)
   */
  public getMasteryAutoBuildSpeed(tier: TierType): number {
    const completions = this.getMasteryLevel(tier);
    if (completions === 0) return 0;
    const effective = this.getEffectiveMasteryCompletions(completions);
    return effective / (effective + MASTERY_AUTOBUILD_HALFPOINT);
  }

  // ===== Prestige & Achievement Effect Helpers =====

  /**
   * Get aggregate prestige effect for a given type.
   * Results are cached per effect type and cleared each update tick.
   */
  public getPrestigeEffect(type: PrestigeUpgrade['effect']['type']): number {
    const cacheKey = `prestige:${type}`;
    const cached = this.effectCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const upgrades = this.purchasedPrestigeUpgrades.filter((u) => u.effect.type === type);

    // Helper: effective level for a prestige upgrade (1 for one-time, level for repeatable)
    const lvl = (u: PrestigeUpgrade): number => (u.repeatable === true ? (u.level ?? 0) : 1);
    // Additive aggregation: value * level per upgrade
    const additive = (acc: number, u: PrestigeUpgrade): number => acc + u.effect.value * lvl(u);
    // Multiplicative aggregation: value^level per upgrade
    const multiplicative = (acc: number, u: PrestigeUpgrade): number =>
      acc * Math.pow(u.effect.value, lvl(u));

    let result: number;
    switch (type) {
      case 'prestige_income_multiplier':
        // Additive sum (e.g., 0.15 + 0.25 = 0.40 → applied as 1 + total)
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_cost_reduction':
        // Multiplicative (e.g., 0.90 * 0.85 = 0.765)
        result = upgrades.reduce(multiplicative, 1);
        break;
      case 'prestige_research_bonus':
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_goal_reduction':
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_starting_currency':
        // Multiplicative (e.g., 2 * 3 = 6x)
        result = upgrades.reduce(multiplicative, 1);
        break;
      case 'prestige_autobuild_speed':
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_survival_speed':
        // Additive sum (e.g., 0.2 + 0.3 = 0.5 → applied as 1 + total multiplier)
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_flat_cost_count':
        // Additive sum of flat-cost building counts
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_cost_scaling_reduction':
        // Additive sum (reduces cost multiplier by total)
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_building_income_boost':
        // Handled per-building via getPrestigeBuildingBoost, not aggregated here
        result = 0;
        break;
      case 'prestige_patronage_boost':
        // Additive sum (e.g., 0.5 + 0.75 = 1.25 → applied as 1 + total multiplier)
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_research_discount':
        // Multiplicative (e.g., 0.85 * 0.75 = 0.6375)
        result = upgrades.reduce(multiplicative, 1);
        break;
      case 'prestige_free_buildings':
        // Additive sum of free building counts
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_currency_boost':
        // Additive sum (e.g., 0.5 + 0.75 = 1.25 → applied as 1 + total)
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_mastery_boost':
        // Additive sum (e.g., 0.5 + 1.0 = 1.5 → mastery rate multiplied by 1 + total)
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_production_boost_amplifier':
        // Additive sum (e.g., 0.4 + 0.6 = 1.0 → production boosts are 100% stronger)
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_grant_building':
        // Handled per-building in spawnSettlement, not aggregated here
        result = 0;
        break;
      case 'prestige_tier_requirement_reduction':
        // Additive sum (reduces tier advancement requirement)
        result = upgrades.reduce(additive, 0);
        break;
      case 'prestige_building_synergy':
        // Handled per-building in calculateSettlementIncome, not aggregated here
        result = 0;
        break;
      case 'prestige_parallel_slots':
        // Additive: each prestige upgrade adds extra parallel slots
        result = upgrades.reduce(additive, 0);
        break;
      default:
        result = 0;
    }
    this.effectCache.set(cacheKey, result);
    return result;
  }

  /**
   * Get the prestige income boost for a specific building ID.
   * Returns the additive sum of all purchased prestige_building_income_boost upgrades
   * that target this building (e.g., 1.0 = +100% income for that building).
   * Results are cached per building ID and cleared each update tick.
   */
  public getPrestigeBuildingBoost(buildingId: string): number {
    const cacheKey = `building_boost:${buildingId}`;
    const cached = this.effectCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const result = this.purchasedPrestigeUpgrades
      .filter(
        (u) =>
          u.effect.type === 'prestige_building_income_boost' &&
          u.effect.targetBuilding === buildingId,
      )
      .reduce((sum, u) => sum + u.effect.value, 0);
    this.effectCache.set(cacheKey, result);
    return result;
  }

  /**
   * Get aggregate achievement bonus for a given type.
   * Results are cached per type+tier and cleared each update tick.
   */
  public getAchievementEffect(type: Achievement['bonus']['type'], tier?: TierType): number {
    const cacheKey = `achievement:${type}:${tier ?? ''}`;
    const cached = this.effectCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const achievements = this.unlockedAchievements.filter((a) => a.bonus.type === type);
    let result: number;
    switch (type) {
      case 'income_multiplier':
        result = achievements.reduce((sum, a) => sum + a.bonus.value, 0);
        break;
      case 'cost_reduction':
        result = achievements.reduce((mult, a) => mult * a.bonus.value, 1);
        break;
      case 'research_bonus':
        result = achievements.reduce((sum, a) => sum + a.bonus.value, 0);
        break;
      case 'starting_currency':
        result = achievements.reduce((sum, a) => sum + a.bonus.value, 0);
        break;
      case 'tier_requirement_reduction':
        // Per-tier achievements (bonus.tier set) only apply to their specific tier;
        // global achievements (no bonus.tier) always apply
        result = achievements
          .filter((a) => a.bonus.tier === undefined || a.bonus.tier === tier)
          .reduce((sum, a) => sum + a.bonus.value, 0);
        break;
      case 'building_synergy':
        // Handled per-building in calculateSettlementIncome, not aggregated here
        result = 0;
        break;
      default:
        result = 0;
    }
    this.effectCache.set(cacheKey, result);
    return result;
  }

  public getPrestigeCurrency(tier: TierType): number {
    return this.state.prestigeCurrency.get(tier) ?? 0;
  }

  public getPrestigeCount(): number {
    return this.state.prestigeCount;
  }

  public getLifetimeCompletions(tier: TierType): number {
    return this.state.lifetimeCompletions.get(tier) ?? 0;
  }

  public getTotalLifetimeCompletions(): number {
    let total = 0;
    for (const count of this.state.lifetimeCompletions.values()) {
      total += count;
    }
    return total;
  }

  /**
   * Calculate how much prestige currency would be earned for each tier
   * based on current completedSettlements (preview before prestiging).
   */
  public getPrestigePreview(): Map<TierType, number> {
    const preview = new Map<TierType, number>();
    const currencyBoost = 1 + this.getPrestigeEffect('prestige_currency_boost');
    for (const [tier, count] of this.state.completedSettlements.entries()) {
      if (tier === TierType.Hamlet) continue;
      const baseCurrency = calculatePrestigeCurrency(count);
      const currency = Math.floor(baseCurrency * currencyBoost);
      if (currency > 0) {
        preview.set(tier, currency);
      }
    }
    return preview;
  }

  /**
   * Check if prestige is available (need at least 1 non-hamlet tier completion).
   */
  public canPrestige(): boolean {
    for (const [tier, count] of this.state.completedSettlements.entries()) {
      if (tier !== TierType.Hamlet && count > 0) return true;
    }
    return false;
  }

  /**
   * Perform a prestige reset.
   * Resets: settlements, research, research points, completedSettlements, autoBuildingTimers.
   * Keeps: unlockedTiers, prestigeCurrency (+ new earnings), prestigeCount,
   *        prestigeUpgrades, achievements, lifetimeCompletions, settings.
   */
  public performPrestige(): boolean {
    this.clearEffectCache();
    this.invalidateMaxAffordableCache();
    if (!this.canPrestige()) return false;

    // Calculate and award prestige currencies
    const earnings = this.getPrestigePreview();
    for (const [tier, amount] of earnings.entries()) {
      const current = this.state.prestigeCurrency.get(tier) ?? 0;
      this.state.prestigeCurrency.set(tier, current + amount);
    }

    // Increment prestige count
    this.state.prestigeCount++;

    // Reset settlements
    this.state.settlements = [];

    // Reset research (keep prestige upgrades)
    this.state.research = RESEARCH_DATA.map((r) => ({ ...r, purchased: false }));

    // Reset research points
    this.state.researchPoints = new Map([[TierType.Hamlet, 0]]);

    // Reset completed settlements (mastery)
    this.state.completedSettlements = new Map();

    // Reset auto-building timers
    this.state.autoBuildingTimers = new Map();

    // Keep unlockedTiers - but reset to just Hamlet
    this.state.unlockedTiers = new Set([TierType.Hamlet]);

    // Re-spawn starting hamlet
    this.autospawnSettlements();

    // Check achievements (prestige count achievements)
    this.checkAchievements();

    return true;
  }

  /**
   * Purchase a prestige upgrade with prestige currency.
   */
  public purchasePrestigeUpgrade(upgradeId: string): boolean {
    this.clearEffectCache();
    this.invalidateMaxAffordableCache();
    const upgrade = this.state.prestigeUpgrades.find((u) => u.id === upgradeId);
    if (!upgrade) return false;

    // Non-repeatable upgrades can only be purchased once
    if (upgrade.repeatable !== true && upgrade.purchased) return false;

    // Check prerequisite
    if (upgrade.prerequisite !== undefined && upgrade.prerequisite !== '') {
      const prereq = this.state.prestigeUpgrades.find((u) => u.id === upgrade.prerequisite);
      if (!prereq) return false;
      // For repeatable prerequisites, require level > 0; otherwise require purchased
      if (prereq.repeatable === true ? (prereq.level ?? 0) === 0 : !prereq.purchased) return false;
    }

    // Check currency (use dynamic cost for repeatable upgrades)
    const actualCost = getPrestigeUpgradeCost(upgrade);
    const currency = this.state.prestigeCurrency.get(upgrade.tier) ?? 0;
    if (currency < actualCost) return false;

    // Purchase
    this.state.prestigeCurrency.set(upgrade.tier, currency - actualCost);

    if (upgrade.repeatable === true) {
      upgrade.level = (upgrade.level ?? 0) + 1;
      // Add to cache if first level
      if (upgrade.level === 1) {
        this.purchasedPrestigeUpgrades.push(upgrade);
      }
    } else {
      upgrade.purchased = true;
      this.purchasedPrestigeUpgrades.push(upgrade);
    }

    // If parallel slots prestige was purchased, spawn new hamlets
    if (upgrade.effect.type === 'prestige_parallel_slots') {
      this.autospawnSettlements();
    }

    // Recalculate income for all settlements
    this.state.settlements.forEach((settlement) => {
      settlement.totalIncome = this.calculateSettlementIncome(settlement);
    });

    return true;
  }

  /**
   * Check all achievements and unlock any whose conditions are met.
   * @param context Optional context from settlement completion (e.g. completion speed).
   */
  public checkAchievements(context?: { completionTimeSeconds?: number }): void {
    for (const achievement of this.state.achievements) {
      if (achievement.unlocked) continue;

      let conditionMet = false;
      switch (achievement.condition.type) {
        case 'tier_completions': {
          const tier = achievement.condition.tier;
          if (tier !== undefined) {
            const completions = this.state.lifetimeCompletions.get(tier) ?? 0;
            conditionMet = completions >= achievement.condition.value;
          }
          break;
        }
        case 'total_completions': {
          const total = this.getTotalLifetimeCompletions();
          conditionMet = total >= achievement.condition.value;
          break;
        }
        case 'prestige_count':
          conditionMet = this.state.prestigeCount >= achievement.condition.value;
          break;
        case 'speed_completion':
          if (context?.completionTimeSeconds !== undefined) {
            conditionMet = context.completionTimeSeconds <= achievement.condition.value;
          }
          break;
        case 'max_single_building':
          for (const settlement of this.state.settlements) {
            for (const count of settlement.buildings.values()) {
              if (count >= achievement.condition.value) {
                conditionMet = true;
                break;
              }
            }
            if (conditionMet) break;
          }
          break;
        case 'max_currency_held':
          for (const settlement of this.state.settlements) {
            if (settlement.currency >= achievement.condition.value) {
              conditionMet = true;
              break;
            }
          }
          break;
        case 'settlement_count':
          conditionMet = this.state.settlements.length >= achievement.condition.value;
          break;
        case 'research_purchased': {
          const purchasedCount = this.state.research.filter((r) => r.purchased).length;
          conditionMet = purchasedCount >= achievement.condition.value;
          break;
        }
        case 'near_broke':
          for (const settlement of this.state.settlements) {
            if (settlement.currency < achievement.condition.value && settlement.totalIncome > 0) {
              conditionMet = true;
              break;
            }
          }
          break;
        case 'specific_building_count': {
          const bId = achievement.condition.buildingId;
          if (bId !== undefined && bId !== '') {
            for (const settlement of this.state.settlements) {
              if ((settlement.buildings.get(bId) ?? 0) >= achievement.condition.value) {
                conditionMet = true;
                break;
              }
            }
          }
          break;
        }
      }

      if (conditionMet) {
        this.addNotification('achievement_unlocked', `Achievement: ${achievement.name}`);
        achievement.unlocked = true;
        this.unlockedAchievements.push(achievement);
        this.clearEffectCache();
        this.invalidateMaxAffordableCache();
      }
    }
  }

  private getResearchEffect(type: string, tier?: TierType): number {
    const cacheKey = `research:${type}:${tier ?? ''}`;
    const cached = this.effectCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const upgrades = this.state.research.filter(
      (r) => r.purchased && r.effect.type === type && (tier !== undefined ? r.tier === tier : true),
    );

    let result: number;
    if (type === 'cost_reduction') {
      result = upgrades.reduce((mult, upgrade) => mult * (upgrade.effect.value ?? 1), 1);
    } else if (type === 'parallel_slots') {
      // Additive: each parallel_slots research adds extra slots
      result = upgrades.reduce((sum, upgrade) => sum + (upgrade.effect.value ?? 0), 0);
    } else {
      result = upgrades.reduce((sum, upgrade) => sum + (upgrade.effect.value ?? 0), 0);
    }
    this.effectCache.set(cacheKey, result);
    return result;
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

      // Add prestige research bonus
      researchBonus += this.getPrestigeEffect('prestige_research_bonus');

      // Add achievement research bonus
      researchBonus += this.getAchievementEffect('research_bonus');

      const currentPoints = this.state.researchPoints.get(settlement.tier) ?? 0;
      this.state.researchPoints.set(settlement.tier, currentPoints + researchBonus);

      if (this.isGoalNotificationEnabled(settlement.tier)) {
        const tierName = settlement.tier.charAt(0).toUpperCase() + settlement.tier.slice(1);
        this.addNotification(
          'goal_complete',
          `${tierName} completed! +${researchBonus} research`,
          settlement.tier,
        );
      }

      const completedCount = (this.state.completedSettlements.get(settlement.tier) ?? 0) + 1;
      this.state.completedSettlements.set(settlement.tier, completedCount);

      // Track lifetime completions (persists through prestige)
      const lifetimeCount = (this.state.lifetimeCompletions.get(settlement.tier) ?? 0) + 1;
      this.state.lifetimeCompletions.set(settlement.tier, lifetimeCount);

      // Check achievements (pass completion speed for speed achievements)
      const completionTimeSeconds = (Date.now() - settlement.spawnTime) / 1000;
      this.checkAchievements({ completionTimeSeconds });

      // Remove completed settlement
      this.state.settlements = this.state.settlements.filter((s) => s.id !== settlement.id);

      // Check if we should spawn next tier settlement
      this.checkNextTierSpawn(settlement.tier);

      // Only auto-replace hamlets (the base tier). Higher tier settlements
      // are earned through lower tier completions and don't respawn.
      if (settlement.tier === TierType.Hamlet) {
        this.autospawnSettlements();
      }
    }
  }

  /**
   * Get the tier advancement requirement (completions needed to spawn next tier).
   * Base is 6, reduced by research (tier-scoped), prestige, and achievements. Minimum 2.
   */
  public getTierRequirement(tier?: TierType): number {
    const researchReduction = this.getResearchEffect('tier_requirement_reduction', tier);
    const prestigeReduction = this.getPrestigeEffect('prestige_tier_requirement_reduction');
    const achievementReduction = this.getAchievementEffect('tier_requirement_reduction', tier);
    const totalReduction = researchReduction + prestigeReduction + achievementReduction;
    return Math.max(2, 6 - totalReduction);
  }

  private checkNextTierSpawn(completedTier: TierType): void {
    const completedCount = this.state.completedSettlements.get(completedTier) ?? 0;

    const requirement = this.getTierRequirement(completedTier);
    if (completedCount % requirement === 0) {
      const tierIndex = TIER_DATA.findIndex((t) => t.type === completedTier);
      if (tierIndex !== -1 && tierIndex < TIER_DATA.length - 1) {
        const nextTier = TIER_DATA[tierIndex + 1];
        const wasUnlocked = this.state.unlockedTiers.has(nextTier.type);
        this.state.unlockedTiers.add(nextTier.type);

        if (!wasUnlocked) {
          this.addNotification('tier_unlocked', `${nextTier.name} tier unlocked!`, nextTier.type);
        }

        // Initialize research points for the new tier
        if (!this.state.researchPoints.has(nextTier.type)) {
          this.state.researchPoints.set(nextTier.type, 0);
        }

        // Directly spawn 1 settlement of the next tier
        this.spawnSettlement(nextTier.type);
      }
    }
  }

  private autospawnSettlements(): void {
    // Only auto-spawn for Hamlet (the base tier).
    // Higher tiers are earned by completing N of the tier below, not auto-spawned.
    if (!this.state.unlockedTiers.has(TierType.Hamlet)) return;

    // Base slot of 1 (always have at least 1 hamlet)
    // Research and prestige each add extra slots on top
    const researchSlots = this.getResearchEffect('parallel_slots');
    const prestigeSlots = this.getPrestigeEffect('prestige_parallel_slots');
    const maxSlots = 1 + researchSlots + prestigeSlots;
    const currentCount = this.state.settlements.filter((s) => s.tier === TierType.Hamlet).length;
    const slotsNeeded = maxSlots - currentCount;

    for (let i = 0; i < slotsNeeded; i++) {
      this.spawnSettlement(TierType.Hamlet);
    }
  }

  public purchaseResearch(researchId: string): boolean {
    this.clearEffectCache();
    this.invalidateMaxAffordableCache();
    const research = this.state.research.find((r) => r.id === researchId);
    if (!research || research.purchased) return false;

    // Check if tier is unlocked
    if (!this.state.unlockedTiers.has(research.tier)) return false;

    // Check if player has enough research points for this tier (apply prestige discount)
    const tierPoints = this.state.researchPoints.get(research.tier) ?? 0;
    const researchDiscount = this.getPrestigeEffect('prestige_research_discount');
    const effectiveCost = Math.max(1, Math.floor(research.cost * researchDiscount));
    if (tierPoints < effectiveCost) return false;

    // Check prerequisites
    if (research.prerequisite !== undefined && research.prerequisite !== '') {
      const prereq = this.state.research.find((r) => r.id === research.prerequisite);
      if (!prereq || !prereq.purchased) return false;
    }

    // Purchase the research (at discounted cost)
    this.state.researchPoints.set(research.tier, tierPoints - effectiveCost);
    research.purchased = true;

    // Handle special research effects
    if (research.effect.type === 'parallel_slots') {
      this.autospawnSettlements();
    }

    // Generate next level for repeatable research (everything except parallel_slots)
    this.maybeGenerateNextResearchLevel(research);

    // Recalculate income for all existing settlements of this tier
    // (applies to starting_income, and potentially other income-affecting research)
    this.state.settlements
      .filter((settlement) => settlement.tier === research.tier)
      .forEach((settlement) => {
        settlement.totalIncome = this.calculateSettlementIncome(settlement);
      });

    // Check achievements (research_purchased condition)
    this.checkAchievements();

    return true;
  }

  private static readonly ROMAN_NUMERALS = [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
  ];

  /**
   * After purchasing a research item, check if it's the terminal item in its chain.
   * If so, generate a more expensive next level (research is uncapped, just gets pricier).
   * parallel_slots is excluded (research slots are capped; prestige can add more).
   */
  private maybeGenerateNextResearchLevel(purchased: ResearchUpgrade): void {
    // parallel_slots is capped, don't generate more
    if (purchased.effect.type === 'parallel_slots') return;
    // tier_requirement_reduction is a one-time purchase per tier
    if (purchased.effect.type === 'tier_requirement_reduction') return;
    // starting_buildings is a capped chain, don't auto-generate
    if (purchased.effect.type === 'starting_buildings') return;

    // Check if there's already an unpurchased successor in the same chain
    const hasSameChainSuccessor = this.state.research.some(
      (r) =>
        r.prerequisite === purchased.id &&
        !r.purchased &&
        r.effect.type === purchased.effect.type &&
        (purchased.effect.type !== 'auto_building' ||
          r.effect.buildingId === purchased.effect.buildingId),
    );
    if (hasSameChainSuccessor) return;

    // Determine current level from the id suffix (e.g., hamlet_cost_reduction_3 → 3)
    const idParts = purchased.id.split('_');
    const lastPart = idParts[idParts.length - 1];
    const currentLevel = parseInt(lastPart) || 1;
    const nextLevel = currentLevel + 1;

    // Build next level id
    const baseId = idParts.slice(0, -1).join('_');
    const nextId = `${baseId}_${nextLevel}`;

    // Don't create duplicates
    if (this.state.research.some((r) => r.id === nextId)) return;

    // Cost escalates: each level costs 3x the previous
    const nextCost = Math.round(purchased.cost * 3);

    // Compute next effect
    const nextEffect = { ...purchased.effect };
    switch (purchased.effect.type) {
      case 'auto_building':
        // Reduce interval by 20%, minimum 5 seconds
        if (nextEffect.interval !== undefined) {
          nextEffect.interval = Math.max(5000, Math.round(nextEffect.interval * 0.8));
        }
        break;
      case 'cost_reduction':
        // Each level multiplies by another 0.95
        if (nextEffect.value !== undefined) {
          nextEffect.value = parseFloat((nextEffect.value * 0.95).toFixed(4));
        }
        break;
      // starting_income / starting_capital: same value each level (keeps stacking)
    }

    // Generate name: strip existing roman numeral and add next
    const baseName = purchased.name.replace(/ [IVXLCDM]+$/, '');
    const numeral =
      nextLevel <= GameStateManager.ROMAN_NUMERALS.length
        ? GameStateManager.ROMAN_NUMERALS[nextLevel - 1]
        : `${nextLevel}`;
    const nextName = `${baseName} ${numeral}`;

    // Generate description based on effect type
    const nextDescription = this.generateResearchDescription(purchased, nextEffect);

    this.state.research.push({
      id: nextId,
      name: nextName,
      description: nextDescription,
      cost: nextCost,
      tier: purchased.tier,
      effect: nextEffect,
      purchased: false,
      prerequisite: purchased.id,
      repeatable: true,
      level: nextLevel,
    });
  }

  private generateResearchDescription(
    base: ResearchUpgrade,
    effect: ResearchUpgrade['effect'],
  ): string {
    const tierName = base.tier.charAt(0).toUpperCase() + base.tier.slice(1);
    switch (effect.type) {
      case 'starting_income':
        return `+${effect.value} starting income for new ${tierName.toLowerCase()}s`;
      case 'auto_building': {
        const seconds = effect.interval !== undefined ? Math.round(effect.interval / 1000) : 0;
        const buildingName = effect.buildingId?.split('_').slice(1).join(' ') ?? 'building';
        return `Automatically buys 1 ${buildingName} every ${seconds} seconds`;
      }
      case 'cost_reduction': {
        const pct = effect.value !== undefined ? Math.round((1 - effect.value) * 100) : 0;
        return `Reduces all building costs by ${pct}%`;
      }
      case 'tier_requirement_reduction': {
        const current = this.getTierRequirement(base.tier);
        const next = Math.max(2, current - (effect.value ?? 1));
        return `Reduces ${base.tier} completions needed to advance tiers by ${effect.value ?? 1} (${current}→${next})`;
      }
      case 'starting_capital':
        return `Start with +${effect.value} currency in new ${tierName.toLowerCase()}s`;
      default:
        return base.description;
    }
  }

  /**
   * Returns a short comparison hint for an unpurchased research upgrade,
   * showing the player what they currently have so they can judge value.
   */
  public getResearchComparisonHint(research: ResearchUpgrade): string {
    if (research.purchased) return '';

    switch (research.effect.type) {
      case 'auto_building': {
        const baseInterval = research.effect.interval;
        if (baseInterval === undefined || baseInterval === 0) return '';

        // Calculate effective interval for this upgrade (with speed bonuses)
        const speedBonus = this.getMasteryAutoBuildSpeed(research.tier);
        const prestigeSpeedBonus = this.getPrestigeEffect('prestige_autobuild_speed');
        const totalSpeedBonus = Math.min(0.9, speedBonus + prestigeSpeedBonus);
        const effectiveSeconds = Math.round((baseInterval * (1 - totalSpeedBonus)) / 1000);

        // Find existing purchased auto-builders for the same building
        const existing = this.state.research.filter(
          (r) =>
            r.purchased &&
            r.effect.type === 'auto_building' &&
            r.effect.buildingId === research.effect.buildingId,
        );

        const parts: string[] = [];
        if (effectiveSeconds !== Math.round(baseInterval / 1000)) {
          parts.push(`${effectiveSeconds}s with bonuses`);
        }
        if (existing.length > 0) {
          const intervals = existing.map((r) => r.effect.interval ?? Infinity);
          const bestBase = Math.min(...intervals);
          const bestEffective = Math.round((bestBase * (1 - totalSpeedBonus)) / 1000);
          parts.push(`current best: ${bestEffective}s`);
        }
        return parts.length > 0 ? `(${parts.join(', ')})` : '';
      }

      case 'cost_reduction': {
        const currentMult = this.getResearchEffect('cost_reduction', research.tier);
        const currentPct = Math.round((1 - currentMult) * 100);
        if (currentPct === 0) return '';
        const newMult = currentMult * (research.effect.value ?? 1);
        const newPct = Math.round((1 - newMult) * 100);
        return `(currently ${currentPct}% → ${newPct}% total)`;
      }

      case 'starting_income': {
        const current = this.getResearchEffect('starting_income', research.tier);
        if (current === 0) return '';
        return `(currently +${current})`;
      }

      case 'flat_cost_count': {
        const researchFlat = this.getResearchEffect('flat_cost_count', research.tier);
        const prestigeFlat = this.getPrestigeEffect('prestige_flat_cost_count');
        const current = researchFlat + prestigeFlat;
        if (current === 0) return '';
        return `(currently ${current})`;
      }

      case 'starting_capital': {
        const current = this.getResearchEffect('starting_capital', research.tier);
        if (current === 0) return '';
        return `(currently +${current})`;
      }

      case 'starting_buildings': {
        const buildingId = research.effect.buildingId ?? '';
        if (buildingId === '') return '';
        const purchased = this.state.research.filter(
          (r) =>
            r.purchased &&
            r.effect.type === 'starting_buildings' &&
            r.tier === research.tier &&
            r.effect.buildingId === buildingId,
        );
        const currentCount = purchased.reduce((sum, r) => sum + (r.effect.value ?? 0), 0);
        if (currentCount === 0) return '';
        return `(currently ${currentCount})`;
      }

      default:
        return '';
    }
  }

  private clearEffectCache(): void {
    this.effectCache.clear();
  }

  /**
   * Rebuild the pre-filtered purchased/unlocked lists from full state arrays.
   * Called after bulk state changes (init, load, import).
   */
  private rebuildPurchasedCaches(): void {
    this.purchasedPrestigeUpgrades = this.state.prestigeUpgrades.filter(
      (u) => u.purchased || (u.repeatable === true && (u.level ?? 0) > 0),
    );
    this.unlockedAchievements = this.state.achievements.filter((a) => a.unlocked);
  }

  /**
   * Invalidate the maxAffordable cache when cost calculations change
   * (research/prestige/achievement purchased, game loaded, prestige reset).
   * NOT called per-tick — the threshold-based cache handles gradual currency changes.
   */
  private invalidateMaxAffordableCache(): void {
    this.maxAffordableCache.clear();
  }

  public update(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    // Clear cached effect lookups so they are recomputed at most once per tick
    this.clearEffectCache();

    // Update currency for each settlement based on its income
    const shouldUpdateGoals = now - this.lastGoalUpdate >= 300;
    this.state.settlements.forEach((settlement) => {
      const crossTierBonus = this.calculateCrossTierBonus(settlement);
      let currencyGained = (settlement.totalIncome + crossTierBonus) * deltaTime;

      // Apply dev mode 1000x income multiplier
      if (this.state.settings.devModeEnabled) {
        currencyGained *= 1000;
      }

      settlement.currency += currencyGained;
      settlement.lifetimeCurrencyEarned += currencyGained;

      // Update goal progress every 300ms instead of every tick
      if (shouldUpdateGoals) {
        this.updateGoalProgress(settlement);
      } else {
        // Always check completion even on skipped ticks (cheap: just checks flags)
        this.checkSettlementCompletion(settlement);
      }
    });
    if (shouldUpdateGoals) {
      this.lastGoalUpdate = now;
    }

    // Process automated building purchases
    this.processAutoBuildingPurchases(now);

    // Periodically check live-state achievements (every 2 seconds)
    if (now - this.lastAchievementCheck >= 2000) {
      this.lastAchievementCheck = now;
      this.checkAchievements();
    }
  }

  /**
   * Buy a building for auto-build without recalculating income or checking completion.
   * Used by processAutoBuildingPurchases to batch income recalculations.
   */
  private autoBuyBuilding(settlement: Settlement, buildingId: string): boolean {
    const tierDef = getTierByType(settlement.tier);
    if (!tierDef) return false;

    const building = tierDef.buildings.find((b) => b.id === buildingId);
    if (!building) return false;

    const currentCount = settlement.buildings.get(buildingId) ?? 0;
    const cost = this.calculateBuildingCost(
      building.baseCost,
      building.costMultiplier,
      currentCount,
      settlement.id,
    );

    if (settlement.currency < cost) return false;

    // Treasury cap: skip if cost exceeds X% of treasury, unless first building
    if (currentCount > 0 && cost > settlement.currency * AUTO_BUILD_TREASURY_PCT) {
      return false;
    }

    settlement.currency -= cost;
    settlement.totalCurrencySpent += cost;
    settlement.buildings.set(buildingId, currentCount + 1);
    return true;
  }

  private processAutoBuildingPurchases(now: number): void {
    // Get all purchased auto-building research
    const autoBuildingResearch = this.state.research.filter(
      (r) => r.purchased && r.effect.type === 'auto_building',
    );

    if (autoBuildingResearch.length === 0) return;

    // Pre-group settlements by tier so we don't re-filter per research item
    const settlementsByTier = new Map<TierType, Settlement[]>();
    for (const settlement of this.state.settlements) {
      const list = settlementsByTier.get(settlement.tier);
      if (list !== undefined) {
        list.push(settlement);
      } else {
        settlementsByTier.set(settlement.tier, [settlement]);
      }
    }

    const dirtySettlements = new Set<Settlement>();

    for (const research of autoBuildingResearch) {
      const buildingId = research.effect.buildingId;
      const baseInterval = research.effect.interval;

      if (
        buildingId === undefined ||
        buildingId === '' ||
        baseInterval === undefined ||
        baseInterval === 0
      )
        continue;

      // Apply mastery auto-build speed bonus + prestige bonus
      const speedBonus = this.getMasteryAutoBuildSpeed(research.tier);
      const prestigeSpeedBonus = this.getPrestigeEffect('prestige_autobuild_speed');
      const totalSpeedBonus = Math.min(0.9, speedBonus + prestigeSpeedBonus); // Cap at 90% reduction
      const interval = Math.round(baseInterval * (1 - totalSpeedBonus));

      const lastPurchaseTime = this.state.autoBuildingTimers.get(research.id) ?? 0;

      // Check if enough time has passed
      if (now - lastPurchaseTime >= interval) {
        const tierSettlements = settlementsByTier.get(research.tier);
        if (tierSettlements === undefined) continue;

        let bought = false;
        for (const settlement of tierSettlements) {
          if (this.autoBuyBuilding(settlement, buildingId)) {
            dirtySettlements.add(settlement);
            bought = true;
          }
        }
        if (bought) {
          this.state.autoBuildingTimers.set(research.id, now);
        }
      }
    }

    // Batch: recalculate income and check completion once per affected settlement
    for (const settlement of dirtySettlements) {
      settlement.totalIncome = this.calculateSettlementIncome(settlement);
      this.checkSettlementCompletion(settlement);
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
    const goalReduction = this.getGoalReductionFactor(settlement);

    settlement.goals.forEach((goal) => {
      if (goal.isCompleted) return;

      let newValue = 0;
      let completed = false;
      const effectiveTarget = goal.targetValue * goalReduction;

      switch (goal.type) {
        case GoalType.ReachIncome:
          newValue = settlement.totalIncome;
          completed = newValue >= effectiveTarget;
          break;

        case GoalType.AccumulateCurrency:
          newValue = settlement.lifetimeCurrencyEarned;
          completed = newValue >= effectiveTarget;
          break;

        case GoalType.CurrentCurrency:
          newValue = settlement.currency;
          completed = newValue >= effectiveTarget;
          break;

        case GoalType.BuildingCount:
          if (goal.buildingId !== undefined && goal.buildingId !== '') {
            newValue = settlement.buildings.get(goal.buildingId) ?? 0;
            // Building count goals use ceiling so you always need at least 1
            completed = newValue >= Math.ceil(effectiveTarget);
          }
          break;

        case GoalType.CurrencySpent:
          newValue = settlement.totalCurrencySpent;
          completed = newValue >= effectiveTarget;
          break;

        case GoalType.TotalBuildings: {
          let total = 0;
          for (const count of settlement.buildings.values()) {
            total += count;
          }
          newValue = total;
          completed = newValue >= Math.ceil(effectiveTarget);
          break;
        }

        case GoalType.Survival: {
          // Income accelerates prosperity: higher income means faster progress
          const elapsedSeconds = (now - settlement.spawnTime) / 1000;
          const tierDef = getTierByType(settlement.tier);
          const avgBaseIncome = tierDef
            ? tierDef.buildings.reduce((sum, b) => sum + b.baseIncome, 0) / tierDef.buildings.length
            : 1;
          const incomeThreshold = avgBaseIncome * 100;
          const timeMultiplier = 1 + settlement.totalIncome / incomeThreshold;
          // Apply prestige survival speed bonus
          const survivalSpeedBonus = 1 + this.getPrestigeEffect('prestige_survival_speed');
          newValue = Math.floor(elapsedSeconds * timeMultiplier * survivalSpeedBonus);
          completed = newValue >= effectiveTarget;
          break;
        }
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

  public toggleShowPrestigeShop(): boolean {
    this.state.settings.showPrestigeShop = !this.state.settings.showPrestigeShop;
    return this.state.settings.showPrestigeShop;
  }

  public isShowPrestigeShopEnabled(): boolean {
    return this.state.settings.showPrestigeShop;
  }

  public toggleShowCompletedPrestige(): boolean {
    this.state.settings.showCompletedPrestige = !this.state.settings.showCompletedPrestige;
    return this.state.settings.showCompletedPrestige;
  }

  public isShowCompletedPrestigeEnabled(): boolean {
    return this.state.settings.showCompletedPrestige;
  }

  public toggleCompactView(): boolean {
    this.state.settings.compactView = !this.state.settings.compactView;
    return this.state.settings.compactView;
  }

  public isCompactViewEnabled(): boolean {
    return this.state.settings.compactView;
  }

  public isGoalNotificationEnabled(tier: TierType): boolean {
    return this.state.settings.goalNotificationsByTier[tier] !== false;
  }

  public toggleGoalNotification(tier: TierType): boolean {
    const current = this.isGoalNotificationEnabled(tier);
    this.state.settings.goalNotificationsByTier[tier] = !current;
    return !current;
  }

  public getAndClearNotifications(): GameNotification[] {
    const notifications = this.pendingNotifications;
    this.pendingNotifications = [];
    return notifications;
  }

  private addNotification(type: GameNotification['type'], message: string, tier?: TierType): void {
    this.pendingNotifications.push({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      message,
      tier,
      timestamp: Date.now(),
    });
    if (this.pendingNotifications.length > 10) {
      this.pendingNotifications = this.pendingNotifications.slice(-10);
    }
  }

  // For testing - manually trigger autospawn
  public triggerAutospawn(): void {
    this.autospawnSettlements();
  }

  // For testing - spawn a settlement of a specific tier
  public spawnTestSettlement(tierType: TierType): Settlement | null {
    return this.spawnSettlement(tierType);
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
          prestigeCurrency: Array.from(this.state.prestigeCurrency.entries()),
          prestigeCount: this.state.prestigeCount,
          lifetimeCompletions: Array.from(this.state.lifetimeCompletions.entries()),
          prestigeUpgrades: this.state.prestigeUpgrades,
          achievements: this.state.achievements,
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
          totalCurrencySpent: serializableSettlement.totalCurrencySpent ?? 0,
          buildings: new Map(serializableSettlement.buildings),
        }),
      );

      // Reconstruct the state from serialized data
      const savedSettings = saveData.gameState.settings;
      const settings: GameState['settings'] = {
        devModeEnabled: savedSettings.devModeEnabled,
        showCompletedResearch: savedSettings.showCompletedResearch,
        showPrestigeShop: savedSettings.showPrestigeShop ?? false,
        showCompletedPrestige: savedSettings.showCompletedPrestige ?? false,
        buyAmount: savedSettings.buyAmount ?? 1,
        compactView: savedSettings.compactView ?? true,
        goalNotificationsByTier: savedSettings.goalNotificationsByTier ?? {},
      };

      // Load prestige upgrades, merging saved state with current definitions
      const savedPrestigeUpgrades = saveData.gameState.prestigeUpgrades ?? [];
      const prestigeUpgrades = PRESTIGE_UPGRADES.map((def) => {
        const saved = savedPrestigeUpgrades.find((u: PrestigeUpgrade) => u.id === def.id);
        return saved
          ? { ...def, purchased: saved.purchased, level: saved.level }
          : { ...def, purchased: false };
      });

      // Load research, merging saved state with current definitions
      // This ensures newly added research appears in existing saves
      const savedResearch = saveData.gameState.research;
      const canonicalIds = new Set(RESEARCH_DATA.map((r) => r.id));
      const research = RESEARCH_DATA.map((def) => {
        const saved = savedResearch.find((r: ResearchUpgrade) => r.id === def.id);
        return saved
          ? { ...def, purchased: saved.purchased, level: saved.level }
          : { ...def, purchased: false };
      });
      // Also include dynamically generated repeatable research not in canonical data
      // Skip stale research types from old saves
      const staleResearchTypes = new Set([
        'tier_requirement_reduction',
        'cost_scaling_reduction',
        'parallel_slots',
      ]);
      for (const saved of savedResearch) {
        if (!canonicalIds.has(saved.id) && !staleResearchTypes.has(saved.effect.type)) {
          research.push(saved);
        }
      }

      // Load achievements, merging saved state with current definitions
      const savedAchievements = saveData.gameState.achievements ?? [];
      const achievements = ACHIEVEMENTS_DATA.map((def) => {
        const saved = savedAchievements.find((a: Achievement) => a.id === def.id);
        return saved ? { ...def, unlocked: saved.unlocked } : { ...def, unlocked: false };
      });

      this.state = {
        settlements,
        researchPoints: new Map(saveData.gameState.researchPoints),
        unlockedTiers: new Set(saveData.gameState.unlockedTiers),
        completedSettlements: new Map(saveData.gameState.completedSettlements),
        research,
        autoBuildingTimers: new Map(saveData.gameState.autoBuildingTimers),
        prestigeCurrency: new Map(saveData.gameState.prestigeCurrency ?? []),
        prestigeCount: saveData.gameState.prestigeCount ?? 0,
        lifetimeCompletions: new Map(saveData.gameState.lifetimeCompletions ?? []),
        prestigeUpgrades,
        achievements,
        settings,
      };

      this.clearEffectCache();
      this.invalidateMaxAffordableCache();
      this.rebuildPurchasedCaches();
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
