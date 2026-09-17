import { Appointment } from '../types';
import { normalizeDentist } from './dentist';

export type FinanceFilterMode = 'all' | 'attendedOnly' | 'pendingOnly';

export type HonorarioBaseKind = 'ganancia' | 'cobrado';

export interface TurnFinanceStats {
  ingresos: number;
  descartables: number;
  estampillas: number;
  materiales: number;
  mecanico: number;
  totalEgresos: number;
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
  const ingresos = Number(appt.ingresos) || 0;
  const descartables = Number(appt.descartables) || 0;
  const estampillas = Number(appt.estampillas) || 0;
  const materiales = Number(appt.materiales) || 0;
  const mecanico = Number(appt.mecanicoDental) || 0;
  const totalEgresos = descartables + estampillas + materiales + mecanico;
  const balanceNeto = Math.max(0, ingresos - totalEgresos);
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
