import { PrestigeUpgrade, TierType } from '../types/game';

export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  // Village prestige currency → Income bonuses
  {
    id: 'prestige_growth_1',
    name: 'Crown of Growth I',
    description: '+15% income to all settlements',
    cost: 1,
    tier: TierType.Village,
    effect: { type: 'prestige_income_multiplier', value: 0.15 },
    purchased: false,
  },
  {
    id: 'prestige_growth_2',
    name: 'Crown of Growth II',
    description: '+25% income to all settlements',
    cost: 3,
    tier: TierType.Village,
    effect: { type: 'prestige_income_multiplier', value: 0.25 },
    purchased: false,
    prerequisite: 'prestige_growth_1',
  },
  {
    id: 'prestige_growth_3',
    name: 'Crown of Growth III',
    description: '+40% income to all settlements',
    cost: 7,
    tier: TierType.Village,
    effect: { type: 'prestige_income_multiplier', value: 0.4 },
    purchased: false,
    prerequisite: 'prestige_growth_2',
  },

  // Town prestige currency → Cost reduction
  {
    id: 'prestige_industry_1',
    name: 'Crown of Industry I',
    description: '-10% all building costs',
    cost: 1,
    tier: TierType.Town,
    effect: { type: 'prestige_cost_reduction', value: 0.9 },
    purchased: false,
  },
  {
    id: 'prestige_industry_2',
    name: 'Crown of Industry II',
    description: '-15% all building costs',
    cost: 3,
    tier: TierType.Town,
    effect: { type: 'prestige_cost_reduction', value: 0.85 },
    purchased: false,
    prerequisite: 'prestige_industry_1',
  },
  {
    id: 'prestige_industry_3',
    name: 'Crown of Industry III',
    description: '-25% all building costs',
    cost: 7,
    tier: TierType.Town,
    effect: { type: 'prestige_cost_reduction', value: 0.75 },
    purchased: false,
    prerequisite: 'prestige_industry_2',
  },

  // City prestige currency → Research bonus
  {
    id: 'prestige_knowledge_1',
    name: 'Crown of Knowledge I',
    description: '+5 research points per settlement completion',
    cost: 1,
    tier: TierType.City,
    effect: { type: 'prestige_research_bonus', value: 5 },
    purchased: false,
  },
  {
    id: 'prestige_knowledge_2',
    name: 'Crown of Knowledge II',
    description: '+10 research points per settlement completion',
    cost: 3,
    tier: TierType.City,
    effect: { type: 'prestige_research_bonus', value: 10 },
    purchased: false,
    prerequisite: 'prestige_knowledge_1',
  },
  {
    id: 'prestige_knowledge_3',
    name: 'Crown of Knowledge III',
    description: '+20 research points per settlement completion',
    cost: 7,
    tier: TierType.City,
    effect: { type: 'prestige_research_bonus', value: 20 },
    purchased: false,
    prerequisite: 'prestige_knowledge_2',
  },

  // County prestige currency → Goal reduction
  {
    id: 'prestige_ambition_1',
    name: 'Crown of Ambition I',
    description: '-10% goal targets',
    cost: 1,
    tier: TierType.County,
    effect: { type: 'prestige_goal_reduction', value: 0.1 },
    purchased: false,
  },
  {
    id: 'prestige_ambition_2',
    name: 'Crown of Ambition II',
    description: '-15% goal targets',
    cost: 3,
    tier: TierType.County,
    effect: { type: 'prestige_goal_reduction', value: 0.15 },
    purchased: false,
    prerequisite: 'prestige_ambition_1',
  },
  {
    id: 'prestige_ambition_3',
    name: 'Crown of Ambition III',
    description: '-20% goal targets',
    cost: 7,
    tier: TierType.County,
    effect: { type: 'prestige_goal_reduction', value: 0.2 },
    purchased: false,
    prerequisite: 'prestige_ambition_2',
  },

  // Duchy prestige currency → Starting currency multiplier
  {
    id: 'prestige_wealth_1',
    name: 'Crown of Wealth I',
    description: '2x starting currency for all settlements',
    cost: 1,
    tier: TierType.Duchy,
    effect: { type: 'prestige_starting_currency', value: 2 },
    purchased: false,
  },
  {
    id: 'prestige_wealth_2',
    name: 'Crown of Wealth II',
    description: '3x starting currency for all settlements',
    cost: 3,
    tier: TierType.Duchy,
    effect: { type: 'prestige_starting_currency', value: 3 },
    purchased: false,
    prerequisite: 'prestige_wealth_1',
  },
  {
    id: 'prestige_wealth_3',
    name: 'Crown of Wealth III',
    description: '5x starting currency for all settlements',
    cost: 7,
    tier: TierType.Duchy,
    effect: { type: 'prestige_starting_currency', value: 5 },
    purchased: false,
    prerequisite: 'prestige_wealth_2',
  },

  // Realm prestige currency → Auto-build speed
  {
    id: 'prestige_power_1',
    name: 'Crown of Power I',
    description: '+15% auto-build speed',
    cost: 1,
    tier: TierType.Realm,
    effect: { type: 'prestige_autobuild_speed', value: 0.15 },
    purchased: false,
  },
  {
    id: 'prestige_power_2',
    name: 'Crown of Power II',
    description: '+25% auto-build speed',
    cost: 3,
    tier: TierType.Realm,
    effect: { type: 'prestige_autobuild_speed', value: 0.25 },
    purchased: false,
    prerequisite: 'prestige_power_1',
  },

  // Kingdom prestige currency → Massive income multiplier
  {
    id: 'prestige_destiny_1',
    name: 'Crown of Destiny I',
    description: '+100% income to all settlements',
    cost: 1,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_income_multiplier', value: 1.0 },
    purchased: false,
  },
  {
    id: 'prestige_destiny_2',
    name: 'Crown of Destiny II',
    description: '+200% income to all settlements',
    cost: 2,
    tier: TierType.Kingdom,
    effect: { type: 'prestige_income_multiplier', value: 2.0 },
    purchased: false,
    prerequisite: 'prestige_destiny_1',
  },
];

/**
 * Calculate prestige currency earned for a tier based on completions.
 * Formula: floor(sqrt(completions))
 */
export function calculatePrestigeCurrency(completions: number): number {
  if (completions <= 0) return 0;
  return Math.floor(Math.sqrt(completions));
}
