export interface TreatmentPreset {
  id: string;
  label: string;
  motiveText: string;
  durationMinutes: number;
}

export const TREATMENT_PRESETS: TreatmentPreset[] = [
  { id: 'consulta', label: 'Consulta', motiveText: 'Consulta', durationMinutes: 20 },
  { id: 'limpieza', label: 'Limpieza', motiveText: 'Limpieza', durationMinutes: 40 },
  { id: 'caries', label: 'Restauración de caries', motiveText: 'Restauración de caries', durationMinutes: 45 },
  { id: 'tc_uni', label: 'TC uni', motiveText: 'TC uni', durationMinutes: 60 },
  { id: 'tc_bi', label: 'TC bi', motiveText: 'TC bi', durationMinutes: 75 },
  { id: 'tc_multi', label: 'TC multi', motiveText: 'TC multi', durationMinutes: 100 },
  { id: 'especiales', label: 'Especiales (TC + perno)', motiveText: 'Especiales (TC + perno)', durationMinutes: 120 },
  { id: 'otro', label: 'Otro', motiveText: 'Otro', durationMinutes: 30 },
];
