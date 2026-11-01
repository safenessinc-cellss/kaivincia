import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, documentId, getDoc, onSnapshot, query, where } from 'firebase/firestore';
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
    let unsubTasks: Array<() => void> = [];
    let authGeneration = 0;

    const unsubscribeAuth = onAuthStateChanged(auth, async user => {
      const generation = ++authGeneration;
      unsubClients.forEach(unsub => unsub()); unsubClients = [];
      unsubUsers.forEach(unsub => unsub()); unsubUsers = [];
      unsubTasks.forEach(unsub => unsub()); unsubTasks = [];
      setClients([]); setUsers([]); setTasks([]);
      setCurrentUser(user); setAuthLoading(false);
      if (!user) return;

      try {
        const ownUserRef = doc(db, 'users', user.uid);
        const ownUserSnapshot = await getDoc(ownUserRef);
        if (generation !== authGeneration) return;
        const ownUser: (Record<string, any> & { id: string }) | null = ownUserSnapshot.exists() ? { id: ownUserSnapshot.id, ...ownUserSnapshot.data() } : null;
        const canReadDirectory = ADMIN_ROLES.has(String(ownUser?.role || '').toLowerCase());
        const userQuery = canReadDirectory
          ? collection(db, 'users')
          : query(collection(db, 'users'), where(documentId(), '==', user.uid));
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

        const taskSnapshots = new Map<string, any>();
        const publishTasks = () => setTasks(Array.from(taskSnapshots.values()));
        const taskQueries = canReadDirectory
          ? [collection(db, 'tasks')]
          : [
              query(collection(db, 'tasks'), where('createdBy', '==', user.uid)),
              query(collection(db, 'tasks'), where('assignedTo', '==', user.uid))
            ];
        taskQueries.forEach(taskQuery => {
          unsubTasks.push(onSnapshot(taskQuery, snapshot => {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'removed') taskSnapshots.delete(change.doc.id);
              else taskSnapshots.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
            });
            publishTasks();
          }, error => {
            if (auth.currentUser?.uid === user.uid) handleFirestoreError(error, OperationType.GET, 'tasks');
          }));
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
      unsubTasks.forEach(unsub => unsub());
      unsubscribeAuth();
    };
  }, []);

  return <GlobalContext.Provider value={{ clients, users, tasks, notifications, authLoading, currentUser }}>{children}</GlobalContext.Provider>;
};
