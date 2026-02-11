import { describe, it, expect, vi, afterEach } from 'vitest';
import { GameStateManager } from './GameState';
import { TierType } from '../types/game';
import { getTierByType, TIER_DATA } from '../data/tiers';

/**
 * Balance simulation: spawns a settlement for each tier and has a simulated
 * player buy one random affordable building per second (on a mocked fast clock).
 * Checks that each settlement completes all goals within expected time bounds.
 *
 * No mastery, prestige, achievements, or research are involved — purely
 * base-game balance with random play.
 */

// Deterministic PRNG (mulberry32) for reproducible random building choices
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// [minSeconds, maxSeconds] per tier
const TIER_BOUNDS: Record<TierType, [number, number]> = {
  [TierType.Hamlet]: [120, 900], // 2–15 min
  [TierType.Village]: [120, 1500], // 2–25 min
  [TierType.Town]: [120, 1800], // 2–30 min
  [TierType.City]: [120, 2100], // 2–35 min
  [TierType.County]: [120, 2400], // 2–40 min
  [TierType.Duchy]: [120, 2700], // 2–45 min
  [TierType.Realm]: [120, 3000], // 2–50 min
  [TierType.Kingdom]: [120, 3300], // 2–55 min
};

const TRIALS_PER_TIER = 5;
const MAX_SIM_SECONDS = 3600; // 1-hour hard cap

interface SimResult {
  seconds: number;
  goalInfo: string;
}

/**
 * Simulate a single settlement from spawn to goal completion.
 * Each simulated second: earn income, then buy one random affordable building.
 * Returns seconds until completion, or -1 if it didn't finish.
 */
function simulateSettlement(tierType: TierType, seed: number): SimResult {
  const rng = mulberry32(seed);
  let mockTime = 1_000_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

  const game = new GameStateManager();

  // For non-hamlet tiers, unlock and spawn a test settlement
  if (tierType !== TierType.Hamlet) {
    game.getState().unlockedTiers.add(tierType);
    game.spawnTestSettlement(tierType);
  }

  const settlement = game.getState().settlements.find((s) => s.tier === tierType)!;
  const settlementId = settlement.id;
  const tierDef = getTierByType(tierType)!;
  const goalInfo = settlement.goals
    .map((g) => `${g.description} (type=${g.type}, target=${g.targetValue})`)
    .join('; ');

  for (let tick = 1; tick <= MAX_SIM_SECONDS; tick++) {
    mockTime += 1000;

    // Earn income and update goal progress
    game.update();

    // Buy one random affordable building
    const affordable = tierDef.buildings.filter((b) => {
      const cost = game.getBuildingCost(settlementId, b.id);
      return cost !== null && settlement.currency >= cost;
    });

    if (affordable.length > 0) {
      const pick = affordable[Math.floor(rng() * affordable.length)];
      game.buyBuilding(settlementId, pick.id);
    }

    // Settlement removed from list → it completed
    if (!game.getState().settlements.find((s) => s.id === settlementId)) {
      game.stopAutoSave();
      return { seconds: tick, goalInfo };
    }
  }

  game.stopAutoSave();
  return { seconds: -1, goalInfo };
}

describe('Balance simulation — random buyer completes goals within time bounds', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const tier of TIER_DATA) {
    const [minSec, maxSec] = TIER_BOUNDS[tier.type];

    describe(`${tier.name} (${minSec / 60}–${maxSec / 60} min)`, () => {
      for (let trial = 0; trial < TRIALS_PER_TIER; trial++) {
        it(`trial ${trial + 1}`, () => {
          const seed = tier.type.charCodeAt(0) * 10000 + trial * 137 + 42;
          const result = simulateSettlement(tier.type, seed);
          const minutes = result.seconds > 0 ? (result.seconds / 60).toFixed(1) : 'DNF';

          expect(
            result.seconds,
            `${tier.name} did not complete in ${MAX_SIM_SECONDS}s. Goal: ${result.goalInfo}`,
          ).toBeGreaterThan(0);

          expect(
            result.seconds,
            `${tier.name} completed too fast at ${minutes} min. Goal: ${result.goalInfo}`,
          ).toBeGreaterThanOrEqual(minSec);

          expect(
            result.seconds,
            `${tier.name} completed too slow at ${minutes} min. Goal: ${result.goalInfo}`,
          ).toBeLessThanOrEqual(maxSec);
        });
      }
    });
  }
});
