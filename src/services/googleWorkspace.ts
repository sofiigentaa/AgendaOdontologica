/**
 * Google Workspace APIs service (Google Calendar & Gmail)
 */

export interface CalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO 8601 string: YYYY-MM-DDTHH:mm:ss
  endDateTime: string;   // ISO 8601 string: YYYY-MM-DDTHH:mm:ss
  timeZone?: string;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  patientName: string;
  dentistName: string;
  dateStr: string;
  timeStr: string;
  durationMinutes: number;
  motive: string;
  clinicAddress?: string;
}

/**
 * Creates an event in Google Calendar (primary calendar)
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: CalendarEventPayload
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  try {
    const timeZone = event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Argentina/Buenos_Aires';

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          location: event.location || 'Consultorio Odontológico Marie - Yani',
          start: {
            dateTime: event.startDateTime,
            timeZone,
          },
          end: {
            dateTime: event.endDateTime,
            timeZone,
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'email', minutes: 1440 }, // 1 day before
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      eventId: data.id,
      htmlLink: data.htmlLink,
    };
  } catch (error: any) {
    console.error('Error creating Google Calendar event:', error);
    return {
      success: false,
      error: error.message || 'No se pudo sincronizar el turno con Google Calendar',
    };
  }
}

/**
 * Helper to encode UTF-8 string to base64url for Gmail API
 */
function utf8ToBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email notification using the Gmail API
 */
export async function sendGmailAppointmentConfirmation(
  accessToken: string,
  payload: SendEmailPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const {
      to,
      subject,
      patientName,
      dentistName,
      dateStr,
      timeStr,
      durationMinutes,
      motive,
      clinicAddress = 'Consultorio Odontológico Marie & Yani',
    } = payload;

    const emailBody = `Hola ${patientName},

Te confirmamos tu turno odontológico:

📅 Fecha: ${dateStr}
⏰ Horario: ${timeStr} hs (${durationMinutes} min)
👩‍⚕️ Profesional: Dra. ${dentistName}
🦷 Motivo: ${motive}
📍 Lugar: ${clinicAddress}

Si necesitas reprogramar o cancelar tu turno, por favor avísanos con anticipación.

¡Te esperamos!
Consultorio Odontológico Marie & Yani`;

    // Construct standard RFC 2822 email message with UTF-8 encoding
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      emailBody,
    ];

    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = utf8ToBase64Url(rawMessage);

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedMessage,
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Error en Gmail API: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error: any) {
    console.error('Error sending Gmail message:', error);
    return {
      success: false,
      error: error.message || 'No se pudo enviar el correo de confirmación por Gmail',
    };
  }
}
