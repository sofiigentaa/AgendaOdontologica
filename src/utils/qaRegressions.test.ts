/**
 * Regresiones de los bugs reportados por QA (planilla "Reportes y evidencias").
 */
import { describe, expect, it } from 'vitest';
import { Appointment, Contact } from '../types';
import { crossesMidnight, dentistsConflict, findConflictingAppointment } from './appointmentConflicts';
import { calculateTurnStats } from './finance';
import { filterPatientsForAutocomplete, matchesContactSearch } from './contactFilters';
import { isValidPhoneNumber, isValidPersonName } from './inputValidation';
import { isValidISODate, parseFlexibleDate } from './time';
import {
  validateAppointmentInput,
  validateContactInput,
  validateFinanceFields,
  validateInsuranceFileInput,
} from './recordValidation';
import { findDuplicateContacts } from '../components/ContactFormModal';

const appt = (o: Partial<Appointment>): Appointment => ({
  id: 'a1',
  contactId: 'c1',
  date: '2026-11-22',
  time: '10:00',
  durationMinutes: 30,
  completed: false,
  createdAt: '2026-11-01T00:00:00.000Z',
  ...o,
});

const contact = (o: Partial<Contact>): Contact => ({
  id: 'c1',
  fullName: 'María Gómez',
  isParticular: true,
  primaryPhone: '341 555-1234',
  isFavorite: false,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...o,
});

describe('BUG-005 finanzas', () => {
  it('rechaza montos negativos y porcentaje fuera de 0..100', () => {
    expect(validateFinanceFields({ ingresos: -7000 }).ok).toBe(false);
    expect(validateFinanceFields({ porcentajeHonorario: 150 }).ok).toBe(false);
    expect(validateFinanceFields({ descartables: -300 }).ok).toBe(false);
    expect(validateFinanceFields({ ingresos: 1000, porcentajeHonorario: 50 }).ok).toBe(true);
  });

  it('un egreso negativo guardado no aumenta la ganancia', () => {
    const stats = calculateTurnStats(appt({ ingresos: 1000, descartables: -5000, porcentajeHonorario: 100 }));
    expect(stats.totalEgresos).toBe(0);
    expect(stats.honorarioTotal).toBe(1000);
  });
});

describe('BUG-010 turnos sin odontóloga', () => {
  it('dos turnos sin odontóloga a la misma hora se superponen', () => {
    expect(dentistsConflict(undefined, undefined)).toBe(true);
    const clash = findConflictingAppointment([appt({ dentist: undefined })], {
      date: '2026-11-22',
      time: '10:00',
    });
    expect(clash?.id).toBe('a1');
  });
});

describe('BUG-004 editar turno controla superposición', () => {
  it('detecta choque con otro turno pero ignora el propio', () => {
    const list = [appt({ id: 'yani', dentist: 'Yani' }), appt({ id: 'marie', dentist: 'Marie' })];
    expect(findConflictingAppointment(list, { id: 'yani', date: '2026-11-22', time: '10:00', dentist: 'Marie' })?.id).toBe('marie');
    expect(findConflictingAppointment(list, { id: 'yani', date: '2026-11-22', time: '10:00', dentist: 'Yani' })).toBeUndefined();
  });
});

describe('BUG-029 fechas imposibles y medianoche', () => {
  it('rechaza 31/02, 30/02 y 31/04', () => {
    expect(parseFlexibleDate('31/02/2026')).toBeNull();
    expect(parseFlexibleDate('2026-02-30')).toBeNull();
    expect(parseFlexibleDate('31/4', 2026)).toBeNull();
    expect(parseFlexibleDate('29/02/2028')).toBe('2028-02-29');
    expect(isValidISODate('2026-02-31')).toBe(false);
    expect(isValidISODate('2026-11-30')).toBe(true);
  });

  it('detecta turnos que cruzan la medianoche', () => {
    expect(crossesMidnight('23:30', 60)).toBe(true);
    expect(crossesMidnight('23:30', 30)).toBe(false);
    const clash = findConflictingAppointment([appt({ date: '2026-11-22', time: '23:30', durationMinutes: 60, dentist: 'Marie' })], {
      date: '2026-11-23',
      time: '00:10',
      durationMinutes: 30,
      dentist: 'Marie',
    });
    expect(clash).toBeDefined();
  });
});

