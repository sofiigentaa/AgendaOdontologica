export const isValidPersonName = (value: string): boolean =>
  /^[\p{L}\p{M}][\p{L}\p{M} .'\u2019-]*$/u.test(value.trim());

export const isValidPhoneNumber = (value: string): boolean =>
  /^\+?[0-9\s().-]+$/.test(value.trim()) && (value.match(/\d/g)?.length ?? 0) >= 6;

export const isValidEmailAddress = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
