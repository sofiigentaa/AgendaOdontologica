import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Calendar, Clock, User, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatDateWithDayName } from '../utils/time';

interface PatientConfirmationViewProps {
  appointmentId: string;
  /** Action suggested by the link. It is only highlighted, never executed on load. */
  initialAction?: 'confirm' | 'cancel';
}

type ApptState = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'past';

interface PublicAppointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  dentist: string;
  state: ApptState;
  canConfirm: boolean;
  canCancel: boolean;
  message: string | null;
}

async function readJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const PatientConfirmationView: React.FC<PatientConfirmationViewProps> = ({
  appointmentId,
  initialAction = 'confirm',
}) => {
  const [appointment, setAppointment] = useState<PublicAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Error que impide mostrar el turno (link inválido, servidor caído).
  const [loadError, setLoadError] = useState<string | null>(null);
  // Error de la última acción (el turno se sigue mostrando).
  const [actionError, setActionError] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<'confirm' | 'cancel' | null>(null);
  const [askCancel, setAskCancel] = useState(initialAction === 'cancel');

  useEffect(() => {
    let isMounted = true;
    // Abrir el link SOLO muestra los datos. Antes la acción de la URL se
    // ejecutaba al cargar: un antivirus o una vista previa de WhatsApp que
    // abriera el link podía cancelar el turno sin que el paciente lo pidiera.
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/appointment/${encodeURIComponent(appointmentId)}`);
        const data = await readJson(res);
        if (!isMounted) return;
        if (res.status === 404) {
          setLoadError('El link no es válido o el turno ya no existe. Revisá que lo hayas copiado completo o comunicate con el consultorio.');
        } else if (!res.ok || !data) {
          setLoadError('No pudimos cargar tu turno en este momento. Probá de nuevo en unos minutos.');
        } else {
          setAppointment(data);
        }
      } catch {
        if (isMounted) setLoadError('No hay conexión con el consultorio. Revisá tu internet y volvé a abrir el link.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [appointmentId]);

  const respond = async (action: 'confirm' | 'cancel') => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/public/appointment/${encodeURIComponent(appointmentId)}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await readJson(res);
      // El servidor devuelve el estado actualizado del turno también en los 409.
      if (data && data.state) setAppointment(data);
      if (!res.ok) {
        setActionError(data?.error || 'No se pudo registrar tu respuesta. Probá de nuevo o comunicate con el consultorio.');
        return;
      }
      setJustDone(action);
      setAskCancel(false);
    } catch {
      setActionError('No hay conexión con el consultorio. Tu respuesta no se registró; probá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
          <p className="text-slate-600 font-bold text-sm">Cargando tu turno...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">No encontramos el turno</h2>
          <p className="text-slate-600 text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  const state = appointment.state;
  const dentistDisplayName =
    appointment.dentist === 'Ambas'
      ? 'las Dras. Marie y Yani'
      : appointment.dentist === 'Marie' || appointment.dentist === 'Yani'
      ? `la Dra. ${appointment.dentist}`
      : 'el Consultorio Odontológico';

  const headerClass =
    state === 'confirmed'
      ? 'bg-linear-to-r from-emerald-600 to-teal-600'
      : state === 'cancelled'
      ? 'bg-linear-to-r from-slate-700 to-slate-800'
      : state === 'pending'
      ? 'bg-linear-to-r from-teal-600 to-cyan-700'
      : 'bg-linear-to-r from-slate-500 to-slate-600';

  const title =
    state === 'confirmed'
      ? justDone === 'confirm' ? '¡Turno Confirmado!' : 'Turno confirmado'
      : state === 'cancelled'
      ? 'Turno Cancelado'
      : state === 'completed'
      ? 'Turno atendido'
      : state === 'past'
      ? 'Este turno ya pasó'
      : 'Gestión de tu Turno';

  const subtitle =
    state === 'confirmed'
      ? 'Tu asistencia quedó registrada en la agenda'
      : state === 'cancelled'
      ? 'El horario quedó liberado en el consultorio'
      : state === 'pending'
      ? '¿Vas a poder asistir? Elegí una opción'
      : appointment.message || '';

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-50 via-teal-50/40 to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`p-6 text-white text-center transition-colors duration-300 ${headerClass}`}>
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
            {state === 'confirmed' || state === 'completed' ? (
              <CheckCircle2 className="w-8 h-8 text-white" />
            ) : state === 'cancelled' ? (
              <XCircle className="w-8 h-8 text-rose-300" />
            ) : (
              <Calendar className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium">{subtitle}</p>}
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Paciente</span>
                <span className="text-sm font-bold text-slate-800 break-words">{appointment.patientName || 'Paciente'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fecha</span>
                  <span className="text-xs font-bold text-slate-800">{formatDateWithDayName(appointment.date)}</span>
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

          {actionError && (
            <div role="alert" className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs font-semibold text-center">
              {actionError}
            </div>
          )}

          {justDone === 'confirm' && state === 'confirmed' && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs text-emerald-700 leading-relaxed">
              Muchas gracias por avisarnos. Tu lugar está reservado. Te recomendamos llegar 5 minutos antes.
            </div>
          )}

          {state === 'cancelled' && (
            <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 text-center text-xs text-rose-700 leading-relaxed">
              {justDone === 'cancel'
                ? 'Listo, el turno quedó cancelado. Si querés reprogramarlo, comunicate con el consultorio.'
                : appointment.message || 'Este turno está cancelado. Si querés reprogramarlo, comunicate con el consultorio.'}
            </div>
          )}

          {(state === 'completed' || state === 'past') && appointment.message && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-600 leading-relaxed">
              {appointment.message}
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2.5">
            {appointment.canConfirm && !askCancel && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => respond('confirm')}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isSubmitting ? 'Enviando...' : 'Confirmar mi asistencia'}</span>
              </button>
            )}

            {appointment.canCancel && !askCancel && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setAskCancel(true)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 active:scale-98 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>No voy a poder asistir</span>
              </button>
            )}

            {appointment.canCancel && askCancel && (
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-3 text-center">
                <p className="text-sm font-bold text-rose-900">¿Seguro que querés cancelar el turno?</p>
                <p className="text-xs text-rose-800">El horario se libera para otro paciente. Esta acción no se puede deshacer desde el link.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setAskCancel(false)}
                    className="flex-1 py-2.5 px-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer disabled:opacity-50"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => respond('cancel')}
                    className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Sí, cancelar turno'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Consultorio Odontológico Marie &amp; Yani</span>
        </div>
      </div>
    </div>
  );
};
