import { describe, it, expect } from 'vitest';
import { formatNumber, formatIncome } from './format';

describe('Format utilities', () => {
  describe('formatNumber', () => {
    it('should format small numbers as integers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(42)).toBe('42');
      expect(formatNumber(999)).toBe('999');
      expect(formatNumber(999.9)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.00K');
      expect(formatNumber(1500)).toBe('1.50K');
      expect(formatNumber(12000)).toBe('12.0K');
      expect(formatNumber(123000)).toBe('123K');
    });

    it('should format millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.00M');
      expect(formatNumber(1500000)).toBe('1.50M');
      expect(formatNumber(12000000)).toBe('12.0M');
      expect(formatNumber(123000000)).toBe('123M');
    });

    it('should format billions with B suffix', () => {
      expect(formatNumber(1000000000)).toBe('1.00B');
      expect(formatNumber(1500000000)).toBe('1.50B');
    });

    it('should handle very large numbers', () => {
      const trillion = 1000000000000;
      expect(formatNumber(trillion)).toBe('1.00T');
    });

    it('should handle edge cases', () => {
      expect(formatNumber(0.5)).toBe('0');
      expect(formatNumber(999.99)).toBe('999');
      expect(formatNumber(1000.1)).toBe('1.00K');
    });
  });

  describe('formatIncome', () => {
    it('should add /s suffix to formatted numbers', () => {
      expect(formatIncome(0)).toBe('0/s');
      expect(formatIncome(42)).toBe('42/s');
      expect(formatIncome(1500)).toBe('1.50K/s');
      expect(formatIncome(1000000)).toBe('1.00M/s');
    });
  });
});
