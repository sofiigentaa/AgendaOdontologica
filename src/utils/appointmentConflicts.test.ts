import { describe, expect, it } from 'vitest';
import { Appointment } from '../types';
import {
  ceilTimeToStep,
  checkTimeOverlap,
  dentistsConflict,
  findConflictingAppointment,
  findNewScheduleConflict,
  getAvailableStartTimes,
  getClinicNow,
  hasScheduleChanged,
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

describe('getAvailableStartTimes', () => {
  it('excludes the starts that overlap the dentist turns and keeps the rest', () => {
    const existing = [appt({ id: 'marie-0900', time: '09:00', durationMinutes: 45 })];
    const free = getAvailableStartTimes(
      existing,
      { date: '2026-09-09', dentist: 'Marie', durationMinutes: 30 },
      { from: '08:30', to: '10:00' }
    );
    expect(free).toEqual(['08:30', '09:45', '10:00']);
  });

  it('does not block for the other dentist or for cancelled turns', () => {
    const existing = [
      appt({ id: 'yani', dentist: 'Yani', time: '09:00' }),
      appt({ id: 'cancelled', time: '09:00', whatsappStatus: 'cancelled' }),
    ];
    const free = getAvailableStartTimes(
      existing,
      { date: '2026-09-09', dentist: 'Marie', durationMinutes: 30 },
      { from: '09:00', to: '09:00' }
    );
    expect(free).toEqual(['09:00']);
  });

  it('returns no starts when the dentist is fully booked', () => {
    const existing = [appt({ id: 'full', time: '09:00', durationMinutes: 60 })];
    const free = getAvailableStartTimes(
      existing,
      { date: '2026-09-09', dentist: 'Marie', durationMinutes: 30 },
      { from: '09:00', to: '09:30' }
    );
    expect(free).toEqual([]);
  });
});

describe('getAvailableStartTimes rules', () => {
  it('does not offer a start whose turn would end after closing time', () => {
    const free = getAvailableStartTimes(
      [],
      { date: '2026-09-09', dentist: 'Marie', durationMinutes: 60 },
      { from: '21:00', to: '21:30', closingTime: '22:00' }
    );
    expect(free).toEqual(['21:00']);
  });

  it('skips starts earlier than minStartTime', () => {
    const free = getAvailableStartTimes(
      [],
      { date: '2026-09-09', dentist: 'Marie', durationMinutes: 30 },
      { from: '09:00', to: '09:30', minStartTime: '09:15' }
    );
    expect(free).toEqual(['09:15', '09:30']);
  });

  it('ignores the appointment being edited', () => {
    const existing = [appt({ id: 'editing', time: '09:00' })];
    const free = getAvailableStartTimes(
      existing,
      { id: 'editing', date: '2026-09-09', dentist: 'Marie', durationMinutes: 30 },
      { from: '09:00', to: '09:00' }
    );
    expect(free).toEqual(['09:00']);
  });
});

describe('clinic time helpers', () => {
  it('reads the date and time in Argentina regardless of the server timezone', () => {
    // 2026-09-09 02:30 UTC is 2026-09-08 23:30 in Buenos Aires (UTC-3).
    expect(getClinicNow(new Date('2026-09-09T02:30:00Z'))).toEqual({
      date: '2026-09-08',
      time: '23:30',
    });
  });

  it('rounds times up to the next slot', () => {
    expect(ceilTimeToStep('09:07')).toBe('09:15');
    expect(ceilTimeToStep('09:15')).toBe('09:15');
    expect(ceilTimeToStep('23:50')).toBe('00:00');
  });
});

describe('hasScheduleChanged', () => {
  it('ignores status changes that keep the same slot', () => {
    const before = appt({ id: 'x', whatsappStatus: 'pending' });
    const after = appt({ id: 'x', whatsappStatus: 'confirmed' });
    expect(hasScheduleChanged(before, after)).toBe(false);
  });

  it('detects a moved turn and a new turn', () => {
    const before = appt({ id: 'x', time: '09:00' });
    expect(hasScheduleChanged(before, appt({ id: 'x', time: '10:00' }))).toBe(true);
    expect(hasScheduleChanged(undefined, appt({ id: 'new' }))).toBe(true);
  });
});

describe('findNewScheduleConflict', () => {
  it('reports a moved turn that overlaps another turn', () => {
    const previous = [appt({ id: 'a', time: '09:00' }), appt({ id: 'b', time: '11:00' })];
    const next = [appt({ id: 'a', time: '09:00' }), appt({ id: 'b', time: '09:15' })];
    expect(findNewScheduleConflict(previous, next)?.appointment.id).toBe('b');
  });

  it('does not block legacy overlapping turns that did not change', () => {
    const previous = [appt({ id: 'a', time: '09:00' }), appt({ id: 'b', time: '09:15' })];
    const next = [
      appt({ id: 'a', time: '09:00', whatsappStatus: 'confirmed' }),
      appt({ id: 'b', time: '09:15' }),
    ];
    expect(findNewScheduleConflict(previous, next)).toBeUndefined();
  });
});
