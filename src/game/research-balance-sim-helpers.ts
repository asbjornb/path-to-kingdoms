import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { GameStateManager } from './GameState';
import { TierType, GoalType, Goal, ResearchUpgrade } from '../types/game';
import { TIER_DATA, getTierByType } from '../data/tiers';
import { GoalGenerator } from '../data/goals';
import { RESEARCH_DATA } from '../data/research';

/**
 * Research balance simulation tests.
 *
 * Compares the value of different research upgrades by measuring how much
 * they speed up settlement completion relative to their cost. Uses the same
 * "buy a random affordable building once per second" strategy as the baseline
 * balance sim, but with specific research pre-purchased.
 *
 * Three test categories:
 * 1. Individual research value comparison — are first-level upgrades proportional?
 * 2. Repeatable chain diminishing returns — does marginal value per RP decrease?
 * 3. Full research stack — does stacking everything trivialize the game?
 */

// ── Lightweight browser shim (same as balance-simulation-helpers.ts) ──
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as unknown as Record<string, unknown>).localStorage = {
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
  (globalThis as unknown as Record<string, unknown>).window = globalThis;
}

// ── Constants ─────────────────────────────────────────────────────────

const SIMULATION_HARD_CAP_SECONDS = 60 * 240; // 4 hours

// Each first-level research should not make things worse (allow small noise from random strategy)
const MIN_SPEEDUP_PERCENT = -5;

// No single first-level research should speed things up more than this
const MAX_SINGLE_RESEARCH_SPEEDUP_PERCENT = 60;

// Full stack of research shouldn't reduce completion time below this fraction of baseline
const FULL_STACK_MIN_TIME_FRACTION = 0.15;

// Speedup-per-RP across individual research types should be within this factor.
// A high ratio flags a balance concern: one research is dramatically more cost-effective.
// Set to 30x to catch only egregious outliers; review the printed report for subtler issues.
const MAX_VALUE_RATIO = 30;

// ── Research config types ─────────────────────────────────────────────

interface ResearchConfig {
  name: string;
  researchIds: string[]; // Ordered — buy in this order (respects prerequisites)
  totalCost: number;
}

interface SimResult {
  config: string;
  goal: string;
  baselineSeconds: number | null;
  researchSeconds: number | null;
  speedupPercent: number | null;
  speedupPerRP: number | null;
  rpCost: number;
}

interface ConfigSummary {
  config: string;
  rpCost: number;
  avgSpeedupPercent: number;
  avgSpeedupPerRP: number;
  goalsCompleted: number;
  goalsTested: number;
}

// ── Research config builders ──────────────────────────────────────────

/**
 * Get individual first-level research configs for comparing upgrade types.
 */
function getIndividualConfigs(tierType: TierType): ResearchConfig[] {
  const configs: ResearchConfig[] = [];

  // First-level cost_reduction
  const costReduction = RESEARCH_DATA.find(
    (r) =>
      r.tier === tierType &&
      r.effect.type === 'cost_reduction' &&
      (r.prerequisite === undefined || r.prerequisite === ''),
  );
  if (costReduction) {
    configs.push({
      name: `cost_reduction_1 (${costReduction.cost} RP)`,
      researchIds: [costReduction.id],
      totalCost: costReduction.cost,
    });
  }

  // First-level starting_income
  const startingIncome = RESEARCH_DATA.find(
    (r) =>
      r.tier === tierType &&
      r.effect.type === 'starting_income' &&
      (r.prerequisite === undefined || r.prerequisite === ''),
  );
  if (startingIncome) {
    configs.push({
      name: `starting_income_1 (${startingIncome.cost} RP)`,
      researchIds: [startingIncome.id],
      totalCost: startingIncome.cost,
    });
  }

  // Foundation planning (flat_cost_count)
  const foundationPlanning = RESEARCH_DATA.find(
    (r) => r.tier === tierType && r.effect.type === 'flat_cost_count',
  );
  if (foundationPlanning) {
    configs.push({
      name: `foundation_planning (${foundationPlanning.cost} RP)`,
      researchIds: [foundationPlanning.id],
      totalCost: foundationPlanning.cost,
    });
  }

  return configs;
}

