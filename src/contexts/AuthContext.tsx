import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as fbSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type UserRole = 'superadmin' | 'admin' | 'supervisor' | 'agente' | 'tlmk' | 'none';

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  role: UserRole | string;
  status: string;
  avatarUrl?: string;
  company?: string;
  department?: string;
  createdAt?: string;
  lastLogin?: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  userData: UserProfile | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userData: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserProfile | null>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (unsubProfile) { unsubProfile(); unsubProfile = null; }

      if (currentUser) {
        // Si el doc no existe, pedimos al backend que lo cree (role='none', status='pending')
        try {
          const token = await currentUser.getIdToken();
          await fetch('/api/auth/bootstrap-user', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (e) {
          console.warn('bootstrap-user failed:', e);
        }

        unsubProfile = onSnapshot(
          doc(db, 'users', currentUser.uid),
          (snap) => {
            setUserData(snap.exists() ? (snap.data() as UserProfile) : null);
            setLoading(false);
          },
          (err) => {
            console.warn('Profile sync handled:', err?.message);
            setLoading(false);
          }
        );
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => { unsubscribe(); if (unsubProfile) unsubProfile(); };
  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem('kaivincia_active_user');
    localStorage.removeItem('kaivincia_operator_session');
    localStorage.removeItem('kaivincia_guest');
    await fbSignOut(auth);
    setUser(null);
    setUserData(null);
  };

  const refreshProfile = async () => { /* no-op: onSnapshot ya es tiempo real */ };

  return (
    <AuthContext.Provider value={{ user, loading, userData, signOut: handleSignOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
