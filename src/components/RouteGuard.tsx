import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RouteGuardProps { children: React.ReactNode; }

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, userData, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center p-6">Verificando credenciales...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!userData) return <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center p-6">Cargando perfil de usuario...</div>;

  const status = String(userData.status ?? '').trim().toLowerCase();
  const role = String(userData.role ?? '').trim().toLowerCase();
  if (['blocked', 'rejected', 'suspended'].includes(status)) {
    return <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-6"><div className="max-w-md text-center"><h1 className="text-xl font-bold">Acceso denegado</h1><p className="mt-2">Tu cuenta está bloqueada o fue rechazada. Contacta a un administrador.</p></div></div>;
  }

  // Keep existing active privileged accounts compatible; non-privileged roles need explicit approval.
  const legacyPrivileged = ['superadmin', 'admin', 'owner'].includes(role) && status === 'active';
  if (status !== 'approved' && !legacyPrivileged) {
    return <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-6"><div className="max-w-md text-center"><h1 className="text-xl font-bold">Cuenta pendiente de aprobación</h1><p className="mt-2">Un administrador debe aprobar tu acceso al CRM.</p></div></div>;
  }
  if (!role || role === 'none') return <Navigate to="/login" replace />;
  return <>{children}</>;
}
