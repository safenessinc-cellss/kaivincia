import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface GlobalContextType {
  clients: any[];
  users: any[];
  tasks: any[];
  notifications: any[];
  authLoading: boolean;
  currentUser: any;
}
const GlobalContext = createContext<GlobalContextType>({
  clients: [], users: [], tasks: [], notifications: [], authLoading: true, currentUser: null
});
export const useGlobalContext = () => useContext(GlobalContext);

const ADMIN_ROLES = new Set(['superadmin', 'admin', 'ceo', 'gestor']);

export const GlobalProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications] = useState<any[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let unsubClients: Array<() => void> = [];
    let unsubUsers: Array<() => void> = [];
    let unsubTasks: (() => void) | null = null;
    let authGeneration = 0;

    const unsubscribeAuth = onAuthStateChanged(auth, async user => {
      const generation = ++authGeneration;
      unsubClients.forEach(unsub => unsub()); unsubClients = [];
      unsubUsers.forEach(unsub => unsub()); unsubUsers = [];
      if (unsubTasks) unsubTasks(); unsubTasks = null;
      setClients([]); setUsers([]); setTasks([]);
      setCurrentUser(user); setAuthLoading(false);
      if (!user) return;

      try {
        const ownUserRef = doc(db, 'users', user.uid);
        const ownUserSnapshot = await getDoc(ownUserRef);
        if (generation !== authGeneration) return;
        const ownUser = ownUserSnapshot.exists() ? { id: ownUserSnapshot.id, ...ownUserSnapshot.data() } : null;
        const canReadDirectory = ADMIN_ROLES.has(String(ownUser?.role || '').toLowerCase());
        const userQuery = canReadDirectory
          ? collection(db, 'users')
          : query(collection(db, 'users'), where('__name__', '==', user.uid));
        unsubUsers.push(onSnapshot(userQuery, snapshot => {
          setUsers(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
        }, error => {
          if (auth.currentUser?.uid === user.uid) handleFirestoreError(error, OperationType.GET, 'users');
        }));

        const clientSnapshots = new Map<string, any>();
        const publishClients = () => setClients(Array.from(clientSnapshots.values()));
        const clientQueries = canReadDirectory
          ? [collection(db, 'clients')]
          : [
              query(collection(db, 'clients'), where('createdBy', '==', user.uid)),
              query(collection(db, 'clients'), where('assignedTo', '==', user.uid))
            ];
        clientQueries.forEach(clientQuery => {
          unsubClients.push(onSnapshot(clientQuery, snapshot => {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'removed') clientSnapshots.delete(change.doc.id);
              else clientSnapshots.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
            });
            publishClients();
          }, error => {
            if (auth.currentUser?.uid === user.uid) handleFirestoreError(error, OperationType.GET, 'clients');
          }));
        });

        // Task ownership is not consistently modelled in legacy records yet.
        // Keep the existing authenticated task scope until records are migrated.
        unsubTasks = onSnapshot(collection(db, 'tasks'), snapshot => {
          setTasks(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
        }, error => {
          if (auth.currentUser?.uid === user.uid) handleFirestoreError(error, OperationType.GET, 'tasks');
        });
      } catch (error) {
        if (generation === authGeneration) {
          console.error('Unable to initialize scoped CRM data:', error);
          setClients([]); setUsers([]); setTasks([]);
        }
      }
    });

    return () => {
      authGeneration++;
      unsubClients.forEach(unsub => unsub());
      unsubUsers.forEach(unsub => unsub());
      if (unsubTasks) unsubTasks();
      unsubscribeAuth();
    };
  }, []);

  return <GlobalContext.Provider value={{ clients, users, tasks, notifications, authLoading, currentUser }}>{children}</GlobalContext.Provider>;
};
