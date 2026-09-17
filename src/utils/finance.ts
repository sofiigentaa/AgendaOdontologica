import { Appointment } from '../types';
import { normalizeDentist } from './dentist';

export type FinanceFilterMode = 'all' | 'attendedOnly' | 'pendingOnly';

export type HonorarioBaseKind = 'ganancia' | 'cobrado';

export interface TurnExpenseLines {
  descartables: number;
  estampillas: number;
  materiales: number;
  mecanico: number;
}

export interface ClampedTurnExpenses extends TurnExpenseLines {
  totalEgresos: number;
  wasClamped: boolean;
}

export interface TurnFinanceStats {
  ingresos: number;
  descartables: number;
  estampillas: number;
  materiales: number;
  mecanico: number;
  totalEgresos: number;
  expensesWereClamped: boolean;
  balanceNeto: number;
  pctPercent: number;
  honorarioBase: number;
  honorarioBaseKind: HonorarioBaseKind;
  honorarioTotal: number;
  correspondyYani: number;
  correspondyMarie: number;
  dentist: string;
  isAttended: boolean;
}

export function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function sumExpenseLines(lines: TurnExpenseLines): number {
  return roundMoney(
    (Number(lines.descartables) || 0) +
      (Number(lines.estampillas) || 0) +
      (Number(lines.materiales) || 0) +
      (Number(lines.mecanico) || 0)
  );
}

/** Los gastos de un turno nunca pueden superar lo cobrado. */
export function clampTurnExpenseLines(
  ingresos: number,
  lines: TurnExpenseLines
): ClampedTurnExpenses {
  const cobrado = roundMoney(Math.max(0, Number(ingresos) || 0));
  const raw: TurnExpenseLines = {
    descartables: roundMoney(Math.max(0, Number(lines.descartables) || 0)),
    estampillas: roundMoney(Math.max(0, Number(lines.estampillas) || 0)),
    materiales: roundMoney(Math.max(0, Number(lines.materiales) || 0)),
    mecanico: roundMoney(Math.max(0, Number(lines.mecanico) || 0)),
  };
  const rawTotal = sumExpenseLines(raw);
  if (rawTotal <= cobrado) {
    return { ...raw, totalEgresos: rawTotal, wasClamped: false };
  }
  if (cobrado <= 0) {
    return {
      descartables: 0,
      estampillas: 0,
      materiales: 0,
      mecanico: 0,
      totalEgresos: 0,
      wasClamped: true,
    };
  }
  const scale = cobrado / rawTotal;
  const scaled: TurnExpenseLines = {
    descartables: roundMoney(raw.descartables * scale),
    estampillas: roundMoney(raw.estampillas * scale),
    materiales: roundMoney(raw.materiales * scale),
    mecanico: roundMoney(raw.mecanico * scale),
  };
  let total = sumExpenseLines(scaled);
  const drift = roundMoney(cobrado - total);
  if (drift !== 0) {
    if (scaled.descartables > 0) scaled.descartables = roundMoney(scaled.descartables + drift);
    else if (scaled.estampillas > 0) scaled.estampillas = roundMoney(scaled.estampillas + drift);
    else if (scaled.materiales > 0) scaled.materiales = roundMoney(scaled.materiales + drift);
    else scaled.mecanico = roundMoney(scaled.mecanico + drift);
    total = cobrado;
  }
  return { ...scaled, totalEgresos: total, wasClamped: true };
}

export function expensesExceedIncome(ingresos: number, lines: TurnExpenseLines): boolean {
  return sumExpenseLines(lines) > roundMoney(Math.max(0, Number(ingresos) || 0)) + 0.005;
}

export function sanitizeAppointmentWrite<T extends object>(appt: T): T {
  const row = appt as T & Partial<Appointment>;
  const ingresos = roundMoney(Math.max(0, Number(row.ingresos) || 0));
  const clamped = clampTurnExpenseLines(ingresos, {
    descartables: Number(row.descartables) || 0,
    estampillas: Number(row.estampillas) || 0,
    materiales: Number(row.materiales) || 0,
    mecanico: Number(row.mecanicoDental) || 0,
  });
  return {
    ...row,
    dentist: normalizeDentist(row.dentist as string),
    ingresos,
    descartables: clamped.descartables,
    estampillas: clamped.estampillas,
    materiales: clamped.materiales,
    mecanicoDental: clamped.mecanico,
  };
}

export function isApptAttended(appt: Appointment): boolean {
  return Boolean(appt?.completed);
}

