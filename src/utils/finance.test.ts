import { describe, expect, it } from 'vitest';
import { Appointment } from '../types';
import {
  calculateDailyTotals,
  calculateTurnStats,
  filterAppointmentsByFinanceMode,
} from './finance';

function appt(overrides: Partial<Appointment>): Appointment {
  return {
    id: 'a1',
    contactId: 'c1',
    date: '2026-09-09',
    time: '09:00',
    completed: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    ingresos: 10000,
    descartables: 500,
    estampillas: 200,
    materiales: 300,
    mecanicoDental: 0,
    porcentajeHonorario: 50,
    dentist: 'Marie',
    ...overrides,
  };
}

describe('calculateTurnStats', () => {
  it('computes net balance and full honorario for Marie', () => {
    const stats = calculateTurnStats(appt({}));
    expect(stats.totalEgresos).toBe(1000);
    expect(stats.balanceNeto).toBe(9000);
    expect(stats.honorarioTotal).toBe(4500);
    expect(stats.correspondyMarie).toBe(4500);
    expect(stats.correspondyYani).toBe(0);
  });

  it('splits honorario when both dentists attended', () => {
    const stats = calculateTurnStats(appt({ dentist: 'Ambas' }));
    expect(stats.correspondyMarie).toBe(2250);
    expect(stats.correspondyYani).toBe(2250);
  });

  it('never lets net balance go negative', () => {
    const stats = calculateTurnStats(
      appt({ ingresos: 100, descartables: 400, estampillas: 0, materiales: 0, mecanicoDental: 0 })
    );
    expect(stats.balanceNeto).toBe(0);
    expect(stats.honorarioTotal).toBe(0);
  });

  it('defaults honorario percent to 50', () => {
    const stats = calculateTurnStats(appt({ porcentajeHonorario: undefined }));
    expect(stats.pctPercent).toBe(50);
  });
});

describe('calculateDailyTotals', () => {
  it('only includes attended appointments in the daily settlement', () => {
    const totals = calculateDailyTotals([
      appt({ id: 'attended', dentist: 'Marie' }),
      appt({
        id: 'pending',
        completed: false,
        ingresos: 80000,
        dentist: 'Yani',
      }),
      appt({
        id: 'yani',
        dentist: 'Yani',
        ingresos: 4000,
        descartables: 0,
        estampillas: 0,
        materiales: 0,
        mecanicoDental: 0,
      }),
    ]);

    expect(totals.totIngresos).toBe(14000);
    expect(totals.totMarie).toBe(4500);
    expect(totals.totYani).toBe(2000);
  });
});

describe('filterAppointmentsByFinanceMode', () => {
  const list = [
    appt({ id: 'done', completed: true }),
    appt({ id: 'pending', completed: false }),
  ];

  it('filters attended and pending turns', () => {
    expect(filterAppointmentsByFinanceMode(list, 'attendedOnly').map((a) => a.id)).toEqual(['done']);
    expect(filterAppointmentsByFinanceMode(list, 'pendingOnly').map((a) => a.id)).toEqual(['pending']);
    expect(filterAppointmentsByFinanceMode(list, 'all')).toHaveLength(2);
  });
});