/**
 * Walk a prerequisite chain for a given effect type, returning cumulative configs.
 * E.g., for cost_reduction: [level 1], [levels 1+2], [levels 1+2+3].
 */
function getCumulativeChain(tierType: TierType, effectType: string): ResearchConfig[] {
  const first = RESEARCH_DATA.find(
    (r) =>
      r.tier === tierType &&
      r.effect.type === effectType &&
      (r.prerequisite === undefined || r.prerequisite === ''),
  );
  if (!first) return [];

  const chain: ResearchUpgrade[] = [first];
  let current = first;
  for (;;) {
    const next = RESEARCH_DATA.find(
      (r) => r.prerequisite === current.id && r.effect.type === effectType && r.tier === tierType,
    );
    if (!next) break;
    chain.push(next);
    current = next;
  }

  const configs: ResearchConfig[] = [];
  let totalCost = 0;
  const ids: string[] = [];
  for (let i = 0; i < chain.length; i++) {
    totalCost += chain[i].cost;
    ids.push(chain[i].id);
    configs.push({
      name: `${effectType} L1-${i + 1} (${totalCost} RP)`,
      researchIds: [...ids],
      totalCost,
    });
  }
  return configs;
}

/**
 * Get chain configs for diminishing returns testing.
 * Only returns chains with 2+ levels (otherwise there's nothing to compare).
 */
function getChainConfigs(tierType: TierType): { chainName: string; levels: ResearchConfig[] }[] {
  const chains: { chainName: string; levels: ResearchConfig[] }[] = [];

  const costReductionChain = getCumulativeChain(tierType, 'cost_reduction');
  if (costReductionChain.length > 1) {
    chains.push({ chainName: 'cost_reduction', levels: costReductionChain });
  }

  const startingIncomeChain = getCumulativeChain(tierType, 'starting_income');
  if (startingIncomeChain.length > 1) {
    chains.push({ chainName: 'starting_income', levels: startingIncomeChain });
  }

  return chains;
}

/**
 * Topologically sort research by prerequisite order.
 */
function topologicalSort(research: ResearchUpgrade[]): ResearchUpgrade[] {
  const result: ResearchUpgrade[] = [];
  const remaining = [...research];
  const added = new Set<string>();

  while (remaining.length > 0) {
    const nextIdx = remaining.findIndex(
      (r) => r.prerequisite === undefined || r.prerequisite === '' || added.has(r.prerequisite),
    );
    if (nextIdx === -1) break;
    const next = remaining.splice(nextIdx, 1)[0];
    result.push(next);
    added.add(next.id);
  }

  return result;
}

/**
 * Get "full stack" config: all non-auto, non-tier-requirement, non-parallel research.
 */
function getFullStackConfig(tierType: TierType): ResearchConfig | null {
  const tierResearch = RESEARCH_DATA.filter(
    (r) =>
      r.tier === tierType &&
      r.effect.type !== 'auto_building' &&
      r.effect.type !== 'tier_requirement_reduction' &&
      r.effect.type !== 'parallel_slots',
  );

  if (tierResearch.length === 0) return null;

  const ordered = topologicalSort(tierResearch);
  const totalCost = ordered.reduce((sum, r) => sum + r.cost, 0);

  return {
    name: `full_stack (${totalCost} RP, ${ordered.length} upgrades)`,
    researchIds: ordered.map((r) => r.id),
    totalCost,
  };
}

/**
 * Pick representative goals: one of each non-building type.
 * Building goals are excluded because they're noisy (dependent on which building)
 * and already well-tested by the baseline sim.
 */
function getRepresentativeGoals(tierType: TierType): Goal[] {
  const all = GoalGenerator.getAllGoalTemplates(tierType);
  const targetTypes = [GoalType.ReachIncome, GoalType.AccumulateCurrency, GoalType.CurrentCurrency];
  return targetTypes
    .map((type) => all.find((g) => g.type === type))
    .filter((g): g is Goal => g !== undefined);
}

// ── Simulation engine ─────────────────────────────────────────────────

