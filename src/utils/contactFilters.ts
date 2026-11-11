import { CallReminder, Contact, ContactNote, FilterType } from '../types';
import { normalizeForSearch } from './inputValidation';

/** Accent- and case-insensitive "contains" ("maria" finds "María"). */
const textMatches = (value: string | null | undefined, normalizedQuery: string): boolean =>
  Boolean(value) && normalizeForSearch(value).includes(normalizedQuery);

export function matchesContactSearch(contact: Contact, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  const query = normalizeForSearch(searchTerm);
  const nameMatch = textMatches(contact.fullName, query);
  const phoneMatch = textMatches(contact.primaryPhone, query) || textMatches(contact.altPhone, query);
  const emailMatch = textMatches(contact.email, query);
  const insuranceMatch = textMatches(contact.insuranceName, query);
  const affiliateMatch = textMatches(contact.affiliateNumber, query);
  const obsMatch = textMatches(contact.observations, query);
  return nameMatch || phoneMatch || emailMatch || insuranceMatch || affiliateMatch || obsMatch;
}

export function filterContacts(options: {
  contacts: Contact[];
  searchTerm?: string;
  selectedFilter?: FilterType;
  selectedInsurance?: string;
  reminders?: CallReminder[];
  notes?: ContactNote[];
}): Contact[] {
  const {
    contacts,
    searchTerm = '',
    selectedFilter = 'all',
    selectedInsurance = '',
    reminders = [],
    notes = [],
  } = options;

  return contacts.filter((contact) => {
    if (!matchesContactSearch(contact, searchTerm)) return false;
    if (selectedFilter === 'favorites' && !contact.isFavorite) return false;
    if (selectedFilter === 'particular' && !contact.isParticular) return false;
    if (selectedFilter === 'reminders') {
      const hasActiveRem = reminders.some((r) => r.contactId === contact.id && !r.completed);
      if (!hasActiveRem) return false;
    }
    if (selectedFilter === 'notes') {
      const hasNotes = notes.some((n) => n.contactId === contact.id);
      if (!hasNotes) return false;
    }
    if (selectedInsurance && contact.insuranceName !== selectedInsurance) return false;
    return true;
  });
}

export function filterPatientsForAutocomplete(contacts: Contact[], query: string): Contact[] {
  const sorted = [...contacts].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, 'es', { sensitivity: 'base' })
  );
  const q = normalizeForSearch(query);
  if (!q) return sorted;
  return sorted.filter((c) => {
    const nameMatch = textMatches(c.fullName, q);
    const phoneMatch = textMatches(c.primaryPhone, q);
    const insuranceMatch = textMatches(c.insuranceName, q);
    const affiliateMatch = textMatches(c.affiliateNumber, q);
    const particularMatch = c.isParticular && 'particular'.includes(q);
    return nameMatch || phoneMatch || insuranceMatch || affiliateMatch || particularMatch;
  });
}
