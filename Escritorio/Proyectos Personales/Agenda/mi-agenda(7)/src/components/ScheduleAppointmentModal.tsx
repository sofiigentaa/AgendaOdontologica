import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  UserPlus, 
  Shield, 
  FileText, 
  CheckCircle2, 
  Phone,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { Appointment, Contact } from '../types';
import { TREATMENT_PRESETS } from '../constants/treatments';
import { formatDuration, getTodayISO, formatDateDDMMYYYY } from '../utils/time';
import { PatientSearchSelect } from './PatientSearchSelect';

interface ScheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  appointments?: Appointment[];
  onSaveAppointment: (data: {
    contactId: string;
    date: string;
    time: string;
    durationMinutes: number;
    motive: string;
    dentist?: 'Yani' | 'Marie' | 'Ambas' | string;
    completed: boolean;
    ingresos?: number;
    descartables?: number;
    estampillas?: number;
    materiales?: number;
    mecanicoDental?: number;
    porcentajeHonorario?: number;
  }, appointmentId?: string) => void;
  onOpenAddContactModal: () => void;
  initialContactId?: string;
  initialDate?: string;
  initialTime?: string;
  editingAppointment?: Appointment | null;
  isContactLocked?: boolean;
  googleUser?: { email?: string | null; displayName?: string | null } | null;
  onConnectGoogle?: () => void;
  onPromptGoogleAction?: (actionType: 'sync_calendar' | 'send_email', apptData: any, patient: Contact) => void;
}

