import { describe, expect, it } from 'vitest';
import { CallReminder, Contact, ContactNote } from '../types';
import { filterContacts, filterPatientsForAutocomplete } from './contactFilters';

function contact(overrides: Partial<Contact>): Contact {
  return {
    id: 'c1',
    fullName: 'Ana Perez',
    isParticular: true,
    insuranceName: 'Particular',
    primaryPhone: '3415551111',
    email: 'ana@example.com',
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const contacts: Contact[] = [
  contact({ id: 'fav', fullName: 'Ana Perez', isFavorite: true }),
  contact({
    id: 'osde',
    fullName: 'Bruno Lopez',
    isParticular: false,
    insuranceName: 'OSDE',
    affiliateNumber: '1234',
    primaryPhone: '3415552222',
  }),
];

describe('filterContacts', () => {
  it('searches by name, phone, insurance and affiliate number', () => {
    expect(filterContacts({ contacts, searchTerm: 'bruno' }).map((c) => c.id)).toEqual(['osde']);
    expect(filterContacts({ contacts, searchTerm: '3415551111' }).map((c) => c.id)).toEqual(['fav']);
    expect(filterContacts({ contacts, searchTerm: 'osde' }).map((c) => c.id)).toEqual(['osde']);
    expect(filterContacts({ contacts, searchTerm: '1234' }).map((c) => c.id)).toEqual(['osde']);
  });

  it('applies favorites, particular and insurance chips', () => {
    expect(filterContacts({ contacts, selectedFilter: 'favorites' }).map((c) => c.id)).toEqual(['fav']);
    expect(filterContacts({ contacts, selectedFilter: 'particular' }).map((c) => c.id)).toEqual(['fav']);
    expect(filterContacts({ contacts, selectedInsurance: 'OSDE' }).map((c) => c.id)).toEqual(['osde']);
  });

  it('filters contacts with active reminders or notes', () => {
    const reminders: CallReminder[] = [
      {
        id: 'r1',
        contactId: 'osde',
        date: '2026-09-10',
        time: '09:00',
        completed: false,
        createdAt: '2026-09-01T00:00:00.000Z',
      },
    ];
    const notes: ContactNote[] = [
      { id: 'n1', contactId: 'fav', text: 'alergia', createdAt: '2026-09-01T00:00:00.000Z' },
    ];
    expect(filterContacts({ contacts, selectedFilter: 'reminders', reminders }).map((c) => c.id)).toEqual([
      'osde',
    ]);
    expect(filterContacts({ contacts, selectedFilter: 'notes', notes }).map((c) => c.id)).toEqual(['fav']);
  });
});

describe('filterPatientsForAutocomplete', () => {
  it('returns all contacts sorted when query is empty', () => {
    expect(filterPatientsForAutocomplete(contacts, '').map((c) => c.fullName)).toEqual([
      'Ana Perez',
      'Bruno Lopez',
    ]);
  });

  it('matches particular coverage by typing particular', () => {
    expect(filterPatientsForAutocomplete(contacts, 'particular').map((c) => c.id)).toEqual(['fav']);
  });
});
