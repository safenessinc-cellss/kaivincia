import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * RouteGuard
 * Ensures Firebase auth has resolved before mounting any protected CRM component.
 * Blocks unauthenticated access and avoids triggering Firestore calls with null auth credentials.
 */
export default function RouteGuard({ children }: RouteGuardProps) {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [authLoading, setAuthLoading] = useState(!auth.currentUser);
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-[#00F0FF] tracking-widest uppercase">
            Verificando credenciales de acceso...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
