import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Clock, LogOut, ShieldCheck } from 'lucide-react';

export default function PendingApproval() {
  const { userData, signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] px-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Clock className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
        <h1 className="text-xl font-black text-white text-center mb-2">Cuenta pendiente de aprobación</h1>
        <p className="text-sm text-slate-400 text-center mb-6">
          Tu cuenta <span className="text-cyan-300 font-mono">{user?.email}</span> ha sido creada correctamente,
          pero aún no ha sido aprobada por un administrador.
        </p>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Un administrador revisará tu solicitud.</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Estado actual: <span className="text-amber-300 font-bold uppercase">{userData?.status || 'pendiente'}</span></span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 text-center mb-4">
          Si necesitas acceso urgente, contacta a tu supervisor o al equipo de soporte.
        </p>
        <button
          onClick={() => signOut()}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