export const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  contacts,
  appointments = [],
  onSaveAppointment,
  onOpenAddContactModal,
  initialContactId = '',
  initialDate = '',
  initialTime = '',
  editingAppointment = null,
  isContactLocked = false,
  googleUser,
  onConnectGoogle,
  onPromptGoogleAction,
}) => {
  const [selectedContactId, setSelectedContactId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [motive, setMotive] = useState('');
  const [dentist, setDentist] = useState<'Yani' | 'Marie' | 'Ambas'>('Marie');
  const [completed, setCompleted] = useState(false);
  const [searchPatient, setSearchPatient] = useState('');

  // Google Sync checkboxes
  const [syncGoogleCalendar, setSyncGoogleCalendar] = useState(true);
  const [sendGmailConfirmation, setSendGmailConfirmation] = useState(false);

  // Financial fields
  const [ingresos, setIngresos] = useState<number>(0);
  const [descartables, setDescartables] = useState<number>(0);
  const [estampillas, setEstampillas] = useState<number>(0);
  const [materiales, setMateriales] = useState<number>(0);
  const [mecanicoDental, setMecanicoDental] = useState<number>(0);
  const [porcentajeHonorario, setPorcentajeHonorario] = useState<number>(50);

  const [conflictAppointment, setConflictAppointment] = useState<{
    appointment: Appointment;
    patientName: string;
    dentistName: string;
    timeRangeText: string;
  } | null>(null);

  const prevIsOpenRef = React.useRef(isOpen);
  const prevContactsLengthRef = React.useRef(contacts.length);

  useEffect(() => {
    // When modal transitions from closed to open
    if (isOpen && !prevIsOpenRef.current) {
      setConflictAppointment(null);
      if (editingAppointment) {
        setSelectedContactId(editingAppointment.contactId);
        setDate(editingAppointment.date);
        setTime(editingAppointment.time);
        setDurationMinutes(editingAppointment.durationMinutes || 30);
        setMotive(editingAppointment.motive || '');
        setDentist((editingAppointment.dentist as 'Yani' | 'Marie' | 'Ambas') || 'Marie');
        setCompleted(editingAppointment.completed || false);
        
        setIngresos(editingAppointment.ingresos || 0);
        setDescartables(editingAppointment.descartables || 0);
        setEstampillas(editingAppointment.estampillas || 0);
        setMateriales(editingAppointment.materiales || 0);
        setMecanicoDental(editingAppointment.mecanicoDental || 0);
        setPorcentajeHonorario(editingAppointment.porcentajeHonorario ?? 50);
      } else {
        setSelectedContactId(initialContactId || '');
        setDate(initialDate || new Date().toISOString().split('T')[0]);
        setTime(initialTime || '09:00');
        setDurationMinutes(30);
        setMotive('');
        setDentist('Marie');
        setCompleted(false);

        setIngresos(0);
        setDescartables(0);
        setEstampillas(0);
        setMateriales(0);
        setMecanicoDental(0);
        setPorcentajeHonorario(50);
      }
    } else if (isOpen) {
      // Modal was already open: check if a new contact was created (contacts array length grew)
      if (contacts.length > prevContactsLengthRef.current) {
        const newestContact = contacts[0];
        if (newestContact) {
          setSelectedContactId(newestContact.id);
        }
      } else if (initialContactId && initialContactId !== selectedContactId) {
        setSelectedContactId(initialContactId);
      }
    }

    prevIsOpenRef.current = isOpen;
    prevContactsLengthRef.current = contacts.length;
  }, [isOpen, editingAppointment, initialContactId, initialDate, initialTime, contacts]);

  if (!isOpen) return null;

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  const filteredContacts = contacts.filter((c) =>
    c.fullName.toLowerCase().includes(searchPatient.toLowerCase()) ||
    (c.insuranceName && c.insuranceName.toLowerCase().includes(searchPatient.toLowerCase()))
  );

  const quickTimePresets = ['08:30', '09:00', '10:00', '11:30', '14:00', '15:00', '16:30', '17:30'];

  // Helper function to check if two time ranges overlap
  const checkTimeOverlap = (start1: string, dur1: number, start2: string, dur2: number): boolean => {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const s1 = toMin(start1);
    const e1 = s1 + (dur1 || 30);
    const s2 = toMin(start2);
    const e2 = s2 + (dur2 || 30);
    return Math.max(s1, s2) < Math.min(e1, e2);
  };

  const processSave = () => {
    const apptPayload = {
      contactId: selectedContactId,
      date,
      time,
      durationMinutes: Number(durationMinutes) || 30,
      motive,
      dentist,
      completed,
      ingresos: Number(ingresos) || 0,
      descartables: Number(descartables) || 0,
      estampillas: Number(estampillas) || 0,
      materiales: Number(materiales) || 0,
      mecanicoDental: Number(mecanicoDental) || 0,
      porcentajeHonorario: Number(porcentajeHonorario) || 50,
      appointmentId: editingAppointment ? editingAppointment.id : undefined,
    };

    onSaveAppointment(apptPayload, editingAppointment ? editingAppointment.id : undefined);
    setConflictAppointment(null);
    onClose();

    // Trigger Google Workspace sync/email if selected
    if (onPromptGoogleAction && selectedContact && googleUser) {
      if (syncGoogleCalendar && sendGmailConfirmation && selectedContact.primaryEmail) {
        onPromptGoogleAction('sync_and_email' as any, apptPayload, selectedContact);
      } else if (syncGoogleCalendar) {
        onPromptGoogleAction('sync_calendar', apptPayload, selectedContact);
      } else if (sendGmailConfirmation && selectedContact.primaryEmail) {
        onPromptGoogleAction('send_email', apptPayload, selectedContact);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) {
      alert('Por favor selecciona un paciente o contacto.');
      return;
    }
    if (!date) {
      alert('Por favor selecciona una fecha.');
      return;
    }
    if (!time) {
      alert('Por favor selecciona un horario.');
      return;
    }

    // When editing an existing appointment, save changes directly without showing conflict popup
    if (editingAppointment) {
      processSave();
      return;
    }

    const currentDuration = Number(durationMinutes) || 30;

    // Check for collision with existing appointments on the same date for the same dentist (only for new appointments)
    if (appointments && appointments.length > 0) {
      const conflicting = appointments.find((appt) => {
        // Must be the same date
        if (appt.date !== date) return false;
        // Do not block completed or cancelled appointments
        if (appt.completed) return false;
        if (appt.whatsappStatus === 'cancelled') return false;

        // Check dentist collision: if either is "Ambas", or if dentists match
        const apptDentist = appt.dentist || 'Yani';
        const targetDentist = dentist || 'Marie';
        const isDentistConflict =
          apptDentist === targetDentist ||
          apptDentist === 'Ambas' ||
          targetDentist === 'Ambas';

        if (!isDentistConflict) return false;

        // Check time overlap
        return checkTimeOverlap(time, currentDuration, appt.time, appt.durationMinutes || 30);
      });

      if (conflicting) {
        const contactOfConflict = contacts.find((c) => c.id === conflicting.contactId);
        const patientName = contactOfConflict?.fullName || 'Paciente no especificado';
        const apptDentistName = conflicting.dentist === 'Ambas' 
          ? 'Marie y Yani (Ambas)' 
          : conflicting.dentist === 'Yani' 
          ? 'Dra. Yani' 
          : 'Dra. Marie';
        
        const [h, m] = conflicting.time.split(':').map(Number);
        const endTotal = (h || 0) * 60 + (m || 0) + (conflicting.durationMinutes || 30);
        const endH = String(Math.floor(endTotal / 60) % 24).padStart(2, '0');
        const endM = String(endTotal % 60).padStart(2, '0');
        const timeRangeText = `${conflicting.time} a ${endH}:${endM} hs`;

        setConflictAppointment({
          appointment: conflicting,
          patientName,
          dentistName: apptDentistName,
          timeRangeText,
        });
        return;
      }
    }

    processSave();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-backdrop">
      <div 
        id="modal-schedule-appointment"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] animate-modal-pop"
      >
        {/* Header */}
        <div className="bg-[#2E7D5E] text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-[#24664c]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-md shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                {editingAppointment ? 'Editar Turno' : 'Agendar Nuevo Turno'}
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100 leading-tight">
                Selecciona paciente, fecha y horario de consulta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          
          {/* Patient Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isContactLocked || editingAppointment ? '1. Paciente Asignado' : '1. Seleccionar Paciente / Contacto *'}
              </label>
              {!isContactLocked && !editingAppointment && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAddContactModal();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Nuevo Paciente</span>
                </button>
              )}
            </div>

            {isContactLocked || editingAppointment ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                      {selectedContact?.fullName || 'Paciente seleccionado'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600 flex-wrap">
                      {selectedContact?.primaryPhone && (
                        <span className="font-mono">Tel: {selectedContact.primaryPhone}</span>
                      )}
                      {selectedContact?.primaryPhone && (selectedContact?.insuranceName || selectedContact?.isParticular) && (
                        <span>•</span>
                      )}
                      <span>
                        {selectedContact?.isParticular 
                          ? 'Particular' 
                          : `${selectedContact?.insuranceName || 'Obra Social'}${selectedContact?.affiliateNumber ? ` (N° ${selectedContact.affiliateNumber})` : ''}`
                        }
                      </span>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                    selectedContact?.isParticular 
                      ? 'bg-emerald-100 text-emerald-900' 
                      : 'bg-blue-100 text-blue-900'
                  }`}>
                    {selectedContact?.isParticular ? 'Particular' : (selectedContact?.insuranceName || 'Obra Social')}
                  </span>
                </div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>No tienes contactos registrados en tu agenda.</span>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAddContactModal();
                  }}
                  className="px-2.5 py-1 bg-amber-600 text-white font-semibold rounded-lg text-[11px] cursor-pointer"
                >
                  Crear uno
                </button>
              </div>
            ) : (
              <>
                <PatientSearchSelect
                  id="select-appointment-patient-autocomplete"
                  contacts={contacts}
                  selectedContactId={selectedContactId}
                  onSelectContact={(c) => setSelectedContactId(c.id)}
                  placeholder="Escribir o seleccionar nombre de paciente..."
                  clearOnSelect={false}
                  onOpenAddContactModal={onOpenAddContactModal}
                />

                {/* Selected Patient Coverage Banner */}
                {selectedContact && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                          {selectedContact.fullName}
                        </span>
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap mt-0.5">
                          {selectedContact.primaryPhone && (
                            <span className="font-mono">Tel: {selectedContact.primaryPhone}</span>
                          )}
                          {selectedContact.primaryPhone && (selectedContact.insuranceName || selectedContact.isParticular) && (
                            <span>•</span>
                          )}
                          <span>
                            {selectedContact.isParticular 
                              ? 'Particular' 
                              : `${selectedContact.insuranceName || 'Obra Social'}${selectedContact.affiliateNumber ? ` (N° ${selectedContact.affiliateNumber})` : ''}`
                            }
                          </span>
                        </div>
                      </div>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                        selectedContact.isParticular 
                          ? 'bg-emerald-100 text-emerald-900' 
                          : 'bg-blue-100 text-blue-900'
                      }`}>
                        {selectedContact.isParticular ? 'Particular' : (selectedContact.insuranceName || 'Obra Social')}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dentist / Odontóloga Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              2. Odontóloga a cargo *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDentist('Marie')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all text-center ${
                  dentist === 'Marie'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${dentist === 'Marie' ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-slate-300'}`} />
                  <span className="font-extrabold text-xs notranslate" translate="no">Dra. Marie</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">100% Honorario</span>
              </button>

              <button
                type="button"
                onClick={() => setDentist('Yani')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all text-center ${
                  dentist === 'Yani'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${dentist === 'Yani' ? 'bg-emerald-600 ring-2 ring-emerald-300' : 'bg-slate-300'}`} />
                  <span className="font-extrabold text-xs notranslate" translate="no">Dra. Yani</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">100% Honorario</span>
              </button>

              <button
                type="button"
                onClick={() => setDentist('Ambas')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all text-center ${
                  dentist === 'Ambas'
                    ? 'bg-purple-100 border-purple-600 text-purple-900 shadow-sm ring-2 ring-purple-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${dentist === 'Ambas' ? 'bg-purple-600 ring-2 ring-purple-300' : 'bg-slate-300'}`} />
                  <span className="font-black text-xs notranslate" translate="no">Las dos</span>
                </div>
                <span className="text-[10px] text-purple-800 font-bold">50% / 50%</span>
              </button>
            </div>
          </div>

          {/* Date & Time Selection - Perfectly on the SAME row */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Column 1: Fecha */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  3. Fecha *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-2.5 sm:px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:ring-2 focus:ring-[#2E7D5E] focus:bg-white focus:outline-none transition-all shadow-2xs"
                  required
                />
              </div>

              {/* Column 2: Horario */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  4. Horario *
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-11 px-2.5 sm:px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:ring-2 focus:ring-[#2E7D5E] focus:bg-white focus:outline-none transition-all shadow-2xs font-mono"
                  required
                />
              </div>
            </div>

            {/* Quick Presets for Date & Time */}
            <div className="flex items-center justify-between pt-0.5 gap-1 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDate(getTodayISO())}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    date === getTodayISO()
                      ? 'bg-[#2E7D5E] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tm = new Date();
                    tm.setDate(tm.getDate() + 1);
                    const tmStr = `${tm.getFullYear()}-${String(tm.getMonth() + 1).padStart(2, '0')}-${String(tm.getDate()).padStart(2, '0')}`;
                    setDate(tmStr);
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                >
                  Mañana
                </button>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {quickTimePresets.slice(0, 5).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition-all ${
                      time === t
                        ? 'bg-[#2E7D5E] text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Treatment Motive & Duration */}
          <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              5. Motivo de la consulta y Tiempo Estimado
            </label>

            {/* Quick Treatment Preset Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Seleccionar tratamiento predefinido:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TREATMENT_PRESETS.map((preset) => {
                  const isSelected = preset.id !== 'otro' && (motive.toLowerCase().includes(preset.id) || motive === preset.motiveText);
                  const isOtro = preset.id === 'otro';

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        if (isOtro) {
                          setMotive('');
                          setDurationMinutes(30);
                        } else {
                          setMotive(preset.motiveText);
                          setDurationMinutes(preset.durationMinutes);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 min-h-[60px] ${
                        isSelected
                          ? 'bg-emerald-100 border-[#2E7D5E] text-emerald-950 shadow-2xs font-extrabold ring-1 ring-[#2E7D5E]'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span className="text-xs font-bold leading-snug">{preset.label}</span>
                      <span className="text-[10px] text-emerald-700 font-extrabold mt-0.5">
                        ⏱️ {formatDuration(preset.durationMinutes)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Motive Text Input */}
            <div className="space-y-1 pt-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Detalle / Nombre del Tratamiento u Observaciones:
              </label>
              <input
                type="text"
                value={motive}
                onChange={(e) => {
                  const val = e.target.value;
                  setMotive(val);
                  // Detectar si el usuario especifica horas o minutos en el motivo (ej. "2 horas", "1.5 hs", "90 min")
                  const lower = val.toLowerCase();
                  const hoursMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:horas?|hrs?|hs?)/);
                  const minsMatch = lower.match(/(\d+)\s*(?:minutos?|mins?)/);
                  if (hoursMatch) {
                    const hours = parseFloat(hoursMatch[1].replace(',', '.'));
                    if (hours > 0 && hours <= 8) {
                      setDurationMinutes(Math.round(hours * 60));
                    }
                  } else if (minsMatch) {
                    const mins = parseInt(minsMatch[1], 10);
                    if (mins >= 5 && mins <= 480) {
                      setDurationMinutes(mins);
                    }
                  }
                }}
                placeholder="Ej. Limpieza, Restauración de caries, TC uni, etc."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#2E7D5E] focus:outline-none"
              />
            </div>

            {/* Duration Minutes Input */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-700 shrink-0">Tiempo de consulta:</span>
                <div className="relative w-28 sm:w-32">
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={durationMinutes || ''}
                    onChange={(e) => setDurationMinutes(e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                    placeholder="Ej. 75"
                    className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-[#2E7D5E] focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 pointer-events-none">
                    min
                  </span>
                </div>
                {durationMinutes > 60 && (
                  <div className="px-3 py-1 bg-emerald-50 text-[#2E7D5E] border border-emerald-200 rounded-xl flex items-center gap-1.5 shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-medium">Equivale a:</span>
                    <span className="text-xs font-extrabold text-emerald-900">
                      ⏱️ {formatDuration(durationMinutes)}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Duration Buttons */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10.5px] font-semibold text-slate-500 mr-1">Duraciones rápidas:</span>
                {[15, 20, 30, 40, 45, 60, 75, 90, 100, 120].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDurationMinutes(dur)}
                    className={`px-2 py-0.5 text-xs rounded-lg font-bold transition-all ${
                      durationMinutes === dur
                        ? 'bg-[#2E7D5E] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    {formatDuration(dur)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Finanzas y Costos del Turno */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/80 pb-1.5">
              <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#2E7D5E]" />
                6. Finanzas y Gastos del Turno
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                % Honorario: {porcentajeHonorario}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ingreso Cobrado ($)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={ingresos || ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/^0+(?=\d)/, '');
                    setIngresos(raw === '' ? 0 : parseFloat(raw));
                  }}
                  placeholder="0.00"
                  className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#2E7D5E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  % Honorarios
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={porcentajeHonorario === 0 ? '' : porcentajeHonorario}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/^0+(?=\d)/, '');
                    setPorcentajeHonorario(raw === '' ? 0 : parseFloat(raw));
                  }}
                  placeholder="0"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#2E7D5E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Egresos del Turno ($)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">Descartables:</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={descartables || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                      setDescartables(raw === '' ? 0 : parseFloat(raw));
                    }}
                    placeholder="0.00"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Estampillas:</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={estampillas || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                      setEstampillas(raw === '' ? 0 : parseFloat(raw));
                    }}
                    placeholder="0.00"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Materiales:</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={materiales || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                      setMateriales(raw === '' ? 0 : parseFloat(raw));
                    }}
                    placeholder="0.00"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Mecánico:</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={mecanicoDental || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                      setMecanicoDental(raw === '' ? 0 : parseFloat(raw));
                    }}
                    placeholder="0.00"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>



          {/* Status Switch */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-5 h-5 ${completed ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-bold text-slate-800">Estado del Turno</span>
                <p className="text-[11px] text-slate-500">
                  {completed ? 'Marcado como ATENDIDO / COMPLETADO' : 'PENDIENTE en calendario'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Submit / Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#4CAF7D] hover:bg-[#3d986b] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>{editingAppointment ? 'Guardar Cambios' : 'Agendar Turno'}</span>
            </button>
          </div>

        </form>

        {/* Conflict Warning Popup Alert */}
        {conflictAppointment && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-md w-full p-5 space-y-4">
              
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    ¡Horario Ocupado!
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Ese turno ya está siendo ocupado por otro paciente en el mismo horario.
                  </p>
                </div>
              </div>

              {/* Conflict Detail Box */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                  <span className="font-bold text-amber-900">Paciente:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {conflictAppointment.patientName}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                  <span className="font-bold text-amber-900">Motivo / Tratamiento:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[220px] truncate">
                    {conflictAppointment.appointment.motive || 'Sin motivo especificado'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                  <span className="font-bold text-amber-900">Horario actual:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {conflictAppointment.timeRangeText}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Odontóloga:</span>
                  <span className="font-bold text-slate-800">
                    {conflictAppointment.dentistName}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConflictAppointment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Modificar horario
                </button>
                <button
                  type="button"
                  onClick={() => processSave()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                  title="Agendar superponiendo intencionalmente"
                >
                  Agendar de todos modos
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
