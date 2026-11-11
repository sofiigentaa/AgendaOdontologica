import React, { useState } from 'react';
import { Lock, Mail, KeyRound, AlertCircle, Shield, CheckCircle2, UserCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { createBackendSession } from '../utils/authSession';

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
  const [info, setInfo] = useState<string | null>(null);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (!isSupabaseConfigured) throw new Error('La autenticación todavía no está configurada.');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      setInfo('Si el email pertenece a una cuenta habilitada, vas a recibir un enlace para cambiar tu contraseña.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(
        /email rate limit exceeded/i.test(message)
          ? 'Supabase alcanzó su límite de envío de emails. Con el proveedor integrado permite hasta 2 por hora. Esperá a que se restablezca o configurá un SMTP propio en Supabase → Authentication → SMTP Settings.'
          : message || 'No se pudo enviar el email.'
      );
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
      if (!isSupabaseConfigured) throw new Error('La autenticación todavía no está configurada.');
      const cleanEmail = email.trim().toLowerCase();
      const checkResponse = await fetch('/api/auth/registration-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const checkData = await checkResponse.json().catch(() => ({}));
      if (!checkResponse.ok) throw new Error(checkData.error || 'No se pudo autorizar el registro.');

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      if (signUpError) throw signUpError;
      if (data.session?.access_token) {
        try {
          const userEmail = await createBackendSession(data.session.access_token);
          onLoginSuccess(userEmail);
        } catch (err) {
          await supabase.auth.signOut();
          throw err;
        }
      } else {
        setInfo('Te enviamos un enlace de confirmación. Confirmá tu email para ingresar a la agenda.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    try {
      if (!isSupabaseConfigured) throw new Error('La autenticación todavía no está configurada.');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (signInError) throw signInError;
      if (!data.session?.access_token) throw new Error('Confirmá tu email antes de ingresar.');
      try {
        const userEmail = await createBackendSession(data.session.access_token);
        onLoginSuccess(userEmail);
      } catch (err) {
        await supabase.auth.signOut();
        throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar con el servidor. Probá de nuevo.');
    } finally {
      setLoading(false);
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

        {!isSupabaseConfigured && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            Falta configurar Supabase Auth para habilitar las cuentas individuales.
          </div>
        )}

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
                <input aria-label="Tu email"
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
              disabled={loading || !isSupabaseConfigured}
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
              <input aria-label="Nombre del odontólogo"
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
              <input aria-label="Email del consultorio"
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
              <input aria-label="Contraseña (12 caracteres o más)"
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
            disabled={loading || !isSupabaseConfigured}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registrando...
              </span>
            ) : (
              <span>Enviar verificación</span>
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
              <input aria-label="Email del consultorio"
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
              <input aria-label="Contraseña"
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
            disabled={loading || !isSupabaseConfigured}
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
