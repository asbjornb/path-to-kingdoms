// @vitest-environment node
import { TierType } from '../types/game';
import { defineResearchSimulationTests } from './research-balance-sim-helpers';

defineResearchSimulationTests(TierType.Kingdom);
