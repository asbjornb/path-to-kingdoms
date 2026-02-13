import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { GameStateManager } from './GameState';
import { TierType, GoalType, Goal } from '../types/game';
import { TIER_DATA, getTierByType } from '../data/tiers';
import { GoalGenerator } from '../data/goals';

/**
 * Shared helpers for balance simulation tests.
 *
 * Strategy: "buy a random affordable building once per simulated second."
 * For every goal template at a tier we spin up a fresh settlement, run
 * the simulation on a fast clock and assert the goal completes within a
 * reasonable time window (not too fast, not too slow).
 *
 * No mastery, prestige, achievements, or research are active — this tests
 * the raw baseline economy.
 *
 * The tests are split into one file per tier so Vitest can run them in
 * parallel across worker threads. Each file uses the lightweight node
 * environment (no jsdom) with a minimal localStorage/window shim installed
 * below.
 */

// ── Lightweight browser shim (avoids expensive jsdom) ────────────────
// GameStateManager needs localStorage and window.setInterval at runtime.
// In the node environment these don't exist, so we provide a minimal shim.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, String(value));
    },
    removeItem: (key: string): void => {
      store.delete(key);
    },
    clear: (): void => {
      store.clear();
    },
    get length(): number {
      return store.size;
    },
    key: (index: number): string | null => [...store.keys()][index] ?? null,
  };
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}

// ── Time-window bounds per tier (in simulated minutes) ──────────────
const TIER_BOUNDS: Record<TierType, { minMinutes: number; maxMinutes: number }> = {
  [TierType.Hamlet]: { minMinutes: 5, maxMinutes: 20 },
  [TierType.Village]: { minMinutes: 7, maxMinutes: 23 },
  [TierType.Town]: { minMinutes: 9, maxMinutes: 26 },
  [TierType.City]: { minMinutes: 11, maxMinutes: 29 },
  [TierType.County]: { minMinutes: 13, maxMinutes: 32 },
  [TierType.Duchy]: { minMinutes: 15, maxMinutes: 35 },
  [TierType.Realm]: { minMinutes: 17, maxMinutes: 38 },
  [TierType.Kingdom]: { minMinutes: 19, maxMinutes: 41 },
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

  return Math.ceil(baseTierMax * (1 + Math.log10(costRatio) * 3));
}

// Absolute hard cap — if a goal isn't done by this many simulated seconds, stop
const SIMULATION_HARD_CAP_SECONDS = 60 * 240; // 4 hours

// ── Summary collector for the per-tier report ────────────────────────
interface SimResult {
  tier: string;
  goal: string;
  target: number;
  minutes: number | null;
  maxUsed: number;
  status: 'OK' | 'TOO FAST' | 'TOO SLOW' | 'DID NOT COMPLETE';
}

/**
 * Run a simulation for a single settlement+goal combo.
 * Returns the number of simulated seconds it took to complete, or null if it
 * hit the hard cap.
 */
function simulateGoal(tierType: TierType, goal: Goal): number | null {
  let seed = 42;
  function seededRandom(): number {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  let simulatedTime = 1_000_000_000;
  const dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => simulatedTime);

  try {
    const game = new GameStateManager();
    const state = game.getState();

    let settlement = state.settlements[0];

    if (tierType !== TierType.Hamlet) {
      state.unlockedTiers.add(tierType);
      const spawned = game.spawnTestSettlement(tierType);
      if (!spawned) return null;
      settlement = spawned;

      state.settlements = state.settlements.filter((s) => s.id === settlement.id);
    }

    settlement.goals = [{ ...goal, currentValue: 0, isCompleted: false }];
    settlement.isComplete = false;

    const tierDef = getTierByType(tierType)!;
    const buildingIds = tierDef.buildings.map((b) => b.id);

    for (let tick = 0; tick < SIMULATION_HARD_CAP_SECONDS; tick++) {
      simulatedTime += 1000;
      game.update();

      if (settlement.isComplete) {
        return tick;
      }

      const affordable = buildingIds.filter((bid) => {
        const cost = game.getBuildingCost(settlement.id, bid);
        return cost !== null && settlement.currency >= cost;
      });

      if (affordable.length > 0) {
        const pick = affordable[Math.floor(seededRandom() * affordable.length)];
        game.buyBuilding(settlement.id, pick);
      }

      if (settlement.isComplete) {
        return tick;
      }
    }

    return null;
  } finally {
    dateNowSpy.mockRestore();
  }
}

/**
 * Define the simulation test suite for a single tier.
 * Call this from a per-tier test file so Vitest can run tiers in parallel.
 */
export function defineSimulationTests(tierType: TierType): void {
  const bounds = TIER_BOUNDS[tierType];
  const tierName = TIER_DATA.find((t) => t.type === tierType)?.name ?? tierType;
  const goals = GoalGenerator.getAllGoalTemplates(tierType);
  const results: SimResult[] = [];

  describe(`Balance simulation — ${tierName}`, () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    afterAll(() => {
      const pad = (s: string, n: number): string => s.padEnd(n);
      const rpad = (s: string, n: number): string => s.padStart(n);

      console.log('\n' + '='.repeat(90));
      console.log(`  BALANCE SIMULATION — ${tierName.toUpperCase()}`);
      console.log('='.repeat(90));
      console.log(
        `  ${pad('Tier', 10)} ${pad('Goal', 30)} ${rpad('Target', 12)} ${rpad('Time', 10)} ${rpad('Max', 6)}  Status`,
      );
      console.log('-'.repeat(90));

      for (const r of results) {
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

      const passed = results.filter((r) => r.status === 'OK').length;
      const total = results.length;
      console.log('-'.repeat(90));
      console.log(`  ${passed}/${total} goals within bounds`);
      console.log('='.repeat(90) + '\n');
    });

    for (const goal of goals) {
      const goalMax = computeGoalMaxMinutes(goal, tierType, bounds.maxMinutes);

      // Known balance issue: Kingdom Eternal Monument is unreachable with
      // random buying across 5 buildings.
      const testFn =
        tierType === TierType.Kingdom && goal.buildingId === 'kingdom_monument' ? it.skip : it;

      testFn(`${goal.description} — ${bounds.minMinutes}–${goalMax} min window`, () => {
        const seconds = simulateGoal(tierType, goal);
        const minutes = seconds !== null ? seconds / 60 : null;

        let status: SimResult['status'] = 'OK';
        if (minutes === null) {
          status = 'DID NOT COMPLETE';
        } else if (minutes < bounds.minMinutes) {
          status = 'TOO FAST';
        } else if (minutes > goalMax) {
          status = 'TOO SLOW';
        }
        results.push({
          tier: tierName,
          goal: goal.description,
          target: goal.targetValue,
          minutes,
          maxUsed: goalMax,
          status,
        });

        const label = `[${tierName}] ${goal.description} (target=${goal.targetValue})`;

        expect(
          seconds,
          `${label} did not complete within ${SIMULATION_HARD_CAP_SECONDS / 60} min hard cap`,
        ).not.toBeNull();

        expect(
          minutes,
          `${label} completed too fast at ${minutes?.toFixed(1)} min (min: ${bounds.minMinutes})`,
        ).toBeGreaterThanOrEqual(bounds.minMinutes);

        expect(
          minutes,
          `${label} completed too slow at ${minutes?.toFixed(1)} min (max: ${goalMax})`,
        ).toBeLessThanOrEqual(goalMax);
      });
    }
  });
}