/**
 * Run a simulation for a single goal + research config.
 * Returns simulated seconds to complete, or null if hard cap hit.
 */
function simulateGoalWithResearch(
  tierType: TierType,
  goal: Goal,
  researchIds: string[],
): number | null {
  let seed = 42;
  function seededRandom(): number {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  let simulatedTime = 1_000_000_000;
  const dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => simulatedTime);
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  try {
    const game = new GameStateManager();
    const state = game.getState();

    // Unlock tier first — purchaseResearch checks unlockedTiers
    if (tierType !== TierType.Hamlet) {
      state.unlockedTiers.add(tierType);
    }

    // Purchase requested research (give unlimited RP first)
    if (researchIds.length > 0) {
      state.researchPoints.set(tierType, 999999);
      for (const id of researchIds) {
        game.purchaseResearch(id);
      }
      // Reset RP to 0 so it doesn't affect the simulation
      state.researchPoints.set(tierType, 0);
    }

    let settlement = state.settlements[0];

    if (tierType !== TierType.Hamlet) {
      const spawned = game.spawnTestSettlement(tierType);
      if (!spawned) return null;
      settlement = spawned;
      state.settlements = state.settlements.filter((s) => s.id === settlement.id);
    }

    settlement.goals = [{ ...goal, currentValue: 0, isCompleted: false }];
    settlement.isComplete = false;

    const tierDef = getTierByType(tierType);
    if (!tierDef) return null;
    const buildingIds = tierDef.buildings.map((b) => b.id);

    for (let tick = 0; tick < SIMULATION_HARD_CAP_SECONDS; tick++) {
      simulatedTime += 1000;
      game.update();

      if (settlement.isComplete) return tick;

      const affordable = buildingIds.filter((bid) => {
        const cost = game.getBuildingCost(settlement.id, bid);
        return cost !== null && settlement.currency >= cost;
      });

      if (affordable.length > 0) {
        const pick = affordable[Math.floor(seededRandom() * affordable.length)];
        game.buyBuilding(settlement.id, pick);
      }

      if (settlement.isComplete) return tick;
    }

    return null;
  } finally {
    warnSpy.mockRestore();
    dateNowSpy.mockRestore();
  }
}

// ── Reporting helpers ─────────────────────────────────────────────────

function pad(s: string, n: number): string {
  return s.padEnd(n);
}

function rpad(s: string, n: number): string {
  return s.padStart(n);
}

function summarizeResults(results: SimResult[]): ConfigSummary[] {
  const byConfig = new Map<string, SimResult[]>();
  for (const r of results) {
    const existing = byConfig.get(r.config) ?? [];
    existing.push(r);
    byConfig.set(r.config, existing);
  }

  const summaries: ConfigSummary[] = [];
  for (const [config, configResults] of byConfig) {
    const completed = configResults.filter(
      (r) => r.speedupPercent !== null && r.baselineSeconds !== null,
    );
    const avgSpeedup =
      completed.length > 0
        ? completed.reduce((sum, r) => sum + (r.speedupPercent ?? 0), 0) / completed.length
        : 0;
    const rpCost = configResults[0].rpCost;
    const avgSpeedupPerRP = rpCost > 0 ? avgSpeedup / rpCost : 0;

    summaries.push({
      config,
      rpCost,
      avgSpeedupPercent: avgSpeedup,
      avgSpeedupPerRP,
      goalsCompleted: completed.length,
      goalsTested: configResults.length,
    });
  }

  return summaries;
}

