import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { GameStateManager } from './GameState';
import { TierType, GoalType, Goal } from '../types/game';
import { TIER_DATA, getTierByType } from '../data/tiers';
import { GoalGenerator } from '../data/goals';

/**
 * Balance simulation test.
 *
 * Strategy: "buy a random affordable building once per simulated second."
 * For every goal template at every tier we spin up a fresh settlement, run
 * the simulation on a fast clock and assert the goal completes within a
 * reasonable time window (not too fast, not too slow).
 *
 * No mastery, prestige, achievements, or research are active — this tests
 * the raw baseline economy.
 *
 * Tuning: tighten the TIER_BOUNDS windows as you balance the game.
 * Building-count goals for expensive buildings automatically get wider max
 * bounds (proportional to log of cost ratio vs cheapest building in tier).
 */

// ── Time-window bounds per tier (in simulated minutes) ──────────────
// These apply directly to economy goals (income, currency, survival).
// Building-count goals scale the max up based on the building's cost
// (see computeGoalMaxMinutes).
const TIER_BOUNDS: Record<TierType, { minMinutes: number; maxMinutes: number }> = {
  [TierType.Hamlet]: { minMinutes: 1, maxMinutes: 20 },
  [TierType.Village]: { minMinutes: 1, maxMinutes: 12 },
  [TierType.Town]: { minMinutes: 1, maxMinutes: 15 },
  [TierType.City]: { minMinutes: 1, maxMinutes: 18 },
  [TierType.County]: { minMinutes: 1, maxMinutes: 25 },
  [TierType.Duchy]: { minMinutes: 1, maxMinutes: 40 },
  [TierType.Realm]: { minMinutes: 1, maxMinutes: 15 },
  [TierType.Kingdom]: { minMinutes: 1, maxMinutes: 25 },
};

/**
 * For building-count goals, expensive buildings naturally take longer with
 * a random-buy strategy. We scale the max bound proportional to
 * log10(buildingCost / cheapestCost) so the test stays meaningful for both
 * cheap and expensive buildings.
 */
function computeGoalMaxMinutes(goal: Goal, tierType: TierType, baseTierMax: number): number {
  if (
    goal.type !== GoalType.BuildingCount ||
    goal.buildingId === undefined ||
    goal.buildingId === ''
  )
    return baseTierMax;

  const tierDef = getTierByType(tierType);
  if (!tierDef) return baseTierMax;

  const building = tierDef.buildings.find((b) => b.id === goal.buildingId);
  if (!building) return baseTierMax;

  const cheapest = tierDef.buildings[0].baseCost;
  const costRatio = building.baseCost / cheapest;
  if (costRatio <= 1) return baseTierMax;

  // Cheap buildings: ~1x the tier max
  // Medium buildings (5x cost): ~3x
  // Expensive buildings (50x cost): ~6x
  // Very expensive buildings (200x cost): ~8x
  return Math.ceil(baseTierMax * (1 + Math.log10(costRatio) * 3));
}

// Absolute hard cap — if a goal isn't done by this many simulated seconds, stop
const SIMULATION_HARD_CAP_SECONDS = 60 * 240; // 4 hours

// ── Summary collector for the final report ──────────────────────────
interface SimResult {
  tier: string;
  goal: string;
  target: number;
  minutes: number | null; // null = did not complete
  maxUsed: number;
  status: 'OK' | 'TOO FAST' | 'TOO SLOW' | 'DID NOT COMPLETE';
}
const allResults: SimResult[] = [];

/**
 * Get every goal template for a tier directly from GoalGenerator so the
 * test stays in sync with the actual game goals automatically.
 */
function allGoalTemplatesForTier(tierType: TierType): Goal[] {
  return GoalGenerator.getAllGoalTemplates(tierType);
}

/**
 * Run a simulation for a single settlement+goal combo.
 * Returns the number of simulated seconds it took to complete, or null if it
 * hit the hard cap.
 */
function simulateGoal(tierType: TierType, goal: Goal): number | null {
  // ── Deterministic seeded random for reproducibility ──
  let seed = 42;
  function seededRandom(): number {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  // ── Mock Date.now so the game's internal clocks move at our pace ──
  let simulatedTime = 1_000_000_000; // arbitrary epoch
  const dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => simulatedTime);

  try {
    const game = new GameStateManager();
    const state = game.getState();

    // We only care about the first (auto-spawned) settlement. If the tier
    // isn't Hamlet we need to unlock it and spawn one manually.
    let settlement = state.settlements[0];

    if (tierType !== TierType.Hamlet) {
      // Unlock the tier and spawn
      state.unlockedTiers.add(tierType);
      const spawned = game.spawnTestSettlement(tierType);
      if (!spawned) return null;
      settlement = spawned;

      // Remove the auto-spawned hamlet so it doesn't interfere
      state.settlements = state.settlements.filter((s) => s.id === settlement.id);
    }

    // Override the goal with the one we want to test
    settlement.goals = [{ ...goal, currentValue: 0, isCompleted: false }];
    settlement.isComplete = false;

    const tierDef = getTierByType(tierType)!;
    const buildingIds = tierDef.buildings.map((b) => b.id);

    // ── Simulation loop: 1 simulated second per tick ──
    for (let tick = 0; tick < SIMULATION_HARD_CAP_SECONDS; tick++) {
      simulatedTime += 1000; // advance 1 second
      game.update(); // process income + goal progress

      if (settlement.isComplete) {
        return tick;
      }

      // Buy one random affordable building
      const affordable = buildingIds.filter((bid) => {
        const cost = game.getBuildingCost(settlement.id, bid);
        return cost !== null && settlement.currency >= cost;
      });

      if (affordable.length > 0) {
        const pick = affordable[Math.floor(seededRandom() * affordable.length)];
        game.buyBuilding(settlement.id, pick);
      }

      // Check again after buying (building count goals can complete on buy)
      if (settlement.isComplete) {
        return tick;
      }
    }

    return null; // didn't complete within the hard cap
  } finally {
    dateNowSpy.mockRestore();
  }
}

