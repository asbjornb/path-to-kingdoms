// @vitest-environment node
import { TierType } from '../types/game';
import { defineSimulationTests } from './balance-simulation-helpers';

defineSimulationTests(TierType.Town);
