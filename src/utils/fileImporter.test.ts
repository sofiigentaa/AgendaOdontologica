import { describe, expect, it } from 'vitest';
import { parseImportFileContent } from './fileImporter';
import { buildContactsDirectoryText, buildNextDayAppointmentsText } from './exportHelpers';
import { Appointment, Contact } from '../types';
import { TREATMENT_PRESETS } from '../constants/treatments';

function contact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'c1',
    fullName: 'Ana Perez',
    isParticular: true,
    insuranceName: 'Particular',
    primaryPhone: '3415551111',
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('JSON backup import', () => {
  it('imports a full backup object and fills appointment defaults', () => {
    const raw = JSON.stringify({
      contacts: [{ fullName: 'Ana Perez', phone: '3415551111', isParticular: true }],
      appointments: [
        {
          contactId: 'c1',
          date: '2026-09-10',
          time: '14:00',
          dentist: 'Marie',
          completed: true,
          ingresos: 15000,
        },
      ],
      notes: [{ id: 'n1', contactId: 'c1', text: 'nota' }],
    });

    const parsed = parseImportFileContent(raw, 'backup.json');
    expect(parsed.contacts).toHaveLength(1);
    expect(parsed.contacts?.[0].fullName).toBe('Ana Perez');
    expect(parsed.appointments).toHaveLength(1);
    expect(parsed.appointments?.[0].durationMinutes).toBe(30);
    expect(parsed.appointments?.[0].porcentajeHonorario).toBe(50);
    expect(parsed.appointments?.[0].ingresos).toBe(15000);
    expect(parsed.notes).toHaveLength(1);
    expect(parsed.summaryMessage).toContain('1 pacientes');
    expect(parsed.summaryMessage).toContain('1 turnos');
  });

  it('imports a bare contacts array and a bare appointments array', () => {
    const contacts = parseImportFileContent(
      JSON.stringify([{ name: 'Carlos', insuranceName: 'OSDE', dni: '30111222' }])
    );
    expect(contacts.contacts?.[0].fullName).toBe('Carlos');
    expect(contacts.contacts?.[0].isParticular).toBe(false);
    expect(contacts.contacts?.[0].affiliateNumber).toBe('30111222');

    const appts = parseImportFileContent(
      JSON.stringify([{ date: '2026-09-10', time: '09:00', motive: 'Limpieza' }])
    );
    expect(appts.appointments?.[0].motive).toBe('Limpieza');
  });

  it('rejects empty files', () => {
    expect(() => parseImportFileContent('   ')).toThrow(/vacío/i);
  });
});

describe('TXT import / export roundtrip', () => {
  it('reimports next-day appointments exported as TXT', () => {
    const patients = [contact({ id: 'c1', fullName: 'Ana Perez' })];
    const appointments: Appointment[] = [
      {
        id: 'a1',
        contactId: 'c1',
        date: '2026-09-10',
        time: '10:00',
        durationMinutes: 40,
        dentist: 'Marie',
        motive: 'Limpieza',
        completed: false,
        whatsappStatus: 'confirmed',
        createdAt: '2026-09-01T00:00:00.000Z',
      },
    ];
    const baseDate = new Date(2026, 8, 9);
    const { content, targetDateStr } = buildNextDayAppointmentsText(appointments, patients, baseDate);
    expect(targetDateStr).toBe('2026-09-10');

    const parsed = parseImportFileContent(content, 'turnos.txt');
    expect(parsed.appointments).toHaveLength(1);
    expect(parsed.appointments?.[0].date).toBe('2026-09-10');
    expect(parsed.appointments?.[0].time).toBe('10:00');
    expect(parsed.appointments?.[0].durationMinutes).toBe(40);
    expect(parsed.appointments?.[0].dentist).toBe('Marie');
    expect(parsed.appointments?.[0].whatsappStatus).toBe('confirmed');
    expect(parsed.contacts?.[0].fullName).toBe('Ana Perez');
  });

  it('parses ISO dates in TXT without swapping day and year', () => {
    const txt = `AGENDA ODONTOLÓGICA - TURNOS
2026-09-10
TURNO #1: 09:00 hs  (Duración: 30 min)
Paciente: Ana Perez
Teléfono Principal: 3415551111
Cobertura: Particular
Odontóloga a cargo: Dra. Yani
Motivo de atención: Consulta
`;
    const parsed = parseImportFileContent(txt, 'turnos.txt');
    expect(parsed.appointments?.[0].date).toBe('2026-09-10');
  });

  it('reimports a patient directory TXT', () => {
    const content = buildContactsDirectoryText([
      contact({
        fullName: 'Bruno Lopez',
        isParticular: false,
        insuranceName: 'OSDE',
        affiliateNumber: '1234',
        email: 'bruno@example.com',
      }),
    ]);
    const parsed = parseImportFileContent(content, 'pacientes.txt');
    expect(parsed.contacts?.[0].fullName).toBe('Bruno Lopez');
    expect(parsed.contacts?.[0].isParticular).toBe(false);
    expect(parsed.contacts?.[0].insuranceName).toContain('OSDE');
    expect(parsed.contacts?.[0].affiliateNumber).toBe('1234');
    expect(parsed.contacts?.[0].email).toBe('bruno@example.com');
  });
});

describe('treatment presets', () => {
  it('keeps the expected durations used by the schedule modal', () => {
    expect(TREATMENT_PRESETS.find((t) => t.id === 'consulta')?.durationMinutes).toBe(20);
    expect(TREATMENT_PRESETS.find((t) => t.id === 'especiales')?.durationMinutes).toBe(120);
  });
});
