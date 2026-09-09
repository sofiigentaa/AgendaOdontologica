import { CallReminder, Contact, ContactNote, FilterType } from '../types';

export function matchesContactSearch(contact: Contact, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  const query = searchTerm.toLowerCase();
  const nameMatch = contact.fullName.toLowerCase().includes(query);
  const phoneMatch =
    contact.primaryPhone.includes(query) ||
    Boolean(contact.altPhone && contact.altPhone.includes(query));
  const emailMatch = contact.email ? contact.email.toLowerCase().includes(query) : false;
  const insuranceMatch = contact.insuranceName
    ? contact.insuranceName.toLowerCase().includes(query)
    : false;
  const affiliateMatch = contact.affiliateNumber
    ? contact.affiliateNumber.toLowerCase().includes(query)
    : false;
  const obsMatch = contact.observations ? contact.observations.toLowerCase().includes(query) : false;
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
  const q = query.trim().toLowerCase();
  if (!q) return sorted;
  return sorted.filter((c) => {
    const nameMatch = c.fullName.toLowerCase().includes(q);
    const phoneMatch = c.primaryPhone ? c.primaryPhone.toLowerCase().includes(q) : false;
    const insuranceMatch = c.insuranceName ? c.insuranceName.toLowerCase().includes(q) : false;
    const affiliateMatch = c.affiliateNumber ? c.affiliateNumber.toLowerCase().includes(q) : false;
    const particularMatch = c.isParticular && 'particular'.includes(q);
    return nameMatch || phoneMatch || insuranceMatch || affiliateMatch || particularMatch;
  });
}
