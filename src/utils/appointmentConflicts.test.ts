import { describe, expect, it } from 'vitest';
import { Appointment } from '../types';
import {
  checkTimeOverlap,
  dentistsConflict,
  findConflictingAppointment,
} from './appointmentConflicts';

function appt(overrides: Partial<Appointment>): Appointment {
  return {
    id: 'a1',
    contactId: 'c1',
    date: '2026-09-09',
    time: '09:00',
    durationMinutes: 30,
    dentist: 'Marie',
    completed: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('checkTimeOverlap', () => {
  it('detects overlapping slots and allows adjacent slots', () => {
    expect(checkTimeOverlap('09:00', 30, '09:15', 30)).toBe(true);
    expect(checkTimeOverlap('09:00', 30, '09:30', 30)).toBe(false);
    expect(checkTimeOverlap('10:00', 60, '10:59', 20)).toBe(true);
  });
});

describe('dentistsConflict', () => {
  it('allows two dentists at the same time and blocks Ambas', () => {
    expect(dentistsConflict('Marie', 'Yani')).toBe(false);
    expect(dentistsConflict('Marie', 'Marie')).toBe(true);
    expect(dentistsConflict('Ambas', 'Yani')).toBe(true);
    expect(dentistsConflict('Marie', 'Ambas')).toBe(true);
    expect(dentistsConflict('dra. marie', 'Marie')).toBe(true);
    expect(dentistsConflict('las dos juntas', 'Yani')).toBe(true);
  });
});

describe('findConflictingAppointment', () => {
  const existing = [
    appt({ id: 'marie-morning' }),
    appt({ id: 'yani-same-slot', dentist: 'Yani' }),
    appt({ id: 'cancelled', whatsappStatus: 'cancelled', time: '11:00' }),
    appt({ id: 'done', completed: true, time: '12:00' }),
  ];

  it('blocks a new Marie appointment that overlaps Marie', () => {
    const conflict = findConflictingAppointment(existing, {
      date: '2026-09-09',
      time: '09:10',
      durationMinutes: 30,
      dentist: 'Marie',
    });
    expect(conflict?.id).toBe('marie-morning');
  });

  it('allows the same slot for a different dentist', () => {
    const conflict = findConflictingAppointment(
      [appt({ id: 'marie-morning', dentist: 'Marie' })],
      {
        date: '2026-09-09',
        time: '09:00',
        durationMinutes: 30,
        dentist: 'Yani',
      }
    );
    expect(conflict).toBeUndefined();
  });

  it('does not treat cancelled or completed turns as blocking', () => {
    expect(
      findConflictingAppointment(existing, {
        date: '2026-09-09',
        time: '11:00',
        dentist: 'Marie',
      })
    ).toBeUndefined();
    expect(
      findConflictingAppointment(existing, {
        date: '2026-09-09',
        time: '12:00',
        dentist: 'Marie',
      })
    ).toBeUndefined();
  });

  it('ignores the appointment being edited', () => {
    expect(
      findConflictingAppointment(existing, {
        id: 'marie-morning',
        date: '2026-09-09',
        time: '09:00',
        dentist: 'Marie',
      })
    ).toBeUndefined();
  });
});
