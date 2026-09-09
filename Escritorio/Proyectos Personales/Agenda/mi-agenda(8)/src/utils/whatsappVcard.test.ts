import { describe, expect, it } from 'vitest';
import { createWhatsAppLink, formatPhoneForWhatsApp } from './whatsapp';
import { formatContactAsText, generateVCard } from './vcard';
import { Contact } from '../types';

const contact: Contact = {
  id: 'c1',
  fullName: 'Lucia Gomez',
  isParticular: false,
  insuranceName: 'OSDE',
  affiliateNumber: '9988',
  primaryPhone: '+54 9 341 555-1234',
  altPhone: '3414440000',
  email: 'lucia@example.com',
  address: 'San Martin 100',
  observations: 'Alergia a la penicilina',
  isFavorite: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('WhatsApp helpers', () => {
  it('strips formatting and builds a wa.me link with encoded text', () => {
    expect(formatPhoneForWhatsApp('+54 9 341 555-1234')).toBe('5493415551234');
    expect(createWhatsAppLink('341-555-1234', 'Hola')).toBe(
      'https://wa.me/3415551234?text=Hola'
    );
    expect(createWhatsAppLink('')).toBe('#');
  });
});

describe('vCard and share text', () => {
  it('generates a vCard 3.0 with phone, email and insurance', () => {
    const vcard = generateVCard(contact);
    expect(vcard).toContain('BEGIN:VCARD');
    expect(vcard).toContain('FN:Lucia Gomez');
    expect(vcard).toContain('TEL;TYPE=CELL,VOICE:+54 9 341 555-1234');
    expect(vcard).toContain('EMAIL;TYPE=INTERNET:lucia@example.com');
    expect(vcard).toContain('ORG:OSDE (Afiliado N°: 9988)');
    expect(vcard).toContain('END:VCARD');
  });

  it('formats a human-readable share text', () => {
    const text = formatContactAsText(contact);
    expect(text).toContain('Lucia Gomez');
    expect(text).toContain('Obra Social: OSDE');
    expect(text).toContain('N° Afiliado: 9988');
  });
});
