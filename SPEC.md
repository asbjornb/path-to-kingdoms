# Path to Kingdoms - Game Specification v1

## Implementation Status

### ✅ Completed

- **Development Environment**: TypeScript, Vite, ESLint, Prettier configured
- **Pre-commit Hooks**: Husky with lint-staged for automatic code quality checks
- **Data Models**: Core game types and interfaces defined
- **Tier Definitions**: All 8 tiers with building data implemented
- **Research System**: 5 research upgrades defined with parallel slots and cost reduction
- **CI/CD**: GitHub Actions workflow for automatic deployment to GitHub Pages
- **Game State Management**: Complete GameStateManager with proper state isolation
- **Game Mechanics**: Income calculation, building purchases, cost scaling implemented
- **Settlement System**: Per-settlement currency, random goals, completion logic
- **UI System**: Dynamic settlement display with real-time updates
- **Goal System**: 5 goal types (income, currency, building count, survival) with progress tracking
- **Dev Mode**: 1000x income multiplier for testing

### 🚧 In Progress

- UI polish and animations

### ⏳ Not Started

- Save/load functionality
- Advanced automation features
- Achievement system

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

- **Completion condition:** Settlement completes when random goal is achieved (income targets, currency accumulation, building counts, or survival time)
- **Unlocking next tier:** Requires 6 completions of the previous tier
- **Research Points:** 10 base points awarded on completion (plus building bonuses), used for parallel slots, cost reduction, and automation
- **Auto-spawning:** New settlements automatically spawn when parallel research is unlocked
- **Settlement Reset:** Completed settlements are replaced with fresh settlements with reset state

## 4. Automation

- **Autobuy**: Unlocked by research (available but not yet implemented)
- **Auto-spawning**: Settlements automatically spawn based on parallel research slots
- **Settlement Replacement**: Completed settlements automatically replaced with fresh ones
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

1. Start with 1 auto-spawned Hamlet → buy buildings to complete random goal
2. Earn research points → unlock parallel slots → get more simultaneous Hamlets
3. Complete 6 Hamlets → unlock Villages → repeat with next tier
4. Progress through all 8 tiers until the first Kingdom is built
5. Dev mode available for faster manual testing (1000x income)

## 8. MVP Scope ✅

- ✅ 8 tiers implemented
- ✅ 6 buildings per tier (Hamlet complete, others defined)
- ✅ Auto-spawning + random goal completion system
- ✅ Research system with parallel slots and cost reduction
- ✅ UI: tier tabs, settlement display, research panel, dev mode toggle
- ✅ Per-settlement currency and goal system
- ✅ Early game feel: hands-on → midgame: light automation via research

## 9. Stretch Goals (Future)

- ✅ Auto-spawn system (implemented via research)
- Autobuy implementation (research framework exists)
- Cross-tier resource generation (higher tiers generate lower tiers)
- Managers/automation upgrades
- Save/load functionality
- Achievements system
- Prestige/reset mechanics
- UI polish and animations
