/**
 * Shared validation for records written through the API.
 * Used by the server (authoritative) and by the client forms, so both sides
 * apply the same rules.
 */
import {
  isValidEmailAddress,
  isValidPersonName,
  isValidPhoneNumber,
  MAX_LONG_TEXT_LENGTH,
  MAX_NAME_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
} from './inputValidation';
import { isValidISODate } from './time';
import { crossesMidnight } from './appointmentConflicts';

export type ValidationResult = { ok: boolean; error?: string };

const ok: ValidationResult = { ok: true };
const fail = (error: string): ValidationResult => ({ ok: false, error });

const MAX_ID_LENGTH = 100;
export const VALID_DENTISTS = ['Yani', 'Marie', 'Ambas'] as const;
export const MIN_DURATION_MINUTES = 5;
export const MAX_DURATION_MINUTES = 8 * 60;
export const MAX_AMOUNT = 100_000_000;

export const FINANCE_AMOUNT_FIELDS = ['ingresos', 'descartables', 'estampillas', 'materiales', 'mecanicoDental'] as const;

function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= MAX_ID_LENGTH && /^[A-Za-z0-9_.:-]+$/.test(id);
}

function optionalText(value: unknown, max: number): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.length <= max);
}

export function isValidTime(value: unknown): boolean {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Amount: finite number, >= 0. Undefined/null means "not loaded". */
export function isValidAmount(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= MAX_AMOUNT;
}

export function isValidPercentage(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100;
}

export function validateFinanceFields(a: Record<string, unknown>): ValidationResult {
  for (const field of FINANCE_AMOUNT_FIELDS) {
    if (!isValidAmount(a[field])) return fail('Los montos deben ser números mayores o iguales a 0.');
  }
  if (!isValidPercentage(a.porcentajeHonorario)) {
    return fail('El porcentaje de honorario debe estar entre 0 y 100.');
  }
  return ok;
}

export function validateContactInput(c: any): ValidationResult {
  if (!c || typeof c !== 'object') return fail('Datos del paciente inválidos.');
  if (!isValidId(c.id)) return fail('Identificador de paciente inválido.');
  if (typeof c.fullName !== 'string' || !isValidPersonName(c.fullName)) {
    return fail(`El nombre es obligatorio, solo puede tener letras y hasta ${MAX_NAME_LENGTH} caracteres.`);
  }
  if (typeof c.primaryPhone !== 'string' || !isValidPhoneNumber(c.primaryPhone)) {
    return fail('El teléfono principal debe tener entre 8 y 15 dígitos.');
  }
  if (c.altPhone && (typeof c.altPhone !== 'string' || !isValidPhoneNumber(c.altPhone))) {
    return fail('El teléfono alternativo debe tener entre 8 y 15 dígitos.');
  }
  if (c.email && (typeof c.email !== 'string' || !isValidEmailAddress(c.email))) {
    return fail('El email no es válido.');
  }
  if (!optionalText(c.insuranceName, MAX_SHORT_TEXT_LENGTH) || !optionalText(c.affiliateNumber, MAX_SHORT_TEXT_LENGTH)) {
    return fail('Obra social o número de afiliado demasiado largo.');
  }
  if (!optionalText(c.address, MAX_SHORT_TEXT_LENGTH * 2) || !optionalText(c.observations, MAX_LONG_TEXT_LENGTH)) {
    return fail('Dirección u observaciones demasiado largas.');
  }
  if (!optionalText(c.avatarColor, 50)) return fail('Color inválido.');
  return ok;
}

export function validateAppointmentInput(a: any): ValidationResult {
  if (!a || typeof a !== 'object') return fail('Datos del turno inválidos.');
  if (!isValidId(a.id)) return fail('Identificador de turno inválido.');
  if (!isValidId(a.contactId)) return fail('El turno debe tener un paciente.');
  if (!isValidISODate(a.date)) return fail('La fecha del turno no existe.');
  if (!isValidTime(a.time)) return fail('La hora del turno es inválida.');
  if (a.durationMinutes !== undefined && a.durationMinutes !== null) {
    const d = Number(a.durationMinutes);
    if (!Number.isInteger(d) || d < MIN_DURATION_MINUTES || d > MAX_DURATION_MINUTES) {
      return fail(`La duración debe estar entre ${MIN_DURATION_MINUTES} y ${MAX_DURATION_MINUTES} minutos.`);
    }
  }
  if (crossesMidnight(a.time, a.durationMinutes)) {
    return fail('El turno no puede terminar después de la medianoche.');
  }
  if (!VALID_DENTISTS.includes(a.dentist)) {
    return fail('Elegí la odontóloga del turno (Yani, Marie o Ambas).');
  }
  if (!optionalText(a.motive, MAX_SHORT_TEXT_LENGTH * 2)) return fail('Motivo demasiado largo.');
  if (a.whatsappStatus != null && !['pending', 'confirmed', 'cancelled'].includes(a.whatsappStatus)) {
    return fail('Estado del turno inválido.');
  }
  return validateFinanceFields(a);
}

// ---------------------------------------------------------------------------
// Insurance folder files
// ---------------------------------------------------------------------------
export const MAX_INSURANCE_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/** Decoded size of a base64 data URL, or -1 if it is not one. */
export function dataUrlByteSize(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma < 0) return -1;
  const meta = dataUrl.slice(5, comma);
  const body = dataUrl.slice(comma + 1);
  if (!meta.endsWith(';base64')) return body.length;
  const padding = body.endsWith('==') ? 2 : body.endsWith('=') ? 1 : 0;
  return Math.floor((body.length * 3) / 4) - padding;
}

export function dataUrlMimeType(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma < 0) return '';
  return dataUrl.slice(5, comma).split(';')[0].toLowerCase();
}

export function validateInsuranceFileInput(f: any): ValidationResult {
  if (!f || typeof f !== 'object') return fail('Archivo inválido.');
  if (!isValidId(f.id)) return fail('Identificador de archivo inválido.');
  if (typeof f.fileType !== 'string' || !ALLOWED_FILE_TYPES.includes(f.fileType.toLowerCase())) {
    return fail('Tipo de archivo no permitido. Usá PDF, imágenes, Word, Excel o texto.');
  }
  if (!optionalText(f.title, MAX_SHORT_TEXT_LENGTH) || !optionalText(f.fileName, 255) || !optionalText(f.insuranceName, MAX_SHORT_TEXT_LENGTH)) {
    return fail('Nombre o título del archivo demasiado largo.');
  }
  if (!optionalText(f.notes, MAX_LONG_TEXT_LENGTH)) return fail('Notas demasiado largas.');
  if (typeof f.dataUrl !== 'string' || !f.dataUrl) return fail('El archivo está vacío.');
  const size = dataUrlByteSize(f.dataUrl);
  if (size < 0) return fail('Contenido de archivo inválido.');
  if (size > MAX_INSURANCE_FILE_BYTES) return fail('El archivo supera el máximo de 10 MB.');
  const declared = dataUrlMimeType(f.dataUrl);
  if (declared && declared !== f.fileType.toLowerCase()) return fail('El contenido no coincide con el tipo de archivo.');
  return ok;
}
