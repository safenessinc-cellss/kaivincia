import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { LOGO_FULL } from '../constants/images';
import { PhoneCall, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        navigate('/crm/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectOperatorLogin = async (agentName: string, role: string = 'tlmk') => {
    try {
      setLoading(true);
      setError('');

      let currentUser = auth.currentUser;
      if (!currentUser) {
        const cred = await signInAnonymously(auth);
        currentUser = cred.user;
      }

      const operatorUid = currentUser?.uid || `op_${Date.now()}`;
      const operator = {
        uid: operatorUid,
        name: agentName,
        email: `${agentName.toLowerCase().replace(/\s+/g, '.')}@kaivincia.com`,
        role: role,
        status: 'active',
        avatarUrl: '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Persist to localStorage
      localStorage.setItem('kaivincia_active_user', JSON.stringify({ uid: operator.uid, email: operator.email, displayName: operator.name }));
      localStorage.setItem('kaivincia_user_data', JSON.stringify(operator));
      localStorage.setItem('kaivincia_operator_session', JSON.stringify(operator));
      localStorage.removeItem('kaivincia_guest');

      // Also upsert the user record in Firestore if authenticated
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid), operator, { merge: true });
        } catch (dbErr) {
          console.warn("Direct operator Firestore user doc creation skipped:", dbErr);
        }
      }

      navigate('/crm/dashboard');
    } catch (authErr: any) {
      console.warn("Direct operator sign-in error:", authErr);
      setError(authErr?.message || 'Error al acceder como operador');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#07090E] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#00F0FF]/10 via-transparent to-transparent pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <img 
            src={LOGO_FULL} 
            alt="Kaivincia Corp Logo" 
            className="h-16 object-contain drop-shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-white italic tracking-tighter uppercase">
          Ingreso Kaivincia Corp
        </h2>
        <p className="text-center text-xs font-mono text-[#00F0FF] uppercase tracking-widest mt-1">
          Plataforma de Operaciones & Telemarketing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0D121D]/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-800 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-mono">
              {error}
            </div>
          )}
          
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-slate-700 rounded-2xl shadow-sm text-xs font-black uppercase tracking-widest text-white bg-slate-800/80 hover:bg-slate-700 transition-all cursor-pointer"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-4 w-4 mr-3" />
            Continuar con Google
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[9px] font-black uppercase tracking-widest text-slate-500">O Acceso Operativo Directo</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Quick TLMK Operator login */}
          <div className="space-y-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Nombre de Agente TLMK / Ventas
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nombre de Agente / Operador"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF] transition-all"
                />
              </div>
            </div>

            <button
              onClick={() => handleDirectOperatorLogin(customName || 'Agente Operativo', 'tlmk')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#00F0FF] to-[#0891B2] hover:opacity-95 text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.25)] cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" /> Logear con{customName ? ` ${customName}` : ''}
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleDirectOperatorLogin('Agente TLMK', 'tlmk')}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#00F0FF]" /> Agente (TLMK)
              </button>
              <button
                onClick={() => handleDirectOperatorLogin('Supervisor Comercial', 'superadmin')}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SuperAdmin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

