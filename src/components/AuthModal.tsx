import React, { useEffect, useState } from 'react';
import { Lock, Mail, KeyRound, AlertCircle, Shield, CheckCircle2, UserCheck } from 'lucide-react';

interface AuthModalProps {
  onLoginSuccess: (userEmail: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot' | 'register'>('login');
  const [resetAvailable, setResetAvailable] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/reset-available')
      .then((r) => r.json())
      .then((d) => setResetAvailable(Boolean(d?.available)))
      .catch(() => setResetAvailable(false));
  }, []);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || 'No se pudo enviar el email.');
      else setInfo(data.message || 'Te mandamos un enlace a tu email.');
    } catch {
      setError('No se pudo conectar con el servidor. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: 'login' | 'forgot' | 'register') => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || 'No se pudo completar el registro.');
      else setInfo(data.message || 'Registro guardado. Ya podés ingresar con la nueva contraseña.');
    } catch {
      setError('No se pudo conectar con el servidor. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoading(false);
        setError(data.error || 'Email o contraseña incorrectos');
        return;
      }
      localStorage.setItem('auth_session_token', 'active');
      localStorage.setItem('auth_user_email', data.email || cleanEmail);
      setLoading(false);
      onLoginSuccess(data.email || cleanEmail);
    } catch {
      setLoading(false);
      setError('No se pudo conectar con el servidor. Probá de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Agenda Odontológica
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'forgot'
              ? 'Escribí tu email y te mandamos un enlace para elegir una contraseña nueva'
              : mode === 'register'
                ? 'Registrá al odontólogo del consultorio'
                : 'Acceso exclusivo para el equipo del consultorio'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {mode === 'forgot' ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700">Tu email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  data-testid="forgot-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="odontologo@tuclinica.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviarme el enlace'}
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full text-xs font-semibold text-[#2E7D5E] hover:underline cursor-pointer"
            >
              Volver a ingresar
            </button>
          </form>
        ) : mode === 'register' ? (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-700">Nombre del odontólogo</label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                data-testid="register-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="María Pérez"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-700">Email del consultorio</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                data-testid="register-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="odontologo@tuclinica.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-700">Contraseña (12 caracteres o más)</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={12}
                data-testid="register-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            data-testid="register-submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registrando...
              </span>
            ) : (
              <span>Registrar odontólogo</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="w-full text-xs font-semibold text-[#2E7D5E] hover:underline cursor-pointer"
          >
            Volver a ingresar
          </button>
        </form>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-700">Email del consultorio</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                data-testid="auth-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="odontologo@tuclinica.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-700">Contraseña</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                data-testid="auth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            data-testid="auth-submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Ingresando...
              </span>
            ) : (
              <span>Ingresar</span>
            )}
          </button>
          <button
            type="button"
            data-testid="auth-forgot"
            onClick={() => switchMode('forgot')}
            className="w-full text-xs font-semibold text-[#2E7D5E] hover:underline cursor-pointer"
          >
            ¿Olvidaste tu contraseña?
          </button>
          <button
            type="button"
            data-testid="auth-register"
            onClick={() => switchMode('register')}
            className="w-full text-xs font-semibold text-[#2E7D5E] hover:underline cursor-pointer"
          >
            ¿Registrarse como odontólogo?
          </button>
        </form>
        )}

        {/* Security badges */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Acceso restringido al equipo del consultorio</span>
        </div>
      </div>
    </div>
  );
};