function printReport(
  tierName: string,
  section: string,
  results: SimResult[],
  summaries: ConfigSummary[],
): void {
  console.log('\n' + '='.repeat(100));
  console.log(`  RESEARCH BALANCE — ${tierName.toUpperCase()} — ${section}`);
  console.log('='.repeat(100));
  console.log(
    `  ${pad('Config', 35)} ${pad('Goal', 25)} ${rpad('Base', 10)} ${rpad('Research', 10)} ${rpad('Speedup', 10)} ${rpad('$/RP', 8)}`,
  );
  console.log('-'.repeat(100));

  for (const r of results) {
    const baseStr = r.baselineSeconds !== null ? `${(r.baselineSeconds / 60).toFixed(1)}m` : 'DNF';
    const resStr = r.researchSeconds !== null ? `${(r.researchSeconds / 60).toFixed(1)}m` : 'DNF';
    const speedStr = r.speedupPercent !== null ? `${r.speedupPercent.toFixed(1)}%` : 'N/A';
    const perRPStr = r.speedupPerRP !== null ? r.speedupPerRP.toFixed(3) : 'N/A';
    console.log(
      `  ${pad(r.config, 35)} ${pad(r.goal, 25)} ${rpad(baseStr, 10)} ${rpad(resStr, 10)} ${rpad(speedStr, 10)} ${rpad(perRPStr, 8)}`,
    );
  }

  console.log('-'.repeat(100));
  console.log(
    `  ${pad('SUMMARY', 35)} ${pad('', 25)} ${rpad('', 10)} ${rpad('', 10)} ${rpad('Avg %', 10)} ${rpad('Avg/RP', 8)}`,
  );
  for (const s of summaries) {
    console.log(
      `  ${pad(s.config, 35)} ${pad(`${s.goalsCompleted}/${s.goalsTested} goals`, 25)} ${rpad('', 10)} ${rpad('', 10)} ${rpad(s.avgSpeedupPercent.toFixed(1) + '%', 10)} ${rpad(s.avgSpeedupPerRP.toFixed(3), 8)}`,
    );
  }
  console.log('='.repeat(100) + '\n');
}

// ── Main test definition ──────────────────────────────────────────────

/**
 * Define research balance simulation tests for a single tier.
 */
