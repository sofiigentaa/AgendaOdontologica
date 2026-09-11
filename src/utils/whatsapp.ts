/**
 * Formats a raw phone string for WhatsApp wa.me link.
 * Removes spaces, dashes, parentheses, non-digit chars (except leading +).
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  // Remove non-numeric except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

export function createWhatsAppLink(phone: string, defaultMessage?: string): string {
  const cleanNumber = formatPhoneForWhatsApp(phone);
  if (!cleanNumber) return '#';
  const encodedMsg = defaultMessage ? encodeURIComponent(defaultMessage) : '';
  return `https://wa.me/${cleanNumber}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
}

export function openWhatsApp(phone: string, defaultMessage?: string): boolean {
  const url = createWhatsAppLink(phone, defaultMessage);
  if (url === '#') return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
