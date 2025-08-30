# Path to Kingdoms - Game Specification v1

## Implementation Status

### ✅ Completed

- **Development Environment**: TypeScript, Vite, ESLint, Prettier configured
- **Pre-commit Hooks**: Husky with lint-staged for automatic code quality checks
- **Data Models**: Core game types and interfaces defined
- **Tier Definitions**: All 8 tiers with building data implemented
- **Research System**: 5 research upgrades defined
- **CI/CD**: GitHub Actions workflow for automatic deployment to GitHub Pages

### 🚧 In Progress

- Game state management system
- Basic UI for settlements and buildings

### ⏳ Not Started

- Game mechanics (income calculation, building purchases)
- Settlement completion logic
- Research system implementation
- Save/load functionality
- UI polish and animations

---

## 1. Core Concept

An idle/incremental game where the player grows from a Hamlet to a Kingdom across 8 tiers.

**Core loop:** build → upgrade → complete settlements → unlock next tier.

**Development philosophy:**

- Keep code simple: most of the program is just data definitions for tiers, buildings, and progression rules.
- Guardrails-first development: robust linting, formatting, tests, and pre-commit hooks from day one.
- Deployment is lightweight: playable locally, on GitHub Pages initially, with Cloudflare as a later target.

## 2. Progression Tiers

Eight tiers (end of v1 is a completed Kingdom):

1. **Hamlet**
2. **Village**
3. **Town**
4. **City**
5. **County**
6. **Duchy**
7. **Realm**
8. **Kingdom**

Each tier includes:

- 3–4 buildings (flavorful but generic, e.g. Farm, Market, Cathedral)
- Completion threshold (income/sec target)
- Unlock rule: complete multiple of previous tier

## 3. Progression Rules

- **Completion condition:** Settlement completes when income target met
- **Unlocking next tier:** Requires some number of completions of the previous tier (e.g. 4 Villages to unlock a Town)
- **Research Points:** Awarded on completion, used for global QoL (autobuy cadence, bulk buy, cost scaling tweaks)
- No prestige, managers, or autospawn yet

## 4. Automation

- Autobuy only (unlocked by research)
- Player spawns all new settlements manually
- Keep idle play comfortable but not fully automated in v1

## 5. Development Guardrails

**Pre-commit hooks:**

- Run lint (ESLint or equivalent)
- Run formatter (Prettier or equivalent)
- Run test suite

**Tests:**

- Core mechanics (income scaling, completion rules, unlocks)
- Data validation (tiers and buildings consistent)

**Formatting:** consistent auto-format on save and commit

**Linting:** strict rules — prefer catching errors early over flexibility

> 💡 **Philosophy:** If the game grows, the data model should absorb most complexity. Rules/logic should remain thin, predictable, and tested.

## 6. Deployment

- **Phase 1:** Playable locally via dev server
- **Phase 2:** Deploy static build to GitHub Pages
- **Phase 3:** Migrate to Cloudflare Pages (for better performance + CDN)

## 7. Player Flow

1. Start with Hamlets → buy buildings to reach first completion
2. Unlock Villages → repeat loop
3. Progress through tiers until the first Kingdom is built
4. Research points smooth progression but no hard reset yet

## 8. MVP Scope

- 8 tiers
- 3–4 buildings per tier
- Manual spawning + completion
- Research system with ~5 upgrades
- UI: tabbed per tier, global research/stats/options tabs
- Early game feel: hands-on → midgame: light automation

## 9. Stretch Goals (Future)

- Autospawn (higher tiers generate lower tiers)
- Managers
- Better progression system (avoid "lowest tier bottleneck")
- Achievements
- Prestige/reset loop
