import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithRedirect,
} from 'firebase/auth';
import { auth } from '../firebase';
import { LOGO_FULL } from '../constants/images';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    getRedirectResult(auth)
      .then((result) => {
        if (active && result?.user) navigate('/crm/dashboard', { replace: true });
      })
      .catch((err: any) => {
        if (!active) return;
        const code = String(err?.code || '');
        setError(code === 'auth/unauthorized-domain'
          ? 'Este dominio no está autorizado en Firebase Authentication.'
          : err?.message || 'No se pudo completar el inicio de sesión de Google.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      // Redirect avoids popup window.close/COOP issues and is more reliable
      // in browsers with strict cross-origin opener policies.
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión con Google.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07090E] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#00F0FF]/10 via-transparent to-transparent pointer-events-none" />
      <section className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <img src={LOGO_FULL} alt="Kaivincia Corp" className="h-16 object-contain" referrerPolicy="no-referrer" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-black text-white tracking-tight">
          Ingreso Kaivincia Corp
        </h1>
        <p className="text-center text-xs text-cyan-400 uppercase tracking-widest mt-2">
          Plataforma segura de operaciones
        </p>
      </section>

      <section className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0D121D]/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-800 space-y-5">
          {error && (
            <div role="alert" className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-slate-700 rounded-2xl shadow-sm text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-60 transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5 mr-3" />
            {loading ? 'Conectando con Google…' : 'Continuar con Google'}
          </button>
          <div className="flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>Acceso autenticado. Los usuarios nuevos requieren aprobación del administrador; no se permite acceso operativo mediante sesiones locales.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