describe('BUG-011 búsqueda sin tildes', () => {
  it('"maria" y "gomez" encuentran a "María Gómez"', () => {
    const list = [contact({})];
    expect(filterPatientsForAutocomplete(list, 'maria')).toHaveLength(1);
    expect(filterPatientsForAutocomplete(list, 'gomez')).toHaveLength(1);
    expect(matchesContactSearch(list[0], 'GOMEZ')).toBe(true);
  });
});

describe('BUG-012 duplicados', () => {
  it('detecta mismo teléfono (con otro formato) o mismo nombre sin tildes', () => {
    const existing = [contact({ id: 'x', fullName: 'María Gómez', primaryPhone: '+54 9 341 555-1234' })];
    expect(findDuplicateContacts(existing, { fullName: 'Otra Persona', primaryPhone: '3415551234' })).toHaveLength(1);
    expect(findDuplicateContacts(existing, { fullName: 'maria gomez', primaryPhone: '1199998888' })).toHaveLength(1);
    expect(findDuplicateContacts(existing, { id: 'x', fullName: 'María Gómez', primaryPhone: '3415551234' })).toHaveLength(0);
  });
});

describe('BUG-013 largo de nombre y teléfono', () => {
  it('limita el nombre y exige teléfonos de 8 a 15 dígitos sin símbolos repetidos', () => {
    expect(isValidPersonName('a'.repeat(300))).toBe(false);
    expect(isValidPhoneNumber('1'.repeat(64))).toBe(false);
    expect(isValidPhoneNumber('(((1)))2.3-4 5 6')).toBe(false);
    expect(isValidPhoneNumber('1234567')).toBe(false);
    expect(isValidPhoneNumber('+54 (341) 555-1234')).toBe(true);
  });
});

describe('BUG-009 validación de la API', () => {
  it('rechaza pacientes sin nombre, con HTML o teléfono inválido', () => {
    expect(validateContactInput({ id: 'c-x' }).ok).toBe(false);
    expect(validateContactInput({ id: 'c-x', fullName: '<img src=x onerror=alert(1)>', primaryPhone: '3415551234' }).ok).toBe(false);
    expect(validateContactInput({ id: 'c-x', fullName: 'Ana Pérez', primaryPhone: 'abc' }).ok).toBe(false);
    expect(validateContactInput({ id: 'c-x', fullName: 'Ana Pérez', primaryPhone: '3415551234' }).ok).toBe(true);
  });

  it('rechaza turnos con fecha inexistente, duración negativa, odontóloga desconocida o montos inválidos', () => {
    const base = { id: 'a-1', contactId: 'c-1', date: '2026-11-20', time: '10:00', durationMinutes: 30, dentist: 'Marie' };
    expect(validateAppointmentInput(base).ok).toBe(true);
    expect(validateAppointmentInput({ ...base, date: '2026-02-31' }).ok).toBe(false);
    expect(validateAppointmentInput({ ...base, durationMinutes: -30 }).ok).toBe(false);
    expect(validateAppointmentInput({ ...base, dentist: 'Hacker' }).ok).toBe(false);
    expect(validateAppointmentInput({ ...base, dentist: undefined }).ok).toBe(false);
    expect(validateAppointmentInput({ ...base, ingresos: -5000 }).ok).toBe(false);
    expect(validateAppointmentInput({ ...base, porcentajeHonorario: 900 }).ok).toBe(false);
    expect(validateAppointmentInput({ ...base, time: '23:30', durationMinutes: 60 }).ok).toBe(false);
  });

  it('rechaza archivos de tipo no permitido o de más de 10 MB', () => {
    const exe = { id: 'f1', fileType: 'application/x-msdownload', dataUrl: 'data:application/x-msdownload;base64,AAAA' };
    expect(validateInsuranceFileInput(exe).ok).toBe(false);
    const big = { id: 'f2', fileType: 'application/pdf', dataUrl: 'data:application/pdf;base64,' + 'A'.repeat(14_000_000) };
    expect(validateInsuranceFileInput(big).ok).toBe(false);
    const pdf = { id: 'f3', fileType: 'application/pdf', title: 'Ficha', dataUrl: 'data:application/pdf;base64,JVBERi0=' };
    expect(validateInsuranceFileInput(pdf).ok).toBe(true);
  });
});
