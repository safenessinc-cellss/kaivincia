import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Clock, LogOut, ShieldAlert, Mail } from 'lucide-react';

export default function PendingApproval() {
  const { userData, signOut, user } = useAuth();
  const status = (userData as any)?.status || 'pendiente';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
          Cuenta pendiente de aprobación
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Tu cuenta <span className="text-blue-700 font-mono">{user?.email}</span> ha sido creada correctamente,
          pero aún no ha sido autorizada por un administrador.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <span><strong>Acceso restringido:</strong> nadie entra al dashboard sin aprobación previa del administrador.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <span><strong>¿Qué hacer?</strong> Contacta al administrador de la plataforma para que libere tu acceso.</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 border-t border-gray-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Estado actual: <span className="text-amber-700 font-bold uppercase">{status}</span></span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 text-center mb-4">
          Si necesitas acceso urgente, escribe a <span className="font-mono text-gray-700">safeness.c.a@gmail.com</span>
        </p>

        <button
          onClick={() => signOut()}
          className="w-full px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
