import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Calendar, Clock, User, Sparkles, ShieldCheck, MessageSquare, ArrowRight, RotateCcw } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface PatientConfirmationViewProps {
  appointmentId: string;
  initialAction?: 'confirm' | 'cancel';
}

export const PatientConfirmationView: React.FC<PatientConfirmationViewProps> = ({
  appointmentId,
  initialAction = 'confirm',
}) => {
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAndProcess = async () => {
      try {
        setLoading(true);
        let apptData: any = null;

        // 1. Try server endpoint
        try {
          const res = await fetch(`/api/public/appointment/${appointmentId}`);
          if (res.ok) {
            apptData = await res.json();
          }
        } catch (e) {
          console.warn('Server public endpoint error:', e);
        }

        // 2. If not found on server, query Supabase directly
        if (!apptData) {
          try {
            const { data: sbAppts } = await supabase
              .from('appointments')
              .select('*')
              .eq('id', appointmentId)
              .limit(1);

            if (sbAppts && sbAppts.length > 0) {
              const row = sbAppts[0];
              let contactName = row.contact_name || 'Paciente';
              const contactId = row.contact_id || row.contactId;
              
              if (contactId) {
                const { data: sbContacts } = await supabase
                  .from('contacts')
                  .select('full_name, fullName')
                  .eq('id', contactId)
                  .limit(1);
                if (sbContacts && sbContacts.length > 0) {
                  contactName = sbContacts[0].full_name || sbContacts[0].fullName || contactName;
                }
              }

              apptData = {
                id: row.id,
                patientName: contactName,
                date: row.date || '',
                time: row.time || '',
                dentist: row.dentist || row.title || 'Marie',
                treatment: row.treatment || row.motive || '',
                whatsappStatus: row.whatsapp_status || row.whatsappStatus || 'pending',
                lastUpdated: row.whatsapp_last_reply || null,
              };
            }
          } catch (sbErr) {
            console.warn('Supabase direct lookup error:', sbErr);
          }
        }

        // 3. Fallback to localStorage if accessed on same device
        if (!apptData) {
          try {
            const stored = localStorage.getItem('mi_agenda_appointments_v6');
            const storedContacts = localStorage.getItem('mi_agenda_contacts_v6');
            if (stored) {
              const apptsList = JSON.parse(stored);
              const found = apptsList.find((a: any) => a.id === appointmentId);
              if (found) {
                let name = 'Paciente';
                if (storedContacts) {
                  const contactsList = JSON.parse(storedContacts);
                  const c = contactsList.find((cnt: any) => cnt.id === found.contactId);
                  if (c) name = c.fullName;
                }
                apptData = {
                  id: found.id,
                  patientName: name,
                  date: found.date,
                  time: found.time,
                  dentist: found.dentist || 'Marie',
                  treatment: found.motive || '',
                  whatsappStatus: found.whatsappStatus || 'pending',
                  lastUpdated: found.whatsappLastReply || null,
                };
              }
            }
          } catch {}
        }

        // If the action was 'cancel' and the appointment is not found, it means it's already removed/cancelled
        if (!apptData) {
          if (initialAction === 'cancel') {
            if (!isMounted) return;
            setStatus('cancelled');
            setAppointment({
              id: appointmentId,
              patientName: 'Estimado/a Paciente',
              date: 'Fecha coordinada',
              time: '--:--',
              dentist: 'Consultorio',
              whatsappStatus: 'cancelled',
            });
            setLoading(false);
            return;
          } else {
            // Check if there was any URL parameters for info
            const urlParams = new URLSearchParams(window.location.search);
            const fallbackPatient = urlParams.get('paciente') || 'Paciente';
            const fallbackDate = urlParams.get('fecha') || '';
            const fallbackTime = urlParams.get('hora') || '';

            if (fallbackDate || fallbackTime) {
              apptData = {
                id: appointmentId,
                patientName: fallbackPatient,
                date: fallbackDate,
                time: fallbackTime,
                dentist: 'Consultorio',
                whatsappStatus: 'pending',
              };
            } else {
              throw new Error('El turno ya fue procesado o cancelado previamente.');
            }
          }
        }

        if (!isMounted) return;
        setAppointment(apptData);
        setStatus(apptData.whatsappStatus || 'pending');

        // Apply initial action if provided
        if (initialAction === 'confirm' || initialAction === 'cancel') {
          setIsSubmitting(true);
          await executeAction(initialAction, apptData);
          if (isMounted) {
            setStatus(initialAction === 'confirm' ? 'confirmed' : 'cancelled');
            setIsSubmitting(false);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (initialAction === 'cancel') {
          setStatus('cancelled');
          setAppointment({
            id: appointmentId,
            patientName: 'Estimado/a Paciente',
            date: 'Fecha coordinada',
            time: '--:--',
            dentist: 'Consultorio',
            whatsappStatus: 'cancelled',
          });
        } else {
          setError(err.message || 'No se pudo cargar el turno.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAndProcess();

    return () => {
      isMounted = false;
    };
  }, [appointmentId, initialAction]);

  const executeAction = async (action: 'confirm' | 'cancel', currentAppt?: any) => {
    const targetStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
    const nowIso = new Date().toISOString();

    // 1. Notify server endpoint
    try {
      await fetch(`/api/public/appointment/${appointmentId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } catch (e) {
      console.warn('Server respond error:', e);
    }

    // 2. Synchronize directly with Supabase
    try {
      const { data: existingRows } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .limit(1);

      let existingObj: any = {};
      if (existingRows && existingRows.length > 0 && existingRows[0].notes) {
        try {
          if (typeof existingRows[0].notes === 'string' && existingRows[0].notes.startsWith('{')) {
            existingObj = JSON.parse(existingRows[0].notes);
          }
        } catch {}
      }

      const mergedNotes = JSON.stringify({
        ...existingObj,
        ...(currentAppt || {}),
        id: appointmentId,
        whatsappStatus: targetStatus,
        whatsappLastReply: nowIso,
        status: targetStatus,
      });

      const fullUpdate = {
        status: targetStatus,
        notes: mergedNotes,
        color: targetStatus === 'confirmed' ? '#10b981' : targetStatus === 'cancelled' ? '#ef4444' : '#3b82f6',
        whatsapp_status: targetStatus,
        whatsapp_last_reply: nowIso,
      };

      const updateRes = await supabase
        .from('appointments')
        .update(fullUpdate)
        .eq('id', appointmentId);

      if (updateRes.error) {
        await supabase
          .from('appointments')
          .update({
            status: targetStatus,
            notes: mergedNotes,
            color: targetStatus === 'confirmed' ? '#10b981' : targetStatus === 'cancelled' ? '#ef4444' : '#3b82f6',
          })
          .eq('id', appointmentId);
      }
    } catch (sbErr) {
      console.warn('Supabase respond update error:', sbErr);
    }

    // 3. Update localStorage if exists on client
    try {
      const stored = localStorage.getItem('mi_agenda_appointments_v6');
      if (stored) {
        let appts = JSON.parse(stored);
        appts = appts.map((a: any) =>
          a.id === appointmentId ? { ...a, whatsappStatus: targetStatus, whatsappLastReply: nowIso } : a
        );
        localStorage.setItem('mi_agenda_appointments_v6', JSON.stringify(appts));
      }
    } catch {}

    setStatus(targetStatus);
  };

  const handleManualAction = async (action: 'confirm' | 'cancel') => {
    setIsSubmitting(true);
    try {
      await executeAction(action, appointment);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
          <p className="text-slate-600 font-bold text-sm">Procesando estado de tu turno...</p>
        </div>
      </div>
    );
  }

  // Gracefully handle cancelled or non-existing appointments without blocking red error
  if (!appointment && error && initialAction !== 'cancel') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Turno Procesado</h2>
          <p className="text-slate-500 text-xs">
            {error || 'El turno ya ha sido actualizado o el horario fue liberado en el consultorio.'}
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs w-full">
            Para coordinar o consultar cualquier duda, comunícate directamente por WhatsApp con el consultorio.
          </div>
        </div>
      </div>
    );
  }

  const dentistDisplayName =
    appointment?.dentist === 'Ambas'
      ? 'las Dras. Marie y Yani'
      : (appointment?.dentist === 'Marie' || appointment?.dentist === 'Yani')
      ? `la Dra. ${appointment.dentist}`
      : 'el Consultorio Odontológico';

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-50 via-teal-50/40 to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Card */}
        <div
          className={`p-6 text-white text-center transition-colors duration-300 ${
            status === 'confirmed'
              ? 'bg-linear-to-r from-emerald-600 to-teal-600'
              : status === 'cancelled'
              ? 'bg-linear-to-r from-slate-700 to-slate-800'
              : 'bg-linear-to-r from-teal-600 to-cyan-700'
          }`}
        >
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
            {status === 'confirmed' ? (
              <CheckCircle2 className="w-8 h-8 text-white" />
            ) : status === 'cancelled' ? (
              <XCircle className="w-8 h-8 text-rose-300" />
            ) : (
              <Calendar className="w-8 h-8 text-white" />
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {status === 'confirmed'
              ? '¡Turno Confirmado!'
              : status === 'cancelled'
              ? 'Turno Cancelado'
              : 'Gestión de tu Turno'}
          </h1>

          <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium">
            {status === 'confirmed'
              ? 'Tu asistencia quedó registrada en la agenda'
              : status === 'cancelled'
              ? 'Se ha liberado el horario en el consultorio'
              : 'Por favor confirma si podrás asistir a tu cita'}
          </p>
        </div>

        {/* Body Appointment Details */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Paciente</span>
                <span className="text-sm font-bold text-slate-800">{appointment?.patientName || 'Paciente'}</span>
              </div>
            </div>

            {appointment?.date && appointment?.date !== 'Fecha coordinada' && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fecha</span>
                    <span className="text-xs font-bold text-slate-800">{appointment.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Horario</span>
                    <span className="text-xs font-bold text-slate-800">{appointment.time} hs</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-1 border-t border-slate-200/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Atención con</span>
                <span className="text-xs font-bold text-slate-800">{dentistDisplayName}</span>
              </div>
            </div>
          </div>

          {/* Status Message Box */}
          {status === 'confirmed' && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-extrabold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>¡Asistencia Confirmada!</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Muchas gracias por avisarnos. Tu lugar está reservado en el consultorio. Te recomendamos llegar 5 minutos antes de tu horario.
              </p>
            </div>
          )}

          {status === 'cancelled' && (
            <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 text-center space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-center gap-1.5 text-rose-800 font-extrabold text-sm">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Turno Cancelado con Éxito</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                El horario ha quedado liberado en la agenda del consultorio. Si deseas reprogramar o coordinar una nueva cita, puedes comunicarte por WhatsApp.
              </p>
            </div>
          )}

          {/* Manual Switch Buttons */}
          <div className="pt-2 flex flex-col gap-2.5">
            {status !== 'confirmed' && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleManualAction('confirm')}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isSubmitting ? 'Procesando...' : 'Confirmar mi Asistencia'}</span>
              </button>
            )}

            {status === 'confirmed' && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleManualAction('cancel')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 active:scale-98 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>¿Tuviste un imprevisto? Cancelar turno</span>
              </button>
            )}

            {status === 'cancelled' && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleManualAction('confirm')}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 active:scale-98 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-emerald-200"
              >
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span>Volver a confirmar asistencia</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Consultorio Odontológico • Confirmación segura y directa</span>
        </div>
      </div>
    </div>
  );
};