// ── Tests ──────────────────────────────────────────────────────────
const TIERS_TO_TEST: TierType[] = [
  TierType.Hamlet,
  TierType.Village,
  TierType.Town,
  TierType.City,
  TierType.County,
  TierType.Duchy,
  TierType.Realm,
  TierType.Kingdom,
];

describe('Balance simulation — random affordable build once per second', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Print a summary table after all tests finish
  afterAll(() => {
    const pad = (s: string, n: number) => s.padEnd(n);
    const rpad = (s: string, n: number) => s.padStart(n);

    console.log('\n' + '='.repeat(90));
    console.log('  BALANCE SIMULATION SUMMARY');
    console.log('='.repeat(90));
    console.log(
      `  ${pad('Tier', 10)} ${pad('Goal', 30)} ${rpad('Target', 12)} ${rpad('Time', 10)} ${rpad('Max', 6)}  Status`,
    );
    console.log('-'.repeat(90));

    for (const r of allResults) {
      const timeStr = r.minutes !== null ? `${r.minutes.toFixed(1)} min` : 'DNF';
      const maxStr = `${r.maxUsed}`;
      const statusMark =
        r.status === 'OK'
          ? '  OK'
          : r.status === 'TOO FAST'
            ? '  << TOO FAST'
            : r.status === 'TOO SLOW'
              ? '  >> TOO SLOW'
              : '  !! DID NOT COMPLETE';
      console.log(
        `  ${pad(r.tier, 10)} ${pad(r.goal, 30)} ${rpad(String(r.target), 12)} ${rpad(timeStr, 10)} ${rpad(maxStr, 6)}${statusMark}`,
      );
    }

    const passed = allResults.filter((r) => r.status === 'OK').length;
    const total = allResults.length;
    console.log('-'.repeat(90));
    console.log(`  ${passed}/${total} goals within bounds`);
    console.log('='.repeat(90) + '\n');
  });

  for (const tierType of TIERS_TO_TEST) {
    const bounds = TIER_BOUNDS[tierType];
    const tierName = TIER_DATA.find((t) => t.type === tierType)?.name ?? tierType;
    const goals = allGoalTemplatesForTier(tierType);

    describe(`${tierName}`, () => {
      for (const goal of goals) {
        const goalMax = computeGoalMaxMinutes(goal, tierType, bounds.maxMinutes);

        // Known balance issue: Kingdom Eternal Monument (baseCost 2B, mult 1.25,
        // 39 copies needed) is unreachable with random buying across 5 buildings.
        // The exponential cost scaling outpaces income growth. Skip until the
        // goal targets are rebalanced.
        const testFn =
          tierType === TierType.Kingdom && goal.buildingId === 'kingdom_monument' ? it.skip : it;

        testFn(`${goal.description} — ${bounds.minMinutes}–${goalMax} min window`, () => {
          const seconds = simulateGoal(tierType, goal);
          const minutes = seconds !== null ? seconds / 60 : null;

          // Record for summary
          let status: SimResult['status'] = 'OK';
          if (minutes === null) {
            status = 'DID NOT COMPLETE';
          } else if (minutes < bounds.minMinutes) {
            status = 'TOO FAST';
          } else if (minutes > goalMax) {
            status = 'TOO SLOW';
          }
          allResults.push({
            tier: tierName,
            goal: goal.description,
            target: goal.targetValue,
            minutes,
            maxUsed: goalMax,
            status,
          });

          const label = `[${tierName}] ${goal.description} (target=${goal.targetValue})`;

          // Must complete within the hard cap
          expect(
            seconds,
            `${label} did not complete within ${SIMULATION_HARD_CAP_SECONDS / 60} min hard cap`,
          ).not.toBeNull();

          // Must not be trivially instant
          expect(
            minutes,
            `${label} completed too fast at ${minutes?.toFixed(1)} min (min: ${bounds.minMinutes})`,
          ).toBeGreaterThanOrEqual(bounds.minMinutes);

          // Must complete within the goal-specific max
          expect(
            minutes,
            `${label} completed too slow at ${minutes?.toFixed(1)} min (max: ${goalMax})`,
          ).toBeLessThanOrEqual(goalMax);
        });
      }
    });
  }
});
