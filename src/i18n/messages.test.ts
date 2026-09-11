import { describe, expect, it } from 'vitest';
import { ar, en, translate } from './messages';

describe('language parity', () => {
  it('covers every interface and report key in Arabic', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
    expect(Object.values(ar).every((value) => value.trim().length > 0)).toBe(true);
  });
  it('uses explicit evidence-completeness language in both locales', () => {
    expect(translate('en')('confidenceHelp')).toContain('not the probability');
    expect(translate('ar')('confidenceHelp')).toContain('ولا تمثل احتمال');
  });
});
