import React, { useState } from 'react';
import { KeyRound, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface ResetPasswordViewProps {
  token: string;
}

// Pantalla a la que lleva el enlace del mail de «¿Olvidaste tu contraseña?».
export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ token }) => {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const goToLogin = () => {
    window.location.href = window.location.pathname;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.trim().length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (password !== repeat) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || 'No se pudo cambiar la contraseña.');
      else setDone(true);
    } catch {
      setError('No se pudo conectar con el servidor. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Contraseña nueva</h2>
          <p className="text-xs text-slate-500 font-medium">
            Es la contraseña de todo el consultorio: avisale al resto del equipo.
          </p>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Listo, la contraseña se cambió. Ya podés ingresar con la nueva.</span>
            </div>
            <button
              type="button"
              onClick={goToLogin}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm cursor-pointer"
            >
              Ir a ingresar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700">Contraseña nueva (12 caracteres o más)</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700">Repetila</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="password" required autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={inputClass} />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
            <button type="button" onClick={goToLogin} className="w-full text-xs font-semibold text-[#2E7D5E] hover:underline cursor-pointer">
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
