import { describe, expect, it } from 'vitest';
import { parseNumber, massToForce, formatNumber } from './numbers';

describe('numeric input and units', () => {
  it.each([
    ['123.4', 123.4],
    ['١٢٣٫٤', 123.4],
    ['۱۲۳٫۴', 123.4],
    ['1,234.5', 1234.5],
    ['١٬٢٣٤٫٥', 1234.5],
    ['0', 0],
    ['-2.5', -2.5],
  ])('parses %s without changing its value', (input, output) => {
    expect(parseNumber(String(input))).toBe(output);
  });
  it.each(['1,2', '1.234,5', '1,234,56', 'NaN', 'Infinity', '1e309', '20 kg', '.', '--3', '1..2'])(
    'rejects ambiguous/invalid %s',
    (input) => {
      expect(parseNumber(input)).toBe('invalid');
    },
  );
  it('keeps an empty input unknown rather than zero', () => {
    expect(parseNumber(' ')).toBeNull();
  });
  it('converts mass to force using standard gravity', () => {
    expect(massToForce(1000)).toBe(9.80665);
  });
  it('keeps display locale separate from stored values', () => {
    expect(formatNumber(null, 'ar')).toBe('—');
    expect(formatNumber(12.3, 'en')).toBe('12.3');
    expect(formatNumber(0.0001, 'en', 6)).toBe('0.0001');
  });
});
