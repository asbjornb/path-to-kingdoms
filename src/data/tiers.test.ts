import { describe, it, expect } from 'vitest';
import { TIER_DATA, getTierByType } from './tiers';
import { TierType } from '../types/game';

describe('Tier data', () => {
  describe('TIER_DATA', () => {
    it('should have 8 tiers', () => {
      expect(TIER_DATA).toHaveLength(8);
    });

    it('should have all expected tier types', () => {
      const tierTypes = TIER_DATA.map((t) => t.type);
      expect(tierTypes).toEqual([
        TierType.Hamlet,
        TierType.Village,
        TierType.Town,
        TierType.City,
        TierType.County,
        TierType.Duchy,
        TierType.Realm,
        TierType.Kingdom,
      ]);
    });

    it('should have valid building data for each tier', () => {
      TIER_DATA.forEach((tier) => {
        expect(tier.buildings.length).toBeGreaterThanOrEqual(3);
        expect(tier.buildings.length).toBeLessThanOrEqual(6);

        tier.buildings.forEach((building) => {
          expect(building.id).toBeTruthy();
          expect(building.name).toBeTruthy();
          expect(building.baseCost).toBeGreaterThan(0);
          expect(building.baseIncome).toBeGreaterThan(0);
          expect(building.costMultiplier).toBeGreaterThan(1);
        });
      });
    });

    it('should have increasing completion thresholds', () => {
      for (let i = 1; i < TIER_DATA.length; i++) {
        const current = TIER_DATA[i];
        const previous = TIER_DATA[i - 1];
        expect(current.completionThreshold).toBeGreaterThan(previous.completionThreshold);
      }
    });

    it('should have valid unlock requirements', () => {
      expect(TIER_DATA[0].unlockRequirement).toBe(0); // Hamlet unlocked by default

      for (let i = 1; i < TIER_DATA.length; i++) {
        const tier = TIER_DATA[i];
        expect(tier.unlockRequirement).toBeGreaterThan(0);
      }
    });
  });

  describe('getTierByType', () => {
    it('should return correct tier data', () => {
      const hamlet = getTierByType(TierType.Hamlet);
      expect(hamlet).toBeDefined();
      expect(hamlet?.name).toBe('Hamlet');
      expect(hamlet?.type).toBe(TierType.Hamlet);
    });

    it('should return undefined for invalid tier type', () => {
      const invalid = getTierByType('invalid' as TierType);
      expect(invalid).toBeUndefined();
    });
  });
});
