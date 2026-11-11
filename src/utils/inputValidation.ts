export const MAX_NAME_LENGTH = 100;
export const MAX_PHONE_LENGTH = 25;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_SHORT_TEXT_LENGTH = 150;
export const MAX_LONG_TEXT_LENGTH = 2000;
export const MIN_PHONE_DIGITS = 8;
export const MAX_PHONE_DIGITS = 15;

export const isValidPersonName = (value: string): boolean => {
  const trimmed = (value || '').trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= MAX_NAME_LENGTH &&
    /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u.test(trimmed)
  );
};

/**
 * Phone: optional leading "+", digits and single separators (space, dot, dash,
 * parentheses). Between 8 and 15 digits (E.164). Rejects runs of symbols such
 * as "(((1)))2.3-4 5 6".
 */
export const isValidPhoneNumber = (value: string): boolean => {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed.length > MAX_PHONE_LENGTH) return false;
  if (!/^\+?[0-9\s().-]+$/.test(trimmed)) return false;
  if (/[\s().-]{2,}/.test(trimmed.replace(/\) /g, ')').replace(/ \(/g, '('))) return false;
  const digits = trimmed.match(/\d/g)?.length ?? 0;
  return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
};

export const isValidEmailAddress = (value: string): boolean => {
  const trimmed = (value || '').trim();
  return trimmed.length <= MAX_EMAIL_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

/** Lowercase + strip accents, for searches and duplicate detection. */
export const normalizeForSearch = (value: string | null | undefined): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Digits only, without the Argentine "+54 9" / leading 0 / "15" noise (best effort). */
export const normalizePhoneForCompare = (value: string | null | undefined): string => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('549')) digits = digits.slice(3);
  else if (digits.startsWith('54')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
};