export function defineResearchSimulationTests(tierType: TierType): void {
  const tierName = TIER_DATA.find((t) => t.type === tierType)?.name ?? tierType;
  const representativeGoals = getRepresentativeGoals(tierType);

  describe(`Research balance — ${tierName}`, () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    // ── Cache baselines: run once per goal, reuse across configs ────────
    // We run baselines inside a describe block so they share the same scope.

    describe('Individual research value comparison', () => {
      const configs = getIndividualConfigs(tierType);
      const allResults: SimResult[] = [];

      // Skip if fewer than 2 research types to compare
      if (configs.length < 2) return;

      afterAll(() => {
        const summaries = summarizeResults(allResults);
        printReport(tierName, 'INDIVIDUAL VALUE', allResults, summaries);
      });

      it('each research type provides meaningful and proportional speedup', () => {
        // Run baseline for all representative goals
        const baselines = new Map<string, number | null>();
        for (const goal of representativeGoals) {
          localStorage.clear();
          const seconds = simulateGoalWithResearch(tierType, goal, []);
          baselines.set(goal.description, seconds);
        }

        // Run each research config
        const configSpeedups: Map<string, { avgSpeedup: number; perRP: number }> = new Map();

        for (const config of configs) {
          const speedups: number[] = [];

          for (const goal of representativeGoals) {
            localStorage.clear();
            const baselineSeconds = baselines.get(goal.description) ?? null;
            const researchSeconds = simulateGoalWithResearch(tierType, goal, config.researchIds);

            let speedupPercent: number | null = null;
            let speedupPerRP: number | null = null;

            if (baselineSeconds !== null && researchSeconds !== null && baselineSeconds > 0) {
              speedupPercent = ((baselineSeconds - researchSeconds) / baselineSeconds) * 100;
              speedupPerRP = config.totalCost > 0 ? speedupPercent / config.totalCost : 0;
              speedups.push(speedupPercent);
            }

            allResults.push({
              config: config.name,
              goal: goal.description,
              baselineSeconds,
              researchSeconds,
              speedupPercent,
              speedupPerRP,
              rpCost: config.totalCost,
            });
          }

          if (speedups.length > 0) {
            const avgSpeedup = speedups.reduce((a, b) => a + b, 0) / speedups.length;
            const perRP = config.totalCost > 0 ? avgSpeedup / config.totalCost : 0;
            configSpeedups.set(config.name, { avgSpeedup, perRP });
          }
        }

        // ── Assertions ──────────────────────────────────────────────

        // Each research should not make things meaningfully worse (noise tolerance)
        for (const [name, { avgSpeedup }] of configSpeedups) {
          expect(
            avgSpeedup,
            `${name} avg speedup ${avgSpeedup.toFixed(1)}% is below minimum ${MIN_SPEEDUP_PERCENT}% — research is harmful`,
          ).toBeGreaterThanOrEqual(MIN_SPEEDUP_PERCENT);
        }

        // No single first-level research should be game-breakingly strong
        for (const [name, { avgSpeedup }] of configSpeedups) {
          expect(
            avgSpeedup,
            `${name} avg speedup ${avgSpeedup.toFixed(1)}% exceeds max ${MAX_SINGLE_RESEARCH_SPEEDUP_PERCENT}%`,
          ).toBeLessThanOrEqual(MAX_SINGLE_RESEARCH_SPEEDUP_PERCENT);
        }

        // Compare value-per-RP across configs that provide meaningful speedup (> 1%).
        // A high ratio means one research type is much more cost-effective than another.
        const meaningfulConfigs = [...configSpeedups.entries()].filter(
          ([, v]) => v.avgSpeedup > 1 && v.perRP > 0,
        );
        if (meaningfulConfigs.length >= 2) {
          const perRPValues = meaningfulConfigs.map(([, v]) => v.perRP);
          const maxPerRP = Math.max(...perRPValues);
          const minPerRP = Math.min(...perRPValues);
          const ratio = maxPerRP / minPerRP;
          expect(
            ratio,
            `Value-per-RP ratio ${ratio.toFixed(1)}x exceeds max ${MAX_VALUE_RATIO}x ` +
              `(best: ${maxPerRP.toFixed(3)}, worst: ${minPerRP.toFixed(3)})`,
          ).toBeLessThanOrEqual(MAX_VALUE_RATIO);
        }
      });
    });

    describe('Repeatable research diminishing returns', () => {
      const chains = getChainConfigs(tierType);
      const allResults: SimResult[] = [];

      if (chains.length === 0) {
        it('no multi-level chains at this tier (skipped)', () => {
          // No chains with 2+ levels to test diminishing returns
        });
        return;
      }

      afterAll(() => {
        const summaries = summarizeResults(allResults);
        printReport(tierName, 'CHAIN SCALING', allResults, summaries);
      });

      for (const chain of chains) {
        it(`${chain.chainName} chain has diminishing marginal value per RP`, () => {
          // Run baseline
          const baselines = new Map<string, number | null>();
          for (const goal of representativeGoals) {
            localStorage.clear();
            const seconds = simulateGoalWithResearch(tierType, goal, []);
            baselines.set(goal.description, seconds);
          }

          // Run each chain level
          const levelSpeedups: { level: number; avgSpeedup: number; totalCost: number }[] = [];

          for (let i = 0; i < chain.levels.length; i++) {
            const config = chain.levels[i];
            const speedups: number[] = [];

            for (const goal of representativeGoals) {
              localStorage.clear();
              const baselineSeconds = baselines.get(goal.description) ?? null;
              const researchSeconds = simulateGoalWithResearch(tierType, goal, config.researchIds);

              let speedupPercent: number | null = null;
              let speedupPerRP: number | null = null;

              if (baselineSeconds !== null && researchSeconds !== null && baselineSeconds > 0) {
                speedupPercent = ((baselineSeconds - researchSeconds) / baselineSeconds) * 100;
                speedupPerRP = config.totalCost > 0 ? speedupPercent / config.totalCost : 0;
                speedups.push(speedupPercent);
              }

              allResults.push({
                config: config.name,
                goal: goal.description,
                baselineSeconds,
                researchSeconds,
                speedupPercent,
                speedupPerRP,
                rpCost: config.totalCost,
              });
            }

            if (speedups.length > 0) {
              const avgSpeedup = speedups.reduce((a, b) => a + b, 0) / speedups.length;
              levelSpeedups.push({
                level: i + 1,
                avgSpeedup,
                totalCost: config.totalCost,
              });
            }
          }

          // ── Assertions ────────────────────────────────────────────

          // Each additional level should still provide positive total speedup
          // (buying more research should never make things slower)
          for (let i = 1; i < levelSpeedups.length; i++) {
            expect(
              levelSpeedups[i].avgSpeedup,
              `${chain.chainName} level ${levelSpeedups[i].level} total speedup ` +
                `(${levelSpeedups[i].avgSpeedup.toFixed(1)}%) should be >= level ` +
                `${levelSpeedups[i - 1].level} (${levelSpeedups[i - 1].avgSpeedup.toFixed(1)}%)`,
            ).toBeGreaterThanOrEqual(levelSpeedups[i - 1].avgSpeedup);
          }

          // Marginal speedup-per-RP should decrease (diminishing returns)
          if (levelSpeedups.length >= 2) {
            const marginalPerRP: number[] = [];
            marginalPerRP.push(levelSpeedups[0].avgSpeedup / levelSpeedups[0].totalCost);

            for (let i = 1; i < levelSpeedups.length; i++) {
              const marginalSpeedup = levelSpeedups[i].avgSpeedup - levelSpeedups[i - 1].avgSpeedup;
              const marginalCost = levelSpeedups[i].totalCost - levelSpeedups[i - 1].totalCost;
              marginalPerRP.push(marginalCost > 0 ? marginalSpeedup / marginalCost : 0);
            }

            for (let i = 1; i < marginalPerRP.length; i++) {
              expect(
                marginalPerRP[i],
                `${chain.chainName} level ${i + 1} marginal value/RP ` +
                  `(${marginalPerRP[i].toFixed(4)}) should be <= level ${i} ` +
                  `(${marginalPerRP[i - 1].toFixed(4)}) — diminishing returns`,
              ).toBeLessThanOrEqual(marginalPerRP[i - 1] * 1.1); // 10% tolerance
            }
          }
        });
      }
    });

    describe('Full research stack sanity', () => {
      const fullStack = getFullStackConfig(tierType);
      const allResults: SimResult[] = [];

      if (!fullStack) return;

      afterAll(() => {
        const summaries = summarizeResults(allResults);
        printReport(tierName, 'FULL STACK', allResults, summaries);
      });

      it('stacking all economy research does not trivialize goals', () => {
        for (const goal of representativeGoals) {
          localStorage.clear();
          const baselineSeconds = simulateGoalWithResearch(tierType, goal, []);

          localStorage.clear();
          const researchSeconds = simulateGoalWithResearch(tierType, goal, fullStack.researchIds);

          let speedupPercent: number | null = null;
          let speedupPerRP: number | null = null;

          if (baselineSeconds !== null && researchSeconds !== null && baselineSeconds > 0) {
            speedupPercent = ((baselineSeconds - researchSeconds) / baselineSeconds) * 100;
            speedupPerRP = fullStack.totalCost > 0 ? speedupPercent / fullStack.totalCost : 0;
          }

          allResults.push({
            config: fullStack.name,
            goal: goal.description,
            baselineSeconds,
            researchSeconds,
            speedupPercent,
            speedupPerRP,
            rpCost: fullStack.totalCost,
          });

          // Research-boosted time should be at least FULL_STACK_MIN_TIME_FRACTION of baseline
          if (baselineSeconds !== null && researchSeconds !== null) {
            const minAllowedSeconds = baselineSeconds * FULL_STACK_MIN_TIME_FRACTION;
            expect(
              researchSeconds,
              `Full stack reduced "${goal.description}" to ${(researchSeconds / 60).toFixed(1)}m ` +
                `(baseline ${(baselineSeconds / 60).toFixed(1)}m). ` +
                `Minimum allowed: ${(minAllowedSeconds / 60).toFixed(1)}m ` +
                `(${(FULL_STACK_MIN_TIME_FRACTION * 100).toFixed(0)}% of baseline)`,
            ).toBeGreaterThanOrEqual(minAllowedSeconds);
          }

          // Full stack should still complete (research shouldn't break things)
          expect(
            researchSeconds,
            `Full stack caused "${goal.description}" to not complete`,
          ).not.toBeNull();
        }
      });
    });
  });
}
