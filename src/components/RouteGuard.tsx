import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PendingApproval from '../pages/PendingApproval';
import { normalizeRole } from '../constants/roles';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, userData, loading: authLoading } = useAuth();
  const location = useLocation();

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

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

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

  const status = String(userData.status || '').toLowerCase();
  const role = normalizeRole(userData.role);
  // Explicit negative states always win, including for administrators.
  if (['rejected', 'suspended', 'disabled', 'blocked'].includes(status)) {
    return <PendingApproval />;
  }

  // Only an explicitly approved/active profile may enter. Preserve the
  // narrowly scoped legacy SuperAdmin-pending migration exception; missing,
  // unknown, or any other non-approved status must fail closed.
  const legacySuperAdminPending = status === 'pending' && role === 'superadmin';
  if (status !== 'approved' && status !== 'active' && !legacySuperAdminPending) {
    return <PendingApproval />;
  }

  return <>{children}</>;
}
