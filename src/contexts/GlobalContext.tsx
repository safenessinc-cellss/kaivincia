import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
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
  clients: [],
  users: [],
  tasks: [],
  notifications: [],
  authLoading: true,
  currentUser: null
});

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    let unsubClients: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;
    let unsubTasks: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (unsubClients) unsubClients();
      if (unsubUsers) unsubUsers();
      if (unsubTasks) unsubTasks();

      if (user) {
        unsubClients = onSnapshot(collection(db, 'clients'), snapshot => {
          setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, error => {
          if (auth.currentUser) handleFirestoreError(error, OperationType.GET, 'clients');
        });

        unsubUsers = onSnapshot(collection(db, 'users'), snapshot => {
          setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, error => {
          if (auth.currentUser) handleFirestoreError(error, OperationType.GET, 'users');
        });

        unsubTasks = onSnapshot(collection(db, 'tasks'), snapshot => {
          setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, error => {
          if (auth.currentUser) handleFirestoreError(error, OperationType.GET, 'tasks');
        });
      } else {
        setClients([]);
        setUsers([]);
        setTasks([]);
      }
    });

    return () => {
      if (unsubClients) unsubClients();
      if (unsubUsers) unsubUsers();
      if (unsubTasks) unsubTasks();
      unsubscribeAuth();
    };
  }, []);

  return (
    <GlobalContext.Provider value={{ clients, users, tasks, notifications, authLoading, currentUser }}>
      {children}
    </GlobalContext.Provider>
  );
};
