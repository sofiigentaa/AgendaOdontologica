import { describe, expect, it } from 'vitest';
import { isValidEmailAddress, isValidPersonName, isValidPhoneNumber } from './inputValidation';

describe('input validation', () => {
  it('accepts names with accents and common name punctuation but rejects numbers', () => {
    expect(isValidPersonName('María José O’Connor')).toBe(true);
    expect(isValidPersonName("Dr. Martín González")).toBe(true);
    expect(isValidPersonName('María 2')).toBe(false);
    expect(isValidPersonName('')).toBe(false);
  });

  it('accepts formatted phone numbers with at least six digits', () => {
    expect(isValidPhoneNumber('+54 (11) 4589-2020')).toBe(true);
    expect(isValidPhoneNumber('abc123456')).toBe(false);
    expect(isValidPhoneNumber('123-')).toBe(false);
  });

  it('accepts common email addresses and rejects malformed values', () => {
    expect(isValidEmailAddress('persona@correo.com')).toBe(true);
    expect(isValidEmailAddress('persona-correo.com')).toBe(false);
    expect(isValidEmailAddress('persona @correo.com')).toBe(false);
  });
});
