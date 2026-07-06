import { describe, it, expect } from 'vitest';
import formatDateToDDMMYYYY from './formatter.js';

describe('formatDateToDDMMYYYY', () => {
  it('should format a Date object correctly', () => {
    const date = new Date(2023, 10, 5); // Month is 0-indexed, so 10 is Nov
    expect(formatDateToDDMMYYYY(date)).toBe('05/11/2023');
  });

  it('should format a date string correctly', () => {
    expect(formatDateToDDMMYYYY('2024-02-15T00:00:00Z')).toBe('15/02/2024');
  });

  it('should handle single-digit days and months', () => {
    const date = new Date(2024, 0, 9); // Jan 9
    expect(formatDateToDDMMYYYY(date)).toBe('09/01/2024');
  });

  it('should handle timestamp numbers', () => {
    const timestamp = new Date('2023-12-25').getTime();
    expect(formatDateToDDMMYYYY(timestamp)).toBe('25/12/2023');
  });
});
