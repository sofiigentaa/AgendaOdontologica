import { Contact } from '../types';

export function generateVCard(contact: Contact): string {
  const nameParts = contact.fullName.trim().split(' ');
  const lastName = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${contact.fullName}`,
  ];

  if (contact.primaryPhone) {
    lines.push(`TEL;TYPE=CELL,VOICE:${contact.primaryPhone}`);
  }

  if (contact.altPhone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${contact.altPhone}`);
  }

  if (contact.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${contact.email}`);
  }

  if (contact.address) {
    lines.push(`ADR;TYPE=HOME:;;${contact.address};;;;`);
  }

  if (!contact.isParticular && contact.insuranceName) {
    const insuranceInfo = contact.affiliateNumber
      ? `${contact.insuranceName} (Afiliado N°: ${contact.affiliateNumber})`
      : contact.insuranceName;
    lines.push(`ORG:${insuranceInfo}`);
  }

  if (contact.observations) {
    lines.push(`NOTE:${contact.observations.replace(/\n/g, ' ')}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function downloadVCard(contact: Contact) {
  const vcardData = generateVCard(contact);
  const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const filename = `${contact.fullName.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatContactAsText(contact: Contact): string {
  let text = `👤 ${contact.fullName}\n`;
  if (contact.primaryPhone) text += `📞 Teléfono: ${contact.primaryPhone}\n`;
  if (contact.altPhone) text += `📞 Tel. Alt: ${contact.altPhone}\n`;
  if (contact.email) text += `✉️ Email: ${contact.email}\n`;
  if (!contact.isParticular && contact.insuranceName) {
    text += `🏥 Obra Social: ${contact.insuranceName}`;
    if (contact.affiliateNumber) text += ` (N° Afiliado: ${contact.affiliateNumber})`;
    text += '\n';
  } else if (contact.isParticular) {
    text += `🏥 Cobertura: Particular\n`;
  }
  if (contact.address) text += `📍 Dirección: ${contact.address}\n`;
  if (contact.observations) text += `📝 Obs: ${contact.observations}\n`;
  return text;
}

export async function shareContact(contact: Contact): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'whatsapp' }> {
  const formattedText = formatContactAsText(contact);
  
  // 1. Try Web Share API if supported and allowed in current frame
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Contacto: ${contact.fullName}`,
        text: formattedText,
      });
      return { success: true, method: 'native' };
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        return { success: false, method: 'native' };
      }
      console.warn('Web Share API not allowed or failed, using fallback:', err);
    }
  }

  // 2. Try modern navigator.clipboard
  let copied = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(formattedText);
      copied = true;
    } catch (err) {
      console.warn('navigator.clipboard failed:', err);
    }
  }

  // 3. Fallback execCommand('copy') via textarea
  if (!copied) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = formattedText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      copied = document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.warn('execCommand copy failed:', err);
    }
  }

  if (copied) {
    return { success: true, method: 'clipboard' };
  }

  // 4. Final fallback: open WhatsApp share with encoded text
  try {
    const encoded = encodeURIComponent(formattedText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    return { success: true, method: 'whatsapp' };
  } catch (err) {
    console.error('WhatsApp share fallback failed:', err);
  }

  return { success: false, method: 'clipboard' };
}