export function calculateTurnStats(appt?: Appointment | null): TurnFinanceStats {
  if (!appt) {
    return {
      ingresos: 0,
      descartables: 0,
      estampillas: 0,
      materiales: 0,
      mecanico: 0,
      totalEgresos: 0,
      expensesWereClamped: false,
      balanceNeto: 0,
      pctPercent: 50,
      honorarioBase: 0,
      honorarioBaseKind: 'ganancia',
      honorarioTotal: 0,
      correspondyYani: 0,
      correspondyMarie: 0,
      dentist: 'Yani',
      isAttended: false,
    };
  }

  const isAttended = isApptAttended(appt);
  const ingresos = roundMoney(Math.max(0, Number(appt.ingresos) || 0));
  const clamped = clampTurnExpenseLines(ingresos, {
    descartables: Number(appt.descartables) || 0,
    estampillas: Number(appt.estampillas) || 0,
    materiales: Number(appt.materiales) || 0,
    mecanico: Number(appt.mecanicoDental) || 0,
  });
  const { descartables, estampillas, materiales, mecanico, totalEgresos } = clamped;
  const balanceNeto = roundMoney(Math.max(0, ingresos - totalEgresos));
  const rawPct =
    appt.porcentajeHonorario !== undefined && appt.porcentajeHonorario !== null
      ? Number(appt.porcentajeHonorario)
      : 50;
  const pctPercent = isNaN(rawPct) ? 50 : Math.min(100, Math.max(0, rawPct));

  // Solo se paga honorario si el turno dejó ganancia (cobrado > gastos).
  const honorarioBase = balanceNeto;
  const honorarioBaseKind: HonorarioBaseKind = 'ganancia';
  const honorarioTotal = honorarioBase * (pctPercent / 100);

  let correspondyYani = 0;
  let correspondyMarie = 0;

  const dentist = normalizeDentist(appt.dentist);
  if (dentist === 'Ambas') {
    correspondyYani = honorarioTotal / 2;
    correspondyMarie = honorarioTotal / 2;
  } else if (dentist === 'Marie') {
    correspondyMarie = honorarioTotal;
  } else {
    correspondyYani = honorarioTotal;
  }

  return {
    ingresos,
    descartables,
    estampillas,
    materiales,
    mecanico,
    totalEgresos,
    expensesWereClamped: clamped.wasClamped,
    balanceNeto,
    pctPercent,
    honorarioBase,
    honorarioBaseKind,
    honorarioTotal,
    correspondyYani,
    correspondyMarie,
    dentist,
    isAttended,
  };
}

export function filterAppointmentsByFinanceMode(
  appointments: Appointment[],
  filterMode: FinanceFilterMode
): Appointment[] {
  if (filterMode === 'attendedOnly') {
    return appointments.filter(isApptAttended);
  }
  if (filterMode === 'pendingOnly') {
    return appointments.filter((a) => !isApptAttended(a));
  }
  return appointments;
}

export function calculateDailyTotals(dayAppointments: Appointment[]) {
  let totIngresos = 0;
  let totEgresos = 0;
  let totDescartables = 0;
  let totEstampillas = 0;
  let totMateriales = 0;
  let totMecanico = 0;
  let totYani = 0;
  let totMarie = 0;

  (dayAppointments || []).forEach((appt) => {
    if (!isApptAttended(appt)) return;
    const s = calculateTurnStats(appt);
    totIngresos += s.ingresos || 0;
    totEgresos += s.totalEgresos || 0;
    totDescartables += s.descartables || 0;
    totEstampillas += s.estampillas || 0;
    totMateriales += s.materiales || 0;
    totMecanico += s.mecanico || 0;
    totYani += s.correspondyYani || 0;
    totMarie += s.correspondyMarie || 0;
  });

  return {
    totIngresos,
    totEgresos,
    totDescartables,
    totEstampillas,
    totMateriales,
    totMecanico,
    totYani,
    totMarie,
    totNeto: Math.max(0, totIngresos - totEgresos),
  };
}

export interface DentistPayoutLine {
  appointmentId: string;
  patientName: string;
  time: string;
  dentist: 'Yani' | 'Marie' | 'Ambas';
  ingresos: number;
  egresos: number;
  pctPercent: number;
  honorarioBase: number;
  honorarioBaseKind: HonorarioBaseKind;
  share: number;
}

export function buildDentistPayoutBreakdown(
  dayAppointments: Appointment[],
  dentist: 'Yani' | 'Marie',
  patientNameFor: (contactId: string) => string
): { lines: DentistPayoutLine[]; total: number } {
  const lines: DentistPayoutLine[] = [];
  let total = 0;

  (dayAppointments || []).forEach((appt) => {
    if (!isApptAttended(appt)) return;
    const s = calculateTurnStats(appt);
    const assigned =
      dentist === 'Yani'
        ? s.dentist === 'Yani' || s.dentist === 'Ambas'
        : s.dentist === 'Marie' || s.dentist === 'Ambas';
    if (!assigned) return;
    const share = dentist === 'Yani' ? s.correspondyYani : s.correspondyMarie;
    total += share;
    lines.push({
      appointmentId: appt.id,
      patientName: patientNameFor(appt.contactId) || 'Paciente',
      time: appt.time,
      dentist: s.dentist as 'Yani' | 'Marie' | 'Ambas',
      ingresos: s.ingresos,
      egresos: s.totalEgresos,
      pctPercent: s.pctPercent,
      honorarioBase: s.honorarioBase,
      honorarioBaseKind: s.honorarioBaseKind,
      share,
    });
  });

  return { lines, total };
}
