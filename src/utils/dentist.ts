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

/**
 * Strict version for data coming from outside (API): returns null when the
 * value does not name a known dentist, instead of defaulting to Yani.
 */
export function parseDentist(dentist?: string | null): 'Yani' | 'Marie' | 'Ambas' | null {
  const raw = String(dentist || '').trim().toLowerCase();
  if (!raw) return null;
  if (!/(ambas|las dos|marie|yani)/.test(raw)) return null;
  return normalizeDentist(raw);
}

/** Exclusive chips: Yani is only Yani, Marie only Marie, Ambas only joint turns. */
export function matchesDentistFilter(
  dentist: string | null | undefined,
  filter: DentistFilter
): boolean {
  if (filter === 'all') return true;
  return normalizeDentist(dentist) === filter;
}
