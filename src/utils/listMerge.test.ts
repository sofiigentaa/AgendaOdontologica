import { describe, expect, it } from 'vitest';
import { Contact } from '../types';
import {
  isSameContactRecord,
  mergeByIdPreservingOrder,
  pickIfUnchanged,
} from './listMerge';

function contact(overrides: Partial<Contact> & { id: string }): Contact {
  return {
    fullName: 'Paciente',
    isParticular: true,
    primaryPhone: '1',
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('mergeByIdPreservingOrder', () => {
  it('keeps the previous visual order when the server returns a different order', () => {
    const prev = [
      { id: 'a', name: 'Ana' },
      { id: 'b', name: 'Bruno' },
      { id: 'c', name: 'Carla' },
    ];
    const fresh = [
      { id: 'c', name: 'Carla' },
      { id: 'a', name: 'Ana actualizada' },
      { id: 'b', name: 'Bruno' },
    ];

    expect(mergeByIdPreservingOrder(fresh, prev).map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(mergeByIdPreservingOrder(fresh, prev)[0].name).toBe('Ana actualizada');
  });

  it('places brand-new records first without moving existing cards', () => {
    const prev = [
      { id: 'a', name: 'Ana' },
      { id: 'b', name: 'Bruno' },
    ];
    const fresh = [
      { id: 'b', name: 'Bruno' },
      { id: 'z', name: 'Zoe' },
      { id: 'a', name: 'Ana' },
    ];

    expect(mergeByIdPreservingOrder(fresh, prev).map((x) => x.id)).toEqual(['z', 'a', 'b']);
  });

  it('returns the fresh list when there is nothing on screen yet', () => {
    const fresh = [
      { id: 'b', name: 'Bruno' },
      { id: 'a', name: 'Ana' },
    ];
    expect(mergeByIdPreservingOrder(fresh, []).map((x) => x.id)).toEqual(['b', 'a']);
  });
});

describe('pickIfUnchanged', () => {
  it('returns the previous array reference when records did not change', () => {
    const prev = [contact({ id: 'a', fullName: 'Ana' })];
    const next = [contact({ id: 'a', fullName: 'Ana' })];
    expect(pickIfUnchanged(prev, next, isSameContactRecord)).toBe(prev);
  });

  it('returns the next array when a visible field changed', () => {
    const prev = [contact({ id: 'a', fullName: 'Ana' })];
    const next = [contact({ id: 'a', fullName: 'Ana Perez' })];
    expect(pickIfUnchanged(prev, next, isSameContactRecord)).toBe(next);
  });
});
