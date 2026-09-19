import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInAnonymously, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  role: string;
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
  const [userData, setUserData] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('kaivincia_user_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const fetchProfile = async (currentUser: User) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserData(data);
        localStorage.setItem('kaivincia_user_data', JSON.stringify(data));
      } else {
        // Fallback default profile
        let defaultRole = 'tlmk';
        const email = currentUser.email || '';
        if (email === 'safeness.c.a@gmail.com' || email === 'deuwyrobert@gmail.com') {
          defaultRole = 'superadmin';
        }

        const newProfile: UserProfile = {
          uid: currentUser.uid,
          name: currentUser.displayName || email.split('@')[0] || 'Operador Kaivincia',
          email: currentUser.email || null,
          role: defaultRole,
          status: 'active',
          avatarUrl: currentUser.photoURL || '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        await setDoc(userRef, newProfile, { merge: true }).catch(console.warn);
        setUserData(newProfile);
        localStorage.setItem('kaivincia_user_data', JSON.stringify(newProfile));
      }
    } catch (err) {
      console.warn('Could not fetch/create user profile in Firestore:', err);
    }
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (currentUser) {
        await fetchProfile(currentUser);

        // Realtime subscription to user's profile
        try {
          unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              setUserData(data);
              localStorage.setItem('kaivincia_user_data', JSON.stringify(data));
            }
          }, (err) => {
            console.warn('Profile sync snapshot handled:', err?.message);
          });
        } catch {
          // Ignore
        }

        setLoading(false);
      } else {
        // Check if there is an operator session in local storage that should auto-authenticate anonymously
        const hasOperatorSession = localStorage.getItem('kaivincia_operator_session');
        const isGuest = localStorage.getItem('kaivincia_guest') === 'true';

        if (hasOperatorSession || isGuest) {
          try {
            const cred = await signInAnonymously(auth);
            if (cred.user) {
              // The onAuthStateChanged listener will fire again with cred.user
              return;
            }
          } catch (anonErr) {
            console.warn('Anonymous fallback auth failed:', anonErr);
          }
        }

        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('kaivincia_active_user');
      localStorage.removeItem('kaivincia_user_data');
      localStorage.removeItem('kaivincia_operator_session');
      localStorage.removeItem('kaivincia_guest');
      await fbSignOut(auth);
      setUser(null);
      setUserData(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, userData, signOut: handleSignOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
