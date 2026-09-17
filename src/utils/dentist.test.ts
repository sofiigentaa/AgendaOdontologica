import { describe, expect, it } from 'vitest';
import { matchesDentistFilter, normalizeDentist } from './dentist';

describe('normalizeDentist', () => {
  it('maps casing, spaces and Dra. prefixes', () => {
    expect(normalizeDentist('yani')).toBe('Yani');
    expect(normalizeDentist(' Yani ')).toBe('Yani');
    expect(normalizeDentist('Dra. Yani')).toBe('Yani');
    expect(normalizeDentist('dra. marie')).toBe('Marie');
    expect(normalizeDentist('Ambas')).toBe('Ambas');
    expect(normalizeDentist('las dos juntas')).toBe('Ambas');
  });
});

describe('matchesDentistFilter', () => {
  it('shows only Yani when Yani is selected, not Marie or Ambas', () => {
    expect(matchesDentistFilter('Yani', 'Yani')).toBe(true);
    expect(matchesDentistFilter('Dra. Yani', 'Yani')).toBe(true);
    expect(matchesDentistFilter('Marie', 'Yani')).toBe(false);
    expect(matchesDentistFilter('Ambas', 'Yani')).toBe(false);
  });

  it('shows only Marie when Marie is selected', () => {
    expect(matchesDentistFilter('Marie', 'Marie')).toBe(true);
    expect(matchesDentistFilter('Yani', 'Marie')).toBe(false);
    expect(matchesDentistFilter('Ambas', 'Marie')).toBe(false);
  });

  it('shows only joint turns for Las dos juntas', () => {
    expect(matchesDentistFilter('Ambas', 'Ambas')).toBe(true);
    expect(matchesDentistFilter('Yani', 'Ambas')).toBe(false);
    expect(matchesDentistFilter('Marie', 'Ambas')).toBe(false);
  });
});
