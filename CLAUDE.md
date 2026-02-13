# CLAUDE.md

## Project Overview

Path to Kingdoms is a browser-based idle/incremental game built with TypeScript and Vite. Players progress through 8 civilization tiers (Hamlet → Kingdom) by purchasing buildings, completing goals, and unlocking research and prestige upgrades. No production dependencies — pure vanilla TypeScript.

## Commands

| Command             | Purpose                             |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start Vite dev server               |
| `npm run build`     | TypeScript check + production build |
| `npm test`          | Run Vitest in watch mode            |
| `npm run test:run`  | Run Vitest once (CI mode)           |
| `npm run lint`      | Run ESLint                          |
| `npm run format`    | Run Prettier                        |
| `npm run typecheck` | TypeScript type checking only       |

## Architecture

```
src/
├── data/          # Game balance data: tiers, buildings, research, prestige, achievements, goals
├── game/          # Core game logic — GameState.ts is the main state manager
├── types/         # TypeScript interfaces and type definitions
├── ui/            # DOM-based UI rendering
├── utils/         # Helpers (number formatting)
├── styles/        # CSS
└── main.ts        # Entry point: initializes game, UI, and 100ms update loop
```

## Key File Paths

### Game Data (`src/data/`)

| File                       | Contents                                                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/tiers.ts`        | Building definitions per tier — IDs, names, base cost/income, cost multipliers, and building effects (income_multiplier, cost_reduction, completion_bonus, etc.)        |
| `src/data/research.ts`     | Research upgrades — cost reduction, starting income, auto-building, tier requirement reduction. Includes repeatable research generation                                 |
| `src/data/prestige.ts`     | Prestige upgrades — 100+ upgrades per tier with prerequisites/chains. Effects: income multipliers, cost reduction, parallel slots, free buildings, mastery boosts, etc. |
| `src/data/achievements.ts` | Achievement definitions — tier completions, speed runs, building counts, currency thresholds, hidden/easter-egg achievements                                            |
| `src/data/goals.ts`        | `GoalGenerator` class — procedurally creates settlement goals (ReachIncome, AccumulateCurrency, CurrentCurrency, BuildingCount, Survival) scaled by tier                |

### Core Logic & Types

| File                    | Contents                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/game/GameState.ts` | Main state manager (~1600 lines) — settlements, income calculation, goal tracking, research/prestige/achievement processing, auto-building, save/load, mastery, patronage            |
| `src/types/game.ts`     | All core interfaces (`Building`, `Settlement`, `ResearchUpgrade`, `PrestigeUpgrade`, `Achievement`, `Goal`, `GameState`, `SaveData`) and enums (`TierType`, `GoalType`, `BuyAmount`) |
| `src/types/global.d.ts` | Global `window` function type declarations for UI interactions                                                                                                                       |

### UI & Utilities

| File                  | Contents                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/UI.ts`        | DOM-based UI rendering — tier tabs, settlement cards, building buttons, research/prestige shops, achievement modal, notifications |
| `src/utils/format.ts` | `formatNumber()` (large number suffixes: K, M, B, T, …) and `formatIncome()`                                                      |
| `src/styles/game.css` | All game styling                                                                                                                  |
| `src/main.ts`         | Entry point — creates GameStateManager + UI, wires up window functions, starts 100ms update loop                                  |

## Code Style & Conventions

- **Strict TypeScript**: strict mode enabled, no `any`, explicit return types required
- **Linting**: ESLint with `@typescript-eslint/strict` — no unused vars, no non-null assertions, strict boolean expressions
- **Formatting**: Prettier with single quotes, semicolons, trailing commas, 100 char print width
- **Pre-commit**: Husky + lint-staged runs ESLint fix and Prettier on staged `.ts`/`.tsx` files
- **No `console.log`**: only `console.warn` and `console.error` are allowed in production code
- **Path alias**: `@/*` maps to `src/*`
- **Tests**: co-located with source files as `*.test.ts`, using Vitest with jsdom environment

## Testing

Tests cover game mechanics, data consistency, balance simulation, UI rendering, and utilities. Run `npm run test:run` for a single pass. Test files are allowed relaxed lint rules (`any`, non-null assertions, console).

To check only balance simulation failures (much faster than running the full suite):

```bash
npx vitest run balance-sim --reporter=verbose
```

## Deployment

GitHub Pages via GitHub Actions. Builds on push to `main`. Base path is `/path-to-kingdoms/`.
