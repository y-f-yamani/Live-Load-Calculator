/** Unambiguous decimal parsing; display locale never changes internal units. */
export function parseNumber(input: string): number | null | 'invalid' {
  const normalized = input
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0))
    .replace(/٫/g, '.')
    .replace(/٬/g, ',');
  if (normalized === '') return null;
  if (!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(normalized)) return 'invalid';
  const value = Number(normalized.replace(/,/g, ''));
  return Number.isFinite(value) ? value : 'invalid';
}

export const massToForce = (mass: number) => (mass * 9.80665) / 1000;

export function formatNumber(value: number | null, locale: 'en' | 'ar', digits = 2): string {
  return value === null || !Number.isFinite(value)
    ? '—'
    : new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-GB', {
        maximumFractionDigits: digits,
      }).format(value);
}
