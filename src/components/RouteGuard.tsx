import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PendingApproval from '../pages/PendingApproval';

interface RouteGuardProps {
  children: React.ReactNode;
}

const PRIVILEGED_ROLES = ['admin', 'superadmin', 'ceo', 'gestor', 'owner', 'supervisor'];

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, userData, loading: authLoading } = useAuth();
  const location = useLocation();

  // 1. Auth resolviendo
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-mono text-gray-700 tracking-widest uppercase">
          Verificando credenciales de acceso...
        </p>
      </div>
    );
  }

  // 2. Sin autenticar
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Auth OK pero aún sin doc de perfil (bootstrap en curso)
  if (userData === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-mono text-gray-700 tracking-widest uppercase">
          Cargando perfil...
        </p>
      </div>
    );
  }

  // 4. Verificar aprobación.
  //    Regla: si status está explícitamente en pending/rejected/suspended → bloquear.
  //    Si status es undefined pero el rol es privilegiado → tratar como aprobado
  //    (compatibilidad con admins existentes que no tienen el campo).
  const status = String((userData as any)?.status || '').toLowerCase();
  const role = String((userData as any)?.role || '').toLowerCase();
  const isPrivileged = PRIVILEGED_ROLES.includes(role);

  // A trusted SuperAdmin account must not be locked out just because its legacy
  // profile says "pending" or "active". Explicit suspension/rejection still blocks it.
  if (status === 'rejected' || status === 'suspended') {
    return <PendingApproval />;
  }

  if (status === 'pending' && role !== 'superadmin') {
    return <PendingApproval />;
  }

  if (status !== 'approved' && status !== 'active' && !isPrivileged) {
    return <PendingApproval />;
  }

  return <>{children}</>;
}
