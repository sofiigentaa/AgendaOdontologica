export type DentistFilter = 'all' | 'Yani' | 'Marie' | 'Ambas';

export function normalizeDentist(dentist?: string | null): 'Yani' | 'Marie' | 'Ambas' {
  const raw = String(dentist || '').trim().toLowerCase();
  if (
    raw.includes('ambas') ||
    raw.includes('las dos') ||
    raw.includes('marie y yani') ||
    raw.includes('yani y marie')
  ) {
    return 'Ambas';
  }
  if (raw.includes('marie')) return 'Marie';
  if (raw.includes('yani')) return 'Yani';
  return 'Yani';
}

/** Exclusive chips: Yani is only Yani, Marie only Marie, Ambas only joint turns. */
export function matchesDentistFilter(
  dentist: string | null | undefined,
  filter: DentistFilter
): boolean {
  if (filter === 'all') return true;
  return normalizeDentist(dentist) === filter;
}
